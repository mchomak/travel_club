import pytest

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
