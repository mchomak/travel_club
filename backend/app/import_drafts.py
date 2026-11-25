"""Private, revisioned storage for documents that cannot yet become a trip."""

import json
from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import select

from app.auth import Admin, Database
from app.models import Trip, TripImportDraft
from app.schemas import TripExchange
from app.trip_validation import validate_trip_document
from app.trips import document, get_trip, import_trip_document, persist, prepare_import

router = APIRouter(prefix="/api/import-drafts", tags=["import-drafts"])
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024


def unique_pairs(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate key")
        result[key] = value
    return result


async def read_source(request: Request) -> str:
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > MAX_DOCUMENT_SIZE:
            raise HTTPException(413, "Размер файла превышает 10 МБ")
    try:
        source = body.decode("utf-8-sig")
        if "\x00" in source:
            raise ValueError("nul character")
        parsed = json.loads(
            source,
            object_pairs_hook=unique_pairs,
            parse_constant=lambda _: (_ for _ in ()).throw(ValueError()),
        )
        if (
            not isinstance(parsed, dict)
            or parsed.get("format") != "travel-club-trip"
            or type(parsed.get("version")) is not int
            or parsed["version"] != 1
            or not isinstance(parsed.get("trip"), dict)
        ):
            raise ValueError("unsupported envelope")
    except (UnicodeError, ValueError, RecursionError):
        raise HTTPException(422, "Не удалось прочитать документ маршрута версии 1") from None
    return source


def owned(db, draft_id: UUID, user_id: UUID, *, lock: bool = False) -> TripImportDraft:
    query = select(TripImportDraft).where(
        TripImportDraft.id == draft_id, TripImportDraft.created_by == user_id
    )
    if lock:
        query = query.with_for_update()
    draft = db.scalar(query)
    if draft is None:
        raise HTTPException(404, "Черновик импорта не найден")
    return draft


def summary(draft: TripImportDraft) -> dict:
    return {
        "id": draft.id,
        "version": draft.version,
        "trip_id": draft.trip_id,
        "created_at": draft.created_at,
        "updated_at": draft.updated_at,
    }


def full(draft: TripImportDraft) -> dict:
    from sqlalchemy.orm import object_session

    db = object_session(draft)
    trip_version = (
        db.scalar(select(Trip.version).where(Trip.id == draft.trip_id))
        if (db and draft.trip_id)
        else None
    )
    return {
        **summary(draft),
        "source": draft.source,
        "original_source": draft.original_source,
        "unapplied": draft.unapplied,
        "normalized": draft.normalized,
        "resolved": draft.resolved,
        "trip_version": trip_version,
        "validation": validate_trip_document(draft.source),
    }


@router.get("")
def list_drafts(user: Admin, db: Database):
    drafts = db.scalars(
        select(TripImportDraft)
        .where(TripImportDraft.created_by == user.id)
        .order_by(TripImportDraft.updated_at.desc())
    )
    return [summary(draft) for draft in drafts]


@router.post("", status_code=201)
async def create_draft(request: Request, user: Admin, db: Database):
    source = await read_source(request)
    draft = TripImportDraft(created_by=user.id, source=source, original_source=source, version=1)
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return full(draft)


@router.get("/{draft_id}")
def get_draft(draft_id: UUID, user: Admin, db: Database):
    return full(owned(db, draft_id, user.id))


class Resolution(BaseModel):
    trip_version: int = Field(gt=0, strict=True)
    path: str = Field(min_length=1, max_length=4096)
    code: str = Field(min_length=1, max_length=100)


@router.post("/{draft_id}/resolve")
def resolve_import_entry(draft_id: UUID, payload: Resolution, user: Admin, db: Database):
    draft = owned(db, draft_id, user.id, lock=True)
    if draft.trip_id is None:
        raise HTTPException(422, "Сначала создайте поездку")
    trip = get_trip(db, draft.trip_id, lock=True)
    if trip.version != payload.trip_version:
        raise HTTPException(
            409, {"code": "VERSION_CONFLICT", "message": "Поездка изменилась. Обновите данные"}
        )
    entry = next(
        (
            value
            for value in draft.unapplied
            if value.get("path") == payload.path and value.get("code") == payload.code
        ),
        None,
    )
    if entry is None:
        raise HTTPException(404, "Неприменённые данные не найдены")
    draft.unapplied = [value for value in draft.unapplied if value is not entry]
    draft.resolved = [
        *draft.resolved,
        {**entry, "resolved_at": datetime.now(UTC).isoformat(), "resolved_by": str(user.id)},
    ]
    trip.version += 1
    trip.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(draft)
    return full(draft)


@router.post("/{draft_id}/apply")
def apply_draft(draft_id: UUID, version: int, user: Admin, db: Database):
    draft = owned(db, draft_id, user.id, lock=True)
    if draft.trip_id is not None:
        return document(get_trip(db, draft.trip_id))
    if draft.version != version:
        raise HTTPException(
            409, {"code": "VERSION_CONFLICT", "message": "Черновик изменён в другой вкладке"}
        )
    try:
        validation = validate_trip_document(draft.source)
        source = json.loads(draft.source)
        missing_price = any(
            isinstance(item, dict) and "unit_price" not in item
            and not (item.get("price_pending") is True and item.get("included") is False)
            for item in source["trip"].get("items", [])
        ) if isinstance(source["trip"].get("items", []), list) else False
        if validation["document_checks_passed"] and not missing_price:
            payload = TripExchange.model_validate_json(draft.source)
            result = import_trip_document(payload, user, db, commit=False)
        else:
            from app.trip_soft_import import build_soft_candidate

            candidate = build_soft_candidate(source["trip"])
            if candidate["trip"] is None:
                raise HTTPException(422, "Укажите корректные название, даты, участников и валюту")
            unapplied = list(candidate["unapplied"])
            for key in source.keys() - {"format", "version", "trip", "photos", "reimport"}:
                unapplied.append(
                    {
                        "path": "/" + key.replace("~", "~0").replace("/", "~1"),
                        "code": "extra_forbidden",
                    }
                )
            if source.get("photos"):
                unapplied.append({"path": "/photos", "code": "photos_not_applied"})
            draft.unapplied = unapplied
            draft.normalized = candidate["normalized"]
            prepared = prepare_import(candidate["trip"])
            result = persist(db, Trip(created_by=user.id, version=1), prepared, commit=False)
        draft.trip_id = result.id
        db.commit()
        if draft.unapplied:
            result = result.model_copy(update={"unapplied_import_id": draft.id})
    except ValidationError:
        db.rollback()
        raise HTTPException(422, "Сначала исправьте замечания в черновике") from None
    except Exception:
        db.rollback()
        raise
    return result


@router.put("/{draft_id}")
async def update_draft(draft_id: UUID, version: int, request: Request, user: Admin, db: Database):
    source = await read_source(request)
    draft = owned(db, draft_id, user.id, lock=True)
    if draft.trip_id is not None:
        raise HTTPException(
            409,
            {
                "code": "DRAFT_ALREADY_APPLIED",
                "message": "Исходник применённой поездки сохраняется без изменений",
            },
        )
    if draft.version != version:
        raise HTTPException(
            409, {"code": "VERSION_CONFLICT", "message": "Черновик изменён в другой вкладке"}
        )
    draft.source = source
    draft.version += 1
    draft.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(draft)
    return full(draft)
