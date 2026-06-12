from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from dotenv import load_dotenv


def _parse_database_url(database_url: str) -> dict[str, object]:
    normalized_url = database_url.replace("mysql+pymysql://", "mysql://")
    parsed = urlparse(normalized_url)
    query = parse_qs(parsed.query)

    return {
        "mysql_host": parsed.hostname or "localhost",
        "mysql_port": parsed.port or 3306,
        "mysql_user": unquote(parsed.username or "root"),
        "mysql_password": unquote(parsed.password or ""),
        "mysql_database": (parsed.path or "/").lstrip("/") or "obligatorio_bdii",
        "mysql_charset": query.get("charset", ["utf8mb4"])[0],
    }


def _load_environment_file() -> None:
    project_root = Path(__file__).resolve().parents[2]
    
    # 1. Intentar cargar el .env base (el que creas con cp .env.example .env)
    base_env = project_root / ".env"
    if base_env.exists():
        load_dotenv(base_env)

    # 2. Intentar cargar el específico del entorno (local, facultad) para sobreescribir
    app_env = os.getenv("APP_ENV", "local").strip() or "local"
    env_specific = project_root / f".env.{app_env}"
    if env_specific.exists():
        load_dotenv(env_specific, override=True)


@dataclass(slots=True)
class Settings:
    database_url: str | None = field(default_factory=lambda: os.getenv("DATABASE_URL"))
    mysql_host: str = field(default_factory=lambda: os.getenv("MYSQL_HOST", "localhost"))
    mysql_port: int = field(default_factory=lambda: int(os.getenv("MYSQL_PORT", "3306")))
    mysql_user: str = field(default_factory=lambda: os.getenv("MYSQL_USER", "root"))
    mysql_password: str = field(default_factory=lambda: os.getenv("MYSQL_PASSWORD", ""))
    mysql_database: str = field(default_factory=lambda: os.getenv("MYSQL_DATABASE", "obligatorio_bdii"))
    mysql_charset: str = field(default_factory=lambda: os.getenv("MYSQL_CHARSET", "utf8mb4"))
    mysql_pool_min_size: int = field(default_factory=lambda: int(os.getenv("MYSQL_POOL_MIN_SIZE", "1")))
    mysql_pool_max_size: int = field(default_factory=lambda: int(os.getenv("MYSQL_POOL_MAX_SIZE", "10")))
    jwt_secret_key: str = field(default_factory=lambda: os.getenv("SECRET_KEY", "change-me"))
    jwt_algorithm: str = field(default_factory=lambda: os.getenv("JWT_ALGORITHM", "HS256"))
    access_token_expire_minutes: int = field(default_factory=lambda: int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")))
    auth0_domain: str = field(default_factory=lambda: os.getenv("AUTH0_DOMAIN", ""))
    auth0_audience: str = field(default_factory=lambda: os.getenv("AUTH0_AUDIENCE", ""))
    auth0_algorithms: str = field(default_factory=lambda: os.getenv("AUTH0_ALGORITHMS", "RS256"))
    auth0_namespace: str = field(default_factory=lambda: os.getenv("AUTH0_NAMESPACE", "https://ticketing-mundial"))
    auth0_client_id: str = field(default_factory=lambda: os.getenv("AUTH0_CLIENT_ID", ""))
    cors_origins: list[str] = field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
            if origin.strip()
        ]
    )

    def __post_init__(self) -> None:
        if self.database_url:
            database_settings = _parse_database_url(self.database_url)
            self.mysql_host = database_settings["mysql_host"]  # type: ignore[assignment]
            self.mysql_port = database_settings["mysql_port"]  # type: ignore[assignment]
            self.mysql_user = database_settings["mysql_user"]  # type: ignore[assignment]
            self.mysql_password = database_settings["mysql_password"]  # type: ignore[assignment]
            self.mysql_database = database_settings["mysql_database"]  # type: ignore[assignment]
            self.mysql_charset = database_settings["mysql_charset"]  # type: ignore[assignment]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    _load_environment_file()
    return Settings()