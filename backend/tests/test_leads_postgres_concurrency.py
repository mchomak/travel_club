import os
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlsplit
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy import create_engine, func, select, text
from sqlalchemy.orm import Session

from app.leads import api as leads_api
from app.leads.main import create_leads_app
from app.leads.models import Lead, LeadIdempotency, LeadNotification, LeadRateEvent


@pytest.mark.integration
def test_simultaneous_same_idempotency_key_creates_one_lead_and_one_outbox(monkeypatch):
    database_url = os.environ.get("WEBSITE_E2E_DATABASE_URL", "")
    if not database_url:
        if os.environ.get("WEBSITE_E2E_COMPOSE_PROJECT") == "travel-club-leads-check-run2":
            pytest.fail("Named PostgreSQL test runner did not provide WEBSITE_E2E_DATABASE_URL")
        pytest.skip("WEBSITE_E2E_DATABASE_URL is unset; isolated PostgreSQL test only")
    if os.environ.get("WEBSITE_E2E_COMPOSE_PROJECT") != "travel-club-leads-check-run2":
        pytest.fail("PostgreSQL tests require the named disposable Compose project")
    if os.environ.get("WEBSITE_E2E_POSTGRES_VOLUME") != (
        "travel-club-leads-check-run2_website_postgres_data"
    ):
        pytest.fail("PostgreSQL tests require the named project-owned Website volume")
    database_name = urlsplit(database_url).path.rsplit("/", 1)[-1].lower()
    if not any(marker in database_name for marker in ("test", "e2e", "check")):
        pytest.fail("WEBSITE_E2E_DATABASE_URL must point to a disposable test/e2e/check database")

    receipt_secret = "TEST-ONLY-integration-receipt-secret-more-than-32-chars"
    rate_secret = "TEST-ONLY-integration-rate-secret-more-than-32-characters"
    origin = "https://travel.example.test"
    settings = type(
        "TestLeadSettings",
        (),
        {
            "website_receipt_secret": SecretStr(receipt_secret),
            "website_rate_limit_secret": SecretStr(rate_secret),
            "website_trusted_proxy_cidrs": "127.0.0.1/32",
            "allowed_origins": frozenset({origin}),
        },
    )()
    monkeypatch.setattr(leads_api, "get_lead_settings", lambda: settings)
    engine = create_engine(database_url, pool_pre_ping=True, hide_parameters=True)
    app = create_leads_app()

    def get_session():
        with Session(engine, expire_on_commit=False) as session:
            yield session

    app.dependency_overrides[leads_api.get_website_session] = get_session
    key = str(uuid4())
    forwarded_ip = f"198.51.100.{1 + uuid4().int % 200}"
    request_payload = {
        "product_id": "route",
        "contact_method": "email",
        "contact_value": "e2e-test@example.com",
        "name": "E2E fixture",
        "message": "Disposable database concurrency test",
        "source": "home",
        "consent": True,
    }

    def submit():
        with TestClient(app) as client:
            return client.post(
                "/api/leads",
                json=request_payload,
                headers={
                    "Origin": origin,
                    "Idempotency-Key": key,
                    "X-Forwarded-For": forwarded_ip,
                },
            )

    try:
        with ThreadPoolExecutor(max_workers=2) as pool:
            first, second = [
                future.result() for future in (pool.submit(submit), pool.submit(submit))
            ]
        assert sorted((first.status_code, second.status_code)) == [200, 201]
        assert first.json() == second.json()
        number = int(first.json()["lead_number"].removeprefix("TC-"))
        with Session(engine) as session:
            lead = session.scalar(select(Lead).where(Lead.number == number))
            assert lead is not None
            assert len(session.scalars(select(Lead).where(Lead.id == lead.id)).all()) == 1
            assert (
                len(
                    session.scalars(
                        select(LeadIdempotency).where(LeadIdempotency.lead_id == lead.id)
                    ).all()
                )
                == 1
            )
            assert (
                session.scalar(
                    text("SELECT has_table_privilege(current_user, 'alembic_version', 'SELECT')")
                )
                is False
            )
            assert (
                session.scalar(text("SELECT has_table_privilege(current_user, 'leads', 'INSERT')"))
                is True
            )
            assert (
                len(
                    session.scalars(
                        select(LeadNotification).where(LeadNotification.lead_id == lead.id)
                    ).all()
                )
                == 1
            )
            assert session.scalar(select(func.count(LeadRateEvent.id))) >= 2
    finally:
        engine.dispose()
