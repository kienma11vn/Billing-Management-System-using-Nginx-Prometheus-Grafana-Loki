import json
import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import models, schemas
from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.security import create_access_token, verify_password, get_password_hash

router = APIRouter()


@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    API Đăng nhập hệ thống (OAuth2 Password Request Form).
    - Kiểm tra email và mật khẩu.
    - Cập nhật session_id mới (Single Session).
    - Trả về JWT Access Token chứa thông tin user và sid.
    - Ghi nhận AuditLog đăng nhập thành công.
    """
    # 1. Tra cứu người dùng theo email
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Kiểm tra trạng thái kích hoạt tài khoản
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản của bạn đã bị vô hiệu hóa."
        )

    # 3. Tạo session_id mới cho lần đăng nhập này (Phục vụ cơ chế Đăng nhập đơn phiên
    new_session_id = str(uuid.uuid4())
    user.session_id = new_session_id  # Cập nhật session_id vào DB

    role_str = user.role.value if hasattr(user.role, "value") else str(user.role)

    # 4. Đưa 'sub' (email), 'role', và 'sid' (session_id) vào JWT Payload
    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": role_str,
            "sid": new_session_id
        },
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )

    # 5. Ghi nhật ký hệ thống (AuditLog)
    audit_log = models.AuditLog(
        user_id=user.id,
        action="LOGIN",
        entity="User",
        entity_id=user.id,
        details=json.dumps({"event": "User login success", "email": user.email}, ensure_ascii=False)
    )
    db.add(audit_log)
    db.commit()

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
def logout(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    API Đăng xuất hệ thống.
    - Hủy session_id hiện tại của user trong DB để vô hiệu hóa Token.
    - Ghi nhận AuditLog đăng xuất.
    """
    user_id = current_user.id
    user_email = current_user.email

    # Xóa session_id để vô hiệu hóa Token hiện tại
    current_user.session_id = None

    # Ghi AuditLog
    audit_log = models.AuditLog(
        user_id=user_id,
        action="LOGOUT",
        entity="User",
        entity_id=user_id,
        details=json.dumps({"event": "User logout success", "email": user_email}, ensure_ascii=False)
    )
    db.add(audit_log)
    db.commit()

    return {"message": "Đăng xuất thành công."}


@router.get("/me", response_model=schemas.UserOut)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    """
    API Lấy thông tin tài khoản đang đăng nhập hiện tại.
    """
    return current_user


@router.post("/change-password")
def change_password(
    payload: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    API Đổi mật khẩu cho người dùng đang đăng nhập.
    """
    # 1. Đối soát mật khẩu cũ
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu hiện tại không chính xác."
        )

    # 2. Băm và lưu mật khẩu mới
    current_user.hashed_password = get_password_hash(payload.new_password)

    # 3. Ghi AuditLog
    audit_log = models.AuditLog(
        user_id=current_user.id,
        action="CHANGE_PASSWORD",
        entity="User",
        entity_id=current_user.id,
        details=json.dumps({"event": "User changed password", "email": current_user.email}, ensure_ascii=False)
    )
    db.add(audit_log)
    db.commit()

    return {"message": "Đổi mật khẩu thành công."}


@router.post("/forgot-password")
def forgot_password(payload: dict):
    # Thực hiện tra cứu user theo email và gửi mail kèm token/link reset mật khẩu
    email = payload.get("email")
    return {"message": f"Yêu cầu khôi phục mật khẩu cho {email} đã được ghi nhận."}    
    

@router.post("/reset-password")
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    API Đặt lại mật khẩu sử dụng Token khôi phục từ Email.
    """
    # 1. Giải mã và xác thực Token (Ví dụ dùng JWT hoặc token lưu trong CSDL)
    payload_data = decode_access_token(payload.token)
    if not payload_data or "sub" not in payload_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã khôi phục không hợp lệ hoặc đã hết hạn."
        )

    user_email = payload_data.get("sub")
    user = db.query(models.User).filter(models.User.email == user_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tài khoản không tồn tại."
        )

    # 2. Băm mật khẩu mới và lưu vào CSDL
    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()

    return {"message": "Đặt lại mật khẩu thành công!"}    