from functools import lru_cache

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class LeadSettings(BaseSettings):
    """Configuration for processes that may access only Website lead data."""

    model_config = SettingsConfigDict(extra="ignore")

    website_lead_form_enabled: bool = False
    website_admin_secret: SecretStr = SecretStr("")
    website_database_url: SecretStr = SecretStr("")
    website_receipt_secret: SecretStr = SecretStr("")
    website_rate_limit_secret: SecretStr = SecretStr("")
    website_allowed_origins: str = ""
    website_trusted_proxy_cidrs: str = ""
    telegram_bot_token: SecretStr = SecretStr("")
    telegram_leads_chat_id: str = ""

    @field_validator("website_lead_form_enabled", mode="before")
    @classmethod
    def exact_opt_in(cls, value):
        return value is True or value == "true"

    @property
    def allowed_origins(self) -> frozenset[str]:
        return frozenset(
            origin.strip() for origin in self.website_allowed_origins.split(",") if origin.strip()
        )


@lru_cache(maxsize=1)
def get_lead_settings() -> LeadSettings:
    return LeadSettings()
