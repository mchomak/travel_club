"""Add optional calendar schedule fields."""

import sqlalchemy as sa
from alembic import op

revision = "8b97c412e6af"
down_revision = "512ed4d25bb7"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "trip_days", sa.Column("status", sa.String(length=200), nullable=False, server_default="")
    )
    op.add_column("trip_items", sa.Column("end_day_id", sa.Uuid(), nullable=True))
    op.add_column("trip_items", sa.Column("external_url", sa.String(length=2048), nullable=True))
    op.add_column("trip_items", sa.Column("check_in_time", sa.Time(), nullable=True))
    op.add_column("trip_items", sa.Column("check_out_time", sa.Time(), nullable=True))
    op.create_index("ix_trip_items_end_day_id", "trip_items", ["end_day_id"])
    op.create_foreign_key(
        "fk_item_end_day_same_trip",
        "trip_items",
        "trip_days",
        ["trip_id", "end_day_id"],
        ["trip_id", "id"],
        ondelete="CASCADE",
    )


def downgrade():
    op.drop_constraint("fk_item_end_day_same_trip", "trip_items", type_="foreignkey")
    op.drop_index("ix_trip_items_end_day_id", table_name="trip_items")
    op.drop_column("trip_items", "check_out_time")
    op.drop_column("trip_items", "check_in_time")
    op.drop_column("trip_items", "external_url")
    op.drop_column("trip_items", "end_day_id")
    op.drop_column("trip_days", "status")
