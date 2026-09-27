import json
from copy import deepcopy
from decimal import Decimal
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.pricing import PricingError, calculate_trip
from app.schemas import TripInput

VECTORS = Path(__file__).resolve().parents[2] / "shared" / "pricing-vectors.json"


def test_shared_pricing_vectors():
    for case in json.loads(VECTORS.read_text(encoding="utf-8"))["cases"]:
        result = calculate_trip(TripInput.model_validate(case["input"]))
        for field, expected in case["expected"].items():
            assert getattr(result, field) == Decimal(expected), (case["name"], field)
        assert sum(day.total for day in result.days) + result.general_total == result.cost_total


def test_distribution_validation_and_extreme_calendar_boundaries():
    vectors = json.loads(VECTORS.read_text(encoding="utf-8"))["cases"]
    for name, portions in [
        ("hotel_five_people_four_nights", ["30000", "30000", "30000", "30000", "0"]),
        ("tiny_hotel_0.02_4_nights", ["0", "0", "0", "0.02", "0"]),
        ("tiny_hotel_0.03_5_nights", ["0", "0", "0", "0", "0.03"]),
    ]:
        value = next(case["input"] for case in vectors if case["name"] == name)
        result = calculate_trip(TripInput.model_validate(value))
        assert [day.total for day in result.days] == [Decimal(amount) for amount in portions]
    initial = deepcopy(vectors[0]["input"])
    for field, value in [
        ("unit_price", "-1"),
        ("unit_price", "NaN"),
        ("unit_price", "Infinity"),
        ("unit_price", 1.2),
        ("quantity", "0"),
        ("capacity", 0),
        ("participants_override", 0),
    ]:
        invalid = deepcopy(initial)
        invalid["items"][0][field] = value
        with pytest.raises(ValidationError):
            TripInput.model_validate(invalid)
    for updates in [
        {"calculation_mode": "capacity"},
        {"participants_override": 4},
        {"currency": "EUR"},
        {"calculation_mode": "hotel"},
        {"unit_price": "999999999999", "quantity": "10000"},
    ]:
        invalid = deepcopy(initial)
        invalid["items"][0].update(updates)
        if "quantity" in updates:
            invalid["participants"] = 10000
        with pytest.raises(PricingError):
            calculate_trip(TripInput.model_validate(invalid))
    invalid = deepcopy(initial)
    invalid.update(pricing_mode="target_margin", pricing_percent="100")
    with pytest.raises(ValidationError):
        TripInput.model_validate(invalid)
    # A hotel-type manual item belongs wholly to its selected day, without hotel-date validation.
    value = deepcopy(initial)
    value["items"][0].update(
        type="hotel",
        calculation_mode="manual",
        unit_price="100",
        check_in="2020-01-01",
        check_out="2020-01-02",
        quantity="50",
    )
    result = calculate_trip(TripInput.model_validate(value))
    assert result.days[0].groups["accommodation"] == Decimal("100")
    # datetime.date's maximum must not overflow when checking checkout against end+1.
    value.update(start_date="9999-12-30", end_date="9999-12-31")
    value["days"][0]["date"] = "9999-12-30"
    value["days"].append(
        {**value["days"][0], "id": "00000000-0000-4000-8000-000000000099", "date": "9999-12-31"}
    )
    value["items"][0].update(
        calculation_mode="hotel", capacity=2, check_in="9999-12-30", check_out="9999-12-31"
    )
    assert calculate_trip(TripInput.model_validate(value)).cost_total == Decimal("200")
