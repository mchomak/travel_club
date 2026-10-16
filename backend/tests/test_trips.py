import json
from copy import deepcopy
from decimal import Decimal
from uuid import UUID, uuid4

import pytest

from app.models import TripItem
from tests.conftest import FIXTURE_PASSWORD
from tests.test_auth import HEADERS
from tests.test_pricing import VECTORS


@pytest.fixture
def authenticated(client, admin):
    assert (
        client.post(
            "/api/auth/login",
            headers=HEADERS,
            json={"login": admin.login, "password": FIXTURE_PASSWORD},
        ).status_code
        == 200
    )
    return client


def create_trip(client, **fields):
    response = client.post(
        "/api/trips",
        headers=HEADERS,
        json={
            "internal_title": "Маршрут",
            "start_date": "2026-10-01",
            "end_date": "2026-10-05",
            "participants": 5,
            **fields,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def editable(document):
    fields = {"id", "created_by", "created_at", "updated_at", "calculation"}
    payload = {key: deepcopy(value) for key, value in document.items() if key not in fields}
    payload["items"] = [
        {
            key: value
            for key, value in item.items()
            if key not in {"original_amount", "normalized_amount", "rate_used"}
        }
        for item in document["items"]
    ]
    return payload


def test_map_places_and_day_preferences_roundtrip_and_duplicate(authenticated):
    trip = create_trip(authenticated)
    path = f"/api/trips/{trip['id']}"
    payload = editable(trip)
    place = {
        "name": "Hotel", "address": "Tokyo", "latitude": 35.68, "longitude": 139.76,
        "provider": "manual", "source_url": "https://example.com/place",
    }
    destination = {**place, "name": "Airport", "longitude": 140.39}
    item_id = str(uuid4())
    payload["days"][0].update(
        map_start=place, map_end=destination,
        map_leg_modes=[
            {"from_key": "day:start", "to_key": f"item:{item_id}:start", "mode": "walk"},
            {"from_key": f"item:{item_id}:end", "to_key": "day:end", "mode": "transit"},
        ],
    )
    payload["items"] = [{
        "id": item_id, "day_id": trip["days"][0]["id"], "type": "flight",
        "calculation_mode": "fixed", "title": "Flight", "currency": "RUB",
        "unit_price": "120", "map_place": place, "map_end_place": destination,
        "start_time": "23:00", "end_time": "02:00",
    }]
    response = authenticated.put(path, headers=HEADERS, json=payload)
    assert response.status_code == 200, response.text
    saved = response.json()
    assert saved["items"][0]["map_place"]["latitude"] == 35.68
    assert saved["items"][0]["map_end_place"]["name"] == "Airport"
    assert saved["calculation"]["cost_total"] == "120.00"
    assert authenticated.get(path).json() == saved
    repeated = authenticated.put(path, headers=HEADERS, json=editable(saved))
    assert repeated.status_code == 200, repeated.text
    saved = repeated.json()
    copied_response = authenticated.post(path + "/duplicate", headers=HEADERS)
    assert copied_response.status_code == 201, copied_response.text
    copied = copied_response.json()
    copied_item = copied["items"][0]
    assert copied_item["id"] != item_id
    assert copied_item["map_place"] == saved["items"][0]["map_place"]
    assert copied_item["map_end_place"] == saved["items"][0]["map_end_place"]
    assert copied["days"][0]["map_start"] == saved["days"][0]["map_start"]
    assert copied["days"][0]["map_end"] == saved["days"][0]["map_end"]
    assert copied["days"][0]["map_leg_modes"] == [
        {"from_key": "day:start", "to_key": f"item:{copied_item['id']}:start", "mode": "walk"},
        {"from_key": f"item:{copied_item['id']}:end", "to_key": "day:end", "mode": "transit"},
    ]
    assert copied["calculation"]["cost_total"] == "120.00"
    preview = authenticated.get(path + "/preview").text
    assert "map_place" not in preview and "map_start" not in preview


@pytest.mark.parametrize("field", ["map_start", "map_end", "map_leg_modes"])
def test_map_only_day_removal_needs_confirmation_and_preserves_other_days(authenticated, field):
    trip = create_trip(authenticated)
    path = f"/api/trips/{trip['id']}"
    payload = editable(trip)
    place = {
        "name": "Hotel", "address": "", "latitude": 35, "longitude": 139,
        "provider": "manual",
    }
    value = ([{"from_key": "day:start", "to_key": "day:end", "mode": "drive"}]
             if field == "map_leg_modes" else place)
    payload["days"][4][field] = value
    payload["days"][0]["map_start"] = place
    saved_response = authenticated.put(path, headers=HEADERS, json=payload)
    assert saved_response.status_code == 200, saved_response.text
    saved = saved_response.json()
    shortened = editable(saved)
    shortened.update(end_date="2026-10-03", days=[])
    rejected = authenticated.put(path, headers=HEADERS, json=shortened)
    assert rejected.status_code == 409, rejected.text
    assert rejected.json()["code"] == "DATE_REMOVAL_REQUIRED"
    assert rejected.json()["details"]["dates"] == ["2026-10-05"]
    assert authenticated.get(path).json() == saved
    confirmed = authenticated.put(
        path + "?confirm_date_removal=true", headers=HEADERS, json=shortened
    )
    assert confirmed.status_code == 200, confirmed.text
    assert len(confirmed.json()["days"]) == 3
    assert confirmed.json()["days"][0]["map_start"] == saved["days"][0]["map_start"]


def test_map_validation_rejects_invalid_places_and_preferences_atomically(authenticated):
    trip = create_trip(authenticated)
    path = f"/api/trips/{trip['id']}"
    base = editable(trip)
    place = {
        "name": "Hotel", "address": "", "latitude": 35, "longitude": 139,
        "provider": "manual",
    }
    for change in (
        {"name": ""}, {"name": " "}, {"name": "x" * 201}, {"address": "x" * 501},
        {"latitude": 91}, {"longitude": -181}, {"latitude": "NaN"},
        {"longitude": "Infinity"}, {"latitude": True}, {"latitude": "35"},
        {"provider": "unknown"}, {"provider_place_id": "x" * 301},
        {"source_url": "javascript:alert(1)"}, {"source_url": "https:///missing"},
        {"source_url": "https://user:password@example.com"},
        {"source_url": "https://example.com/" + "x" * 2000},
        {"source_url": "https://example.com/\x00"},
    ):
        payload = deepcopy(base)
        payload["days"][0]["map_start"] = {**place, **change}
        rejected = authenticated.put(path, headers=HEADERS, json=payload)
        assert rejected.status_code == 422, (change, rejected.text)
        assert authenticated.get(path).json() == trip

    leg = {"from_key": "day:start", "to_key": "day:end", "mode": "walk"}
    for modes in (
        [leg, {**leg, "mode": "drive"}], [leg] * 20003,
        [{**leg, "mode": "airplane"}], [{**leg, "to_key": "day:start"}],
        [{**leg, "from_key": "item:invalid:start"}],
    ):
        payload = deepcopy(base)
        payload["days"][0]["map_leg_modes"] = modes
        rejected = authenticated.put(path, headers=HEADERS, json=payload)
        assert rejected.status_code == 422, rejected.text
        assert authenticated.get(path).json() == trip

    # Stale identities can result from deleting or moving an event: keep the harmless preference.
    stale_key = f"item:{uuid4()}:end"
    base["days"][0]["map_leg_modes"] = [{**leg, "from_key": stale_key}]
    accepted = authenticated.put(path, headers=HEADERS, json=base)
    assert accepted.status_code == 200, accepted.text
    assert accepted.json()["days"][0]["map_leg_modes"][0]["from_key"] == stale_key


def test_meal_subtype_roundtrip_and_client_preview(authenticated):
    trip = create_trip(authenticated)
    path = f"/api/trips/{trip['id']}"
    payload = editable(trip)
    payload["items"] = [{
        "day_id": trip["days"][0]["id"],
        "type": "meal", "subtype": "restaurant", "calculation_mode": "per_person",
        "title": "Ужин", "currency": "RUB", "unit_price": "350",
    }]
    response = authenticated.put(path, headers=HEADERS, json=payload)
    assert response.status_code == 200, response.text
    item = response.json()["items"][0]
    assert item["type"] == "meal"
    assert item["subtype"] == "restaurant"
    assert response.json()["calculation"]["by_type"]["meal"] == "1750.00"
    assert response.json()["calculation"]["cost_total"] == "1750.00"
    assert authenticated.get(path).json()["items"][0] == item
    preview = authenticated.get(path + "/preview").json()["days"][0]["items"][0]
    assert preview["type"] == "meal"
    assert preview["subtype"] == "restaurant"
    assert "unit_price" not in preview
    assert "normalized_amount" not in preview


def test_item_subtype_and_airport_minutes_validation(authenticated):
    trip = create_trip(authenticated)
    path = f"/api/trips/{trip['id']}"
    base = editable(trip)
    base["items"] = [{
        "day_id": trip["days"][0]["id"], "type": "flight",
        "calculation_mode": "fixed", "title": "Рейс", "currency": "RUB",
    }]
    saved = authenticated.put(path, headers=HEADERS, json=base)
    assert saved.status_code == 200, saved.text
    flight = saved.json()["items"][0]
    assert flight["subtype"] is None
    assert (flight["airport_before_minutes"], flight["airport_after_minutes"]) == (180, 60)

    for invalid in (
        {"subtype": "restaurant"},
        {"airport_before_minutes": -1},
        {"airport_after_minutes": 1441},
        {"airport_after_minutes": None},
    ):
        payload = editable(saved.json())
        payload["items"][0].update(invalid)
        assert authenticated.put(path, headers=HEADERS, json=payload).status_code == 422

    payload = editable(saved.json())
    payload["items"][0].update({"airport_before_minutes": 0, "airport_after_minutes": 1440})
    changed = authenticated.put(path, headers=HEADERS, json=payload)
    assert changed.status_code == 200, changed.text
    assert changed.json()["items"][0]["airport_before_minutes"] == 0
    assert changed.json()["items"][0]["airport_after_minutes"] == 1440
    duplicate = authenticated.post(path + "/duplicate", headers=HEADERS)
    assert duplicate.status_code == 201, duplicate.text
    assert duplicate.json()["items"][0]["airport_before_minutes"] == 0
    assert duplicate.json()["items"][0]["airport_after_minutes"] == 1440


def test_schedule_fields_survive_save_reopen_duplicate_and_keep_preview_private(authenticated):
    client = authenticated
    trip = create_trip(client)
    path = f"/api/trips/{trip['id']}"
    payload = editable(trip)
    payload["days"][0]["status"] = "День вылета"
    payload["days"][1]["status"] = "День прилёта"
    payload["items"] = [
        {
            "id": str(uuid4()), "day_id": trip["days"][0]["id"],
            "end_day_id": trip["days"][1]["id"], "type": "flight",
            "calculation_mode": "fixed", "title": "Ночной рейс", "currency": "RUB",
            "unit_price": "120", "start_time": "23:00", "end_time": "02:00",
            "external_url": "https://example.com/ticket",
        },
        {
            "id": str(uuid4()), "day_id": trip["days"][1]["id"],
            "type": "hotel", "calculation_mode": "hotel", "title": "Отель",
            "currency": "RUB", "unit_price": "100", "capacity": 2,
            "check_in": "2026-10-02", "check_in_time": "15:00",
            "check_out": "2026-10-04", "check_out_time": "11:00",
            "external_url": "https://example.com/hotel",
        },
    ]
    response = client.put(path, headers=HEADERS, json=payload)
    assert response.status_code == 200, response.text
    saved = response.json()
    assert [day["status"] for day in saved["days"][:2]] == ["День вылета", "День прилёта"]
    flight = next(item for item in saved["items"] if item["type"] == "flight")
    hotel = next(item for item in saved["items"] if item["type"] == "hotel")
    assert flight["end_day_id"] == trip["days"][1]["id"]
    assert flight["external_url"] == "https://example.com/ticket"
    assert hotel["check_in_time"] == "15:00:00"
    assert hotel["check_out_time"] == "11:00:00"
    assert saved["calculation"]["cost_total"] == "720.00"
    assert client.get(path).json() == saved
    duplicate = client.post(path + "/duplicate", headers=HEADERS)
    assert duplicate.status_code == 201, duplicate.text
    copied = duplicate.json()
    assert copied["id"] != saved["id"]
    assert [day["status"] for day in copied["days"]] == [day["status"] for day in saved["days"]]
    copied_flight = next(item for item in copied["items"] if item["type"] == "flight")
    copied_hotel = next(item for item in copied["items"] if item["type"] == "hotel")
    assert copied_flight["end_day_id"] == copied["days"][1]["id"]
    assert copied_flight["end_day_id"] != flight["end_day_id"]
    assert copied_flight["start_time"] == "23:00:00"
    assert copied_flight["end_time"] == "02:00:00"
    assert copied_flight["external_url"] == "https://example.com/ticket"
    assert copied_hotel["check_in_time"] == "15:00:00"
    assert copied_hotel["check_out_time"] == "11:00:00"
    assert copied_hotel["external_url"] == "https://example.com/hotel"
    assert copied["calculation"]["cost_total"] == "720.00"
    assert client.get(f"/api/trips/{copied['id']}").json() == copied
    assert client.get(path).json() == saved
    preview = client.get(path + "/preview").json()
    assert "status" not in preview["days"][0]
    assert "end_day_id" not in preview["days"][0]["items"][0]
    assert "external_url" not in preview["days"][0]["items"][0]


def test_schedule_rejects_invalid_end_day_time_and_link_without_changing_trip(authenticated):
    client = authenticated
    trip = create_trip(client)
    other = create_trip(client)
    path = f"/api/trips/{trip['id']}"
    base = editable(trip)
    base["items"] = [{
        "id": str(uuid4()), "day_id": trip["days"][1]["id"],
        "type": "flight", "calculation_mode": "fixed", "title": "Рейс",
        "currency": "RUB", "unit_price": "50", "start_time": "18:00",
        "end_time": "20:00",
    }]
    for changes in (
        {"end_day_id": other["days"][2]["id"]},
        {"end_day_id": trip["days"][0]["id"]},
        {"end_day_id": trip["days"][1]["id"], "end_time": "17:00"},
        {"external_url": "javascript:alert(1)"},
        {"external_url": "https:///missing-host"},
        {"external_url": "https://example.com/has space"},
    ):
        invalid = deepcopy(base)
        invalid["items"][0].update(changes)
        response = client.put(path, headers=HEADERS, json=invalid)
        assert response.status_code == 422, response.text
        assert client.get(path).json() == trip
    # Older overnight records have no end_day_id and remain editable.
    base["items"][0].update(start_time="23:00", end_time="02:00")
    accepted = client.put(path, headers=HEADERS, json=base)
    assert accepted.status_code == 200, accepted.text
    assert accepted.json()["items"][0]["end_day_id"] is None
    assert accepted.json()["calculation"]["cost_total"] == "50.00"


def test_end_day_outside_trip_range_is_rejected_by_save_and_calculate(authenticated):
    client = authenticated
    trip = create_trip(client)
    path = f"/api/trips/{trip['id']}"
    invalid = editable(trip)
    outside = {**invalid["days"][4], "id": str(uuid4()), "date": "2026-10-06"}
    invalid["days"].append(outside)
    invalid["items"] = [{
        "id": str(uuid4()), "day_id": trip["days"][0]["id"],
        "end_day_id": outside["id"], "type": "flight", "calculation_mode": "fixed",
        "title": "Рейс", "currency": "RUB", "unit_price": "50",
        "start_time": "23:00", "end_time": "02:00",
    }]
    saved = client.put(path + "?confirm_date_removal=true", headers=HEADERS, json=invalid)
    assert saved.status_code == 422, saved.text
    assert client.get(path).json() == trip
    calculation = client.post(
        "/api/trips/calculate", headers=HEADERS,
        json={key: value for key, value in invalid.items() if key != "version"},
    )
    assert calculation.status_code == 422, calculation.text
    assert "день окончания" in calculation.json()["message"]


def test_shortening_trip_confirms_removal_of_end_day_and_crossing_hotel(authenticated):
    client = authenticated
    trip = create_trip(client)
    path = f"/api/trips/{trip['id']}"
    payload = editable(trip)
    payload["items"] = [
        {"id": str(uuid4()), "day_id": trip["days"][0]["id"],
         "end_day_id": trip["days"][4]["id"], "type": "flight",
         "calculation_mode": "fixed", "title": "Рейс", "currency": "RUB",
         "unit_price": "120", "start_time": "23:00", "end_time": "02:00"},
        {"id": str(uuid4()), "day_id": trip["days"][1]["id"],
         "type": "hotel", "calculation_mode": "hotel", "title": "Отель",
         "currency": "RUB", "unit_price": "100", "capacity": 5,
         "check_in": "2026-10-02", "check_out": "2026-10-05"},
    ]
    saved = client.put(path, headers=HEADERS, json=payload).json()
    assert saved["calculation"]["cost_total"] == "420.00"
    shorter = editable(saved)
    shorter["end_date"] = "2026-10-03"
    refused = client.put(path, headers=HEADERS, json=shorter)
    assert refused.status_code == 409
    assert refused.json()["code"] == "DATE_REMOVAL_REQUIRED"
    assert refused.json()["details"]["dates"] == ["2026-10-04", "2026-10-05"]
    assert client.get(path).json() == saved
    confirmed = client.put(path + "?confirm_date_removal=true", headers=HEADERS, json=shorter)
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["items"] == []
    assert confirmed.json()["calculation"]["cost_total"] == "0.00"
    assert client.get(path).json() == confirmed.json()


def test_shortening_trip_requires_confirmation_when_only_event_end_day_is_removed(authenticated):
    client = authenticated
    trip = create_trip(client)
    path = f"/api/trips/{trip['id']}"
    payload = editable(trip)
    payload["items"] = [{
        "id": str(uuid4()), "day_id": trip["days"][0]["id"],
        "end_day_id": trip["days"][4]["id"], "type": "flight",
        "calculation_mode": "fixed", "title": "Night flight", "currency": "RUB",
        "unit_price": "120", "start_time": "23:00", "end_time": "02:00",
    }]
    response = client.put(path, headers=HEADERS, json=payload)
    assert response.status_code == 200, response.text
    saved = response.json()

    shortened = editable(saved)
    shortened["end_date"] = "2026-10-04"
    refused = client.put(path, headers=HEADERS, json=shortened)
    assert refused.status_code == 409, refused.text
    assert refused.json()["code"] == "DATE_REMOVAL_REQUIRED"
    assert refused.json()["details"]["dates"] == ["2026-10-05"]
    assert client.get(path).json() == saved

    invalid = deepcopy(shortened)
    invalid["items"][0]["external_url"] = "javascript:alert(1)"
    rejected = client.put(path + "?confirm_date_removal=true", headers=HEADERS, json=invalid)
    assert rejected.status_code == 422, rejected.text
    assert client.get(path).json() == saved

    confirmed = client.put(path + "?confirm_date_removal=true", headers=HEADERS, json=shortened)
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["items"] == []
    assert confirmed.json()["calculation"]["cost_total"] == "0.00"
    assert client.get(path).json() == confirmed.json()


def test_trip_aggregate_crud_duplicate_preview_and_reopen(authenticated):
    client = authenticated
    trip = create_trip(client, internal_note="СЕКРЕТ поездки", client_note="Заметка клиенту")
    assert len(trip["days"]) == 5 and trip["version"] == 1
    assert trip["calculation"]["cost_total"] == "0.00"
    payload = editable(trip)
    payload["days"][0].update(
        country="Япония", city="Токио", internal_note="СЕКРЕТ дня", client_note="Дневная заметка"
    )
    payload["rates"] = [{"currency": "EUR", "rate": "96.20"}]
    payload["items"] = [
        {
            "id": str(uuid4()),
            "day_id": trip["days"][0]["id"],
            "type": "flight",
            "calculation_mode": "fixed",
            "title": "Ночной рейс",
            "unit_price": "10",
            "quantity": "2",
            "currency": "EUR",
            "position": 3,
            "internal_note": "СЕКРЕТ элемента",
            "client_note": "Окно",
            "start_time": "23:00",
            "end_time": "02:00",
        }
    ]
    response = client.put(f"/api/trips/{trip['id']}", headers=HEADERS, json=payload)
    assert response.status_code == 200, response.text
    saved = response.json()
    assert saved["version"] == 2 and saved["calculation"]["cost_total"] == "1924.00"
    assert saved["items"][0]["original_amount"] == "20.00"
    assert saved["items"][0]["normalized_amount"] == "1924.00"
    reopened = client.get(f"/api/trips/{trip['id']}").json()
    assert reopened == saved
    listed = client.get("/api/trips").json()[0]
    assert listed["countries"] == ["Япония"] and listed["cities"] == ["Токио"]
    preview = client.get(f"/api/trips/{trip['id']}/preview")
    assert preview.status_code == 200 and "СЕКРЕТ" not in preview.text
    assert preview.json()["client_note"] == "Заметка клиенту"
    assert preview.json()["days"][0]["client_note"] == "Дневная заметка"
    assert preview.json()["days"][0]["items"][0]["client_note"] == "Окно"
    forbidden = {"unit_price", "rates", "cost_total", "profit", "internal_note", "pricing_percent"}
    assert not any(f'"{key}"' in preview.text for key in forbidden)
    duplicate = client.post(f"/api/trips/{trip['id']}/duplicate", headers=HEADERS)
    assert duplicate.status_code == 201, duplicate.text
    copy = duplicate.json()
    assert copy["version"] == 1 and copy["id"] != trip["id"]
    assert copy["internal_title"] == "Маршрут — копия"
    assert {day["id"] for day in copy["days"]}.isdisjoint(day["id"] for day in trip["days"])
    assert copy["items"][0]["id"] != saved["items"][0]["id"]
    changed = editable(copy)
    changed["status"] = "archived"
    changed["items"][0]["unit_price"] = "1"
    assert client.put(f"/api/trips/{copy['id']}", headers=HEADERS, json=changed).status_code == 200
    assert client.get(f"/api/trips/{trip['id']}").json() == saved
    assert client.delete(f"/api/trips/{copy['id']}", headers=HEADERS).status_code == 204
    assert client.get(f"/api/trips/{copy['id']}").status_code == 404


def test_multi_day_api_totals_survive_reopen_and_recalculate_without_double_count(authenticated):
    client = authenticated
    trip = create_trip(client, participants=5)
    path = f"/api/trips/{trip['id']}"
    payload = editable(trip)
    payload["items"] = [
        {
            "id": str(uuid4()),
            "day_id": trip["days"][0]["id"],
            "type": "insurance",
            "calculation_mode": "per_person_per_day",
            "title": "Страховка на три дня",
            "currency": "RUB",
            "unit_price": "1.00",
            "quantity": "2",
            "duration_days": 3,
        }
    ]
    saved_response = client.put(path, headers=HEADERS, json=payload)
    assert saved_response.status_code == 200, saved_response.text
    saved = saved_response.json()
    assert saved["calculation"]["cost_total"] == "30.00"
    assert [day["total"] for day in saved["calculation"]["days"]] == [
        "10.00", "10.00", "10.00", "0.00", "0.00"
    ]
    assert client.get(path).json() == saved
    changed = editable(saved)
    changed["participants"] = 9
    grown_response = client.put(path, headers=HEADERS, json=changed)
    assert grown_response.status_code == 200, grown_response.text
    grown = grown_response.json()
    assert grown["calculation"]["cost_total"] == "54.00"
    assert [day["total"] for day in grown["calculation"]["days"]] == [
        "18.00", "18.00", "18.00", "0.00", "0.00"
    ]
    invalid = editable(grown)
    invalid["items"][0]["duration_days"] = 6
    rejected = client.put(path, headers=HEADERS, json=invalid)
    assert rejected.status_code == 422
    assert "число дней" in rejected.json()["message"]
    assert client.get(path).json() == grown
    shortened = editable(grown)
    shortened["end_date"] = "2026-10-02"
    rejected_shrink = client.put(
        path + "?confirm_date_removal=true", headers=HEADERS, json=shortened
    )
    assert rejected_shrink.status_code == 422
    assert "число дней" in rejected_shrink.json()["message"]
    assert client.get(path).json() == grown


def test_saved_legacy_overflow_stays_readable_until_admin_repairs_it(authenticated, db):
    client = authenticated
    trip = create_trip(client)
    path = f"/api/trips/{trip['id']}"
    payload = editable(trip)
    payload["items"] = [{
        "id": str(uuid4()), "day_id": trip["days"][2]["id"], "type": "rental",
        "calculation_mode": "per_day", "title": "Старый многодневный расход",
        "currency": "RUB", "unit_price": "1", "quantity": "1", "duration_days": 3,
    }]
    saved = client.put(path, headers=HEADERS, json=payload).json()
    stored = db.get(TripItem, UUID(saved["items"][0]["id"]))
    stored.day_id = UUID(trip["days"][4]["id"])
    db.commit()
    legacy = client.get(path)
    assert legacy.status_code == 200
    assert [day["total"] for day in legacy.json()["calculation"]["days"]] == [
        "0.00", "0.00", "0.00", "0.00", "3.00"
    ]
    assert client.put(path, headers=HEADERS, json=editable(legacy.json())).status_code == 422
    corrected = editable(legacy.json())
    corrected["items"][0]["day_id"] = trip["days"][2]["id"]
    repaired = client.put(path, headers=HEADERS, json=corrected)
    assert repaired.status_code == 200, repaired.text
    assert [day["total"] for day in repaired.json()["calculation"]["days"]] == [
        "0.00", "0.00", "1.00", "1.00", "1.00"
    ]


def test_versions_date_removal_and_omitted_days_protect_saved_data(authenticated):
    client = authenticated
    trip = create_trip(client)
    path = f"/api/trips/{trip['id']}"
    payload = editable(trip)
    payload["days"][4]["client_note"] = "Нельзя потерять"
    saved = client.put(path, headers=HEADERS, json=payload).json()
    conflict = client.put(path, headers=HEADERS, json=payload)
    assert conflict.status_code == 409 and conflict.json()["code"] == "VERSION_CONFLICT"
    assert client.get(path).json() == saved
    cleared = editable(saved)
    cleared["end_date"] = "2026-10-03"
    cleared["days"][4]["client_note"] = ""
    rejected = client.put(path, headers=HEADERS, json=cleared)
    assert rejected.status_code == 409
    shortened = editable(saved)
    shortened.update(end_date="2026-10-03", days=[])
    rejected = client.put(path, headers=HEADERS, json=shortened)
    assert rejected.status_code == 409, rejected.text
    assert rejected.json()["code"] == "DATE_REMOVAL_REQUIRED"
    assert rejected.json()["details"]["dates"] == ["2026-10-05"]
    assert client.get(path).json() == saved
    omitted = editable(saved)
    omitted["days"] = []
    unchanged = client.put(path, headers=HEADERS, json=omitted).json()
    assert unchanged["days"][4]["client_note"] == "Нельзя потерять"
    shortened["version"] = unchanged["version"]
    response = client.put(path + "?confirm_date_removal=true", headers=HEADERS, json=shortened)
    assert response.status_code == 200, response.text
    assert len(response.json()["days"]) == 3
    expanded = editable(response.json())
    expanded["end_date"] = "2026-10-06"
    response = client.put(path, headers=HEADERS, json=expanded)
    assert response.status_code == 200 and len(response.json()["days"]) == 6


def test_nested_ownership_validation_and_all_routes_require_session(authenticated):
    client = authenticated
    first = create_trip(client)
    second = create_trip(client)
    path = f"/api/trips/{second['id']}"
    payload = editable(second)
    payload["days"][0]["id"] = first["days"][0]["id"]
    response = client.put(path, headers=HEADERS, json=payload)
    assert response.status_code == 422
    assert client.get(path).json() == second
    payload = editable(second)
    payload["items"] = [
        {
            "id": str(uuid4()),
            "day_id": first["days"][0]["id"],
            "type": "other",
            "calculation_mode": "manual",
            "title": "Неверный день",
            "currency": "RUB",
            "unit_price": "100",
        }
    ]
    assert client.put(path, headers=HEADERS, json=payload).status_code == 422
    payload["items"][0].update(day_id=second["days"][0]["id"], currency="EUR")
    assert client.put(path, headers=HEADERS, json=payload).status_code == 422
    assert client.get(path).json() == second
    assert client.post("/api/auth/logout", headers=HEADERS).status_code == 204
    for method, route, body in [
        ("GET", "/api/trips", None),
        ("GET", path, None),
        ("GET", path + "/preview", None),
        ("POST", path + "/duplicate", None),
        ("DELETE", path, None),
        ("PUT", path, editable(second)),
        (
            "POST",
            "/api/trips",
            {
                "internal_title": "X",
                "start_date": "2026-10-01",
                "end_date": "2026-10-01",
                "participants": 1,
            },
        ),
        (
            "POST",
            "/api/trips/calculate",
            {key: value for key, value in editable(second).items() if key != "version"},
        ),
    ]:
        assert client.request(method, route, headers=HEADERS, json=body).status_code == 401


def test_validation_details_are_actionable_russian(authenticated):
    client = authenticated
    payload = editable(create_trip(client))
    payload.pop("version")
    for field, value, expected in [
        ("participants", 0, "Введите число больше 0"),
        ("participants", "пять", "Введите целое число"),
        ("internal_title", "", "Введите не меньше 1 символов"),
        ("base_currency", "EURO", "Введите код валюты из трёх заглавных латинских букв"),
        ("start_date", "не дата", "Введите дату в формате ГГГГ-ММ-ДД"),
        ("end_date", "2026-09-01", "Дата окончания должна быть не раньше даты начала"),
        ("pricing_percent", "NaN", "Введите конечное число"),
        ("pricing_percent", 1.5, "Передайте денежное значение строкой, например 100.00"),
    ]:
        invalid = {**payload, field: value}
        response = client.post("/api/trips/calculate", headers=HEADERS, json=invalid)
        assert response.status_code == 422, response.text
        assert response.json()["details"][0]["message"] == expected


def test_persisted_recalculation_people_rates_dates_modes_and_order(authenticated):
    client = authenticated
    saved = create_trip(client)
    path = f"/api/trips/{saved['id']}"
    payload = editable(saved)
    person_id, hotel_id, fixed_id = (str(uuid4()) for _ in range(3))
    payload["rates"] = [{"currency": "EUR", "rate": "100"}]
    payload["items"] = [
        {
            "id": person_id,
            "day_id": saved["days"][0]["id"],
            "position": 1,
            "title": "Билеты",
            "type": "flight",
            "calculation_mode": "per_person",
            "currency": "EUR",
            "unit_price": "10",
            "quantity": "2",
        },
        {
            "id": hotel_id,
            "day_id": saved["days"][0]["id"],
            "position": 0,
            "title": "Отель",
            "type": "hotel",
            "calculation_mode": "hotel",
            "currency": "EUR",
            "unit_price": "10",
            "capacity": 2,
            "check_in": "2026-10-01",
            "check_out": "2026-10-05",
        },
        {
            "id": fixed_id,
            "title": "Сбор",
            "type": "other",
            "calculation_mode": "fixed",
            "currency": "RUB",
            "unit_price": "30",
        },
    ]

    def save(expected):
        nonlocal payload
        response = client.put(path, headers=HEADERS, json=payload)
        assert response.status_code == 200, response.text
        result = response.json()
        assert result["calculation"]["cost_total"] == expected
        assert client.get(path).json() == result
        listed = next(row for row in client.get("/api/trips").json() if row["id"] == saved["id"])
        assert listed["cost_total"] == expected
        payload = editable(result)
        return result

    saved = save("22030.00")
    assert [item["id"] for item in saved["items"] if item["day_id"]] == [hotel_id, person_id]
    payload["participants"] = 3
    save("14030.00")
    payload["rates"][0]["rate"] = "80"
    save("11230.00")
    hotel = next(item for item in payload["items"] if item["id"] == hotel_id)
    hotel.update(check_in="2026-10-02", day_id=saved["days"][1]["id"])
    save("9630.00")
    person = next(item for item in payload["items"] if item["id"] == person_id)
    person.update(calculation_mode="manual", day_id=saved["days"][1]["id"], position=0)
    next(item for item in payload["items"] if item["id"] == hotel_id)["position"] = 1
    saved = save("5630.00")
    assert [item["id"] for item in saved["items"] if item["day_id"]] == [person_id, hotel_id]
    next(item for item in payload["items"] if item["id"] == hotel_id)["included"] = False
    saved = save("830.00")
    assert (
        next(item for item in saved["items"] if item["id"] == hotel_id)["normalized_amount"]
        == "4800.00"
    )
    payload.update(
        base_currency="USD",
        rates=[
            {"currency": "EUR", "rate": "2"},
            {"currency": "RUB", "rate": "0.01"},
        ],
    )
    saved = save("20.30")
    person = next(item for item in saved["items"] if item["id"] == person_id)
    assert person["original_amount"] == "10.00" and person["normalized_amount"] == "20.00"
    assert person["rate_used"] == "2.00000000"
    payload.update(pricing_mode="target_margin", pricing_percent="20")
    saved = save("20.30")
    assert saved["calculation"]["client_price"] == "25.38"
    assert saved["calculation"]["profit"] == "5.08"


def test_invalid_hotel_dates_fx_and_subgroup_never_change_saved_trip(authenticated):
    client = authenticated
    trip = create_trip(client)
    path = f"/api/trips/{trip['id']}"
    payload = editable(trip)
    payload["rates"] = [{"currency": "EUR", "rate": "100"}]
    payload["items"] = [
        {
            "id": str(uuid4()),
            "title": "Проживание",
            "type": "hotel",
            "calculation_mode": "hotel",
            "currency": "EUR",
            "unit_price": "10",
            "capacity": 2,
            "participants_override": 3,
            "check_in": "2026-10-01",
            "check_out": "2026-10-06",
        }
    ]
    response = client.put(path, headers=HEADERS, json=payload)
    assert response.status_code == 200, response.text
    saved = response.json()
    # Checkout on the day after the trip is valid and does not add a sixth day.
    assert len(saved["calculation"]["days"]) == 5
    assert saved["calculation"]["cost_total"] == "10000.00"
    for item_changes, trip_changes in [
        ({"check_in": "2026-09-30"}, {}),
        ({"check_out": "2026-10-07"}, {}),
        ({"check_out": "2026-10-01"}, {}),
        ({"check_out": None}, {}),
        ({"day_id": saved["days"][1]["id"]}, {}),
        ({"capacity": 0}, {}),
        ({}, {"participants": 2}),
        ({}, {"rates": []}),
        ({}, {"base_currency": "USD", "rates": []}),
        ({}, {"rates": [{"currency": "EUR", "rate": "0"}]}),
        ({}, {"rates": [{"currency": "EUR", "rate": "NaN"}]}),
        ({}, {"rates": [{"currency": "EUR", "rate": "100"}, {"currency": "RUB", "rate": "2"}]}),
    ]:
        invalid = editable(saved)
        invalid["items"][0].update(item_changes)
        invalid.update(trip_changes)
        rejected = client.put(path + "?confirm_date_removal=true", headers=HEADERS, json=invalid)
        assert rejected.status_code == 422, rejected.text
        assert client.get(path).json() == saved
    # Removing a general hotel from a shortened trip also requires explicit consent.
    shortened = editable(saved)
    shortened.update(end_date="2026-10-03", items=[])
    rejected = client.put(path, headers=HEADERS, json=shortened)
    assert rejected.status_code == 409 and rejected.json()["code"] == "DATE_REMOVAL_REQUIRED"
    assert rejected.json()["details"]["dates"] == ["2026-10-04", "2026-10-05"]
    assert client.get(path).json() == saved
    confirmed = client.put(path + "?confirm_date_removal=true", headers=HEADERS, json=shortened)
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["calculation"]["cost_total"] == "0.00"


@pytest.mark.parametrize(
    "case", json.loads(VECTORS.read_text(encoding="utf-8"))["cases"], ids=lambda case: case["name"]
)
def test_shared_examples_persist_through_http_and_postgres(authenticated, case):
    client = authenticated
    source = deepcopy(case["input"])
    created = create_trip(
        client,
        **{
            key: source[key]
            for key in ("internal_title", "start_date", "end_date", "participants", "base_currency")
        },
    )
    path = f"/api/trips/{created['id']}"
    response = client.put(path, headers=HEADERS, json={**source, "version": created["version"]})
    assert response.status_code == 200, response.text
    saved = response.json()
    assert client.get(path).json() == saved
    for field, expected in case["expected"].items():
        assert Decimal(saved["calculation"][field]) == Decimal(expected), field
    assert sum(Decimal(day["total"]) for day in saved["calculation"]["days"]) + Decimal(
        saved["calculation"]["general_total"]
    ) == Decimal(saved["calculation"]["cost_total"])
