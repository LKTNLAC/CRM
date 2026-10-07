
---

## 2. `docs/testing/strategy.md`

```markdown
# Testing Strategy

## Levels

| Level | Tool | Coverage target |
|---|---|---|
| Unit | pytest | 70% backend, 50% frontend |
| Integration | pytest + testcontainers | Critical modules |
| API | pytest + httpx | All endpoints |
| E2E | Playwright (Phase sau) | Critical flows |
| Architecture | import-linter | 100% dependency rules |

## Backend Testing

### Unit Tests

```bash
cd backend
pytest app/tests/unit -v
```
Test:

Password policy

Security utilities

Permission check logic

Business rules (pure functions)

Event envelope

## Integration Tests
pytest app/tests/integration -v

Test:

Auth flow (login → refresh → logout)

RBAC flow (permission enforcement)

Database queries

Repository filters

Tenant isolation

## API Tests
Test mọi endpoint:

Happy path (200/201)

Validation error (422)

Unauthorized (401)

Forbidden (403)

Not found (404)

Conflict (409)

## E2E Critical Flows
1. Lead → Convert → Enrollment

2. Enrollment → Invoice

3. Payment → Invoice Paid

4. Class → Attendance

5. Attendance → Risk (StudentAbsent workflow)

6. Enrollment Expiry → Renewal

## Frontend Testing
### Unit
```powershell
cd frontend
npm run test:run
```
Test:

Utility functions (cn, download, format)

Shared components (StatusBadge, ExportButton)

Hooks

## Component
Test với Testing Library:

LoginForm validation

Form submission

Error display

Loading state

## E2E (Phase sau)
playwright:
test('lead to enrollment', async ({ page }) => {
  await login(page, 'admin@example.com', 'ChangeMe123!');
  await page.goto('/leads/new');
  await page.fill('[name=full_name]', 'E2E Test');
  await page.click('button[type=submit]');
  // ...
});

## Architecture Test
```powershell
cd backend
lint-imports
```

Enforce:

domain không import framework

application không import infrastructure

api không import infrastructure trực tiếp

Module A không import model module B

CI fail nếu vi phạm → block merge.

## CI Pipeline
steps:
  1. lint (ruff, eslint)
  2. typecheck (mypy, tsc)
  3. architecture-test (import-linter)
  4. unit-test
  5. integration-test
  6. security-scan (gitleaks, bandit)
  7. build (docker build)

Fail bất kỳ bước nào → block merge.

## Teet Data
### Fixture
conftest.py — session, DB, client fixtures.

renderWithProviders — wrapper cho component test.

### Seed
python -m app.scripts.seed — 9 user mẫu.

### Factory (Phase sau)
Factory Boy cho Python.

Faker cho data generation.

### Must Test
Unauthorized

Invalid data

Duplicate request

Concurrent request

External provider failure

Timeout

Retry

Partial failure

Boundary conditions

### Không test
Framework behavior (FastAPI routing, React rendering)

Library internals

Private methods

### Coverage
#### Backend
```powershell
cd backend
pytest --cov=app --cov-report=html
open htmlcov/index.html
```
#### Frontend
```powershell
cd frontend
npm run test:coverage
```
Không ép 100%. Target:

Domain logic: 90%

Service: 70%

Router: 50%

Utils: 90%

## Continuous Improvement
Review test coverage hàng tháng.

Thêm test khi fix bug.

Không xóa test không cần thiết — chỉ refactor.
