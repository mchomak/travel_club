from tests.test_auth import HEADERS
from tests.test_trips import authenticated, create_trip, editable  # noqa: F401


def test_validation_is_bound_to_saved_trip_version(authenticated):  # noqa: F811
    trip = create_trip(authenticated)
    response = authenticated.get(f"/api/trips/{trip['id']}/validation")
    assert response.status_code == 200
    result = response.json()
    assert result["trip_id"] == trip["id"]
    assert result["version"] == trip["version"]
    assert any(issue["code"] == "missing_client_title" for issue in result["issues"])


def test_validation_requires_admin(client):
    response = client.get("/api/trips/11111111-1111-4111-8111-111111111111/validation")
    assert response.status_code == 401


def test_list_marks_estimate_incomplete_for_pending_price(authenticated):  # noqa: F811
    trip = create_trip(authenticated)
    payload = editable(trip)
    payload["items"] = [{"type": "activity", "title": "Тариф уточняется",
                         "calculation_mode": "fixed", "currency": "RUB",
                         "unit_price": "0", "included": False, "price_pending": True}]
    response = authenticated.put(f"/api/trips/{trip['id']}", headers=HEADERS, json=payload)
    assert response.status_code == 200
    listed = authenticated.get("/api/trips").json()
    assert next(item for item in listed if item["id"] == trip["id"])["estimate_incomplete"] is True
