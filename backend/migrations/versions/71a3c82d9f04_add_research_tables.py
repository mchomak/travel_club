"""Add private research respondents, interviews, and answers."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "71a3c82d9f04"
down_revision = "c93f62a1b7d8"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "research_respondents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("age_range", sa.String(80), nullable=True),
        sa.Column("city", sa.String(160), nullable=False, server_default=""),
        sa.Column("screening_answers", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("research_goal", sa.String(30), nullable=True),
        sa.Column("suggested_category", sa.String(40), nullable=False),
        sa.Column("final_category", sa.String(40), nullable=False),
        sa.Column("category_override", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("recommendation", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.CheckConstraint(
            "suggested_category IN ('trips_experienced','trips_beginner',"
            "'travel_design','travel_ready')",
            name="research_suggested_category",
        ),
        sa.CheckConstraint(
            "final_category IN ('trips_experienced','trips_beginner',"
            "'travel_design','travel_ready')",
            name="research_final_category",
        ),
        sa.CheckConstraint(
            "research_goal IS NULL OR research_goal IN ('trips','individual_services')",
            name="research_goal",
        ),
    )
    op.create_index("ix_research_respondents_created_at", "research_respondents", ["created_at"])
    op.create_index("ix_research_respondents_updated_at", "research_respondents", ["updated_at"])
    op.create_index(
        "ix_research_respondents_final_category", "research_respondents", ["final_category"]
    )

    op.create_table(
        "research_interviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "respondent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("research_respondents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("scenario_code", sa.String(40), nullable=False),
        sa.Column("scenario_version", sa.String(40), nullable=False),
        sa.Column("bank_version", sa.String(40), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("question_snapshot", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.CheckConstraint(
            "status IN ('draft','in_progress','completed')", name="research_interview_status"
        ),
    )
    op.create_index(
        "ix_research_interviews_respondent_id", "research_interviews", ["respondent_id"]
    )
    op.create_index("ix_research_interviews_status", "research_interviews", ["status"])
    op.create_index("ix_research_interviews_created_at", "research_interviews", ["created_at"])
    op.create_index("ix_research_interviews_updated_at", "research_interviews", ["updated_at"])

    op.create_table(
        "research_answers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "interview_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("research_interviews.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("question_code", sa.String(3), nullable=False),
        sa.Column("answer_text", sa.Text(), nullable=False, server_default=""),
        sa.Column("revision", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.UniqueConstraint("interview_id", "question_code", name="uq_research_answer_question"),
        sa.CheckConstraint("revision > 0", name="research_answer_revision"),
    )
    op.create_index("ix_research_answers_interview_id", "research_answers", ["interview_id"])


def downgrade():
    op.drop_index("ix_research_answers_interview_id", table_name="research_answers")
    op.drop_table("research_answers")
    op.drop_index("ix_research_interviews_updated_at", table_name="research_interviews")
    op.drop_index("ix_research_interviews_created_at", table_name="research_interviews")
    op.drop_index("ix_research_interviews_status", table_name="research_interviews")
    op.drop_index("ix_research_interviews_respondent_id", table_name="research_interviews")
    op.drop_table("research_interviews")
    op.drop_index("ix_research_respondents_final_category", table_name="research_respondents")
    op.drop_index("ix_research_respondents_updated_at", table_name="research_respondents")
    op.drop_index("ix_research_respondents_created_at", table_name="research_respondents")
    op.drop_table("research_respondents")
