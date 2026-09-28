"""academic: courses, classes, enrollments, attendance, examinations

Revision ID: 0003
Revises: 0002
Create Date: 2026-02-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ===== courses =====
    op.create_table(
        "courses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, index=True),
        sa.Column("code", sa.String(32), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("language", sa.String(32), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("organization_id", "code", name="uq_course_org_code"),
    )

    op.create_table(
        "course_levels",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("code", sa.String(32), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("sequence", sa.Integer, nullable=False, server_default="0"),
        sa.Column("duration_hours", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("course_id", "code", name="uq_level_course_code"),
    )

    # ===== classes =====
    op.create_table(
        "classes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, index=True),
        sa.Column("branch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("branches.id"), nullable=True, index=True),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id"), nullable=False, index=True),
        sa.Column("level_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("course_levels.id"), nullable=True),
        sa.Column("code", sa.String(64), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("room", sa.String(64), nullable=True),
        sa.Column("capacity", sa.Integer, nullable=False, server_default="20"),
        sa.Column("start_date", sa.Date, nullable=True),
        sa.Column("end_date", sa.Date, nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="PLANNED", index=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("organization_id", "code", name="uq_class_org_code"),
    )

    op.create_table(
        "class_schedules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("class_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("day_of_week", sa.Integer, nullable=False),  # 0=Mon..6=Sun
        sa.Column("start_time", sa.Time, nullable=False),
        sa.Column("end_time", sa.Time, nullable=False),
        sa.Column("room", sa.String(64), nullable=True),
        sa.Column("status", sa.String(16), nullable=False, server_default="ACTIVE"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "class_teachers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("class_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("teacher_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("role", sa.String(16), nullable=False, server_default="MAIN"),  # MAIN, ASSISTANT, SUBSTITUTE
        sa.Column("from_date", sa.Date, nullable=False),
        sa.Column("to_date", sa.Date, nullable=True),
        sa.Column("status", sa.String(16), nullable=False, server_default="ACTIVE"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ===== enrollments =====
    op.create_table(
        "enrollments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, index=True),
        sa.Column("branch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("branches.id"), nullable=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=False, index=True),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id"), nullable=False, index=True),
        sa.Column("level_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("course_levels.id"), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="ACTIVE", index=True),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("end_date", sa.Date, nullable=True),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "enrollment_classes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("enrollment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("enrollments.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("class_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("classes.id"), nullable=False, index=True),
        sa.Column("joined_at", sa.Date, nullable=False),
        sa.Column("left_at", sa.Date, nullable=True),
        sa.Column("left_reason", sa.String(64), nullable=True),
        sa.Column("status", sa.String(16), nullable=False, server_default="ACTIVE"),  # ACTIVE, TRANSFERRED, COMPLETED, DROPPED
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ===== attendance =====
    op.create_table(
        "attendance",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, index=True),
        sa.Column("branch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("branches.id"), nullable=True),
        sa.Column("class_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("classes.id"), nullable=False, index=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=False, index=True),
        sa.Column("session_date", sa.Date, nullable=False, index=True),
        sa.Column("status", sa.String(16), nullable=False),  # PRESENT, ABSENT, LATE, EXCUSED
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("recorded_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("class_id", "student_id", "session_date", name="uq_attendance_session"),
    )

    op.create_table(
        "attendance_corrections",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("attendance_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("attendance.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("old_status", sa.String(16), nullable=False),
        sa.Column("new_status", sa.String(16), nullable=False),
        sa.Column("reason", sa.Text, nullable=True),
        sa.Column("corrected_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ===== examinations =====
    op.create_table(
        "exams",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, index=True),
        sa.Column("class_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("classes.id"), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("exam_type", sa.String(32), nullable=False),  # QUIZ, MIDTERM, FINAL, PLACEMENT
        sa.Column("max_score", sa.Numeric(6, 2), nullable=False, server_default="100"),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(16), nullable=False, server_default="DRAFT", index=True),  # DRAFT, PUBLISHED, ARCHIVED
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "exam_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("exam_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=False, index=True),
        sa.Column("score", sa.Numeric(6, 2), nullable=False),
        sa.Column("grade", sa.String(8), nullable=True),
        sa.Column("feedback", sa.Text, nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("exam_id", "student_id", name="uq_exam_result"),
    )

    # Indexes
    op.create_index("ix_classes_org_status", "classes", ["organization_id", "status"])
    op.create_index("ix_enrollments_student_status", "enrollments", ["student_id", "status"])
    op.create_index("ix_attendance_student_date", "attendance", ["student_id", "session_date"])


def downgrade() -> None:
    for t in [
        "exam_results", "exams",
        "attendance_corrections", "attendance",
        "enrollment_classes", "enrollments",
        "class_teachers", "class_schedules", "classes",
        "course_levels", "courses",
    ]:
        op.drop_table(t)