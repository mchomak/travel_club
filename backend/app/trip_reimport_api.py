"""Authenticated, revision-checked reimport of an existing trip."""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import select

from app.auth import Admin, Database
from app.models import TripImportDraft, TripRevisionSnapshot
from app.pricing import PricingError, calculate_trip
from app.schemas import TripInput
from app.trip_business_validation import validate_business_rules
from app.trip_reimport import apply_reimport, preview_reimport
from app.trips import get_trip, persist, read_input, reconcile_dates, validate_ownership

router = APIRouter(prefix="/api/trips", tags=["trip reimport"])


class PreviewRequest(BaseModel):
    snapshot_id: UUID
    proposed: dict[str, Any]


class ApplyRequest(PreviewRequest):
    expected_version: int = Field(gt=0, strict=True)
    selected_paths: list[str]
    confirm_date_removal: bool = False


class RestoreRequest(BaseModel):
    snapshot_id: UUID
    expected_version: int = Field(gt=0, strict=True)
    confirm_date_removal: bool = False


def _snapshot(db, trip, user, kind, data):
    snapshot = TripRevisionSnapshot(
        trip_id=trip.id, created_by=user.id, trip_version=trip.version, kind=kind, data=data
    )
    db.add(snapshot)
    db.flush()
    return snapshot


def _get_snapshot(db, trip_id, snapshot_id, kind):
    snapshot = db.scalar(select(TripRevisionSnapshot).where(
        TripRevisionSnapshot.id == snapshot_id, TripRevisionSnapshot.trip_id == trip_id,
        TripRevisionSnapshot.kind == kind,
    ))
    if snapshot is None:
        raise HTTPException(404, "Снимок не найден")
    return snapshot


def _version(trip, expected):
    if trip.version != expected:
        raise HTTPException(409, {"code": "VERSION_CONFLICT", "message": "Поездка изменилась",
                                  "details": {"current_version": trip.version}})


def _validated(raw):
    try:
        return TripInput.model_validate(raw)
    except ValidationError:
        raise HTTPException(422, "Проверьте данные поездки") from None


def _business(raw):
    try:
        payload = TripInput.model_validate(raw)
    except ValidationError:
        return None
    return validate_business_rules(payload)


def _estimate(raw):
    try:
        payload = TripInput.model_validate(raw)
        calculation = calculate_trip(payload)
    except (ValidationError, PricingError, ArithmeticError, ValueError, KeyError):
        return None
    return {
        "cost_total": str(calculation.cost_total),
        "client_price": str(calculation.client_price),
        "profit": str(calculation.profit),
        "incomplete": any(item.price_pending for item in payload.items),
        "currency": payload.base_currency,
    }


def _prepare(db, trip, original, raw, confirmed):
    candidate = _validated(raw)
    if candidate.status == "ready" and db.scalar(select(TripImportDraft.id).where(
        TripImportDraft.trip_id == trip.id, TripImportDraft.unapplied != []
    ).limit(1)):
        raise HTTPException(422, "Сначала исправьте неприменённые данные импорта")
    validate_ownership(db, trip.id, candidate)
    # Existing calendar invariant forbids removing days inside the date range.
    supplied = {day.id for day in candidate.days}
    if any(day.id not in supplied and candidate.start_date <= day.date <= candidate.end_date
           for day in original.days):
        raise HTTPException(422, "День внутри диапазона поездки нельзя удалить")
    return reconcile_dates(candidate, original, confirmed)


@router.post("/{trip_id}/reimport/export")
def export_snapshot(trip_id: UUID, user: Admin, db: Database):
    trip = get_trip(db, trip_id, lock=True)
    data = read_input(trip).model_dump(mode="json")
    snapshot = _snapshot(db, trip, user, "export", data)
    result = {"snapshot_id": str(snapshot.id), "version": trip.version, "trip": data}
    db.commit()
    return result


@router.get("/{trip_id}/reimport/backups")
def list_backups(trip_id: UUID, user: Admin, db: Database):
    trip = get_trip(db, trip_id)
    snapshots = db.scalars(select(TripRevisionSnapshot).where(
        TripRevisionSnapshot.trip_id == trip.id, TripRevisionSnapshot.kind == "backup"
    ).order_by(TripRevisionSnapshot.created_at.desc(), TripRevisionSnapshot.id))
    return [{"id": str(snapshot.id), "trip_version": snapshot.trip_version,
             "created_at": snapshot.created_at} for snapshot in snapshots]


@router.post("/{trip_id}/reimport/preview")
def preview(trip_id: UUID, payload: PreviewRequest, user: Admin, db: Database):
    trip = get_trip(db, trip_id)
    snapshot = _get_snapshot(db, trip_id, payload.snapshot_id, "export")
    current = read_input(trip).model_dump(mode="json")
    try:
        changes = preview_reimport(snapshot.data, current, payload.proposed)
    except ValueError:
        raise HTTPException(422, "Неоднозначные идентификаторы в документе") from None
    return {
        "version": trip.version,
        "changes": changes,
        "validation_before": _business(current),
        "validation_after": _business(payload.proposed),
        "estimate_before": _estimate(current),
        "estimate_after": _estimate(payload.proposed),
    }


@router.post("/{trip_id}/reimport/apply")
def apply(trip_id: UUID, payload: ApplyRequest, user: Admin, db: Database):
    trip = get_trip(db, trip_id, lock=True)
    _version(trip, payload.expected_version)
    snapshot = _get_snapshot(db, trip_id, payload.snapshot_id, "export")
    original = read_input(trip)
    current = original.model_dump(mode="json")
    try:
        changes = preview_reimport(snapshot.data, current, payload.proposed)
    except ValueError:
        raise HTTPException(422, "Неоднозначные идентификаторы в документе") from None
    by_path = {change["path"]: change for change in changes}
    if (len(set(payload.selected_paths)) != len(payload.selected_paths)
            or any(path not in by_path or by_path[path]["conflict"]
                   for path in payload.selected_paths)):
        raise HTTPException(409, "Изменения устарели или конфликтуют с ручными правками")
    try:
        merged = apply_reimport(snapshot.data, current, payload.proposed, payload.selected_paths)
    except ValueError:
        raise HTTPException(422, "Изменения нельзя безопасно применить") from None
    editable = _prepare(db, trip, original, merged, payload.confirm_date_removal)
    backup = _snapshot(db, trip, user, "backup", current)
    backup_id = str(backup.id)
    try:
        result = persist(db, trip, editable, increment_version=True)
    except Exception:
        db.rollback()
        raise
    return {"trip": result, "backup_snapshot_id": backup_id}


@router.post("/{trip_id}/reimport/restore")
def restore(trip_id: UUID, payload: RestoreRequest, user: Admin, db: Database):
    trip = get_trip(db, trip_id, lock=True)
    _version(trip, payload.expected_version)
    snapshot = _get_snapshot(db, trip_id, payload.snapshot_id, "backup")
    original = read_input(trip)
    current = original.model_dump(mode="json")
    editable = _prepare(db, trip, original, snapshot.data, payload.confirm_date_removal)
    backup = _snapshot(db, trip, user, "backup", current)
    backup_id = str(backup.id)
    try:
        result = persist(db, trip, editable, increment_version=True)
    except Exception:
        db.rollback()
        raise
    return {"trip": result, "backup_snapshot_id": backup_id}
