from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent / "research_data"
EXPECTED_QUESTION_CODES = {
    *(f"S{number:02}" for number in range(1, 7)),
    *(f"G{number:02}" for number in range(1, 13)),
    *(f"T{number:02}" for number in range(1, 17)),
    *(f"D{number:02}" for number in range(1, 13)),
    *(f"R{number:02}" for number in range(1, 13)),
    *(f"B{number:02}" for number in range(1, 13)),
    *(f"X{number:02}" for number in range(1, 13)),
}
EXPECTED_HYPOTHESIS_CODES = {f"H{number:02}" for number in range(1, 18)}
EXPECTED_CATEGORIES = {
    "trips_experienced",
    "trips_beginner",
    "travel_design",
    "travel_ready",
}
SUPPORTED_CLASSIFICATION_OPERATORS = {
    "equals",
    "in",
    "numeric_gte",
    "numeric_lte",
    "numeric_equals",
}
EXPECTED_SCREENING_KEYS = {
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


def normalize_classification_number(value: Any) -> int | float | None:
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, (int, float)):
        return value
    normalized = str(value).strip().lower().replace(" ", "")
    if normalized in {"3+", "3_plus", "3ormore", "threeplus"}:
        return 3.0
    if normalized.endswith("+"):
        normalized = normalized[:-1]
    try:
        return float(normalized)
    except ValueError:
        return None


def _read_json(filename: str) -> dict[str, Any]:
    path = DATA_DIR / filename
    return json.loads(path.read_text(encoding="utf-8"))


def load_question_bank() -> dict[str, Any]:
    """Load the editable question and hypothesis bank."""
    return _read_json("questions.json")


def load_scenarios() -> dict[str, Any]:
    """Load interview question-code sequences and optional modules."""
    return _read_json("scenarios.json")


def load_screening() -> dict[str, Any]:
    """Load the editable preliminary questionnaire."""
    return _read_json("screening.json")


def load_classification_rules() -> dict[str, Any]:
    """Load the transparent category scoring rules."""
    return _read_json("classification.json")


def load_configuration() -> dict[str, dict[str, Any]]:
    return {
        "bank": load_question_bank(),
        "scenarios": load_scenarios(),
        "screening": load_screening(),
        "classification": load_classification_rules(),
    }


def _code_inventory(
    entries: Any,
    *,
    label: str,
    expected: set[str],
    issues: list[str],
) -> set[str]:
    if not isinstance(entries, list):
        issues.append(f"{label} must be a JSON array")
        return set()
    codes = [entry.get("code") for entry in entries if isinstance(entry, dict)]
    invalid_entries = len(entries) - len(codes)
    if invalid_entries:
        issues.append(f"{label} contains {invalid_entries} non-object entries")
    code_counts = Counter(code for code in codes if isinstance(code, str))
    duplicates = sorted(code for code, count in code_counts.items() if count > 1)
    missing = sorted(expected - set(code_counts))
    unknown = sorted(set(code_counts) - expected)
    if duplicates:
        issues.append(f"duplicate {label} codes: {', '.join(duplicates)}")
    if missing:
        issues.append(f"missing {label} codes: {', '.join(missing)}")
    if unknown:
        issues.append(f"unknown {label} codes: {', '.join(unknown)}")
    return set(code_counts)


def _validate_question_refs(
    refs: Any,
    *,
    label: str,
    known_codes: set[str],
    issues: list[str],
) -> None:
    if not isinstance(refs, list):
        issues.append(f"{label} must be a JSON array")
        return
    non_string_refs = sorted(repr(ref) for ref in refs if not isinstance(ref, str))
    if non_string_refs:
        issues.append(
            f"{label} has non-string question codes: {', '.join(non_string_refs)}"
        )
    unknown = sorted({ref for ref in refs if isinstance(ref, str) and ref not in known_codes})
    if unknown:
        issues.append(f"{label} references unknown questions: {', '.join(unknown)}")


def _classification_rule_is_matchable(
    rule: dict[str, Any], screening_fields: dict[str, dict[str, Any]], issues: list[str]
) -> None:
    rule_id = rule.get("id", "<unknown>")
    operator = rule.get("operator")
    if not isinstance(operator, str) or operator not in SUPPORTED_CLASSIFICATION_OPERATORS:
        issues.append(f"classification rule {rule_id} has unsupported operator")
        return

    field_key = rule.get("field")
    field = screening_fields.get(field_key) if isinstance(field_key, str) else None
    if field is None:
        issues.append(f"classification rule {rule_id} references an unknown screening field")
        return

    expected = rule.get("value")
    if operator == "in":
        if not isinstance(expected, list) or not expected:
            issues.append(f"classification rule {rule_id} operator 'in' requires a non-empty list")
            return
    elif operator.startswith("numeric_"):
        if normalize_classification_number(expected) is None:
            issues.append(f"classification rule {rule_id} has a non-numeric comparison value")
            return
    elif not isinstance(expected, (str, int, float)) or isinstance(expected, bool):
        issues.append(f"classification rule {rule_id} has an unsupported comparison value")
        return

    raw_options = field.get("options", [])
    if not isinstance(raw_options, list) or not raw_options:
        return
    options = [option.get("value") for option in raw_options if isinstance(option, dict)]
    if operator == "equals":
        expected_value = str(expected).strip().casefold()
        can_match = any(
            str(option).strip().casefold() == expected_value for option in options
        )
    elif operator == "in":
        expected_values = {
            str(value).strip().casefold()
            for value in expected
            if isinstance(value, (str, int, float)) and not isinstance(value, bool)
        }
        can_match = any(str(option).strip().casefold() in expected_values for option in options)
    else:
        expected_number = normalize_classification_number(expected)
        option_numbers = [
            number
            for option in options
            if (number := normalize_classification_number(option)) is not None
        ]
        if operator == "numeric_gte":
            can_match = any(number >= expected_number for number in option_numbers)
        elif operator == "numeric_lte":
            can_match = any(number <= expected_number for number in option_numbers)
        else:
            can_match = any(number == expected_number for number in option_numbers)
    if not can_match:
        issues.append(
            f"classification rule {rule_id} cannot match any configured option for {field_key}"
        )


def validate_configuration(
    configuration: dict[str, dict[str, Any]] | None = None,
) -> list[str]:
    """Return every structural or cross-file issue in a bank configuration."""
    if configuration is None:
        try:
            configuration = load_configuration()
        except (OSError, json.JSONDecodeError) as error:
            return [f"cannot load research JSON: {error}"]

    issues: list[str] = []
    bank = configuration.get("bank", {})
    scenarios = configuration.get("scenarios", {})
    screening = configuration.get("screening", {})
    classification = configuration.get("classification", {})

    question_entries = bank.get("questions")
    question_codes = _code_inventory(
        question_entries,
        label="question",
        expected=EXPECTED_QUESTION_CODES,
        issues=issues,
    )
    hypothesis_codes = _code_inventory(
        bank.get("hypotheses"),
        label="hypothesis",
        expected=EXPECTED_HYPOTHESIS_CODES,
        issues=issues,
    )

    hypotheses = bank.get("hypotheses")
    if isinstance(hypotheses, list):
        for hypothesis in hypotheses:
            if not isinstance(hypothesis, dict):
                continue
            code = hypothesis.get("code", "<unknown>")
            if not isinstance(hypothesis.get("text"), str) or not hypothesis["text"].strip():
                issues.append(f"hypothesis {code} has no text")

    if isinstance(question_entries, list):
        for question in question_entries:
            if not isinstance(question, dict):
                continue
            code = question.get("code", "<unknown>")
            if not isinstance(question.get("text"), str) or not question["text"].strip():
                issues.append(f"question {code} has no text")
            if not isinstance(question.get("options"), list):
                issues.append(f"question {code} options must be an array")
            if not isinstance(question.get("follow_ups"), list):
                issues.append(f"question {code} follow_ups must be an array")
            refs = question.get("hypothesis_ids", [])
            if not isinstance(refs, list):
                issues.append(f"question {code} hypothesis_ids must be an array")
                continue
            non_string_refs = sorted(repr(ref) for ref in refs if not isinstance(ref, str))
            if non_string_refs:
                issues.append(
                    f"question {code} has non-string hypothesis references: "
                    f"{', '.join(non_string_refs)}"
                )
            invalid_refs = sorted(
                {ref for ref in refs if isinstance(ref, str) and ref not in hypothesis_codes}
            )
            if invalid_refs:
                issues.append(
                    f"question {code} references unknown hypotheses: {', '.join(invalid_refs)}"
                )

    scenario_entries = scenarios.get("scenarios", [])
    if not isinstance(scenario_entries, list):
        issues.append("scenarios must be a JSON array")
        scenario_entries = []
    expected_scenarios = {"trips_experienced", "trips_beginner", "travel_design", "travel_ready"}
    raw_scenario_names = [
        entry.get("code", "<missing>") for entry in scenario_entries if isinstance(entry, dict)
    ]
    invalid_scenario_names = sorted(
        repr(code) for code in raw_scenario_names if not isinstance(code, str)
    )
    if invalid_scenario_names:
        issues.append(
            "scenario entries must have string codes: " + ", ".join(invalid_scenario_names)
        )
    scenario_names = [code for code in raw_scenario_names if isinstance(code, str)]
    duplicate_scenarios = sorted(
        code for code, count in Counter(scenario_names).items() if count > 1
    )
    if duplicate_scenarios:
        issues.append(f"duplicate scenario codes: {', '.join(duplicate_scenarios)}")
    missing_scenarios = sorted(expected_scenarios - set(scenario_names))
    unknown_scenarios = sorted(set(scenario_names) - expected_scenarios)
    if missing_scenarios:
        issues.append(f"missing scenarios: {', '.join(missing_scenarios)}")
    if unknown_scenarios:
        issues.append(f"unknown scenarios: {', '.join(unknown_scenarios)}")
    for scenario in scenario_entries:
        if not isinstance(scenario, dict):
            continue
        code = scenario.get("code", "<unknown>")
        refs = scenario.get("question_codes", [])
        if not isinstance(refs, list):
            issues.append(f"scenario {code} question_codes must be an array")
            continue
        _validate_question_refs(
            refs,
            label=f"scenario {code}",
            known_codes=question_codes,
            issues=issues,
        )
        string_refs = [ref for ref in refs if isinstance(ref, str)]
        duplicates = sorted(ref for ref, count in Counter(string_refs).items() if count > 1)
        if duplicates:
            issues.append(f"scenario {code} repeats question codes: {', '.join(duplicates)}")
        for key in ("screening_question_codes", "docx_route_codes", "provided_route_codes"):
            if key in scenario:
                _validate_question_refs(
                    scenario[key],
                    label=f"scenario {code} {key}",
                    known_codes=question_codes,
                    issues=issues,
                )

    optional_modules = scenarios.get("optional_modules", {})
    for module_name, module in optional_modules.items():
        if not isinstance(module, dict):
            issues.append(f"optional module {module_name} must be an object")
            continue
        refs = module.get("question_codes", [])
        if not isinstance(refs, list):
            issues.append(f"optional module {module_name} question_codes must be an array")
            continue
        _validate_question_refs(
            refs,
            label=f"optional module {module_name}",
            known_codes=question_codes,
            issues=issues,
        )
        if "docx_ecosystem_route" in module:
            _validate_question_refs(
                module["docx_ecosystem_route"],
                label=f"optional module {module_name} docx_ecosystem_route",
                known_codes=question_codes,
                issues=issues,
            )
        conditional = module.get("conditional_docx_questions", {})
        if isinstance(conditional, dict):
            for route, conditional_refs in conditional.items():
                _validate_question_refs(
                    conditional_refs,
                    label=f"optional module {module_name} conditional route {route}",
                    known_codes=question_codes,
                    issues=issues,
                )
    for comparison in scenarios.get("docx_route_comparison", []):
        if not isinstance(comparison, dict):
            continue
        for key in ("docx_adds", "conditional_offers", "docx_route"):
            if key in comparison:
                _validate_question_refs(
                    comparison[key],
                    label=f"DOCX route comparison {comparison.get('scenario', '<unknown>')} {key}",
                    known_codes=question_codes,
                    issues=issues,
                )
    offers = optional_modules.get("offers", {})
    if isinstance(offers, dict) and offers.get("enabled") is not False:
        issues.append(
            "offers module must remain disabled until real prices and terms are available"
        )

    fields = screening.get("fields", [])
    if not isinstance(fields, list):
        issues.append("screening fields must be a JSON array")
        fields = []
    field_keys = [entry.get("key") for entry in fields if isinstance(entry, dict)]
    missing_fields = sorted(EXPECTED_SCREENING_KEYS - set(field_keys))
    unknown_fields = sorted(set(field_keys) - EXPECTED_SCREENING_KEYS)
    if missing_fields:
        issues.append(f"missing screening fields: {', '.join(missing_fields)}")
    if unknown_fields:
        issues.append(f"unknown screening fields: {', '.join(unknown_fields)}")
    duplicate_fields = sorted(key for key, count in Counter(field_keys).items() if count > 1)
    if duplicate_fields:
        issues.append(f"duplicate screening fields: {', '.join(duplicate_fields)}")
    for field in fields:
        if not isinstance(field, dict):
            continue
        key = field.get("key", "<unknown>")
        if field.get("control") not in {"text", "textarea", "select", "radio"}:
            issues.append(f"screening field {key} has unsupported control")
        options = field.get("options", [])
        if field.get("control") in {"radio", "select"}:
            if not isinstance(options, list) or not options:
                issues.append(f"screening field {key} requires options")
                continue
            values = {option.get("value") for option in options if isinstance(option, dict)}
            if "other" not in values:
                issues.append(f"screening field {key} is missing the 'other' option")
            if "unknown" not in values:
                issues.append(f"screening field {key} is missing the 'unknown' option")
        source = field.get("source", {})
        question_code = source.get("question_code") if isinstance(source, dict) else None
        if question_code:
            question = next(
                (
                    item
                    for item in question_entries or []
                    if isinstance(item, dict) and item.get("code") == question_code
                ),
                None,
            )
            if question is None:
                issues.append(f"screening field {key} references unknown question {question_code}")
            elif source.get("question_text") != question.get("text"):
                issues.append(f"screening field {key} source text differs from {question_code}")

    categories = classification.get("categories", [])
    category_codes = (
        {item.get("code") for item in categories if isinstance(item, dict)}
        if isinstance(categories, list)
        else set()
    )
    if category_codes != EXPECTED_CATEGORIES:
        issues.append("classification categories must contain the four supported category codes")
    for priority_key in ("priority", "priority_by_goal"):
        priority_values = classification.get(priority_key, [])
        if priority_key == "priority_by_goal" and isinstance(priority_values, dict):
            priorities = [value for value in priority_values.values()]
        else:
            priorities = [priority_values]
        for priority in priorities:
            if not isinstance(priority, list) or set(priority) != EXPECTED_CATEGORIES:
                issues.append(f"classification {priority_key} must order all four category codes")
                break
    screening_fields = {
        field.get("key"): field
        for field in [*fields, *screening.get("additional_fields", [])]
        if isinstance(field, dict) and isinstance(field.get("key"), str)
    }
    for rule in classification.get("rules", []):
        if not isinstance(rule, dict):
            issues.append("classification rules must contain objects")
            continue
        _classification_rule_is_matchable(rule, screening_fields, issues)
        if not isinstance(rule.get("category"), str) or rule["category"] not in EXPECTED_CATEGORIES:
            issues.append(
                f"classification rule {rule.get('id', '<unknown>')} references an unknown category"
            )
        if not isinstance(rule.get("points"), int) or rule["points"] <= 0:
            issues.append(
                f"classification rule {rule.get('id', '<unknown>')} must award positive "
                "integer points"
            )
    fallback = classification.get("no_signal_fallback", {})
    if (
        fallback.get("suggested_category") not in EXPECTED_CATEGORIES
        or fallback.get("alternative_category") not in EXPECTED_CATEGORIES
    ):
        issues.append("classification no-signal fallback must use supported categories")

    return issues


def main(argv: list[str] | None = None) -> int:
    args = sys.argv[1:] if argv is None else argv
    if args != ["validate"]:
        print("Usage: python -m app.research_bank validate", file=sys.stderr)
        return 2
    issues = validate_configuration()
    if issues:
        print("Research configuration invalid:")
        for issue in issues:
            print(f"- {issue}")
        return 1
    configuration = load_configuration()
    question_count = len(configuration["bank"]["questions"])
    hypothesis_count = len(configuration["bank"]["hypotheses"])
    scenario_count = len(configuration["scenarios"]["scenarios"])
    print(
        f"Research configuration valid: {question_count} questions, "
        f"{hypothesis_count} hypotheses, {scenario_count} scenarios."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
