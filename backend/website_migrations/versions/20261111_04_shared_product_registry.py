"""Use the shared Website product registry as the authoritative allowlist."""

from alembic import op

revision = "20261111_04"
down_revision = "20261111_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Product IDs and availability are validated against the shared versioned
    # registry at the API boundary. A duplicated static CHECK would drift.
    op.drop_constraint("lead_product_id", "leads", type_="check")


def downgrade() -> None:
    op.create_check_constraint(
        "lead_product_id",
        "leads",
        "product_id IN ('route','complete','group','moscow_guide','undecided')",
    )
