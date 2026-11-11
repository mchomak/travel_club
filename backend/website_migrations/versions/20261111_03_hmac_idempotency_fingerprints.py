"""Version Website idempotency request fingerprints."""

import sqlalchemy as sa
from alembic import op

revision = "20261111_03"
down_revision = "20261111_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Existing rows contain the previous bare SHA-256 fingerprint (version 0).
    # New inserts use the domain-separated HMAC (version 1) by default.
    op.add_column(
        "lead_idempotency",
        sa.Column("request_digest_version", sa.Integer(), server_default="0", nullable=False),
    )
    op.create_check_constraint(
        "lead_idempotency_request_digest_version",
        "lead_idempotency",
        "request_digest_version IN (0, 1)",
    )
    op.alter_column(
        "lead_idempotency",
        "request_digest_version",
        existing_type=sa.Integer(),
        server_default="1",
    )


def downgrade() -> None:
    op.drop_constraint(
        "lead_idempotency_request_digest_version", "lead_idempotency", type_="check"
    )
    op.drop_column("lead_idempotency", "request_digest_version")
