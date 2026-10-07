from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.audit import log_action
from app.database import get_db
from app.rbac import require_admin
from app.security import get_password_hash

router = APIRouter()


@router.get("/", response_model=List[schemas.UserOut])
def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[models.UserRole] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    """
    Lấy danh sách người dùng trong hệ thống (Chỉ dành cho Admin).
    - Hỗ trợ phân trang (`skip`, `limit`).
    - Tìm kiếm theo Tên hoặc Email (`search`).
    - Lọc theo Vai trò (`role`) và Trạng thái (`is_active`).
    """
    query = db.query(models.User)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (models.User.full_name.ilike(search_fmt)) |
            (models.User.email.ilike(search_fmt))
        )
    if role is not None:
        query = query.filter(models.User.role == role)
    if is_active is not None:
        query = query.filter(models.User.is_active == is_active)

    users = query.offset(skip).limit(limit).all()
    return users


@router.post("/", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    """
    Tạo tài khoản người dùng mới (Staff/Admin).
    - Kiểm tra trùng lặp email.
    - Băm mật khẩu bằng Bcrypt.
    - Ghi vết Nhật ký hệ thống (AuditLog).
    """
    existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Địa chỉ email này đã được đăng ký trong hệ thống."
        )

    # Khởi tạo người dùng mới
    new_user = models.User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role if hasattr(user_in, 'role') and user_in.role else models.UserRole.STAFF,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Ghi vết Nhật ký hệ thống
    role_str = new_user.role.value if hasattr(new_user.role, 'value') else str(new_user.role)
    log_action(
        db=db,
        user=admin_user,
        action="CREATE_USER",
        entity="User",
        entity_id=new_user.id,
        details={"email": new_user.email, "role": role_str}
    )

    return new_user


@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    """
    Lấy thông tin chi tiết của một người dùng theo ID.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng."
        )
    return user


@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    """
    Cập nhật thông tin người dùng (Họ tên, Vai trò, Trạng thái).
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng."
        )

    # Cập nhật các trường dữ liệu được truyền vào
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.is_active is not None:
        user.is_active = user_in.is_active

    db.commit()
    db.refresh(user)

    # Ghi Audit Log
    log_action(
        db=db,
        user=admin_user,
        action="UPDATE_USER",
        entity="User",
        entity_id=user.id,
        details={"updated_fields": user_in.model_dump(exclude_unset=True) if hasattr(user_in, 'model_dump') else user_in.dict(exclude_unset=True)}
    )

    return user


@router.patch("/{user_id}/status", response_model=schemas.UserOut)
def update_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    """
    Khóa hoặc Mở khóa tài khoản người dùng.
    - Ngăn cấm Admin tự vô hiệu hóa chính mình.
    - Xóa `session_id` để ngắt kết nối thiết bị ngay lập tức khi bị khóa.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng."
        )

    # Ngăn chặn Admin tự khóa tài khoản cá nhân
    if user.id == admin_user.id and not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn không thể tự vô hiệu hóa tài khoản Admin của chính mình."
        )

    user.is_active = is_active
    
    # Nếu bị khóa, vô hiệu hóa session hiện tại ngay lập tức
    if not is_active:
        user.session_id = None

    db.commit()
    db.refresh(user)

    # Ghi vết thao tác
    log_action(
        db=db,
        user=admin_user,
        action="TOGGLE_USER_STATUS",
        entity="User",
        entity_id=user.id,
        details={"is_active": is_active, "email": user.email}
    )

    return user


@router.post("/{user_id}/reset-password")
def admin_reset_password(
    user_id: int,
    payload: schemas.AdminResetPasswordRequest,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    """
    Admin chủ động đặt lại mật khẩu cho nhân viên.
    - Băm mật khẩu mới bằng Bcrypt.
    - Xóa `session_id` yêu cầu nhân viên đăng nhập lại.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng."
        )

    user.hashed_password = get_password_hash(payload.new_password)
    user.session_id = None  # Đăng xuất tài khoản trên mọi thiết bị

    db.commit()

    # Ghi Audit Log
    log_action(
        db=db,
        user=admin_user,
        action="ADMIN_RESET_PASSWORD",
        entity="User",
        entity_id=user.id,
        details={"email": user.email}
    )

    return {"message": f"Đặt lại mật khẩu cho tài khoản {user.email} thành công."}