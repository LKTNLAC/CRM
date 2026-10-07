# Tenant Ownership

## Phân loại

### DIRECT TENANT OWNERSHIP

Entity trực tiếp có `organization_id` (và có thể `branch_id`).
┌─────────────┬────────┬───────────┐
| Entity      | org_id | branch_id |
├─────────────┼────────┼───────────┤
| users       |   ✓    | nullable  |
| students    |   ✓    |     ✓    |
| guardians   |   ✓    |     –     |
| leads       |   ✓    |     ✓    |
| courses     |   ✓    |     –     |
| classes     |   ✓    |     ✓    |
| enrollments |   ✓    |     ✓    |
| attendance  |   ✓    |     ✓    |
| invoices    |   ✓    |     ✓    |
| tasks       |   ✓    |     ✓    |
| attachments |   ✓    | nullable |
└─────────────┴────────┴───────────┘
### INHERITED TENANT OWNERSHIP

Entity không có `organization_id`, tenant lấy qua parent.
┌──────────────────────┬───────────────────────────────────────────────────────┐
| Entity               | Inherit qua                                           |
├──────────────────────┼───────────────────────────────────────────────────────┤
| payment_intents      | `invoice_id` → `invoices.organization_id`             |
| payment_transactions | `payment_intent_id` → `invoices.organization_id`      |
| payment_events       | `payment_transaction_id` → `invoices.organization_id` |
| refunds              | `payment_transaction_id` → `invoices.organization_id` |
| adjustments          | `invoice_id` → `invoices.organization_id`             |
| invoice_items        | `invoice_id` → `invoices.organization_id`             |
| enrollment_classes   | `enrollment_id` → `enrollments.organization_id`       |
| class_schedules      | `class_id` → `classes.organization_id`                |
| exam_results         | `exam_id` → `exams.organization_id`                   |
| lead_activities      | `lead_id` → `leads.organization_id`                   |
| workflow_executions  | `workflow_id` → `workflows.organization_id`           |
| audit_logs           | `organization_id` (trực tiếp, không qua user_id)      |
└──────────────────────┴───────────────────────────────────────────────────────┘
## Rule cho Repository

### Direct ownership

```python
stmt = stmt.where(Model.organization_id == tenant.organization_id)
if tenant.branch_id and hasattr(Model, "branch_id"):
    stmt = stmt.where(Model.branch_id == tenant.branch_id)
```
###  Inherited ownership
#### Query qua parent
```python
stmt = stmt.join(Model.invoice).where(
    Invoice.organization_id == tenant.organization_id
)
```
#### Hoặc subquery
```python
stmt = stmt.where(
    Model.invoice_id.in_(
        select(Invoice.id).where(Invoice.organization_id == tenant.organization_id)
    )
)
```
#### Rule
Mỗi entity phải được phân loại Direct hoặc Inherited. Không thêm organization_id vào entity inherited chỉ để đơn giản hóa repository.

### Audit Log — Multi-actor Ownership
audit_logs không phụ thuộc duy nhất vào user_id:

actor_type: USER, SYSTEM, WORKER, INTEGRATION

actor_id: nullable (SYSTEM action không có actor)

organization_id: trực tiếp (không qua user)

Rule: Tenant ownership resolve từ organization_id trực tiếp, không từ user_id.

### CI GATE

Test: mọi repository phải filter tenant (direct hoặc inherited).

Test: không có raw query trong application/ hoặc api/.





