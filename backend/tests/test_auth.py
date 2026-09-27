from contextlib import contextmanager
from datetime import UTC, datetime, timedelta

import pytest
from pydantic import ValidationError
from sqlalchemy import select, update

from app.config import Settings, get_settings
from app.models import Session, User
from tests.conftest import FIXTURE_PASSWORD

HEADERS = {"X-Requested-With": "TravelClub", "Origin": "http://localhost:3000"}


def test_login_session_and_logout(client, admin):
    assert client.get("/api/auth/me").status_code == 401

    response = client.post(
        "/api/auth/login",
        headers=HEADERS,
        json={"login": " FIXTURE-ADMIN ", "password": FIXTURE_PASSWORD},
    )
    assert response.status_code == 200
    assert response.json() == {"id": str(admin.id), "login": "fixture-admin"}
    cookie = response.headers["set-cookie"]
    assert "HttpOnly" in cookie and "SameSite=lax" in cookie and "Max-Age=43200" in cookie
    assert client.get("/api/auth/me").json()["id"] == str(admin.id)
    token = client.cookies.get("travel_session")
    assert client.post("/api/auth/logout", headers=HEADERS).status_code == 204
    client.cookies.set("travel_session", token)
    assert client.get("/api/auth/me").status_code == 401


def test_csrf_rejects_missing_header_and_foreign_origin(client, admin):
    payload = {"login": admin.login, "password": FIXTURE_PASSWORD}
    assert client.post("/api/auth/login", json=payload).status_code == 403
    assert (
        client.post(
            "/api/auth/login",
            json=payload,
            headers={**HEADERS, "Origin": "https://untrusted.example"},
        ).status_code
        == 403
    )
    assert client.post("/api/auth/login", json=payload, headers=HEADERS).status_code == 200


def test_login_attempts_limited_by_login_across_ips(client, admin):
    for attempt in range(5):
        response = client.post(
            "/api/auth/login",
            headers={**HEADERS, "X-Forwarded-For": f"198.51.100.{attempt}"},
            json={"login": admin.login, "password": "fictional-wrong"},
        )
        assert response.status_code == 401
    response = client.post(
        "/api/auth/login",
        headers=HEADERS,
        json={"login": admin.login, "password": FIXTURE_PASSWORD},
    )
    assert response.status_code == 429
    assert int(response.headers["Retry-After"]) > 0


def test_ip_limit_cannot_be_bypassed_by_forwarded_header(client):
    for attempt in range(20):
        response = client.post(
            "/api/auth/login",
            headers={**HEADERS, "X-Forwarded-For": f"198.51.100.{attempt}"},
            json={"login": f"nonexistent-{attempt}", "password": "fictional-wrong"},
        )
        assert response.status_code == 401
    assert (
        client.post(
            "/api/auth/login",
            headers=HEADERS,
            json={"login": "another", "password": "fictional-wrong"},
        ).status_code
        == 429
    )


def test_expired_sessions_rejected_and_tokens_not_stored(client, admin, db):
    client.post(
        "/api/auth/login",
        headers=HEADERS,
        json={"login": admin.login, "password": FIXTURE_PASSWORD},
    )
    saved = db.scalar(select(Session))
    assert saved.token_digest != client.cookies.get("travel_session")
    assert len(saved.token_digest) == 64
    db.execute(update(Session).values(expires_at=datetime.now(UTC) - timedelta(seconds=1)))
    db.commit()
    assert client.get("/api/auth/me").status_code == 401


def test_secure_cookie_and_no_credential_disclosure(client, admin, monkeypatch):
    unknown = client.post(
        "/api/auth/login", headers=HEADERS, json={"login": "unknown", "password": "fictional-wrong"}
    )
    wrong = client.post(
        "/api/auth/login",
        headers=HEADERS,
        json={"login": admin.login, "password": "fictional-wrong"},
    )
    assert unknown.json() == wrong.json()
    monkeypatch.setattr(get_settings(), "cookie_secure", True)
    response = client.post(
        "/api/auth/login",
        headers=HEADERS,
        json={"login": admin.login, "password": FIXTURE_PASSWORD},
    )
    assert "; Secure" in response.headers["set-cookie"]
    assert "password" not in response.text and "hash" not in response.text
    with pytest.raises(ValidationError, match="Production requires"):
        Settings(app_env="production", cookie_secure=False)


def test_bootstrap_prompts_create_hashed_admin_and_duplicate_is_rejected(client, db, monkeypatch):
    from app import bootstrap

    @contextmanager
    def local_session():
        yield db

    monkeypatch.setattr(bootstrap, "SessionLocal", local_session)
    monkeypatch.setattr("builtins.input", lambda _: "  NEW-FIXTURE-ADMIN  ")
    monkeypatch.setattr(bootstrap.getpass, "getpass", lambda _: FIXTURE_PASSWORD)
    assert bootstrap.main() == 0
    user = db.scalar(select(User).where(User.login == "new-fixture-admin"))
    assert user.password_hash.startswith("$argon2id$")
    assert FIXTURE_PASSWORD not in user.password_hash
    assert (
        client.post(
            "/api/auth/login",
            headers=HEADERS,
            json={"login": user.login, "password": FIXTURE_PASSWORD},
        ).status_code
        == 200
    )
    assert bootstrap.main() == 1
