# Architecture

> Language School CRM — Modular Monolith + API-first + Event-driven + Adapter-based

## 1. Architecture Style

- **Modular Monolith** — monolith về deployment, modular về code.
- **API-first** — mọi tương tác qua `/api/v1`.
- **Event-driven** — domain event + workflow engine.
- **Adapter-based Integration** — external provider qua interface.

## 2. High-level Diagram
USER
↓
RESPONSIVE UI (React + TS + Vite)
↓ HTTP/HTTPS
API LAYER (/api/v1)
↓
AUTHENTICATION (JWT + Refresh)
↓
RBAC + DATA SCOPE
↓
CRM DOMAIN ENGINE (18 modules)
↓
WORKFLOW / RULE ENGINE
↓
EVENT SYSTEM (Outbox + Consumer)
↓
INTEGRATION LAYER (Adapter Pattern)
↓
DATA LAYER (PostgreSQL + Redis + Queue + Storage)
↓
EXTERNAL (Zalo, Email, SMS, Payment, Storage, AI)


## 3. Modules
┌────────────────┬─────────────────────────────────────────────┐
| Module         | Trách nhiệm                                 |
├────────────────┼─────────────────────────────────────────────┤
| auth           | Login, refresh token, reuse detection       |
| users          | User CRUD, role assignment, change password |
| organizations  | Org, branch                                 |
| leads          | Pipeline, activity log, conversion          |
| students       | Profile, link user                          |
| guardians      | Profile, link user + student                |
| tasks          | Task engine                                 |
| courses        | Course + levels                             |
| classes        | Class + schedule + teacher assignment       |
| enrollments    | Enrollment + transfer + cancel              |
| attendance     | Record + correction + consecutive tracking  |
| examinations   | Exam + result + publish                     |
| communications | Outbound messages (Email/SMS/Zalo/Push)     |
| notifications  | In-app notifications                        |
| workflows      | Rule engine + executions                    |
| reports        | Read-only analytics                         |
| audit          | Audit log                                   |
| portal         | Student/Parent portal                       |
└────────────────┴─────────────────────────────────────────────┘

## 4. Dependency Rules
api → application → domain → repository interface → infrastructure

┌────────────────┬─────────────────────────────────────────┬─────────────────────────────────────┐
| Layer          | Được import                             | Cấm import                          |
├────────────────┼─────────────────────────────────────────┼─────────────────────────────────────┤
| domain         | stdlib, domain thuần                    | framework, ORM, integration, api    |
| application    | domain, repository interface, event bus | ORM cụ thể, integration cụ thể, api |
| infrastructure | domain, application, thư viện ngoài     | api                                 |
| api            | application, schemas                    | infrastructure trực tiếp            |
└────────────────┴─────────────────────────────────────────┴─────────────────────────────────────┘

**Cross-module:** không import model/DB của module khác. Giao tiếp qua service interface hoặc domain event.

**Enforce:** `import-linter` trong CI gate.

## 5. Internal Module Structure
modules/<name>/
├── domain/
│ ├── entities.py
│ ├── value_objects.py
│ ├── rules.py
│ ├── events.py
│ └── exceptions.py
├── application/
│ ├── services.py
│ ├── commands.py
│ ├── queries.py
│ └── handlers.py
├── infrastructure/
│ ├── models.py
│ ├── repository.py
│ └── mapper.py
├── schemas.py
├── router.py
└── permissions.py


File chỉ tạo khi có responsibility tương ứng. Không bắt buộc đủ file.

## 6. Data Layer

- **PostgreSQL 16** — primary database
- **Redis 7** — cache, rate limit, event stream
- **Celery** — background task queue
- **Object Storage** — attachment (S3-compatible)

## 7. Event Architecture

- Domain event chuẩn hóa (envelope với event_id, event_type, aggregate_type, aggregate_id, payload, timestamp, source, correlation_id).
- **Outbox pattern** — ghi event vào cùng transaction với business write, worker publish sau commit.
- **Redis Streams** — event bus.
- **At-least-once** + consumer idempotent theo `event_id`.

## 8. Integration Architecture

Domain → Interface → Adapter → Provider


Interfaces:
- `CommunicationProvider` — Email, SMS, Zalo, Push
- `PaymentProvider` — Bank, Gateway, EWallet
- `StorageProvider` — S3, GCS
- `AIProvider` — LLM

## 9. Architecture Lock v1.0 — 14 items

1. Architecture Style
2. Folder Structure
3. Module Boundaries
4. Dependency Rules
5. Internal Module Structure
6. Database Principles
7. API Contract
8. Authentication Strategy
9. Authorization Model
10. Event Contract
11. Integration Contract
12. Error Contract
13. Naming Convention
14. Deployment Model

**Mọi thay đổi sau lock** phải qua **ARCHITECTURE AMENDMENT**:
1. Vấn đề
2. Tác động
3. Giải pháp đề xuất
4. Files bị ảnh hưởng
5. Migration plan



┌─────────────────────────────────────┬──────────────────────────────────────────────┐

├─────────────────────────────────────┼──────────────────────────────────────────────┤

└─────────────────────────────────────┴──────────────────────────────────────────────┘