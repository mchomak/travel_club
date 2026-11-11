import binascii
import hashlib
import hmac
import ipaddress
import json
import re
from datetime import UTC, datetime, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy import delete, func, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.leads.config import get_lead_settings
from app.leads.db import get_website_session
from app.leads.models import Lead, LeadIdempotency, LeadNotification, LeadRateEvent
from app.leads.schemas import LeadCreate

router = APIRouter(prefix="/api/leads", tags=["leads"])
DB = Annotated[Session, Depends(get_website_session)]
MAX_BODY_BYTES = 16 * 1024
IDEMPOTENCY_TTL = timedelta(hours=24)
RECEIPT_TTL = timedelta(minutes=30)
RATE_MINUTE = 3
RATE_DAY = 20
IDEMPOTENCY_KEY = re.compile(r"^[0-9a-fA-F-]{36}$")


def public_error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse({"code": code, "message": message}, status_code=status)


VALIDATION_FIELD_MESSAGES = {
    "product_id": "Выберите доступный формат путешествия.",
    "contact_method": "Выберите способ связи.",
    "contact_value": "Проверьте контактные данные.",
    "name": "Проверьте имя или оставьте поле пустым.",
    "message": "Проверьте комментарий или оставьте поле пустым.",
    "consent": "Подтвердите согласие на обработку персональных данных.",
    "_form": "Проверьте данные формы и попробуйте ещё раз.",
}


def _digest(value: str, secret: str) -> bytes:
    return hmac.new(secret.encode(), value.encode(), hashlib.sha256).digest()


def _request_fingerprint(canonical_payload: bytes, secret: str) -> bytes:
    """Fingerprint sensitive request data without exposing a dictionary oracle."""
    key = hmac.new(
        secret.encode(), b"travel-club:lead-request-fingerprint:v1", hashlib.sha256
    ).digest()
    return hmac.new(key, canonical_payload, hashlib.sha256).digest()


def _trusted_client_ip(request: Request) -> str:
    peer = request.client.host if request.client else "unknown"
    try:
        peer_ip = ipaddress.ip_address(peer)
    except ValueError:
        return peer
    trusted = []
    for cidr in get_lead_settings().website_trusted_proxy_cidrs.split(","):
        if cidr.strip():
            try:
                trusted.append(ipaddress.ip_network(cidr.strip(), strict=False))
            except ValueError:
                continue
    if not any(peer_ip in network for network in trusted):
        return peer
    forwarded = request.headers.get("x-forwarded-for", "")
    chain: list[ipaddress.IPv4Address | ipaddress.IPv6Address] = []
    for part in forwarded.split(","):
        try:
            chain.append(ipaddress.ip_address(part.strip()))
        except ValueError:
            return peer
    chain.append(peer_ip)
    while len(chain) > 1 and any(chain[-1] in network for network in trusted):
        chain.pop()
    return str(chain[-1])


async def _read_payload(request: Request) -> LeadCreate | JSONResponse:
    if (
        request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
        != "application/json"
    ):
        return public_error(415, "UNSUPPORTED_MEDIA_TYPE", "Отправьте заявку в формате JSON")
    raw_length = request.headers.get("content-length")
    if raw_length:
        try:
            if int(raw_length) > MAX_BODY_BYTES:
                return public_error(413, "REQUEST_TOO_LARGE", "Форма слишком большая")
        except ValueError:
            return public_error(400, "INVALID_REQUEST", "Не удалось прочитать форму")
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > MAX_BODY_BYTES:
            return public_error(413, "REQUEST_TOO_LARGE", "Форма слишком большая")
    try:
        return LeadCreate.model_validate_json(bytes(body))
    except ValidationError as exc:
        allowed = set(VALIDATION_FIELD_MESSAGES)
        fields = {
            str(error["loc"][0])
            for error in exc.errors()
            if error.get("loc") and str(error["loc"][0]) in allowed
        }
        if not fields:
            fields = {"_form"}
        return JSONResponse(
            {
                "code": "VALIDATION_ERROR",
                "message": "Проверьте поля формы и попробуйте ещё раз",
                "details": [
                    {"field": field, "message": VALIDATION_FIELD_MESSAGES[field]}
                    for field in sorted(fields)
                ],
            },
            status_code=422,
        )
    except (ValueError, UnicodeDecodeError):
        return JSONResponse(
            {
                "code": "VALIDATION_ERROR",
                "message": "Проверьте поля формы и попробуйте ещё раз",
                "details": [{"field": "_form", "message": VALIDATION_FIELD_MESSAGES["_form"]}],
            },
            status_code=422,
        )


def _receipt_token(lead_id: UUID, expires_at: datetime, secret: str) -> str:
    import base64

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    payload = f"{lead_id}.{int(expires_at.timestamp())}".encode()
    signature = hmac.new(secret.encode(), payload, hashlib.sha256).digest()
    payload_part = base64.urlsafe_b64encode(payload).rstrip(b"=").decode()
    signature_part = base64.urlsafe_b64encode(signature).rstrip(b"=").decode()
    return f"{payload_part}.{signature_part}"


def _read_receipt_token(token: str, secret: str) -> tuple[UUID, datetime] | None:
    import base64

    try:
        payload_b64, signature_b64 = token.split(".", 1)
        payload = base64.urlsafe_b64decode(payload_b64 + "=" * (-len(payload_b64) % 4))
        signature = base64.urlsafe_b64decode(signature_b64 + "=" * (-len(signature_b64) % 4))
        expected = hmac.new(secret.encode(), payload, hashlib.sha256).digest()
        if not hmac.compare_digest(signature, expected):
            return None
        lead_id_text, expires_text = payload.decode().split(".", 1)
        expires_at = datetime.fromtimestamp(int(expires_text), UTC)
        if expires_at <= datetime.now(UTC):
            return None
        return UUID(lead_id_text), expires_at
    except (ValueError, UnicodeDecodeError, TypeError, OverflowError, OSError, binascii.Error):
        return None


def _advisory_lock(session: Session, digests: list[bytes]) -> None:
    if session.bind is None or session.bind.dialect.name != "postgresql":
        return
    keys = sorted(int.from_bytes(value[:8], "big", signed=True) for value in digests)
    for key in keys:
        session.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": key})


def _record_rate_attempt(session: Session, client_digest: bytes, now: datetime) -> bool:
    """Commit only permitted attempts; limited traffic cannot grow this table."""
    session.rollback()
    _advisory_lock(session, [client_digest])
    session.execute(delete(LeadRateEvent).where(LeadRateEvent.created_at < now - timedelta(days=1)))
    per_minute = (
        session.scalar(
            select(func.count(LeadRateEvent.id)).where(
                LeadRateEvent.ip_digest == client_digest,
                LeadRateEvent.created_at >= now - timedelta(minutes=1),
            )
        )
        or 0
    )
    per_day = (
        session.scalar(
            select(func.count(LeadRateEvent.id)).where(
                LeadRateEvent.ip_digest == client_digest,
                LeadRateEvent.created_at >= now - timedelta(days=1),
            )
        )
        or 0
    )
    if per_minute >= RATE_MINUTE or per_day >= RATE_DAY:
        session.rollback()
        return True
    session.add(LeadRateEvent(ip_digest=client_digest))
    session.flush()
    session.commit()
    return False


@router.post("")
async def create_lead(request: Request, session: DB):
    settings = get_lead_settings()
    origin = request.headers.get("origin")
    allowed_origins = settings.allowed_origins
    if not allowed_origins or origin not in allowed_origins:
        return public_error(403, "ORIGIN_REJECTED", "Обновите страницу и повторите отправку")

    raw_key = request.headers.get("idempotency-key", "")
    if not IDEMPOTENCY_KEY.fullmatch(raw_key):
        return public_error(400, "INVALID_REQUEST", "Обновите форму и попробуйте ещё раз")
    try:
        idempotency_key = str(UUID(raw_key))
    except ValueError:
        return public_error(400, "INVALID_REQUEST", "Обновите форму и попробуйте ещё раз")

    receipt_secret = settings.website_receipt_secret.get_secret_value()
    rate_secret = settings.website_rate_limit_secret.get_secret_value()
    if len(receipt_secret) < 32 or len(rate_secret) < 32:
        return public_error(503, "LEADS_UNAVAILABLE", "Форма временно недоступна")
    client_digest = _digest(_trusted_client_ip(request), rate_secret)
    now = datetime.now(UTC)
    try:
        rate_limited = _record_rate_attempt(session, client_digest, now)
    except SQLAlchemyError:
        try:
            session.rollback()
        except SQLAlchemyError:
            pass
        return public_error(503, "LEADS_UNAVAILABLE", "Форма временно недоступна")

    payload = await _read_payload(request)
    if isinstance(payload, JSONResponse):
        if rate_limited and payload.status_code not in {413, 415}:
            return public_error(429, "RATE_LIMITED", "Слишком много отправок. Попробуйте позже")
        return payload
    if payload.website_honeypot:
        if rate_limited:
            return public_error(429, "RATE_LIMITED", "Слишком много отправок. Попробуйте позже")
        return public_error(422, "VALIDATION_ERROR", "Проверьте поля формы и попробуйте ещё раз")

    fingerprint_excluded = {"website_honeypot"}
    if payload.telegram_details_consent_version is None:
        # Preserve the previous canonical form for old clients and retries.
        fingerprint_excluded.add("telegram_details_consent_version")
    canonical_request = payload.model_dump(exclude=fingerprint_excluded, mode="json")
    canonical_bytes = json.dumps(
        canonical_request, ensure_ascii=False, sort_keys=True, separators=(",", ":")
    ).encode()
    request_digest = _request_fingerprint(canonical_bytes, receipt_secret)
    legacy_request_digest = hashlib.sha256(canonical_bytes).digest()
    key_digest = _digest(idempotency_key, receipt_secret)
    expiry = now + IDEMPOTENCY_TTL

    try:
        session.rollback()
        _advisory_lock(session, [key_digest, client_digest])
        session.query(LeadIdempotency).filter(LeadIdempotency.expires_at <= now).delete(
            synchronize_session=False
        )
        existing = session.scalar(
            select(LeadIdempotency).where(LeadIdempotency.key_digest == key_digest)
        )
        if existing:
            lead = session.scalar(select(Lead).where(Lead.id == existing.lead_id))
            if not lead:
                session.delete(existing)
                session.flush()
            elif (
                existing.request_digest_version == 0
                and not hmac.compare_digest(existing.request_digest, legacy_request_digest)
            ) or (
                existing.request_digest_version == 1
                and not hmac.compare_digest(existing.request_digest, request_digest)
            ) or existing.request_digest_version not in (0, 1):
                session.rollback()
                return public_error(
                    409, "IDEMPOTENCY_CONFLICT", "Эта отправка уже использована с другими данными"
                )
            else:
                receipt_expiry = existing.receipt_expires_at
                if receipt_expiry.tzinfo is None:
                    receipt_expiry = receipt_expiry.replace(tzinfo=UTC)
                if receipt_expiry <= now:
                    receipt_expiry = now + RECEIPT_TTL
                    existing.receipt_expires_at = receipt_expiry
                    session.commit()
                else:
                    session.rollback()
                receipt = _receipt_token(lead.id, receipt_expiry, receipt_secret)
                return JSONResponse(
                    {"lead_number": f"TC-{lead.number:06d}", "receipt_token": receipt},
                    status_code=200,
                )

        if rate_limited:
            session.rollback()
            return public_error(429, "RATE_LIMITED", "Слишком много отправок. Попробуйте позже")

        lead = Lead(
            product_id=payload.product_id,
            contact_method=payload.contact_method,
            contact_value=payload.contact_value,
            name=payload.name,
            message=payload.message,
            telegram_details_consent_version=payload.telegram_details_consent_version,
            source=payload.source,
            status="new",
        )
        session.add(lead)
        session.flush()
        session.add(LeadNotification(lead_id=lead.id, status="pending"))
        session.add(
            LeadIdempotency(
                key_digest=key_digest,
                request_digest=request_digest,
                request_digest_version=1,
                lead_id=lead.id,
                expires_at=expiry,
                receipt_expires_at=now + RECEIPT_TTL,
            )
        )
        session.commit()
        token = _receipt_token(lead.id, now + RECEIPT_TTL, receipt_secret)
        return JSONResponse(
            {"lead_number": f"TC-{lead.number:06d}", "receipt_token": token}, status_code=201
        )
    except SQLAlchemyError:
        session.rollback()
        return public_error(
            503, "LEADS_UNAVAILABLE", "Не удалось сохранить заявку. Попробуйте ещё раз"
        )


@router.get("/receipt")
def get_receipt(token: str, session: DB):
    if len(token) > 256:
        return public_error(404, "RECEIPT_NOT_FOUND", "Подтверждение не найдено")
    secret = get_lead_settings().website_receipt_secret.get_secret_value()
    if len(secret) < 32:
        return public_error(503, "LEADS_UNAVAILABLE", "Подтверждение временно недоступно")
    parsed = _read_receipt_token(token, secret)
    if not parsed:
        return public_error(404, "RECEIPT_NOT_FOUND", "Подтверждение не найдено")
    try:
        lead = session.scalar(select(Lead).where(Lead.id == parsed[0]))
        if not lead:
            return public_error(404, "RECEIPT_NOT_FOUND", "Подтверждение не найдено")
        return {"lead_number": f"TC-{lead.number:06d}"}
    except SQLAlchemyError:
        return public_error(503, "LEADS_UNAVAILABLE", "Подтверждение временно недоступно")
