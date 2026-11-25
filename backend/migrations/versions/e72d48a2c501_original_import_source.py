"""Keep the originally uploaded document after draft edits."""

import sqlalchemy as sa
from alembic import op

revision = "e72d48a2c501"
down_revision = "d103f65a90bc"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("trip_import_drafts", sa.Column("original_source", sa.Text(), nullable=True))
    op.execute("UPDATE trip_import_drafts SET original_source = source")
    op.alter_column("trip_import_drafts", "original_source", nullable=False)


def downgrade():
    op.drop_column("trip_import_drafts", "original_source")
