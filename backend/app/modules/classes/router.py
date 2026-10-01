from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import require_permission
from app.core.tenant import TenantContext
from app.modules.classes.application.services import ClassService
from app.modules.classes.schemas import (
    ClassCreate,
    ClassResponse,
    ClassUpdate,
    ScheduleCreate,
    ScheduleResponse,
    TeacherAssign,
)
from app.modules.classes.schemas import ScheduleCreate, ScheduleUpdate

router = APIRouter(prefix="/classes", tags=["classes"])


@router.get("", response_model=list[ClassResponse])
async def list_classes(
    status: str | None = Query(None),
    course_id: UUID | None = Query(None),
    limit: int = Query(100, le=200),
    offset: int = Query(0, ge=0),
    ctx: TenantContext = Depends(require_permission("class.read")),
    session: AsyncSession = Depends(get_session),
):
    return await ClassService(session, ctx).list(status=status, course_id=course_id, limit=limit, offset=offset)


@router.post("", response_model=ClassResponse, status_code=201)
async def create_class(
    body: ClassCreate,
    ctx: TenantContext = Depends(require_permission("class.create")),
    session: AsyncSession = Depends(get_session),
):
    return await ClassService(session, ctx).create(body.model_dump())


@router.get("/{class_id}", response_model=ClassResponse)
async def get_class(
    class_id: UUID,
    ctx: TenantContext = Depends(require_permission("class.read")),
    session: AsyncSession = Depends(get_session),
):
    return await ClassService(session, ctx).get(class_id)


@router.patch("/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: UUID,
    body: ClassUpdate,
    ctx: TenantContext = Depends(require_permission("class.update")),
    session: AsyncSession = Depends(get_session),
):
    return await ClassService(session, ctx).update(class_id, body.model_dump(exclude_none=True))


@router.get("/{class_id}/schedules", response_model=list[ScheduleResponse])
async def list_schedules(
    class_id: UUID,
    ctx: TenantContext = Depends(require_permission("schedule.read")),
    session: AsyncSession = Depends(get_session),
):
    return await ClassService(session, ctx).list_schedules(class_id)


@router.post("/{class_id}/schedules", response_model=ScheduleResponse, status_code=201)
async def add_schedule(
    class_id: UUID,
    body: ScheduleCreate,
    ctx: TenantContext = Depends(require_permission("schedule.manage")),
    session: AsyncSession = Depends(get_session),
):
    return await ClassService(session, ctx).add_schedule(class_id, body.model_dump())


@router.post("/{class_id}/teachers")
async def assign_teacher(
    class_id: UUID,
    body: TeacherAssign,
    ctx: TenantContext = Depends(require_permission("class.assign_teacher")),
    session: AsyncSession = Depends(get_session),
):
    ct = await ClassService(session, ctx).assign_teacher(class_id, body.model_dump())
    return {"id": str(ct.id), "class_id": str(ct.class_id), "teacher_id": str(ct.teacher_id), "role": ct.role}

@router.patch("/{class_id}/schedules/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    class_id: UUID,
    schedule_id: UUID,
    body: ScheduleUpdate,
    ctx: TenantContext = Depends(require_permission("schedule.manage")),
    session: AsyncSession = Depends(get_session),
):
    return await ClassService(session, ctx).update_schedule(class_id, schedule_id, body.model_dump(exclude_none=True))


@router.delete("/{class_id}/schedules/{schedule_id}", status_code=204)
async def delete_schedule(
    class_id: UUID,
    schedule_id: UUID,
    ctx: TenantContext = Depends(require_permission("schedule.manage")),
    session: AsyncSession = Depends(get_session),
):
    await ClassService(session, ctx).delete_schedule(class_id, schedule_id)
    
@router.get("/{class_id}/teachers")
async def list_teachers(
    class_id: UUID,
    ctx: TenantContext = Depends(require_permission("class.read")),
    session: AsyncSession = Depends(get_session),
):
    return await ClassService(session, ctx).list_teachers(class_id)

