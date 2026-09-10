from functools import lru_cache
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Core
    app_name: str = "Mirabilis CMS API"
    api_prefix: str = "/api/v1"
    environment: str = Field(default="development")

    # Database
    mongodb_uri: str = "mongodb://localhost:27017"
    db_name: str = "mirabilis"

    @field_validator("db_name", "mongodb_uri", "jwt_secret", "secrets_encryption_key", mode="before")
    @classmethod
    def strip_whitespace(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip()
        return v

    # Auth
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 30

    # CORS
    cors_origins: list[str] = ["*"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        if isinstance(v, list):
            return v
        return ["*"]

    # Storage
    storage_driver: str = "local"  # local | s3
    storage_local_path: str = "backend/uploads"
    s3_bucket: str | None = None
    s3_region: str | None = None
    s3_access_key_id: str | None = None
    s3_secret_access_key: str | None = None

    # Upload limits (MB)
    upload_max_image_mb: int = 15
    upload_max_video_mb: int = 1000
    upload_max_pdf_mb: int = 20

    # SMTP
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_name: str = "Mirabilis"

    # Secrets encryption
    secrets_encryption_key: str = "dev-key-change-me"

    # Seed admin
    seed_admin_email: str = "admin@mirabilis.com"
    seed_admin_password: str = "MirabilisBYT@2026"

    # Blogger sync
    blogger_api_key: str | None = None
    blogger_blog_url: str | None = None
    blogger_sync_enabled: bool = False
    blogger_sync_interval_minutes: int = 60

    # Misc
    frontend_base_url: str = "http://localhost:5173"
    rate_limit_login_per_minute: int = 60
    rate_limit_contact_per_minute: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
