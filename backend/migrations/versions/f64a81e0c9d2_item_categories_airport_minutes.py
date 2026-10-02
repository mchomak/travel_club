"""Add item subtype, meal category, and flight airport intervals."""

import sqlalchemy as sa
from alembic import op

revision = "f64a81e0c9d2"
down_revision = "8b97c412e6af"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("trip_items", sa.Column("subtype", sa.String(length=30), nullable=True))
    op.add_column(
        "trip_items",
        sa.Column("airport_before_minutes", sa.Integer(), nullable=False, server_default="180"),
    )
    op.add_column(
        "trip_items",
        sa.Column("airport_after_minutes", sa.Integer(), nullable=False, server_default="60"),
    )
    op.drop_constraint("item_type", "trip_items", type_="check")
    op.create_check_constraint(
        "item_type", "trip_items",
        "type IN ('flight','train_bus','transfer','hotel','excursion',"
        "'activity','rental','insurance','meal','other')",
    )
    op.create_check_constraint(
        "item_airport_minutes", "trip_items",
        "airport_before_minutes BETWEEN 0 AND 1440 AND "
        "airport_after_minutes BETWEEN 0 AND 1440",
    )


def downgrade():
    op.execute(
        "DO $$ BEGIN IF EXISTS (SELECT 1 FROM trip_items WHERE type = 'meal') THEN "
        "RAISE EXCEPTION 'Cannot downgrade while meal items exist'; "
        "END IF; END $$"
    )
    op.drop_constraint("item_airport_minutes", "trip_items", type_="check")
    op.drop_constraint("item_type", "trip_items", type_="check")
    op.create_check_constraint(
        "item_type", "trip_items",
        "type IN ('flight','train_bus','transfer','hotel','excursion',"
        "'activity','rental','insurance','other')",
    )
    op.drop_column("trip_items", "airport_after_minutes")
    op.drop_column("trip_items", "airport_before_minutes")
    op.drop_column("trip_items", "subtype")
