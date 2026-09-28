"""crm: leads, students, guardians, tasks

Revision ID: 0002
Revises: 0001
Create Date: 2026-01-15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ===== leads =====
    op.create_table(
        "leads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, index=True),
        sa.Column("branch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("branches.id"), nullable=True, index=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=True, index=True),
        sa.Column("phone", sa.String(32), nullable=True, index=True),
        sa.Column("source", sa.String(64), nullable=True),
        sa.Column("campaign", sa.String(128), nullable=True),
        sa.Column("interested_course_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("counselor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True, index=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="NEW", index=True),
        sa.Column("score", sa.Integer, nullable=False, server_default="0"),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("converted_student_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("converted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("lost_reason", sa.Text, nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "lead_activities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("activity_type", sa.String(32), nullable=False),
        sa.Column("content", sa.Text, nullable=True),
        sa.Column("old_status", sa.String(32), nullable=True),
        sa.Column("new_status", sa.String(32), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), index=True),
    )

    # ===== guardians =====
    op.create_table(
        "guardians",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, index=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(32), nullable=False, index=True),
        sa.Column("relationship", sa.String(32), nullable=True),
        sa.Column("address", sa.Text, nullable=True),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ===== students =====
    op.create_table(
        "students",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, index=True),
        sa.Column("branch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("branches.id"), nullable=True, index=True),
        sa.Column("student_code", sa.String(32), nullable=False, index=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(32), nullable=True),
        sa.Column("date_of_birth", sa.Date, nullable=True),
        sa.Column("gender", sa.String(16), nullable=True),
        sa.Column("address", sa.Text, nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="ACTIVE", index=True),
        sa.Column("source_lead_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("leads.id"), nullable=True),
        sa.Column("counselor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True, index=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("organization_id", "student_code", name="uq_student_org_code"),
    )

    op.create_table(
        "student_guardians",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("guardian_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("guardians.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("is_primary", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("student_id", "guardian_id", name="uq_student_guardian"),
    )

    # ===== tasks =====
    op.create_table(
        "tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, index=True),
        sa.Column("branch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("branches.id"), nullable=True),
        sa.Column("task_type", sa.String(64), nullable=False, index=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("assignee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("related_type", sa.String(64), nullable=True),
        sa.Column("related_id", postgresql.UUID(as_uuid=True), nullable=True, index=True),
        sa.Column("priority", sa.String(16), nullable=False, server_default="NORMAL"),
        sa.Column("status", sa.String(16), nullable=False, server_default="OPEN", index=True),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=True, index=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_reason", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # Index cho tenant isolation
    op.create_index("ix_leads_org_status", "leads", ["organization_id", "status"])
    op.create_index("ix_students_org_status", "students", ["organization_id", "status"])
    op.create_index("ix_tasks_org_assignee_status", "tasks", ["organization_id", "assignee_id", "status"])


def downgrade() -> None:
    op.drop_table("tasks")
    op.drop_table("student_guardians")
    op.drop_table("students")
    op.drop_table("guardians")
    op.drop_table("lead_activities")
    op.drop_table("leads")