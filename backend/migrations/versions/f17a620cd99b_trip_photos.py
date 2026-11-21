"""Store the curated trip cover and day photo selections."""

import sqlalchemy as sa
from alembic import op

revision = "f17a620cd99b"
down_revision = "ba14ad6f91cc"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("trips", sa.Column("cover_photo_id", sa.String(80), nullable=True))
    op.add_column("trip_days", sa.Column("photo_id", sa.String(80), nullable=True))


def downgrade():
    op.drop_column("trip_days", "photo_id")
    op.drop_column("trips", "cover_photo_id")
