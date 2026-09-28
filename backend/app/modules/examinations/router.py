from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import require_permission
from app.core.tenant import TenantContext
from app.modules.examinations.application.services import ExamService
from app.modules.examinations.schemas import (
    ExamCreate,
    ExamResponse,
    ExamUpdate,
    ResultCreate,
    ResultResponse,
)

router = APIRouter(prefix="/exams", tags=["examinations"])


@router.get("", response_model=list[ExamResponse])
async def list_exams(
    class_id: UUID | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(100, le=200),
    offset: int = Query(0, ge=0),
    ctx: TenantContext = Depends(require_permission("exam.read")),
    session: AsyncSession = Depends(get_session),
):
    return await ExamService(session, ctx).list(class_id=class_id, status=status, limit=limit, offset=offset)


@router.post("", response_model=ExamResponse, status_code=201)
async def create_exam(
    body: ExamCreate,
    ctx: TenantContext = Depends(require_permission("exam.create")),
    session: AsyncSession = Depends(get_session),
):
    return await ExamService(session, ctx).create(body.model_dump())


@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(
    exam_id: UUID,
    ctx: TenantContext = Depends(require_permission("exam.read")),
    session: AsyncSession = Depends(get_session),
):
    return await ExamService(session, ctx).get(exam_id)


@router.patch("/{exam_id}", response_model=ExamResponse)
async def update_exam(
    exam_id: UUID,
    body: ExamUpdate,
    ctx: TenantContext = Depends(require_permission("exam.update")),
    session: AsyncSession = Depends(get_session),
):
    return await ExamService(session, ctx).update(exam_id, body.model_dump(exclude_none=True))


@router.get("/{exam_id}/results", response_model=list[ResultResponse])
async def list_results(
    exam_id: UUID,
    ctx: TenantContext = Depends(require_permission("exam_result.read")),
    session: AsyncSession = Depends(get_session),
):
    return await ExamService(session, ctx).list_results(exam_id)


@router.post("/{exam_id}/results", response_model=ResultResponse, status_code=201)
async def add_result(
    exam_id: UUID,
    body: ResultCreate,
    ctx: TenantContext = Depends(require_permission("exam_result.update")),
    session: AsyncSession = Depends(get_session),
):
    return await ExamService(session, ctx).add_result(exam_id, body.model_dump())


@router.post("/results/{result_id}/publish", response_model=ResultResponse)
async def publish_result(
    result_id: UUID,
    ctx: TenantContext = Depends(require_permission("exam_result.update")),
    session: AsyncSession = Depends(get_session),
):
    return await ExamService(session, ctx).publish_result(result_id)