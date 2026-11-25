"""Persist dismissals of current, non-blocking business validation findings."""

import hashlib
import json
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import ForeignKey, String, UniqueConstraint, select
from sqlalchemy.orm import Mapped, mapped_column

from app.auth import Admin, Database
from app.db import Base
from app.trip_business_validation import validate_business_rules
from app.trips import get_trip, read_input

router = APIRouter(prefix="/api/trips", tags=["trip validation"])


class ValidationIgnore(Base):
    __tablename__ = "trip_validation_ignores"
    trip_id: Mapped[UUID] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE"), primary_key=True
    )
    issue_id: Mapped[str] = mapped_column(String(80), primary_key=True)
    fingerprint: Mapped[str] = mapped_column(String(64))
    reason: Mapped[str] = mapped_column(String(1000))
    __table_args__ = (UniqueConstraint("trip_id", "issue_id", name="uq_trip_validation_ignore"),)


class IgnoreRequest(BaseModel):
    issue_id: str = Field(min_length=1, max_length=80)
    version: int = Field(gt=0, strict=True)
    reason: str = Field(min_length=1, max_length=1000)

    @field_validator("reason")
    @classmethod
    def nonempty_reason(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Укажите причину")
        return value


def _fingerprint(issue: dict) -> str:
    # Paths are presentation positions and change when items are reordered.
    fields = ("code", "severity", "current_value", "expected", "message", "scope",
              "day_id", "item_id", "stage_id")
    content = {key: issue.get(key) for key in fields}
    encoded = json.dumps(jsonable_encoder(content), sort_keys=True, ensure_ascii=False,
                         separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def annotate_ignored(db, trip_id, issues):
    records = db.scalars(select(ValidationIgnore).where(ValidationIgnore.trip_id == trip_id)).all()
    by_id = {record.issue_id: record for record in records}
    result = []
    for issue in issues:
        record = by_id.get(issue["id"])
        ignored = bool(record and record.fingerprint == _fingerprint(issue)
                       and issue["severity"] in ("warning", "info"))
        result.append({**issue, "ignored": ignored,
                       "ignore_reason": record.reason if ignored else None})
    return result


def _check_version(trip, version):
    if trip.version != version:
        raise HTTPException(409, {"code": "VERSION_CONFLICT", "message": "Поездка изменилась",
                                  "details": {"current_version": trip.version}})


@router.post("/{trip_id}/validation/ignore")
def ignore_issue(trip_id: UUID, payload: IgnoreRequest, user: Admin, db: Database):
    trip = get_trip(db, trip_id, lock=True)
    _check_version(trip, payload.version)
    issue = next((item for item in validate_business_rules(read_input(trip))
                  if item["id"] == payload.issue_id), None)
    if issue is None:
        raise HTTPException(404, "Замечание не найдено")
    if issue["severity"] not in ("warning", "info"):
        raise HTTPException(422, "Это замечание нельзя пропустить")
    record = db.get(ValidationIgnore, (trip_id, payload.issue_id))
    if record is None:
        record = ValidationIgnore(trip_id=trip_id, issue_id=payload.issue_id)
        db.add(record)
    record.fingerprint = _fingerprint(issue)
    record.reason = payload.reason
    db.commit()
    return {"version": trip.version}


@router.delete("/{trip_id}/validation/ignore/{issue_id}")
def restore_issue(trip_id: UUID, issue_id: str, user: Admin, db: Database,
                  version: int = Query(gt=0)):
    trip = get_trip(db, trip_id, lock=True)
    _check_version(trip, version)
    record = db.get(ValidationIgnore, (trip_id, issue_id))
    if record is None:
        raise HTTPException(404, "Пропущенное замечание не найдено")
    db.delete(record)
    db.commit()
    return {"version": trip.version}
