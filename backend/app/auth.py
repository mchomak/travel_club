import hashlib
import secrets
import unicodedata
from datetime import UTC, datetime, timedelta
from typing import Annotated

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import delete, func, select, text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models import LoginAttempt, User
from app.models import Session as AdminSession
from app.schemas import LoginInput, UserInfo

COOKIE_NAME = "travel_session"
password_hasher = PasswordHasher()
dummy_hash = password_hasher.hash(secrets.token_urlsafe(32))
router = APIRouter(prefix="/api/auth", tags=["auth"])
Database = Annotated[Session, Depends(get_db)]


def normalize_login(login: str) -> str:
    return unicodedata.normalize("NFKC", login).strip().casefold()


def token_digest(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def require_admin(request: Request, db: Database) -> User:
    token = request.cookies.get(COOKIE_NAME)
    if token:
        user = db.scalar(
            select(User)
            .join(AdminSession)
            .where(
                AdminSession.token_digest == token_digest(token),
                AdminSession.expires_at > datetime.now(UTC),
            )
        )
        if user:
            return user
    raise HTTPException(401, "Войдите, чтобы продолжить")


Admin = Annotated[User, Depends(require_admin)]


def record_login_attempt(db: Session, login: str, ip: str) -> None:
    settings = get_settings()
    now = datetime.now(UTC)
    cutoff = now - timedelta(minutes=settings.login_window_minutes)
    # Serialize each login/IP pair across workers so simultaneous requests cannot bypass limits.
    keys = [
        int.from_bytes(hashlib.sha256(value.encode()).digest()[:8], signed=True)
        for value in ("login:" + login, "ip:" + ip)
    ]
    for key in sorted(keys):
        db.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": key})
    for predicate, limit in (
        (LoginAttempt.login == login, settings.login_limit_per_login),
        (LoginAttempt.ip == ip, settings.login_limit_per_ip),
    ):
        count = db.scalar(
            select(func.count())
            .select_from(LoginAttempt)
            .where(predicate, LoginAttempt.created_at >= cutoff)
        )
        if count >= limit:
            db.rollback()
            raise HTTPException(
                429,
                "Слишком много попыток. Попробуйте через 15 минут",
                headers={"Retry-After": str(settings.login_window_minutes * 60)},
            )
    db.execute(delete(LoginAttempt).where(LoginAttempt.created_at < cutoff))
    db.add(LoginAttempt(login=login, ip=ip, created_at=now))
    db.commit()


@router.post("/login", response_model=UserInfo)
def login(payload: LoginInput, response: Response, request: Request, db: Database):
    settings = get_settings()
    normalized = normalize_login(payload.login)
    record_login_attempt(db, normalized, request.client.host if request.client else "unknown")
    user = db.scalar(select(User).where(User.login == normalized))
    try:
        password_hasher.verify(user.password_hash if user else dummy_hash, payload.password)
        valid = user is not None
    except (VerificationError, InvalidHashError):
        valid = False
    if not valid:
        raise HTTPException(401, "Неверный логин или пароль")
    old_token = request.cookies.get(COOKIE_NAME)
    if old_token:
        db.execute(delete(AdminSession).where(AdminSession.token_digest == token_digest(old_token)))
    token = secrets.token_urlsafe(48)
    db.add(
        AdminSession(
            token_digest=token_digest(token),
            user_id=user.id,
            expires_at=datetime.now(UTC) + timedelta(hours=settings.session_hours),
        )
    )
    if password_hasher.check_needs_rehash(user.password_hash):
        user.password_hash = password_hasher.hash(payload.password)
    db.commit()
    response.set_cookie(
        COOKIE_NAME,
        token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.session_hours * 3600,
        path="/",
    )
    response.headers["Cache-Control"] = "no-store"
    return user


@router.get("/me", response_model=UserInfo)
def me(response: Response, user: Admin):
    response.headers["Cache-Control"] = "no-store"
    return user


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, db: Database):
    token = request.cookies.get(COOKIE_NAME)
    if token:
        db.execute(delete(AdminSession).where(AdminSession.token_digest == token_digest(token)))
        db.commit()
    response.delete_cookie(
        COOKIE_NAME, path="/", httponly=True, secure=get_settings().cookie_secure, samesite="lax"
    )
