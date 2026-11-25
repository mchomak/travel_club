from copy import deepcopy

from app.trip_soft_import import build_soft_candidate


def base():
    return {
        "internal_title": "Trip",
        "start_date": "2027-04-01",
        "end_date": "2027-04-02",
        "participants": 2,
        "base_currency": "RUB",
    }


def item(**values):
    return {
        "type": "activity",
        "title": "Museum",
        "calculation_mode": "fixed",
        "currency": "RUB",
        "unit_price": "10",
        **values,
    }


def test_valid_candidate_adds_calendar_and_preserves_source():
    raw = base() | {"items": [item()]}
    original = deepcopy(raw)
    result = build_soft_candidate(raw)
    assert raw == original
    assert result["trip"] is not None
    assert len(result["trip"].days) == 2
    assert len(result["trip"].items) == 1
    assert len(result["normalized"]) == 2
    assert not result["unapplied"]


def test_invalid_items_are_reported_and_never_given_confirmed_zero():
    raw = base() | {
        "items": [
            item(type="alien"),
            item(currency="USD"),
            {k: v for k, v in item().items() if k != "unit_price"},
            item(unit_price="bad"),
            item(extra="unknown"),
            {
                k: v
                for k, v in item(price_pending=True, included=False).items()
                if k != "unit_price"
            },
        ]
    }
    result = build_soft_candidate(raw)
    assert len(result["trip"].items) == 1
    assert result["trip"].items[0].price_pending
    assert {entry["path"] for entry in result["unapplied"]} >= {
        f"/trip/items/{i}" for i in range(5)
    }
    assert any(entry["path"] == "/trip/items/4/extra" for entry in result["unapplied"])


def test_missing_required_base_fields_and_unknown_fields_are_reported():
    raw = base()
    del raw["participants"]
    raw["surprise"] = "value"
    result = build_soft_candidate(raw)
    assert result["trip"] is None
    assert any(entry["path"] == "/trip/participants" for entry in result["unapplied"])
    assert any(entry["path"] == "/trip/surprise" for entry in result["unapplied"])


def test_duplicate_days_do_not_attach_items():
    identity = "11111111-1111-4111-8111-111111111111"
    raw = base() | {
        "days": [{"id": identity, "date": "2027-04-01"}, {"id": identity, "date": "2027-04-02"}],
        "items": [item(day_id=identity)],
    }
    result = build_soft_candidate(raw)
    assert result["trip"] is not None
    assert not result["trip"].items
    assert {entry["path"] for entry in result["unapplied"]} >= {
        "/trip/days/0",
        "/trip/days/1",
        "/trip/items/0",
    }


def test_example_and_status_normalization():
    import json
    from pathlib import Path

    example = Path(__file__).resolve().parents[2] / "docs/import_travel_docs/trip-json-example.json"
    raw = json.loads(example.read_text(encoding="utf-8"))["trip"]
    raw["status"] = "ready"
    result = build_soft_candidate(raw)
    assert result["trip"].status == "draft"
    assert len(result["trip"].items) == len(raw["items"])
    assert not result["unapplied"]
    assert {"path": "/trip/status", "code": "status_to_draft"} in result["normalized"]


def test_duplicate_item_ids_and_invalid_rates_are_reported():
    identity = "22222222-2222-4222-8222-222222222222"
    raw = base() | {
        "items": [item(id=identity), item(id=identity), item(currency="USD")],
        "rates": [{"currency": "USD", "rate": "0"}],
    }
    result = build_soft_candidate(raw)
    assert not result["trip"].items
    assert {entry["path"] for entry in result["unapplied"]} >= {
        "/trip/items/0",
        "/trip/items/1",
        "/trip/items/2",
        "/trip/rates/0",
    }
