import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine

from app.leads.models import WebsiteBase

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

database_url = os.environ.get("WEBSITE_MIGRATION_DATABASE_URL", "")
if not database_url:
    raise RuntimeError("WEBSITE_MIGRATION_DATABASE_URL is required for Website migrations")
config.set_main_option("sqlalchemy.url", database_url.replace("%", "%%"))
target_metadata = WebsiteBase.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(database_url, pool_pre_ping=True, hide_parameters=True)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()
    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
