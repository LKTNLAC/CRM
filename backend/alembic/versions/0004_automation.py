"""automation: notifications, communications, workflows

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # notifications
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, index=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("notification_type", sa.String(64), nullable=False, index=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.Text, nullable=True),
        sa.Column("related_type", sa.String(64), nullable=True),
        sa.Column("related_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("is_read", sa.Boolean, nullable=False, server_default=sa.false(), index=True),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), index=True),
    )

    op.create_table(
        "notification_preferences",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("notification_type", sa.String(64), nullable=False),
        sa.Column("channel", sa.String(16), nullable=False),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "notification_type", "channel", name="uq_notif_pref"),
    )

    # communications
    op.create_table(
        "communications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, index=True),
        sa.Column("channel", sa.String(16), nullable=False, index=True),
        sa.Column("recipient", sa.String(255), nullable=False, index=True),
        sa.Column("subject", sa.String(255), nullable=True),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default="PENDING", index=True),
        sa.Column("provider", sa.String(32), nullable=True),
        sa.Column("provider_message_id", sa.String(255), nullable=True),
        sa.Column("error", sa.Text, nullable=True),
        sa.Column("meta", postgresql.JSONB, nullable=True),
        sa.Column("related_type", sa.String(64), nullable=True),
        sa.Column("related_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), index=True),
    )

    # workflows
    op.create_table(
        "workflows",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False, index=True),
        sa.Column("code", sa.String(64), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("trigger_event", sa.String(64), nullable=False, index=True),
        sa.Column("is_enabled", sa.Boolean, nullable=False, server_default=sa.true(), index=True),
        sa.Column("config", postgresql.JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("organization_id", "code", name="uq_workflow_org_code"),
    )

    op.create_table(
        "workflow_executions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workflow_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workflows.id"), nullable=False, index=True),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=True, index=True),
        sa.Column("event_type", sa.String(64), nullable=False, index=True),
        sa.Column("payload", postgresql.JSONB, nullable=True),
        sa.Column("status", sa.String(16), nullable=False, server_default="PENDING", index=True),
        sa.Column("attempt_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("error", sa.Text, nullable=True),
        sa.Column("actions_log", postgresql.JSONB, nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    for t in ["workflow_executions", "workflows", "communications", "notification_preferences", "notifications"]:
        op.drop_table(t)