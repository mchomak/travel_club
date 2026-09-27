from concurrent.futures import ThreadPoolExecutor
from threading import Barrier, Event
from time import monotonic, sleep
from uuid import uuid4

import pytest
from argon2 import PasswordHasher
from fastapi import Request
from fastapi.testclient import TestClient
from sqlalchemy import event, text
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


@pytest.mark.parametrize("view", ["document", "preview", "list"])
def test_get_during_put_returns_one_complete_aggregate_version(view):
    schema = f"test_read_race_{uuid4().hex}"
    isolated_engine = engine.execution_options(schema_translate_map={None: schema})
    with engine.begin() as connection:
        connection.execute(CreateSchema(schema))
    try:
        Base.metadata.create_all(isolated_engine)
        with Session(isolated_engine) as db:
            db.add(
                User(
                    login="read-race-fixture", password_hash=PasswordHasher().hash(FIXTURE_PASSWORD)
                )
            )
            db.commit()
        parent_read, release_reader, writer_started = Event(), Event(), Event()
        writer_pid = []

        def pause_before_children(state):
            # Only schedule the race here; all queries and HTTP handlers remain real.
            if state.is_relationship_load and not parent_read.is_set():
                parent_read.set()
                assert release_reader.wait(timeout=15), "Reader was not released"

        def independent_db(request: Request):
            with Session(isolated_engine) as db:
                if request.headers.get("x-race-reader"):
                    event.listen(db, "do_orm_execute", pause_before_children)
                if request.headers.get("x-race-writer"):
                    writer_pid.append(db.scalar(text("SELECT pg_backend_pid()")))
                    writer_started.set()
                yield db

        application = create_app()
        application.dependency_overrides[get_db] = independent_db
        with TestClient(application) as reader, TestClient(application) as writer:
            for client in (reader, writer):
                assert (
                    client.post(
                        "/api/auth/login",
                        headers=HEADERS,
                        json={
                            "login": "read-race-fixture",
                            "password": FIXTURE_PASSWORD,
                        },
                    ).status_code
                    == 200
                )
            created = create_trip(writer, participants=1)
            path = f"/api/trips/{created['id']}"
            payload = editable(created)
            payload["days"][0]["city"] = "Before"
            payload["items"] = [
                {
                    "id": str(uuid4()),
                    "title": "Before",
                    "type": "flight",
                    "calculation_mode": "per_person",
                    "currency": "RUB",
                    "unit_price": "100",
                    "day_id": created["days"][0]["id"],
                }
            ]
            response = writer.put(path, headers=HEADERS, json=payload)
            assert response.status_code == 200, response.text
            saved = response.json()
            read_path = {"document": path, "preview": path + "/preview", "list": "/api/trips"}[view]
            before = reader.get(read_path).json()
            update = editable(saved)
            update["participants"] = 2
            update["days"][0]["city"] = "After"
            update["items"][0]["title"] = "After"
            with ThreadPoolExecutor(max_workers=2) as pool:
                read_future = pool.submit(reader.get, read_path, headers={"x-race-reader": "1"})
                try:
                    assert parent_read.wait(timeout=5), "Reader did not reach aggregate children"
                    write_future = pool.submit(
                        writer.put, path, headers={**HEADERS, "x-race-writer": "1"}, json=update
                    )
                    assert writer_started.wait(timeout=5), "Writer did not acquire a connection"
                    deadline = monotonic() + 5
                    blocked = False
                    # Release the reader once the writer commits (the bug) or is waiting
                    # on the reader's lock (the fix), without assuming scheduler timings.
                    with engine.connect().execution_options(
                        isolation_level="AUTOCOMMIT"
                    ) as monitor:
                        while not write_future.done() and monotonic() < deadline:
                            blocked = monitor.scalar(
                                text(
                                    "SELECT wait_event_type = 'Lock' FROM pg_stat_activity "
                                    "WHERE pid=:pid"
                                ),
                                {"pid": writer_pid[0]},
                            )
                            if blocked:
                                break
                            sleep(0.01)
                    assert write_future.done() or blocked, "Writer neither completed nor waited"
                finally:
                    release_reader.set()
                read_response = read_future.result(timeout=10)
                write_response = write_future.result(timeout=10)
            assert read_response.status_code == 200, read_response.text
            assert write_response.status_code == 200, write_response.text
            after = reader.get(read_path).json()
            assert before != after
            assert read_response.json() in (before, after), "GET mixed two aggregate versions"
            persisted = reader.get(path).json()
            assert persisted["version"] == saved["version"] + 1
            assert persisted["calculation"]["cost_total"] == "200.00"
            assert persisted["items"][0]["normalized_amount"] == "200.00"
    finally:
        with engine.begin() as connection:
            connection.execute(DropSchema(schema, cascade=True))
