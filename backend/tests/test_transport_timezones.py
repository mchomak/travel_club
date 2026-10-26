from uuid import uuid4

import pytest

from tests.test_auth import HEADERS
from tests.test_trips import authenticated as authenticated_fixture
from tests.test_trips import create_trip, editable

authenticated = authenticated_fixture


@pytest.mark.parametrize("field", ["start_time", "end_time", "check_in_time", "check_out_time"])
def test_item_times_reject_embedded_timezone_with_actionable_validation(authenticated, field):
    trip = create_trip(authenticated)
    payload = editable(trip)
    payload["items"] = [{
        "day_id": trip["days"][0]["id"], "type": "flight", "title": "Local clocks",
        "calculation_mode": "fixed", "currency": "RUB", "start_time": "12:00",
        "end_time": "15:00", "departure_utc_offset_minutes": 180,
        "arrival_utc_offset_minutes": 180, field: "12:00+03:00",
    }]
    path = f"/api/trips/{trip['id']}"
    response = authenticated.put(path, headers=HEADERS, json=payload)
    assert response.status_code == 422, response.text
    assert "местное время" in response.text
    assert field in response.text
    assert authenticated.get(path).json()["version"] == trip["version"]
    assert authenticated.get(path).json()["items"] == []


def test_westbound_flight_offsets_roundtrip_and_duplicate(authenticated, db):
    from app.models import TripItem

    trip = create_trip(authenticated)
    payload = editable(trip)
    item_id = str(uuid4())
    payload["items"] = [{
        "id": item_id, "day_id": trip["days"][0]["id"], "type": "flight",
        "title": "Westbound", "calculation_mode": "fixed", "currency": "RUB",
        "unit_price": "120", "start_time": "12:00", "end_time": "10:00",
        "departure_utc_offset_minutes": 180, "arrival_utc_offset_minutes": -240,
    }]
    path = f"/api/trips/{trip['id']}"
    response = authenticated.put(path, headers=HEADERS, json=payload)
    assert response.status_code == 200, response.text
    saved = response.json()
    assert saved["items"][0]["departure_utc_offset_minutes"] == 180
    assert saved["items"][0]["arrival_utc_offset_minutes"] == -240
    assert saved["items"][0]["end_day_id"] is None
    assert authenticated.get(path).json() == saved
    stored = db.get(TripItem, item_id)
    assert stored.arrival_utc_offset_minutes == -240
    copied = authenticated.post(path + "/duplicate", headers=HEADERS).json()
    assert copied["items"][0]["departure_utc_offset_minutes"] == 180
    assert copied["items"][0]["arrival_utc_offset_minutes"] == -240
    assert copied["calculation"]["cost_total"] == "120.00"
    preview_item = authenticated.get(path + "/preview").json()["days"][0]["items"][0]
    assert preview_item["departure_utc_offset_minutes"] == 180
    assert preview_item["arrival_utc_offset_minutes"] == -240
    assert "unit_price" not in preview_item


@pytest.mark.parametrize("patch, error", [
    ({"arrival_utc_offset_minutes": None}, "оба смещения"),
    ({"departure_utc_offset_minutes": 841}, "840"),
    ({"arrival_utc_offset_minutes": -841}, "840"),
    ({"departure_utc_offset_minutes": 180.5}, "целое число"),
    ({"departure_utc_offset_minutes": True}, "целое число"),
    ({"arrival_utc_offset_minutes": 180, "end_time": "11:00"}, "по UTC"),
    ({"type": "activity"}, "только для переездов"),
])
def test_invalid_offsets_leave_trip_unchanged(authenticated, patch, error):
    trip = create_trip(authenticated)
    payload = editable(trip)
    payload["items"] = [{
        "day_id": trip["days"][0]["id"], "type": "flight", "title": "Invalid",
        "calculation_mode": "fixed", "currency": "RUB", "start_time": "12:00",
        "end_time": "10:00", "departure_utc_offset_minutes": 180,
        "arrival_utc_offset_minutes": -240, **patch,
    }]
    path = f"/api/trips/{trip['id']}"
    response = authenticated.put(path, headers=HEADERS, json=payload)
    assert response.status_code == 422, response.text
    assert error in response.text
    assert authenticated.get(path).json()["version"] == trip["version"]
    assert authenticated.get(path).json()["items"] == []


def test_date_line_and_midnight_offsets_keep_local_dates_and_legacy_null(authenticated):
    trip = create_trip(authenticated)
    payload = editable(trip)
    payload["items"] = [
        {"day_id": trip["days"][1]["id"], "end_day_id": trip["days"][0]["id"],
         "type": "flight", "title": "Date line", "calculation_mode": "fixed", "currency": "RUB",
         "start_time": "01:00", "end_time": "23:00", "departure_utc_offset_minutes": 840,
         "arrival_utc_offset_minutes": -600},
        {"day_id": trip["days"][0]["id"], "end_day_id": trip["days"][1]["id"],
         "type": "flight", "title": "Midnight", "calculation_mode": "fixed", "currency": "RUB",
         "start_time": "23:00", "end_time": "06:00", "departure_utc_offset_minutes": 180,
         "arrival_utc_offset_minutes": 420},
        {"day_id": trip["days"][0]["id"], "type": "flight", "title": "Legacy",
         "calculation_mode": "fixed", "currency": "RUB", "start_time": "23:00",
         "end_time": "01:00"},
    ]
    path = f"/api/trips/{trip['id']}"
    response = authenticated.put(path, headers=HEADERS, json=payload)
    assert response.status_code == 200, response.text
    items = {item["title"]: item for item in response.json()["items"]}
    assert items["Date line"]["end_day_id"] == trip["days"][0]["id"]
    assert items["Midnight"]["end_day_id"] == trip["days"][1]["id"]
    assert items["Legacy"]["departure_utc_offset_minutes"] is None
    assert items["Legacy"]["arrival_utc_offset_minutes"] is None
    assert items["Legacy"]["end_day_id"] is None


def test_offset_migration_preserves_populated_legacy_rows():
    import importlib.util
    from pathlib import Path

    import sqlalchemy as sa
    from alembic.migration import MigrationContext
    from alembic.operations import Operations

    from app.db import engine

    path = Path(__file__).resolve().parents[1] / "migrations/versions"
    spec = importlib.util.spec_from_file_location(
        "offset_migration", path / "e82b73ac51d9_transport_utc_offsets.py"
    )
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    schema = f"timezone_migration_{uuid4().hex}"
    with engine.connect() as connection:
        transaction = connection.begin()
        try:
            connection.execute(sa.text(f'CREATE SCHEMA "{schema}"'))
            connection.execute(sa.text(f'SET LOCAL search_path TO "{schema}"'))
            connection.execute(sa.text(
                "CREATE TABLE trip_items (id INTEGER PRIMARY KEY, type TEXT, "
                "title TEXT, unit_price NUMERIC(20,2))"
            ))
            connection.execute(sa.text(
                "INSERT INTO trip_items VALUES (1, 'flight', 'Legacy route', 123.45)"
            ))
            with Operations.context(MigrationContext.configure(connection)):
                migration.upgrade()
            row = connection.execute(sa.text("SELECT * FROM trip_items")).mappings().one()
            assert row["title"] == "Legacy route"
            assert str(row["unit_price"]) == "123.45"
            assert row["departure_utc_offset_minutes"] is None
            assert row["arrival_utc_offset_minutes"] is None
        finally:
            transaction.rollback()
