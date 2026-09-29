"""Transactional trip aggregate API. Calculation snapshots are server owned."""

from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Response
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError

from app.auth import Admin, Database
from app.models import Trip, TripCurrencyRate, TripDay, TripItem
from app.pricing import PricingError, calculate_trip
from app.schemas import (
    Calculation,
    ClientPreview,
    CurrencyRateInput,
    DayInput,
    ItemDocument,
    ItemInput,
    PreviewDay,
    PreviewItem,
    TripCreate,
    TripDocument,
    TripInput,
    TripSummary,
    TripUpdate,
)

router = APIRouter(prefix="/api/trips", tags=["trips"])


def get_trip(db, trip_id: UUID, *, lock=False) -> Trip:
    query = select(Trip).where(Trip.id == trip_id).execution_options(populate_existing=True)
    # Readers hold a shared parent lock until all lazy-loaded children are read.
    # Writers already lock this row before replacing any part of the aggregate.
    query = query.with_for_update(read=not lock)
    trip = db.scalar(query)
    if trip is None:
        raise HTTPException(404, "Поездка не найдена")
    return trip


def read_input(trip: Trip) -> TripInput:
    fields = {key: getattr(trip, key) for key in TripCreate.model_fields}
    return TripInput(
        **fields,
        days=[DayInput.model_validate(day) for day in trip.days],
        items=[
            ItemInput.model_validate(item)
            for item in sorted(
                trip.items, key=lambda item: (str(item.day_id or ""), item.position, str(item.id))
            )
        ],
        rates=[
            CurrencyRateInput.model_validate(rate)
            for rate in sorted(trip.rates, key=lambda rate: rate.currency)
        ],
    )


def document(trip: Trip) -> TripDocument:
    payload = read_input(trip)
    # Old saved documents could exceed the range because prior allocation put the
    # full item in its anchor day. Keep them readable until an admin repairs them.
    calculation = calculate_trip(payload, allow_legacy_overflow=True)
    snapshots = {item.id: item for item in trip.items}
    fields = payload.model_dump(exclude={"items"})
    return TripDocument(
        **fields,
        id=trip.id,
        version=trip.version,
        created_by=trip.created_by,
        created_at=trip.created_at,
        updated_at=trip.updated_at,
        calculation=calculation,
        items=[
            ItemDocument(
                **item.model_dump(),
                original_amount=snapshots[item.id].original_amount,
                normalized_amount=snapshots[item.id].normalized_amount,
                rate_used=snapshots[item.id].rate_used,
            )
            for item in payload.items
        ],
    )


def calendar(payload: TripInput) -> TripInput:
    by_date = {day.date: day for day in payload.days}
    days = []
    for offset in range((payload.end_date - payload.start_date).days + 1):
        value = payload.start_date + timedelta(days=offset)
        days.append(by_date.get(value) or DayInput(date=value))
    return payload.model_copy(update={"days": days})


def validate_schedule(payload: TripInput) -> None:
    days = {day.id: day.date for day in payload.days}
    for item in payload.items:
        if item.end_day_id is None:
            continue
        if item.day_id is None or item.end_day_id not in days or item.day_id not in days:
            raise PricingError(f"«{item.title}»: выберите день окончания этой поездки")
        start_date, end_date = days[item.day_id], days[item.end_day_id]
        if not payload.start_date <= end_date <= payload.end_date:
            raise PricingError(f"«{item.title}»: день окончания вне дат поездки")
        if end_date < start_date or (
            end_date == start_date
            and item.start_time is not None
            and item.end_time is not None
            and item.end_time <= item.start_time
        ):
            raise PricingError(f"«{item.title}»: окончание должно быть позже начала")


def reconcile_dates(payload: TripInput, original: TripInput, confirmed: bool) -> TripInput:
    day_ids = [day.id for day in payload.days]
    day_dates = [day.date for day in payload.days]
    if len(set(day_ids)) != len(day_ids) or len(set(day_dates)) != len(day_dates):
        raise PricingError("Дни поездки не должны повторяться")
    existing = {day.id: day for day in original.days}
    for day in payload.days:
        if day.id in existing and day.date != existing[day.id].date:
            raise PricingError("Не меняйте дату существующего дня: измените диапазон поездки")
    all_days = [*original.days, *payload.days]
    original_day_ids = {day.id for day in original.days}
    supplied_dates = {day.id: day.date for day in payload.days}
    for item in payload.items:
        end_date = supplied_dates.get(item.end_day_id)
        if (
            end_date is not None
            and not payload.start_date <= end_date <= payload.end_date
            and item.end_day_id not in original_day_ids
        ):
            raise PricingError(f"«{item.title}»: день окончания вне дат поездки")
    removed = {
        day.id: day for day in all_days if not payload.start_date <= day.date <= payload.end_date
    }
    item_days = {
        day_id
        for item in [*original.items, *payload.items]
        for day_id in (item.day_id, item.end_day_id)
    }
    populated = {
        day.date
        for day in all_days
        if day.id in removed
        and (
            day.id in item_days
            or any(
                getattr(day, key)
                for key in (
                    "country", "city", "place", "title", "status", "internal_note", "client_note"
                )
            )
        )
    }
    for item in [*original.items, *payload.items]:
        if item.calculation_mode == "hotel" and item.check_in and item.check_out:
            populated.update(
                day.date
                for day in removed.values()
                if item.check_in <= day.date < item.check_out
            )
    if populated and not confirmed:
        raise HTTPException(
            409,
            {
                "code": "DATE_REMOVAL_REQUIRED",
                "message": "В удаляемых днях есть данные. Подтвердите их удаление",
                "details": {"dates": [value.isoformat() for value in sorted(populated)]},
            },
        )
    by_date = {day.date: day for day in original.days if day.id not in removed}
    by_date.update({day.date: day for day in payload.days if day.id not in removed})
    return calendar(
        payload.model_copy(
            update={
                "days": list(by_date.values()),
                "items": [
                    item for item in payload.items
                    if item.day_id not in removed
                    and item.end_day_id not in removed
                    and not (
                        item.calculation_mode == "hotel"
                        and item.check_in and item.check_out
                        and any(
                            item.check_in <= day.date < item.check_out
                            for day in removed.values()
                        )
                        and (
                            item.check_in < payload.start_date
                            or item.check_out - timedelta(days=1) > payload.end_date
                        )
                    )
                ],
            }
        )
    )


def validate_ownership(db, trip_id: UUID, payload: TripInput) -> None:
    for model, ids in (
        (TripDay, [day.id for day in payload.days]),
        (TripItem, [item.id for item in payload.items]),
    ):
        if ids and db.scalar(
            select(model.id)
            .where(
                model.id.in_(ids),
                model.trip_id != trip_id,
            )
            .limit(1)
        ):
            raise PricingError("Нельзя использовать день или элемент другой поездки")


def persist(db, trip: Trip, payload: TripInput, *, increment_version=False) -> TripDocument:
    try:
        return _persist(db, trip, payload, increment_version=increment_version)
    except IntegrityError:
        db.rollback()
        raise HTTPException(422, "Проверьте дни и элементы поездки") from None


def _persist(db, trip: Trip, payload: TripInput, *, increment_version=False) -> TripDocument:
    validate_schedule(payload)
    calculation = calculate_trip(payload)
    if increment_version:
        trip.version += 1
    for key in TripCreate.model_fields:
        setattr(trip, key, getattr(payload, key))
    trip.cost_total = calculation.cost_total
    trip.client_price = calculation.client_price
    trip.profit = calculation.profit
    trip.updated_at = datetime.now(UTC)
    db.add(trip)
    db.flush()
    # Child rows are replaced within this transaction; the row lock serializes aggregate saves.
    # Delete items first because the composite FK deliberately cascades day deletion.
    for model in (TripItem, TripDay, TripCurrencyRate):
        db.execute(delete(model).where(model.trip_id == trip.id))
    for day in payload.days:
        db.add(TripDay(trip_id=trip.id, **day.model_dump()))
    db.flush()
    for item, snapshot in zip(payload.items, calculation.items, strict=True):
        db.add(
            TripItem(trip_id=trip.id, **item.model_dump(), **snapshot.model_dump(exclude={"id"}))
        )
    for rate in payload.rates:
        db.add(TripCurrencyRate(trip_id=trip.id, **rate.model_dump()))
    db.flush()
    db.refresh(trip)
    result = document(trip)
    db.commit()
    return result


@router.post("/calculate", response_model=Calculation)
def calculate(payload: TripInput, user: Admin):
    validate_schedule(payload)
    return calculate_trip(payload)


@router.get("", response_model=list[TripSummary])
def list_trips(user: Admin, db: Database):
    trips = db.scalars(
        select(Trip).order_by(Trip.updated_at.desc(), Trip.id).with_for_update(read=True)
    ).all()
    return [
        TripSummary(
            id=trip.id,
            internal_title=trip.internal_title,
            start_date=trip.start_date,
            end_date=trip.end_date,
            participants=trip.participants,
            base_currency=trip.base_currency,
            status=trip.status,
            countries=list(dict.fromkeys(day.country for day in trip.days if day.country)),
            cities=list(dict.fromkeys(day.city for day in trip.days if day.city)),
            cost_total=trip.cost_total,
            client_price=trip.client_price,
            updated_at=trip.updated_at,
            version=trip.version,
        )
        for trip in trips
    ]


@router.post("", response_model=TripDocument, status_code=201)
def create_trip(payload: TripCreate, user: Admin, db: Database):
    editable = calendar(TripInput(**payload.model_dump()))
    trip = Trip(created_by=user.id, version=1)
    return persist(db, trip, editable)


@router.get("/{trip_id}", response_model=TripDocument)
def retrieve_trip(trip_id: UUID, user: Admin, db: Database):
    return document(get_trip(db, trip_id))


@router.put("/{trip_id}", response_model=TripDocument)
def update_trip(
    trip_id: UUID,
    payload: TripUpdate,
    user: Admin,
    db: Database,
    confirm_date_removal: bool = False,
):
    trip = get_trip(db, trip_id, lock=True)
    if payload.version != trip.version:
        raise HTTPException(
            409,
            {
                "code": "VERSION_CONFLICT",
                "message": "Поездка изменена в другой вкладке. Перечитайте её",
                "details": {"current_version": trip.version},
            },
        )
    editable = TripInput(**payload.model_dump(exclude={"version"}))
    validate_ownership(db, trip.id, editable)
    editable = reconcile_dates(editable, read_input(trip), confirm_date_removal)
    return persist(db, trip, editable, increment_version=True)


@router.delete("/{trip_id}", status_code=204)
def remove_trip(trip_id: UUID, user: Admin, db: Database):
    trip = get_trip(db, trip_id, lock=True)
    db.delete(trip)
    db.commit()
    return Response(status_code=204)


@router.post("/{trip_id}/duplicate", response_model=TripDocument, status_code=201)
def duplicate_trip(trip_id: UUID, user: Admin, db: Database):
    original = get_trip(db, trip_id, lock=True)
    payload = read_input(original)
    day_ids = {day.id: uuid4() for day in payload.days}
    payload = payload.model_copy(
        update={
            "internal_title": payload.internal_title[:192] + " — копия",
            "days": [day.model_copy(update={"id": day_ids[day.id]}) for day in payload.days],
            "items": [
                item.model_copy(
                    update={
                        "id": uuid4(),
                        "day_id": day_ids.get(item.day_id),
                        "end_day_id": day_ids.get(item.end_day_id),
                    }
                )
                for item in payload.items
            ],
        }
    )
    return persist(db, Trip(created_by=user.id, version=1), payload)


@router.get("/{trip_id}/preview", response_model=ClientPreview)
def preview_trip(trip_id: UUID, user: Admin, db: Database):
    trip = get_trip(db, trip_id)
    payload = read_input(trip)

    def preview_items(day_id):
        return [
            PreviewItem(**{key: getattr(item, key) for key in PreviewItem.model_fields})
            for item in payload.items
            if item.day_id == day_id
        ]

    return ClientPreview(
        id=trip.id,
        client_title=trip.client_title or trip.internal_title,
        start_date=trip.start_date,
        end_date=trip.end_date,
        participants=trip.participants,
        client_note=trip.client_note,
        days=[
            PreviewDay(
                **{key: getattr(day, key) for key in PreviewDay.model_fields if key != "items"},
                items=preview_items(day.id),
            )
            for day in payload.days
        ],
        general_items=preview_items(None),
    )
