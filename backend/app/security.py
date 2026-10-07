from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# Khởi tạo ngữ cảnh băm mật khẩu bằng thuật toán Bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Kiểm tra xem mật khẩu thô (plain text) có khớp với chuỗi mật khẩu đã băm (hashed) trong CSDL hay không.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Băm mật khẩu người dùng bằng Bcrypt (cắt tối đa 72 bytes).
    """
    pwd_bytes = password.encode('utf-8')
    return pwd_context.hash(pwd_bytes.decode('utf-8', errors='ignore'))


def create_access_token(
    data: Dict[str, Any], 
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Tạo chuỗi JWT Access Token chứa thông tin đăng nhập và thời hạn hết hạn.
    
    Data payload khuyến nghị chứa:
    - 'sub': Email hoặc ID người dùng.
    - 'sid': Session ID để phục vụ cơ chế Single Session (Đăng nhập đơn phiên).
    """
    to_encode = data.copy()
    
    # Tính thời gian hết hạn của token
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
        
    to_encode.update({"exp": expire})
    
    # Mã hóa JWT với Secret Key và Algorithm từ settings
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.jwt_secret, 
        algorithm=settings.jwt_algorithm
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Giải mã JWT Token và kiểm tra chữ ký. 
    Trả về dict payload nếu hợp lệ, ngược lại trả về None.
    """
    try:
        payload = jwt.decode(
            token, 
            settings.jwt_secret, 
            algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError:
        return None