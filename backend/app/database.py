from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Khởi tạo SQLAlchemy Engine kết nối tới PostgreSQL
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,  # Tự động kiểm tra và khôi phục kết nối bị ngắt đến PostgreSQL
    pool_size=10,        # Số lượng kết nối duy trì sẵn trong Pool
    max_overflow=20,     # Số kết nối tối đa cho phép tạo thêm khi hệ thống tải cao
    future=True,
)

# Khởi tạo SessionFactory để quản lý các transaction
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

# Base class định nghĩa các ORM Model (được import trong models.py)
Base = declarative_base()


def get_db():
    """
    Dependency Generator cung cấp SQLAlchemy Session cho mỗi API request 
    và tự động đóng (close) sau khi xử lý xong.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()