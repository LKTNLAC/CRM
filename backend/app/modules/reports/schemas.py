from pydantic import BaseModel


class DashboardResponse(BaseModel):
    total_leads: int
    new_leads_30d: int
    active_students: int
    active_classes: int
    my_open_tasks: int


class LeadFunnelResponse(BaseModel):
    period_days: int
    total: int
    by_status: dict[str, int]
    enrolled: int
    conversion_rate: float


class LeadBySourceItem(BaseModel):
    source: str
    total: int
    enrolled: int
    conversion_rate: float


class LeadByCounselorItem(BaseModel):
    counselor_id: str
    total: int
    enrolled: int
    conversion_rate: float


class AttendanceSummaryResponse(BaseModel):
    period_days: int
    total_sessions: int
    by_status: dict[str, int]
    attendance_rate: float


class ClassFillItem(BaseModel):
    class_id: str
    code: str
    name: str
    capacity: int
    enrolled: int
    fill_rate: float


class ExamDistributionResponse(BaseModel):
    exam_id: str | None = None
    exam_name: str | None = None
    max_score: float | None = None
    count: int = 0
    avg: float | None = None
    min: float | None = None
    max: float | None = None
    median: float | None = None
    buckets: dict[str, int] | None = None
    error: str | None = None


class StudentSummaryResponse(BaseModel):
    by_status: dict[str, int]
    total: int
    new_30d: int


class TaskSummaryResponse(BaseModel):
    by_status: dict[str, int]
    total: int
    overdue: int