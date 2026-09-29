from datetime import date, datetime, time
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

MONEY = Numeric(20, 2)
RATE = Numeric(20, 8)


class User(Base):
    __tablename__ = "users"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    login: Mapped[str] = mapped_column(String(120), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Session(Base):
    __tablename__ = "sessions"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    token_digest: Mapped[str] = mapped_column(String(64), unique=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LoginAttempt(Base):
    __tablename__ = "login_attempts"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    login: Mapped[str] = mapped_column(String(120))
    ip: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (
        Index("ix_attempt_login_time", "login", "created_at"),
        Index("ix_attempt_ip_time", "ip", "created_at"),
    )


class Trip(Base):
    __tablename__ = "trips"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    internal_title: Mapped[str] = mapped_column(String(200))
    client_title: Mapped[str] = mapped_column(String(200), default="")
    start_date: Mapped[date]
    end_date: Mapped[date]
    participants: Mapped[int]
    base_currency: Mapped[str] = mapped_column(String(3))
    internal_note: Mapped[str] = mapped_column(Text, default="")
    client_note: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="draft")
    pricing_mode: Mapped[str] = mapped_column(String(20), default="markup")
    pricing_percent: Mapped[Decimal] = mapped_column(Numeric(10, 4), default=Decimal(0))
    created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    version: Mapped[int] = mapped_column(Integer, default=1)
    cost_total: Mapped[Decimal] = mapped_column(MONEY, default=Decimal(0))
    client_price: Mapped[Decimal] = mapped_column(MONEY, default=Decimal(0))
    profit: Mapped[Decimal] = mapped_column(MONEY, default=Decimal(0))
    days: Mapped[list["TripDay"]] = relationship(
        cascade="all, delete-orphan", passive_deletes=True, order_by="TripDay.date"
    )
    items: Mapped[list["TripItem"]] = relationship(
        cascade="all, delete-orphan", passive_deletes=True, foreign_keys="TripItem.trip_id"
    )
    rates: Mapped[list["TripCurrencyRate"]] = relationship(
        cascade="all, delete-orphan", passive_deletes=True
    )
    __table_args__ = (
        CheckConstraint("start_date <= end_date", name="trip_dates"),
        CheckConstraint("participants > 0", name="trip_participants"),
        CheckConstraint("version > 0", name="trip_version"),
        CheckConstraint("status IN ('draft','ready','archived')", name="trip_status"),
        CheckConstraint("pricing_mode IN ('markup','target_margin')", name="trip_pricing_mode"),
        CheckConstraint(
            "pricing_percent >= 0 AND (pricing_mode <> 'target_margin' OR pricing_percent < 100)",
            name="trip_pricing_percent",
        ),
    )


class TripDay(Base):
    __tablename__ = "trip_days"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    trip_id: Mapped[UUID] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), index=True)
    date: Mapped[date]
    country: Mapped[str] = mapped_column(String(120), default="")
    city: Mapped[str] = mapped_column(String(120), default="")
    place: Mapped[str] = mapped_column(String(200), default="")
    title: Mapped[str] = mapped_column(String(200), default="")
    status: Mapped[str] = mapped_column(String(200), default="")
    internal_note: Mapped[str] = mapped_column(Text, default="")
    client_note: Mapped[str] = mapped_column(Text, default="")
    __table_args__ = (
        UniqueConstraint("trip_id", "date", name="uq_day_date"),
        UniqueConstraint("trip_id", "id", name="uq_day_trip_id"),
    )


class TripItem(Base):
    __tablename__ = "trip_items"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    trip_id: Mapped[UUID] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), index=True)
    day_id: Mapped[UUID | None] = mapped_column(index=True)
    end_day_id: Mapped[UUID | None] = mapped_column(index=True)
    position: Mapped[int] = mapped_column(default=0)
    type: Mapped[str] = mapped_column(String(20))
    calculation_mode: Mapped[str] = mapped_column(String(30))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    location: Mapped[str] = mapped_column(String(200), default="")
    start_time: Mapped[time | None]
    end_time: Mapped[time | None]
    external_url: Mapped[str | None] = mapped_column(String(2048))
    internal_note: Mapped[str] = mapped_column(Text, default="")
    client_note: Mapped[str] = mapped_column(Text, default="")
    included: Mapped[bool] = mapped_column(Boolean, default=True)
    currency: Mapped[str] = mapped_column(String(3))
    unit_price: Mapped[Decimal] = mapped_column(MONEY)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=Decimal(1))
    participants_override: Mapped[int | None]
    capacity: Mapped[int | None]
    rooms_override: Mapped[int | None]
    duration_days: Mapped[int] = mapped_column(default=1)
    check_in: Mapped[date | None]
    check_out: Mapped[date | None]
    check_in_time: Mapped[time | None]
    check_out_time: Mapped[time | None]
    original_amount: Mapped[Decimal] = mapped_column(MONEY)
    rate_used: Mapped[Decimal] = mapped_column(RATE)
    normalized_amount: Mapped[Decimal] = mapped_column(MONEY)
    __table_args__ = (
        ForeignKeyConstraint(
            ["trip_id", "day_id"],
            ["trip_days.trip_id", "trip_days.id"],
            name="fk_item_day_same_trip",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["trip_id", "end_day_id"],
            ["trip_days.trip_id", "trip_days.id"],
            name="fk_item_end_day_same_trip",
            ondelete="CASCADE",
        ),
        CheckConstraint(
            "unit_price >= 0 AND quantity > 0 AND duration_days > 0", name="item_positive_inputs"
        ),
        CheckConstraint("capacity IS NULL OR capacity > 0", name="item_capacity"),
        CheckConstraint("rooms_override IS NULL OR rooms_override > 0", name="item_rooms"),
        CheckConstraint(
            "participants_override IS NULL OR participants_override > 0", name="item_people"
        ),
        CheckConstraint("position >= 0", name="item_position"),
        CheckConstraint(
            "type IN ('flight','train_bus','transfer','hotel','excursion',"
            "'activity','rental','insurance','other')",
            name="item_type",
        ),
        CheckConstraint(
            "calculation_mode IN ('per_person','fixed','capacity','hotel','per_day',"
            "'per_person_per_day','manual')",
            name="item_mode",
        ),
    )


class TripCurrencyRate(Base):
    __tablename__ = "trip_currency_rates"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    trip_id: Mapped[UUID] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), index=True)
    currency: Mapped[str] = mapped_column(String(3))
    rate: Mapped[Decimal] = mapped_column(RATE)
    __table_args__ = (
        UniqueConstraint("trip_id", "currency", name="uq_rate_currency"),
        CheckConstraint("rate > 0", name="rate_positive"),
    )
