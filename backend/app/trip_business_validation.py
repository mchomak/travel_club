"""Non-mutating business checks for schema-valid trips.

Rules receive the same TripInput and yield independent, actionable issues. JSON
Pointer paths are for navigation; issue IDs use domain IDs and survive reordering.
"""

from collections.abc import Callable, Iterable
from datetime import datetime, timedelta
from itertools import islice
from uuid import NAMESPACE_URL, uuid5

from app.schemas import TripInput


def _issue(
    code,
    category,
    severity,
    path,
    message,
    *,
    day_id=None,
    item_id=None,
    stage_id=None,
    related_id=None,
    current_value=None,
    expected=None,
    affects_calculation=False,
    affects_publication=False,
):
    owner = stage_id or item_id or day_id
    identity = ":".join(str(x or "") for x in (code, owner, related_id))
    return {
        "id": str(uuid5(NAMESPACE_URL, "travel-club:validation:" + identity)),
        "code": code,
        "category": category,
        "severity": severity,
        "title": message,
        "message": message,
        "day_id": str(day_id) if day_id else None,
        "item_id": str(item_id) if item_id else None,
        "stage_id": str(stage_id) if stage_id else None,
        "path": path,
        "current_value": current_value,
        "expected": expected,
        "recommendation": expected,
        "auto_fixable": False,
        "can_ignore": True,
        "affects_import": False,
        "affects_calculation": affects_calculation,
        "affects_item_calculation": affects_calculation,
        "affects_publication": affects_publication,
    }


def _is_excursion(item) -> bool:
    return item.type == "excursion" or (item.type == "activity" and item.subtype == "excursion")


def _completeness(trip: TripInput, profile: str) -> Iterable[dict]:
    if not trip.client_title.strip():
        yield _issue(
            "missing_client_title",
            "client",
            "info",
            "/trip/client_title",
            "Не указано название для клиента.",
            expected="Добавьте название для клиента.",
        )
    if not trip.cover_photo_id:
        yield _issue(
            "missing_cover",
            "client",
            "info",
            "/trip/cover_photo_id",
            "Не выбрана обложка.",
            expected="Выберите обложку при необходимости.",
        )
    for index, day in enumerate(trip.days):
        if not day.title.strip():
            yield _issue(
                "missing_day_title",
                "client",
                "info",
                f"/trip/days/{index}/title",
                "Не указано название дня.",
                day_id=day.id,
                expected="Добавьте название дня.",
            )
    for index, item in enumerate(trip.items):
        path = f"/trip/items/{index}"
        context = {"day_id": item.day_id, "item_id": item.id}
        if item.price_pending:
            yield _issue(
                "price_pending",
                "finance",
                "warning",
                path + "/price_pending",
                "Стоимость ожидает уточнения; смета неполная.",
                **context,
                current_value=True,
                expected="Уточните стоимость и включите её в смету.",
                affects_calculation=True,
            )
        if item.type in {"flight", "train_bus", "transfer"}:
            for field, label in [("departure_label", "отправления"), ("arrival_label", "прибытия")]:
                if not getattr(item, field).strip():
                    yield _issue(
                        "missing_" + field,
                        "completeness",
                        "warning",
                        path + "/" + field,
                        f"Не указана точка {label}.",
                        **context,
                        expected=f"Уточните точку {label}.",
                    )
        if item.type in {"activity", "excursion"} and not item.description.strip():
            yield _issue(
                "missing_description",
                "client",
                "info",
                path + "/description",
                "Не добавлено описание события.",
                **context,
                expected="Добавьте описание для клиента.",
            )
        if profile in {"detailed", "organized"}:
            if (item.type in {"hotel", "activity", "excursion", "meal"}
                    and not item.location.strip()
                    and not (_is_excursion(item) and item.map_place)):
                yield _issue(
                    "missing_location", "completeness", "warning", path + "/location",
                    "Не указано место проведения или адрес.", **context,
                    expected="Уточните местоположение услуги.",
                )
            if (_is_excursion(item) and item.stages and not any(
                stage.location.strip() or stage.address.strip() or stage.map_url
                for stage in item.stages
            )):
                yield _issue(
                    "stage_places_missing", "completeness", "info", path + "/stages/0",
                    "В программе не указаны места этапов.", **context,
                    stage_id=item.stages[0].id,
                    expected="Добавьте места или адреса этапов, если они полезны для программы.",
                )
            if item.type != "hotel" and item.day_id and not item.start_time:
                yield _issue(
                    "missing_start_time", "completeness", "info", path + "/start_time",
                    "Не указано время начала события.", **context,
                    expected="Уточните время, если оно уже известно.",
                )
        if item.type == "flight" and item.start_time and item.end_time and (
            item.departure_utc_offset_minutes is None
        ):
            yield _issue(
                "flight_timezone_unknown", "schedule", "warning",
                path + "/departure_utc_offset_minutes",
                "Для перелёта не указаны смещения часовых поясов.", **context,
                expected="Укажите смещения для обоих аэропортов на дату перелёта.",
            )
        # A suggestion, never a claim that a package is incorrectly priced.
        if (
            len(item.stages) > 1
            and sum(
                any(
                    word in (stage.title + " " + stage.notes).lower()
                    for word in ("оплачивается отдельно", "отдельная оплата", "paid separately")
                )
                for stage in item.stages
            )
            >= 2
        ):
            yield _issue(
                "possibly_separate_services",
                "finance",
                "warning",
                path + "/stages",
                "Несколько этапов могут оплачиваться отдельно.",
                **context,
                expected="Проверьте, не нужны ли отдельные события в смете.",
            )


def _finance(trip: TripInput, profile: str) -> Iterable[dict]:
    rates = {rate.currency for rate in trip.rates} | {trip.base_currency}
    days = {day.id: day for day in trip.days}
    for index, item in enumerate(trip.items):
        path = f"/trip/items/{index}"
        context = {"day_id": item.day_id, "item_id": item.id, "affects_calculation": True}

        def problem(code, field, message, expected, value=None):
            return _issue(
                code,
                "finance",
                "error",
                path + "/" + field,
                message,
                **context,
                current_value=value,
                expected=expected,
            )

        if item.currency not in rates:
            yield problem(
                "missing_exchange_rate",
                "currency",
                "Не указан валютный курс.",
                "Укажите курс к базовой валюте.",
                item.currency,
            )
        if item.included and not item.price_pending and item.unit_price == 0:
            yield _issue(
                "zero_price", "finance", "warning", path + "/unit_price",
                "Указана нулевая цена услуги.", **context, current_value="0",
                expected="Проверьте, действительно ли услуга бесплатна.",
            )
        if item.participants_override and item.participants_override > trip.participants:
            yield problem(
                "too_many_participants",
                "participants_override",
                "Участников события больше, чем участников поездки.",
                "Уменьшите число участников события.",
                item.participants_override,
            )
        if item.calculation_mode == "capacity" and item.capacity is None:
            yield problem(
                "missing_capacity", "capacity", "Не указана вместимость.", "Укажите вместимость."
            )
        if item.calculation_mode == "hotel":
            if not item.check_in or not item.check_out or item.check_out <= item.check_in:
                yield problem(
                    "invalid_hotel_dates",
                    "check_out",
                    "Не указан корректный период проживания.",
                    "Укажите выезд позже заезда.",
                )
            elif (
                item.check_in < trip.start_date
                or item.check_out - timedelta(days=1) > trip.end_date
            ):
                yield problem(
                    "hotel_outside_trip",
                    "check_in",
                    "Проживание выходит за даты поездки.",
                    "Уточните даты проживания или поездки.",
                )
            if item.capacity is None and item.rooms_override is None:
                yield problem(
                    "missing_hotel_capacity",
                    "capacity",
                    "Не указана вместимость или число номеров.",
                    "Укажите вместимость номера или число номеров.",
                )
            if (
                item.capacity
                and item.rooms_override
                and item.capacity * item.rooms_override
                < (item.participants_override or trip.participants)
            ):
                yield problem(
                    "insufficient_rooms",
                    "rooms_override",
                    "В номерах недостаточно мест.",
                    "Проверьте число номеров и вместимость.",
                    item.rooms_override,
                )
        if item.calculation_mode in {"per_day", "per_person_per_day"} and item.day_id in days:
            if item.duration_days > (trip.end_date - days[item.day_id].date).days + 1:
                yield problem(
                    "duration_outside_trip",
                    "duration_days",
                    "Длительность выходит за даты поездки.",
                    "Уменьшите длительность или продлите поездку.",
                    item.duration_days,
                )


def _schedule(trip: TripInput, profile: str) -> Iterable[dict]:
    days = {day.id: day.date for day in trip.days}
    intervals = []
    for index, item in enumerate(trip.items):
        if (
            item.type == "hotel"
            or item.day_id not in days
            or not item.start_time
            or not item.end_time
        ):
            continue
        end_date = days.get(item.end_day_id) if item.end_day_id else days[item.day_id]
        if end_date is None:
            continue
        start = datetime.combine(days[item.day_id], item.start_time)
        end = datetime.combine(end_date, item.end_time)
        aware = item.departure_utc_offset_minutes is not None
        if aware:
            try:
                start -= timedelta(minutes=item.departure_utc_offset_minutes)
                end -= timedelta(minutes=item.arrival_utc_offset_minutes)
            except OverflowError:
                continue
        if end <= start:
            # Existing strict schedule validation reports invalid explicit end dates/offsets.
            continue
        intervals.append((index, item, start, end, aware))
    groups = {}
    for interval in intervals:
        _, item, _, _, aware = interval
        # Local clocks can only be compared on the same day. A zoned clock
        # cannot safely be compared with an unzoned one.
        groups.setdefault((aware, None if aware else item.day_id), []).append(interval)
    for group in groups.values():
        group.sort(key=lambda interval: interval[2])
        for pos, (index, item, start, end, _) in enumerate(group):
            for next_pos in range(pos + 1, len(group)):
                other_index, other, other_start, other_end, _ = group[next_pos]
                if other_start >= end:
                    break
                if start < other_end:
                    pair = sorted((str(item.id), str(other.id)))
                    primary_index = index if str(item.id) == pair[0] else other_index
                    yield _issue(
                        "schedule_overlap",
                        "schedule",
                        "warning",
                        f"/trip/items/{primary_index}",
                        "Время событий пересекается.",
                        item_id=pair[0],
                        related_id=pair[1],
                        expected="Проверьте расписание и возможность совмещения.",
                    )


def _stages(trip: TripInput, profile: str) -> Iterable[dict]:
    for index, item in enumerate(trip.items):
        if _is_excursion(item):
            yield from _excursion_stage_schedule(index, item)
        # Overnight and multi-day parents do not have enough stage date information
        # to establish an unambiguous interval.
        if (item.end_day_id and item.end_day_id != item.day_id) or (
            item.start_time and item.end_time and item.end_time <= item.start_time
        ):
            continue
        previous = []
        for stage_index, stage in enumerate(item.stages):
            if not stage.start_time or not stage.end_time or stage.end_time <= stage.start_time:
                continue
            path = f"/trip/items/{index}/stages/{stage_index}"
            if (item.start_time and item.end_time and item.end_time > item.start_time
                    and (stage.start_time < item.start_time.strftime("%H:%M")
                         or stage.end_time > item.end_time.strftime("%H:%M"))):
                yield _issue(
                    "stage_outside_parent", "schedule", "warning", path,
                    "Время этапа выходит за время события.", day_id=item.day_id,
                    item_id=item.id, stage_id=stage.id,
                    expected="Проверьте время этапа и события.",
                )
            for other_index, other in previous:
                if stage.start_time < other.end_time and other.start_time < stage.end_time:
                    pair = sorted((str(stage.id), str(other.id)))
                    primary_index = stage_index if str(stage.id) == pair[0] else other_index
                    yield _issue(
                        "stage_overlap", "schedule", "warning",
                        f"/trip/items/{index}/stages/{primary_index}",
                        "Время этапов пересекается.", day_id=item.day_id,
                        item_id=item.id, stage_id=pair[0], related_id=pair[1],
                        expected="Проверьте последовательность программы.",
                    )
            previous.append((stage_index, stage))


def _excursion_stage_schedule(index, item) -> Iterable[dict]:
    """Compare stage clocks only when their dates can be interpreted safely."""
    timed = bool(item.start_time or item.end_time) or any(
        stage.start_time or stage.end_time for stage in item.stages
    )

    def issue(code, stage_index, message, expected, severity="warning"):
        stage = item.stages[stage_index]
        return _issue(
            code, "schedule", severity, f"/trip/items/{index}/stages/{stage_index}",
            message, day_id=item.day_id, item_id=item.id, stage_id=stage.id,
            expected=expected,
        )

    for stage_index, stage in enumerate(item.stages):
        if timed and (not stage.start_time or not stage.end_time):
            yield issue(
                "stage_missing_time", stage_index, "Время этапа указано не полностью.",
                "Уточните время начала и окончания, если оно известно.", "info",
            )

    if (item.end_day_id and item.end_day_id != item.day_id) or (
        item.start_time and item.end_time and item.end_time <= item.start_time
    ):
        return

    for stage_index, stage in enumerate(item.stages):
        if stage.start_time and stage.end_time and stage.end_time <= stage.start_time:
            yield issue(
                "stage_invalid_time", stage_index, "Окончание этапа не позже его начала.",
                "Проверьте время этапа; для ночной программы уточните даты события.",
            )
        if stage_index == 0:
            continue
        previous = item.stages[stage_index - 1]
        if not (previous.start_time and previous.end_time and stage.start_time and stage.end_time
                and previous.end_time > previous.start_time and stage.end_time > stage.start_time):
            continue
        if stage.start_time < previous.start_time:
            yield issue(
                "stage_out_of_order", stage_index, "Этап начинается раньше предыдущего.",
                "Проверьте порядок этапов и их время.",
            )
        elif stage.start_time > previous.end_time:
            yield issue(
                "stage_gap", stage_index, "Между этапами есть свободное время.",
                "Проверьте, предусмотрены ли ожидание или свободное время.", "info",
            )

    stages = item.stages
    if (stages and item.start_time and item.end_time
            and all(stage.start_time and stage.end_time and stage.end_time > stage.start_time
                    for stage in stages)
            and all(a.start_time <= b.start_time for a, b in zip(stages, stages[1:]))):
        start, end = item.start_time.strftime("%H:%M"), item.end_time.strftime("%H:%M")
        if stages[0].start_time > start or max(stage.end_time for stage in stages) < end:
            yield issue(
                "stage_parent_mismatch", 0,
                "Расписание программы не совпадает со временем экскурсии.",
                "Проверьте границы экскурсии и программы; свободное время может быть "
                "запланировано.",
                "info",
            )


RULES: tuple[Callable[[TripInput, str], Iterable[dict]], ...] = (
    _completeness, _finance, _schedule, _stages,
)


def validate_business_rules(trip: TripInput, profile: str = "standard") -> list[dict]:
    """Return business issues without changing the input or inventing data."""
    limit = 5000
    issues = list(islice((issue for rule in RULES for issue in rule(trip, profile)), limit + 1))
    if len(issues) > limit:
        issues = issues[:limit]
        issues.append(_issue(
            "validation_limit_reached", "technical", "warning", "/trip",
            "Показана только часть замечаний: превышен предел проверки.",
            expected="Исправьте найденные замечания и запустите проверку снова.",
        ))
    return issues
