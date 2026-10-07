import json
from typing import Any, Dict, Optional, Union
from sqlalchemy.orm import Session
from app import models


def log_action(
    db: Session,
    user: Optional[models.User],
    action: str,
    entity: str,
    entity_id: Optional[int] = None,
    details: Union[str, Dict[str, Any], None] = None,
) -> models.AuditLog:
    """
    Ghi nhật ký hoạt động (Audit Log) cho các thao tác hệ thống (tạo/sửa/xóa hóa đơn, khách hàng, người dùng).

    Tham số:
    - db: SQLAlchemy Session.
    - user: Đối tượng người dùng thực hiện thao tác (truyền None nếu là hệ thống tự động).
    - action: Tên hành động (Ví dụ: "CREATE_INVOICE", "CANCEL_INVOICE", "UPDATE_CUSTOMER").
    - entity: Tên thực thể bị tác động (Ví dụ: "Invoice", "Customer", "User").
    - entity_id: ID bản ghi tương ứng trong CSDL.
    - details: Chi tiết thay đổi (Có thể là chuỗi text hoặc dictionary/dict, tự động chuyển đổi sang chuỗi JSON).
    """
    # Tự động mã hóa Dictionary / Object sang định dạng chuỗi JSON tiếng Việt
    formatted_details = details
    if isinstance(details, (dict, list)):
        try:
            formatted_details = json.dumps(details, ensure_ascii=False, default=str)
        except Exception:
            formatted_details = str(details)

    # Khởi tạo bản ghi AuditLog
    entry = models.AuditLog(
        user_id=user.id if user else None,
        action=action,
        entity=entity,
        entity_id=entity_id,
        details=formatted_details,
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry