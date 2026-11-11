import asyncio
import hashlib
import json
from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import uuid4

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy import create_engine, event, select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.leads import api as leads_api
from app.leads import db as leads_db
from app.leads import products as leads_products
from app.leads.models import Lead, LeadIdempotency, LeadNotification, LeadRateEvent, WebsiteBase
from app.leads.schemas import LeadCreate

ORIGIN = "https://travel.example.test"
HEADERS = {"Origin": ORIGIN, "X-Requested-With": "TravelClub"}
RECEIPT_SECRET = "TEST-ONLY-receipt-secret-with-more-than-32-characters"
RATE_SECRET = "TEST-ONLY-rate-secret-with-more-than-32-characters"


@pytest.fixture
def lead_client(monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    WebsiteBase.metadata.create_all(engine)
    settings = SimpleNamespace(
        website_allowed_origins=ORIGIN,
        allowed_origins=frozenset({ORIGIN}),
        website_trusted_proxy_cidrs="",
        website_receipt_secret=SecretStr(RECEIPT_SECRET),
        website_rate_limit_secret=SecretStr(RATE_SECRET),
    )
    monkeypatch.setattr(leads_api, "get_lead_settings", lambda: settings)
    from app.leads.main import create_leads_app

    application = create_leads_app()

    def get_test_session():
        with Session(engine, expire_on_commit=False) as session:
            yield session

    application.dependency_overrides[leads_api.get_website_session] = get_test_session
    with TestClient(application) as client:
        yield client, engine
    engine.dispose()


def payload(**overrides):
    value = {
        "product_id": "route",
        "contact_method": "email",
        "contact_value": "  Traveler+Japan@Example.COM  ",
        "name": "Мария",
        "message": "Планируем поездку весной 🌸",
        "source": "formats",
        "consent": True,
    }
    value.update(overrides)
    return value


def send(client, body=None, *, key=None, headers=None):
    request_headers = dict(HEADERS)
    request_headers["Idempotency-Key"] = key or str(uuid4())
    if headers:
        request_headers.update(headers)
    return client.post(
        "/api/leads", json=body if body is not None else payload(), headers=request_headers
    )


def canonical_payload_bytes(body):
    parsed = LeadCreate.model_validate(body)
    excluded = {"website_honeypot"}
    if parsed.telegram_details_consent_version is None:
        excluded.add("telegram_details_consent_version")
    canonical = parsed.model_dump(exclude=excluded, mode="json")
    return json.dumps(
        canonical, ensure_ascii=False, sort_keys=True, separators=(",", ":")
    ).encode()


def test_create_persists_normalized_lead_and_notification_atomically(lead_client):
    client, engine = lead_client
    response = send(client)

    assert response.status_code == 201
    result = response.json()
    assert result["lead_number"].startswith("TC-")
    with Session(engine) as session:
        lead = session.scalar(select(Lead))
        notice = session.scalar(select(LeadNotification))
        idempotency = session.scalar(select(LeadIdempotency))
        assert lead.contact_value == "Traveler+Japan@example.com"
        assert lead.product_id == "route"
        assert lead.source == "formats"
        assert lead.consent_accepted_at is not None
        assert notice.lead_id == lead.id and notice.status == "pending"
        assert idempotency.lead_id == lead.id

    receipt = client.get("/api/leads/receipt", params={"token": result["receipt_token"]})
    assert receipt.status_code == 200
    assert receipt.json() == {"lead_number": result["lead_number"]}


def test_create_persists_explicit_telegram_details_consent_version(lead_client):
    client, engine = lead_client
    response = send(client, payload(telegram_details_consent_version="telegram-details-v1"))

    assert response.status_code == 201
    with Session(engine) as session:
        lead = session.scalar(select(Lead))
        assert lead.telegram_details_consent_version == "telegram-details-v1"


def test_new_idempotency_fingerprint_is_not_bare_sha256(lead_client):
    client, engine = lead_client
    body = payload()
    response = send(client, body)

    assert response.status_code == 201
    with Session(engine) as session:
        idempotency = session.scalar(select(LeadIdempotency))
        assert idempotency.request_digest_version == 1
        assert idempotency.request_digest != hashlib.sha256(canonical_payload_bytes(body)).digest()


def test_legacy_sha256_idempotency_rows_remain_replayable_until_ttl(lead_client):
    client, engine = lead_client
    body = payload()
    key = str(uuid4())
    first = send(client, body, key=key)
    assert first.status_code == 201

    with Session(engine) as session:
        idempotency = session.scalar(select(LeadIdempotency))
        idempotency.request_digest = hashlib.sha256(canonical_payload_bytes(body)).digest()
        idempotency.request_digest_version = 0
        session.commit()

    replay = send(client, body, key=key)
    assert replay.status_code == 200
    assert replay.json()["lead_number"] == first.json()["lead_number"]
    with Session(engine) as session:
        assert len(session.scalars(select(Lead)).all()) == 1


def test_idempotency_replays_without_duplicate_and_rejects_changed_payload(lead_client):
    client, engine = lead_client
    key = str(uuid4())
    first = send(client, key=key)
    replay = send(client, key=key)
    mismatch = send(client, payload(name="Другой человек"), key=key)

    assert first.status_code == 201
    assert replay.status_code == 200
    assert replay.json() == first.json()
    assert mismatch.status_code == 409
    with Session(engine) as session:
        assert len(session.scalars(select(Lead)).all()) == 1
        assert len(session.scalars(select(LeadNotification)).all()) == 1
        assert len(session.scalars(select(LeadRateEvent)).all()) == 3


@pytest.mark.parametrize(
    "body",
    [
        payload(product_id="arbitrary"),
        payload(contact_method="fax"),
        payload(consent=False),
        payload(unexpected="field"),
        payload(contact_value="not an email"),
        payload(contact_value="x" * 255),
    ],
)
def test_invalid_schema_values_are_rejected_without_echoing_contact(lead_client, body):
    client, _ = lead_client
    response = send(client, body)

    assert response.status_code == 422
    assert "not an email" not in response.text
    allowed_fields = {
        "product_id",
        "contact_method",
        "contact_value",
        "name",
        "message",
        "consent",
        "_form",
    }
    assert all(detail["field"] in allowed_fields for detail in response.json()["details"])


def test_server_rejects_product_disabled_in_shared_registry(lead_client, monkeypatch):
    client, _ = lead_client
    monkeypatch.setattr(
        leads_products,
        "get_product_registry",
        lambda: {
            "route": {"id": "route", "label": "Route", "available": True},
            "group": {"id": "group", "label": "Group", "available": False},
        },
    )

    response = send(client, payload(product_id="group"))

    assert response.status_code == 422
    assert response.json()["details"][0]["field"] == "product_id"
    assert "group" not in response.text


def test_validation_response_identifies_bad_field_without_echoing_value(lead_client):
    client, _ = lead_client
    response = send(client, payload(contact_value="not-a-private-valid-email"))

    assert response.status_code == 422
    assert response.json()["details"] == [
        {"field": "contact_value", "message": "Проверьте контактные данные."}
    ]
    assert "not-a-private-valid-email" not in response.text


def test_international_contact_normalization_and_invalid_profiles():
    from app.leads.schemas import LeadCreate

    assert (
        LeadCreate.model_validate(
            payload(contact_method="phone", contact_value="+1 (202) 555-0123")
        ).contact_value
        == "+12025550123"
    )
    assert (
        LeadCreate.model_validate(
            payload(contact_method="telegram", contact_value="https://t.me/traveler_1")
        ).contact_value
        == "@traveler_1"
    )
    assert (
        LeadCreate.model_validate(
            payload(contact_method="instagram", contact_value="https://instagram.com/traveler.one")
        ).contact_value
        == "@traveler.one"
    )
    for method, contact in (
        ("phone", "+1 123"),
        ("telegram", "https://example.org/@admin"),
        ("instagram", "javascript:alert(1)"),
    ):
        with pytest.raises(ValueError):
            LeadCreate.model_validate(payload(contact_method=method, contact_value=contact))
    with pytest.raises(ValueError):
        LeadCreate.model_validate(payload(message="lone surrogate: \ud800"))


def test_origin_content_type_and_body_limits(lead_client):
    client, _ = lead_client
    bad_origin = send(client, headers={"Origin": "https://evil.example"})
    no_origin = send(client, headers={"Origin": ""})
    bad_type = client.post(
        "/api/leads",
        content=b"{}",
        headers={**HEADERS, "Content-Type": "text/plain", "Idempotency-Key": str(uuid4())},
    )
    oversized = client.post(
        "/api/leads",
        content=b"{" + b" " * (16 * 1024) + b"}",
        headers={**HEADERS, "Content-Type": "application/json", "Idempotency-Key": str(uuid4())},
    )
    content_length_claim = client.post(
        "/api/leads",
        content=b"{}",
        headers={
            **HEADERS,
            "Content-Type": "application/json",
            "Content-Length": str(16 * 1024 + 1),
            "Idempotency-Key": str(uuid4()),
        },
    )

    assert bad_origin.status_code == 403
    assert no_origin.status_code == 403
    assert bad_type.status_code == 415
    assert oversized.status_code == 413
    assert content_length_claim.status_code == 413


def test_streamed_endpoint_body_limit_without_content_length(lead_client):
    client, engine = lead_client
    raw_body = json.dumps(payload(message="x" * 17_000)).encode()
    assert len(raw_body) > leads_api.MAX_BODY_BYTES
    chunks = (raw_body[:8_000], raw_body[8_000:16_000], raw_body[16_000:])

    class ChunkedBody(httpx.AsyncByteStream):
        async def __aiter__(self):
            for chunk in chunks:
                yield chunk

    async def post_streamed_body():
        transport = httpx.ASGITransport(app=client.app)
        async with httpx.AsyncClient(
            transport=transport, base_url="http://testserver"
        ) as stream_client:
            request_headers = {
                **HEADERS,
                "Content-Type": "application/json",
                "Idempotency-Key": str(uuid4()),
            }
            request = stream_client.build_request(
                "POST", "/api/leads", headers=request_headers, content=ChunkedBody()
            )
            assert "content-length" not in request.headers
            return await stream_client.send(request)

    response = asyncio.run(post_streamed_body())

    assert response.status_code == 413
    with Session(engine) as session:
        assert session.scalar(select(Lead)) is None
        assert session.scalar(select(LeadNotification)) is None


def test_malformed_requests_are_counted_before_json_validation(lead_client):
    client, engine = lead_client
    responses = [
        client.post(
            "/api/leads",
            content=b"not-json",
            headers={
                **HEADERS,
                "Content-Type": "application/json",
                "Idempotency-Key": str(uuid4()),
            },
        )
        for _ in range(4)
    ]

    assert [response.status_code for response in responses] == [422, 422, 422, 429]
    with Session(engine) as session:
        assert len(session.scalars(select(LeadRateEvent)).all()) == 3


def test_invalid_idempotency_header_is_rejected_without_internal_error(lead_client):
    client, _ = lead_client
    for invalid in ("------------------------------------", "00000000-0000-0000-0000-00000000000g"):
        response = send(client, key=invalid)
        assert response.status_code == 400
        assert "Traceback" not in response.text


def test_honeypot_does_not_create_or_confirm_a_lead(lead_client):
    client, engine = lead_client
    response = send(client, payload(website_honeypot="filled by bot"))
    assert response.status_code == 422
    with Session(engine) as session:
        assert session.scalar(select(Lead)) is None
        assert session.scalar(select(LeadNotification)) is None


def test_markup_and_sql_payloads_remain_plain_stored_text(lead_client):
    client, engine = lead_client
    hostile = "'); DROP TABLE leads; -- <script>alert(1)</script>"
    response = send(client, payload(message=hostile))

    assert response.status_code == 201
    with Session(engine) as session:
        lead = session.scalar(select(Lead))
        assert lead.message == hostile
        assert len(session.scalars(select(Lead)).all()) == 1


def test_rate_limit_is_database_backed_and_returns_actionable_error(lead_client):
    client, engine = lead_client
    responses = [send(client) for _ in range(4)]

    assert [response.status_code for response in responses] == [201, 201, 201, 429]
    with Session(engine) as session:
        assert len(session.scalars(select(Lead)).all()) == 3
        assert len(session.scalars(select(LeadRateEvent)).all()) == 3


def test_many_limited_attempts_do_not_grow_rate_event_table(lead_client):
    _, engine = lead_client
    digest = b"x" * 32
    with Session(engine, expire_on_commit=False) as session:
        now = datetime.now(UTC)
        assert [leads_api._record_rate_attempt(session, digest, now) for _ in range(3)] == [
            False,
            False,
            False,
        ]
        assert all(leads_api._record_rate_attempt(session, digest, now) for _ in range(1000))
    with Session(engine) as session:
        assert len(session.scalars(select(LeadRateEvent)).all()) == 3


def test_receipt_is_signed_short_lived_and_contains_no_contact(lead_client):
    client, _ = lead_client
    created = send(client).json()
    valid = client.get("/api/leads/receipt", params={"token": created["receipt_token"]})
    forged = client.get("/api/leads/receipt", params={"token": "not-a-token"})

    assert valid.status_code == 200
    assert "contact" not in valid.text.lower()
    assert forged.status_code == 404


def test_database_outage_returns_controlled_error_without_personal_data(monkeypatch):
    settings = SimpleNamespace(
        allowed_origins=frozenset({ORIGIN}),
        website_trusted_proxy_cidrs="",
        website_receipt_secret=SecretStr(RECEIPT_SECRET),
        website_rate_limit_secret=SecretStr(RATE_SECRET),
    )
    monkeypatch.setattr(leads_api, "get_lead_settings", lambda: settings)
    engine = create_engine("sqlite://")

    def fail_connect(*_args):
        raise OperationalError("connect", {}, RuntimeError("unavailable"))

    event.listen(engine, "do_connect", fail_connect)
    monkeypatch.setattr(leads_db, "get_website_engine", lambda: engine)
    from app.leads.main import create_leads_app

    with TestClient(create_leads_app()) as client:
        response = send(client, payload(contact_value="private@example.test"))
    assert response.status_code == 503
    assert response.json()["code"] == "LEADS_UNAVAILABLE"
    assert "private@example.test" not in response.text
