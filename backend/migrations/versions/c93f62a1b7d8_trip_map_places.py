"""Persist event places and day map preferences without changing legacy data."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision = "c93f62a1b7d8"
down_revision = "f64a81e0c9d2"
branch_labels = None
depends_on = None


def upgrade():
    for name in ("map_place", "map_end_place"):
        op.add_column("trip_items", sa.Column(name, JSONB(), nullable=True))
    for name in ("map_start", "map_end"):
        op.add_column("trip_days", sa.Column(name, JSONB(), nullable=True))
    op.add_column(
        "trip_days", sa.Column("map_leg_modes", JSONB(), nullable=False, server_default="[]")
    )


def downgrade():
    op.drop_column("trip_days", "map_leg_modes")
    for name in ("map_start", "map_end"):
        op.drop_column("trip_days", name)
    for name in ("map_place", "map_end_place"):
        op.drop_column("trip_items", name)
