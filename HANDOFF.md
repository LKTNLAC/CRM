# HANDOFF — Language School CRM

> Tài liệu bàn giao dự án. Đọc trước khi sửa bất kỳ dòng code nào.

## 1. Tổng quan

- **Dự án:** CRM cho trường ngoại ngữ.
- **Repo:** https://github.com/LKTNLAC/CRM
- **Production:** Google Cloud VM, IP `34.87.184.165`, port `8081`.
- **Login admin:** `admin@example.com / ChangeMe123!`

## 2. Stack

### Backend
- Python 3.12 + FastAPI + SQLAlchemy async
- PostgreSQL 18 (local) / PostgreSQL 16 (Docker)
- Redis (Memurai local / Redis 7 Docker)
- Celery worker + beat
- Alembic migration

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + Radix UI (shadcn-style)
- TanStack Query + Zustand
- React Hook Form + Zod
- Recharts

### Deploy
- Docker Compose
- Nginx (trong container frontend)
- Google Cloud VM

## 3. Cấu trúc repo
CRM/
├── backend/ FastAPI app
│ ├── app/
│ │ ├── core/ config, db, redis, security, deps
│ │ ├── api/v1/ router chính
│ │ ├── modules/ 18 domain modules
│ │ ├── integrations/ adapter (email, sms, zalo, push, mock)
│ │ ├── events/ event bus + outbox
│ │ ├── workers/ celery tasks
│ │ └── tests/ unit + integration
│ ├── alembic/ migrations
│ └── pyproject.toml
├── frontend/ React SPA
│ ├── src/
│ │ ├── app/ providers, App.tsx
│ │ ├── components/ ui (shadcn) + layout + shared
│ │ ├── features/ 15 feature modules
│ │ ├── routes/ react-router config
│ │ ├── services/ axios client
│ │ ├── stores/ zustand
│ │ └── permissions/ RBAC UI
│ ├── Dockerfile production build
│ └── nginx.conf proxy /api/ → backend
├── docs/ architecture, rbac, workflows
├── infrastructure/ nginx, monitoring
└── docker-compose.yml


## 4. Chạy local

```bash
# Backend
cd backend
python -m venv .venv
.venv/Scripts/activate   # Windows
pip install -e ".[dev]"
alembic upgrade head
python -m app.scripts.seed
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```
## 5. Chạy production (VM)
```bash
cd ~/CRM
git pull
docker compose up -d --build
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.scripts.seed
```
Truy cập: http://34.87.184.165:8081

## 6. Port mapping (VM đang host 2 app khác)
┌──────────────────┬────────────────┬────────────────┐
| Service          | Host port      | Container port |
├──────────────────┼────────────────┼────────────────┤
| PostgreSQL       | 5433           | 5432           |
| Redis            | 6380           | 6379           |
| Frontend (Nginx) | 8081           | 80             |
| Backend          | (không expose) | 8000           | 
└──────────────────┴────────────────┴────────────────┘

Lưu ý: Nginx OS đang dùng port 80/443. Không đụng vào.

## 7. Roles & Permissions
9 role mặc định:
SUPER_ADMIN, SCHOOL_ADMIN, ACADEMIC_MANAGER, COUNSELOR, TEACHER, ACCOUNTANT, STUDENT_SERVICE, STUDENT, PARENT

Chi tiết permission: docs/rbac/matrix.md.

Data Scope enforce ở service layer:

COUNSELOR chỉ thấy lead/student của mình.

TEACHER chỉ thấy class được assign.

## 8. Modules backend
┌────────────────┬─────────────────────────────────────────┐
| Module         | Trách nhiệm                             |
├────────────────┼─────────────────────────────────────────┤
| auth           | login, refresh, reuse detection         |
| users          | user CRUD, role assign, change password |
| organizations  | org, branch                             |
| leads          | pipeline, conversion                    |
| students       | profile, link user                      |
| guardians      | profile, link user + student            |
| tasks          | task engine                             |
| courses        | course + levels                         |
| classes        | class + schedule + teacher              |
| enrollments    | enrollment + transfer + cancel          |
| attendance     | record + correct                        |
| examinations   | exam + result + publish                 |
| communications | message outbound                        |
| notifications  | in-app notification                     |
| workflows      | rule engine + executions                |
| reports        | read-only analytics                     |
| audit          | audit log                               |
| portal         | student/parent portal                   |
└────────────────┴─────────────────────────────────────────┘

## 9. Event system
Domain events published qua outbox table.

Celery worker event_consumer đọc event → trigger workflow.

Workflow engine: Event → Condition → Action.

Predefined rules: student_absent_rule, lead_no_response_rule, enrollment_expiring_rule.

## 10. Cách thêm feature mới
### A. Thêm field vào entity
Sửa modules/<module>/infrastructure/models.py.

Tạo migration: alembic revision --autogenerate -m "add field X".

Chạy: alembic upgrade head.

Cập nhật schema, service, router.

Cập nhật frontend types, form.

### B. Thêm module mới
1. Tạo folder modules/<new>/ với cấu trúc:
domain/
application/services.py
infrastructure/models.py
schemas.py
router.py
permissions.py

2. Tạo __init__.py cho mọi folder.

3. Đăng ký router trong api/v1/router.py.

4. Thêm permission vào scripts/seed.py.

## 11. Quy tắc bắt buộc
1. Không import model của module khác trong application/services.py. Dùng service interface.

2. Không hard-code secret. Dùng .env.

3. Không gọi external provider trực tiếp. Qua integrations/.

4. Không thay đổi architecture nếu chưa có ARCHITECTURE AMENDMENT.

5. Không commit .env, secrets/*.pem.

6. Không bỏ qua migration.

7. Frontend chỉ là UI, backend luôn enforce RBAC.

## 12. Test
# Backend
```bash
cd backend
pytest app/tests/unit -v
pytest app/tests/integration -v
lint-imports

# Frontend
cd frontend
npm run test:run
npm run build
```
## 13. Technical Debt
Xem docs/architecture/amendment-phase-15-17.md. Còn tồn:

reports/application/services.py import nhiều model module khác (đặc thù read-model).

ClassService.count_active_students import EnrollmentClassModel.

## 14. Việc chưa làm
┌───────────────────────────────────┬────────────┐
| Feature                           | Ưu tiên    |
├───────────────────────────────────┼────────────┤
| Attachment upload                 | Cao        |
| Field-level authorization         | Trung bình |
| E2E test Playwright               | Trung bình |
| Email verification                | Thấp       |
| Password reset email              | Trung bình |
| 2FA                               | Thấp       |
| Realtime notification (WebSocket) | Trung bình |
| Export Excel/PDF                  | Trung bình |
| Backup tự động                    | Cao        |
| SSL/HTTPS                         | Cao        |
└───────────────────────────────────┴────────────┘

## 15. Liên hệ
Repo owner: LKTNLAC

VM: ssh hoangdatlktteleport@34.87.184.165

