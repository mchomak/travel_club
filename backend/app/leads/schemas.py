import re
import unicodedata
from typing import Literal
from urllib.parse import urlsplit

import phonenumbers
from email_validator import EmailNotValidError, validate_email
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StrictBool,
    ValidationInfo,
    field_validator,
)

from app.leads.products import is_available_product

ContactMethod = Literal["telegram", "email", "instagram", "phone"]
LeadSource = Literal["home", "formats", "service", "unknown"]
TELEGRAM_USERNAME = re.compile(r"^[A-Za-z][A-Za-z0-9_]{4,31}$")
INSTAGRAM_USERNAME = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9._]{0,28}[A-Za-z0-9])?$")


def clean_text(value: str | None, *, allow_lines: bool = False) -> str | None:
    if value is None:
        return None
    normalized = unicodedata.normalize("NFC", value).strip()
    for char in normalized:
        if unicodedata.category(char) in {"Cc", "Cs"} and not (allow_lines and char in "\n\r\t"):
            raise ValueError("Недопустимый символ")
    return normalized or None


class LeadCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    product_id: str = Field(min_length=1, max_length=40)
    contact_method: ContactMethod
    contact_value: str = Field(min_length=1, max_length=254)
    name: str | None = Field(default=None, max_length=120)
    message: str | None = Field(default=None, max_length=2000)
    source: LeadSource = "unknown"
    consent: StrictBool
    telegram_details_consent_version: Literal["telegram-details-v1"] | None = None
    website_honeypot: str | None = Field(default=None, max_length=200)

    @field_validator("product_id")
    @classmethod
    def validate_product_id(cls, value: str) -> str:
        if not is_available_product(value):
            raise ValueError(
                "Р’С‹Р±РµСЂРёС‚Рµ РґРѕСЃС‚СѓРїРЅС‹Р№ С„РѕСЂРјР°С‚ РїСѓС‚РµС€РµСЃС‚РІРёСЏ"
            )
        return value

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        return clean_text(value)

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str | None) -> str | None:
        return clean_text(value, allow_lines=True)

    @field_validator("website_honeypot")
    @classmethod
    def validate_honeypot(cls, value: str | None) -> str | None:
        return clean_text(value)

    @field_validator("contact_value")
    @classmethod
    def clean_contact(cls, value: str) -> str:
        cleaned = clean_text(value)
        if cleaned is None:
            raise ValueError("Укажите контакт")
        return cleaned

    @field_validator("consent")
    @classmethod
    def require_consent(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Необходимо согласие на обработку персональных данных")
        return value

    @field_validator("contact_value")
    @classmethod
    def normalize_contact(cls, raw: str, info: ValidationInfo) -> str:
        method = info.data.get("contact_method")
        if method == "email":
            try:
                return validate_email(
                    raw, check_deliverability=False, allow_smtputf8=False
                ).normalized
            except EmailNotValidError as exc:
                raise ValueError("Проверьте адрес электронной почты") from exc
        if method == "telegram":
            username = raw
            if raw.startswith("https://"):
                parsed = urlsplit(raw)
                if parsed.netloc.lower() not in {"t.me", "telegram.me"}:
                    raise ValueError("Укажите username Telegram или ссылку на профиль")
                if parsed.query or parsed.fragment:
                    raise ValueError("Ссылка Telegram должна вести на профиль")
                segments = parsed.path.strip("/").split("/")
                if len(segments) != 1:
                    raise ValueError("Ссылка Telegram должна вести на профиль")
                username = segments[0]
            username = username.removeprefix("@").strip()
            if not TELEGRAM_USERNAME.fullmatch(username):
                raise ValueError("Проверьте username Telegram")
            return f"@{username}"
        if method == "instagram":
            username = raw
            if raw.startswith("https://"):
                parsed = urlsplit(raw)
                if parsed.netloc.lower() not in {"instagram.com", "www.instagram.com"}:
                    raise ValueError("Укажите username Instagram или ссылку на профиль")
                if parsed.query or parsed.fragment:
                    raise ValueError("Ссылка Instagram должна вести на профиль")
                segments = parsed.path.strip("/").split("/")
                if len(segments) != 1:
                    raise ValueError("Ссылка Instagram должна вести на профиль")
                username = segments[0]
            username = username.removeprefix("@").strip()
            if not INSTAGRAM_USERNAME.fullmatch(username):
                raise ValueError("Проверьте username Instagram")
            return f"@{username}"
        if method != "phone":
            raise ValueError("Выберите допустимый способ связи")
        try:
            parsed_phone = phonenumbers.parse(raw, None)
        except phonenumbers.NumberParseException as exc:
            raise ValueError("Введите международный номер, например +12025550123") from exc
        if (
            not raw.startswith("+")
            or parsed_phone.extension
            or not phonenumbers.is_valid_number(parsed_phone)
        ):
            raise ValueError("Введите корректный международный номер телефона")
        normalized_phone = phonenumbers.format_number(
            parsed_phone, phonenumbers.PhoneNumberFormat.E164
        )
        if len(normalized_phone) > 254:
            raise ValueError("Контакт слишком длинный")
        return normalized_phone
