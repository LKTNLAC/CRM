
---

## 3. `docs/database/lifecycle.md`

```markdown
# Data Lifecycle

## Entity Lifecycle Policies
┌──────────────────┬───────────────────────────────────────┬──────────────────────────────────────┐
| Policy           | Ý nghĩa                               | Ví dụ                                |
├──────────────────┼───────────────────────────────────────┼──────────────────────────────────────┤
| IMMUTABLE        | Không sửa, không xóa. Chỉ append.     | audit_logs, payments, communications |
| STATE_TRANSITION | Không xóa. Chỉ đổi trạng thái.        | invoices, enrollments, leads         |
| SOFT_DELETE      | Có `deleted_at`. Ẩn khỏi UI mặc định. | students, guardians, users, classes  |
| HARD_DELETE      | Được xóa thật (có audit).             | notifications, tasks (done)          |
| CONFIG           | Có thể sửa/xóa nếu không tham chiếu.  | courses, lead_sources                |
└──────────────────┴───────────────────────────────────────┴──────────────────────────────────────┘
## Chi tiết từng Entity
┌─────────────────────┬──────────────────────────────┬──────────────────────────────────────────┐
| Entity              | Policy                       | Ghi chú                                  |
├─────────────────────┼──────────────────────────────┼──────────────────────────────────────────┤
| users               | SOFT_DELETE                  | `deleted_at`. Không xóa user có audit.   |
| students            | SOFT_DELETE                  | Không xóa nếu còn enrollment active.     |
| guardians           | SOFT_DELETE                  | Tương tự student.                        |
| leads               | STATE_TRANSITION             | `status = LOST / ARCHIVED`. Không xóa.   |
| lead_activities     | IMMUTABLE                    | Append only.                             |
| courses             | CONFIG                       | Không xóa nếu có class tham chiếu.       |
| course_levels       | CONFIG                       | Tương tự.                                |
| classes             | SOFT_DELETE                  | Không xóa nếu còn enrollment active.     |
| class_schedules     | STATE_TRANSITION             | `status = CANCELLED`.                    |
| enrollments         | STATE_TRANSITION             | `status = CANCELLED / COMPLETED`.        |
| attendance          | IMMUTABLE                    | Append + correction log.                 |
| exams               | STATE_TRANSITION             | `status = DRAFT / PUBLISHED / ARCHIVED`. |
| exam_results        | STATE_TRANSITION             | Không xóa sau publish.                   |
| invoices            | STATE_TRANSITION             | `status`. Không xóa.                     |
| payments            | IMMUTABLE                    | Append. Correction qua refunds.          |
| communications      | IMMUTABLE                    | Append.                                  |
| notifications       | HARD_DELETE (90 ngày)        | Retention.                               |
| tasks               | HARD_DELETE (done + 90 ngày) | Hoặc archive.                            |
| workflows           | CONFIG                       | Không xóa nếu có execution.              |
| workflow_executions | IMMUTABLE                    | Append.                                  |
| audit_logs          | IMMUTABLE                    | Không ai xóa.                            |
| attachments         | SOFT_DELETE                  | Xóa object storage sau 30 ngày.          |
└─────────────────────┴──────────────────────────────┴──────────────────────────────────────────┘
## Rules

1. **Không** hard delete entity có audit log.
2. **Không** hard delete entity có FK từ entity khác (trừ cascade có chủ đích).
3. Mọi soft delete **phải** ghi audit.
4. Mọi state transition **phải** ghi audit + emit event.
5. Immutable table: cấm UPDATE/DELETE ở DB level (trigger/rule).

## API Behavior
┌─────────────────────────────┬────────────────────────────────────────────────────────┐
| Method                      | Hành vi                                                |
├─────────────────────────────┼────────────────────────────────────────────────────────┤
| DELETE /resource/{id}       | Soft delete (nếu SOFT_DELETE) hoặc 405 (nếu IMMUTABLE) |
| POST /resource/{id}/archive | Archive (nếu có)                                       |
| POST /resource/{id}/cancel  | State transition (nếu có)                              |
└─────────────────────────────┴────────────────────────────────────────────────────────┘
## Retention Policy

**Defaults — subject to applicable law, tax regulation, contract, privacy policy.**
┌───────────────────────┬────────────────────┬────────────────────────────────┐
| Entity                | Default            | Action                         |
├───────────────────────┼────────────────────┼────────────────────────────────┤
| audit_logs            | 7 năm              | Archive cold storage sau 1 năm |
| payments              | 10 năm             | Immutable, archive sau 3 năm   |
| invoices              | 10 năm             | Immutable, archive sau 3 năm   |
| communications        | 3 năm              | Archive sau 1 năm              |
| notifications         | 90 ngày            | Hard delete                    |
| tasks (done)          | 1 năm              | Archive                        |
| workflow_executions   | 1 năm              | Archive                        |
| outbox (published)    | 7 ngày             | Hard delete                    |
| outbox (dead)         | 30 ngày            | Manual review                  |
| refresh_tokens        | 30 ngày sau expire | Hard delete                    |
| idempotency_keys      | 24h                | Hard delete                    |
| attachments (deleted) | 30 ngày            | Hard delete object             |
└───────────────────────┴────────────────────┴────────────────────────────────┘
**Cleanup job:** chạy hàng ngày, log số record xử lý.

## Backup

- Daily full + WAL archiving
- Retention: 30/90/365 ngày
- Restore test hàng quý
- Chi tiết: `docs/backup-restore.md`







