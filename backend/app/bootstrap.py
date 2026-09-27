"""Create an administrator from a local terminal: python -m app.bootstrap."""

import getpass

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import normalize_login, password_hasher
from app.db import SessionLocal
from app.models import User


def create_admin(db: Session, login: str, password: str) -> User:
    login = normalize_login(login)
    if not login or len(login) > 120:
        raise ValueError("Логин должен содержать от 1 до 120 символов")
    if not 12 <= len(password) <= 1024:
        raise ValueError("Пароль должен содержать от 12 до 1024 символов")
    if db.scalar(select(User).where(User.login == login)):
        raise ValueError("Этот логин уже существует")
    user = User(login=login, password_hash=password_hasher.hash(password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError("Этот логин уже существует") from None
    return user


def main() -> int:
    login = input("Логин администратора: ")
    password = getpass.getpass("Пароль (от 12 символов): ")
    confirmation = getpass.getpass("Повторите пароль: ")
    if password != confirmation:
        print("Пароли не совпадают. Администратор не создан.")
        return 1
    try:
        with SessionLocal() as db:
            create_admin(db, login, password)
    except ValueError as exc:
        print(str(exc))
        return 1
    print("Администратор создан.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
