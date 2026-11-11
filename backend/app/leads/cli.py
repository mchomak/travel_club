"""OS-restricted command line access to saved Website leads."""

from __future__ import annotations

import argparse
import re
import sys
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.leads.db import open_website_session
from app.leads.models import Lead, LeadNotification
from app.leads.products import get_product_label

LEAD_NUMBER = re.compile(r"^TC-(\d{6,})$")
STATUSES = ("new", "in_progress", "closed")


def _parse_number(value: str) -> int:
    match = LEAD_NUMBER.fullmatch(value)
    if not match:
        raise ValueError("Номер должен выглядеть как TC-000123")
    return int(match.group(1))


def list_leads(session: Session, *, status: str | None = None, limit: int = 50) -> list[Lead]:
    statement = select(Lead).order_by(Lead.created_at.desc(), Lead.number.desc()).limit(limit)
    if status is not None:
        if status not in STATUSES:
            raise ValueError("Неизвестный статус заявки")
        statement = statement.where(Lead.status == status)
    return list(session.scalars(statement))


def get_lead(session: Session, lead_number: str) -> Lead | None:
    return session.scalar(select(Lead).where(Lead.number == _parse_number(lead_number)))


def set_status(session: Session, lead_number: str, status: str) -> bool:
    if status not in STATUSES:
        raise ValueError("Статус должен быть new, in_progress или closed")
    lead = get_lead(session, lead_number)
    if lead is None:
        return False
    lead.status = status
    lead.updated_at = datetime.now(UTC)
    session.commit()
    return True


def retry_notification(session: Session, lead_number: str) -> bool:
    lead = get_lead(session, lead_number)
    if lead is None:
        return False
    now = datetime.now(UTC)
    notification = session.scalar(
        select(LeadNotification)
        .where(LeadNotification.lead_id == lead.id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if notification is None:
        return False
    locked_until = notification.locked_until
    if locked_until is not None and locked_until.tzinfo is None:
        locked_until = locked_until.replace(tzinfo=UTC)
    if notification.status == "sending" and locked_until is not None and locked_until > now:
        session.rollback()
        return False
    notification.status = "pending"
    # Keep attempts monotonic: it also fences off a delayed result from an
    # earlier worker lease after an operator requeues this row.
    notification.next_attempt_at = now
    notification.locked_until = None
    notification.sent_at = None
    notification.last_error_code = None
    session.commit()
    return True


def _format_timestamp(value: datetime | None) -> str:
    if value is None:
        return "—"
    return value.astimezone(UTC).isoformat(timespec="minutes")


def _print_list(leads: list[Lead]) -> None:
    if not leads:
        print("Заявок нет.")
        return
    print("Номер\tПолучена (UTC)\tФормат\tСтатус")
    for lead in leads:
        print(
            f"TC-{lead.number:06d}\t{_format_timestamp(lead.created_at)}\t"
            f"{get_product_label(lead.product_id)}\t{lead.status}"
        )


def _print_detail(session: Session, lead: Lead) -> None:
    notification = session.scalar(
        select(LeadNotification).where(LeadNotification.lead_id == lead.id)
    )
    print(f"Заявка: TC-{lead.number:06d}")
    print(f"Получена (UTC): {_format_timestamp(lead.created_at)}")
    print(f"Обновлена (UTC): {_format_timestamp(lead.updated_at)}")
    print(f"Формат: {get_product_label(lead.product_id)}")
    print(f"Источник: {lead.source}")
    print(f"Статус: {lead.status}")
    print(f"Способ связи: {lead.contact_method}")
    print(f"Контакт: {lead.contact_value}")
    print(f"Имя: {lead.name or '—'}")
    print(f"Комментарий: {lead.message or '—'}")
    if notification:
        print(f"Telegram: {notification.status}; попыток: {notification.attempts}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Безопасная локальная работа с заявками Website")
    commands = parser.add_subparsers(dest="command", required=True)
    list_parser = commands.add_parser("list", help="Показать последние заявки")
    list_parser.add_argument("--status", choices=STATUSES)
    list_parser.add_argument("--limit", type=int, default=50)
    commands.add_parser("show", help="Открыть одну заявку").add_argument("number")
    status_parser = commands.add_parser("status", help="Изменить статус")
    status_parser.add_argument("number")
    status_parser.add_argument("status", choices=STATUSES)
    commands.add_parser("retry", help="Повторить Telegram-уведомление").add_argument("number")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.command == "list" and not 1 <= args.limit <= 200:
        parser.error("--limit должен быть от 1 до 200")
    try:
        with open_website_session() as session:
            if args.command == "list":
                _print_list(list_leads(session, status=args.status, limit=args.limit))
                return 0
            if args.command == "show":
                lead = get_lead(session, args.number)
                if lead is None:
                    print("Заявка не найдена.", file=sys.stderr)
                    return 1
                _print_detail(session, lead)
                return 0
            if args.command == "status":
                if not set_status(session, args.number, args.status):
                    print("Заявка не найдена.", file=sys.stderr)
                    return 1
                print("Статус обновлён.")
                return 0
            if args.command == "retry":
                if not retry_notification(session, args.number):
                    print("Заявка или Telegram-уведомление не найдены.", file=sys.stderr)
                    return 1
                print("Telegram-уведомление поставлено в очередь.")
                return 0
    except (RuntimeError, OSError):
        print(
            "База заявок Website недоступна. Проверьте настройку и запустите миграции.",
            file=sys.stderr,
        )
        return 2
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
