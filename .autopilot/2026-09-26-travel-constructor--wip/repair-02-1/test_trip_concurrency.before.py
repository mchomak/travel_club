from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from uuid import uuid4

from argon2 import PasswordHasher
from fastapi import Request
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy.schema import CreateSchema, DropSchema

from app.db import Base, engine, get_db
from app.main import create_app
from app.models import User
from tests.conftest import FIXTURE_PASSWORD
from tests.test_auth import HEADERS
from tests.test_trips import create_trip, editable


def test_simultaneous_puts_preserve_one_winner_with_independent_postgres_sessions():
    # An isolated schema allows real commits and separate connections without
    # creating any users or trips in the application's business tables.
    schema = f"test_concurrent_{uuid4().hex}"
    isolated_engine = engine.execution_options(schema_translate_map={None: schema})
    with engine.begin() as connection:
        connection.execute(CreateSchema(schema))
    try:
        Base.metadata.create_all(isolated_engine)
        with Session(isolated_engine) as db:
            db.add(
                User(
                    login="concurrency-fixture",
                    password_hash=PasswordHasher().hash(FIXTURE_PASSWORD),
                )
            )
            db.commit()
        barrier = Barrier(2)

        def independent_db(request: Request):
            with Session(isolated_engine) as db:
                if request.method == "PUT":
                    barrier.wait(timeout=10)
                yield db

        application = create_app()
        application.dependency_overrides[get_db] = independent_db
        with TestClient(application) as first, TestClient(application) as second:
            for client in (first, second):
                assert (
                    client.post(
                        "/api/auth/login",
                        headers=HEADERS,
                        json={
                            "login": "concurrency-fixture",
                            "password": FIXTURE_PASSWORD,
                        },
                    ).status_code
                    == 200
                )
            saved = create_trip(first)
            path = f"/api/trips/{saved['id']}"
            for attempt in range(3):
                left = editable(saved)
                right = editable(saved)
                left["internal_note"] = f"Left save {attempt}"
                right["internal_note"] = f"Right save {attempt}"
                left["items"] = [
                    {
                        "id": str(uuid4()),
                        "title": "Left item",
                        "type": "other",
                        "calculation_mode": "fixed",
                        "currency": "RUB",
                        "unit_price": "100",
                    }
                ]
                right["items"] = [
                    {
                        "id": str(uuid4()),
                        "title": "Right item",
                        "type": "other",
                        "calculation_mode": "fixed",
                        "currency": "RUB",
                        "unit_price": "200",
                    }
                ]
                with ThreadPoolExecutor(max_workers=2) as pool:
                    left_future = pool.submit(first.put, path, headers=HEADERS, json=left)
                    right_future = pool.submit(second.put, path, headers=HEADERS, json=right)
                    responses = [left_future.result(timeout=15), right_future.result(timeout=15)]
                assert sorted(response.status_code for response in responses) == [200, 409]
                winner = next(
                    response.json() for response in responses if response.status_code == 200
                )
                loser = next(
                    response.json() for response in responses if response.status_code == 409
                )
                assert loser["code"] == "VERSION_CONFLICT"
                assert loser["details"]["current_version"] == saved["version"] + 1
                assert winner["version"] == saved["version"] + 1
                assert first.get(path).json() == winner
                assert second.get(path).json() == winner
                saved = winner
    finally:
        with engine.begin() as connection:
            connection.execute(DropSchema(schema, cascade=True))
