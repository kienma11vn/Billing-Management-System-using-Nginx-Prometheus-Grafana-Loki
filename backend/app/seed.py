import sys
from decimal import Decimal
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app import models
from app.models import UserRole, InvoiceStatus
from app.security import get_password_hash


def seed_users(db: Session) -> dict:
    """Khởi tạo tài khoản Quản trị viên (Admin) và Nhân viên (Staff)"""
    print("--- 1. Seeding Users ---")
    users = {}

    # 1. Tạo tài khoản Admin mẫu
    admin = db.query(models.User).filter(models.User.email == "admin@example.com").first()
    if not admin:
        admin = models.User(
            email="admin@example.com",
            full_name="Quản trị viên Hệ thống",
            hashed_password=get_password_hash("Admin123!"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print("  [+] Đã tạo tài khoản Admin: admin@example.com / Admin123!")
    else:
        print("  [-] Tài khoản Admin đã tồn tại.")
    users["admin"] = admin

    # 2. Tạo tài khoản Staff mẫu
    staff = db.query(models.User).filter(models.User.email == "staff@example.com").first()
    if not staff:
        staff = models.User(
            email="staff@example.com",
            full_name="Nguyễn Văn Nhân Viên",
            hashed_password=get_password_hash("Staff123!"),
            role=UserRole.STAFF,
            is_active=True,
        )
        db.add(staff)
        db.commit()
        db.refresh(staff)
        print("  [+] Đã tạo tài khoản Staff: staff@example.com / Staff123!")
    else:
        print("  [-] Tài khoản Staff đã tồn tại.")
    users["staff"] = staff

    return users


def seed_services(db: Session) -> list:
    """Khởi tạo danh mục sản phẩm / dịch vụ mẫu"""
    print("--- 2. Seeding Services ---")
    initial_services = [
        {
            "code": "WEB-DEV",
            "name": "Thiết kế Website Doanh Nghiệp",
            "description": "Gói thiết kế website chuẩn SEO, responsive cho doanh nghiệp.",
            "unit_price": Decimal("15000000.00"),
        },
        {
            "code": "HOST-PRO",
            "name": "Dịch vụ Cloud Hosting High-Speed",
            "description": "Hosting tốc độ cao, dung lượng 20GB, băng thông không giới hạn.",
            "unit_price": Decimal("2400000.00"),
        },
        {
            "code": "MAINT-SYS",
            "name": "Bảo trì & Vận hành Hệ thống",
            "description": "Gói bảo trì phần mềm và hạ tầng máy chủ hàng tháng.",
            "unit_price": Decimal("5000000.00"),
        },
        {
            "code": "SEO-ADV",
            "name": "Tư vấn & Tối ưu SEO Tổng thể",
            "description": "Đẩy từ khóa lên top Google và tối ưu trải nghiệm người dùng.",
            "unit_price": Decimal("8000000.00"),
        },
    ]

    created_services = []
    for s_data in initial_services:
        service = db.query(models.Service).filter(models.Service.code == s_data["code"]).first()
        if not service:
            service = models.Service(**s_data)
            db.add(service)
            db.commit()
            db.refresh(service)
            print(f"  [+] Đã thêm dịch vụ: {service.name} ({service.code})")
        else:
            print(f"  [-] Dịch vụ {s_data['code']} đã tồn tại.")
        created_services.append(service)

    return created_services


def seed_customers(db: Session) -> list:
    """Khởi tạo danh sách khách hàng mẫu"""
    print("--- 3. Seeding Customers ---")
    initial_customers = [
        {
            "full_name": "Công ty TNHH Công Nghệ ABC",
            "phone": "0901234567",
            "email": "contact@abc-tech.vn",
            "tax_code": "0101234567",
            "address": "Tầng 5, Tòa nhà Innovation, Cầu Giấy, Hà Nội",
            "notes": "Khách hàng doanh nghiệp thân thiết",
        },
        {
            "full_name": "Trần Thị Bình",
            "phone": "0987654321",
            "email": "binh.tran@gmail.com",
            "tax_code": None,
            "address": "123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
            "notes": "Khách hàng cá nhân",
        },
    ]

    created_customers = []
    for c_data in initial_customers:
        customer = db.query(models.Customer).filter(models.Customer.phone == c_data["phone"]).first()
        if not customer:
            customer = models.Customer(**c_data)
            db.add(customer)
            db.commit()
            db.refresh(customer)
            print(f"  [+] Đã thêm khách hàng: {customer.full_name}")
        else:
            print(f"  [-] Khách hàng {c_data['phone']} đã tồn tại.")
        created_customers.append(customer)

    return created_customers


def seed_invoices(db: Session, users: dict, customers: list, services: list):
    """Khởi tạo hóa đơn mẫu cùng lịch sử thanh toán"""
    print("--- 4. Seeding Sample Invoices ---")
    
    if not customers or not services or not users.get("staff"):
        print("  [!] Không đủ dữ liệu phụ thuộc để tạo hóa đơn mẫu.")
        return

    customer = customers[0]
    staff_user = users["staff"]
    service_1 = services[0]
    service_2 = services[1]

    # Kiểm tra xem đã có hóa đơn nào của khách hàng này chưa
    existing_invoice = db.query(models.Invoice).filter(models.Invoice.customer_id == customer.id).first()
    if existing_invoice:
        print("  [-] Hóa đơn mẫu đã tồn tại.")
        return

    # Tính toán tổng tiền
    qty_1, price_1 = 1, service_1.unit_price
    qty_2, price_2 = 2, service_2.unit_price
    
    total_amount = (price_1 * qty_1) + (price_2 * qty_2)
    discount_amount = Decimal("1000000.00")
    final_amount = total_amount - discount_amount
    paid_amount = Decimal("5000000.00")

    invoice = models.Invoice(
        customer_id=customer.id,
        created_by_id=staff_user.id,
        total_amount=total_amount,
        discount_amount=discount_amount,
        final_amount=final_amount,
        paid_amount=paid_amount,
        status=InvoiceStatus.PARTIAL,
        note="Hóa đơn thanh toán đợt 1 dịch vụ làm Website và Hosting",
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    # Thêm Chi tiết dịch vụ vào Hóa đơn (Invoice Items)
    item_1 = models.InvoiceItem(
        invoice_id=invoice.id,
        service_id=service_1.id,
        quantity=qty_1,
        unit_price=price_1,
    )
    item_2 = models.InvoiceItem(
        invoice_id=invoice.id,
        service_id=service_2.id,
        quantity=qty_2,
        unit_price=price_2,
    )
    db.add_all([item_1, item_2])

    # Thêm Lịch sử thanh toán (Invoice Payment)
    payment = models.InvoicePayment(
        invoice_id=invoice.id,
        amount=paid_amount,
        payment_method="Chuyển khoản",
        note="Thanh toán cọc 50% qua ngân hàng Vietcombank",
    )
    db.add(payment)

    # Thêm Nhật ký Audit Log cho thao tác tạo hóa đơn mẫu
    audit_entry = models.AuditLog(
        user_id=staff_user.id,
        action="CREATE_INVOICE",
        entity="Invoice",
        entity_id=invoice.id,
        details=f"Khởi tạo hóa đơn #{invoice.id} cho khách hàng {customer.full_name}",
    )
    db.add(audit_entry)

    db.commit()
    print(f"  [+] Đã tạo thành công hóa đơn mẫu ID #{invoice.id} với trạng thái PARTIAL")


def run_seed():
    """Hàm chạy chính để Seeding dữ liệu"""
    db = SessionLocal()
    try:
        print("======== BẮT ĐẦU KHỞI TẠO DỮ LIỆU MẪU (SEED DATA) ========")
        users = seed_users(db)
        services = seed_services(db)
        customers = seed_customers(db)
        seed_invoices(db, users, customers, services)
        print("======== KHỞI TẠO DỮ LIỆU THÀNH CÔNG! ========")
    except Exception as e:
        db.rollback()
        print(f"\n[X] Lỗi khi nạp dữ liệu seed: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()