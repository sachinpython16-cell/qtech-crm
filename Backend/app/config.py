from datetime import datetime, timezone
import os
import secrets
from typing import List, Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


def now_utc() -> datetime:
    """Returns the current timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


class Settings(BaseSettings):
    # Application Environment
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "QtechCRM")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")  # development, staging, production
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")
    ENABLE_DOCS: bool = os.getenv("ENABLE_DOCS", "true").lower() in ("true", "1", "yes")

    # Security & JWT Tokens
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", "45ffc1e806f5004f5911291990c8a026ba7a6165e4071d7c5c842be8b71ec6df"
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", "10080"))

    # CORS Origins (comma-separated list in .env)
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173",
    )

    # Database Configuration
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "qtech_crm_db")
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")

    # Database Pool Settings (Optimized for production concurrency)
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "20"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))
    DB_POOL_RECYCLE: int = int(os.getenv("DB_POOL_RECYCLE", "1800"))  # Recycle idle connections every 30m

    # Server Execution Settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    WORKERS: int = int(os.getenv("WORKERS", "1"))

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

    @property
    def get_database_url(self) -> str:
        """Returns the configured DATABASE_URL or constructs one from PostgreSQL parameters."""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parses the comma-separated CORS_ORIGINS string into a clean list of allowed origins."""
        if not self.CORS_ORIGINS or self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    def validate_production_security(self) -> None:
        """Warns or raises error if insecure default credentials are used in production."""
        if self.ENVIRONMENT.lower() == "production":
            default_demo_key = "45ffc1e806f5004f5911291990c8a026ba7a6165e4071d7c5c842be8b71ec6df"
            if not self.SECRET_KEY or self.SECRET_KEY == default_demo_key:
                raise ValueError(
                    "[SECURITY ALERT] Running in PRODUCTION mode with default demo SECRET_KEY! "
                    "Generate a cryptographically secure key with: python -c 'import secrets; print(secrets.token_hex(32))' "
                    "and assign it to SECRET_KEY in your production environment variables."
                )
            if self.POSTGRES_PASSWORD in ("postgres", "password", "123456"):
                print(
                    "[WARNING] Running in production with default database password. "
                    "Ensure a strong password is set in .env."
                )


settings = Settings()

# Validate security settings on startup
try:
    settings.validate_production_security()
except ValueError as e:
    print(f"\n{str(e)}\n")

# Direct exports for backward compatibility with existing modules
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_MINUTES = settings.REFRESH_TOKEN_EXPIRE_MINUTES
