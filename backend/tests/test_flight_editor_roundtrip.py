from uuid import uuid4

from tests.test_auth import HEADERS
from tests.test_trips import authenticated as authenticated_fixture
from tests.test_trips import create_trip, editable

authenticated = authenticated_fixture


def test_complete_flight_survives_save_and_reopen(authenticated):
    trip = create_trip(authenticated)
    path = f"/api/trips/{trip['id']}"
    payload = editable(trip)
    payload["rates"] = [{"currency": "EUR", "rate": "100"}]
    stages = [
        {"id": str(uuid4()), "title": "Connection", "start_time": "15:00",
         "end_time": "16:00", "notes": "Change terminal"},
        {"id": str(uuid4()), "title": "Boarding", "start_time": "16:30",
         "end_time": "17:00", "notes": "Gate B"},
    ]
    departure = {"name": "Departure airport", "address": "Moscow", "latitude": 55.97,
                 "longitude": 37.41, "provider": "manual", "provider_place_id": None,
                 "source_url": "https://example.com/from"}
    arrival = {"name": "Arrival airport", "address": "Tokyo", "latitude": 35.55,
               "longitude": 139.78, "provider": "manual", "provider_place_id": None,
               "source_url": "https://example.com/to"}
    expected = {
        "id": str(uuid4()), "day_id": trip["days"][0]["id"],
        "end_day_id": trip["days"][1]["id"], "type": "flight", "title": "Flight",
        "calculation_mode": "fixed", "currency": "EUR", "unit_price": "123.45",
        "departure_country_code": "RU", "departure_city": "Moscow",
        "arrival_country_code": "JP", "arrival_city": "Tokyo",
        "departure_label": "Terminal A", "arrival_label": "Terminal B",
        "start_time": "23:00", "end_time": "15:00",
        "departure_utc_offset_minutes": 180, "arrival_utc_offset_minutes": 540,
        "airport_before_minutes": 120, "airport_after_minutes": 45,
        "stages": stages, "map_place": departure, "map_end_place": arrival,
        "external_url": "https://example.com/ticket", "map_url": "https://example.com/map",
        "booking_url": "https://example.com/booking", "publish_external_url": True,
        "description": "Overnight flight", "internal_note": "Internal", "client_note": "Client",
    }
    payload["items"] = [expected]
    response = authenticated.put(path, headers=HEADERS, json=payload)
    assert response.status_code == 200, response.text
    reopened = authenticated.get(path)
    assert reopened.status_code == 200, reopened.text
    document = reopened.json()
    assert document == response.json()
    flight = document["items"][0]
    for field, value in expected.items():
        if field in {"start_time", "end_time"}:
            value += ":00"
        assert flight[field] == value, field
    assert flight["original_amount"] == "123.45"
    assert flight["normalized_amount"] == "12345.00"
    assert document["calculation"]["cost_total"] == "12345.00"
