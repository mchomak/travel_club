from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.auth import Admin
from app.db import get_db
from app.models import ResearchAnswer, ResearchInterview, ResearchRespondent
from app.research_bank import (
    load_configuration,
    load_question_bank,
    validate_configuration,
)
from app.research_domain import recommend_category

Database = Annotated[Session, Depends(get_db)]
router = APIRouter(prefix="/api/research", tags=["research"])
Category = Literal["trips_experienced", "trips_beginner", "travel_design", "travel_ready"]
ResearchGoal = Literal["trips", "individual_services"]


class Payload(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RespondentCreate(Payload):
    screening_answers: dict[str, Any]
    research_goal: ResearchGoal | None = None


class ScreeningUpdate(Payload):
    screening_answers: dict[str, Any]
    research_goal: ResearchGoal | None = None
    apply_suggestion: bool = False


class CategoryUpdate(Payload):
    final_category: Category


class QuestionAppend(Payload):
    question_codes: list[str] = Field(min_length=1, max_length=82)


class AnswerUpdate(Payload):
    answer_text: str
    expected_revision: int = Field(ge=0)


def _http_error(status: int, code: str, message: str, **extra: Any) -> HTTPException:
    return HTTPException(status, {"code": code, "message": message, **extra})


def _save(db: Session, message: str = "Не удалось сохранить исследовательские данные") -> None:
    try:
        db.commit()
    except SQLAlchemyError as error:
        db.rollback()
        raise _http_error(500, "RESEARCH_SAVE_FAILED", message) from error


def _respondent_or_404(db: Session, respondent_id: UUID) -> ResearchRespondent:
    respondent = db.get(ResearchRespondent, respondent_id)
    if respondent is None:
        raise _http_error(404, "RESPONDENT_NOT_FOUND", "Респондент не найден")
    return respondent


def _interview_or_404(db: Session, interview_id: UUID) -> ResearchInterview:
    interview = db.get(ResearchInterview, interview_id)
    if interview is None:
        raise _http_error(404, "INTERVIEW_NOT_FOUND", "Интервью не найдено")
    return interview


def _require_valid_bank() -> dict[str, dict[str, Any]]:
    configuration = load_configuration()
    issues = validate_configuration(configuration)
    if issues:
        raise _http_error(
            409,
            "RESEARCH_BANK_INVALID",
            "Банк вопросов требует исправления перед созданием или началом интервью",
            issues=issues,
        )
    return configuration


def _question_map(bank: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        question["code"]: question
        for question in bank.get("questions", [])
        if isinstance(question, dict) and isinstance(question.get("code"), str)
    }


def _scenario(configuration: dict[str, dict[str, Any]], code: str) -> dict[str, Any]:
    for scenario in configuration["scenarios"].get("scenarios", []):
        if scenario.get("code") == code:
            return scenario
    raise _http_error(409, "SCENARIO_NOT_FOUND", "Сценарий больше не доступен в конфигурации")


def _make_snapshot(
    configuration: dict[str, dict[str, Any]], codes: list[str]
) -> list[dict[str, Any]]:
    bank = configuration["bank"]
    questions = _question_map(bank)
    missing = [code for code in codes if code not in questions]
    if missing:
        raise _http_error(
            409,
            "RESEARCH_BANK_INVALID",
            "В сценарии есть вопросы, которых нет в банке",
            missing_codes=missing,
        )
    version = str(bank.get("bank_version", configuration["scenarios"].get("bank_version", "1")))
    fields = (
        "code",
        "section",
        "text",
        "type",
        "options",
        "follow_ups",
        "hypothesis_ids",
        "interpretation",
        "answer_guidance",
    )
    return [
        {**{key: questions[code].get(key) for key in fields}, "bank_version": version}
        for code in codes
    ]


def _recommendation(answers: dict[str, Any], goal: str | None) -> dict[str, Any]:
    return recommend_category(answers, goal)


def _scalar_screening(answers: dict[str, Any], key: str) -> str | None:
    value = answers.get(key)
    if value is None or value == "":
        return None
    if isinstance(value, str):
        return value.strip() or None
    return str(value)


def _screening_values(answers: dict[str, Any]) -> tuple[str, str | None, str]:
    name = _scalar_screening(answers, "name")
    if not name:
        raise _http_error(422, "NAME_REQUIRED", "Укажите имя респондента или псевдоним")
    if len(name) > 200:
        raise _http_error(
            422, "NAME_TOO_LONG", "Имя или псевдоним не должно превышать 200 символов"
        )
    age_range = _scalar_screening(answers, "age_range")
    city = _scalar_screening(answers, "city") or ""
    if len(city) > 160:
        raise _http_error(422, "CITY_TOO_LONG", "Город не должен превышать 160 символов")
    if age_range is not None and len(age_range) > 80:
        raise _http_error(
            422, "AGE_TOO_LONG", "Возрастная категория не должна превышать 80 символов"
        )
    return name, age_range, city


def _touch_interview(db: Session, interview: ResearchInterview) -> None:
    now = datetime.now(UTC)
    interview.updated_at = now
    db.execute(
        update(ResearchRespondent)
        .where(ResearchRespondent.id == interview.respondent_id)
        .values(updated_at=now)
    )


def _answer_json(answer: ResearchAnswer | None) -> dict[str, Any] | None:
    if answer is None:
        return None
    return {
        "answer_text": answer.answer_text,
        "revision": answer.revision,
        "updated_at": answer.updated_at.isoformat() if answer.updated_at else None,
    }


def _interview_json(db: Session, interview: ResearchInterview) -> dict[str, Any]:
    answers = db.scalars(
        select(ResearchAnswer).where(ResearchAnswer.interview_id == interview.id)
    ).all()
    return {
        "id": interview.id,
        "respondent_id": interview.respondent_id,
        "scenario_code": interview.scenario_code,
        "scenario_version": interview.scenario_version,
        "bank_version": interview.bank_version,
        "status": interview.status,
        "question_snapshot": interview.question_snapshot,
        "started_at": interview.started_at,
        "completed_at": interview.completed_at,
        "created_at": interview.created_at,
        "updated_at": interview.updated_at,
        "answers": {answer.question_code: _answer_json(answer) for answer in answers},
    }


def _respondent_json(db: Session, respondent: ResearchRespondent) -> dict[str, Any]:
    return {
        "id": respondent.id,
        "name": respondent.name,
        "age_range": respondent.age_range,
        "city": respondent.city,
        "screening_answers": respondent.screening_answers,
        "research_goal": respondent.research_goal,
        "suggested_category": respondent.suggested_category,
        "final_category": respondent.final_category,
        "category_override": respondent.category_override,
        "recommendation": respondent.recommendation,
        "created_at": respondent.created_at,
        "updated_at": respondent.updated_at,
        "interviews": [_interview_json(db, item) for item in respondent.interviews],
    }


@router.get("/config")
def get_config(_: Admin):
    configuration = load_configuration()
    safe_configuration = configuration if isinstance(configuration, dict) else {}
    scenarios = safe_configuration.get("scenarios")
    if not isinstance(scenarios, dict):
        scenarios = {}
    optional_modules = scenarios.get("optional_modules")
    if not isinstance(optional_modules, dict):
        optional_modules = {}
    offers = optional_modules.get("offers")
    return {
        **safe_configuration,
        "validation_issues": validate_configuration(configuration),
        "offers_enabled": isinstance(offers, dict) and offers.get("enabled") is True,
    }


@router.get("/questions")
def get_questions(_: Admin):
    bank = load_question_bank()
    return {
        "bank_version": bank.get("bank_version"),
        "questions": bank.get("questions", []),
        "hypotheses": bank.get("hypotheses", []),
    }


@router.get("/respondents")
def list_respondents(
    _: Admin,
    db: Database,
    q: str | None = Query(default=None, max_length=200),
    category: Category | None = None,
    status: Literal["draft", "in_progress", "completed"] | None = None,
    sort: Literal["created_at", "updated_at"] = "updated_at",
    order: Literal["asc", "desc"] = "desc",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
):
    latest_status = (
        select(ResearchInterview.status)
        .where(ResearchInterview.respondent_id == ResearchRespondent.id)
        .order_by(ResearchInterview.created_at.desc())
        .limit(1)
        .scalar_subquery()
    )
    latest_updated = (
        select(ResearchInterview.updated_at)
        .where(ResearchInterview.respondent_id == ResearchRespondent.id)
        .order_by(ResearchInterview.created_at.desc())
        .limit(1)
        .scalar_subquery()
    )
    filtered = []
    if q and q.strip():
        filtered.append(ResearchRespondent.name.ilike(f"%{q.strip()}%"))
    if category:
        filtered.append(ResearchRespondent.final_category == category)
    if status:
        filtered.append(latest_status == status)
    matched_count = (
        db.scalar(select(func.count()).select_from(ResearchRespondent).where(*filtered)) or 0
    )
    total_count = db.scalar(select(func.count()).select_from(ResearchRespondent)) or 0
    completed_count = (
        db.scalar(
            select(func.count()).select_from(ResearchRespondent).where(latest_status == "completed")
        )
        or 0
    )
    rows = db.execute(
        select(ResearchRespondent, latest_status, latest_updated)
        .where(*filtered)
        .order_by(
            ResearchRespondent.created_at.desc()
            if sort == "created_at" and order == "desc"
            else ResearchRespondent.created_at.asc()
            if sort == "created_at"
            else ResearchRespondent.updated_at.desc()
            if order == "desc"
            else ResearchRespondent.updated_at.asc()
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    items = []
    for respondent, interview_status, interview_updated in rows:
        items.append(
            {
                "id": respondent.id,
                "name": respondent.name,
                "age_range": respondent.age_range,
                "city": respondent.city,
                "suggested_category": respondent.suggested_category,
                "final_category": respondent.final_category,
                "category_override": respondent.category_override,
                "status": interview_status or "draft",
                "created_at": respondent.created_at,
                "updated_at": max(respondent.updated_at, interview_updated)
                if interview_updated
                else respondent.updated_at,
            }
        )
    return {
        "items": items,
        "total": matched_count,
        "total_count": total_count,
        "completed_count": completed_count,
        "incomplete_count": total_count - completed_count,
        "page": page,
        "page_size": page_size,
        "pages": (matched_count + page_size - 1) // page_size,
    }


@router.post("/respondents", status_code=201)
def create_respondent(payload: RespondentCreate, _: Admin, db: Database):
    configuration = _require_valid_bank()
    name, age_range, city = _screening_values(payload.screening_answers)
    recommendation = _recommendation(payload.screening_answers, payload.research_goal)
    category = recommendation["suggested_category"]
    _scenario(configuration, category)
    bank_version = str(configuration["bank"].get("bank_version", "1"))
    scenario_version = str(configuration["scenarios"].get("version", "1"))
    respondent = ResearchRespondent(
        name=name,
        age_range=age_range,
        city=city,
        screening_answers=payload.screening_answers,
        research_goal=payload.research_goal,
        suggested_category=category,
        final_category=category,
        category_override=False,
        recommendation=recommendation,
    )
    interview = ResearchInterview(
        scenario_code=category,
        scenario_version=scenario_version,
        bank_version=bank_version,
        status="draft",
        question_snapshot=[],
    )
    respondent.interviews.append(interview)
    db.add(respondent)
    _save(db, "Не удалось создать респондента и черновик интервью")
    return _respondent_json(db, respondent)


@router.get("/respondents/{respondent_id}")
def get_respondent(respondent_id: UUID, _: Admin, db: Database):
    return _respondent_json(db, _respondent_or_404(db, respondent_id))


@router.patch("/respondents/{respondent_id}/screening")
def update_screening(respondent_id: UUID, payload: ScreeningUpdate, _: Admin, db: Database):
    respondent = _respondent_or_404(db, respondent_id)
    name, age_range, city = _screening_values(payload.screening_answers)
    recommendation = _recommendation(payload.screening_answers, payload.research_goal)
    respondent.name = name
    respondent.age_range = age_range
    respondent.city = city
    respondent.screening_answers = payload.screening_answers
    respondent.research_goal = payload.research_goal
    respondent.recommendation = recommendation
    respondent.suggested_category = recommendation["suggested_category"]
    if payload.apply_suggestion:
        respondent.final_category = recommendation["suggested_category"]
        respondent.category_override = False
    interview = max(respondent.interviews, key=lambda item: item.created_at, default=None)
    if interview and interview.status == "draft":
        if payload.apply_suggestion:
            interview.scenario_code = respondent.final_category
        configuration = load_configuration()
        interview.scenario_version = str(configuration["scenarios"].get("version", "1"))
        interview.bank_version = str(configuration["bank"].get("bank_version", "1"))
        interview.question_snapshot = []
        interview.updated_at = datetime.now(UTC)
    respondent.updated_at = datetime.now(UTC)
    _save(db)
    return _respondent_json(db, respondent)


@router.patch("/respondents/{respondent_id}/category")
def update_category(respondent_id: UUID, payload: CategoryUpdate, _: Admin, db: Database):
    respondent = _respondent_or_404(db, respondent_id)
    respondent.final_category = payload.final_category
    respondent.category_override = payload.final_category != respondent.suggested_category
    interview = max(respondent.interviews, key=lambda item: item.created_at, default=None)
    if interview and interview.status == "draft":
        interview.scenario_code = payload.final_category
        interview.question_snapshot = []
    respondent.updated_at = datetime.now(UTC)
    _save(db)
    return _respondent_json(db, respondent)


@router.post("/interviews/{interview_id}/start")
def start_interview(interview_id: UUID, _: Admin, db: Database):
    interview = _interview_or_404(db, interview_id)
    respondent = _respondent_or_404(db, interview.respondent_id)
    if interview.status == "draft":
        configuration = _require_valid_bank()
        scenario = _scenario(configuration, respondent.final_category)
        interview.scenario_code = respondent.final_category
        interview.scenario_version = str(configuration["scenarios"].get("version", "1"))
        interview.bank_version = str(configuration["bank"].get("bank_version", "1"))
        interview.question_snapshot = _make_snapshot(
            configuration, list(scenario.get("question_codes", []))
        )
        interview.started_at = datetime.now(UTC)
        interview.status = "in_progress"
        _touch_interview(db, interview)
        _save(db, "Не удалось начать интервью")
    return _interview_json(db, interview)


@router.post("/interviews/{interview_id}/questions")
def append_questions(interview_id: UUID, payload: QuestionAppend, _: Admin, db: Database):
    interview = _interview_or_404(db, interview_id)
    if interview.status == "draft":
        raise _http_error(409, "INTERVIEW_NOT_STARTED", "Сначала начните интервью")
    configuration = _require_valid_bank()
    codes = list(dict.fromkeys(payload.question_codes))
    questions = _question_map(configuration["bank"])
    missing = [code for code in codes if code not in questions]
    if missing:
        raise _http_error(
            422, "UNKNOWN_QUESTION", "Выберите вопросы из актуального банка", missing_codes=missing
        )
    offers_enabled = (
        configuration["scenarios"].get("optional_modules", {}).get("offers", {}).get("enabled")
        is True
    )
    if not offers_enabled and any(code.startswith("X") for code in codes):
        raise _http_error(409, "OFFERS_DISABLED", "Модуль проверки предложений пока выключен")
    snapshot = list(interview.question_snapshot or [])
    existing = {item.get("code") for item in snapshot if isinstance(item, dict)}
    added = [code for code in codes if code not in existing]
    if added:
        snapshot.extend(_make_snapshot(configuration, added))
        brand_module = (
            configuration["scenarios"].get("optional_modules", {}).get("brand", {})
        )
        if isinstance(brand_module, dict) and brand_module.get("append_to_end") is True:
            brand_codes = set(brand_module.get("question_codes", []))
            snapshot = [
                question for question in snapshot
                if not isinstance(question, dict) or question.get("code") not in brand_codes
            ] + [
                question for question in snapshot
                if isinstance(question, dict) and question.get("code") in brand_codes
            ]
        interview.question_snapshot = snapshot
        _touch_interview(db, interview)
        _save(db, "Не удалось добавить вопросы")
    return _interview_json(db, interview)


@router.put("/interviews/{interview_id}/answers/{question_code}")
def save_answer(
    interview_id: UUID,
    question_code: str,
    payload: AnswerUpdate,
    _: Admin,
    db: Database,
):
    interview = _interview_or_404(db, interview_id)
    if interview.status == "draft":
        raise _http_error(409, "INTERVIEW_NOT_STARTED", "Сначала начните интервью")
    if not any(
        isinstance(question, dict) and question.get("code") == question_code
        for question in interview.question_snapshot
    ):
        raise _http_error(
            422, "QUESTION_NOT_IN_INTERVIEW", "Этот вопрос не входит в сохранённый сценарий"
        )

    statement = (
        pg_insert(ResearchAnswer)
        .values(
            interview_id=interview.id,
            question_code=question_code,
            answer_text=payload.answer_text,
            revision=1,
        )
        .on_conflict_do_nothing(constraint="uq_research_answer_question")
        .returning(ResearchAnswer.id)
    )
    if payload.expected_revision == 0:
        inserted = db.scalar(statement)
        if inserted:
            answer = db.get(ResearchAnswer, inserted)
            _touch_interview(db, interview)
            _save(db, "Не удалось сохранить ответ")
            db.refresh(answer)
            return _answer_json(answer)

    current = db.scalar(
        select(ResearchAnswer).where(
            ResearchAnswer.interview_id == interview.id,
            ResearchAnswer.question_code == question_code,
        )
    )
    if current is None:
        raise _http_error(
            409,
            "ANSWER_CONFLICT",
            "Ответ изменился в другой вкладке; сохраните свой текст с актуальной версией",
            current=None,
        )
    if current.revision == payload.expected_revision:
        if current.answer_text == payload.answer_text:
            return _answer_json(current)
        updated_id = db.scalar(
            update(ResearchAnswer)
            .where(
                ResearchAnswer.id == current.id,
                ResearchAnswer.revision == payload.expected_revision,
            )
            .values(
                answer_text=payload.answer_text,
                revision=payload.expected_revision + 1,
                updated_at=func.now(),
            )
            .returning(ResearchAnswer.id)
        )
        if updated_id:
            _touch_interview(db, interview)
            _save(db, "Не удалось сохранить ответ")
            return _answer_json(db.get(ResearchAnswer, updated_id))
        current = db.scalar(
            select(ResearchAnswer)
            .where(ResearchAnswer.id == current.id)
            .execution_options(populate_existing=True)
        )
    if current and current.answer_text == payload.answer_text:
        return _answer_json(current)
    raise _http_error(
        409,
        "ANSWER_CONFLICT",
        "Ответ уже изменён. Скопируйте текущую версию или сохраните свой текст "
        "с актуальной версией",
        current=_answer_json(current),
    )


@router.post("/interviews/{interview_id}/complete")
def complete_interview(interview_id: UUID, _: Admin, db: Database):
    interview = _interview_or_404(db, interview_id)
    if interview.status == "draft":
        raise _http_error(409, "INTERVIEW_NOT_STARTED", "Сначала начните интервью")
    if interview.status != "completed":
        interview.status = "completed"
        interview.completed_at = datetime.now(UTC)
        _touch_interview(db, interview)
        _save(db, "Не удалось завершить интервью")
    return _interview_json(db, interview)


@router.get("/export.xlsx")
def export_research(_: Admin, db: Database):
    rows = db.execute(
        select(ResearchRespondent, ResearchInterview, ResearchAnswer)
        .outerjoin(
            ResearchInterview,
            ResearchInterview.respondent_id == ResearchRespondent.id,
        )
        .outerjoin(ResearchAnswer, ResearchAnswer.interview_id == ResearchInterview.id)
        .order_by(
            ResearchRespondent.created_at,
            ResearchRespondent.id,
            ResearchInterview.created_at,
            ResearchInterview.id,
            ResearchAnswer.question_code,
        )
    ).all()
    # One joined SQL statement gives every sheet the same PostgreSQL MVCC snapshot.
    respondents_by_id: dict[UUID, ResearchRespondent] = {}
    interviews_by_id: dict[UUID, ResearchInterview] = {}
    answers_by_id: dict[UUID, ResearchAnswer] = {}
    for respondent, interview, answer in rows:
        respondents_by_id[respondent.id] = respondent
        if interview is not None:
            interviews_by_id[interview.id] = interview
        if answer is not None:
            answers_by_id[answer.id] = answer
    from app.research_export import build_research_workbook

    content = build_research_workbook(
        list(respondents_by_id.values()),
        list(interviews_by_id.values()),
        list(answers_by_id.values()),
    )
    filename = f"tc-research-{datetime.now(UTC).date().isoformat()}.xlsx"
    return Response(
        content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
