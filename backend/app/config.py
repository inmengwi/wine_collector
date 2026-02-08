"""Application configuration using pydantic-settings."""

from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "Wine Collector API"
    app_env: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # Logging
    log_level: str = "INFO"
    log_json: bool = True  # Use JSON format for logs

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/wine_collector"

    @field_validator("database_url", mode="before")
    @classmethod
    def convert_database_url(cls, v):
        """Convert postgres:// to postgresql+asyncpg:// for async SQLAlchemy."""
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            if v.startswith("postgresql://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # JWT Authentication
    jwt_secret_key: str = "your-super-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    # Anthropic API
    anthropic_api_key: str = ""

    # AI Provider (global default)
    ai_provider: str = "gemini"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # Per-task AI model settings (override global default)
    # Scan: vision model for wine label recognition
    scan_ai_provider: str = ""  # Empty = use ai_provider
    scan_ai_model: str = ""  # Empty = use provider default
    # Recommendation: text model for pairing recommendations
    recommendation_ai_provider: str = ""  # Empty = use ai_provider
    recommendation_ai_model: str = ""  # Empty = use provider default

    # Recommendation cache
    recommendation_cache_ttl_hours: int = 24  # Cache expiry in hours

    @property
    def effective_scan_provider(self) -> str:
        return self.scan_ai_provider or self.ai_provider

    @property
    def effective_scan_model(self) -> str:
        if self.scan_ai_model:
            return self.scan_ai_model
        provider = self.effective_scan_provider.lower()
        if provider == "gemini":
            return self.gemini_model
        return "claude-sonnet-4-20250514"

    @property
    def effective_recommendation_provider(self) -> str:
        return self.recommendation_ai_provider or self.ai_provider

    @property
    def effective_recommendation_model(self) -> str:
        if self.recommendation_ai_model:
            return self.recommendation_ai_model
        provider = self.effective_recommendation_provider.lower()
        if provider == "gemini":
            return self.gemini_model
        return "claude-sonnet-4-20250514"

    # Storage (Cloudflare R2)
    storage_type: str = "r2"
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "wine-collector"
    r2_public_url: str = ""
    r2_cache_max_age: int = 604800  # 7 days in seconds

    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://inmengwi.github.io",
    ]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",")]
        return v

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
