from fastapi import APIRouter

from app.api.v1.endpoints import health
from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.leads.router import router as leads_router
from app.modules.students.router import router as students_router
from app.modules.guardians.router import router as guardians_router
from app.modules.tasks.router import router as tasks_router
from app.modules.courses.router import router as courses_router
from app.modules.classes.router import router as classes_router
from app.modules.enrollments.router import router as enrollments_router
from app.modules.attendance.router import router as attendance_router
from app.modules.examinations.router import router as exams_router
from app.modules.notifications.router import router as notifications_router
from app.modules.communications.router import router as communications_router
from app.modules.workflows.router import router as workflows_router
from app.integrations.router import router as integrations_router
from app.modules.reports.router import router as reports_router
from app.modules.users.roles_router import router as roles_router
from app.modules.portal.router import router as portal_router
from app.modules.export.router import router as export_router

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(leads_router)
api_router.include_router(students_router)
api_router.include_router(guardians_router)
api_router.include_router(tasks_router)
api_router.include_router(courses_router)
api_router.include_router(classes_router)
api_router.include_router(enrollments_router)
api_router.include_router(attendance_router)
api_router.include_router(exams_router)
api_router.include_router(notifications_router)
api_router.include_router(communications_router)
api_router.include_router(workflows_router)
api_router.include_router(integrations_router)
api_router.include_router(reports_router)
api_router.include_router(roles_router)
api_router.include_router(portal_router)
api_router.include_router(export_router)