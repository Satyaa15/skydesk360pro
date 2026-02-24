import os
from dotenv import load_dotenv

load_dotenv()


def _get_bool_env(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _get_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS")

    # If explicitly set in environment, use it
    if raw and raw.strip():
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    # Production fallback (Render frontend)
    environment = os.getenv("ENVIRONMENT", "development").strip().lower()
    if environment == "production":
        return [
            "https://skydesk-frontend.onrender.com"
        ]

    # Development fallback
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]


def _normalize_database_url(url: str | None) -> str | None:
    if not url:
        return url
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


class Settings:
    PROJECT_NAME: str = "SkyDesk Pro"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development").strip().lower()
    DATABASE_URL: str | None = _normalize_database_url(os.getenv("DATABASE_URL"))
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    SQL_ECHO: bool = _get_bool_env("SQL_ECHO", default=False)
    CORS_ORIGINS: list[str] = _get_cors_origins()

    # Mail settings
    MAIL_USERNAME: str | None = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD: str | None = os.getenv("MAIL_PASSWORD")
    MAIL_FROM: str | None = os.getenv("MAIL_FROM")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", 587))
    MAIL_SERVER: str | None = os.getenv("MAIL_SERVER")
    MAIL_FROM_NAME: str | None = os.getenv("MAIL_FROM_NAME")

    # Admin root
    ADMIN_EMAIL: str | None = os.getenv("ADMIN_EMAIL")
    ADMIN_PASSWORD: str | None = os.getenv("ADMIN_PASSWORD")

    def validate(self) -> None:
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL is required.")

        insecure_secret_keys = {"", "default_secret", "your_super_secret_key_here"}
        if self.ENVIRONMENT == "production":
            if self.SECRET_KEY in insecure_secret_keys or len(self.SECRET_KEY) < 32:
                raise ValueError("SECRET_KEY must be set to a strong value in production.")

            if "*" in self.CORS_ORIGINS:
                raise ValueError("CORS_ORIGINS cannot contain '*' in production.")


settings = Settings()
settings.validate()
