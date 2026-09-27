import os
from pathlib import Path

import pytest
from argon2 import PasswordHasher
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Local tests use the same PostgreSQL server with transaction isolation per test.
# Load only the secret; never echo it or a connection URL.
env_path = Path(__file__).resolve().parents[2] / ".env"
if env_path.exists() and "POSTGRES_PASSWORD" not in os.environ:
    for line in env_path.read_text(encoding="utf-8").splitlines():
        if line.startswith("POSTGRES_PASSWORD="):
            os.environ["POSTGRES_PASSWORD"] = line.partition("=")[2]

from app.db import engine, get_db  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models import User  # noqa: E402

FIXTURE_PASSWORD = "FICTIONAL-TEST-PASSWORD-ONLY-7391"


@pytest.fixture
def db():
    with engine.connect() as connection:
        transaction = connection.begin()
        with Session(bind=connection, join_transaction_mode="create_savepoint") as session:
            yield session
        transaction.rollback()


@pytest.fixture
def admin(db):
    user = User(login="fixture-admin", password_hash=PasswordHasher().hash(FIXTURE_PASSWORD))
    db.add(user)
    db.commit()
    return user


@pytest.fixture
def client(db):
    application = create_app()
    application.dependency_overrides[get_db] = lambda: db
    with TestClient(application) as test_client:
        yield test_client
