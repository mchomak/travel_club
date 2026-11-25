"""Conservative, side-effect-free projection of a raw trip into the domain model.

The caller must retain the original document and present unapplied data; this
projection alone is not evidence that its financial totals are complete.
"""

from collections import Counter
from uuid import UUID

from pydantic import ValidationError

from app.pricing import PricingError, calculate_trip
from app.schemas import CurrencyRateInput, DayInput, ItemInput, TripCreate, TripInput
from app.trips import calendar, validate_schedule


def _path(*parts):
    return "/trip" + "".join("/" + str(p).replace("~", "~0").replace("/", "~1") for p in parts)


def _uuid(value):
    try:
        return UUID(str(value))
    except (ValueError, TypeError, AttributeError):
        return None


def build_soft_candidate(raw: dict) -> dict:
    unapplied, normalized, reported = [], [], set()

    def report(path, code):
        entry = {"path": path, "code": code}
        if (path, code) not in reported:
            reported.add((path, code))
            unapplied.append(entry)

    def reject_errors(exc, parts):
        for error in exc.errors():
            report(_path(*parts, *error["loc"]), error["type"])

    if not isinstance(raw, dict):
        report(_path(), "invalid_trip")
        return {"trip": None, "unapplied": unapplied, "normalized": normalized}

    allowed = set(TripInput.model_fields)
    for key in raw.keys() - allowed:
        report(_path(key), "extra_forbidden")
    base = {key: value for key, value in raw.items() if key in TripCreate.model_fields}
    # Existing local photo identifiers do not prove the referenced image exists.
    if base.get("cover_photo_id") is not None:
        report(_path("cover_photo_id"), "photo_unavailable")
        base.pop("cover_photo_id")
    required = ("internal_title", "start_date", "end_date", "participants", "base_currency")
    for key in required:
        if key not in base:
            report(_path(key), "missing")
    if any(key not in base for key in required):
        report(_path(), "base_unusable")
        return {"trip": None, "unapplied": unapplied, "normalized": normalized}
    try:
        trip_base = TripCreate.model_validate(base)
    except ValidationError as exc:
        reject_errors(exc, ())
        report(_path(), "base_unusable")
        return {"trip": None, "unapplied": unapplied, "normalized": normalized}
    if trip_base.status != "draft":
        normalized.append({"path": _path("status"), "code": "status_to_draft"})
        trip_base = trip_base.model_copy(update={"status": "draft"})

    collections = {}
    for name, limit in (("days", 3660), ("items", 10000), ("rates", 1000)):
        values = raw.get(name, [])
        if not isinstance(values, list) or len(values) > limit:
            report(_path(name), "invalid_collection")
            values = []
        collections[name] = values

    # Duplicate identities are all rejected, not resolved by input order.
    def duplicate_ids(values):
        counts = Counter(_uuid(v.get("id")) for v in values if isinstance(v, dict) and "id" in v)
        return {value for value, count in counts.items() if value is not None and count > 1}

    day_duplicates = duplicate_ids(collections["days"])
    item_duplicates = duplicate_ids(collections["items"])
    stage_ids = [
        stage
        for item in collections["items"]
        if isinstance(item, dict) and isinstance(item.get("stages", []), list)
        for stage in item.get("stages", [])
    ]
    stage_duplicates = duplicate_ids(stage_ids)
    days_parsed = []
    for index, value in enumerate(collections["days"]):
        path = _path("days", index)
        try:
            day = DayInput.model_validate(value)
        except ValidationError as exc:
            report(path, "invalid_day")
            reject_errors(exc, ("days", index))
            continue
        if day.id in day_duplicates or not trip_base.start_date <= day.date <= trip_base.end_date:
            report(path, "duplicate_id" if day.id in day_duplicates else "outside_trip")
            continue
        if day.photo_id is not None or day.map_leg_modes:
            report(path, "unsupported_day_references")
            continue
        days_parsed.append((index, day))
    dates = Counter(day.date for _, day in days_parsed)
    days = []
    for index, day in days_parsed:
        if dates[day.date] > 1:
            report(_path("days", index), "duplicate_date")
        else:
            days.append(day)

    rates_parsed = []
    for index, value in enumerate(collections["rates"]):
        try:
            rate = CurrencyRateInput.model_validate(value)
        except ValidationError as exc:
            report(_path("rates", index), "invalid_rate")
            reject_errors(exc, ("rates", index))
            continue
        rates_parsed.append((index, rate))
    currencies = Counter(rate.currency for _, rate in rates_parsed)
    rates = []
    for index, rate in rates_parsed:
        if currencies[rate.currency] > 1 or (
            rate.currency == trip_base.base_currency and rate.rate != 1
        ):
            report(_path("rates", index), "duplicate_or_invalid_rate")
        else:
            rates.append(rate)

    candidate = calendar(TripInput(**trip_base.model_dump(), days=days, rates=rates))
    present_dates = {day.date for day in days}
    for day in candidate.days:
        if day.date not in present_dates:
            normalized.append(
                {"path": _path("days"), "code": "calendar_day_added", "date": str(day.date)}
            )
    # Only explicitly supplied day identities may be referenced by source items.
    supplied_ids = {day.id for day in days}
    items = []
    for index, value in enumerate(collections["items"]):
        path = _path("items", index)
        if not isinstance(value, dict):
            report(path, "invalid_item")
            continue
        try:
            item = ItemInput.model_validate(value)
        except ValidationError as exc:
            report(path, "invalid_item")
            reject_errors(exc, ("items", index))
            continue
        if "unit_price" not in value and not (
            value.get("price_pending") is True and value.get("included") is False
        ):
            report(path, "missing_price")
            continue
        if (
            item.id in item_duplicates
            or any(stage.id in stage_duplicates for stage in item.stages)
            or any(
                ref is not None and ref not in supplied_ids
                for ref in (item.day_id, item.end_day_id)
            )
            or item.auto_transfer is not None
        ):
            report(path, "ambiguous_or_unsupported_reference")
            continue
        # Pricing validates the full calendar for every item. Bound that work;
        # the source remains available for all items beyond this limit.
        if (index + 1) * len(candidate.days) > 2_000_000:
            report(path, "validation_work_limit")
            continue
        single = candidate.model_copy(update={"items": [item]})
        try:
            validate_schedule(single)
            calculate_trip(single)
        except (PricingError, KeyError, ArithmeticError, ValueError):
            report(path, "invalid_schedule_or_pricing")
            continue
        items.append(item)
        if "unit_price" not in value:
            normalized.append({"path": f"{path}/unit_price", "code": "pending_price_placeholder"})
    candidate = candidate.model_copy(update={"items": items})
    try:
        validate_schedule(candidate)
        calculate_trip(candidate)
    except (PricingError, KeyError, ArithmeticError, ValueError):
        report(_path(), "candidate_calculation_failed")
        candidate = None
    return {"trip": candidate, "unapplied": unapplied, "normalized": normalized}
