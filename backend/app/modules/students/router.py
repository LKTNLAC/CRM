from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import require_permission
from app.core.tenant import TenantContext
from app.modules.students.application.services import StudentService
from app.modules.students.schemas import StudentCreate, StudentResponse, StudentUpdate, LinkUserRequest

router = APIRouter(prefix="/students", tags=["students"])


@router.get("", response_model=list[StudentResponse])
async def list_students(
    status: str | None = Query(None),
    counselor_id: UUID | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    ctx: TenantContext = Depends(require_permission("student.read")),
    session: AsyncSession = Depends(get_session),
):
    return await StudentService(session, ctx).list(status=status, counselor_id=counselor_id, search=search, limit=limit, offset=offset)


@router.post("/{student_id}/link-user", response_model=StudentResponse)
async def link_user(
    student_id: UUID,
    body: LinkUserRequest,
    ctx: TenantContext = Depends(require_permission("student.update")),
    session: AsyncSession = Depends(get_session),
):
    return await StudentService(session, ctx).link_user(student_id, body.user_id)


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: UUID,
    ctx: TenantContext = Depends(require_permission("student.read")),
    session: AsyncSession = Depends(get_session),
):
    return await StudentService(session, ctx).get(student_id)


@router.patch("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: UUID,
    body: StudentUpdate,
    ctx: TenantContext = Depends(require_permission("student.update")),
    session: AsyncSession = Depends(get_session),
):
    return await StudentService(session, ctx).update(student_id, body.model_dump(exclude_none=True))


@router.post("/{student_id}/archive", response_model=StudentResponse)
async def archive_student(
    student_id: UUID,
    ctx: TenantContext = Depends(require_permission("student.archive")),
    session: AsyncSession = Depends(get_session),
):
    return await StudentService(session, ctx).archive(student_id)

@router.delete("/{student_id}/link-user", response_model=StudentResponse)
async def unlink_user(
    student_id: UUID,
    ctx: TenantContext = Depends(require_permission("student.update")),
    session: AsyncSession = Depends(get_session),
):
    return await StudentService(session, ctx).unlink_user(student_id)

