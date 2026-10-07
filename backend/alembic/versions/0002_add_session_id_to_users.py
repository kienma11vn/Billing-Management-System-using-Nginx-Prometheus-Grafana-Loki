"""add session_id to users

Revision ID: 0002_add_session_id_to_users
Revises: 0001_initial_schema
Create Date: 2026-09-27 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0002_add_session_id_to_users'
down_revision: Union[str, None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Bổ sung cột session_id cho bảng users
    op.add_column(
        'users',
        sa.Column('session_id', sa.String(length=255), nullable=True)
    )


def downgrade() -> None:
    # Xóa cột session_id khỏi bảng users nếu rollback
    op.drop_column('users', 'session_id')