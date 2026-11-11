"""Create isolated Website leads and outbox tables."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20261111_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "leads",
        sa.Column("number", sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("product_id", sa.String(40), nullable=False),
        sa.Column("contact_method", sa.String(20), nullable=False),
        sa.Column("contact_value", sa.String(254), nullable=False),
        sa.Column("name", sa.String(120)),
        sa.Column("message", sa.Text()),
        sa.Column("source", sa.String(20), nullable=False, server_default="unknown"),
        sa.Column("status", sa.String(20), nullable=False, server_default="new"),
        sa.Column(
            "consent_accepted_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "product_id IN ('route','complete','group','moscow_guide','undecided')",
            name="lead_product_id",
        ),
        sa.CheckConstraint(
            "contact_method IN ('telegram','email','instagram','phone')",
            name="lead_contact_method",
        ),
        sa.CheckConstraint("source IN ('home','formats','service','unknown')", name="lead_source"),
        sa.CheckConstraint("status IN ('new','in_progress','closed')", name="lead_status"),
    )
    op.create_index("ix_leads_created_at", "leads", ["created_at"])
    op.create_index("ix_leads_status_created", "leads", ["status", "created_at"])

    op.create_table(
        "lead_idempotency",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("key_digest", sa.LargeBinary(32), nullable=False, unique=True),
        sa.Column("request_digest", sa.LargeBinary(32), nullable=False),
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("receipt_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_lead_idempotency_expires", "lead_idempotency", ["expires_at"])

    op.create_table(
        "lead_notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "next_attempt_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("sent_at", sa.DateTime(timezone=True)),
        sa.Column("last_error_code", sa.String(40)),
        sa.Column("locked_until", sa.DateTime(timezone=True)),
        sa.CheckConstraint(
            "status IN ('pending','sending','sent','dead')", name="lead_notification_status"
        ),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_lead_notifications_pending", "lead_notifications", ["status", "next_attempt_at"]
    )

    op.create_table(
        "lead_rate_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("ip_digest", sa.LargeBinary(32), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_lead_rate_events_ip_time", "lead_rate_events", ["ip_digest", "created_at"])

    for table, privileges in (
        ("leads", "SELECT, INSERT, UPDATE"),
        ("lead_idempotency", "SELECT, INSERT, UPDATE, DELETE"),
        ("lead_notifications", "SELECT, INSERT, UPDATE"),
        ("lead_rate_events", "SELECT, INSERT, DELETE"),
    ):
        op.execute(f"GRANT {privileges} ON TABLE {table} TO travel_club_website_app")
    op.execute("GRANT USAGE, SELECT ON SEQUENCE leads_number_seq TO travel_club_website_app")


def downgrade() -> None:
    op.drop_table("lead_rate_events")
    op.drop_table("lead_notifications")
    op.drop_index("ix_lead_idempotency_expires", table_name="lead_idempotency")
    op.drop_table("lead_idempotency")
    op.drop_index("ix_leads_status_created", table_name="leads")
    op.drop_index("ix_leads_created_at", table_name="leads")
    op.drop_table("leads")
