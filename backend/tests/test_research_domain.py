import pytest

from app.research_bank import load_configuration, validate_configuration
from app.research_domain import recommend_category


@pytest.mark.parametrize(
    ("answers", "goal", "category", "reason_fragment"),
    [
        (
            {"independent_trips_24m": 3, "group_experience": "yes"},
            "trips",
            "trips_experienced",
            "трёх самостоятельных",
        ),
        (
            {"independent_trips_24m": "0", "group_experience": "no"},
            "trips",
            "trips_beginner",
            "одна или ни одной",
        ),
        (
            {
                "preparation_difficulty": "itinerary_design",
                "paid_planning_services": "route_design",
            },
            "individual_services",
            "travel_design",
            "составлением маршрута",
        ),
        (
            {
                "preparation_difficulty": "booking_logistics",
                "paid_planning_services": "trip_organization",
                "organization_style": "organizer",
            },
            "individual_services",
            "travel_ready",
            "оплачивалась организация",
        ),
    ],
)
def test_classification_routes_are_deterministic_and_explained(
    answers, goal, category, reason_fragment
):
    result = recommend_category(answers, goal=goal)
    assert result["suggested_category"] == category
    assert result["alternative_category"] != category
    assert result["scores"][category] > result["scores"][result["alternative_category"]]
    assert result["suggested_score"] == result["scores"][category]
    assert result["reasons"]
    assert any(reason_fragment in reason for reason in result["reasons"])


def test_missing_evidence_uses_explicit_weak_fallback():
    result = recommend_category({}, goal="individual_services")
    assert result["suggested_category"] == "trips_beginner"
    assert result["alternative_category"] == "travel_design"
    assert result["signal_strength"] == "low"
    assert result["scores"] == {
        "trips_experienced": 0,
        "trips_beginner": 0,
        "travel_design": 0,
        "travel_ready": 0,
    }
    assert "мало данных" in result["reasons"][0].lower()


def test_goal_reason_is_readable_russian():
    result = recommend_category({"independent_trips_24m": 2}, goal="trips")
    assert "Цель исследования: Trips." in result["reasons"]


def test_upcoming_plans_alone_are_a_weak_trips_signal():
    result = recommend_category({"has_upcoming_plans": "yes"})
    assert result["suggested_category"] == "trips_beginner"
    assert result["scores"]["trips_beginner"] > 0
    assert result["signal_strength"] == "low"
    assert any("планы" in reason.lower() for reason in result["reasons"])


def test_validator_and_scorer_agree_when_integer_precision_matters():
    configuration = load_configuration()
    rules = configuration["classification"]
    rule = rules["rules"][0]
    rule["operator"] = "numeric_equals"
    rule["value"] = 9007199254740993
    independent_trips = next(
        field
        for field in configuration["screening"]["fields"]
        if field["key"] == "independent_trips_24m"
    )
    independent_trips["options"].append(
        {"value": "9007199254740992", "label": "precision boundary"}
    )

    issues = validate_configuration(configuration)
    result = recommend_category(
        {"independent_trips_24m": "9007199254740992"}, rules=rules
    )

    assert any("cannot match any configured option" in issue for issue in issues)
    assert result["scores"]["trips_experienced"] == 0


def test_numeric_alias_accepted_by_validator_scores_equivalently():
    configuration = load_configuration()
    rules = configuration["classification"]
    rules["rules"][0]["value"] = "threeplus"

    assert validate_configuration(configuration) == []
    alias_result = recommend_category({"independent_trips_24m": "3_plus"}, rules=rules)
    numeric_result = recommend_category({"independent_trips_24m": 3}, rules=rules)

    assert alias_result["scores"] == numeric_result["scores"]
