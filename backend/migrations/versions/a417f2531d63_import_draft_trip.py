"""Link a successfully applied import draft to its trip."""

import sqlalchemy as sa
from alembic import op

revision = "a417f2531d63"
down_revision = "f352b6480a01"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("trip_import_drafts", sa.Column("trip_id", sa.Uuid(), nullable=True))
    op.create_foreign_key("fk_import_draft_trip", "trip_import_drafts", "trips",
                          ["trip_id"], ["id"], ondelete="SET NULL")


def downgrade():
    op.drop_constraint("fk_import_draft_trip", "trip_import_drafts", type_="foreignkey")
    op.drop_column("trip_import_drafts", "trip_id")
