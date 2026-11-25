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


def test_excursion_stage_schedule_issues_are_actionable_and_nonblocking():
    stages = [
        {
            "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            "title": "First",
            "start_time": "10:00",
            "end_time": "11:00",
        },
        {
            "id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            "title": "Second",
            "start_time": "09:30",
            "end_time": "10:30",
        },
        {
            "id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
            "title": "Third",
            "start_time": "12:00",
            "end_time": "12:30",
        },
        {
            "id": "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
            "title": "Fourth",
            "start_time": "13:00",
            "end_time": "13:00",
        },
        {"id": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", "title": "Fifth"},
    ]
    excursion = item(
        "22222222-2222-4222-8222-222222222222",
        type="excursion",
        start_time="09:00",
        end_time="14:00",
        stages=stages,
    )
    issues = validate_business_rules(trip([excursion]))
    for code, stage in [
        ("stage_out_of_order", stages[1]),
        ("stage_gap", stages[2]),
        ("stage_invalid_time", stages[3]),
        ("stage_missing_time", stages[4]),
    ]:
        issue = next(x for x in issues if x["code"] == code)
        assert issue["stage_id"] == stage["id"]
        assert issue["path"] == f"/trip/items/0/stages/{stages.index(stage)}"
        assert issue["severity"] in {"info", "warning"}
        assert not issue["affects_import"] and not issue["affects_calculation"]
    overlap = next(x for x in issues if x["code"] == "stage_overlap")
    assert overlap["stage_id"] == stages[0]["id"]
    assert overlap["path"] == "/trip/items/0/stages/0"


def test_excursion_schedule_boundaries_and_ambiguous_multiday():
    stages = [
        {"title": "First", "start_time": "10:00", "end_time": "11:00"},
        {"title": "Second", "start_time": "11:00", "end_time": "12:00"},
    ]
    excursion = item(
        "22222222-2222-4222-8222-222222222222",
        type="excursion",
        start_time="09:00",
        end_time="13:00",
        stages=stages,
    )
    codes = {x["code"] for x in validate_business_rules(trip([excursion]))}
    assert "stage_parent_mismatch" in codes
    assert "stage_gap" not in codes
    excursion.update(start_time="10:00", end_time="12:00")
    assert "stage_parent_mismatch" not in {
        x["code"] for x in validate_business_rules(trip([excursion]))
    }
    excursion.update(
        end_day_id="99999999-9999-4999-8999-999999999999",
        stages=[{"title": "Night", "start_time": "23:00", "end_time": "01:00"}],
    )
    # Stage dates are absent, so a multi-day interval cannot be interpreted safely.
    codes = {x["code"] for x in validate_business_rules(trip([excursion]))}
    assert not codes.intersection(
        {"stage_invalid_time", "stage_out_of_order", "stage_gap", "stage_parent_mismatch"}
    )


def test_stage_overlap_identity_and_path_follow_same_stage_after_reordering():
    stages = [
        {"id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "title": "A",
         "start_time": "10:00", "end_time": "11:00"},
        {"id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "title": "B",
         "start_time": "10:30", "end_time": "11:30"},
    ]
    excursion = item("22222222-2222-4222-8222-222222222222", type="excursion", stages=stages)
    first = next(
        x for x in validate_business_rules(trip([excursion])) if x["code"] == "stage_overlap"
    )
    excursion["stages"] = list(reversed(stages))
    second = next(
        x for x in validate_business_rules(trip([excursion])) if x["code"] == "stage_overlap"
    )
    assert first["id"] == second["id"]
    assert first["stage_id"] == second["stage_id"] == stages[0]["id"]
    assert first["path"] == "/trip/items/0/stages/0"
    assert second["path"] == "/trip/items/0/stages/1"


def test_excursion_meeting_point_accepts_map_place():
    excursion = item(
        "22222222-2222-4222-8222-222222222222", type="excursion", location="",
        map_place={"name": "Pier", "address": "Port", "latitude": 7.0, "longitude": 98.0,
                   "provider": "manual"},
    )
    issues = validate_business_rules(trip([excursion]), profile="detailed")
    assert not any(x["code"] == "missing_location" for x in issues)
    excursion["map_place"] = None
    assert any(x["code"] == "missing_location" for x in
               validate_business_rules(trip([excursion]), profile="detailed"))


def test_missing_stage_places_are_one_optional_advisory():
    stages = [
        {"id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "title": "First"},
        {"id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "title": "Second"},
    ]
    excursion = item("22222222-2222-4222-8222-222222222222", type="excursion", stages=stages)
    issues = validate_business_rules(trip([excursion]), profile="detailed")
    warnings = [x for x in issues if x["code"] == "stage_places_missing"]
    assert len(warnings) == 1
    assert warnings[0]["severity"] == "info"
    assert warnings[0]["stage_id"] == stages[0]["id"]
    assert warnings[0]["path"] == "/trip/items/0/stages/0"
    assert not warnings[0]["affects_import"] and not warnings[0]["affects_calculation"]
    assert not any(x["code"] == "stage_places_missing" for x in
                   validate_business_rules(trip([excursion]), profile="standard"))
    stages[0]["location"] = "Bay"
    assert not any(x["code"] == "stage_places_missing" for x in
                   validate_business_rules(trip([excursion]), profile="detailed"))


def test_modern_excursion_subtype_uses_excursion_rules_without_affecting_other_activities():
    value = item(
        "22222222-2222-4222-8222-222222222222", subtype="excursion", location="",
        map_place={"name": "Pier", "address": "Port", "latitude": 7.0, "longitude": 98.0,
                   "provider": "manual"},
        stages=[{"title": "First", "start_time": "10:00", "end_time": "10:00"},
                {"title": "Second"}],
    )
    codes = {x["code"] for x in validate_business_rules(trip([value]), profile="detailed")}
    assert {"stage_invalid_time", "stage_missing_time", "stage_places_missing"} <= codes
    assert "missing_location" not in codes
    value["subtype"] = "activity"
    other = {x["code"] for x in validate_business_rules(trip([value]), profile="detailed")}
    assert not other.intersection(
        {"stage_invalid_time", "stage_missing_time", "stage_places_missing"}
    )
    assert "missing_location" in other
