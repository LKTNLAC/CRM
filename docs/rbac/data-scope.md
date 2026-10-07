# Data Scope

## Levels

- `ALL` — toàn hệ thống
- `ORG` — tổ chức
- `BRANCH` — chi nhánh
- `ASG_STU` — assigned_students (counselor)
- `ASG_CLS` — assigned_classes (teacher)
- `OWN` — own (user tự)
- `CHILD` — own_children (parent)

## Resolution

### Request → TenantContext
Request
↓
Auth middleware (verify JWT)
↓
Load user từ DB + roles
↓
Resolve permissions từ DB (Redis cache 60s)
↓
Resolve data scope theo role + resource
↓
TenantContext {
user_id,
organization_id,
branch_id,
roles,
permissions
}


### Permission Check
1. Check permission code (VD: student.read)

2. Check data scope level

3. Check resource-specific rules

4. Check field-level policy (cho update)


## Data Scope theo Role

### COUNSELOR

- `lead.read` → chỉ lead có `counselor_id = user_id`
- `student.read` → chỉ student có `counselor_id = user_id`
- `enrollment.read` → enrollment của student assigned

### TEACHER

- `class.read` → chỉ class được assign qua `class_teachers`
- `student.read` → student enrolled trong class được assign
- `attendance.create` → chỉ class được assign

### ACCOUNTANT

- `invoice.read` → toàn organization
- `payment.read` → toàn organization

### SCHOOL_ADMIN / ACADEMIC_MANAGER

- Toàn organization

### SUPER_ADMIN

- Toàn hệ thống (mọi org)

## Field-Level Authorization

Ví dụ `student.update`:
┌───────────────┬────────────────────────────┐
| Role          | Fields được phép           |
├───────────────┼────────────────────────────┤
| TEACHER       | academic_note, evaluation  |
| COUNSELOR     | phone, email, note, status |
| ACCOUNTANT    | (không được update)        |
| SCHOOL_ADMIN  | * (tất cả)                 |
└───────────────┴────────────────────────────┘

**Enforce:** ở service layer. Nếu field không được phép → 403 với danh sách field vi phạm.

## Implementation

### Backend

`app/core/scope.py`:

```python
def is_org_wide(roles: list[str]) -> bool:
    return any(r in roles for r in ("SUPER_ADMIN", "SCHOOL_ADMIN", "ACADEMIC_MANAGER"))

def is_counselor_only(roles: list[str]) -> bool:
    return "COUNSELOR" in roles and not is_org_wide(roles)

def is_teacher_only(roles: list[str]) -> bool:
    return "TEACHER" in roles and not is_org_wide(roles)
```
### Repository filter
#### Direct ownership
stmt = stmt.where(Model.organization_id == tenant.organization_id)

#### Counselor scope
if is_counselor_only(tenant.roles):
    stmt = stmt.where(LeadModel.counselor_id == tenant.user_id)

#### Teacher scope
if is_teacher_only(tenant.roles):
    class_ids = await get_teacher_class_ids(session, tenant.user_id)
    stmt = stmt.where(ClassModel.id.in_(class_ids))

### CI Test
Test: mọi repository phải filter tenant.

Test: không có raw query trong application/ hoặc api/.
