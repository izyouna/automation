"""Application settings for Phase 2 production"""

from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings using Pydantic for validation"""
    
    # Application settings
    app_name: str = "Phase 2 Production API"
    app_version: str = "2.0.0"
    debug: bool = False
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Database settings
    database_url: str = "postgresql+asyncpg://user:password@localhost/phase2_production"
    database_echo: bool = False
    database_pool_size: int = 10
    database_max_overflow: int = 20
    
    # Redis settings
    redis_url: str = "redis://localhost:6379/0"
    redis_session_ttl: int = 3600  # 1 hour in seconds
    
    # Security settings
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS settings
    allowed_hosts: List[str] = ["*"]
    cors_origins: List[str] = [
        "http://localhost:3000",
        "https://staging.example.com",
        "https://production.example.com"
    ]
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["*"]
    cors_allow_headers: List[str] = ["*"]
    
    # Logging settings
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # API settings
    api_v1_prefix: str = "/api/v1"
    docs_url: str = "/docs"
    redoc_url: str = "/redoc"
    
    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 900  # 15 minutes
    
    # Session settings
    session_cookie_name: str = "phase2_session"
    session_cookie_secure: bool = True
    session_cookie_httponly: bool = True
    
    # Performance settings
    max_request_size: int = 10 * 1024 * 1024  # 10MB
    request_timeout: int = 30
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Create global settings instance
settings = Settings()
