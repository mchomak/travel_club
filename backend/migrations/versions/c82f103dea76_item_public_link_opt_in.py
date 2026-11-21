"""Keep existing item links private unless explicitly shared."""

import sqlalchemy as sa
from alembic import op

revision = "c82f103dea76"
down_revision = "f17a620cd99b"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "trip_items",
        sa.Column("publish_external_url", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade():
    op.drop_column("trip_items", "publish_external_url")
