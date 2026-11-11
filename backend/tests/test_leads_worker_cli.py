from __future__ import annotations

import json
import logging
from contextlib import contextmanager
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import httpx
import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.leads import cli, worker
from app.leads.cli import get_lead, list_leads, retry_notification, set_status
from app.leads.config import LeadSettings
from app.leads.models import Lead, LeadIdempotency, LeadNotification, LeadRateEvent, WebsiteBase
from app.leads.worker import cleanup_expired_records, process_one


@pytest.fixture
def lead_session():
    engine = create_engine("sqlite+pysqlite:///:memory:")
    WebsiteBase.metadata.create_all(engine)
    with Session(engine, expire_on_commit=False) as session:
        yield session
    engine.dispose()


def add_lead(session: Session, *, notification_status: str = "pending") -> Lead:
    lead = Lead(
        id=uuid4(),
        product_id="route",
        contact_method="email",
        contact_value="private.person@example.test",
        name="Private Person",
        message="A private trip detail",
        source="formats",
        status="new",
    )
    session.add(lead)
    session.flush()
    session.add(
        LeadNotification(
            lead_id=lead.id,
            status=notification_status,
            attempts=0,
            next_attempt_at=datetime.now(UTC) - timedelta(seconds=1),
        )
    )
    session.commit()
    return lead


def test_worker_sends_minimal_message_and_marks_outbox_sent(lead_session):
    lead = add_lead(lead_session)
    sent: list[httpx.Request] = []

    def handle(request: httpx.Request) -> httpx.Response:
        sent.append(request)
        return httpx.Response(200, json={"ok": True, "result": {"message_id": 1}})

    with httpx.Client(transport=httpx.MockTransport(handle)) as client:
        assert process_one(lead_session, token="test-only-token", chat_id="-1001", client=client)

    payload = json.loads(sent[0].content)
    assert payload["text"].splitlines() == [
        "НОВАЯ ЗАЯВКА — TRAVEL CLUB",
        "Заявка: TC-000001",
        "Формат: Travel Design — Маршрут",
    ]
    assert "private.person" not in payload["text"]
    assert "Private Person" not in payload["text"]
    assert "private trip detail" not in payload["text"]
    notification = lead_session.scalar(
        select(LeadNotification).where(LeadNotification.lead_id == lead.id)
    )
    assert notification.status == "sent"
    assert notification.sent_at is not None
    assert notification.attempts == 1
    assert notification.locked_until is None


def test_worker_honors_telegram_retry_after(lead_session):
    lead = add_lead(lead_session)
    before = datetime.now(UTC)

    def handle(_: httpx.Request) -> httpx.Response:
        return httpx.Response(429, json={"ok": False, "parameters": {"retry_after": 37}})

    with httpx.Client(transport=httpx.MockTransport(handle)) as client:
        assert process_one(lead_session, token="test-only-token", chat_id="-1001", client=client)

    notification = lead_session.scalar(
        select(LeadNotification).where(LeadNotification.lead_id == lead.id)
    )
    assert notification.status == "pending"
    assert notification.last_error_code == "telegram_rate_limited"
    retry_at = notification.next_attempt_at
    if retry_at.tzinfo is None:  # SQLite returns naive values for timestamptz columns.
        retry_at = retry_at.replace(tzinfo=UTC)
    assert 36 <= (retry_at - before).total_seconds() <= 39


def test_worker_retries_network_errors_without_leaking_details(lead_session, caplog):
    lead = add_lead(lead_session)

    def handle(_: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("token=must-not-be-logged", request=httpx.Request("POST", "https://example.test"))

    with httpx.Client(transport=httpx.MockTransport(handle)) as client:
        assert process_one(lead_session, token="test-only-token", chat_id="-1001", client=client)

    notification = lead_session.scalar(
        select(LeadNotification).where(LeadNotification.lead_id == lead.id)
    )
    assert notification.status == "pending"
    assert notification.attempts == 1
    assert notification.last_error_code == "telegram_network_error"
    assert "must-not-be-logged" not in caplog.text
    assert "test-only-token" not in caplog.text


def test_worker_marks_invalid_chat_dead(lead_session):
    lead = add_lead(lead_session)

    def handle(_: httpx.Request) -> httpx.Response:
        return httpx.Response(400, json={"ok": False, "description": "private provider response"})

    with httpx.Client(transport=httpx.MockTransport(handle)) as client:
        assert process_one(lead_session, token="test-only-token", chat_id="bad-chat", client=client)

    notification = lead_session.scalar(
        select(LeadNotification).where(LeadNotification.lead_id == lead.id)
    )
    assert notification.status == "dead"
    assert notification.last_error_code == "telegram_rejected"


def test_worker_and_cli_resolve_historical_product_labels(monkeypatch, capsys):
    resolved: list[str] = []

    def historic_label(product_id: str) -> str:
        resolved.append(product_id)
        return "Исторический формат"

    monkeypatch.setattr(worker, "get_product_label", historic_label)
    monkeypatch.setattr(cli, "get_product_label", historic_label)
    sent: list[httpx.Request] = []

    def handle(request: httpx.Request) -> httpx.Response:
        sent.append(request)
        return httpx.Response(200, json={"ok": True})

    with httpx.Client(transport=httpx.MockTransport(handle)) as client:
        outcome = worker._telegram_result(
            token="test-only-token",
            chat_id="-1001",
            lead_number=123,
            product_id="disabled_historic_id",
            client=client,
        )
    assert outcome == ("sent", None, None)
    assert "Исторический формат" in json.loads(sent[0].content)["text"]
    assert resolved == ["disabled_historic_id"]

    lead = Lead(
        id=uuid4(),
        number=123,
        product_id="disabled_historic_id",
        contact_method="telegram",
        contact_value="@username",
        source="formats",
        status="new",
    )
    cli._print_list([lead])
    assert "Исторический формат" in capsys.readouterr().out
    assert resolved[-1] == "disabled_historic_id"


def test_worker_does_not_claim_when_telegram_is_unconfigured(lead_session):
    add_lead(lead_session)
    assert not process_one(lead_session, token="", chat_id="")
    notification = lead_session.scalar(select(LeadNotification))
    assert notification.status == "pending"
    assert notification.attempts == 0


def test_real_httpx_info_logging_cannot_expose_token_or_contact(lead_session, caplog):
    add_lead(lead_session)
    token = "1234567890:SECRET_TOKEN_MUST_NOT_APPEAR"
    caplog.set_level(logging.INFO, logger="httpx")

    def handle(_: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"ok": True})

    with httpx.Client(transport=httpx.MockTransport(handle)) as client:
        assert process_one(
            lead_session,
            token=token,
            chat_id="-1001",
            client=client,
        )

    assert "SECRET_TOKEN_MUST_NOT_APPEAR" not in caplog.text
    assert "private.person@example.test" not in caplog.text
    assert "Private Person" not in caplog.text
    assert "A private trip detail" not in caplog.text


def test_worker_keeps_ttl_cleanup_running_without_telegram_configuration(
    lead_session, monkeypatch, caplog
):
    lead = add_lead(lead_session)
    lead_session.add(
        LeadRateEvent(
            ip_digest=b"r" * 32,
            created_at=datetime.now(UTC) - timedelta(hours=25),
        )
    )
    lead_session.commit()

    @contextmanager
    def open_test_session():
        yield lead_session

    class StopWorker(BaseException):
        pass

    sleep_calls = 0

    def stop_after_two_cycles(_: int) -> None:
        nonlocal sleep_calls
        sleep_calls += 1
        if sleep_calls == 2:
            raise StopWorker

    monkeypatch.setattr(worker, "get_lead_settings", lambda: LeadSettings())
    monkeypatch.setattr(worker, "open_website_session", open_test_session)
    monkeypatch.setattr(worker.time, "sleep", stop_after_two_cycles)

    with pytest.raises(StopWorker):
        worker.run_worker(poll_seconds=1)

    assert lead_session.query(LeadRateEvent).count() == 0
    notification = lead_session.scalar(
        select(LeadNotification).where(LeadNotification.lead_id == lead.id)
    )
    assert notification.status == "pending"
    assert notification.attempts == 0
    assert caplog.text.count("lead_notification_worker_disabled") == 1


def test_worker_reclaims_expired_lease_without_stale_completion_overwrite(lead_session):
    lead = add_lead(lead_session)

    def reclaim_then_reply(_: httpx.Request) -> httpx.Response:
        notification = lead_session.scalar(
            select(LeadNotification).where(LeadNotification.lead_id == lead.id)
        )
        assert notification.status == "sending"
        # Simulate a second worker claiming the row after the first lease expires.
        notification.attempts += 1
        notification.locked_until = datetime.now(UTC) + timedelta(seconds=LEASE_SECONDS_FOR_TEST)
        lead_session.commit()
        return httpx.Response(200, json={"ok": True})

    with httpx.Client(transport=httpx.MockTransport(reclaim_then_reply)) as client:
        assert process_one(lead_session, token="test-only-token", chat_id="-1001", client=client)

    notification = lead_session.scalar(
        select(LeadNotification).where(LeadNotification.lead_id == lead.id)
    )
    assert notification.status == "sending"
    assert notification.attempts == 2
    assert notification.locked_until is not None
    assert notification.sent_at is None


LEASE_SECONDS_FOR_TEST = 120


def test_cli_refuses_retry_during_active_lease_and_allows_expired_lease(lead_session):
    add_lead(lead_session)
    notification = lead_session.scalar(select(LeadNotification))
    notification.status = "sending"
    notification.attempts = 4
    notification.locked_until = datetime.now(UTC) + timedelta(seconds=45)
    lead_session.commit()
    active_lease = notification.locked_until

    assert not retry_notification(lead_session, "TC-000001")
    notification = lead_session.scalar(select(LeadNotification))
    assert notification.status == "sending"
    assert notification.attempts == 4
    retained_lease = notification.locked_until
    if retained_lease.tzinfo is None:
        retained_lease = retained_lease.replace(tzinfo=UTC)
    assert retained_lease == active_lease

    notification.locked_until = datetime.now(UTC) - timedelta(seconds=1)
    lead_session.commit()
    assert retry_notification(lead_session, "TC-000001")
    notification = lead_session.scalar(select(LeadNotification))
    assert notification.status == "pending"
    assert notification.attempts == 4  # attempts is a monotonic fencing version
    assert notification.locked_until is None


def test_periodic_cleanup_removes_expired_hashes_even_without_telegram(lead_session):
    lead = add_lead(lead_session)
    now = datetime.now(UTC)
    lead_session.add_all(
        [
            LeadRateEvent(ip_digest=b"r" * 32, created_at=now - timedelta(hours=25)),
            LeadRateEvent(ip_digest=b"k" * 32, created_at=now),
            LeadIdempotency(
                key_digest=b"i" * 32,
                request_digest=b"d" * 32,
                lead_id=lead.id,
                created_at=now - timedelta(hours=25),
                expires_at=now - timedelta(seconds=1),
                receipt_expires_at=now - timedelta(seconds=1),
            ),
        ]
    )
    lead_session.commit()

    cleanup_expired_records(lead_session, now=now)

    assert lead_session.query(LeadRateEvent).count() == 1
    assert lead_session.query(LeadIdempotency).count() == 0


def test_cli_operations_are_bounded_and_update_only_selected_lead(lead_session):
    first = add_lead(lead_session)
    add_lead(lead_session)

    assert len(list_leads(lead_session, status="new", limit=1)) == 1
    assert get_lead(lead_session, "TC-000001").id == first.id
    assert set_status(lead_session, "TC-000001", "in_progress")
    assert get_lead(lead_session, "TC-000001").status == "in_progress"
    assert get_lead(lead_session, "TC-000002").status == "new"
    assert retry_notification(lead_session, "TC-000001")
    notification = lead_session.scalar(
        select(LeadNotification).where(LeadNotification.lead_id == first.id)
    )
    assert notification.status == "pending"
    assert notification.attempts == 0
    assert not retry_notification(lead_session, "TC-000099")
    with pytest.raises(ValueError):
        get_lead(lead_session, "TC-1; DROP TABLE leads")
    with pytest.raises(ValueError):
        list_leads(lead_session, status="new'; DROP TABLE leads; --")
