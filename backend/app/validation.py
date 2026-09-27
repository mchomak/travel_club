"""Public validation messages without Pydantic's English prefixes or raw input."""


def validation_message(error: dict) -> str:
    kind = error["type"]
    context = error.get("ctx", {})
    # Validators in our DTOs already supply safe, actionable Russian messages.
    if kind == "value_error" and "error" in context:
        return str(context["error"])
    constraints = {
        "greater_than": ("Введите число больше {value}", "gt"),
        "greater_than_equal": ("Введите число не меньше {value}", "ge"),
        "less_than": ("Введите число меньше {value}", "lt"),
        "less_than_equal": ("Введите число не больше {value}", "le"),
        "string_too_short": ("Введите не меньше {value} символов", "min_length"),
        "string_too_long": ("Введите не больше {value} символов", "max_length"),
        "decimal_max_digits": ("Введите число не длиннее {value} цифр", "max_digits"),
        "decimal_max_places": ("Оставьте не больше {value} знаков после запятой", "decimal_places"),
        "decimal_whole_digits": ("Оставьте не больше {value} цифр до запятой", "whole_digits"),
        "too_long": ("Оставьте не больше {value} элементов", "max_length"),
    }
    if kind in constraints:
        message, key = constraints[kind]
        return message.format(value=context[key])
    if kind.startswith("date_"):
        return "Введите дату в формате ГГГГ-ММ-ДД"
    if kind.startswith("time_"):
        return "Введите время в формате ЧЧ:ММ"
    if kind.startswith("uuid_"):
        return "Не удалось распознать запись. Обновите страницу и повторите действие"
    return {
        "missing": "Заполните обязательное поле",
        "extra_forbidden": "Это поле нельзя изменять",
        "int_type": "Введите целое число",
        "int_parsing": "Введите целое число",
        "int_from_float": "Введите целое число",
        "decimal_parsing": "Введите число, например 100.00",
        "decimal_type": "Введите число, например 100.00",
        "finite_number": "Введите конечное число",
        "string_type": "Введите текст",
        "string_pattern_mismatch": "Введите код валюты из трёх заглавных латинских букв",
        "literal_error": "Выберите одно из предложенных значений",
        "bool_type": "Выберите да или нет",
        "bool_parsing": "Выберите да или нет",
        "list_type": "Передайте список значений",
        "model_attributes_type": "Проверьте поля записи",
        "model_type": "Проверьте поля записи",
        "json_invalid": "Не удалось прочитать данные. Обновите страницу и повторите действие",
    }.get(kind, "Проверьте значение поля")
