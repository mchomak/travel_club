"""Exercise the actual migration against seeded legacy rows in an isolated schema."""

import importlib.util
from pathlib import Path
from uuid import uuid4

import pytest
import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy.exc import IntegrityError

from app.db import engine


def test_upgrade_downgrade_upgrade_preserves_legacy_items_and_pending_constraint():
    schema = f"map_workflow_{uuid4().hex}"
    migration_path = (
        Path(__file__).resolve().parents[1]
        / "migrations/versions/d71ce9ab402f_flight_auto_transfers.py"
    )
    spec = importlib.util.spec_from_file_location("map_workflow_migration", migration_path)
    assert spec is not None and spec.loader is not None
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)

    # Everything is transactional, including DDL. No persisted schema is cleared.
    with engine.connect() as connection, connection.begin():
        connection.execute(sa.text(f'CREATE SCHEMA "{schema}"'))
        connection.execute(sa.text(f'SET LOCAL search_path TO "{schema}"'))
        connection.execute(sa.text(
            "CREATE TABLE trip_items (id INTEGER PRIMARY KEY, title TEXT NOT NULL, "
            "included BOOLEAN NOT NULL)"
        ))
        connection.execute(sa.text("INSERT INTO trip_items VALUES (1, 'Legacy flight', TRUE)"))
        with Operations.context(MigrationContext.configure(connection)):
            migration.upgrade()
            row = connection.execute(sa.text("SELECT * FROM trip_items")).mappings().one()
            assert row["title"] == "Legacy flight"
            assert row["departure_country_code"] is None
            assert row["arrival_country_code"] is None
            assert row["departure_city"] == row["arrival_city"] == ""
            assert row["departure_label"] == row["arrival_label"] == ""
            assert row["price_pending"] is False and row["auto_transfer"] is None
            with pytest.raises(IntegrityError), connection.begin_nested():
                connection.execute(sa.text("UPDATE trip_items SET price_pending = TRUE"))
            migration.downgrade()
            legacy = connection.execute(sa.text("SELECT * FROM trip_items")).mappings().one()
            assert set(legacy) == {
                "id", "title", "included",
            }
            migration.upgrade()
            row = connection.execute(sa.text("SELECT * FROM trip_items")).mappings().one()
            assert row["id"] == 1 and row["title"] == "Legacy flight"
            assert row["price_pending"] is False
        # Roll back the disposable schema and all its data after checking it.
        connection.rollback()
