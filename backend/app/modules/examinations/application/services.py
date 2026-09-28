from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.core.tenant import TenantContext
from app.events.envelope import EventEnvelope
from app.events.outbox import OutboxEvent
from app.modules.examinations.domain.events import (
    EXAM_COMPLETED,
    EXAM_CREATED,
    EXAM_RESULT_PUBLISHED,
)
from app.modules.examinations.infrastructure.models import ExamModel, ExamResultModel


class ExamService:
    def __init__(self, session: AsyncSession, tenant: TenantContext):
        self.session = session
        self.tenant = tenant

    async def list(self, class_id: UUID | None = None, status: str | None = None, limit: int = 100, offset: int = 0):
        stmt = select(ExamModel).where(ExamModel.organization_id == self.tenant.organization_id)
        if class_id:
            stmt = stmt.where(ExamModel.class_id == class_id)
        if status:
            stmt = stmt.where(ExamModel.status == status)
        stmt = stmt.order_by(ExamModel.created_at.desc()).limit(limit).offset(offset)
        return (await self.session.execute(stmt)).scalars().all()

    async def get(self, exam_id: UUID) -> ExamModel:
        stmt = select(ExamModel).where(
            ExamModel.id == exam_id,
            ExamModel.organization_id == self.tenant.organization_id,
        )
        e = (await self.session.execute(stmt)).scalar_one_or_none()
        if not e:
            raise NotFoundError("Exam not found")
        return e

    async def create(self, data: dict) -> ExamModel:
        e = ExamModel(
            organization_id=self.tenant.organization_id,
            created_by=self.tenant.user_id,
            **data,
        )
        self.session.add(e)
        await self.session.flush()
        await self._emit(EXAM_CREATED, e)
        await self.session.commit()
        return e

    async def update(self, exam_id: UUID, data: dict) -> ExamModel:
        e = await self.get(exam_id)
        for k, v in data.items():
            if v is not None:
                setattr(e, k, v)
        if data.get("status") == "PUBLISHED":
            await self._emit(EXAM_COMPLETED, e)
        await self.session.commit()
        return e

    async def add_result(self, exam_id: UUID, data: dict) -> ExamResultModel:
        exam = await self.get(exam_id)
        if exam.status == "ARCHIVED":
            raise ConflictError("Cannot add result to ARCHIVED exam")

        existing = (await self.session.execute(
            select(ExamResultModel).where(
                ExamResultModel.exam_id == exam_id,
                ExamResultModel.student_id == data["student_id"],
            )
        )).scalar_one_or_none()
        if existing:
            existing.score = data["score"]
            existing.grade = data.get("grade")
            existing.feedback = data.get("feedback")
            await self.session.commit()
            return existing

        r = ExamResultModel(exam_id=exam_id, **data)
        self.session.add(r)
        await self.session.flush()
        await self.session.commit()
        return r

    async def publish_result(self, result_id: UUID) -> ExamResultModel:
        r = await self.session.get(ExamResultModel, result_id)
        if not r:
            raise NotFoundError("Result not found")
        r.published_at = datetime.now(UTC)
        await self._emit(EXAM_RESULT_PUBLISHED, r)
        await self.session.commit()
        return r

    async def list_results(self, exam_id: UUID):
        await self.get(exam_id)
        stmt = select(ExamResultModel).where(ExamResultModel.exam_id == exam_id)
        return (await self.session.execute(stmt)).scalars().all()

    async def _emit(self, event_type: str, obj, extra: dict | None = None) -> None:
        if isinstance(obj, ExamModel):
            payload = {
                "exam_id": str(obj.id),
                "class_id": str(obj.class_id),
                "exam_type": obj.exam_type,
                "status": obj.status,
                "organization_id": str(obj.organization_id),
            }
            aggregate_type = "Exam"
            aggregate_id = obj.id
        else:
            payload = {
                "result_id": str(obj.id),
                "exam_id": str(obj.exam_id),
                "student_id": str(obj.student_id),
                "score": float(obj.score),
                "organization_id": str(...)  # cần tra từ exam
            }
            aggregate_type = "ExamResult"
            aggregate_id = obj.id

        if extra:
            payload.update(extra)

        env = EventEnvelope.create(
            event_type=event_type,
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            payload=payload,
            source="examinations-module",
        )
        self.session.add(OutboxEvent(
            event_id=env.event_id,
            event_type=env.event_type,
            aggregate_type=env.aggregate_type,
            aggregate_id=env.aggregate_id,
            payload=env.payload,
        ))