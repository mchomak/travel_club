from uuid import UUID

import pytest

from app.pricing import PricingError, calculate_trip
from app.schemas import TripInput
from app.trips import prepare_import
from tests.test_auth import HEADERS
from tests.test_trips import authenticated, create_trip, editable  # noqa: F401, F811


def test_import_remaps_ids_and_preserves_data():
    day = "11111111-1111-4111-8111-111111111111"
    item = "22222222-2222-4222-8222-222222222222"
    payload = TripInput.model_validate({
        "internal_title": "Япония", "start_date": "2027-04-01", "end_date": "2027-04-02",
        "participants": 2, "base_currency": "RUB",
        "days": [{"id": day, "date": "2027-04-01", "city": "Токио",
                  "map_leg_modes": [{"from_key": "day:start", "to_key": f"item:{item}:start",
                                     "mode": "walk"}]}],
        "items": [{"id": item, "day_id": day, "type": "activity", "title": "Музей",
                   "calculation_mode": "per_person", "currency": "RUB", "unit_price": "1500"}],
    })
    result = prepare_import(payload)
    assert len(result.days) == 2
    assert result.days[0].id != UUID(day)
    assert result.items[0].id != UUID(item)
    assert result.items[0].day_id == result.days[0].id
    assert result.days[0].map_leg_modes[0].to_key == f"item:{result.items[0].id}:start"
    assert calculate_trip(result).cost_total == 3000


def test_import_rejects_missing_day_and_duplicate_dates():
    data = {"internal_title": "Trip", "start_date": "2027-04-01", "end_date": "2027-04-02",
            "participants": 2,
            "days": [{"date": "2027-04-01"}, {"date": "2027-04-01"}]}
    with pytest.raises(PricingError):
        prepare_import(TripInput.model_validate(data))
    data["days"] = []
    data["items"] = [{"day_id": "11111111-1111-4111-8111-111111111111", "type": "other",
                      "title": "X", "calculation_mode": "fixed", "currency": "RUB"}]
    with pytest.raises(PricingError):
        prepare_import(TripInput.model_validate(data))


def test_import_creates_independent_trip_and_rejects_invalid_data(authenticated):  # noqa: F811
    original = create_trip(authenticated)
    source = editable(original)
    source.pop("version")
    source["items"] = [{"day_id": source["days"][0]["id"], "type": "activity",
                        "title": "Museum", "calculation_mode": "per_person",
                        "currency": "RUB", "unit_price": "120",
                        "map_url": "https://example.org/map",
                        "booking_url": "https://example.org/book",
                        "stages": [{"title": "Gallery", "start_time": "10:00"}]}]
    envelope = {"format": "travel-club-trip", "version": 1, "trip": source}
    response = authenticated.post("/api/trips/import", headers=HEADERS, json=envelope)
    assert response.status_code == 201, response.text
    imported = response.json()
    assert imported["id"] != original["id"]
    assert imported["days"][0]["id"] != original["days"][0]["id"]
    assert imported["items"][0]["day_id"] == imported["days"][0]["id"]
    assert imported["calculation"]["cost_total"] == "600.00"
    assert imported["items"][0]["map_url"] == "https://example.org/map"
    assert imported["items"][0]["booking_url"] == "https://example.org/book"
    assert imported["items"][0]["stages"][0]["title"] == "Gallery"
    assert authenticated.get(f"/api/trips/{imported['id']}").json() == imported
    before = len(authenticated.get("/api/trips").json())
    envelope["trip"]["items"][0]["currency"] = "USD"
    response = authenticated.post("/api/trips/import", headers=HEADERS, json=envelope)
    assert response.status_code == 422
    assert len(authenticated.get("/api/trips").json()) == before
    envelope["version"] = 2
    response = authenticated.post("/api/trips/import", headers=HEADERS, json=envelope)
    assert response.status_code == 422
