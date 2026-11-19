"""Private Website lead operations; never routed by the public gateway."""

import hmac
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.leads.config import get_lead_settings
from app.leads.db import get_website_session
from app.leads.models import Lead, LeadNotification


def require_service_key(x_website_admin_key: Annotated[str, Header()] = ""):
    secret = get_lead_settings().website_admin_secret.get_secret_value()
    if len(secret) < 32 or not hmac.compare_digest(secret.encode(), x_website_admin_key.encode()):
        raise HTTPException(status_code=401, detail="Unauthorized")


router = APIRouter(prefix="/internal/leads", dependencies=[Depends(require_service_key)])
DB = Annotated[Session, Depends(get_website_session)]


class StatusUpdate(BaseModel):
    status: Literal["new", "in_progress", "closed"]


def serialize(lead: Lead, notification: LeadNotification | None, detail: bool = False):
    result = {
        "id": str(lead.id),
        "number": f"TC-{lead.number:06d}",
        "created_at": lead.created_at,
        "product_id": lead.product_id,
        "source": lead.source,
        "status": lead.status,
        "notification_status": notification.status if notification else None,
    }
    if detail:
        result.update(
            name=lead.name,
            contact_method=lead.contact_method,
            contact_value=lead.contact_value,
            message=lead.message,
            notification_attempts=notification.attempts if notification else None,
            notification_error=notification.last_error_code if notification else None,
        )
    return result


@router.get("")
def list_leads(session: DB, offset: int = 0):
    if offset < 0:
        raise HTTPException(422, "Invalid offset")
    rows = session.execute(
        select(Lead, LeadNotification)
        .outerjoin(LeadNotification, Lead.id == LeadNotification.lead_id)
        .order_by(Lead.created_at.desc(), Lead.number.desc())
        .offset(offset)
        .limit(50)
    ).all()
    counts = dict(session.execute(select(Lead.status, func.count()).group_by(Lead.status)).all())
    return {
        "items": [serialize(lead, notice) for lead, notice in rows],
        "counts": {status: counts.get(status, 0) for status in ("new", "in_progress", "closed")},
    }


def get_row(session: Session, lead_id: UUID):
    row = session.execute(
        select(Lead, LeadNotification)
        .outerjoin(LeadNotification, Lead.id == LeadNotification.lead_id)
        .where(Lead.id == lead_id)
    ).first()
    if row is None:
        raise HTTPException(404, "Not found")
    return row


@router.get("/{lead_id}")
def detail(lead_id: UUID, session: DB):
    return serialize(*get_row(session, lead_id), detail=True)


@router.patch("/{lead_id}")
def update_status(lead_id: UUID, payload: StatusUpdate, session: DB):
    lead, notice = get_row(session, lead_id)
    lead.status = payload.status
    session.commit()
    return serialize(lead, notice, detail=True)
