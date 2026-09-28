from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.core.tenant import TenantContext
from app.events.envelope import EventEnvelope
from app.events.outbox import OutboxEvent
from app.modules.students.domain.events import STUDENT_ARCHIVED, STUDENT_CREATED, STUDENT_UPDATED
from app.modules.students.infrastructure.models import StudentModel
from sqlalchemy import func, select
from app.core.errors import ConflictError, NotFoundError
from sqlalchemy.exc import IntegrityError

class StudentService:
    def __init__(self, session: AsyncSession, tenant: TenantContext):
        self.session = session
        self.tenant = tenant

    def _base(self):
        return select(StudentModel).where(
            StudentModel.organization_id == self.tenant.organization_id,
            StudentModel.deleted_at.is_(None),
        )

    async def list(self, status=None, counselor_id=None, search=None, limit=50, offset=0):
        from app.core.scope import is_counselor_only, is_teacher_only, get_teacher_class_ids

        if is_counselor_only(self.tenant.roles):
            counselor_id = self.tenant.user_id

        stmt = self._base()
        if status:
            stmt = stmt.where(StudentModel.status == status)
        if counselor_id:
            stmt = stmt.where(StudentModel.counselor_id == counselor_id)
        if search:
            stmt = stmt.where(
                (StudentModel.full_name.ilike(f"%{search}%")) | (StudentModel.student_code.ilike(f"%{search}%"))
            )

        if is_teacher_only(self.tenant.roles):
            class_ids = await get_teacher_class_ids(self.session, self.tenant.user_id)
            if class_ids:
                from app.modules.enrollments.infrastructure.models import EnrollmentModel, EnrollmentClassModel
                sub = select(EnrollmentModel.student_id).join(
                    EnrollmentClassModel, EnrollmentClassModel.enrollment_id == EnrollmentModel.id
                ).where(EnrollmentClassModel.class_id.in_(class_ids))
                stmt = stmt.where(StudentModel.id.in_(sub))
            else:
                stmt = stmt.where(False)

        stmt = stmt.order_by(StudentModel.created_at.desc()).limit(limit).offset(offset)
        return (await self.session.execute(stmt)).scalars().all()

    async def get(self, student_id: UUID) -> StudentModel:
        stmt = self._base().where(StudentModel.id == student_id)
        s = (await self.session.execute(stmt)).scalar_one_or_none()
        if not s:
            raise NotFoundError("Student not found")
        return s

    async def create(self, data: dict) -> StudentModel:
        student_code = data.pop("student_code", None)
        if not student_code:
            count = (await self.session.execute(
                select(func.count()).select_from(StudentModel).where(StudentModel.organization_id == self.tenant.organization_id)
            )).scalar_one()
            student_code = f"ST{count + 1:06d}"

        # Check unique
        existing = (await self.session.execute(
            select(StudentModel).where(
                StudentModel.organization_id == self.tenant.organization_id,
                StudentModel.student_code == student_code,
            )
        )).scalar_one_or_none()
        if existing:
            raise ConflictError(f"Student code {student_code} already exists")

        student = StudentModel(
            organization_id=self.tenant.organization_id,
            branch_id=self.tenant.branch_id,
            student_code=student_code,
            created_by=self.tenant.user_id,
            **data,
        )
        self.session.add(student)
        await self.session.flush()
        await self._emit(STUDENT_CREATED, student)
        await self.session.commit()
        return student

    async def update(self, student_id: UUID, data: dict) -> StudentModel:
        student = await self.get(student_id)
        for k, v in data.items():
            if v is not None:
                setattr(student, k, v)
        await self._emit(STUDENT_UPDATED, student)
        await self.session.commit()
        return student

    async def archive(self, student_id: UUID) -> StudentModel:
        student = await self.get(student_id)
        student.status = "ARCHIVED"
        student.deleted_at = datetime.now(UTC)
        await self._emit(STUDENT_ARCHIVED, student)
        await self.session.commit()
        return student

    async def _emit(self, event_type: str, student: StudentModel) -> None:
        env = EventEnvelope.create(
            event_type=event_type,
            aggregate_type="Student",
            aggregate_id=student.id,
            payload={
                "student_id": str(student.id),
                "student_code": student.student_code,
                "status": student.status,
                "counselor_id": str(student.counselor_id) if student.counselor_id else None,
                "organization_id": str(student.organization_id), 
            },
            source="students-module",
        )
        self.session.add(OutboxEvent(
            event_id=env.event_id,
            event_type=env.event_type,
            aggregate_type=env.aggregate_type,
            aggregate_id=env.aggregate_id,
            payload=env.payload,
        ))
        
    async def ensure_exists(self, student_id: UUID) -> None:
        """Public API cho module khác: raise NotFoundError nếu student không tồn tại."""
        await self.get(student_id)

    async def create_from_lead(
        self,
        *,
        organization_id: UUID,
        branch_id: UUID | None,
        student_code: str,
        full_name: str,
        email: str | None,
        phone: str | None,
        date_of_birth=None,
        gender: str | None,
        address: str | None,
        source_lead_id: UUID,
        counselor_id: UUID | None,
        created_by: UUID | None,
    ):
        """Tạo student từ lead. Public API cho module leads."""
        from app.modules.students.infrastructure.models import StudentModel
        existing = (await self.session.execute(
            select(StudentModel).where(
                StudentModel.organization_id == organization_id,
                StudentModel.student_code == student_code,
            )
        )).scalar_one_or_none()
        if existing:
            raise ConflictError(f"Student code {student_code} already exists")

        student = StudentModel(
            organization_id=organization_id,
            branch_id=branch_id,
            student_code=student_code,
            full_name=full_name,
            email=email,
            phone=phone,
            date_of_birth=date_of_birth,
            gender=gender,
            address=address,
            status="ACTIVE",
            source_lead_id=source_lead_id,
            counselor_id=counselor_id,
            created_by=created_by,
        )
        try:
            await self.session.flush()
        except IntegrityError:
            await self.session.rollback()
            raise ConflictError(f"Student code {student_code} already exists")
        return student

    async def generate_student_code(self, organization_id: UUID) -> str:
        """Sinh mã học viên duy nhất. Retry nếu trùng."""
        from app.modules.students.infrastructure.models import StudentModel
        stmt = (
            select(StudentModel.student_code)
            .where(StudentModel.organization_id == organization_id)
            .where(StudentModel.student_code.like("ST%"))
            .order_by(StudentModel.student_code.desc())
            .limit(1)
        )
        last = (await self.session.execute(stmt)).scalar_one_or_none()
        if last and last.startswith("ST"):
            try:
                next_num = int(last[2:]) + 1
            except ValueError:
                next_num = 1
        else:
            next_num = 1

        # Đảm bảo không trùng
        while True:
            code = f"ST{next_num:06d}"
            exists = (await self.session.execute(
                select(StudentModel.id).where(
                    StudentModel.organization_id == organization_id,
                    StudentModel.student_code == code,
                )
            )).scalar_one_or_none()
            if not exists:
                return code
            next_num += 1
    
    async def link_user(self, student_id: UUID, user_id: UUID) -> StudentModel:
        """Gán user cho student. Kiểm tra user tồn tại, thuộc org, chưa gán cho student khác."""
        from app.modules.auth.infrastructure.models import User
        student = await self.get(student_id)

        user = (await self.session.execute(
            select(User).where(
                User.id == user_id,
                User.organization_id == self.tenant.organization_id,
                User.deleted_at.is_(None),
            )
        )).scalar_one_or_none()
        if not user:
            raise NotFoundError("User not found")

        # Kiểm tra user đã gán cho student khác chưa
        existing = (await self.session.execute(
            select(StudentModel).where(
                StudentModel.user_id == user_id,
                StudentModel.id != student_id,
                StudentModel.deleted_at.is_(None),
            )
        )).scalar_one_or_none()
        if existing:
            raise ConflictError("User already linked to another student")

        # Kiểm tra student đã có user chưa
        if student.user_id and student.user_id != user_id:
            raise ConflictError("Student already has a linked user")

        student.user_id = user_id
        await self.session.commit()
        return student

    async def unlink_user(self, student_id: UUID) -> StudentModel:
        student = await self.get(student_id)
        student.user_id = None
        await self.session.commit()
        return student