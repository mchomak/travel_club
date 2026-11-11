"""Limit the Website runtime role to lead DML; it must not manage migrations."""

from alembic import op

revision = "20261111_02"
down_revision = "20261111_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    role = "travel_club_website_app"
    tables = ("leads", "lead_idempotency", "lead_notifications", "lead_rate_events")
    op.execute(f"ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM {role}")
    op.execute(f"ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM {role}")
    for table in (*tables, "alembic_version"):
        op.execute(f"REVOKE ALL PRIVILEGES ON TABLE {table} FROM {role}")
    op.execute(f"REVOKE ALL PRIVILEGES ON SEQUENCE leads_number_seq FROM {role}")
    for table, privileges in (
        ("leads", "SELECT, INSERT, UPDATE"),
        ("lead_idempotency", "SELECT, INSERT, UPDATE, DELETE"),
        ("lead_notifications", "SELECT, INSERT, UPDATE"),
        ("lead_rate_events", "SELECT, INSERT, DELETE"),
    ):
        op.execute(f"GRANT {privileges} ON TABLE {table} TO {role}")
    op.execute(f"GRANT USAGE, SELECT ON SEQUENCE leads_number_seq TO {role}")


def downgrade() -> None:
    # These grants are the minimum runtime contract and must survive schema downgrades.
    pass
