from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.database import get_db
from app import models
from app.config import settings

# Đường dẫn API đăng nhập để Swagger UI nhận diện OAuth2 Bearer Token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> models.User:
    """
    Dependency xác thực JWT Token và trả về thông tin người dùng hiện tại (User).
    
    Quy trình kiểm tra:
    1. Giải mã JWT Token để lấy email ('sub') và phiên đăng nhập ('sid').
    2. Kiểm tra sự tồn tại của User trong Database.
    3. Kiểm tra tài khoản có đang hoạt động (is_active = True) hay không.
    4. Đối soát session_id (Đảm bảo cơ chế Single Session - Đăng nhập thiết bị mới sẽ vô hiệu hóa thiết bị cũ).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Phiên đăng nhập hết hạn hoặc tài khoản đã được đăng nhập ở trình duyệt/thiết bị khác.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode JWT Token bằng Secret Key và Algorithm trong file config
        payload = jwt.decode(
            token, 
            settings.jwt_secret, 
            algorithms=[settings.jwt_algorithm]
        )
        email: str = payload.get("sub")
        token_sid: str = payload.get("sid")

        if email is None or token_sid is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # Truy vấn thông tin người dùng từ Database
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception

    # 1. Kiểm tra tài khoản có bị vô hiệu hóa không
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản của bạn đã bị vô hiệu hóa.",
        )

    # 2. Kiểm tra session_id trong Token có khớp với session_id hiện tại trong Database không
    if user.session_id != token_sid:
        raise credentials_exception

    return user