from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import require_permission
from app.core.tenant import TenantContext
from app.modules.courses.application.services import CourseService
from app.modules.courses.schemas import (
    CourseCreate,
    CourseResponse,
    CourseUpdate,
    LevelCreate,
    LevelResponse,
)

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("", response_model=list[CourseResponse])
async def list_courses(
    limit: int = Query(100, le=200),
    offset: int = Query(0, ge=0),
    ctx: TenantContext = Depends(require_permission("course.read")),
    session: AsyncSession = Depends(get_session),
):
    return await CourseService(session, ctx).list(limit=limit, offset=offset)


@router.post("", response_model=CourseResponse, status_code=201)
async def create_course(
    body: CourseCreate,
    ctx: TenantContext = Depends(require_permission("course.create")),
    session: AsyncSession = Depends(get_session),
):
    return await CourseService(session, ctx).create(body.model_dump())


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: UUID,
    ctx: TenantContext = Depends(require_permission("course.read")),
    session: AsyncSession = Depends(get_session),
):
    return await CourseService(session, ctx).get(course_id)


@router.patch("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: UUID,
    body: CourseUpdate,
    ctx: TenantContext = Depends(require_permission("course.update")),
    session: AsyncSession = Depends(get_session),
):
    return await CourseService(session, ctx).update(course_id, body.model_dump(exclude_none=True))


@router.get("/{course_id}/levels", response_model=list[LevelResponse])
async def list_levels(
    course_id: UUID,
    ctx: TenantContext = Depends(require_permission("course.read")),
    session: AsyncSession = Depends(get_session),
):
    return await CourseService(session, ctx).list_levels(course_id)


@router.post("/{course_id}/levels", response_model=LevelResponse, status_code=201)
async def create_level(
    course_id: UUID,
    body: LevelCreate,
    ctx: TenantContext = Depends(require_permission("course.create")),
    session: AsyncSession = Depends(get_session),
):
    return await CourseService(session, ctx).create_level(course_id, body.model_dump())

@router.patch("/{course_id}/levels/{level_id}", response_model=LevelResponse)
async def update_level(
    course_id: UUID,
    level_id: UUID,
    body: LevelUpdate,
    ctx: TenantContext = Depends(require_permission("course.update")),
    session: AsyncSession = Depends(get_session),
):
    return await CourseService(session, ctx).update_level(
        course_id, level_id, body.model_dump(exclude_none=True)
    )


@router.delete("/{course_id}/levels/{level_id}", status_code=204)
async def delete_level(
    course_id: UUID,
    level_id: UUID,
    ctx: TenantContext = Depends(require_permission("course.update")),
    session: AsyncSession = Depends(get_session),
):
    await CourseService(session, ctx).delete_level(course_id, level_id)
    
    