from uuid import uuid4

from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.leads import private_api
from app.leads.db import get_website_session
from app.leads.main import create_leads_app
from app.leads.models import Lead, LeadNotification, WebsiteBase

SECRET = "test-only-" + "s" * 48


def test_private_leads_require_secret_and_update_only_valid_status(monkeypatch):
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    WebsiteBase.metadata.create_all(engine)
    with Session(engine) as session:
        lead = Lead(
            id=uuid4(),
            product_id="route",
            contact_method="email",
            contact_value="test@example.com",
            source="home",
            status="new",
        )
        session.add(lead)
        session.flush()
        session.add(LeadNotification(lead_id=lead.id, status="pending"))
        lead_id = str(lead.id)
        session.commit()
    monkeypatch.setattr(
        private_api,
        "get_lead_settings",
        lambda: type("Settings", (), {"website_admin_secret": SecretStr(SECRET)})(),
    )
    app = create_leads_app()

    def db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_website_session] = db
    with TestClient(app) as client:
        for method, path in [
            ("get", "/internal/leads"),
            ("get", f"/internal/leads/{lead_id}"),
            ("patch", f"/internal/leads/{lead_id}"),
        ]:
            assert getattr(client, method)(path).status_code == 401
        assert (
            client.get("/internal/leads", headers={"X-Website-Admin-Key": "wrong"}).status_code
            == 401
        )
        headers = {"X-Website-Admin-Key": SECRET}
        assert client.get("/api/leads/internal", headers=headers).status_code == 404
        result = client.get("/internal/leads", headers=headers).json()
        assert result["counts"]["new"] == 1
        assert result["items"][0]["notification_status"] == "pending"
        assert (
            client.get(f"/internal/leads/{lead_id}", headers=headers).json()["contact_value"]
            == "test@example.com"
        )
        assert (
            client.patch(
                f"/internal/leads/{lead_id}", headers=headers, json={"status": "bad"}
            ).status_code
            == 422
        )
        assert (
            client.patch(
                f"/internal/leads/{lead_id}", headers=headers, json={"status": "in_progress"}
            ).status_code
            == 200
        )
        assert (
            client.get(f"/internal/leads/{lead_id}", headers=headers).json()["status"]
            == "in_progress"
        )
    engine.dispose()


def test_unconfigured_or_short_service_key_cannot_authorize(monkeypatch):
    from app.leads.config import LeadSettings

    for configured in ("", "too-short"):
        monkeypatch.setattr(
            private_api,
            "get_lead_settings",
            lambda: LeadSettings(website_admin_secret=SecretStr(configured)),
        )
        with TestClient(create_leads_app()) as client:
            assert (
                client.get(
                    "/internal/leads", headers={"X-Website-Admin-Key": configured}
                ).status_code
                == 401
            )
