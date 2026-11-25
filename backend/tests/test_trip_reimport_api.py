from copy import deepcopy
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import insert, select

from app.db import get_db
from app.main import create_app
from app.models import Trip, TripRevisionSnapshot
from app.photo_storage import uploaded_photos
from app.pricing import PricingError
from app.trip_reimport_api import router
from tests.conftest import FIXTURE_PASSWORD
from tests.test_auth import HEADERS
from tests.test_trips import create_trip, editable


@pytest.fixture
def reimport_client(db, admin):
    app = create_app()
    app.include_router(router)
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as client:
        response = client.post("/api/auth/login", headers=HEADERS,
                               json={"login": admin.login, "password": FIXTURE_PASSWORD})
        assert response.status_code == 200
        yield client


def test_selected_change_conflict_and_restore(reimport_client, db):
    client = reimport_client
    saved = create_trip(client)
    path = f"/api/trips/{saved['id']}"
    trip = db.get(Trip, saved["id"])
    trip.public_link_token = "fixture-public-token"
    db.commit()
    exported = client.post(path + "/reimport/export", headers=HEADERS).json()
    proposed = deepcopy(exported["trip"])
    proposed["internal_title"] = "AI title"
    proposed["internal_note"] = "AI note"
    manual = editable(saved)
    manual["internal_note"] = "manual note"
    update = client.put(path, headers=HEADERS, json=manual)
    assert update.status_code == 200, update.text
    payload = {"snapshot_id": exported["snapshot_id"], "proposed": proposed}
    preview = client.post(path + "/reimport/preview", headers=HEADERS, json=payload)
    assert preview.status_code == 200, preview.text
    assert preview.json()["estimate_before"]["cost_total"] == "0.00"
    assert preview.json()["estimate_after"]["cost_total"] == "0.00"
    changes = {change["path"]: change for change in preview.json()["changes"]}
    assert changes["/internal_note"]["conflict"] is True
    assert changes["/internal_title"]["conflict"] is False
    apply = {**payload, "expected_version": update.json()["version"],
             "selected_paths": ["/internal_note"]}
    assert client.post(path + "/reimport/apply", headers=HEADERS, json=apply).status_code == 409
    apply["selected_paths"] = ["/internal_title"]
    applied = client.post(path + "/reimport/apply", headers=HEADERS, json=apply)
    assert applied.status_code == 200, applied.text
    assert applied.json()["trip"]["internal_title"] == "AI title"
    assert applied.json()["trip"]["internal_note"] == "manual note"
    assert db.get(Trip, saved["id"]).public_link_token == "fixture-public-token"
    history = client.get(path + "/reimport/backups")
    assert history.status_code == 200
    assert any(entry["id"] == applied.json()["backup_snapshot_id"] for entry in history.json())
    restore = client.post(path + "/reimport/restore", headers=HEADERS, json={
        "snapshot_id": applied.json()["backup_snapshot_id"],
        "expected_version": applied.json()["trip"]["version"],
    })
    assert restore.status_code == 200, restore.text
    assert restore.json()["trip"]["internal_title"] == saved["internal_title"]
    assert restore.json()["trip"]["internal_note"] == "manual note"
    assert db.get(Trip, saved["id"]).public_link_token == "fixture-public-token"
    assert client.post(path + "/reimport/apply", headers=HEADERS, json=apply).status_code == 409


def test_invalid_apply_is_atomic(reimport_client, db):
    client = reimport_client
    saved = create_trip(client)
    path = f"/api/trips/{saved['id']}"
    exported = client.post(path + "/reimport/export", headers=HEADERS).json()
    proposed = deepcopy(exported["trip"])
    proposed["participants"] = 0
    response = client.post(path + "/reimport/apply", headers=HEADERS, json={
        "snapshot_id": exported["snapshot_id"], "expected_version": saved["version"],
        "proposed": proposed, "selected_paths": ["/participants"],
    })
    assert response.status_code == 422
    assert client.get(path).json()["version"] == saved["version"]
    assert len(db.scalars(select(TripRevisionSnapshot).where(
        TripRevisionSnapshot.kind == "backup")).all()) == 0


def test_failure_during_persist_rolls_back_backup_and_changes(reimport_client, db, monkeypatch):
    client = reimport_client
    saved = create_trip(client)
    path = f"/api/trips/{saved['id']}"
    exported = client.post(path + "/reimport/export", headers=HEADERS).json()
    proposed = deepcopy(exported["trip"])
    proposed["internal_title"] = "new"

    def failing_persist(session, trip, payload, **kwargs):
        trip.internal_title = payload.internal_title
        session.flush()
        raise PricingError("fixture failure")

    monkeypatch.setattr("app.trip_reimport_api.persist", failing_persist)
    response = client.post(path + "/reimport/apply", headers=HEADERS, json={
        "snapshot_id": exported["snapshot_id"], "expected_version": saved["version"],
        "proposed": proposed, "selected_paths": ["/internal_title"],
    })
    assert response.status_code == 422
    assert client.get(path).json()["internal_title"] == saved["internal_title"]
    assert not db.scalars(select(TripRevisionSnapshot).where(
        TripRevisionSnapshot.kind == "backup")).all()


def test_snapshot_cannot_be_used_with_another_trip(reimport_client):
    client = reimport_client
    first = create_trip(client)
    second = create_trip(client)
    exported = client.post(f"/api/trips/{first['id']}/reimport/export", headers=HEADERS).json()
    response = client.post(f"/api/trips/{second['id']}/reimport/preview", headers=HEADERS,
                           json={"snapshot_id": exported["snapshot_id"],
                                 "proposed": exported["trip"]})
    assert response.status_code == 404


def test_unselected_photo_survives_apply_and_restore(reimport_client, db):
    client = reimport_client
    saved = create_trip(client)
    path = f"/api/trips/{saved['id']}"
    photo_id = "upload-" + "1" * 32
    db.execute(insert(uploaded_photos).values(
        id=photo_id, trip_id=saved["id"], content=b"fixture image"
    ))
    payload = editable(saved)
    payload["days"][0]["photo_id"] = photo_id
    saved = client.put(path, headers=HEADERS, json=payload).json()
    exported = client.post(path + "/reimport/export", headers=HEADERS).json()
    proposed = deepcopy(exported["trip"])
    proposed["internal_title"] = "changed"
    response = client.post(path + "/reimport/apply", headers=HEADERS, json={
        "snapshot_id": exported["snapshot_id"], "expected_version": saved["version"],
        "proposed": proposed, "selected_paths": ["/internal_title"],
    })
    assert response.status_code == 200, response.text
    applied = response.json()
    assert applied["trip"]["days"][0]["photo_id"] == photo_id
    restored = client.post(path + "/reimport/restore", headers=HEADERS, json={
        "snapshot_id": applied["backup_snapshot_id"],
        "expected_version": applied["trip"]["version"],
    })
    assert restored.status_code == 200, restored.text
    assert restored.json()["trip"]["days"][0]["photo_id"] == photo_id
    assert db.scalar(select(uploaded_photos.c.content).where(uploaded_photos.c.id == photo_id))


def test_preview_ignores_server_ordered_collection_reordering(reimport_client):
    client = reimport_client
    saved = create_trip(client)
    path = f"/api/trips/{saved['id']}"
    exported = client.post(path + "/reimport/export", headers=HEADERS).json()
    proposed = deepcopy(exported["trip"])
    proposed["days"].reverse()
    response = client.post(path + "/reimport/preview", headers=HEADERS, json={
        "snapshot_id": exported["snapshot_id"], "proposed": proposed,
    })
    assert response.status_code == 200, response.text
    assert response.json()["changes"] == []


def test_added_stage_is_persisted_at_proposed_position(reimport_client):
    client = reimport_client
    saved = create_trip(client)
    path = f"/api/trips/{saved['id']}"
    item_id, first, second, added = (str(uuid4()) for _ in range(4))
    payload = editable(saved)
    payload["items"] = [{
        "id": item_id, "title": "Activity", "type": "activity",
        "calculation_mode": "fixed", "currency": "RUB",
        "stages": [{"id": first, "title": "A"}, {"id": second, "title": "B"}],
    }]
    saved = client.put(path, headers=HEADERS, json=payload).json()
    exported = client.post(path + "/reimport/export", headers=HEADERS).json()
    proposed = deepcopy(exported["trip"])
    proposed["items"][0]["stages"].insert(0, {"id": added, "title": "X"})
    response = client.post(path + "/reimport/apply", headers=HEADERS, json={
        "snapshot_id": exported["snapshot_id"], "expected_version": saved["version"],
        "proposed": proposed, "selected_paths": [f"/items/{item_id}/stages/{added}"],
    })
    assert response.status_code == 200, response.text
    assert [x["id"] for x in client.get(path).json()["items"][0]["stages"]] == [
        added, first, second
    ]
