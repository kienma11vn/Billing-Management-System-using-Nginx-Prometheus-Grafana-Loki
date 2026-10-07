import json
from fastapi.responses import Response
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.database import get_db
from app.rbac import require_admin

router = APIRouter()


@router.get("/", response_model=List[schemas.AuditLogOut])
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    user_id: Optional[int] = Query(None, description="Lọc theo ID người thực hiện"),
    action: Optional[str] = Query(None, description="Lọc theo hành động (VD: CREATE_INVOICE, CANCEL_INVOICE, UPDATE_CUSTOMER)"),
    entity: Optional[str] = Query(None, description="Lọc theo thực thể bị tác động (VD: Invoice, Customer, Service, User)"),
    entity_id: Optional[int] = Query(None, description="Lọc theo ID của thực thể bị tác động"),
    start_date: Optional[datetime] = Query(None, description="Lọc từ ngày (Định dạng: YYYY-MM-DDTHH:MM:SS)"),
    end_date: Optional[datetime] = Query(None, description="Lọc đến ngày (Định dạng: YYYY-MM-DDTHH:MM:SS)"),
    search: Optional[str] = Query(None, description="Tìm kiếm từ khóa trong nội dung chi tiết (details)"),
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    """
    Lấy danh sách Nhật ký hoạt động hệ thống (Audit Logs).
    - Quyền truy cập: Dành riêng cho Admin.
    - Hỗ trợ phân trang, lọc đa tiêu chí (User, Action, Entity, Khoảng thời gian) và tìm kiếm theo chi tiết nội dung.
    """
    query = db.query(models.AuditLog).options(joinedload(models.AuditLog.user))

    if user_id:
        query = query.filter(models.AuditLog.user_id == user_id)

    if action:
        query = query.filter(models.AuditLog.action.ilike(f"%{action.strip()}%"))

    if entity:
        query = query.filter(models.AuditLog.entity.ilike(f"%{entity.strip()}%"))

    if entity_id:
        query = query.filter(models.AuditLog.entity_id == entity_id)

    if start_date:
        query = query.filter(models.AuditLog.created_at >= start_date)

    if end_date:
        query = query.filter(models.AuditLog.created_at <= end_date)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(models.AuditLog.details.ilike(search_fmt))

    audit_logs = (
        query.order_by(models.AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return audit_logs


@router.get("/export")
def export_audit_logs(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    """Xuất tối đa 1000 bản ghi audit log gần nhất dưới dạng file JSON"""
    logs = (
        db.query(models.AuditLog)
        .order_by(models.AuditLog.created_at.desc())
        .limit(1000)
        .all()
    )
    
    export_data = [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "entity": log.entity,
            "entity_id": log.entity_id,
            "details": log.details,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]
    
    content = json.dumps(export_data, ensure_ascii=False, indent=2)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=audit_logs.json"}
    )


@router.get("/{audit_log_id}", response_model=schemas.AuditLogOut)
def get_audit_log_detail(
    audit_log_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin),
):
    """
    Lấy thông tin chi tiết của 1 bản ghi Nhật ký hoạt động theo ID.
    - Quyền truy cập: Dành riêng cho Admin.
    """
    audit_log = (
        db.query(models.AuditLog)
        .options(joinedload(models.AuditLog.user))
        .filter(models.AuditLog.id == audit_log_id)
        .first()
    )

    if not audit_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy bản ghi Audit Log có ID = {audit_log_id}."
        )

    return audit_log    