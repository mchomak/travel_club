from sqlalchemy import Column, ForeignKey, LargeBinary, String, Table

from app.db import Base

uploaded_photos = Table(
    "trip_uploaded_photos",
    Base.metadata,
    Column("id", String(39), primary_key=True),
    Column("trip_id", ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True),
    Column("content", LargeBinary, nullable=False),
)
