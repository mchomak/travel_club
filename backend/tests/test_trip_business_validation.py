from app.schemas import TripInput
from app.trip_business_validation import validate_business_rules


def test_stage_outside_parent_and_overlaps_are_reported():
    from app.schemas import TripInput

    trip = TripInput.model_validate({
        "internal_title": "Trip", "start_date": "2027-04-01", "end_date": "2027-04-01",
        "participants": 1, "items": [{"type": "excursion", "title": "Package",
            "calculation_mode": "fixed", "currency": "RUB", "unit_price": "10",
            "start_time": "10:00", "end_time": "12:00", "stages": [
                {"title": "First", "start_time": "09:00", "end_time": "10:30"},
                {"title": "Second", "start_time": "10:00", "end_time": "11:00"}]}]})
    codes = {issue["code"] for issue in validate_business_rules(trip)}
    assert "stage_outside_parent" in codes
    assert "stage_overlap" in codes


def trip(items=None):
    return TripInput.model_validate(
        {
            "internal_title": "Trip",
            "start_date": "2027-04-01",
            "end_date": "2027-04-01",
            "participants": 2,
            "days": [{"id": "11111111-1111-4111-8111-111111111111", "date": "2027-04-01"}],
            "items": items or [],
        }
    )


def item(id, **updates):
    return {
        "id": id,
        "day_id": "11111111-1111-4111-8111-111111111111",
        "type": "activity",
        "title": "Activity",
        "calculation_mode": "fixed",
        "currency": "RUB",
        "unit_price": "100",
        **updates,
    }


def test_pending_price_and_stable_issue_identity_after_reordering():
    a = item("22222222-2222-4222-8222-222222222222", price_pending=True, included=False)
    b = item("33333333-3333-4333-8333-333333333333")
    first = next(x for x in validate_business_rules(trip([a, b])) if x["code"] == "price_pending")
    second = next(x for x in validate_business_rules(trip([b, a])) if x["code"] == "price_pending")
    assert first["id"] == second["id"]
    assert first["path"] == "/trip/items/0/price_pending"
    assert second["path"] == "/trip/items/1/price_pending"
    assert first["affects_calculation"] is True


def test_missing_rate_and_capacity_reported_together():
    issues = validate_business_rules(
        trip(
            [
                item(
                    "22222222-2222-4222-8222-222222222222",
                    currency="USD",
                    calculation_mode="capacity",
                )
            ]
        )
    )
    assert {"missing_exchange_rate", "missing_capacity"} <= {x["code"] for x in issues}


def test_hotel_does_not_collide_and_touching_intervals_are_allowed():
    hotel = item(
        "22222222-2222-4222-8222-222222222222", type="hotel", start_time="08:00", end_time="18:00"
    )
    a = item("33333333-3333-4333-8333-333333333333", start_time="09:00", end_time="10:00")
    b = item("44444444-4444-4444-8444-444444444444", start_time="10:00", end_time="11:00")
    assert "schedule_overlap" not in {
        x["code"] for x in validate_business_rules(trip([hotel, a, b]))
    }
    b["start_time"] = "09:30"
    assert "schedule_overlap" in {x["code"] for x in validate_business_rules(trip([hotel, a, b]))}


def test_timezone_offsets_prevent_false_collision():
    a = item(
        "22222222-2222-4222-8222-222222222222",
        type="flight",
        start_time="10:00",
        end_time="11:00",
        departure_utc_offset_minutes=180,
        arrival_utc_offset_minutes=180,
    )
    b = item(
        "33333333-3333-4333-8333-333333333333",
        type="flight",
        start_time="10:00",
        end_time="11:00",
        departure_utc_offset_minutes=0,
        arrival_utc_offset_minutes=0,
    )
    assert "schedule_overlap" not in {x["code"] for x in validate_business_rules(trip([a, b]))}
    b["departure_utc_offset_minutes"] = b["arrival_utc_offset_minutes"] = 180
    assert "schedule_overlap" in {x["code"] for x in validate_business_rules(trip([a, b]))}


def test_separate_stages_are_heuristic_and_test_profile_does_not_require_bookings():
    a = item(
        "22222222-2222-4222-8222-222222222222",
        stages=[
            {"title": "One", "notes": "оплачивается отдельно"},
            {"title": "Two", "notes": "отдельная оплата"},
        ],
    )
    issues = validate_business_rules(trip([a]), profile="test")
    assert (
        next(x for x in issues if x["code"] == "possibly_separate_services")["severity"]
        == "warning"
    )
    assert not any("booking" in x["code"] for x in issues)


def test_overlap_identity_and_path_follow_same_item_after_reordering():
    a = item("22222222-2222-4222-8222-222222222222", start_time="09:00", end_time="11:00")
    b = item("33333333-3333-4333-8333-333333333333", start_time="10:00", end_time="12:00")
    first = next(
        x for x in validate_business_rules(trip([a, b])) if x["code"] == "schedule_overlap"
    )
    second = next(
        x for x in validate_business_rules(trip([b, a])) if x["code"] == "schedule_overlap"
    )
    assert first["id"] == second["id"]
    assert first["item_id"] == second["item_id"] == a["id"]
    assert first["path"] == "/trip/items/0"
    assert second["path"] == "/trip/items/1"
