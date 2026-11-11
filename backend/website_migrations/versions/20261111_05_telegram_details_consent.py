"""Record the disclosure version that permits sending lead details to Telegram."""

import sqlalchemy as sa
from alembic import op

revision = "20261111_05"
down_revision = "20261111_04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "leads",
        sa.Column("telegram_details_consent_version", sa.String(length=40), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("leads", "telegram_details_consent_version")
