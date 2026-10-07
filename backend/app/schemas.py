from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import UserRole, InvoiceStatus


# ==========================================
# 1. AUTHENTICATION SCHEMAS
# ==========================================

class Token(BaseModel):
    """Schema kết quả trả về khi đăng nhập thành công"""
    access_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    """Schema yêu cầu đổi mật khẩu cá nhân"""
    current_password: str
    new_password: str = Field(..., min_length=6, description="Mật khẩu mới tối thiểu 6 ký tự")


class AdminResetPasswordRequest(BaseModel):
    """Schema Admin chủ động đặt lại mật khẩu cho nhân viên"""
    new_password: str = Field(..., min_length=6, description="Mật khẩu mới tối thiểu 6 ký tự")

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6, description="Mật khẩu mới tối thiểu 6 ký tự")
    
    
# ==========================================
# 2. USER SCHEMAS
# ==========================================

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.STAFF
    is_active: bool = True


class UserCreate(UserBase):
    """Schema tạo tài khoản mới"""
    password: str = Field(..., min_length=6, description="Mật khẩu khởi tạo tối thiểu 6 ký tự")


class UserUpdate(BaseModel):
    """Schema cập nhật thông tin người dùng"""
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserOut(UserBase):
    """Schema dữ liệu người dùng trả về cho Client"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# ==========================================
# 3. CUSTOMER SCHEMAS
# ==========================================

class CustomerBase(BaseModel):
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    tax_code: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class CustomerCreate(CustomerBase):
    """Schema tạo hồ sơ khách hàng mới"""
    pass


class CustomerUpdate(BaseModel):
    """Schema cập nhật thông tin khách hàng"""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    tax_code: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class CustomerOut(CustomerBase):
    """Schema trả về thông tin khách hàng"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# ==========================================
# 4. SERVICE SCHEMAS
# ==========================================

class ServiceBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    unit_price: Decimal = Field(..., ge=0, description="Đơn giá sản phẩm/dịch vụ")
    is_active: bool = True


class ServiceCreate(ServiceBase):
    """Schema tạo dịch vụ mới"""
    pass


class ServiceUpdate(BaseModel):
    """Schema cập nhật dịch vụ"""
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    unit_price: Optional[Decimal] = Field(None, ge=0)
    is_active: Optional[bool] = None


class ServiceOut(ServiceBase):
    """Schema trả về thông tin dịch vụ"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


# ==========================================
# 5. INVOICE & PAYMENT SCHEMAS
# ==========================================

class InvoiceItemBase(BaseModel):
    service_id: int
    quantity: int = Field(1, ge=1, description="Số lượng")
    unit_price: Optional[Decimal] = Field(None, ge=0, description="Đơn giá áp dụng (Nếu để trống sẽ lấy giá mặc định của dịch vụ)")


class InvoiceItemCreate(InvoiceItemBase):
    """Schema tạo chi tiết dịch vụ trong hóa đơn"""
    pass


class InvoiceItemOut(BaseModel):
    """Schema thông tin chi tiết từng dịch vụ trong hóa đơn"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_id: int
    service_id: int
    quantity: int
    unit_price: Decimal
    service: Optional[ServiceOut] = None


class PaymentCreate(BaseModel):
    """Schema cho lượt thu tiền thanh toán"""
    amount: Decimal = Field(..., gt=0, description="Số tiền thanh toán phải lớn hơn 0")
    payment_method: Optional[str] = Field("Tiền mặt", description="Phương thức: Tiền mặt, Chuyển khoản, Thẻ...")
    note: Optional[str] = None


InvoicePaymentCreate = PaymentCreate  # Alias hỗ trợ linh hoạt


class InvoicePaymentOut(BaseModel):
    """Schema thông tin lịch sử thanh toán"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_id: int
    amount: Decimal
    payment_method: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime


class InvoiceCreate(BaseModel):
    """Schema lập hóa đơn mới"""
    customer_id: int
    items: List[InvoiceItemCreate] = Field(..., min_length=1, description="Danh sách dịch vụ/sản phẩm")
    discount_amount: Optional[Decimal] = Field(Decimal("0.00"), ge=0, description="Số tiền giảm giá")
    note: Optional[str] = None


class InvoiceOut(BaseModel):
    """Schema danh sách hóa đơn (Rút gọn)"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    created_by_id: int
    total_amount: Decimal
    discount_amount: Decimal
    final_amount: Decimal
    paid_amount: Decimal
    status: InvoiceStatus
    note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    customer: Optional[CustomerOut] = None
    created_by_user: Optional[UserOut] = None


class InvoiceDetailOut(InvoiceOut):
    """Schema chi tiết hóa đơn (Bao gồm danh sách sản phẩm và lịch sử thu tiền)"""
    items: List[InvoiceItemOut] = []
    payments: List[InvoicePaymentOut] = []


# ==========================================
# 6. AUDIT LOG SCHEMAS
# ==========================================

class AuditLogOut(BaseModel):
    """Schema trả về Nhật ký hoạt động hệ thống"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int] = None
    action: str
    entity: str
    entity_id: Optional[int] = None
    details: Optional[str] = None
    created_at: datetime

    user: Optional[UserOut] = None