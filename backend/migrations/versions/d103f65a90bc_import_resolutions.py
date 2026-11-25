"""Keep an audit trail of manually reconciled import entries."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision = "d103f65a90bc"
down_revision = "c93e29c5748d"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "trip_import_drafts",
        sa.Column("resolved", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
    )


def downgrade():
    op.drop_column("trip_import_drafts", "resolved")
