import copy
import json
import subprocess
import sys
from pathlib import Path

from app.research_bank import load_configuration, validate_configuration


def test_question_bank_contains_the_complete_docx_inventory():
    path = Path(__file__).resolve().parents[1] / "app" / "research_data" / "questions.json"
    assert path.is_file(), "the imported question bank must be available to the backend"

    bank = json.loads(path.read_text(encoding="utf-8"))
    expected = {
        *(f"S{i:02}" for i in range(1, 7)),
        *(f"G{i:02}" for i in range(1, 13)),
        *(f"T{i:02}" for i in range(1, 17)),
        *(f"D{i:02}" for i in range(1, 13)),
        *(f"R{i:02}" for i in range(1, 13)),
        *(f"B{i:02}" for i in range(1, 13)),
        *(f"X{i:02}" for i in range(1, 13)),
    }
    codes = [question["code"] for question in bank["questions"]]
    assert len(codes) == 82
    assert set(codes) == expected
    assert len(bank["hypotheses"]) == 17
    assert all(question["text"].strip() for question in bank["questions"])
    assert all(
        {
            "code",
            "section",
            "text",
            "type",
            "options",
            "follow_ups",
            "hypothesis_ids",
            "interpretation",
            "answer_guidance",
        }
        <= question.keys()
        for question in bank["questions"]
    )


def test_bank_validation_command_accepts_the_imported_configuration():
    backend_root = Path(__file__).resolve().parents[1]
    result = subprocess.run(
        [sys.executable, "-m", "app.research_bank", "validate"],
        cwd=backend_root,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    assert "82" in result.stdout
    assert "17" in result.stdout


def test_validator_reports_missing_duplicate_unknown_and_broken_links():
    configuration = copy.deepcopy(load_configuration())
    bank = configuration["bank"]
    bank["questions"] = [question for question in bank["questions"] if question["code"] != "G12"]
    extra = copy.deepcopy(
        next(question for question in bank["questions"] if question["code"] == "G01")
    )
    bank["questions"].append(copy.deepcopy(extra))
    extra["code"] = "Q99"
    extra["hypothesis_ids"] = ["H99"]
    bank["questions"].append(extra)
    configuration["scenarios"]["scenarios"][0]["question_codes"].append("G99")
    configuration["scenarios"]["scenarios"][0]["docx_route_codes"].append("G98")

    issues = validate_configuration(configuration)
    assert any("missing question codes: G12" in issue for issue in issues)
    assert any("duplicate question codes: G01" in issue for issue in issues)
    assert any("unknown question codes: Q99" in issue for issue in issues)
    assert any("question Q99 references unknown hypotheses: H99" in issue for issue in issues)
    assert any(
        "scenario trips_experienced references unknown questions: G99" in issue for issue in issues
    )
    assert any(
        "scenario trips_experienced docx_route_codes references unknown questions: G98" in issue
        for issue in issues
    )


def test_validator_rejects_classification_rules_that_cannot_match():
    for operator in (None, "unsupported"):
        configuration = copy.deepcopy(load_configuration())
        rule = configuration["classification"]["rules"][0]
        if operator is None:
            rule.pop("operator")
        else:
            rule["operator"] = operator

        issues = validate_configuration(configuration)
        assert any(
            "classification rule three_or_more_independent_trips has unsupported operator"
            in issue
            for issue in issues
        )


def test_validator_rejects_unmatchable_rule_fields_and_values():
    cases = [
        ("field", "not_a_screening_field", "equals", "yes", "unknown screening field"),
        ("field", "group_experience", "equals", "purple", "cannot match any configured option"),
        (
            "field",
            "independent_trips_24m",
            "numeric_gte",
            100,
            "cannot match any configured option",
        ),
        ("field", "preparation_difficulty", "in", [], "requires a non-empty list"),
    ]
    for target, value, operator, comparison, expected_issue in cases:
        configuration = copy.deepcopy(load_configuration())
        rule = configuration["classification"]["rules"][0]
        rule[target] = value
        rule["operator"] = operator
        rule["value"] = comparison

        issues = validate_configuration(configuration)
        assert any(expected_issue in issue for issue in issues)


def test_validator_accepts_numeric_aliases_supported_by_classifier():
    configuration = copy.deepcopy(load_configuration())
    configuration["classification"]["rules"][0]["value"] = "threeplus"

    assert validate_configuration(configuration) == []


def test_validator_reports_non_string_scenario_and_hypothesis_refs():
    configuration = copy.deepcopy(load_configuration())
    scenario = configuration["scenarios"]["scenarios"][0]
    scenario["question_codes"].extend([123, {"unexpected": "G02"}])
    question = configuration["bank"]["questions"][0]
    question["hypothesis_ids"].append(["H01"])

    issues = validate_configuration(configuration)

    assert any(
        "scenario trips_experienced has non-string question codes" in issue for issue in issues
    )
    assert any("question S01 has non-string hypothesis references" in issue for issue in issues)


def test_screening_keeps_source_questions_separate_from_added_fields():
    configuration = load_configuration()
    bank_questions = {item["code"]: item for item in configuration["bank"]["questions"]}
    screening = configuration["screening"]
    expected_keys = {
        "name",
        "age_range",
        "city",
        "independent_trips_24m",
        "group_experience",
        "has_upcoming_plans",
        "paid_planning_services",
        "organization_style",
        "preparation_difficulty",
    }
    fields = {item["key"]: item for item in screening["fields"]}
    assert set(fields) == expected_keys
    assert len(fields) == 9
    for field in [*screening["fields"], *screening["additional_fields"]]:
        source = field.get("source", {})
        code = source.get("question_code")
        if code:
            assert source["question_text"] == bank_questions[code]["text"]
    for field in screening["fields"]:
        if field["control"] in {"radio", "select"}:
            values = {option["value"] for option in field["options"]}
            assert {"other", "unknown"} <= values
    assert screening["goal"]["key"] == "research_goal"
    assert {option["value"] for option in screening["goal"]["options"]} == {
        "trips",
        "individual_services",
    }


def test_scenario_order_matches_docx_and_offers_stay_disabled():
    configuration = load_configuration()
    scenarios = {item["code"]: item for item in configuration["scenarios"]["scenarios"]}
    assert scenarios["trips_experienced"]["question_codes"] == [
        "G01",
        "G02",
        "G05",
        "G06",
        "G07",
        "G10",
        "T01",
        "T03",
        "T04",
        "T07",
        "T10",
        "T14",
    ]
    assert scenarios["trips_beginner"]["question_codes"] == [
        "G01",
        "G04",
        "G05",
        "G06",
        "G10",
        "G12",
        "T02",
        "T05",
        "T06",
        "T08",
        "T14",
        "T15",
    ]
    assert scenarios["travel_design"]["question_codes"] == [
        "G01",
        "G04",
        "G07",
        "G08",
        "G10",
        "D01",
        "D02",
        "D04",
        "D05",
        "D07",
        "D08",
    ]
    assert scenarios["travel_ready"]["question_codes"] == [
        "G01",
        "G04",
        "G07",
        "G10",
        "R01",
        "R02",
        "R03",
        "R05",
        "R06",
        "R12",
    ]
    assert configuration["scenarios"]["optional_modules"]["offers"]["enabled"] is False
    assert configuration["scenarios"]["optional_modules"]["brand"]["append_to_end"] is True
    assert {item["scenario"] for item in configuration["scenarios"]["docx_route_comparison"]} >= {
        "trips_beginner",
        "travel_design",
        "travel_ready",
        "brand",
    }
