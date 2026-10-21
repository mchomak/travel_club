from __future__ import annotations

import importlib.util
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

import sqlalchemy as sa
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.operations import Operations
from alembic.script import ScriptDirectory

from app.db import engine


def test_research_version_migration_is_the_single_alembic_head():
    backend_dir = Path(__file__).resolve().parents[1]
    config = Config(str(backend_dir / "alembic.ini"))

    assert ScriptDirectory.from_config(config).get_heads() == ["a2f7c91b4d60"]


def test_migration_backfills_completed_interviews_as_version_one():
    schema = f"research_versions_{uuid4().hex}"
    migration_path = (
        Path(__file__).resolve().parents[1]
        / "migrations"
        / "versions"
        / "a2f7c91b4d60_research_interview_versions.py"
    )
    spec = importlib.util.spec_from_file_location("research_version_migration", migration_path)
    assert spec is not None and spec.loader is not None
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)

    respondent_id = uuid4()
    completed_id = uuid4()
    in_progress_id = uuid4()
    completed_at = datetime.fromisoformat("2026-10-21T12:30:00+02:00")
    answer_updated_at = datetime.fromisoformat("2026-10-21T13:00:00+02:00")

    with engine.connect() as connection:
        connection.execute(sa.text(f'CREATE SCHEMA "{schema}"'))
        connection.commit()
        try:
            with connection.begin():
                connection.execute(sa.text(f'SET LOCAL search_path TO "{schema}", public'))
                connection.execute(
                    sa.text(
                        """
                        CREATE TABLE research_respondents (
                            id UUID PRIMARY KEY,
                            name VARCHAR(200) NOT NULL,
                            age_range VARCHAR(80),
                            city VARCHAR(160) NOT NULL,
                            screening_answers JSONB NOT NULL,
                            research_goal VARCHAR(30),
                            suggested_category VARCHAR(40) NOT NULL,
                            final_category VARCHAR(40) NOT NULL,
                            category_override BOOLEAN NOT NULL,
                            recommendation JSONB NOT NULL
                        )
                        """
                    )
                )
                connection.execute(
                    sa.text(
                        """
                        CREATE TABLE research_interviews (
                            id UUID PRIMARY KEY,
                            respondent_id UUID NOT NULL
                                REFERENCES research_respondents(id) ON DELETE CASCADE,
                            scenario_code VARCHAR(40) NOT NULL,
                            scenario_version VARCHAR(40) NOT NULL,
                            question_snapshot JSONB NOT NULL,
                            status VARCHAR(20) NOT NULL,
                            completed_at TIMESTAMPTZ,
                            updated_at TIMESTAMPTZ NOT NULL
                        )
                        """
                    )
                )
                connection.execute(
                    sa.text(
                        """
                        CREATE TABLE research_answers (
                            id UUID PRIMARY KEY,
                            interview_id UUID NOT NULL
                                REFERENCES research_interviews(id) ON DELETE CASCADE,
                            question_code VARCHAR(3) NOT NULL,
                            answer_text TEXT NOT NULL,
                            revision INTEGER NOT NULL,
                            updated_at TIMESTAMPTZ NOT NULL
                        )
                        """
                    )
                )
                connection.execute(
                    sa.text(
                        """
                        INSERT INTO research_respondents (
                            id, name, age_range, city, screening_answers, research_goal,
                            suggested_category, final_category, category_override, recommendation
                        ) VALUES (
                            :id, 'Migration respondent', '26_35', 'Prague',
                            CAST('{"source":"migration"}' AS JSONB), 'trips',
                            'trips_experienced', 'travel_ready', TRUE,
                            CAST('{"suggested_category":"trips_experienced"}' AS JSONB)
                        )
                        """
                    ),
                    {"id": respondent_id},
                )
                question_snapshot = (
                    '[{"code":"G01","text":"First question"},'
                    '{"code":"G02","text":"Second question"}]'
                )
                for interview_id, status in (
                    (completed_id, "completed"),
                    (in_progress_id, "in_progress"),
                ):
                    connection.execute(
                        sa.text(
                            """
                            INSERT INTO research_interviews (
                                id, respondent_id, scenario_code, scenario_version,
                                question_snapshot, status, completed_at, updated_at
                            ) VALUES (
                                :id, :respondent_id, 'trips_experienced', '1',
                                CAST(:question_snapshot AS JSONB), :status,
                                :completed_at, :updated_at
                            )
                            """
                        ),
                        {
                            "id": interview_id,
                            "respondent_id": respondent_id,
                            "question_snapshot": question_snapshot,
                            "status": status,
                            "completed_at": completed_at if status == "completed" else None,
                            "updated_at": completed_at,
                        },
                    )
                connection.execute(
                    sa.text(
                        """
                        INSERT INTO research_answers (
                            id, interview_id, question_code, answer_text, revision, updated_at
                        ) VALUES (
                            :id, :interview_id, 'G01', 'Backfilled answer', 3, :updated_at
                        )
                        """
                    ),
                    {
                        "id": uuid4(),
                        "interview_id": completed_id,
                        "updated_at": answer_updated_at,
                    },
                )

                with Operations.context(MigrationContext.configure(connection)):
                    migration.upgrade()

                versions = connection.execute(
                    sa.text(
                        """
                        SELECT interview_id, version_number, snapshot, created_at
                        FROM research_interview_versions
                        """
                    )
                ).mappings().all()
                assert len(versions) == 1
                version = versions[0]
                assert version["interview_id"] == completed_id
                assert version["version_number"] == 1
                assert version["created_at"].astimezone(UTC) == completed_at.astimezone(UTC)

                respondent = version["snapshot"]["respondent"]
                assert respondent["name"] == "Migration respondent"
                assert respondent["final_category"] == "travel_ready"
                interview = version["snapshot"]["interview"]
                assert interview["status"] == "completed"
                assert interview["question_snapshot"][0]["text"] == "First question"
                assert interview["answers"]["G01"] == {
                    "answer_text": "Backfilled answer",
                    "revision": 3,
                    "updated_at": "2026-10-21T11:00:00Z",
                }
                assert interview["answers"]["G02"] == {
                    "answer_text": "",
                    "revision": 0,
                    "updated_at": None,
                }
        finally:
            connection.execute(sa.text(f'DROP SCHEMA "{schema}" CASCADE'))
            connection.commit()
