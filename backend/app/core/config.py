from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "language-school-crm"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_SECRET_KEY: str = "change-me"

    DATABASE_URL: str = "postgresql+asyncpg://crm:crm@localhost:5432/crm"
    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_ALGORITHM: str = "RS256"
    JWT_PRIVATE_KEY_PATH: str = "./secrets/jwt_private.pem"
    JWT_PUBLIC_KEY_PATH: str = "./secrets/jwt_public.pem"
    JWT_ACCESS_TTL: int = 900
    JWT_REFRESH_TTL: int = 604800

    CORS_ORIGINS: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])

    LOG_LEVEL: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()