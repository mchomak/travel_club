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
        *(f"N{i:02}" for i in (*range(1, 30), *range(38, 60), *range(65, 72))),
    }
    codes = [question["code"] for question in bank["questions"]]
    assert len(codes) == 140
    assert set(codes) == expected
    assert len({hypothesis["code"] for hypothesis in bank["hypotheses"]}) == 28
    assert {hypothesis["code"] for hypothesis in bank["hypotheses"]} == {
        *(f"H{i:02}" for i in range(1, 24)),
        *(f"H{i:02}" for i in range(25, 29)),
        "H30",
    }
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


def test_v22_expanded_modules_have_source_links_and_the_four_category_matrix():
    configuration = load_configuration()
    bank = configuration["bank"]
    scenarios = configuration["scenarios"]
    assert bank["bank_version"] == scenarios["bank_version"] == scenarios["version"] == "2.2"
    questions = {question["code"]: question for question in bank["questions"]}
    hypotheses = {hypothesis["code"]: hypothesis for hypothesis in bank["hypotheses"]}
    modules = {module["code"]: module for module in scenarios["expanded_modules"]}
    assert set(modules) == {"A", "B", "C", "D", "E", "G", "H", "I", "J", "L"}
    expected_question_codes = {
        "A": [f"N{i:02}" for i in range(1, 7)],
        "B": [f"N{i:02}" for i in range(7, 12)],
        "C": [f"N{i:02}" for i in range(12, 18)],
        "D": [f"N{i:02}" for i in range(18, 24)],
        "E": [f"N{i:02}" for i in range(24, 30)],
        "G": [f"N{i:02}" for i in range(38, 43)],
        "H": [f"N{i:02}" for i in range(43, 48)],
        "I": [f"N{i:02}" for i in range(48, 54)],
        "J": [f"N{i:02}" for i in range(54, 60)],
        "L": [f"N{i:02}" for i in range(65, 72)],
    }
    expected_hypotheses = {
        "A": ["H18", "H20"], "B": ["H19"], "C": ["H21"], "D": ["H22"],
        "E": ["H23"], "G": ["H25"], "H": ["H26"], "I": ["H27"],
        "J": ["H28"], "L": ["H30"],
    }
    for module_code, module in modules.items():
        assert module["question_codes"] == expected_question_codes[module_code]
        assert module["hypothesis_ids"] == expected_hypotheses[module_code]
        assert all(
            questions[code]["module_code"] == module_code
            for code in module["question_codes"]
        )
    assert questions["N01"]["text"] == (
        "В последней сложной поездке на каком этапе вам больше всего не хватало помощи: "
        "при выборе направления, в разработке программы или уже в бронировании?"
    )
    assert questions["N01"]["follow_ups"] == [
        "Попросить вспомнить конкретную проблему, потери времени и способ решения."
    ]
    assert questions["N01"]["module_code"] == "A"
    assert questions["N01"]["hypothesis_ids"] == ["H18"]
    assert questions["N04"]["hypothesis_ids"] == ["H18", "H20"]
    assert questions["N71"]["module_code"] == "L"
    assert questions["N71"]["hypothesis_ids"] == ["H30"]
    assert hypotheses["H18"]["text"] == (
        "Design как отдельная консультация решает самостоятельный JTBD"
    )
    assert hypotheses["H30"]["text"] == (
        "Ценность компании и прозрачность полной стоимости Trips повышают качество заявок"
    )
    expected_categories = {
        "trips_experienced": {"E", "G", "I", "L"},
        "trips_beginner": {"E", "G", "I", "L"},
        "travel_design": {"A", "B", "C", "D", "E", "H", "I", "J"},
        "travel_ready": {"A", "B", "C", "D", "E", "G", "H", "I", "J"},
    }
    for category, expected_modules in expected_categories.items():
        actual_modules = {
            code for code, module in modules.items() if category in module["scenario_codes"]
        }
        assert actual_modules == expected_modules


def test_validator_reports_broken_expanded_module_codes_and_links():
    configuration = copy.deepcopy(load_configuration())
    modules = configuration["scenarios"]["expanded_modules"]
    modules[1]["code"] = "A"
    modules[2]["question_codes"].append("N99")
    modules[2]["hypothesis_ids"].append("H99")
    modules[2]["scenario_codes"].append("unknown_category")
    configuration["scenarios"]["bank_version"] = "1.0"
    next(question for question in configuration["bank"]["questions"] if question["code"] == "N43")[
        "module_code"
    ] = "unknown_module"

    issues = validate_configuration(configuration)

    assert "duplicate expanded module codes: A" in issues
    assert "missing expanded module codes: B" in issues
    assert "expanded module C references unknown questions: N99" in issues
    assert "expanded module C references unknown hypotheses: H99" in issues
    assert "expanded module C references unknown categories: unknown_category" in issues
    assert "question N43 references unknown expanded module: unknown_module" in issues
    assert "scenarios bank_version must match question bank bank_version" in issues


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
    assert "140" in result.stdout
    assert "28" in result.stdout


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


def test_validator_rejects_missing_or_blank_hypothesis_descriptions():
    for missing in (False, True):
        configuration = copy.deepcopy(load_configuration())
        hypothesis = configuration["bank"]["hypotheses"][0]
        if missing:
            hypothesis.pop("text")
        else:
            hypothesis["text"] = "   "

        issues = validate_configuration(configuration)

        assert any("hypothesis H01 has no text" in issue for issue in issues)


def test_validator_reports_non_string_scenario_codes():
    for invalid_code in (["trips_experienced"], {"code": "trips_experienced"}, 17, None):
        configuration = copy.deepcopy(load_configuration())
        configuration["scenarios"]["scenarios"][0]["code"] = invalid_code

        issues = validate_configuration(configuration)

        assert any("scenario entries must have string codes" in issue for issue in issues)


def test_validator_reports_non_object_configuration_root():
    issues = validate_configuration([])

    assert "research configuration must be a JSON object" in issues


def test_validator_reports_non_object_json_roots():
    for root_name in ("bank", "scenarios", "screening", "classification"):
        configuration = copy.deepcopy(load_configuration())
        configuration[root_name] = []

        issues = validate_configuration(configuration)

        assert f"{root_name} JSON root must be an object" in issues


def test_validator_reports_non_object_scenario_entries():
    configuration = copy.deepcopy(load_configuration())
    configuration["scenarios"]["scenarios"].extend([None, "invalid", []])

    issues = validate_configuration(configuration)

    assert "scenarios contains 3 non-object entries" in issues


def test_validator_reports_malformed_nested_sections_without_raising():
    cases = [
        ("scenarios", "optional_modules", None, "scenarios optional_modules must be an object"),
        (
            "scenarios",
            "docx_route_comparison",
            None,
            "scenarios docx_route_comparison must be a JSON array",
        ),
        (
            "screening",
            "additional_fields",
            None,
            "screening additional_fields must be a JSON array",
        ),
        ("screening", "goal", None, "screening goal must be an object"),
        ("classification", "categories", None, "classification categories must be a JSON array"),
        ("classification", "rules", None, "classification rules must be a JSON array"),
        (
            "classification",
            "goal_adjustments",
            [],
            "classification goal_adjustments must be an object",
        ),
        (
            "classification",
            "signal_strength",
            [],
            "classification signal_strength must be an object",
        ),
        (
            "classification",
            "no_signal_fallback",
            [],
            "classification no_signal_fallback must be an object",
        ),
    ]
    for root_name, section_name, malformed_value, expected_issue in cases:
        configuration = copy.deepcopy(load_configuration())
        configuration[root_name][section_name] = malformed_value

        issues = validate_configuration(configuration)

        assert expected_issue in issues


def test_validator_rejects_invalid_goal_adjustment_categories_and_points():
    cases = [
        ("not_a_category", 1, "references unknown category not_a_category"),
        (
            "trips_beginner",
            "1",
            "points for trips_beginner must be a positive integer",
        ),
        (
            "trips_beginner",
            0,
            "points for trips_beginner must be a positive integer",
        ),
        (
            "trips_beginner",
            -1,
            "points for trips_beginner must be a positive integer",
        ),
        (
            "trips_beginner",
            True,
            "points for trips_beginner must be a positive integer",
        ),
    ]
    for category, points, expected_issue in cases:
        configuration = copy.deepcopy(load_configuration())
        configuration["classification"]["goal_adjustments"]["trips"] = {
            category: points
        }

        issues = validate_configuration(configuration)

        assert any(expected_issue in issue for issue in issues)


def test_validator_rejects_unknown_priority_by_goal_keys():
    configuration = copy.deepcopy(load_configuration())
    configuration["classification"]["priority_by_goal"]["trip"] = list(
        configuration["classification"]["priority_by_goal"]["trips"]
    )

    issues = validate_configuration(configuration)

    assert any("priority_by_goal references unknown goal trip" in issue for issue in issues)


def test_validator_requires_ordered_signal_strength_thresholds():
    cases = [
        ("2", 4, "classification signal_strength low_max_score must be numeric"),
        (2, 2, "low_max_score must be less than medium_max_score"),
        (4, 2, "low_max_score must be less than medium_max_score"),
    ]
    for low_threshold, medium_threshold, expected_issue in cases:
        configuration = copy.deepcopy(load_configuration())
        configuration["classification"]["signal_strength"] = {
            "low_max_score": low_threshold,
            "medium_max_score": medium_threshold,
        }

        issues = validate_configuration(configuration)

        assert any(expected_issue in issue for issue in issues)


def test_validator_rejects_duplicate_categories_in_goal_priority():
    configuration = copy.deepcopy(load_configuration())
    priority = configuration["classification"]["priority_by_goal"]["trips"]
    priority.append(priority[0])

    issues = validate_configuration(configuration)

    assert any(
        "priority_by_goal must order each category exactly once" in issue for issue in issues
    )


def test_validator_rejects_duplicate_category_entries():
    configuration = copy.deepcopy(load_configuration())
    categories = configuration["classification"]["categories"]
    categories.append(copy.deepcopy(categories[0]))

    issues = validate_configuration(configuration)

    assert any(
        "classification categories must contain each category exactly once" in issue
        for issue in issues
    )


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
