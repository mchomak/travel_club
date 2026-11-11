from collections.abc import Generator
from functools import lru_cache

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.leads.config import get_lead_settings


@lru_cache(maxsize=1)
def get_website_engine() -> Engine:
    configured_url = get_lead_settings().website_database_url.get_secret_value()
    if not configured_url:
        raise RuntimeError("Website leads database is not configured")
    return create_engine(
        configured_url,
        pool_pre_ping=True,
        hide_parameters=True,
        connect_args={"connect_timeout": 5},
    )


def get_website_session() -> Generator[Session, None, None]:
    try:
        factory = sessionmaker(get_website_engine(), expire_on_commit=False)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail={"code": "LEADS_UNAVAILABLE", "message": "Не удалось принять заявку"},
        ) from exc
    with factory() as session:
        yield session


def open_website_session() -> Session:
    return sessionmaker(get_website_engine(), expire_on_commit=False)()
