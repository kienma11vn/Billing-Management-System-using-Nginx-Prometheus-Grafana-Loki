from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.audit import log_action
from app.database import get_db
from app.rbac import require_staff

router = APIRouter()


@router.get("/", response_model=List[schemas.CustomerOut])
def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Tìm theo tên, SĐT, email hoặc MST"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_staff),
):
    """
    Lấy danh sách khách hàng.
    - Yêu cầu quyền: Staff hoặc Admin.
    - Hỗ trợ phân trang (`skip`, `limit`) và tìm kiếm từ khóa linh hoạt (`search`).
    """
    query = db.query(models.Customer)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (models.Customer.full_name.ilike(search_fmt)) |
            (models.Customer.phone.ilike(search_fmt)) |
            (models.Customer.email.ilike(search_fmt)) |
            (models.Customer.tax_code.ilike(search_fmt))
        )

    customers = query.order_by(models.Customer.created_at.desc()).offset(skip).limit(limit).all()
    return customers


@router.post("/", response_model=schemas.CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer_in: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_staff),
):
    """
    Tạo hồ sơ khách hàng mới.
    - Yêu cầu quyền: Staff hoặc Admin.
    - Kiểm tra trùng lặp số điện thoại.
    - Ghi vết thao tác Audit Log.
    """
    # Kiểm tra trùng lặp số điện thoại
    existing_customer = db.query(models.Customer).filter(models.Customer.phone == customer_in.phone).first()
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Số điện thoại này đã được sử dụng cho một khách hàng khác."
        )

    new_customer = models.Customer(
        full_name=customer_in.full_name,
        phone=customer_in.phone,
        email=customer_in.email,
        tax_code=customer_in.tax_code,
        address=customer_in.address,
        notes=customer_in.notes,
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    # Ghi nhật ký Audit Log
    log_action(
        db=db,
        user=current_user,
        action="CREATE_CUSTOMER",
        entity="Customer",
        entity_id=new_customer.id,
        details={
            "full_name": new_customer.full_name,
            "phone": new_customer.phone,
            "email": new_customer.email
        }
    )

    return new_customer


@router.get("/{customer_id}", response_model=schemas.CustomerOut)
def get_customer_detail(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_staff),
):
    """
    Xem thông tin chi tiết một khách hàng theo ID.
    - Yêu cầu quyền: Staff hoặc Admin.
    """
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin khách hàng."
        )
    return customer


@router.put("/{customer_id}", response_model=schemas.CustomerOut)
def update_customer(
    customer_id: int,
    customer_in: schemas.CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_staff),
):
    """
    Cập nhật thông tin hồ sơ khách hàng.
    - Yêu cầu quyền: Staff hoặc Admin.
    - Ghi nhật ký chi tiết thông tin đã thay đổi.
    """
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin khách hàng."
        )

    # Nếu có thay đổi SĐT, kiểm tra trùng SĐT với các khách hàng khác
    if customer_in.phone and customer_in.phone != customer.phone:
        existing = db.query(models.Customer).filter(
            models.Customer.phone == customer_in.phone,
            models.Customer.id != customer_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Số điện thoại mới đã tồn tại ở một hồ sơ khách hàng khác."
            )

    update_data = (
        customer_in.model_dump(exclude_unset=True)
        if hasattr(customer_in, "model_dump")
        else customer_in.dict(exclude_unset=True)
    )

    for field, value in update_data.items():
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)

    # Ghi vết Audit Log
    log_action(
        db=db,
        user=current_user,
        action="UPDATE_CUSTOMER",
        entity="Customer",
        entity_id=customer.id,
        details=update_data
    )

    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_200_OK)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_staff),
):
    """
    Xóa hồ sơ khách hàng.
    - Yêu cầu quyền: Staff hoặc Admin.
    - Kiểm tra ràng buộc: Không cho phép xóa khách hàng đã có hóa đơn trong hệ thống.
    """
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin khách hàng."
        )

    # Ràng buộc toàn vẹn dữ liệu: Không xóa nếu đã có hóa đơn liên quan
    has_invoices = db.query(models.Invoice).filter(models.Invoice.customer_id == customer_id).first()
    if has_invoices:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa khách hàng này do đã có phát sinh hóa đơn trong hệ thống."
        )

    customer_info = {
        "full_name": customer.full_name,
        "phone": customer.phone
    }

    db.delete(customer)
    db.commit()

    # Ghi nhật ký Audit Log
    log_action(
        db=db,
        user=current_user,
        action="DELETE_CUSTOMER",
        entity="Customer",
        entity_id=customer_id,
        details=customer_info
    )

    return {"message": f"Đã xóa thành công khách hàng '{customer.full_name}'."}