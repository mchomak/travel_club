"""Authoritative, side-effect-free trip pricing; all arithmetic uses Decimal."""

from datetime import timedelta
from decimal import ROUND_DOWN, ROUND_HALF_UP, Decimal, localcontext
from typing import get_args

from app.schemas import (
    Calculation,
    DayCalculation,
    ItemCalculation,
    ItemType,
    TripInput,
)

CENT = Decimal("0.01")
ZERO = Decimal("0.00")
MAX_MONEY = Decimal("999999999999999999.99")
CATEGORIES = ("transport", "accommodation", "activities", "other")
TYPE_CATEGORY = {
    "flight": "transport",
    "train_bus": "transport",
    "transfer": "transport",
    "rental": "transport",
    "hotel": "accommodation",
    "excursion": "activities",
    "activity": "activities",
    "insurance": "other",
    "other": "other",
}


class PricingError(ValueError):
    """An actionable invalid draft, safe to expose to its administrator."""


def money(value: Decimal) -> Decimal:
    result = value.quantize(CENT, rounding=ROUND_HALF_UP)
    if result < 0 or result > MAX_MONEY:
        raise PricingError("Сумма слишком велика. Уменьшите цену, количество или курс")
    return result


def daily_portions(amount: Decimal, count: int) -> list[Decimal]:
    """Allocate rounded cents, leaving an exact non-negative final remainder."""
    if count == 1:
        return [amount]
    share = min(
        money(amount / count),
        (amount / (count - 1)).quantize(CENT, rounding=ROUND_DOWN),
    )
    return [share] * (count - 1) + [amount - share * (count - 1)]


def validate_structure(trip: TripInput) -> None:
    dates = [day.date for day in trip.days]
    ids = [day.id for day in trip.days]
    if len(set(ids)) != len(ids) or len(set(dates)) != len(dates):
        raise PricingError("Дни поездки не должны повторяться")
    expected_dates = {
        trip.start_date + timedelta(days=i)
        for i in range((trip.end_date - trip.start_date).days + 1)
    }
    if set(dates) != expected_dates:
        raise PricingError("Добавьте по одному дню для каждой даты поездки")
    item_ids = [item.id for item in trip.items]
    if len(set(item_ids)) != len(item_ids):
        raise PricingError("Элементы поездки не должны повторяться")
    currencies = [rate.currency for rate in trip.rates]
    if len(set(currencies)) != len(currencies):
        raise PricingError("Укажите один курс для каждой валюты")
    for rate in trip.rates:
        if rate.currency == trip.base_currency and rate.rate != 1:
            raise PricingError("Курс базовой валюты всегда равен 1")


def _calculate(trip: TripInput, *, allow_legacy_overflow: bool = False) -> Calculation:
    validate_structure(trip)
    rates = {rate.currency: rate.rate for rate in trip.rates}
    rates[trip.base_currency] = Decimal(1)
    days = {day.id: day for day in trip.days}
    by_date = {day.date: day.id for day in trip.days}
    groups = {day.id: dict.fromkeys(CATEGORIES, ZERO) for day in trip.days}
    by_type = dict.fromkeys(get_args(ItemType), ZERO)
    snapshots = []
    cost = general = ZERO
    for item in trip.items:
        if item.day_id is not None and item.day_id not in days:
            raise PricingError(f"«{item.title}»: выберите день этой поездки")
        if (
            item.participants_override is not None
            and item.participants_override > trip.participants
        ):
            raise PricingError(f"«{item.title}»: подгруппа больше числа участников поездки")
        if item.currency not in rates:
            raise PricingError(f"Укажите курс {item.currency} к {trip.base_currency}")
        people = item.participants_override or trip.participants
        mode = item.calculation_mode
        legacy_overflow = False
        if mode in ("per_day", "per_person_per_day") and item.day_id is not None:
            remaining = (trip.end_date - days[item.day_id].date).days + 1
            if item.duration_days > remaining:
                if not allow_legacy_overflow:
                    raise PricingError(
                        f"«{item.title}»: число дней выходит за пределы поездки. "
                        "Уменьшите длительность, выберите более ранний день или продлите поездку"
                    )
                legacy_overflow = True
        nights = 0
        if mode == "per_person":
            original = item.unit_price * people * item.quantity
        elif mode == "fixed":
            original = item.unit_price * item.quantity
        elif mode == "capacity":
            if item.capacity is None:
                raise PricingError(f"«{item.title}»: укажите вместимость")
            units = (people + item.capacity - 1) // item.capacity
            original = item.unit_price * units * item.quantity
        elif mode == "hotel":
            if not item.check_in or not item.check_out or item.check_out <= item.check_in:
                raise PricingError(f"«{item.title}»: выезд должен быть позже заезда")
            if (
                item.check_in < trip.start_date
                or item.check_out - timedelta(days=1) > trip.end_date
            ):
                raise PricingError(f"«{item.title}»: даты проживания выходят за пределы поездки")
            if item.day_id is not None and days[item.day_id].date != item.check_in:
                raise PricingError(f"«{item.title}»: выберите день заезда или общие расходы")
            if item.rooms_override is None and item.capacity is None:
                raise PricingError(f"«{item.title}»: укажите вместимость номера или число номеров")
            rooms = item.rooms_override or (people + item.capacity - 1) // item.capacity
            nights = (item.check_out - item.check_in).days
            original = item.unit_price * rooms * nights
        elif mode == "per_day":
            original = item.unit_price * item.duration_days * item.quantity
        elif mode == "per_person_per_day":
            original = item.unit_price * people * item.duration_days * item.quantity
        else:  # manual: the entered amount is final; other calculation inputs are inactive.
            original = item.unit_price
        original = money(original)
        amount = money(original * rates[item.currency])
        snapshots.append(
            ItemCalculation(
                id=item.id,
                original_amount=original,
                rate_used=rates[item.currency],
                normalized_amount=amount,
            )
        )
        if not item.included:
            continue
        cost = money(cost + amount)
        by_type[item.type] += amount
        category = TYPE_CATEGORY[item.type]
        if mode == "hotel":
            for night, portion in enumerate(daily_portions(amount, nights)):
                day_id = by_date[item.check_in + timedelta(days=night)]
                groups[day_id][category] += portion
        elif item.day_id is None:
            general += amount
        elif mode in ("per_day", "per_person_per_day") and not legacy_overflow:
            start = days[item.day_id].date
            for offset, portion in enumerate(daily_portions(amount, item.duration_days)):
                groups[by_date[start + timedelta(days=offset)]][category] += portion
        else:
            groups[item.day_id][category] += amount
    percent = trip.pricing_percent / 100
    price = money(cost * (1 + percent) if trip.pricing_mode == "markup" else cost / (1 - percent))
    profit = price - cost
    margin = (
        (profit / price * 100).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
        if price
        else ZERO
    )
    return Calculation(
        items=snapshots,
        days=[
            DayCalculation(
                day_id=day.id,
                date=day.date,
                groups=groups[day.id],
                total=sum(groups[day.id].values(), ZERO),
            )
            for day in sorted(trip.days, key=lambda day: day.date)
        ],
        by_type=by_type,
        general_total=general,
        cost_total=cost,
        cost_per_person=money(cost / trip.participants),
        client_price=price,
        profit=profit,
        actual_margin_percent=margin,
    )


def calculate_trip(trip: TripInput, *, allow_legacy_overflow: bool = False) -> Calculation:
    with localcontext() as context:
        context.prec = 50
        return _calculate(trip, allow_legacy_overflow=allow_legacy_overflow)
