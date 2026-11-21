"""Store one retrievable, revocable client link per trip."""

import sqlalchemy as sa
from alembic import op

revision = "ba14ad6f91cc"
down_revision = "e82b73ac51d9"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("trips", sa.Column("public_link_token", sa.String(43), nullable=True))
    op.create_unique_constraint("uq_trips_public_link_token", "trips", ["public_link_token"])


def downgrade():
    op.drop_constraint("uq_trips_public_link_token", "trips", type_="unique")
    op.drop_column("trips", "public_link_token")
