
---

## 6. `CHANGELOG.md`

```markdown
# Changelog

All notable changes to this project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/)
Versioning: [Semantic Versioning](https://semver.org/)

## [1.0.0] - 2026-10-06

### Added

#### Backend
- FastAPI + SQLAlchemy async + Alembic
- PostgreSQL 16 + Redis 7 + Celery
- 18 domain modules: auth, users, organizations, leads, students, guardians,
  courses, classes, enrollments, attendance, examinations, payments,
  communications, notifications, workflows, reports, audit, portal
- JWT authentication + refresh token rotation + reuse detection
- RBAC + Data Scope enforcement
- Audit log middleware
- Outbox pattern + event consumer
- Workflow engine với predefined rules
- Integration adapters (Email/SMS/Zalo/Push/Mock)
- Export Excel/PDF endpoints
- Backup script + cron job

#### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + Radix UI (shadcn-style)
- TanStack Query + Zustand
- React Hook Form + Zod
- Recharts
- Dark mode + Lazy loading + Error boundary
- 30+ pages: Dashboard, Leads, Students, Guardians, Tasks, Courses, Classes,
  Enrollments, Attendance, Exams, Notifications, Communications, Workflows,
  Reports, Users, Roles, Settings, Portal (Student + Parent)

#### Infrastructure
- Docker Compose
- Nginx reverse proxy
- GitHub Actions CI
- Backup cron job
- Health check endpoints

### Architecture

- LOCKED v1.0 (14 items)
- Amendment phases 15, 17 recorded

### Security

- HTTPS ready (pending SSL setup)
- Rate limiting
- Password policy
- Audit log
- Input validation

### Known Issues

- PDF export chưa hỗ trợ tiếng Việt có dấu (cần đăng ký font DejaVu)
- Cross-module infrastructure imports cần refactor tiếp

## [Unreleased]

### Planned
- SSL/HTTPS
- Notification preferences
- Attachment upload
- E2E test Playwright
- Realtime notification (WebSocket)

### Deploy
Copy từng nội dung trên, ghi vào file tương ứng trên máy Windows:

ARCHITECTURE.md

DATABASE.md

SECURITY.md

API.md

CONTRIBUTING.md

CHANGELOG.md
