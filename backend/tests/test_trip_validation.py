from copy import deepcopy

from app.trip_validation import validate_trip_document


def valid_document():
    return {
        "format": "travel-club-trip", "version": 1,
        "trip": {
            "internal_title": "Trip", "start_date": "2027-04-01",
            "end_date": "2027-04-01", "participants": 2,
            "days": [{"id": "11111111-1111-4111-8111-111111111111", "date": "2027-04-01"}],
            "items": [{"day_id": "11111111-1111-4111-8111-111111111111",
                       "type": "activity", "title": "Museum", "calculation_mode": "per_person",
                       "currency": "RUB", "unit_price": "100"}],
        },
    }


def test_valid_document_runs_all_checks_without_mutation():
    document = valid_document()
    original = deepcopy(document)
    result = validate_trip_document(document)
    assert result == {
        "document_checks_passed": True,
        "issues": [],
        "skipped_stages": [],
        "unchecked_checks": ["persistence"],
        "checked_stages": ["envelope", "schema", "photos", "import", "schedule", "calculation"],
    }
    assert document == original


def test_multiple_schema_errors_are_reported_with_paths():
    document = valid_document()
    document["trip"]["participants"] = 0
    document["trip"]["items"][0]["currency"] = "bad"
    result = validate_trip_document(document)
    assert not result["document_checks_passed"]
    assert {issue["path"] for issue in result["issues"]} >= {
        "/trip/participants", "/trip/items/0/currency"}
    assert all(issue["severity"] == "error" for issue in result["issues"])
    assert result["checked_stages"] == ["envelope", "schema"]
    assert result["skipped_stages"] == ["photos", "import", "schedule", "calculation"]


def test_unreadable_and_unsupported_envelopes_are_critical():
    for document in ('{', {"format": "travel-club-trip", "version": 2, "trip": {}}):
        result = validate_trip_document(document)
        assert not result["document_checks_passed"]
        assert result["issues"][0]["severity"] == "critical"
        assert result["checked_stages"] == ["envelope"]


def test_calculation_failure_is_safe_and_does_not_claim_validity():
    document = valid_document()
    document["trip"]["items"][0]["currency"] = "USD"
    document["trip"]["items"][0]["title"] = "secret customer detail"
    original = deepcopy(document)
    result = validate_trip_document(document)
    assert not result["document_checks_passed"]
    assert result["issues"][0]["code"] == "calculation_error"
    assert result["issues"][0]["severity"] == "error"
    assert "secret customer detail" not in str(result)
    assert result["checked_stages"][-1] == "calculation"
    assert document == original


def test_invalid_photo_is_rejected_without_exposing_contents():
    document = valid_document()
    document["trip"]["days"][0]["photo_id"] = "upload-" + "a" * 32
    document["photos"] = {"upload-" + "a" * 32: "secret invalid photo"}
    result = validate_trip_document(document)
    assert not result["document_checks_passed"]
    assert result["issues"][0]["code"] == "invalid_photo"
    assert "secret invalid photo" not in str(result)
    assert result["skipped_stages"] == ["import", "schedule", "calculation"]


def test_schedule_date_overflow_is_reported():
    document = valid_document()
    document["trip"]["start_date"] = document["trip"]["end_date"] = "0001-01-01"
    document["trip"]["days"][0]["date"] = "0001-01-01"
    item = document["trip"]["items"][0]
    item.update({"type": "flight", "start_time": "00:00", "end_time": "01:00",
                 "departure_utc_offset_minutes": 60, "arrival_utc_offset_minutes": 60})
    result = validate_trip_document(document)
    assert not result["document_checks_passed"]
    assert result["issues"][0]["code"] == "schedule_error"
    assert result["skipped_stages"] == ["calculation"]


def test_boolean_version_is_rejected_even_if_schema_coerces_it():
    document = valid_document()
    document["version"] = True
    result = validate_trip_document(document)
    assert result["issues"][0]["code"] == "unsupported_envelope"


def test_oversized_photo_is_rejected_before_decoding(monkeypatch):
    import app.trip_validation as validation

    document = valid_document()
    photo_id = "upload-" + "a" * 32
    document["trip"]["days"][0]["photo_id"] = photo_id
    document["photos"] = {photo_id: "A" * 8}
    monkeypatch.setattr(validation, "MAX_UPLOAD", 1)

    def reject_decode(*args, **kwargs):
        raise AssertionError("oversized image was decoded")

    monkeypatch.setattr(validation.base64, "b64decode", reject_decode)
    result = validate_trip_document(document)
    assert result["issues"][0]["code"] == "invalid_photo"
