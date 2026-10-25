"""Persist flight cities and auto transfer snapshots, with unknown price state."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "d71ce9ab402f"
down_revision = "a2f7c91b4d60"
branch_labels = None
depends_on = None


def upgrade():
    for endpoint in ("departure", "arrival"):
        op.add_column("trip_items", sa.Column(f"{endpoint}_country_code", sa.String(2)))
        op.add_column("trip_items", sa.Column(
            f"{endpoint}_city", sa.String(120), nullable=False, server_default="",
        ))
        op.add_column("trip_items", sa.Column(
            f"{endpoint}_label", sa.String(200), nullable=False, server_default="",
        ))
    op.add_column("trip_items", sa.Column("auto_transfer", postgresql.JSONB()))
    op.add_column("trip_items", sa.Column(
        "price_pending", sa.Boolean(), nullable=False, server_default=sa.false(),
    ))
    op.create_check_constraint(
        "item_pending_price_excluded", "trip_items", "NOT (price_pending AND included)",
    )


def downgrade():
    op.drop_constraint("item_pending_price_excluded", "trip_items", type_="check")
    for name in (
        "price_pending", "auto_transfer", "arrival_label", "arrival_city",
        "arrival_country_code", "departure_label", "departure_city", "departure_country_code",
    ):
        op.drop_column("trip_items", name)
