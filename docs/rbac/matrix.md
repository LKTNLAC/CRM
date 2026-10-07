# RBAC Matrix

## Roles
┌──────────────────┬────────────────────────────────────┐
| Code             | Mô tả                              |
├──────────────────┼────────────────────────────────────┤
| SUPER_ADMIN      | Toàn quyền, kể cả quản lý role     |
| SCHOOL_ADMIN     | Quản trị trường (trừ quản lý role) |
| ACADEMIC_MANAGER | Quản lý học vụ                     |
| COUNSELOR        | Tư vấn viên (leads, students)      |
| TEACHER          | Giáo viên (lớp được assign)        |
| ACCOUNTANT       | Kế toán (invoice, payment)         |
| STUDENT_SERVICE  | Chăm sóc học viên                  |
| STUDENT          | Học viên (portal)                  |
| PARENT           | Phụ huynh (portal)                 |
└──────────────────┴────────────────────────────────────┘

## Data Scope Notation

- `ALL` — toàn hệ thống
- `ORG` — tổ chức
- `BRANCH` — chi nhánh
- `ASG_STU` — assigned_students
- `ASG_CLS` — assigned_classes
- `OWN` — own
- `CHILD` — own_children
- `–` — không có quyền

## Permission Matrix

### Auth & User
┌─────────────┬─────────────┬──────────────┬──────────────┬───────────┬─────────┬────────────┬─────────┬─────────┬────────┐
| Permission  | SUPER_ADMIN | SCHOOL_ADMIN | ACADEMIC_MGR | COUNSELOR | TEACHER | ACCOUNTANT | SERVICE | STUDENT | PARENT |
├─────────────┼─────────────┼──────────────┼──────────────┼───────────┼─────────┼────────────┼─────────┼─────────┼────────┤
| auth.login  |      ✓      |      ✓      |      ✓       |     ✓     |   ✓    |     ✓      |    ✓   |    ✓    |    ✓   |
| user.read   |     ALL     |     ORG      |     ORG      |    OWN    |   OWN   |    OWN     |   OWN   |   OWN   |   OWN  |
| user.create |      ✓      |      ✓      |      –       |     –      |    –   |     –      |    –    |    –    |    –   |
| user.update |     ALL     |     ORG      |      –       |    OWN    |   OWN   |    OWN     |   OWN   |   OWN   |   OWN  |
| user.delete |      ✓      |      ✓      |      –       |     –      |   –    |     –      |    –    |    –    |   –    |
| role.read   |     ALL     |     ORG      |      –       |     –      |   –    |     –      |    –    |    –    |    –   |
| role.manage |     ALL     |      –       |      –       |     –      |   –    |     –      |    –    |    –    |    –   |
└─────────────┴─────────────┴──────────────┴──────────────┴────────────┴────────┴────────────┴─────────┴─────────┴────────┘

### CRM
┌─────────────────┬─────────────┬──────────────┬──────────────┬───────────┬─────────┬────────────┬─────────┬─────────┬────────┐
| Permission      | SUPER_ADMIN | SCHOOL_ADMIN | ACADEMIC_MGR | COUNSELOR | TEACHER | ACCOUNTANT | SERVICE | STUDENT | PARENT |
├─────────────────┼─────────────┼──────────────┼──────────────┼───────────┼─────────┼────────────┼─────────┼─────────┼────────┤
| lead.read       |     ALL     |      ORG     |      ORG     |  ASG_STU  |    –    |      –     |   ORG   |    –    |    –   |
| lead.create     |     ✓       |      ✓      |      –       |     ✓     |    –    |      –     |    ✓   |    –     |   –    |
| lead.update     |     ✓       |      ✓      |      –       |   ASG_STU |    –    |      –      |   ✓    |    –    |    –   |
| lead.convert    |     ✓       |      ✓      |      –       |   ASG_STU |    –    |      –      |   ✓    |    –    |    –   |
| student.read    |     ALL     |      ORG     |      ORG     |  ASG_STU  | ASG_CLS |     ORG    |   ORG   |   OWN   |  CHILD |
| student.create  |     ✓       |      ✓      |      ✓       |     ✓     |    –    |     –      |   ✓    |    –    |    –   |
| student.update  |     ✓       |      ✓      |      ✓       |  ASG_STU  | ASG_CLS |     –      |   ✓    |    –    |    –   |
| student.archive |     ✓       |      ✓      |      ✓       |    –      |    –    |     –      |   ✓    |    –    |    –   |
| guardian.read   |    ALL      |      ORG     |     ORG      |  ASG_STU  | ASG_CLS |     ORG    |   ORG   |    –    | CHILD |
| guardian.create |     ✓       |      ✓      |      –       |     ✓     |    –    |     –      |    ✓   |    –     |   –   |
| guardian.update |     ✓       |      ✓      |      –       |  ASG_STU  |    –    |     –      |    ✓    |   –     |   –    |
| task.read       |    ALL      |      ORG     |     ORG      |  ASG_STU  | ASG_CLS |     ORG    |   ORG   |   –     |   –    |
| task.create     |     ✓       |      ✓      |      ✓       |     ✓    |    ✓    |      ✓     |    ✓    |   –    |    –   |
| task.update     |     ✓       |      ✓      |      ✓       |  ASG_STU | ASG_CLS  |     ORG    |   ORG   |    –    |   –    |
└─────────────────┴─────────────┴──────────────┴──────────────┴──────────┴──────────┴────────────┴─────────┴─────────┴────────┘

### Academic
┌──────────────────────┬─────────────┬──────────────┬──────────────┬───────────┬─────────┬────────────┬─────────┬─────────┬────────┐
| Permission           | SUPER_ADMIN | SCHOOL_ADMIN | ACADEMIC_MGR | COUNSELOR | TEACHER | ACCOUNTANT | SERVICE | STUDENT | PARENT |
├──────────────────────┼─────────────┼──────────────┼──────────────┼───────────┼─────────┼────────────┼─────────┼─────────┼────────┤
| course.read          |     ALL     |     ORG      |      ORG     |    ORG    |   ORG   |     ORG    |   ORG   |   ORG   |  ORG   |
| course.create        |     ✓      |     ✓        |       ✓      |     –     |    –    |      –     |    –    |    –    |   –    |
| course.update        |     ✓      |     ✓        |       ✓      |     –     |    –    |      –     |    –    |    –    |   –    |
| class.read           |     ALL     |     ORG     |       ORG     |    ORG    | ASG_CLS |      –     |   ORG   |   OWN   |  CHILD |
| class.create         |     ✓      |     ✓        |       ✓      |     –     |    –    |      –     |    –    |    –    |   –    |
| class.update         |     ✓      |     ✓        |       ✓      |     –     |    –    |      –     |    –    |    –    |   –    |
| class.assign_teacher |     ✓      |     ✓        |       ✓      |     –     |    –    |      –     |    –    |    –    |   –    |
| schedule.read        |     ALL     |     ORG      |      ORG     |    ORG    | ASG_CLS |      –     |   ORG   |   OWN   |  CHILD |
| schedule.manage      |     ✓      |     ✓        |       ✓      |     –     |    –    |      –     |    –    |    –    |   –    |
| enrollment.read      |     ALL     |     ORG     |       ORG     |  ASG_STU  | ASG_CLS |     ORG    |   ORG   |   OWN   |  CHILD |
| enrollment.create    |     ✓      |     ✓        |       ✓      |     ✓    |     –    |      –     |    ✓   |    –    |   –    |
| enrollment.update    |     ✓      |     ✓        |       ✓      |  ASG_STU  |    –    |      –     |    ✓    |    –    |   –   |
| enrollment.cancel    |     ✓      |     ✓        |       ✓      |  ASG_STU  |    –    |      –     |    –    |    –    |   –    |
| attendance.read      |     ALL     |     ORG     |       ORG     |  ASG_STU  | ASG_CLS |      –     |   ORG   |   OWN   | CHILD  |
| attendance.create    |     ✓      |     ✓        |       ✓      |     –     | ASG_CLS |      –     |    –    |    –    |   –    |
| attendance.update    |     ✓      |     ✓        |       ✓      |     –     | ASG_CLS |      –     |    –    |    –    |   –    |
| exam.read            |     ALL     |     ORG     |       ORG     |  ASG_STU  | ASG_CLS |      –     |   ORG   |   OWN   | CHILD  |
| exam.create          |     ✓      |     ✓       |        ✓      |     –     | ASG_CLS |      –     |    –    |    –    |   –    |
| exam.update          |     ✓      |     ✓       |        ✓      |     –     | ASG_CLS |      –     |    –    |    –    |   –    |
| exam_result.read     |     ALL     |     ORG     |       ORG     |  ASG_STU  | ASG_CLS |      –     |   ORG   |   OWN   | CHILD  |
| exam_result.update   |     ✓      |     ✓       |        ✓      |     –     | ASG_CLS |      –     |    –    |    –    |   –    |
└──────────────────────┴────────────┴──────────────┴───────────────┴───────────┴─────────┴────────────┴─────────┴─────────┴────────┘

### Finance
┌────────────────┬─────────────┬──────────────┬──────────────┬───────────┬─────────┬────────────┬─────────┬─────────┬────────┐
| Permission     | SUPER_ADMIN | SCHOOL_ADMIN | ACADEMIC_MGR | COUNSELOR | TEACHER | ACCOUNTANT | SERVICE | STUDENT | PARENT |
├────────────────┼─────────────┼──────────────┼──────────────┼───────────┼─────────┼────────────┼─────────┼─────────┼────────┤
| invoice.read   |    ALL      |      ORG     |     ORG      |  ASG_STU  |    –    |    ORG     |   ORG   |   OWN   | CHILD  |
| invoice.create |     ✓      |       ✓      |      –       |     –     |    –    |     ✓      |    –    |    –    |   –    |
| invoice.update |     ✓      |       ✓      |      –       |     –     |    –    |     ✓      |    –    |    –    |   –    |
| invoice.cancel |     ✓      |       ✓      |      –       |     –     |    –    |     ✓      |    –    |    –    |   –    |
| payment.read   |    ALL      |      ORG     |      –       | ASG_STU   |    –    |    ORG     |   ORG   |   OWN   | CHILD  |
| payment.create |     ✓      |       ✓      |      –       |     –     |    –    |     ✓      |    –    |    –    |   –    |
| payment.verify |     ✓      |       ✓      |      –       |     –     |    –    |     ✓      |    –    |    –    |   –    |
| payment.refund |     ✓      |       ✓      |      –       |     –     |    –    |     ✓      |    –    |    –    |   –    |
└────────────────┴────────────┴──────────────┴───────────────┴──────────┴──────────┴────────────┴─────────┴─────────┴────────┘

### Automation & Reporting
┌────────────────────┬─────────────┬──────────────┬──────────────┬───────────┬─────────┬────────────┬─────────┬─────────┬────────┐
| Permission         | SUPER_ADMIN | SCHOOL_ADMIN | ACADEMIC_MGR | COUNSELOR | TEACHER | ACCOUNTANT | SERVICE | STUDENT | PARENT |
├────────────────────┼─────────────┼──────────────┼──────────────┼───────────┼─────────┼────────────┼─────────┼─────────┼────────┤
| communication.read |     ALL     |     ORG      |     ORG      |  ASG_STU  | ASG_CLS |      –     |   ORG   |   OWN   | CHILD  |
| communication.send |     ✓       |     ✓       |      ✓       |     ✓     |    ✓   |      ✓     |   ✓     |   –    |    –    |
| notification.read  |     OWN     |     OWN      |     OWN      |    OWN    |   OWN   |     OWN    |   OWN   |   OWN   |  OWN   |
| workflow.read      |     ALL     |     ORG      |      –       |     –     |    –    |      –     |    –    |    –    |    –   |
| workflow.manage    |     ✓       |     ✓       |      –       |     –     |    –    |      –     |    –    |    –    |    –   |
| report.dashboard   |     ALL     |     ORG      |     ORG      |  ASG_STU  | ASG_CLS |     ORG    |   ORG   |    –    |    –   |
| report.sales       |     ALL     |     ORG      |      –       |  ASG_STU  |    –    |      –     |    –    |    –    |    –   |
| report.academic    |     ALL     |     ORG      |     ORG      |     –     | ASG_CLS |      –     |    –    |    –    |    –   |
| report.financial   |     ALL     |     ORG      |      –       |     –     |    –    |     ORG    |    –    |    –    |    –   |
└────────────────────┴─────────────┴──────────────┴──────────────┴───────────┴─────────┴────────────┴─────────┴─────────┴────────┘

### System
┌────────────────────┬─────────────┬──────────────┬──────────────┬───────────┬─────────┬────────────┬─────────┬─────────┬────────┐
| Permission         | SUPER_ADMIN | SCHOOL_ADMIN | ACADEMIC_MGR | COUNSELOR | TEACHER | ACCOUNTANT | SERVICE | STUDENT | PARENT |
├────────────────────┼─────────────┼──────────────┼──────────────┼───────────┼─────────┼────────────┼─────────┼─────────┼────────┤
| audit.read         |     ALL     |     ORG      |       –      |     –     |    –    |      –     |    –    |    –    |   –    |
| setting.read       |     ALL     |     ORG      |      ORG     |    ORG    |   ORG   |     ORG    |   ORG   |    –    |   –    |
| setting.manage     |     ALL     |     ORG      |       –      |     –     |    –    |      –     |    –    |    –    |   –    |
| integration.read   |     ALL     |     ORG      |       –      |     –     |    –    |      –     |    –    |    –    |   –    |
| integration.manage |     ALL     |     ORG      |       –      |     –     |    –    |      –     |    –    |    –    |   –    |
└────────────────────┴─────────────┴──────────────┴──────────────┴───────────┴─────────┴────────────┴─────────┴─────────┴────────┘

## Notes

- **Permission ≠ Scope.** `student.update` với scope `ASG_CLS` không có nghĩa Teacher sửa mọi field. Field-level policy áp dụng cho update.
- Ma trận này là **baseline**. Custom role có thể mở rộng qua UI (Super Admin).
- Frontend chỉ dùng permission để ẩn/hiện UI. Backend **luôn** kiểm tra lại.







