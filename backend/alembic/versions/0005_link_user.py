"""link user to student/guardian

Revision ID: 0005
Revises: 0004
Create Date: 2026-10-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "students",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True, index=True),
    )
    op.add_column(
        "guardians",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True, index=True),
    )
    op.create_index("ix_students_user", "students", ["user_id"], unique=True)
    op.create_index("ix_guardians_user", "guardians", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_guardians_user", table_name="guardians")
    op.drop_index("ix_students_user", table_name="students")
    op.drop_column("guardians", "user_id")
    op.drop_column("students", "user_id")