"""Optional historical UTC offsets; null retains local-clock legacy schedules."""

import sqlalchemy as sa
from alembic import op

revision = "e82b73ac51d9"
down_revision = "d71ce9ab402f"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("trip_items", sa.Column("departure_utc_offset_minutes", sa.Integer()))
    op.add_column("trip_items", sa.Column("arrival_utc_offset_minutes", sa.Integer()))
    op.create_check_constraint(
        "item_transport_utc_offsets", "trip_items",
        "(departure_utc_offset_minutes IS NULL AND arrival_utc_offset_minutes IS NULL) OR "
        "(departure_utc_offset_minutes IS NOT NULL AND arrival_utc_offset_minutes IS NOT NULL "
        "AND departure_utc_offset_minutes BETWEEN -840 AND 840 "
        "AND arrival_utc_offset_minutes BETWEEN -840 AND 840 "
        "AND type IN ('flight','train_bus','transfer'))",
    )


def downgrade():
    op.drop_constraint("item_transport_utc_offsets", "trip_items", type_="check")
    op.drop_column("trip_items", "arrival_utc_offset_minutes")
    op.drop_column("trip_items", "departure_utc_offset_minutes")
