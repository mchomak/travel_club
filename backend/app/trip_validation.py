"""Read-only validation of a v1 document against the current strict import checks.

Paths use JSON Pointer. A skipped stage has not been established as successful.
Database-dependent import operations are not checked. The envelope requires an
integer version and therefore rejects booleans even if Pydantic accepts them.
"""

import base64
import binascii
import json
from typing import Any

from pydantic import ValidationError

from app.photo_uploads import MAX_UPLOAD, normalize_image
from app.pricing import PricingError, calculate_trip
from app.schemas import TripExchange
from app.trips import prepare_import, validate_schedule

_STAGES = ("envelope", "schema", "photos", "import", "schedule", "calculation")


def _path(parts: tuple[str | int, ...]) -> str:
    return "".join("/" + str(part).replace("~", "~0").replace("/", "~1") for part in parts)


def validate_trip_document(raw: object) -> dict[str, Any]:
    """Report checks that ran; `document_checks_passed` does not guarantee persistence."""
    issues: list[dict[str, str]] = []
    checked = ["envelope"]

    def result() -> dict[str, Any]:
        return {
            "document_checks_passed": not issues and len(checked) == len(_STAGES),
            "unchecked_checks": ["persistence"],
            "issues": issues,
            "checked_stages": checked,
            "skipped_stages": list(_STAGES[len(checked):]),
        }

    def issue(severity: str, code: str, path: str, message: str) -> None:
        issues.append({"severity": severity, "code": code, "path": path, "message": message})

    if isinstance(raw, (str, bytes, bytearray)):
        try:
            raw = json.loads(raw)
        except (ValueError, UnicodeDecodeError, RecursionError):
            issue("critical", "unreadable_document", "", "Не удалось прочитать JSON.")
            return result()
    if not isinstance(raw, dict):
        issue("critical", "invalid_envelope", "", "Корень документа должен быть объектом.")
        return result()
    if (raw.get("format") != "travel-club-trip"
            or type(raw.get("version")) is not int or raw.get("version") != 1):
        issue("critical", "unsupported_envelope", "",
              "Формат или версия документа не поддерживаются.")
        return result()

    checked.append("schema")
    try:
        exchange = TripExchange.model_validate(raw)
    except ValidationError as exc:
        for error in exc.errors(include_url=False, include_context=False, include_input=False):
            loc = error["loc"]
            if loc and loc[0] == "photos":
                loc = ("photos",)
            message = {
                "missing": "Заполните обязательное поле.",
                "extra_forbidden": "Поле не поддерживается текущим форматом.",
                "literal_error": "Выберите допустимое значение.",
                "uuid_parsing": "Укажите корректный UUID.",
            }.get(error["type"], "Проверьте значение и формат поля.")
            issue("error", "schema_" + error["type"], _path(loc), message)
        return result()

    for index, item in enumerate(exchange.trip.items):
        if "unit_price" not in item.model_fields_set and not item.price_pending:
            issue("error", "missing_price", f"/trip/items/{index}/unit_price",
                  "Укажите цену или отметьте, что она уточняется.")
    if issues:
        return result()

    checked.append("photos")
    if exchange.trip.cover_photo_id and exchange.trip.cover_photo_id.startswith("upload-"):
        issue("error", "invalid_cover_photo", "/trip/cover_photo_id",
              "Загруженное изображение нельзя использовать как обложку.")
    photo_ids = {
        day.photo_id for day in exchange.trip.days
        if day.photo_id and day.photo_id.startswith("upload-")
    }
    if photo_ids != set(exchange.photos):
        issue("error", "photo_references_mismatch", "/photos",
              "Фотографии не соответствуют ссылкам в днях поездки.")
    if sum(len(value) for value in exchange.photos.values()) > 10 * 1024 * 1024:
        issue("error", "photos_too_large", "/photos", "Размер фотографий превышает лимит импорта.")
    else:
        for encoded in exchange.photos.values():
            try:
                if len(encoded) > 4 * ((MAX_UPLOAD + 2) // 3):
                    raise ValueError("Image too large")
                content = base64.b64decode(encoded, validate=True)
                if len(content) > MAX_UPLOAD:
                    raise ValueError("Image too large")
                normalize_image(content)
            except (ValueError, binascii.Error):
                issue("error", "invalid_photo", "/photos", "Не удалось прочитать фотографию.")
    if issues:
        return result()

    checked.append("import")
    try:
        trip = prepare_import(exchange.trip)
    except (PricingError, OverflowError):
        issue("error", "import_structure_error", "/trip",
              "Проверьте дни, идентификаторы и ссылки на дни.")
        return result()
    checked.append("schedule")
    try:
        validate_schedule(trip)
    except (PricingError, OverflowError):
        issue("error", "schedule_error", "/trip/items", "Проверьте даты и время событий.")
        return result()
    checked.append("calculation")
    try:
        calculate_trip(trip)
    except (PricingError, OverflowError):
        issue("error", "calculation_error", "/trip",
              "Не удалось рассчитать стоимость; проверьте курсы и параметры услуг.")
    return result()
