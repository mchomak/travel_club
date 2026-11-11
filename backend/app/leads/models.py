from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    LargeBinary,
    String,
    Text,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class WebsiteBase(DeclarativeBase):
    """Metadata for the isolated Website database."""


class Lead(WebsiteBase):
    __tablename__ = "leads"

    number: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id: Mapped[UUID] = mapped_column(default=uuid4, unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    product_id: Mapped[str] = mapped_column(String(40), nullable=False)
    contact_method: Mapped[str] = mapped_column(String(20), nullable=False)
    contact_value: Mapped[str] = mapped_column(String(254), nullable=False)
    name: Mapped[str | None] = mapped_column(String(120))
    message: Mapped[str | None] = mapped_column(Text)
    telegram_details_consent_version: Mapped[str | None] = mapped_column(String(40))
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="unknown")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="new")
    consent_accepted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    __table_args__ = (
        CheckConstraint(
            "contact_method IN ('telegram','email','instagram','phone')",
            name="lead_contact_method",
        ),
        CheckConstraint("source IN ('home','formats','service','unknown')", name="lead_source"),
        CheckConstraint("status IN ('new','in_progress','closed')", name="lead_status"),
        Index("ix_leads_created_at", "created_at"),
        Index("ix_leads_status_created", "status", "created_at"),
    )


class LeadIdempotency(WebsiteBase):
    __tablename__ = "lead_idempotency"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    key_digest: Mapped[bytes] = mapped_column(LargeBinary(32), unique=True, nullable=False)
    request_digest: Mapped[bytes] = mapped_column(LargeBinary(32), nullable=False)
    # Version 0 fingerprints were plain SHA-256. Keep them identifiable so old
    # idempotency records remain replayable only until their existing TTL expires.
    request_digest_version: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default="1"
    )
    lead_id: Mapped[UUID] = mapped_column(
        ForeignKey("leads.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    receipt_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    __table_args__ = (Index("ix_lead_idempotency_expires", "expires_at"),)


class LeadNotification(WebsiteBase):
    __tablename__ = "lead_notifications"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    lead_id: Mapped[UUID] = mapped_column(
        ForeignKey("leads.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    next_attempt_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_error_code: Mapped[str | None] = mapped_column(String(40))
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending','sending','sent','dead')", name="lead_notification_status"
        ),
        Index("ix_lead_notifications_pending", "status", "next_attempt_at"),
    )


class LeadRateEvent(WebsiteBase):
    __tablename__ = "lead_rate_events"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    ip_digest: Mapped[bytes] = mapped_column(LargeBinary(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    __table_args__ = (Index("ix_lead_rate_events_ip_time", "ip_digest", "created_at"),)
