"""Store uploaded day photos with their trip in PostgreSQL."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "d18e47f2c901"
down_revision = "bb3250c9f6aa"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "trip_uploaded_photos",
        sa.Column("id", sa.String(39), primary_key=True),
        sa.Column(
            "trip_id", postgresql.UUID(), sa.ForeignKey("trips.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("content", sa.LargeBinary(), nullable=False),
    )
    op.create_index("ix_trip_uploaded_photos_trip_id", "trip_uploaded_photos", ["trip_id"])


def downgrade():
    op.drop_table("trip_uploaded_photos")
