from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.audit import log_action
from app.database import get_db
from app.rbac import require_authenticated, require_staff

router = APIRouter()


@router.get("/", response_model=List[schemas.InvoiceOut])
def get_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    customer_id: Optional[int] = Query(None, description="Lọc hóa đơn theo ID Khách hàng"),
    status_filter: Optional[models.InvoiceStatus] = Query(None, alias="status", description="Lọc theo trạng thái hóa đơn"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo Tên hoặc SĐT Khách hàng"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_authenticated),
):
    """
    Lấy danh sách hóa đơn hệ thống.
    - Quyền truy cập: Cả Staff và Admin (Yêu cầu tài khoản hợp lệ).
    - Hỗ trợ bộ lọc: Theo khách hàng, trạng thái (UNPAID, PARTIAL, PAID, CANCELLED) và từ khóa tìm kiếm.
    """
    query = db.query(models.Invoice).options(
        joinedload(models.Invoice.customer),
        joinedload(models.Invoice.created_by_user)
    )

    if customer_id:
        query = query.filter(models.Invoice.customer_id == customer_id)

    if status_filter:
        query = query.filter(models.Invoice.status == status_filter)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.join(models.Customer).filter(
            (models.Customer.full_name.ilike(search_fmt)) |
            (models.Customer.phone.ilike(search_fmt))
        )

    invoices = (
        query.order_by(models.Invoice.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return invoices


@router.post("/", response_model=schemas.InvoiceDetailOut, status_code=status.HTTP_201_CREATED)
def create_invoice(
    invoice_in: schemas.InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_staff),
):
    """
    Lập Hóa đơn mới.
    - Quyền truy cập: Staff và Admin.
    - Tính toán tổng tiền hàng, trừ chiết khấu để ra tiền phải trả.
    - Lưu chi tiết các danh mục dịch vụ (`InvoiceItem`).
    - Khởi tạo trạng thái `UNPAID` và ghi vết Audit Log.
    """
    # 1. Kiểm tra sự tồn tại của Khách hàng
    customer = db.query(models.Customer).filter(models.Customer.id == invoice_in.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy thông tin Khách hàng với ID = {invoice_in.customer_id}."
        )

    if not invoice_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hóa đơn phải có ít nhất 1 dịch vụ / sản phẩm."
        )

    # 2. Kiểm tra dịch vụ và tính tổng tiền
    total_amount = Decimal("0.00")
    invoice_items_to_create = []

    for item in invoice_in.items:
        service = db.query(models.Service).filter(models.Service.id == item.service_id).first()
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy dịch vụ có ID = {item.service_id}."
            )
        if not service.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Dịch vụ '{service.name}' ({service.code}) hiện đã ngừng kinh doanh."
            )

        # Sử dụng đơn giá truyền lên hoặc đơn giá hiện tại của dịch vụ
        unit_price = item.unit_price if item.unit_price is not None else service.unit_price
        line_total = unit_price * item.quantity
        total_amount += line_total

        invoice_items_to_create.append({
            "service_id": service.id,
            "quantity": item.quantity,
            "unit_price": unit_price
        })

    discount_amount = invoice_in.discount_amount if invoice_in.discount_amount else Decimal("0.00")
    if discount_amount > total_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Số tiền giảm giá không được lớn hơn tổng tiền hàng."
        )

    final_amount = total_amount - discount_amount

    # 3. Tạo đối tượng Hóa đơn
    new_invoice = models.Invoice(
        customer_id=customer.id,
        created_by_id=current_user.id,
        total_amount=total_amount,
        discount_amount=discount_amount,
        final_amount=final_amount,
        paid_amount=Decimal("0.00"),
        status=models.InvoiceStatus.UNPAID,
        note=invoice_in.note,
    )

    db.add(new_invoice)
    db.flush()  # Lấy new_invoice.id để gán vào các invoice_items

    # 4. Tạo danh sách Chi tiết hóa đơn (InvoiceItem)
    for item_data in invoice_items_to_create:
        invoice_item = models.InvoiceItem(
            invoice_id=new_invoice.id,
            service_id=item_data["service_id"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
        )
        db.add(invoice_item)

    db.commit()

    # Eager load thông tin phục vụ Response trả về
    created_invoice = (
        db.query(models.Invoice)
        .options(
            joinedload(models.Invoice.customer),
            joinedload(models.Invoice.created_by_user),
            joinedload(models.Invoice.items).joinedload(models.InvoiceItem.service),
            joinedload(models.Invoice.payments),
        )
        .filter(models.Invoice.id == new_invoice.id)
        .first()
    )

    # 5. Ghi nhật ký Audit Log
    log_action(
        db=db,
        user=current_user,
        action="CREATE_INVOICE",
        entity="Invoice",
        entity_id=created_invoice.id,
        details={
            "customer_name": customer.full_name,
            "customer_phone": customer.phone,
            "total_amount": str(total_amount),
            "discount_amount": str(discount_amount),
            "final_amount": str(final_amount),
            "items_count": len(invoice_items_to_create)
        }
    )

    return created_invoice


@router.get("/{invoice_id}", response_model=schemas.InvoiceDetailOut)
def get_invoice_detail(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_authenticated),
):
    """
    Xem chi tiết Hóa đơn bao gồm danh sách mặt hàng & lịch sử các đợt thanh toán.
    - Quyền truy cập: Cả Staff và Admin.
    """
    invoice = (
        db.query(models.Invoice)
        .options(
            joinedload(models.Invoice.customer),
            joinedload(models.Invoice.created_by_user),
            joinedload(models.Invoice.items).joinedload(models.InvoiceItem.service),
            joinedload(models.Invoice.payments),
        )
        .filter(models.Invoice.id == invoice_id)
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy Hóa đơn có ID = {invoice_id}."
        )

    return invoice


@router.post("/{invoice_id}/payments", response_model=schemas.InvoiceDetailOut)
def collect_payment(
    invoice_id: int,
    payment_in: schemas.PaymentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_staff),
):
    """
    Thu tiền thanh toán cho Hóa đơn (Hỗ trợ thanh toán nhiều lần).
    - Quyền truy cập: Staff và Admin.
    - Tự động cập nhật `paid_amount` và chuyển trạng thái (`PARTIAL` / `PAID`).
    - Ghi vết lịch sử thanh toán (`InvoicePayment`) và Audit Log.
    """
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy Hóa đơn có ID = {invoice_id}."
        )

    if invoice.status == models.InvoiceStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hóa đơn này đã bị hủy, không thể thực hiện thu tiền."
        )

    if invoice.status == models.InvoiceStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hóa đơn này đã được thanh toán đầy đủ trước đó."
        )

    if payment_in.amount <= Decimal("0.00"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Số tiền thanh toán phải lớn hơn 0."
        )

    remaining_amount = invoice.final_amount - invoice.paid_amount
    if payment_in.amount > remaining_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Số tiền thanh toán ({payment_in.amount:,.0f}) vượt quá số tiền còn nợ ({remaining_amount:,.0f})."
        )

    # 1. Tạo bản ghi thanh toán
    payment = models.InvoicePayment(
        invoice_id=invoice.id,
        amount=payment_in.amount,
        payment_method=payment_in.payment_method or "Tiền mặt",
        note=payment_in.note,
    )
    db.add(payment)

    # 2. Cập nhật số tiền đã trả và trạng thái hóa đơn
    invoice.paid_amount += payment_in.amount
    if invoice.paid_amount >= invoice.final_amount:
        invoice.status = models.InvoiceStatus.PAID
    else:
        invoice.status = models.InvoiceStatus.PARTIAL

    db.commit()

    # Query lại invoice với đầy đủ quan hệ để trả về Response
    updated_invoice = (
        db.query(models.Invoice)
        .options(
            joinedload(models.Invoice.customer),
            joinedload(models.Invoice.created_by_user),
            joinedload(models.Invoice.items).joinedload(models.InvoiceItem.service),
            joinedload(models.Invoice.payments),
        )
        .filter(models.Invoice.id == invoice_id)
        .first()
    )

    # 3. Ghi nhật ký Audit Log
    log_action(
        db=db,
        user=current_user,
        action="ADD_INVOICE_PAYMENT",
        entity="Invoice",
        entity_id=invoice.id,
        details={
            "paid_amount_added": str(payment_in.amount),
            "payment_method": payment_in.payment_method,
            "new_total_paid": str(invoice.paid_amount),
            "status": invoice.status.value
        }
    )

    return updated_invoice


@router.post("/{invoice_id}/cancel", response_model=schemas.InvoiceDetailOut)
def cancel_invoice(
    invoice_id: int,
    reason: Optional[str] = Query(None, description="Lý do hủy hóa đơn"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_staff),
):
    """
    Hủy Hóa đơn.
    - Quyền truy cập: Staff và Admin.
    - Đổi trạng thái sang `CANCELLED` và ghi rõ lý do hủy trong Audit Log.
    """
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy Hóa đơn có ID = {invoice_id}."
        )

    if invoice.status == models.InvoiceStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hóa đơn này đã ở trạng thái Đã hủy trước đó."
        )

    old_status = invoice.status.value
    invoice.status = models.InvoiceStatus.CANCELLED
    if reason:
        invoice.note = f"{invoice.note or ''}\n[Lý do hủy]: {reason}".strip()

    db.commit()

    updated_invoice = (
        db.query(models.Invoice)
        .options(
            joinedload(models.Invoice.customer),
            joinedload(models.Invoice.created_by_user),
            joinedload(models.Invoice.items).joinedload(models.InvoiceItem.service),
            joinedload(models.Invoice.payments),
        )
        .filter(models.Invoice.id == invoice_id)
        .first()
    )

    # Ghi nhật ký Audit Log
    log_action(
        db=db,
        user=current_user,
        action="CANCEL_INVOICE",
        entity="Invoice",
        entity_id=invoice.id,
        details={
            "previous_status": old_status,
            "reason": reason or "Không có lý do cụ thể"
        }
    )

    return updated_invoice