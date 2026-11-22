"""Live, client-facing itineraries and their admin-managed bearer links."""

import json
import re
import secrets
from collections import defaultdict
from datetime import date, time, timedelta
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, HTTPException, Response
from pydantic import Field, ValidationError, field_validator
from sqlalchemy import func, select, update

from app.auth import Admin, Database
from app.models import Trip, TripDay, TripItem
from app.schemas import DTO, AutoTransfer, EventStage, ItemInput, ItemSubtype, ItemType
from app.trip_photos import PhotoId

router = APIRouter(tags=["trip sharing"])
ADMIN_PATH = "/api/trips/{trip_id}/public-link"
# A shared lock pins the saved aggregate while its days and events are read.
ITINERARY_TRIP = select(
    Trip.id,
    Trip.client_title,
    Trip.start_date,
    Trip.end_date,
    Trip.participants,
    Trip.client_note,
    Trip.cover_photo_id,
).with_for_update(read=True)


class PublicLink(DTO):
    token: str


class PublicLinkStatus(DTO):
    active: bool
    token: str | None


class PublicPoint(DTO):
    name: str = Field(min_length=1, max_length=200)
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False, strict=True)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False, strict=True)

    @field_validator("name")
    @classmethod
    def valid_name(cls, value: str) -> str:
        if not value.strip() or "\x00" in value:
            raise ValueError("Invalid place name")
        return value


def public_point(value) -> PublicPoint | None:
    if not isinstance(value, dict):
        return None
    try:
        fields = {key: value.get(key) for key in ("name", "latitude", "longitude")}
        return PublicPoint.model_validate(fields)
    except ValidationError:
        return None


class PublicMovement(DTO):
    mode: Literal["drive", "walk"]
    duration_seconds: int


class PublicItem(DTO):
    stages: list[EventStage] = []
    movement: PublicMovement | None = None
    type: ItemType
    subtype: ItemSubtype | None
    title: str
    description: str
    location: str
    departure_city: str
    arrival_city: str
    departure_label: str
    arrival_label: str
    client_note: str
    map_place: PublicPoint | None
    map_end_place: PublicPoint | None
    external_url: str | None
    map_url: str | None
    booking_url: str | None
    start_time: time | None
    end_time: time | None
    end_date: date | None = None
    departure_utc_offset_minutes: int | None
    arrival_utc_offset_minutes: int | None
    check_in: date | None
    check_out: date | None
    check_in_time: time | None
    check_out_time: time | None


class PublicDay(DTO):
    date: date
    photo_id: PhotoId | None
    country: str
    city: str
    place: str
    title: str
    client_note: str
    items: list[PublicItem]


class PublicItinerary(DTO):
    client_title: str
    cover_photo_id: PhotoId | None
    start_date: date
    end_date: date
    participants: int
    client_note: str
    days: list[PublicDay]
    general_items: list[PublicItem]


@router.get(ADMIN_PATH)
def link_status(trip_id: UUID, user: Admin, db: Database) -> PublicLinkStatus:
    row = db.execute(select(Trip.public_link_token).where(Trip.id == trip_id)).one_or_none()
    if row is None:
        raise HTTPException(404, "Поездка не найдена")
    return PublicLinkStatus(active=row.public_link_token is not None, token=row.public_link_token)


def save_link(db: Database, trip_id: UUID, value) -> str | None:
    row = db.execute(
        update(Trip)
        .where(Trip.id == trip_id)
        .values(public_link_token=value, updated_at=Trip.updated_at)
        .returning(Trip.public_link_token)
    ).one_or_none()
    if row is None:
        raise HTTPException(404, "Поездка не найдена")
    db.commit()
    return row.public_link_token


@router.post(ADMIN_PATH)
def issue_link(trip_id: UUID, user: Admin, db: Database) -> PublicLink:
    # PostgreSQL evaluates COALESCE under the row lock, including after a concurrent issue.
    value = func.coalesce(Trip.public_link_token, secrets.token_urlsafe(32))
    return PublicLink(token=save_link(db, trip_id, value))


@router.post(ADMIN_PATH + "/rotate")
def rotate_link(trip_id: UUID, user: Admin, db: Database) -> PublicLink:
    token = secrets.token_urlsafe(32)
    save_link(db, trip_id, token)
    return PublicLink(token=token)


@router.delete(ADMIN_PATH, status_code=204)
def revoke_link(trip_id: UUID, user: Admin, db: Database):
    save_link(db, trip_id, None)
    return Response(status_code=204)


def public_item(row, dates: dict[UUID, date]) -> PublicItem:
    values = dict(row._mapping)
    values["map_place"] = public_point(values["map_place"])
    values["map_end_place"] = public_point(values["map_end_place"])
    for field in ("external_url", "map_url", "booking_url"):
        try:
            values[field] = (
                ItemInput.valid_external_url(values[field])
                if values["publish_external_url"]
                else None
            )
        except (ValueError, TypeError):
            values[field] = None
    item = PublicItem.model_validate({key: values.get(key) for key in PublicItem.model_fields})
    # The editor can retain the previous type's hidden fields in the saved item.
    if item.type == "flight":
        # A flight's hidden location has no provenance, even when both cities are empty.
        item.location = ""
    else:
        item.departure_city = item.arrival_city = ""
    if item.type not in {"transfer", "train_bus", "rental"}:
        item.departure_label = item.arrival_label = ""
    if item.type not in {"flight", "train_bus", "transfer"}:
        item.departure_utc_offset_minutes = item.arrival_utc_offset_minutes = None
    if item.type != "hotel":
        item.check_in = item.check_out = item.check_in_time = item.check_out_time = None
    elif item.check_in or item.check_out:
        item.start_time = item.end_time = None
        return item

    start = dates.get(row.day_id)
    item.end_date = dates.get(row.end_day_id, start)
    if (
        not row.end_day_id
        and start
        and start < date.max
        and item.departure_utc_offset_minutes is None
        and item.start_time
        and item.end_time
        and item.end_time < item.start_time
    ):
        item.end_date = start + timedelta(days=1)
    return item


def day_item_minute(item: PublicItem, day: date) -> int:
    clock = item.start_time
    if item.type == "hotel" and (item.check_in or item.check_out):
        clock = item.check_out_time if item.check_out == day else item.check_in_time
    return clock.hour * 60 + clock.minute if clock is not None else 24 * 60


def current_movement(row, day, rows, trip, days=None) -> PublicMovement | None:
    """Validate saved route provenance against the current itinerary before publication."""
    try:
        meta = AutoTransfer.model_validate(row.auto_transfer)
        signature = json.loads(meta.source_signature)
        if not isinstance(signature, dict) or row.type != "transfer":
            return None
        if row.subtype != ("walk" if meta.mode == "walk" else "taxi"):
            return None
        all_days = days or [day]
        by_date = {value.date.isoformat(): value for value in all_days}
        by_id = {value.id: value for value in all_days}
        source_date = signature["from"]["date"]
        # buildDayRoute creates connection legs from one day's nodes. The saved
        # signature has no route-day or intervening-node history for sources on
        # different dates, so their original adjacency cannot be established.
        # A transfer itself may still depart on the preceding day.
        if source_date != signature["to"]["date"] or source_date not in by_date:
            return None
        route_day = by_date[source_date]
        transport = {"flight", "train_bus", "transfer"}

        def clock(value):
            return value.strftime("%H:%M") if value else None

        def equivalent_clock(value, expected):
            if value is None or expected is None:
                return value is None and expected is None
            return isinstance(value, str) and value in {expected, expected + ":00"}

        def absolute(day_value, value):
            if value is None:
                return None
            return (day_value - date(1970, 1, 1)).days * 1440 + value.hour * 60 + value.minute

        def end_date(item):
            start = by_id.get(item.day_id)
            if start is None:
                return None
            if item.end_day_id:
                target = by_id.get(item.end_day_id)
                return target.date if target else None
            if (
                item.start_time
                and item.end_time
                and item.end_time < item.start_time
                and (
                    item.departure_utc_offset_minutes is None
                    or item.arrival_utc_offset_minutes is None
                )
            ):
                return start.date + timedelta(days=1)
            return start.date

        def resolve(key, side, saved):
            match = re.fullmatch(r"item:([0-9a-f-]{36}):(start|end)", key)
            source = next((item for item in rows if match and str(item.id) == match[1]), None)
            if match and (source is None or source.id == row.id):
                return None
            if not match:
                if key not in {"day:start", "day:end"}:
                    return None
                point = public_point(
                    route_day.map_start if key == "day:start" else route_day.map_end
                )
                actual = {
                    "date": source_date,
                    "time": None,
                    "available": None,
                    "point": [point.latitude, point.longitude] if point else None,
                    "schedule": [],
                }
            else:
                endpoint = match[2]
                point = public_point(
                    source.map_place
                    if endpoint == "start"
                    else source.map_end_place
                    or (None if source.type in transport else source.map_place)
                )
                if not point:
                    return None
                if source.type == "hotel":
                    if (
                        not source.check_in
                        or not source.check_out
                        or not source.check_in <= route_day.date <= source.check_out
                    ):
                        return None
                    event_date = route_day.date
                    event_time = (
                        source.check_out_time
                        if side == "from" and event_date == source.check_out
                        else source.check_in_time
                        if side == "to" and event_date == source.check_in
                        else None
                    )
                    available = absolute(event_date, event_time)
                else:
                    start_day = by_id.get(source.day_id)
                    finish = end_date(source)
                    if not start_day or not finish:
                        return None
                    event_date = finish if endpoint == "end" else start_day.date
                    event_time = source.end_time if endpoint == "end" else source.start_time
                    available = absolute(event_date, event_time)
                    if side == "from":
                        available = absolute(finish, source.end_time) or absolute(
                            start_day.date, source.start_time
                        )
                    if source.type == "flight":
                        both = source.start_time and source.end_time
                        offsets = (
                            source.departure_utc_offset_minutes is not None
                            and source.arrival_utc_offset_minutes is not None
                        )
                        valid = not both or (
                            (
                                absolute(finish, source.end_time)
                                - absolute(start_day.date, source.start_time)
                                + (
                                    source.departure_utc_offset_minutes
                                    - source.arrival_utc_offset_minutes
                                    if offsets
                                    else 0
                                )
                            )
                            > 0
                        )
                        duration = (
                            source.airport_after_minutes
                            if side == "from"
                            else source.airport_before_minutes
                        )
                        anchor = (
                            absolute(finish, source.end_time)
                            if side == "from"
                            else absolute(start_day.date, source.start_time)
                        )
                        if valid and anchor is not None and 0 < duration <= 1440:
                            available = anchor + duration if side == "from" else anchor - duration
                start, finish_time = clock(source.start_time), clock(source.end_time)
                schedule = [
                    source.type,
                    start,
                    finish_time,
                    source.check_in.isoformat() if source.check_in else None,
                    source.check_out.isoformat() if source.check_out else None,
                    clock(source.check_in_time),
                    clock(source.check_out_time),
                    source.airport_before_minutes,
                    source.airport_after_minutes,
                ]
                if (
                    source.departure_utc_offset_minutes is not None
                    and source.arrival_utc_offset_minutes is not None
                ):
                    schedule += [
                        source.departure_utc_offset_minutes,
                        source.arrival_utc_offset_minutes,
                    ]
                actual = {
                    "date": event_date.isoformat(),
                    "time": clock(event_time),
                    "available": available,
                    "point": [point.latitude, point.longitude],
                    "schedule": schedule,
                }
            if not point or not isinstance(saved, dict):
                return None
            # The editor can hold either HH:MM or the API's HH:MM:SS representation.
            saved_schedule = saved.get("schedule")
            if not isinstance(saved_schedule, list) or len(saved_schedule) != len(
                actual["schedule"]
            ):
                return None
            for index, value in enumerate(actual["schedule"]):
                if index in {1, 2, 5, 6}:
                    if not equivalent_clock(saved_schedule[index], value):
                        return None
                elif saved_schedule[index] != value:
                    return None
            if (
                saved.get("date") != actual["date"]
                or not equivalent_clock(saved.get("time"), actual["time"])
                or saved.get("available") != actual["available"]
                or saved.get("point") != actual["point"]
                or set(saved) != set(actual)
            ):
                return None
            return source, point, actual

        first = resolve(meta.from_key, "from", signature["from"])
        second = resolve(meta.to_key, "to", signature["to"])
        if not first or not second or signature.get("v") != 1 or signature.get("mode") != meta.mode:
            return None
        if signature.get("bounds") != [trip.start_date.isoformat(), trip.end_date.isoformat()]:
            return None
        preference = next(
            (
                leg.get("mode")
                for leg in (route_day.map_leg_modes or [])
                if isinstance(leg, dict)
                and leg.get("from_key") == meta.from_key
                and leg.get("to_key") == meta.to_key
            ),
            "drive",
        )
        if preference != meta.mode:
            return None

        # Reconstruct the ordered event nodes on the selected day. Auto transfers
        # are excluded so that their original connection can be checked.
        groups = []
        for item in rows:
            if item.id == row.id or item.type in {"hotel", "insurance"}:
                continue
            if item.type == "other" and not (
                item.start_time or item.map_place or item.map_end_place
            ):
                continue
            start_day = by_id.get(item.day_id)
            finish = end_date(item)
            if not start_day or not finish:
                continue
            nodes = []
            if start_day.date == route_day.date:
                nodes.append((f"item:{item.id}:start", item.start_time))
            if finish == route_day.date and (
                item.type in transport or finish != start_day.date or item.map_end_place
            ):
                nodes.append((f"item:{item.id}:end", item.end_time))
            if nodes:
                groups.append((nodes[0][1] or time.max, item.position, str(item.id), nodes))
        groups.sort(key=lambda group: group[:3])
        event_keys = [key for group in groups for key, _ in group[3]]

        def boundary(side):
            manual = route_day.map_start if side == "start" else route_day.map_end
            if manual:
                return f"day:{side}"
            candidates = []
            for item in rows:
                if item.id == row.id:
                    continue
                finish = end_date(item)
                start_day = by_id.get(item.day_id)
                if (
                    item.type in transport
                    and start_day
                    and finish
                    and start_day.date < route_day.date < finish
                ):
                    # The route starts/ends in transit and has no usable point.
                    return None
                if (
                    item.type in transport
                    and start_day
                    and finish
                    and finish != start_day.date
                    and (
                        finish == route_day.date
                        if side == "start"
                        else start_day.date == route_day.date
                    )
                ):
                    candidates.append(f"item:{item.id}:{'end' if side == 'start' else 'start'}")
            if not candidates:
                candidates = [
                    f"item:{item.id}:start"
                    for item in rows
                    if item.type == "hotel"
                    and item.check_in
                    and item.check_out
                    and item.check_out > item.check_in
                    and (
                        item.check_in < route_day.date <= item.check_out
                        if side == "start"
                        else item.check_in <= route_day.date < item.check_out
                    )
                ]
            return candidates[0] if len(candidates) == 1 else None

        start_key, end_key = boundary("start"), boundary("end")
        nodes = (
            [start_key] + [key for key in event_keys if key not in {start_key, end_key}] + [end_key]
        )
        if not any(a == meta.from_key and b == meta.to_key for a, b in zip(nodes, nodes[1:])):
            return None
        row_start, row_end = public_point(row.map_place), public_point(row.map_end_place)
        if not row_start or not row_end or row_start != first[1] or row_end != second[1]:
            return None
        start_day, finish_day = (
            by_id.get(row.day_id),
            by_id.get(row.end_day_id) if row.end_day_id else by_id.get(row.day_id),
        )
        if not start_day or not finish_day or not row.start_time or not row.end_time:
            return None
        departure, arrival = (
            absolute(start_day.date, row.start_time),
            absolute(finish_day.date, row.end_time),
        )
        target_available = second[2]["available"]
        expected_arrival_day = (
            target_available // 1440
            if target_available is not None
            else (route_day.date - date(1970, 1, 1)).days
        )
        if (
            arrival - departure != (meta.duration_seconds + 59) // 60
            or (first[2]["available"] is not None and departure < first[2]["available"])
            or arrival // 1440 != expected_arrival_day
            or (target_available is not None and arrival > target_available)
        ):
            return None
        return PublicMovement(mode=meta.mode, duration_seconds=meta.duration_seconds)
    except (
        ValueError,
        TypeError,
        KeyError,
        AttributeError,
        StopIteration,
        ValidationError,
        OverflowError,
    ):
        return None


def public_itinerary(db: Database, trip) -> PublicItinerary:
    day_rows = db.execute(
        select(
            TripDay.id,
            TripDay.date,
            TripDay.country,
            TripDay.city,
            TripDay.place,
            TripDay.title,
            TripDay.client_note,
            TripDay.photo_id,
            TripDay.map_leg_modes,
            TripDay.map_start,
            TripDay.map_end,
        )
        .where(TripDay.trip_id == trip.id)
        .order_by(TripDay.date)
    ).all()
    dates = {day.id: day.date for day in day_rows}
    by_day: dict[UUID | None, list[PublicItem]] = defaultdict(list)
    item_fields = [
        getattr(TripItem, key)
        for key in PublicItem.model_fields
        if key not in {"end_date", "movement"}
    ]
    item_rows = db.execute(
        select(
            TripItem.id,
            TripItem.day_id,
            TripItem.end_day_id,
            TripItem.position,
            TripItem.auto_transfer,
            TripItem.airport_before_minutes,
            TripItem.airport_after_minutes,
            TripItem.publish_external_url,
            *item_fields,
        )
        .where(TripItem.trip_id == trip.id)
        .order_by(TripItem.position, TripItem.id)
    )
    item_rows = item_rows.all()
    days_by_id = {day.id: day for day in day_rows}
    for row in item_rows:
        item = public_item(row, dates)
        if row.auto_transfer is not None:
            if row.day_id not in days_by_id:
                continue
            item.movement = current_movement(row, days_by_id[row.day_id], item_rows, trip, day_rows)
            if item.movement is None:
                continue
        by_day[row.day_id].append(item)
    return PublicItinerary(
        client_title=trip.client_title,
        start_date=trip.start_date,
        end_date=trip.end_date,
        participants=trip.participants,
        client_note=trip.client_note,
        cover_photo_id=trip.cover_photo_id,
        days=[
            PublicDay(
                date=day.date,
                country=day.country,
                city=day.city,
                place=day.place,
                title=day.title,
                client_note=day.client_note,
                photo_id=day.photo_id,
                items=sorted(by_day[day.id], key=lambda item: day_item_minute(item, day.date)),
            )
            for day in day_rows
        ],
        general_items=by_day[None],
    )


@router.get("/api/trips/{trip_id}/public-preview")
def preview_public_trip(trip_id: UUID, user: Admin, db: Database) -> PublicItinerary:
    trip = db.execute(ITINERARY_TRIP.where(Trip.id == trip_id)).one_or_none()
    if trip is None:
        raise HTTPException(404, "Поездка не найдена")
    return public_itinerary(db, trip)


@router.get("/api/public/trips/{token}")
def read_public_trip(token: str, db: Database) -> PublicItinerary:
    if not re.fullmatch(r"[A-Za-z0-9_-]{43}", token):
        raise HTTPException(404, "Маршрут недоступен")
    trip = db.execute(ITINERARY_TRIP.where(Trip.public_link_token == token)).one_or_none()
    if trip is None:
        raise HTTPException(404, "Маршрут недоступен")
    return public_itinerary(db, trip)
