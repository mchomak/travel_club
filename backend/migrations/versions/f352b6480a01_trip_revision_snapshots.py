"""Snapshots for explicit three-way reimport and recovery."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision = "f352b6480a01"
down_revision = "e927c640a153"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "trip_revision_snapshots",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("trip_id", sa.Uuid(), sa.ForeignKey("trips.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("created_by", sa.Uuid(), sa.ForeignKey("users.id", ondelete="RESTRICT"),
                  nullable=False),
        sa.Column("trip_version", sa.Integer(), nullable=False),
        sa.Column("kind", sa.String(10), nullable=False),
        sa.Column("data", JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.CheckConstraint("trip_version > 0", name="revision_snapshot_version"),
        sa.CheckConstraint("kind IN ('export','backup')", name="revision_snapshot_kind"),
    )
    op.create_index("ix_trip_revision_snapshots_trip_id", "trip_revision_snapshots", ["trip_id"])


def downgrade():
    op.drop_index("ix_trip_revision_snapshots_trip_id", table_name="trip_revision_snapshots")
    op.drop_table("trip_revision_snapshots")
