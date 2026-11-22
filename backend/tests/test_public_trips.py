from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from uuid import UUID, uuid4

from fastapi import Request
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy.schema import CreateSchema, DropSchema

from app.auth import require_admin
from app.db import Base, engine, get_db
from app.main import create_app
from app.models import User
from tests.test_auth import HEADERS
from tests.test_trips import authenticated as authenticated_fixture
from tests.test_trips import create_trip, editable

authenticated = authenticated_fixture


def test_curated_photos_survive_edit_copy_and_live_publication(authenticated):
    client = authenticated
    trip = create_trip(client, end_date="2026-10-02")
    path = f"/api/trips/{trip['id']}"
    token = client.post(path + "/public-link", headers=HEADERS).json()["token"]
    url = "/api/public/trips/" + token
    initial = client.get(url).json()
    assert initial["cover_photo_id"] is None
    assert [day["photo_id"] for day in initial["days"]] == [None, None]

    edit = editable(trip)
    edit["cover_photo_id"] = "tropical-coast"
    edit["days"][1]["photo_id"] = "thai-train"
    updated = client.put(path, headers=HEADERS, json=edit)
    assert updated.status_code == 200, updated.text
    assert client.get(path).json() == updated.json()
    for document in (
        client.get(path + "/public-preview").json(),
        client.get(url).json(),
        client.post(path + "/duplicate", headers=HEADERS).json(),
    ):
        assert document["cover_photo_id"] == "tropical-coast"
        assert [day["photo_id"] for day in document["days"]] == [None, "thai-train"]

    legacy = editable(updated.json())
    del legacy["cover_photo_id"]
    for day in legacy["days"]:
        del day["photo_id"]
    saved = client.put(path, headers=HEADERS, json=legacy)
    assert saved.status_code == 200, saved.text
    assert saved.json()["cover_photo_id"] == "tropical-coast"
    assert saved.json()["days"][1]["photo_id"] == "thai-train"
    edit = editable(saved.json())
    for obj, field in ((edit, "cover_photo_id"), (edit["days"][1], "photo_id")):
        old = obj[field]
        obj[field] = "https://example.org/private.jpg"
        assert client.put(path, headers=HEADERS, json=edit).status_code == 422
        obj[field] = old
    assert client.get(url).json()["days"][1]["photo_id"] == "thai-train"

    edit["end_date"] = edit["start_date"]
    conflict = client.put(path, headers=HEADERS, json=edit)
    assert conflict.status_code == 409
    assert conflict.json()["code"] == "DATE_REMOVAL_REQUIRED"
    edit["end_date"] = trip["end_date"]
    edit["cover_photo_id"] = edit["days"][1]["photo_id"] = None
    assert client.put(path, headers=HEADERS, json=edit).status_code == 200
    assert client.get(url).json() == initial


def test_public_link_lifecycle(authenticated):
    client = authenticated
    trip = create_trip(client, client_title="Weekend")
    admin_path = f"/api/trips/{trip['id']}/public-link"
    public_path = "/api/public/trips/"
    inactive = {"active": False, "token": None}
    assert client.get(admin_path).json() == inactive
    first = client.post(admin_path, headers=HEADERS)
    assert first.status_code == 200 and set(first.json()) == {"token"}
    first_token = first.json()["token"]
    assert first.headers["cache-control"] == "no-store"
    status = client.get(admin_path)
    assert status.headers["cache-control"] == "no-store"
    assert status.json() == {"active": True, "token": first_token}
    assert client.post(admin_path, headers=HEADERS).json() == first.json()
    assert client.get(public_path + first_token).json()["client_title"] == "Weekend"

    duplicate = client.post(f"/api/trips/{trip['id']}/duplicate", headers=HEADERS).json()
    assert client.get(f"/api/trips/{duplicate['id']}/public-link").json() == inactive
    second = client.post(admin_path + "/rotate", headers=HEADERS).json()["token"]
    assert first_token != second
    assert len(second) == 43
    assert client.get(public_path + second).json()["client_title"] == "Weekend"
    assert client.delete(admin_path).status_code == 403
    assert client.post(admin_path).status_code == 403
    assert client.post(admin_path + "/rotate").status_code == 403
    assert client.get(public_path + second).status_code == 200
    missing = client.get(public_path + ("A" * 43))
    assert missing.status_code == 404
    for invalid in [first_token, "bad-token", trip["id"]]:
        invalid_response = client.get(public_path + invalid)
        assert invalid_response.status_code == 404
        assert invalid_response.json() == missing.json()
        assert invalid_response.headers["cache-control"] == "no-store"

    assert client.delete(admin_path, headers=HEADERS).status_code == 204
    assert client.get(admin_path).json() == inactive
    assert client.get(public_path + second).json() == missing.json()
    assert client.delete(admin_path, headers=HEADERS).status_code == 204
    last = client.post(admin_path, headers=HEADERS).json()["token"]
    assert client.delete(f"/api/trips/{trip['id']}", headers=HEADERS).status_code == 204
    assert client.get(public_path + last).status_code == 404
    assert client.get(admin_path).status_code == 404


def test_only_an_admin_can_manage_links(client):
    path = f"/api/trips/{uuid4()}/public-link"
    assert client.get(path).status_code == 401
    assert client.post(path, headers=HEADERS).status_code == 401
    assert client.post(path + "/rotate", headers=HEADERS).status_code == 401
    assert client.delete(path, headers=HEADERS).status_code == 401


def test_anonymous_itinerary_is_live_and_allowlisted(authenticated):
    client = authenticated
    trip = create_trip(
        client,
        internal_title="PRIVATE TITLE",
        internal_note="PRIVATE NOTES",
        client_note="Pack a jacket",
        end_date="2026-10-02",
    )
    path = f"/api/trips/{trip['id']}"
    link = client.post(path + "/public-link", headers=HEADERS)
    assert link.status_code == 200
    url = "/api/public/trips/" + link.json()["token"]
    assert client.get(url).json()["client_title"] == ""

    edit = editable(trip)
    edit["client_title"] = "Autumn trip"
    day, next_day = edit["days"]
    day.update(
        title="Departure",
        city="Berlin",
        client_note="Meet at the station",
        status="PRIVATE STATUS",
        internal_note="PRIVATE DAY",
    )
    edit["items"] = [
        {
            "type": "train_bus",
            "day_id": day["id"],
            "end_day_id": next_day["id"],
            "calculation_mode": "fixed",
            "title": "Night train",
            "currency": "RUB",
            "description": "Sleeper",
            "start_time": "22:00",
            "end_time": "07:00",
            "location": "Central station",
            "client_note": "Platform 2",
            "included": False,
            "departure_city": "Berlin",
            "arrival_city": "Vienna",
            "departure_label": "Hauptbahnhof",
            "arrival_label": "Wien Hbf",
            "external_url": "https://example.org/PRIVATE",
            "internal_note": "PRIVATE ITEM",
        },
        {"type": "other", "calculation_mode": "fixed", "title": "Travel pack", "currency": "RUB"},
    ]
    updated = client.put(path, headers=HEADERS, json=edit)
    assert updated.status_code == 200, updated.text
    client.cookies.clear()
    assert client.get(path).status_code == 401
    response = client.get(url)
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    public = response.json()
    assert set(public) == {
        "client_title",
        "start_date",
        "end_date",
        "participants",
        "client_note",
        "days",
        "general_items",
        "cover_photo_id",
    }
    assert public["client_title"] == "Autumn trip" and public["client_note"] == "Pack a jacket"
    assert set(public["days"][0]) == {
        "date",
        "country",
        "city",
        "place",
        "title",
        "client_note",
        "items",
        "photo_id",
    }
    assert public["days"][0]["client_note"] == "Meet at the station"
    assert public["days"][0]["items"] == [
        {
            "type": "train_bus",
            "movement": None,
            "subtype": None,
            "title": "Night train",
            "description": "Sleeper",
            "location": "Central station",
            "client_note": "Platform 2",
            "departure_city": "",
            "arrival_city": "",
            "departure_label": "Hauptbahnhof",
            "arrival_label": "Wien Hbf",
            "start_time": "22:00:00",
            "end_time": "07:00:00",
            "end_date": "2026-10-02",
            "departure_utc_offset_minutes": None,
            "arrival_utc_offset_minutes": None,
            "check_in": None,
            "check_out": None,
            "check_in_time": None,
            "check_out_time": None,
            "map_place": None,
            "map_end_place": None,
            "external_url": None,
            "map_url": None,
            "booking_url": None,
            "stages": [],
        }
    ]
    assert [item["title"] for item in public["general_items"]] == ["Travel pack"]
    assert "PRIVATE" not in response.text
    assert trip["id"] not in response.text and day["id"] not in response.text


def test_public_schedule_preserves_hotel_and_local_arrival_dates(authenticated):
    client = authenticated
    trip = create_trip(client)
    path = f"/api/trips/{trip['id']}"
    edit = editable(trip)
    day = trip["days"][0]
    flight = {
        "type": "flight",
        "calculation_mode": "fixed",
        "day_id": day["id"],
        "currency": "RUB",
        "start_time": "23:00",
        "end_time": "22:00",
    }
    edit["items"] = [
        {**flight, "title": "Overnight", "position": 2},
        {
            **flight,
            "title": "Westbound",
            "position": 1,
            "departure_utc_offset_minutes": 180,
            "arrival_utc_offset_minutes": -240,
        },
        {
            "type": "hotel",
            "title": "Hotel",
            "calculation_mode": "hotel",
            "currency": "RUB",
            "check_in": "2026-10-01",
            "check_out": "2026-10-03",
            "capacity": 2,
            "check_in_time": "15:00",
            "check_out_time": "11:00",
        },
    ]
    saved = client.put(path, headers=HEADERS, json=edit)
    assert saved.status_code == 200, saved.text
    token = client.post(path + "/public-link", headers=HEADERS).json()["token"]
    public = client.get("/api/public/trips/" + token).json()
    westbound, overnight = public["days"][0]["items"]
    assert (westbound["title"], westbound["end_date"]) == ("Westbound", "2026-10-01")
    assert (westbound["departure_utc_offset_minutes"], westbound["arrival_utc_offset_minutes"]) == (
        180,
        -240,
    )
    assert (overnight["title"], overnight["end_date"]) == ("Overnight", "2026-10-02")
    [hotel] = public["general_items"]
    assert (hotel["check_in"], hotel["check_out"]) == ("2026-10-01", "2026-10-03")
    assert (hotel["check_in_time"], hotel["check_out_time"]) == ("15:00:00", "11:00:00")


def test_public_itinerary_omits_hidden_fields_after_item_type_changes(authenticated):
    client = authenticated
    trip = create_trip(client)
    path = f"/api/trips/{trip['id']}"
    edit = editable(trip)
    edit["items"] = [
        {
            "type": "flight",
            "calculation_mode": "fixed",
            "title": "Current rental",
            "currency": "RUB",
            "departure_city": "STALE flight origin",
            "arrival_city": "STALE flight destination",
        },
        {
            "type": "transfer",
            "calculation_mode": "fixed",
            "title": "Current flight",
            "currency": "RUB",
            "departure_label": "STALE pickup",
            "arrival_label": "STALE dropoff",
            "location": "STALE transfer route",
        },
        {
            "type": "activity",
            "calculation_mode": "fixed",
            "title": "Flight without cities",
            "currency": "RUB",
            "location": "STALE meeting location",
        },
        {
            "type": "hotel",
            "calculation_mode": "hotel",
            "title": "Current meeting",
            "currency": "RUB",
            "capacity": 2,
            "check_in": "2026-10-02",
            "check_out": "2026-10-03",
            "check_in_time": "14:15",
            "check_out_time": "11:30",
        },
        {
            "type": "transfer",
            "calculation_mode": "fixed",
            "title": "Current hotel",
            "currency": "RUB",
            "departure_label": "STALE terminal",
            "arrival_label": "STALE port",
            "start_time": "12:34",
            "end_time": "23:45",
        },
        {
            "type": "flight",
            "calculation_mode": "fixed",
            "title": "Legacy flight",
            "currency": "RUB",
            "location": "Dublin — Lisbon",
        },
        {
            "type": "hotel",
            "calculation_mode": "fixed",
            "title": "Legacy hotel",
            "currency": "RUB",
            "start_time": "15:30",
            "end_time": "20:00",
        },
    ]
    initial = client.put(path, headers=HEADERS, json=edit)
    assert initial.status_code == 200, initial.text

    edit = editable(initial.json())
    items = {item["title"]: item for item in edit["items"]}
    items["Current rental"].update(
        type="rental",
        departure_label="Rental counter",
        arrival_label="Central garage",
    )
    items["Current flight"].update(type="flight", arrival_city="Osaka")
    items["Flight without cities"].update(type="flight")
    items["Current meeting"].update(type="activity", calculation_mode="fixed", location="Cafe")
    items["Current hotel"].update(
        type="hotel",
        calculation_mode="hotel",
        capacity=2,
        check_in="2026-10-01",
        check_out="2026-10-04",
        check_in_time="15:00",
        check_out_time="11:00",
        location="Main square",
    )
    saved = client.put(path, headers=HEADERS, json=edit)
    assert saved.status_code == 200, saved.text
    preview = client.get(path + "/public-preview")
    assert preview.status_code == 200, preview.text
    private = {item["title"]: item for item in client.get(path).json()["items"]}
    assert private["Flight without cities"]["location"] == "STALE meeting location"
    assert private["Legacy flight"]["location"] == "Dublin — Lisbon"
    token = client.post(path + "/public-link", headers=HEADERS).json()["token"]
    client.cookies.clear()

    response = client.get("/api/public/trips/" + token)
    assert response.status_code == 200, response.text
    assert "STALE" not in response.text
    assert response.json() == preview.json()
    public = {item["title"]: item for item in response.json()["general_items"]}
    rental = public["Current rental"]
    assert rental["departure_label"] == "Rental counter"
    assert rental["arrival_label"] == "Central garage"
    flight = public["Current flight"]
    assert flight["arrival_city"] == "Osaka" and flight["location"] == ""
    meeting = public["Current meeting"]
    assert meeting["location"] == "Cafe"
    assert (meeting["check_in"], meeting["check_out"]) == (None, None)
    assert (meeting["check_in_time"], meeting["check_out_time"]) == (None, None)
    hotel = public["Current hotel"]
    assert hotel["location"] == "Main square"
    assert (hotel["check_in"], hotel["check_out"]) == ("2026-10-01", "2026-10-04")
    assert (hotel["start_time"], hotel["end_time"], hotel["end_date"]) == (None, None, None)
    assert public["Flight without cities"]["location"] == ""
    assert public["Legacy flight"]["location"] == ""
    assert public["Legacy hotel"]["start_time"] == "15:30:00"


def test_public_days_order_events_by_local_schedule_then_position(authenticated):
    client = authenticated
    trip = create_trip(client)
    path = f"/api/trips/{trip['id']}"
    edit = editable(trip)
    day_id = edit["days"][0]["id"]
    event = {"day_id": day_id, "calculation_mode": "fixed", "type": "activity", "currency": "RUB"}
    edit["items"] = [
        {**event, "title": "Untimed", "position": 0},
        {**event, "title": "Evening", "position": 1, "start_time": "17:00"},
        {**event, "title": "First morning event", "position": 2, "start_time": "09:00"},
        {
            **event,
            "title": "Westbound",
            "position": 3,
            "type": "flight",
            "start_time": "12:00",
            "end_time": "08:00",
            "departure_utc_offset_minutes": 180,
            "arrival_utc_offset_minutes": -240,
        },
        {**event, "title": "Second morning event", "position": 4, "start_time": "09:00"},
        {
            **event,
            "title": "Check in",
            "position": 5,
            "type": "hotel",
            "calculation_mode": "hotel",
            "capacity": 2,
            "check_in": "2026-10-01",
            "check_out": "2026-10-02",
            "check_in_time": "15:00",
        },
    ]
    updated = client.put(path, headers=HEADERS, json=edit)
    assert updated.status_code == 200, updated.text
    token = client.post(path + "/public-link", headers=HEADERS).json()["token"]
    client.cookies.clear()

    response = client.get("/api/public/trips/" + token)
    assert response.status_code == 200, response.text
    public = response.json()
    assert [item["title"] for item in public["days"][0]["items"]] == [
        "First morning event",
        "Second morning event",
        "Westbound",
        "Check in",
        "Evening",
        "Untimed",
    ]
    assert public["days"][1]["items"] == []


def test_admin_can_preview_public_itinerary_without_issuing_link(authenticated):
    client = authenticated
    trip = create_trip(client, client_title="Weekend", internal_note="PRIVATE NOTES")
    path = f"/api/trips/{trip['id']}"
    edit = editable(trip)
    edit["items"] = [
        {
            "type": "activity",
            "calculation_mode": "fixed",
            "title": "Walk",
            "currency": "RUB",
            "internal_note": "PRIVATE ITEM",
            "location": "Main square",
        },
    ]
    saved = client.put(path, headers=HEADERS, json=edit)
    assert saved.status_code == 200, saved.text
    preview = client.get(path + "/public-preview")
    assert preview.status_code == 200 and preview.headers["cache-control"] == "no-store"
    assert preview.json()["client_title"] == "Weekend"
    assert [item["title"] for item in preview.json()["general_items"]] == ["Walk"]
    assert "PRIVATE" not in preview.text
    assert client.get(path + "/public-link").json() == {"active": False, "token": None}
    assert client.get(f"/api/trips/{uuid4()}/public-preview").status_code == 404

    token = client.post(path + "/public-link", headers=HEADERS).json()["token"]
    client.cookies.clear()
    assert client.get(path + "/public-preview").status_code == 401
    assert client.get("/api/public/trips/" + token).json() == preview.json()


def test_two_tabs_issuing_first_link_receive_same_token():
    schema = f"test_link_race_{uuid4().hex}"
    isolated = engine.execution_options(schema_translate_map={None: schema})
    with engine.begin() as db:
        db.execute(CreateSchema(schema))
    try:
        Base.metadata.create_all(isolated)
        with Session(isolated, expire_on_commit=False) as db:
            user = User(login="test-link", password_hash="fixture-only")
            db.add(user)
            db.commit()

        ready = Barrier(2)

        def independent_db(request: Request):
            with Session(isolated) as session:
                if request.method == "POST" and request.url.path.endswith("/public-link"):
                    ready.wait(timeout=10)
                yield session

        application = create_app()
        application.dependency_overrides[get_db] = independent_db
        application.dependency_overrides[require_admin] = lambda: user
        with TestClient(application) as first, TestClient(application) as second:
            trip = create_trip(first)
            path = f"/api/trips/{trip['id']}/public-link"
            assert (
                first.get(path).json()
                == second.get(path).json()
                == {
                    "active": False,
                    "token": None,
                }
            )
            with ThreadPoolExecutor(max_workers=2) as pool:
                requests = [pool.submit(tab.post, path, headers=HEADERS) for tab in (first, second)]
                responses = [request.result(timeout=15) for request in requests]
            assert [response.status_code for response in responses] == [200, 200]
            token = responses[0].json()["token"]
            assert responses[1].json()["token"] == token
            assert second.get(path).json() == {"active": True, "token": token}
            assert first.get("/api/public/trips/" + token).status_code == 200
    finally:
        with engine.begin() as db:
            db.execute(DropSchema(schema, cascade=True))


def test_public_points_and_resource_are_safe_and_live(authenticated, db):
    from app.models import TripItem

    client = authenticated
    trip = create_trip(client)
    path = f"/api/trips/{trip['id']}"
    edit = editable(trip)
    point = {
        "name": "Station",
        "address": "PRIVATE address",
        "latitude": 55.75,
        "longitude": 37.61,
        "provider": "manual",
        "source_url": "https://example.org/PRIVATE",
    }
    edit["items"] = [
        {
            "type": "transfer",
            "day_id": trip["days"][0]["id"],
            "calculation_mode": "fixed",
            "title": "Ride",
            "currency": "RUB",
            "subtype": "taxi",
            "auto_transfer": {
                "from_key": "day:start",
                "to_key": "day:end",
                "mode": "drive",
                "duration_seconds": 540,
                "source_signature": "PRIVATE signature",
            },
            "map_place": point,
            "map_end_place": {**point, "name": "Hotel", "latitude": 56},
            "external_url": "https://example.org/ticket",
            "map_url": "https://example.org/map",
            "booking_url": "https://example.org/book",
            "internal_note": "PRIVATE note",
        }
    ]
    saved = client.put(path, headers=HEADERS, json=edit)
    assert saved.status_code == 200, saved.text
    token = client.post(path + "/public-link", headers=HEADERS).json()["token"]
    url = "/api/public/trips/" + token
    response = client.get(url)
    assert response.json() == client.get(path + "/public-preview").json()
    assert response.json()["days"][0]["items"] == []
    assert "PRIVATE" not in response.text
    edit = editable(saved.json())
    edit["items"][0]["auto_transfer"] = None
    saved = client.put(path, headers=HEADERS, json=edit)
    assert saved.status_code == 200, saved.text
    response = client.get(url)
    item = response.json()["days"][0]["items"][0]
    assert item["map_place"] == {"name": "Station", "latitude": 55.75, "longitude": 37.61}
    assert item["map_end_place"] == {"name": "Hotel", "latitude": 56, "longitude": 37.61}
    assert item["external_url"] is None
    assert item["map_url"] is None and item["booking_url"] is None
    assert item["subtype"] == "taxi" and "auto_transfer" not in item
    assert "duration_seconds" not in response.text
    assert "PRIVATE" not in response.text

    edit = editable(saved.json())
    edit["items"][0]["map_place"] = {**point, "name": "Updated"}
    edit["items"][0]["publish_external_url"] = True
    assert client.put(path, headers=HEADERS, json=edit).status_code == 200
    item = client.get(url).json()["days"][0]["items"][0]
    assert item["map_place"]["name"] == "Updated"
    assert item["external_url"] == "https://example.org/ticket"
    assert item["map_url"] == "https://example.org/map"
    assert item["booking_url"] == "https://example.org/book"

    # Legacy or corrupted persisted values must not make the public endpoint unsafe or fail.
    stored = db.get(TripItem, UUID(edit["items"][0]["id"]))
    stored.map_place = {"name": "Bad", "latitude": 91, "longitude": 0}
    stored.map_end_place = {"name": "Bad", "latitude": True, "longitude": 0}
    stored.external_url = "https://user:secret@example.org/"
    db.commit()
    response = client.get(url)
    assert response.status_code == 200
    item = response.json()["days"][0]["items"][0]
    assert item["map_place"] is None and item["map_end_place"] is None
    assert item["external_url"] is None and "secret" not in response.text


def test_public_point_validation_rejects_invalid_and_strips_metadata():
    from app.public_trips import public_point

    assert public_point(
        {"name": "Park", "latitude": 90, "longitude": -180, "address": "PRIVATE"}
    ).model_dump() == {
        "name": "Park",
        "latitude": 90,
        "longitude": -180,
    }
    for bad in (
        None,
        {},
        {"name": "", "latitude": 0, "longitude": 0},
        {"name": "x", "latitude": True, "longitude": 0},
        {"name": "x", "latitude": 91, "longitude": 0},
        {"name": "x", "latitude": 0, "longitude": float("nan")},
    ):
        assert public_point(bad) is None


def test_public_movement_requires_current_sources_and_sequence(authenticated):
    import json
    from datetime import date

    client = authenticated
    trip = create_trip(client)
    path = f"/api/trips/{trip['id']}"
    edit = editable(trip)
    day = edit["days"][0]
    first_id, second_id, transfer_id = (str(uuid4()) for _ in range(3))
    first = {
        "name": "Start",
        "address": "",
        "latitude": 55.0,
        "longitude": 37.0,
        "provider": "manual",
    }
    second = {
        "name": "Finish",
        "address": "",
        "latitude": 56.0,
        "longitude": 38.0,
        "provider": "manual",
    }
    epoch_minutes = (date.fromisoformat(day["date"]) - date(1970, 1, 1)).days * 1440

    def snapshot(point, clock):
        hour, minute = map(int, clock.split(":"))
        return {
            "date": day["date"],
            "time": clock,
            "available": epoch_minutes + hour * 60 + minute,
            "point": [point["latitude"], point["longitude"]],
            "schedule": ["excursion", clock, None, None, None, None, None, 180, 60],
        }

    signature = json.dumps(
        {
            "v": 1,
            "mode": "drive",
            "bounds": [edit["start_date"], edit["end_date"]],
            "from": snapshot(first, "09:00"),
            "to": snapshot(second, "11:00"),
        },
        separators=(",", ":"),
    )
    common = {
        "day_id": day["id"],
        "type": "excursion",
        "calculation_mode": "fixed",
        "currency": "RUB",
    }
    edit["items"] = [
        {
            **common,
            "id": first_id,
            "position": 0,
            "title": "First",
            "start_time": "09:00",
            "map_place": first,
        },
        {
            **common,
            "id": second_id,
            "position": 1,
            "title": "Second",
            "start_time": "11:00",
            "map_place": second,
        },
        {
            **common,
            "id": transfer_id,
            "position": 2,
            "type": "transfer",
            "subtype": "taxi",
            "title": "Ride",
            "start_time": "10:51",
            "end_time": "11:00",
            "map_place": first,
            "map_end_place": second,
            "internal_note": "PRIVATE NOTE",
            "auto_transfer": {
                "from_key": f"item:{first_id}:start",
                "to_key": f"item:{second_id}:start",
                "mode": "drive",
                "duration_seconds": 540,
                "source_signature": signature,
            },
        },
    ]
    saved = client.put(path, headers=HEADERS, json=edit)
    assert saved.status_code == 200, saved.text
    token = client.post(path + "/public-link", headers=HEADERS).json()["token"]
    url = "/api/public/trips/" + token

    def movement():
        response = client.get(url)
        assert response.json() == client.get(path + "/public-preview").json()
        assert "PRIVATE NOTE" not in response.text and "source_signature" not in response.text
        ride = next(
            (
                item
                for day in response.json()["days"]
                for item in day["items"]
                if item["title"] == "Ride"
            ),
            None,
        )
        return ride["movement"] if ride else None

    assert movement() == {"mode": "drive", "duration_seconds": 540}
    for change in ("place", "sequence", "signature", "late", "another_day", "manual_early"):
        modified = editable(saved.json())
        modified["version"] = client.get(path).json()["version"]
        if change == "place":
            modified["items"][0]["map_place"]["latitude"] = 54.0
        elif change == "sequence":
            modified["items"].append(
                {
                    **common,
                    "id": str(uuid4()),
                    "position": 3,
                    "title": "Inserted",
                    "start_time": "10:00",
                    "map_place": first,
                }
            )
        elif change == "signature":
            modified["items"][2]["auto_transfer"]["source_signature"] = "legacy-private-signature"
        elif change == "late":
            modified["items"][2]["start_time"] = "14:51"
            modified["items"][2]["end_time"] = "15:00"
        elif change == "another_day":
            modified["items"][2]["day_id"] = modified["days"][1]["id"]
        else:
            modified["items"][2]["start_time"] = "10:21"
            modified["items"][2]["end_time"] = "10:30"
        response = client.put(path, headers=HEADERS, json=modified)
        assert response.status_code == 200, response.text
        assert movement() == (
            {"mode": "drive", "duration_seconds": 540} if change == "manual_early" else None
        )


def test_movement_provenance_without_database():
    import json
    from datetime import date, time
    from types import SimpleNamespace

    from app.public_trips import current_movement

    day_date = date(2026, 10, 1)
    day_id = uuid4()
    ids = [uuid4(), uuid4()]
    places = [
        {"name": "A", "latitude": 55.0, "longitude": 37.0},
        {"name": "B", "latitude": 56.0, "longitude": 38.0},
    ]

    def event(index):
        return SimpleNamespace(
            id=ids[index],
            type="excursion",
            day_id=day_id,
            end_day_id=None,
            start_time=time(9 + 2 * index),
            end_time=None,
            map_place=places[index],
            map_end_place=None,
            position=index,
            auto_transfer=None,
            airport_before_minutes=180,
            airport_after_minutes=60,
            departure_utc_offset_minutes=None,
            arrival_utc_offset_minutes=None,
            check_in=None,
            check_out=None,
            check_in_time=None,
            check_out_time=None,
        )

    first, second = event(0), event(1)
    epoch_minutes = (day_date - date(1970, 1, 1)).days * 1440

    def snapshot(index):
        return {
            "date": str(day_date),
            "time": ["09:00", "11:00"][index],
            "available": epoch_minutes + [540, 660][index],
            "point": [places[index]["latitude"], places[index]["longitude"]],
            "schedule": [
                "excursion",
                ["09:00", "11:00"][index],
                None,
                None,
                None,
                None,
                None,
                180,
                60,
            ],
        }

    signature = json.dumps(
        {
            "v": 1,
            "mode": "drive",
            "bounds": [str(day_date)] * 2,
            "from": snapshot(0),
            "to": snapshot(1),
        }
    )
    transfer = SimpleNamespace(
        id=uuid4(),
        type="transfer",
        subtype="taxi",
        day_id=day_id,
        end_day_id=None,
        start_time=time(10, 51),
        end_time=time(11),
        map_place=places[0],
        map_end_place=places[1],
        auto_transfer={
            "from_key": f"item:{ids[0]}:start",
            "to_key": f"item:{ids[1]}:start",
            "mode": "drive",
            "duration_seconds": 540,
            "source_signature": signature,
        },
    )
    day = SimpleNamespace(id=day_id, date=day_date, map_leg_modes=[], map_start=None, map_end=None)
    trip = SimpleNamespace(start_date=day_date, end_date=day_date)
    rows = [first, second, transfer]
    assert current_movement(transfer, day, rows, trip).model_dump() == {
        "mode": "drive",
        "duration_seconds": 540,
    }
    second.map_place = {**places[1], "latitude": 57.0}
    assert current_movement(transfer, day, rows, trip) is None
    second.map_place = places[1]
    inserted = event(0)
    inserted.id, inserted.start_time = uuid4(), time(10)
    assert current_movement(transfer, day, [first, inserted, second, transfer], trip) is None
    transfer.auto_transfer["source_signature"] = "legacy-secret"
    assert current_movement(transfer, day, rows, trip) is None

    # A hotel checkout and a flight departure form a normal day-start connection.
    first.type = "hotel"
    first.start_time = None
    first.check_in, first.check_out = date(2026, 9, 30), day_date
    first.check_out_time = time(7)
    second.type = "flight"
    second.end_time = time(13)
    second.map_end_place = {"name": "Arrival", "latitude": 57.0, "longitude": 39.0}
    transfer.start_time, transfer.end_time = time(7, 51), time(8)
    hotel_snapshot = {
        "date": str(day_date),
        "time": "07:00",
        "available": epoch_minutes + 420,
        "point": [55.0, 37.0],
        "schedule": ["hotel", None, None, "2026-09-30", str(day_date), None, "07:00", 180, 60],
    }
    flight_snapshot = {
        "date": str(day_date),
        "time": "11:00",
        "available": epoch_minutes + 480,
        "point": [56.0, 38.0],
        "schedule": ["flight", "11:00", "13:00", None, None, None, None, 180, 60],
    }
    transfer.auto_transfer["source_signature"] = json.dumps(
        {
            "v": 1,
            "mode": "drive",
            "bounds": [str(day_date)] * 2,
            "from": hotel_snapshot,
            "to": flight_snapshot,
        }
    )
    assert current_movement(transfer, day, rows, trip).duration_seconds == 540
    second.airport_before_minutes = 120
    assert current_movement(transfer, day, rows, trip) is None

    # A flight arrival is followed by the airport exit buffer before the ride.
    first.type = "flight"
    first.check_in = first.check_out = first.check_out_time = None
    first.start_time, first.end_time = time(7), time(9)
    first.map_place = {"name": "Departure", "latitude": 54.0, "longitude": 36.0}
    first.map_end_place = places[0]
    second.type, second.end_time, second.map_end_place = "excursion", None, None
    second.airport_before_minutes = 180
    transfer.start_time, transfer.end_time = time(10, 51), time(11)
    transfer.auto_transfer["from_key"] = f"item:{ids[0]}:end"
    arrival_snapshot = {
        "date": str(day_date),
        "time": "09:00",
        "available": epoch_minutes + 600,
        "point": [55.0, 37.0],
        "schedule": ["flight", "07:00", "09:00", None, None, None, None, 180, 60],
    }
    transfer.auto_transfer["source_signature"] = json.dumps(
        {
            "v": 1,
            "mode": "drive",
            "bounds": [str(day_date)] * 2,
            "from": arrival_snapshot,
            "to": snapshot(1),
        }
    )
    assert current_movement(transfer, day, rows, trip).duration_seconds == 540
    first.airport_after_minutes = 120
    assert current_movement(transfer, day, rows, trip) is None


def test_public_midnight_transfer_uses_arrival_day_route_and_rejects_changed_place(authenticated):
    import json
    from datetime import date

    client = authenticated
    trip = create_trip(client)
    edit = editable(trip)
    day_before, route_day = edit["days"][:2]
    origin = {
        "name": "Hotel",
        "address": "",
        "latitude": 55.0,
        "longitude": 37.0,
        "provider": "manual",
    }
    target = {
        "name": "Station",
        "address": "",
        "latitude": 56.0,
        "longitude": 38.0,
        "provider": "manual",
    }
    route_day["map_start"] = origin
    event_id = str(uuid4())
    day_minutes = (date.fromisoformat(route_day["date"]) - date(1970, 1, 1)).days * 1440
    signature = json.dumps(
        {
            "v": 1,
            "mode": "drive",
            "bounds": [edit["start_date"], edit["end_date"]],
            "from": {
                "date": route_day["date"],
                "time": None,
                "available": None,
                "point": [55.0, 37.0],
                "schedule": [],
            },
            "to": {
                "date": route_day["date"],
                "time": "00:05",
                "available": day_minutes + 5,
                "point": [56.0, 38.0],
                "schedule": ["excursion", "00:05", None, None, None, None, None, 180, 60],
            },
        }
    )
    edit["items"] = [
        {
            "id": event_id,
            "day_id": route_day["id"],
            "type": "excursion",
            "title": "Station",
            "calculation_mode": "fixed",
            "currency": "RUB",
            "start_time": "00:05",
            "map_place": target,
        },
        {
            "id": str(uuid4()),
            "day_id": day_before["id"],
            "end_day_id": route_day["id"],
            "type": "transfer",
            "subtype": "taxi",
            "title": "Midnight ride",
            "calculation_mode": "fixed",
            "currency": "RUB",
            "start_time": "23:56",
            "end_time": "00:05",
            "map_place": origin,
            "map_end_place": target,
            "auto_transfer": {
                "from_key": "day:start",
                "to_key": f"item:{event_id}:start",
                "mode": "drive",
                "duration_seconds": 540,
                "source_signature": signature,
            },
        },
    ]
    path = f"/api/trips/{trip['id']}"
    saved = client.put(path, headers=HEADERS, json=edit)
    assert saved.status_code == 200, saved.text
    token = client.post(path + "/public-link", headers=HEADERS).json()["token"]
    url = "/api/public/trips/" + token
    assert client.get(url).json()["days"][0]["items"][0]["movement"] == {
        "mode": "drive",
        "duration_seconds": 540,
    }
    changed = editable(saved.json())
    changed["days"][1]["map_start"]["latitude"] = 54.0
    assert client.put(path, headers=HEADERS, json=changed).status_code == 200
    assert client.get(url).json()["days"][0]["items"] == []
