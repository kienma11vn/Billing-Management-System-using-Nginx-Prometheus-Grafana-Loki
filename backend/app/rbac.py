from typing import List
from fastapi import Depends, HTTPException, status
from app.models import User, UserRole
from app.dependencies import get_current_user


class RoleChecker:
    """
    Dependency class kiểm tra phân quyền dựa trên vai trò người dùng (Role-Based Access Control - RBAC)[cite: 33].
    Được tích hợp trực tiếp vào các Router trong backend/app/routers/.
    """

    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        # 1. Kiểm tra trạng thái tài khoản có bị khóa/vô hiệu hóa không[cite: 33]
        if not current_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.",
            )

        # 2. Kiểm tra vai trò của User có nằm trong danh sách được phép truy cập không[cite: 33]
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền truy cập hoặc thực hiện thao tác này.",
            )

        return current_user


# --- CÁC ĐỐI TƯỢNG PHÂN QUYỀN CHUẨN CHO ROUTERS (PRE-DEFINED DEPENDENCIES) ---

# 1. TẤT CẢ TÀI KHOẢN ĐÃ ĐĂNG NHẬP (STAFF & ADMIN)
# Sử dụng cho:
# - routers/auth.py (Đăng xuất /logout, Lấy thông tin /me)
# - routers/services.py (Tra cứu & xem danh mục dịch vụ)
require_authenticated = RoleChecker([UserRole.STAFF, UserRole.ADMIN])

# 2. QUYỀN DÀNH RIÊNG CHO ADMIN
# Sử dụng cho:
# - routers/users.py (Tạo mới, đổi mật khóa, vô hiệu hóa tài khoản Staff)
# - routers/audit_logs.py (Xem & lọc Nhật ký hoạt động hệ thống)
# - routers/services.py (Thêm mới, sửa thông tin & đổi đơn giá dịch vụ)
require_admin = RoleChecker([UserRole.ADMIN])

# 3. QUYỀN NGHIỆP VỤ (STAFF & ADMIN)
# Cho phép Staff thực hiện nghiệp vụ quầy, Admin có thể thao tác thay nếu cần.
# Sử dụng cho:
# - routers/customers.py (Tạo mới, sửa hồ sơ & tìm kiếm khách hàng)
# - routers/invoices.py (Tạo hóa đơn, Thu tiền thanh toán, Hủy hóa đơn)
require_staff = RoleChecker([UserRole.STAFF, UserRole.ADMIN])

# 4. QUYỀN BẮT BUỘC CHỈ DÀNH CHO STAFF
# Sử dụng khi cần chặn tuyệt đối Admin thao tác vào quy trình bán hàng/thu tiền trực tiếp của Staff.
require_staff_only = RoleChecker([UserRole.STAFF])