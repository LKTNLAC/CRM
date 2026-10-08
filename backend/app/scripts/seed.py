"""Seed SUPER_ADMIN + permissions + roles.

Chạy: python -m app.scripts.seed
"""
import asyncio
from datetime import UTC, datetime

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.modules.auth.infrastructure.models import (
    Organization,
    Permission,
    Role,
    User,
)
from sqlalchemy.orm import selectinload

PERMISSIONS = [
    "auth.login", "auth.logout",
    "user.read", "user.create", "user.update", "user.delete",
    "role.read", "role.manage",
    "org.read", "org.manage", "branch.manage",
    "lead.read", "lead.create", "lead.update", "lead.delete", "lead.convert",
    "student.read", "student.create", "student.update", "student.delete", "student.archive",
    "guardian.read", "guardian.create", "guardian.update",
    "course.read", "course.create", "course.update", "course.delete",
    "class.read", "class.create", "class.update", "class.delete", "class.assign_teacher",
    "schedule.read", "schedule.manage",
    "enrollment.read", "enrollment.create", "enrollment.update", "enrollment.cancel",
    "attendance.read", "attendance.create", "attendance.update", "attendance.delete",
    "exam.read", "exam.create", "exam.update",
    "exam_result.read", "exam_result.update",
    "invoice.read", "invoice.create", "invoice.update", "invoice.cancel",
    "payment.read", "payment.create", "payment.verify", "payment.refund",
    "communication.read", "communication.send",
    "notification.read", "notification.manage",
    "task.read", "task.create", "task.update", "task.assign",
    "workflow.read", "workflow.manage",
    "report.dashboard", "report.sales", "report.academic", "report.financial",
    "audit.read", "audit.export",
    "setting.read", "setting.manage",
    "integration.read", "integration.manage",
    
]

ROLES = {
    "SUPER_ADMIN": PERMISSIONS,  # tất cả
    "SCHOOL_ADMIN": [p for p in PERMISSIONS if p not in {"role.manage"}],
    "ACADEMIC_MANAGER": [
        "auth.login", "auth.logout", "user.read",
        "student.read", "student.create", "student.update", "student.archive",
        "course.read", "course.create", "course.update",
        "class.read", "class.create", "class.update", "class.assign_teacher",
        "schedule.read", "schedule.manage",
        "enrollment.read", "enrollment.create", "enrollment.update", "enrollment.cancel",
        "attendance.read", "attendance.create", "attendance.update",
        "exam.read", "exam.create", "exam.update", "exam_result.read", "exam_result.update",
        "task.read", "task.create", "task.update",
        "communication.read", "communication.send",
        "report.dashboard", "report.academic",
    ],
    "COUNSELOR": [
        "auth.login", "auth.logout", "user.read",
        "lead.read", "lead.create", "lead.update", "lead.convert",
        "student.read", "student.create", "student.update",
        "guardian.read", "guardian.create", "guardian.update",
        "enrollment.read", "enrollment.create", "enrollment.update",
        "task.read", "task.create", "task.update",
        "communication.read", "communication.send",
        "report.dashboard", "report.sales",
    ],
    "TEACHER": [
        "auth.login", "auth.logout", "user.read",
        "student.read",
        "class.read", "schedule.read",
        "enrollment.read", 
        "attendance.read", "attendance.create", "attendance.update",
        "exam.read", "exam.create", "exam_result.read", "exam_result.update",
        "task.read", "task.create", "task.update",
        "communication.send",
        "setting.read",
        "report.dashboard", "report.academic",
    ],
    "ACCOUNTANT": [
        "auth.login", "auth.logout", "user.read",
        "student.read", "invoice.read", "invoice.create", "invoice.update", "invoice.cancel",
        "payment.read", "payment.create", "payment.verify", "payment.refund",
        "task.read", "task.create", "task.update",
        "report.dashboard", "report.financial",
    ],
    "STUDENT_SERVICE": [
        "auth.login", "auth.logout", "user.read",
        "student.read", "student.create", "student.update", "student.archive",
        "guardian.read", "guardian.create", "guardian.update",
        "enrollment.read", "enrollment.create", "enrollment.update",
        "task.read", "task.create", "task.update", "task.assign",
        "communication.read", "communication.send",
        "report.dashboard",
    ],
    "STUDENT": ["auth.login", "auth.logout", "user.read", "notification.read"],
    "PARENT": ["auth.login", "auth.logout", "user.read", "notification.read"],
    
}


async def seed() -> None:
    async with SessionLocal() as session:
        org = (await session.execute(select(Organization).limit(1))).scalar_one_or_none()
        if not org:
            org = Organization(name="Demo School", timezone="Asia/Ho_Chi_Minh")
            session.add(org)
            await session.flush()

        perm_map = {}
        for code in PERMISSIONS:
            existing = (await session.execute(select(Permission).where(Permission.code == code))).scalar_one_or_none()
            if not existing:
                existing = Permission(code=code, description=code)
                session.add(existing)
                await session.flush()
            perm_map[code] = existing

        

        for code, perms in ROLES.items():
            stmt = (
                select(Role)
                .options(selectinload(Role.permissions))
                .where(Role.code == code)
            )
            role = (await session.execute(stmt)).scalar_one_or_none()
            if not role:
                role = Role(code=code, name=code, organization_id=None)
                session.add(role)
                await session.flush()
                # Load lại để có permissions collection đã init
                stmt = (
                    select(Role)
                    .options(selectinload(Role.permissions))
                    .where(Role.id == role.id)
                )
                role = (await session.execute(stmt)).scalar_one()

            existing_perm_ids = {p.id for p in role.permissions}
            for p in perms:
                if perm_map[p].id not in existing_perm_ids:
                    role.permissions.append(perm_map[p])

        # 9 user mẫu cho 9 role
        USERS = [
            ("admin@example.com", "Super Admin", ["SUPER_ADMIN"]),
            ("schooladmin@example.com", "School Admin", ["SCHOOL_ADMIN"]),
            ("academic@example.com", "Academic Manager", ["ACADEMIC_MANAGER"]),
            ("counselor@example.com", "Counselor Demo", ["COUNSELOR"]),
            ("teacher@example.com", "Teacher Demo", ["TEACHER"]),
            ("accountant@example.com", "Accountant Demo", ["ACCOUNTANT"]),
            ("service@example.com", "Student Service Demo", ["STUDENT_SERVICE"]),
            ("student@example.com", "Student Demo", ["STUDENT"]),
            ("parent@example.com", "Parent Demo", ["PARENT"]),
        ]

        for email, full_name, role_codes in USERS:
            existing = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
            if existing:
                continue
            user = User(
                organization_id=org.id,
                email=email,
                password_hash=hash_password("ChangeMe123!"),
                full_name=full_name,
                is_active=True,
            )
            for code in role_codes:
                role = (await session.execute(select(Role).where(Role.code == code))).scalar_one_or_none()
                if role:
                    user.roles.append(role)
            session.add(user)
        
        # Ensure predefined workflows
        from app.modules.workflows.application.registry import ensure_predefined_workflows
        await ensure_predefined_workflows(session, org.id)
        await session.commit()
        print("Seed done.")


if __name__ == "__main__":
    asyncio.run(seed())