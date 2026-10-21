"""Persist immutable versions of completed research interviews."""

import json
from datetime import UTC
from uuid import uuid4

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "a2f7c91b4d60"
down_revision = "71a3c82d9f04"
branch_labels = None
depends_on = None


def _iso_utc(value):
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    else:
        value = value.astimezone(UTC)
    return value.isoformat().replace("+00:00", "Z")


def _backfill_versions(connection):
    interviews = connection.execute(
        sa.text(
            """
            SELECT
                i.id AS interview_id,
                i.scenario_code,
                i.scenario_version,
                i.question_snapshot,
                i.completed_at,
                i.updated_at,
                r.id AS respondent_id,
                r.name,
                r.age_range,
                r.city,
                r.screening_answers,
                r.research_goal,
                r.suggested_category,
                r.final_category,
                r.category_override,
                r.recommendation
            FROM research_interviews AS i
            JOIN research_respondents AS r ON r.id = i.respondent_id
            WHERE i.status = 'completed'
            ORDER BY i.id
            """
        )
    ).mappings().all()
    answer_rows = connection.execute(
        sa.text(
            """
            SELECT interview_id, question_code, answer_text, revision, updated_at
            FROM research_answers
            ORDER BY interview_id, question_code
            """
        )
    ).mappings()
    answers_by_interview = {}
    for answer in answer_rows:
        answers_by_interview.setdefault(answer["interview_id"], {})[answer["question_code"]] = {
            "answer_text": answer["answer_text"],
            "revision": answer["revision"],
            "updated_at": _iso_utc(answer["updated_at"]),
        }

    for interview in interviews:
        question_snapshot = interview["question_snapshot"] or []
        stored_answers = answers_by_interview.get(interview["interview_id"], {})
        question_codes = [
            question["code"]
            for question in question_snapshot
            if isinstance(question, dict) and isinstance(question.get("code"), str)
        ]
        all_codes = list(dict.fromkeys([*question_codes, *stored_answers]))
        answer_snapshot = {
            code: stored_answers.get(
                code, {"answer_text": "", "revision": 0, "updated_at": None}
            )
            for code in all_codes
        }
        snapshot = {
            "respondent": {
                "id": str(interview["respondent_id"]),
                "name": interview["name"],
                "age_range": interview["age_range"],
                "city": interview["city"],
                "screening_answers": interview["screening_answers"] or {},
                "research_goal": interview["research_goal"],
                "suggested_category": interview["suggested_category"],
                "final_category": interview["final_category"],
                "category_override": interview["category_override"],
                "recommendation": interview["recommendation"] or {},
            },
            "interview": {
                "id": str(interview["interview_id"]),
                "status": "completed",
                "scenario_code": interview["scenario_code"],
                "scenario_version": interview["scenario_version"],
                "question_snapshot": question_snapshot,
                "answers": answer_snapshot,
            },
        }
        connection.execute(
            sa.text(
                """
                INSERT INTO research_interview_versions
                    (id, interview_id, version_number, snapshot, created_at)
                VALUES (:id, :interview_id, 1, CAST(:snapshot AS JSONB), :created_at)
                """
            ),
            {
                "id": uuid4(),
                "interview_id": interview["interview_id"],
                "snapshot": json.dumps(snapshot, ensure_ascii=False),
                "created_at": interview["completed_at"] or interview["updated_at"],
            },
        )


def upgrade():
    op.create_table(
        "research_interview_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "interview_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("research_interviews.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("snapshot", postgresql.JSONB(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.UniqueConstraint(
            "interview_id", "version_number", name="uq_research_interview_version"
        ),
        sa.CheckConstraint("version_number > 0", name="research_interview_version_number"),
    )
    _backfill_versions(op.get_bind())


def downgrade():
    op.drop_table("research_interview_versions")
