from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.audit import log_action
from app.database import get_db
from app.rbac import require_admin, require_authenticated

router = APIRouter()


@router.get("/", response_model=List[schemas.ServiceOut])
def get_services(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Tìm kiếm theo Tên hoặc Mã dịch vụ"),
    is_active: Optional[bool] = Query(None, description="Lọc theo trạng thái hoạt động"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_authenticated),
):
    """
    Lấy danh sách sản phẩm / dịch vụ.
    - Quyền truy cập: Cả Staff và Admin (Phục vụ tra cứu danh mục & lập hóa đơn).
    - Hỗ trợ phân trang (`skip`, `limit`), tìm kiếm theo Tên/Mã dịch vụ, lọc theo `is_active`.
    """
    query = db.query(models.Service)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (models.Service.name.ilike(search_fmt)) |
            (models.Service.code.ilike(search_fmt))
        )

    if is_active is not None:
        query = query.filter(models.Service.is_active == is_active)

    services = query.order_by(models.Service.created_at.desc()).offset(skip).limit(limit).all()
    return services


@router.post("/", response_model=schemas.ServiceOut, status_code=status.HTTP_201_CREATED)
def create_service(
    service_in: schemas.ServiceCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    """
    Thêm mới sản phẩm / dịch vụ.
    - Quyền truy cập: Dành riêng cho Admin.
    - Kiểm tra trùng lặp Mã dịch vụ (`code`).
    - Ghi vết Nhật ký hệ thống (Audit Log).
    """
    existing_service = db.query(models.Service).filter(models.Service.code == service_in.code).first()
    if existing_service:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã dịch vụ '{service_in.code}' đã tồn tại trong hệ thống."
        )

    new_service = models.Service(
        name=service_in.name,
        code=service_in.code,
        description=service_in.description,
        unit_price=service_in.unit_price,
        is_active=service_in.is_active if hasattr(service_in, 'is_active') and service_in.is_active is not None else True,
    )

    db.add(new_service)
    db.commit()
    db.refresh(new_service)

    # Ghi nhật ký Audit Log
    log_action(
        db=db,
        user=admin_user,
        action="CREATE_SERVICE",
        entity="Service",
        entity_id=new_service.id,
        details={
            "name": new_service.name,
            "code": new_service.code,
            "unit_price": str(new_service.unit_price)
        }
    )

    return new_service


@router.get("/{service_id}", response_model=schemas.ServiceOut)
def get_service_detail(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_authenticated),
):
    """
    Lấy thông tin chi tiết một dịch vụ theo ID.
    - Quyền truy cập: Cả Staff và Admin.
    """
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin dịch vụ."
        )
    return service


@router.put("/{service_id}", response_model=schemas.ServiceOut)
def update_service(
    service_id: int,
    service_in: schemas.ServiceUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    """
    Cập nhật thông tin dịch vụ / đơn giá.
    - Quyền truy cập: Dành riêng cho Admin.
    - Kiểm tra trùng lặp mã dịch vụ nếu có cập nhật `code`.
    - Ghi vết thao tác Audit Log.
    """
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin dịch vụ."
        )

    # Kiểm tra trùng mã dịch vụ mới nếu thay đổi code
    if service_in.code and service_in.code != service.code:
        existing = db.query(models.Service).filter(
            models.Service.code == service_in.code,
            models.Service.id != service_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mã dịch vụ '{service_in.code}' đã được sử dụng cho một dịch vụ khác."
            )

    update_data = (
        service_in.model_dump(exclude_unset=True)
        if hasattr(service_in, "model_dump")
        else service_in.dict(exclude_unset=True)
    )

    for field, value in update_data.items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)

    # Ghi nhật ký Audit Log
    log_action(
        db=db,
        user=admin_user,
        action="UPDATE_SERVICE",
        entity="Service",
        entity_id=service.id,
        details=update_data
    )

    return service


@router.patch("/{service_id}/status", response_model=schemas.ServiceOut)
def update_service_status(
    service_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    """
    Bật hoặc Tắt trạng thái hoạt động của dịch vụ.
    - Quyền truy cập: Dành riêng cho Admin.
    """
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin dịch vụ."
        )

    service.is_active = is_active
    db.commit()
    db.refresh(service)

    # Ghi nhật ký Audit Log
    log_action(
        db=db,
        user=admin_user,
        action="TOGGLE_SERVICE_STATUS",
        entity="Service",
        entity_id=service.id,
        details={"is_active": is_active, "code": service.code, "name": service.name}
    )

    return service


@router.delete("/{service_id}", status_code=status.HTTP_200_OK)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    """
    Xóa sản phẩm / dịch vụ khỏi hệ thống.
    - Quyền truy cập: Dành riêng cho Admin.
    - Kiểm tra ràng buộc dữ liệu: Không xóa nếu dịch vụ đã phát sinh trong Hóa đơn (`InvoiceItem`).
    """
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin dịch vụ."
        )

    # Ràng buộc toàn vẹn dữ liệu: Không xóa nếu đã có trong chi tiết hóa đơn
    has_invoice_items = db.query(models.InvoiceItem).filter(models.InvoiceItem.service_id == service_id).first()
    if has_invoice_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa dịch vụ này do đã xuất hiện trong hóa đơn. Vui lòng chuyển trạng thái thành Ngừng hoạt động (is_active=False)."
        )

    service_info = {
        "code": service.code,
        "name": service.name
    }

    db.delete(service)
    db.commit()

    # Ghi nhật ký Audit Log
    log_action(
        db=db,
        user=admin_user,
        action="DELETE_SERVICE",
        entity="Service",
        entity_id=service_id,
        details=service_info
    )

    return {"message": f"Đã xóa thành công dịch vụ '{service.name}' ({service.code})."}