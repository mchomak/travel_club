"""Track source data that could not be represented by an imported trip."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision = "c93e29c5748d"
down_revision = "b82a41cf902d"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "trip_import_drafts",
        sa.Column("unapplied", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
    )
    op.add_column(
        "trip_import_drafts",
        sa.Column("normalized", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
    )


def downgrade():
    op.drop_column("trip_import_drafts", "normalized")
    op.drop_column("trip_import_drafts", "unapplied")
