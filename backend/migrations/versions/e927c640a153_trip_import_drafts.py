"""Preserve unapplied import documents as independent drafts."""

import sqlalchemy as sa
from alembic import op

revision = "e927c640a153"
down_revision = "d18e47f2c901"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "trip_import_drafts",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("created_by", sa.Uuid(), sa.ForeignKey("users.id", ondelete="RESTRICT"),
                  nullable=False),
        sa.Column("source", sa.Text(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.CheckConstraint("version > 0", name="import_draft_version"),
    )
    op.create_index("ix_trip_import_drafts_created_by", "trip_import_drafts", ["created_by"])


def downgrade():
    op.drop_index("ix_trip_import_drafts_created_by", table_name="trip_import_drafts")
    op.drop_table("trip_import_drafts")
