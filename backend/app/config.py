from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env", extra="ignore"
    )
    app_env: Literal["development", "test", "production"] = "development"
    postgres_host: str = "127.0.0.1"
    postgres_port: int = 5432
    postgres_db: str = "travel_club"
    postgres_user: str = "travel_club"
    postgres_password: SecretStr
    allowed_origin: str = "http://localhost:3000"
    cookie_secure: bool = False
    session_hours: int = 12
    login_limit_per_login: int = 5
    login_limit_per_ip: int = 20
    login_window_minutes: int = 15
    geoapify_api_key: SecretStr = SecretStr("")
    geoapify_maps_api_key: SecretStr = SecretStr("")

    @model_validator(mode="after")
    def safe_production(self):
        if self.app_env == "production":
            if not self.cookie_secure or not self.allowed_origin.startswith("https://"):
                raise ValueError("Production requires secure cookies and an HTTPS origin")
        return self

    @property
    def database_url(self) -> URL:
        return URL.create(
            "postgresql+psycopg",
            username=self.postgres_user,
            password=self.postgres_password.get_secret_value(),
            host=self.postgres_host,
            port=self.postgres_port,
            database=self.postgres_db,
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
