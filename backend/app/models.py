from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Numeric,
    Enum,
)
from sqlalchemy.orm import relationship
from app.database import Base


# --- ENUMS ---

class UserRole(str, PyEnum):
    ADMIN = "admin"  # Quản trị viên: Xem Audit Log, quản lý tài khoản
    STAFF = "staff"  # Nhân viên: Tạo & quản lý Khách hàng, Hóa đơn, Thu tiền


class InvoiceStatus(str, PyEnum):
    UNPAID = "unpaid"        # Chưa thanh toán
    PARTIAL = "partial"      # Thanh toán một phần
    PAID = "paid"            # Đã thanh toán
    CANCELLED = "cancelled"  # Đã hủy


# --- MODELS ---

class User(Base):
    """Bảng người dùng hệ thống (Chỉ gồm Staff và Admin)"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(
        Enum(UserRole, values_callable=lambda x: [e.value for e in x]),
        nullable=False, 
        default=UserRole.STAFF
    )
    is_active = Column(Boolean, default=True)
    session_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    audit_logs = relationship("AuditLog", back_populates="user")
    created_invoices = relationship("Invoice", back_populates="created_by_user")


class AuditLog(Base):
    """Bảng Nhật ký hệ thống - Dành cho Admin kiểm tra, giám sát hoạt động"""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)   # Ví dụ: "CREATE_INVOICE", "CANCEL_INVOICE", "DELETE_CUSTOMER"
    entity = Column(String(100), nullable=False)   # Ví dụ: "Invoice", "Customer"
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)          # Chi tiết thông tin thay đổi (JSON/Text)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="audit_logs")


class Customer(Base):
    """Bảng thông tin Khách hàng - do Staff quản lý"""
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(255), nullable=True)
    tax_code = Column(String(50), nullable=True)  # Mã số thuế (nếu là doanh nghiệp)
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    invoices = relationship("Invoice", back_populates="customer")


class Service(Base):
    """Danh mục Sản phẩm / Dịch vụ để lập Hóa đơn"""
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    unit_price = Column(Numeric(12, 2), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    invoice_items = relationship("InvoiceItem", back_populates="service")


class Invoice(Base):
    """Bảng Hóa đơn - do Staff tạo và quản lý"""
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Staff tạo hóa đơn này
    
    total_amount = Column(Numeric(12, 2), nullable=False)      # Tổng tiền hàng
    discount_amount = Column(Numeric(12, 2), default=0)        # Số tiền giảm giá
    final_amount = Column(Numeric(12, 2), nullable=False)     # Tổng tiền sau giảm (Phải trả)
    paid_amount = Column(Numeric(12, 2), default=0)          # Số tiền khách đã thanh toán
    
    status = Column(
        Enum(InvoiceStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=InvoiceStatus.UNPAID,
    )
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    customer = relationship("Customer", back_populates="invoices")
    created_by_user = relationship("User", back_populates="created_invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship(
        "InvoicePayment",
        back_populates="invoice",
        cascade="all, delete-orphan",
        order_by="InvoicePayment.created_at.asc()",
    )


class InvoiceItem(Base):
    """Chi tiết danh mục dịch vụ/mặt hàng trong từng hóa đơn"""
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False)

    invoice = relationship("Invoice", back_populates="items")
    service = relationship("Service", back_populates="invoice_items")


class InvoicePayment(Base):
    """Lịch sử các lần thanh toán tiền của hóa đơn"""
    __tablename__ = "invoice_payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(String(50), nullable=True, default="Tiền mặt")  # Tiền mặt, Chuyển khoản, Thẻ...
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    invoice = relationship("Invoice", back_populates="payments")