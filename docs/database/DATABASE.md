# Database

## 1. Principles (LOCKED)

- **PostgreSQL 16+**
- **UUID v4** primary key
- **TIMESTAMPTZ** — lưu UTC, không lưu local time
- **FK + index** — ràng buộc chặt
- **Migration:** Alembic
- **Không denormalize sớm**
- **Tenant isolation:** `organization_id` (+ `branch_id` khi cần)
- **Soft delete:** `deleted_at`
- **Immutable table:** cấm UPDATE/DELETE (audit_logs, payments, communications)

## 2. Naming Convention

- Table: `snake_case`, plural (`users`, `leads`, `class_schedules`)
- Column: `snake_case`
- PK: `id`
- FK: `<entity>_id` (`student_id`, `class_id`)
- Timestamp: `created_at`, `updated_at`, `deleted_at`
- Boolean: `is_*`, `has_*`

## 3. Tenant Ownership

### Direct
Entity có `organization_id` (+ optional `branch_id`):

users, students, guardians, leads, courses, classes, enrollments, attendance, invoices, tasks, attachments

### Inherited
Entity không có `organization_id`, tenant lấy qua parent:

payment_intents, payment_transactions, payment_events, refunds, adjustments, invoice_items, enrollment_classes, class_schedules, exam_results, lead_activities, workflow_executions

**Rule:** Không thêm `organization_id` vào inherited entity chỉ để đơn giản hóa repository.

## 4. Audit Log — Multi-actor

`audit_logs` KHÔNG phụ thuộc duy nhất vào `user_id`.

audit_logs
├── id UUID PK
├── organization_id UUID (nullable cho system action)
├── actor_type ENUM (USER, SYSTEM, WORKER, INTEGRATION)
├── actor_id UUID (nullable)
├── action VARCHAR
├── resource VARCHAR
├── resource_id UUID
├── old_value JSONB
├── new_value JSONB
├── ip_address INET
├── user_agent TEXT
├── request_id UUID
├── correlation_id UUID
└── created_at TIMESTAMPTZ


**Rule:** Tenant ownership resolve từ `organization_id` trực tiếp, không từ `user_id`.

## 5. Business Invariants

- Student không enrollment vào class đã full.
- Enrollment phải cùng organization với class.
- Payment không thuộc invoice khác organization.
- Teacher chỉ attendance cho assigned class.
- Invoice không chuyển từ PAID về DRAFT.
- Refund không vượt quá successful payment amount.
- Lead đã CONVERTED không convert lần hai.
- Class schedule không overlap theo rule.

## 6. Retention

**Defaults — subject to applicable law, tax regulation, contract, privacy policy.**
┌──────────────────────────┬───────────────────┐
| Entity                   | Default retention |
├──────────────────────────┼───────────────────┤
| audit_logs               | 7 năm             |
| payments                 | 10 năm            |
| invoices                 | 10 năm            |
| communications           | 3 năm             |
| notifications            | 90 ngày           |
| tasks (done)             | 1 năm             |
| workflow_executions      | 1 năm             |
| outbox (published)       | 7 ngày            |
| outbox (dead)            | 30 ngày           |
| refresh_tokens (expired) | 30 ngày           |
| idempotency_keys         | 24h               |
└──────────────────────────┴───────────────────┘

Organization có thể override ở Phase sau.

## 7. Core Entities
organizations
├── branches
│ ├── users
│ ├── students
│ ├── classes
│ └── enrollments
├── leads
├── students
├── guardians
├── courses
├── classes
├── enrollments
├── attendance
├── examinations
├── invoices
├── payments
├── communications
├── notifications
├── tasks
├── workflows
├── attachments
└── audit_logs


## 8. Index Strategy

- PK: UUID (index tự động)
- FK: index cho mọi FK
- Query thường xuyên: composite index (VD: `(organization_id, status)`)
- Unique: business key (VD: `(organization_id, student_code)`)
- Partial index cho soft delete: `WHERE deleted_at IS NULL`