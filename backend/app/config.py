from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Cấu hình Database PostgreSQL
    database_url: str = "postgresql://billing_user:StrongPassword123!@#@localhost:5432/billing_db"

    # Cấu hình JWT Authentication & Session
    jwt_secret: str = "your_super_secret_jwt_key_here_change_in_production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Cấu hình CORS (Cho phép React Vite / Next.js gọi API)
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    # Cấu hình Email SMTP (Tùy chọn - Gửi hóa đơn qua Email cho Khách hàng)
    mail_username: Optional[str] = None
    mail_password: Optional[str] = None
    mail_from: Optional[str] = None
    mail_port: int = 587
    mail_server: str = "smtp.gmail.com"
    mail_starttls: bool = True
    mail_ssl_tls: bool = False

    # Đọc biến môi trường từ file .env
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()