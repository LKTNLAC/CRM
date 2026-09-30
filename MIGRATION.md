
---

## 2. TẠO FILE `MIGRATION.md` Ở ROOT

Tài liệu để AI khác migrate sang stack mới (nếu muốn).

```markdown
# MIGRATION GUIDE

> Hướng dẫn chuyển đổi dự án sang môi trường/AI khác.

## 1. Chuẩn bị môi trường mới

### Yêu cầu
- Python 3.12+
- Node 20+
- PostgreSQL 16+
- Redis 7+
- Docker + Docker Compose (khuyến nghị)
- OpenSSL (sinh JWT key)

### Clone repo
```bash
git clone https://github.com/LKTNLAC/CRM.git
cd CRM
```
## 2. Cấu hình
```bash
Copy .env.example → .env
Sửa các giá trị:
DATABASE_URL=postgresql+asyncpg://crm:crm@localhost:5432/crm
REDIS_URL=redis://localhost:6379/0
JWT_ALGORITHM=RS256
JWT_PRIVATE_KEY_PATH=./secrets/jwt_private.pem
JWT_PUBLIC_KEY_PATH=./secrets/jwt_public.pem
CORS_ORIGINS=["http://localhost:5173"]
APP_ENV=development
APP_DEBUG=true

Sinh JWT keys
mkdir -p backend/secrets
cd backend/secrets
openssl genrsa -out jwt_private.pem 2048
openssl rsa -in jwt_private.pem -pubout -out jwt_public.pem
cd ../..
```
## 3. Setup database
### Tạo DB + user
```bash
psql -U postgres -c "CREATE DATABASE crm;"
psql -U postgres -c "CREATE USER crm WITH PASSWORD 'crm';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE crm TO crm;"
psql -U postgres -c "ALTER DATABASE crm OWNER TO crm;"
```
## 4. Cài backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Linux
# hoặc .venv\Scripts\activate   # Windows
pip install -e ".[dev]"
```
## 5. Migration
alembic upgrade head

Nếu DB đã có schema cũ:
### Backup trước
pg_dump -U crm crm > backup.sql

### Xem trạng thái
alembic current
alembic history

### Nâng cấp
alembic upgrade head

## 6. Seed
python -m app.scripts.seed

Tạo 9 user mẫu + roles + permissions + workflows.

## 7. Chạy
### Terminal 1: API
uvicorn app.main:app --reload --port 8000

### Terminal 2: Celery worker
celery -A app.workers.celery_app worker -l info --pool=solo

### Terminal 3: Celery beat
celery -A app.workers.celery_app beat -l info

## 8. Cài frontend
```bash
cd frontend
npm install
npm run dev
```
## 9. Docker (khuyến nghị)
```bash
docker compose up -d --build
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.scripts.seed
```
## 10. Chuyển dữ liệu production
Backup từ VM cũ
### Trên VM cũ
docker compose exec postgres pg_dump -U crm crm > backup.sql
docker compose exec postgres pg_dump -U crm -s crm > schema.sql  # chỉ schema

Restore trên môi trường mới
### Copy file backup.sql sang VM mới
scp backup.sql user@new-vm:~/

### Restore
docker compose exec -T postgres psql -U crm crm < backup.sql

## 11. Kiểm tra sau migration
###	Mục	Lệnh
┌───┬───────────────────┬───────────────────────────────────────────────┐
| 1 | DB có bảng        | psql -U crm crm -c "\dt"                      |
| 2 | Alembic version   | alembic current                               |
| 3 | User tồn tại      | psql -U crm crm -c "SELECT email FROM users;" |
| 4 | API health        | curl http://localhost:8000/api/v1/health      |
| 5 | Login             | curl -X POST .../auth/login -d '{...}'        |
| 6 | Frontend build    | npm run build                                 |
| 7 | Unit tests        | pytest app/tests/unit                         |
| 8 | Integration tests | pytest app/tests/integration                  |
| 9 | Architecture      | lint-imports                                  |
└───┴───────────────────┴───────────────────────────────────────────────┘

## 12. Migrate sang AI khác
Prompt gợi ý cho AI mới

Đọc HANDOFF.md trước khi làm bất kỳ việc gì.

Nguyên tắc:
1. Không đổi architecture nếu chưa có ARCHITECTURE AMENDMENT.
2. Không hard-code secret.
3. Không import cross-module infrastructure.
4. Không bypass RBAC.
5. Không gọi external provider trực tiếp.
6. Không commit .env.

Trước khi code:
- Đọc ARCHITECTURE.md, DATABASE.md, SECURITY.md.
- Đọc module tương ứng trong backend/app/modules.
- Đọc docs/rbac/matrix.md.

Khi sửa:
- Luôn viết migration nếu đổi schema.
- Luôn test: pytest + lint-imports.
- Luôn báo cáo output format (STATUS / WHAT WAS DONE / FILES / IMPACT / TEST).

## 13. Env vars đầy đủ
### App
APP_NAME=language-school-crm
APP_ENV=development
APP_DEBUG=true
APP_SECRET_KEY=change-me

### Database
DATABASE_URL=postgresql+asyncpg://crm:crm@localhost:5432/crm

### Redis
REDIS_URL=redis://localhost:6379/0

### JWT
JWT_ALGORITHM=RS256
JWT_PRIVATE_KEY_PATH=./secrets/jwt_private.pem
JWT_PUBLIC_KEY_PATH=./secrets/jwt_public.pem
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=604800

### CORS
CORS_ORIGINS=["http://localhost:5173"]

### SMTP
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

### SMS
SMS_PROVIDER_KEY=

### Zalo
ZALO_APP_ID=
ZALO_APP_SECRET=

### Logging
LOG_LEVEL=INFO

## 14. Troubleshooting
┌─────────────────────────────────────┬──────────────────────────────────────────────┐
| Lỗi                                 | Fix                                          |
├─────────────────────────────────────┼──────────────────────────────────────────────┤
| alembic upgrade lỗi                 | Kiểm tra alembic current và alembic history  |
| tsc: Permission denied              | chmod +x node_modules/.bin/*                 |
| Method Not Allowed                  | Router thiếu endpoint POST/PATCH             |
| No student profile linked           | Link user ↔ student qua API                  |
| duplicate key                       | Data cũ, xóa hoặc reset DB                   |
| Cannot add middleware after startup | add_middleware phải gọi trước include_router |
| CORS 400                            | Cập nhật CORS_ORIGINS trong .env             |
| Port conflict                       | Đổi host port trong docker-compose.yml       |
└─────────────────────────────────────┴──────────────────────────────────────────────┘

## 15. Checklist bàn giao
□ HANDOFF.md có trong repo
□ MIGRATION.md có trong repo
□ .env.example đầy đủ
□ Migration đã commit
□ Seed script chạy được
□ Test pass
□ Docker compose chạy được
□ Git remote đúng
□ Backup DB đã tạo
□ JWT keys backup (offline)

