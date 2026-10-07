
---

## 5. `docs/workflows/engine.md`

```markdown
# Workflow Engine

## Model
EVENT → RULE → CONDITION → ACTION → (NEW EVENT)

## Components

### Event Source

- Domain event từ module khác (VD: `StudentAbsent`).
- Scheduled event (VD: `scheduled:enrollment_expiring`).

### Rule

- `code`: định danh (VD: `student_absent_rule`).
- `trigger_event`: event kích hoạt.
- `is_enabled`: bật/tắt.
- `config`: JSON chứa condition + actions.

### Condition

Hàm nhận `(payload, config)` → `bool`.

Predefined conditions:
┌──────────────────────┬───────────────────────────────────────────────────────┐
| Code | Logic |
├──────────────────────┼───────────────────────────────────────────────────────┤
| `consecutive_absent_gte_2` | `payload.consecutive_absent >= 2` |
| `lead_no_activity_after_days` | `payload.days_since_last_activity >= config.days` |
| `enrollment_expiring_within_days` | `payload.days_remaining <= config.days` |
└──────────────────────┴───────────────────────────────────────────────────────┘
### Action

Hàm nhận `(session, tenant, payload, config)` → result.

Predefined actions:
┌──────────────────────┬───────────────────────────────────────────────────────┐
| Action | Mô tả |
├──────────────────────┼───────────────────────────────────────────────────────┤
| `create_task` | Tạo task cho counselor/assignee |
| `notify_counselor` | Tạo notification |
| `send_notification` | Alias của notify_counselor |
| `send_communication` | Gửi message qua provider |
└──────────────────────┴───────────────────────────────────────────────────────┘
## Predefined Rules

### 1. `student_absent_rule`

- **Trigger:** `StudentAbsent`
- **Condition:** `consecutive_absent_gte_2`
- **Actions:**
  - `create_task` — tạo task FOLLOW_UP cho counselor
  - `notify_counselor` — thông báo counselor

### 2. `lead_no_response_rule`

- **Trigger:** `scheduled:lead_no_response` (chạy hàng giờ)
- **Condition:** `lead_no_activity_after_days` (config `days: 3`)
- **Actions:**
  - `create_task`
  - `notify_counselor`

### 3. `enrollment_expiring_rule`

- **Trigger:** `scheduled:enrollment_expiring` (chạy hàng giờ)
- **Condition:** `enrollment_expiring_within_days` (config `days: 14`)
- **Actions:**
  - `create_task` — renewal task
  - `notify_counselor`

## Execution Flow
1. Event đến (từ outbox hoặc scheduler)
↓

2. Query workflow enabled khớp event_type
↓

3. Với mỗi workflow:
a. Tạo WorkflowExecution (PENDING)
b. Check condition

Nếu false → SUCCESS (skipped)
c. Chạy từng action trong config.actions

Log kết quả vào actions_log
d. Update status (SUCCESS / FAILED)
↓

4. Commit


## Persistence

### workflow_executions
┌───────────────┬────────────────────────────┐
| Field         | Mô tả                      |
├───────────────┼────────────────────────────┤
| id            | UUID                       |
| workflow_id   | FK → workflows             |
| event_id      | UUID (cho idempotency)     |
| event_type    | VARCHAR                    |
| payload       | JSONB                      |
| status        | PENDING / SUCCESS / FAILED |
| attempt_count | INT                        |
| error         | TEXT                       |
| actions_log   | JSONB                      |
| started_at    | TIMESTAMPTZ                |
| finished_at   | TIMESTAMPTZ                |
└───────────────┴────────────────────────────┘
## Phase 1 vs Phase 2+

**Phase 1 (hiện tại):**
- Chỉ predefined rules.
- Admin có thể enable/disable.
- Không cho user tự tạo rule.

**Phase 2+:**
- Admin-created dynamic workflow (UI builder).
- Custom condition/action.
- Approval flow.

## Testing

Test workflow cần:
1. Tạo event (VD: 2 buổi ABSENT liên tiếp).
2. Chạy consumer: `_consume(50)`.
3. Kiểm tra `workflow_executions` và `notifications`.





