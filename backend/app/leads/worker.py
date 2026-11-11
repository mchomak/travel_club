"""Reliable Telegram delivery for the Website lead outbox.

Only the worker knows the Telegram token. Notifications deliberately contain no
contact or free text, and logs contain stable error categories only.
"""

from __future__ import annotations

import logging
import time
from contextlib import contextmanager
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from app.leads.config import get_lead_settings
from app.leads.db import open_website_session
from app.leads.models import Lead, LeadIdempotency, LeadNotification, LeadRateEvent
from app.leads.products import get_product_label

logger = logging.getLogger(__name__)

POLL_SECONDS = 5
REQUEST_TIMEOUT_SECONDS = 5.0
LEASE_SECONDS = 60
MAX_ATTEMPTS = 8
MAX_RETRY_SECONDS = 60 * 60


def _parse_chat_ids(value: str) -> tuple[str, ...]:
    """Parse comma-separated recipients, preserving order and removing duplicates."""
    chat_ids: list[str] = []
    for candidate in value.split(","):
        chat_id = candidate.strip()
        if chat_id and chat_id not in chat_ids:
            chat_ids.append(chat_id)
    return tuple(chat_ids)


def cleanup_expired_records(session: Session, *, now: datetime | None = None) -> None:
    """Remove rate-limit hashes and idempotency fingerprints after their TTL."""
    now = now or datetime.now(UTC)
    cutoff = now - timedelta(hours=24)
    session.execute(delete(LeadRateEvent).where(LeadRateEvent.created_at < cutoff))
    session.execute(delete(LeadIdempotency).where(LeadIdempotency.expires_at <= now))
    session.commit()


@contextmanager
def _quiet_http_logs():
    """Prevent HTTP client logs from exposing Telegram's token-bearing URL."""
    loggers = (logging.getLogger("httpx"), logging.getLogger("httpcore"))
    original_levels = [item.level for item in loggers]
    try:
        for item in loggers:
            item.setLevel(logging.WARNING)
        yield
    finally:
        for item, level in zip(loggers, original_levels, strict=True):
            item.setLevel(level)


def _retry_delay(attempts: int, retry_after: int | None = None) -> int:
    if retry_after is not None:
        return max(1, min(retry_after, MAX_RETRY_SECONDS))
    return min(5 * (2 ** max(0, attempts - 1)), MAX_RETRY_SECONDS)


def _telegram_result(
    *, token: str, chat_id: str, lead_number: int, product_id: str, client: Any | None = None
) -> tuple[str, int | None, str | None]:
    """Return (sent|retry|dead, retry-after seconds, safe error code)."""
    label = get_product_label(product_id)

    message = f"НОВАЯ ЗАЯВКА — TRAVEL CLUB\nЗаявка: TC-{lead_number:06d}\nФормат: {label}"
    owns_client = client is None
    http_client = client or httpx.Client(timeout=REQUEST_TIMEOUT_SECONDS)
    try:
        with _quiet_http_logs():
            response = http_client.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={"chat_id": chat_id, "text": message, "disable_web_page_preview": True},
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
        if response.status_code == 429:
            retry_after = None
            try:
                value = response.json().get("parameters", {}).get("retry_after")
                if isinstance(value, (int, float)) and value >= 0:
                    retry_after = int(value)
            except (ValueError, TypeError, AttributeError):
                pass
            return "retry", retry_after, "telegram_rate_limited"
        if 200 <= response.status_code < 300:
            try:
                payload = response.json()
            except (ValueError, TypeError):
                return "retry", None, "telegram_invalid_response"
            if isinstance(payload, dict) and payload.get("ok") is True:
                return "sent", None, None
            # Telegram can return an application-level rejection with HTTP 200.
            return "dead", None, "telegram_rejected"
        if response.status_code >= 500:
            return "retry", None, "telegram_server_error"
        return "dead", None, "telegram_rejected"
    except httpx.TimeoutException:
        return "retry", None, "telegram_timeout"
    except httpx.RequestError:
        return "retry", None, "telegram_network_error"
    finally:
        if owns_client:
            http_client.close()


def process_one(
    session: Session,
    *,
    token: str,
    chat_id: str,
    client: Any | None = None,
    now: datetime | None = None,
) -> bool:
    """Claim and deliver one notification, returning whether work was claimed."""
    chat_ids = _parse_chat_ids(chat_id)
    if not token or not chat_ids:
        return False

    now = now or datetime.now(UTC)
    eligible = or_(
        (LeadNotification.status == "pending") & (LeadNotification.next_attempt_at <= now),
        (LeadNotification.status == "sending") & (LeadNotification.locked_until <= now),
    )
    notification = session.scalar(
        select(LeadNotification)
        .where(eligible)
        .order_by(LeadNotification.next_attempt_at, LeadNotification.created_at)
        .with_for_update(skip_locked=True)
        .limit(1)
    )
    if notification is None:
        session.rollback()
        return False

    lead = session.scalar(select(Lead).where(Lead.id == notification.lead_id))
    if lead is None:
        # A dangling row should not be possible with the FK, but do not leave it
        # cycling forever if a database was repaired manually.
        notification.status = "dead"
        notification.last_error_code = "lead_missing"
        notification.locked_until = None
        session.commit()
        return True

    notification.status = "sending"
    lease_until = now + timedelta(seconds=LEASE_SECONDS)
    notification.locked_until = lease_until
    notification.attempts += 1
    claimed_attempt = notification.attempts
    lead_number, product_id, notification_id = lead.number, lead.product_id, notification.id
    session.commit()  # lease is durable before making the external request

    results = [
        _telegram_result(
            token=token,
            chat_id=recipient,
            lead_number=lead_number,
            product_id=product_id,
            client=client,
        )
        for recipient in chat_ids
    ]
    retries = [result for result in results if result[0] == "retry"]
    dead = [result for result in results if result[0] == "dead"]
    if retries:
        outcome = "retry"
        retry_values = [result[1] for result in retries if result[1] is not None]
        retry_after = max(retry_values) if retry_values else None
        error_code = retries[0][2]
    elif dead:
        outcome, retry_after, error_code = "dead", None, dead[0][2]
    else:
        outcome, retry_after, error_code = "sent", None, None
    current = session.scalar(
        select(LeadNotification)
        .where(LeadNotification.id == notification_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if current is None:
        session.rollback()
        return True

    finished_at = datetime.now(UTC)
    current_lease = current.locked_until
    if current_lease is not None and current_lease.tzinfo is None:
        current_lease = current_lease.replace(tzinfo=UTC)
    if (
        current.status != "sending"
        or current.attempts != claimed_attempt
        or current_lease != lease_until
        or current_lease <= finished_at
    ):
        # The lease expired or another process reclaimed/retried the row while
        # this request was in flight. A stale outcome must not overwrite it.
        session.rollback()
        return True

    current.locked_until = None
    current.last_error_code = error_code
    if outcome == "sent":
        current.status = "sent"
        current.sent_at = finished_at
    elif outcome == "retry" and current.attempts < MAX_ATTEMPTS:
        current.status = "pending"
        current.next_attempt_at = finished_at + timedelta(
            seconds=_retry_delay(current.attempts, retry_after)
        )
    else:
        current.status = "dead"
    session.commit()

    if error_code:
        logger.warning("lead_notification_failed code=%s", error_code)
    return True


def run_once(settings: Any | None = None) -> bool:
    """Clean expired technical records, then process one notification if configured."""
    settings = settings or get_lead_settings()
    token = settings.telegram_bot_token.get_secret_value()
    chat_id = settings.telegram_leads_chat_id.strip()
    with open_website_session() as session:
        cleanup_expired_records(session)
        if not token or not _parse_chat_ids(chat_id):
            return False
        return process_one(session, token=token, chat_id=chat_id)


def run_worker(*, poll_seconds: int = POLL_SECONDS) -> None:
    """Poll the Website outbox and clean expired records until stopped."""
    settings = get_lead_settings()
    token = settings.telegram_bot_token.get_secret_value()
    chat_id = settings.telegram_leads_chat_id.strip()
    if not token or not _parse_chat_ids(chat_id):
        # Cleanup still runs so expired pseudonymous records are not retained
        # forever. run_once will skip Telegram claims without both credentials.
        logger.warning("lead_notification_worker_disabled reason=missing_configuration")

    while True:
        try:
            worked = run_once(settings)
            if not worked:
                time.sleep(poll_seconds)
        except Exception:
            # Never log exception text: a database error or HTTP library may
            # include user data or a Telegram URL containing the bot token.
            logger.error("lead_notification_worker_error category=unexpected")
            time.sleep(poll_seconds)


if __name__ == "__main__":
    logging.basicConfig(level=logging.WARNING, format="%(asctime)s %(levelname)s %(message)s")
    run_worker()
