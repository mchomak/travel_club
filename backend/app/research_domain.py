from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from app.research_bank import load_classification_rules


def _number(value: Any) -> int | float | None:
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, (int, float)):
        return value
    normalized = str(value).strip().lower().replace(" ", "")
    if normalized in {"3+", "3_plus", "3ormore", "threeplus"}:
        return 3
    if normalized.endswith("+"):
        normalized = normalized[:-1]
    try:
        return float(normalized)
    except ValueError:
        return None


def _matches(value: Any, operator: str, expected: Any) -> bool:
    if value is None or value == "" or value == "unknown":
        return False
    if operator == "equals":
        return str(value).strip().casefold() == str(expected).strip().casefold()
    if operator == "in":
        if not isinstance(expected, list):
            return False
        return str(value).strip().casefold() in {
            str(option).strip().casefold() for option in expected
        }
    actual_number = _number(value)
    expected_number = _number(expected)
    if actual_number is None or expected_number is None:
        return False
    if operator == "numeric_gte":
        return actual_number >= expected_number
    if operator == "numeric_lte":
        return actual_number <= expected_number
    if operator == "numeric_equals":
        return actual_number == expected_number
    return False


def recommend_category(
    screening_answers: Mapping[str, Any],
    goal: str | None = None,
    rules: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Return a deterministic, explainable scenario recommendation from screening answers."""
    config = load_classification_rules() if rules is None else rules
    categories = [item["code"] for item in config["categories"]]
    scores = {category: 0 for category in categories}
    reasons: list[str] = []
    evidence_matched = False

    for rule in config["rules"]:
        answer = screening_answers.get(rule["field"])
        if _matches(answer, rule["operator"], rule["value"]):
            scores[rule["category"]] += rule["points"]
            reasons.append(rule["reason"])
            evidence_matched = True

    # The interviewer goal is a modest tie-break signal only when the answers
    # contain respondent evidence; it cannot manufacture evidence by itself.
    goal_adjustments = config.get("goal_adjustments", {}).get(goal or "", {})
    if evidence_matched:
        for category, points in goal_adjustments.items():
            if category in scores and isinstance(points, int) and points > 0:
                scores[category] += points
        if goal_adjustments:
            goal_label = "Trips" if goal == "trips" else "индивидуальные услуги"
            reasons.append(f"Цель исследования: {goal_label}.")

    if not evidence_matched:
        fallback = config["no_signal_fallback"]
        return {
            "suggested_category": fallback["suggested_category"],
            "alternative_category": fallback["alternative_category"],
            "scores": scores,
            "suggested_score": scores[fallback["suggested_category"]],
            "reasons": [fallback["reason"]],
            "signal_strength": fallback.get("signal_strength", "low"),
        }

    priorities = config.get("priority_by_goal", {}).get(goal, config["priority"])
    priority_index = {category: index for index, category in enumerate(priorities)}
    ordered = sorted(categories, key=lambda category: (-scores[category], priority_index[category]))
    suggested, alternative = ordered[:2]
    top_evidence_score = max(
        (scores[category] - goal_adjustments.get(category, 0) for category in categories),
        default=0,
    )
    thresholds = config.get("signal_strength", {})
    if top_evidence_score <= thresholds.get("low_max_score", 2):
        strength = "low"
    elif top_evidence_score <= thresholds.get("medium_max_score", 4):
        strength = "medium"
    else:
        strength = "high"

    return {
        "suggested_category": suggested,
        "alternative_category": alternative,
        "scores": scores,
        "suggested_score": scores[suggested],
        "reasons": reasons,
        "signal_strength": strength,
    }
