"""Persist trip validation dismissals."""

import sqlalchemy as sa
from alembic import op

revision = "b82a41cf902d"
down_revision = "a417f2531d63"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "trip_validation_ignores",
        sa.Column("trip_id", sa.Uuid(), sa.ForeignKey("trips.id", ondelete="CASCADE"),
                  primary_key=True),
        sa.Column("issue_id", sa.String(80), primary_key=True),
        sa.Column("fingerprint", sa.String(64), nullable=False),
        sa.Column("reason", sa.String(1000), nullable=False),
        sa.UniqueConstraint("trip_id", "issue_id", name="uq_trip_validation_ignore"),
    )


def downgrade():
    op.drop_table("trip_validation_ignores")
