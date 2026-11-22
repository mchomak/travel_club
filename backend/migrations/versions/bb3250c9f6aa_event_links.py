"""Add typed map and booking links to itinerary items."""

import sqlalchemy as sa
from alembic import op

revision = "bb3250c9f6aa"
down_revision = "ae8139fd62a1"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("trip_items", sa.Column("map_url", sa.String(2048), nullable=True))
    op.add_column("trip_items", sa.Column("booking_url", sa.String(2048), nullable=True))


def downgrade():
    op.drop_column("trip_items", "booking_url")
    op.drop_column("trip_items", "map_url")
