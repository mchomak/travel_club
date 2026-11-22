"""Add descriptive stages to itinerary events."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "ae8139fd62a1"
down_revision = "c82f103dea76"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "trip_items",
        sa.Column(
            "stages", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")
        ),
    )


def downgrade():
    op.drop_column("trip_items", "stages")
