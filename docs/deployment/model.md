
---

## 3. `docs/deployment/model.md`

```markdown
# Deployment Model

## Environments

| Env | Mục đích | URL |
|---|---|---|
| Local | Dev | http://localhost:5173 |
| Staging | Test trước production | (Phase sau) |
| Production | Thực tế | http://34.87.184.165:8081 |

## Stack

- **Backend:** FastAPI + Uvicorn + Gunicorn (production)
- **Frontend:** Nginx serve static build
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **Worker:** Celery worker + beat
- **Orchestration:** Docker Compose

## Port Mapping (VM hiện tại)

VM đang host 2 service khác. Port mapping:

| Service | Host port | Container port |
|---|---|---|
| PostgreSQL | 5433 | 5432 |
| Redis | 6380 | 6379 |
| Frontend (Nginx) | 8081 | 80 |
| Backend | (internal) | 8000 |

**Nginx OS** (port 80/443) serve 2 app cũ — không đụng vào.

## Docker Compose Services

```yaml
services:
  postgres:    # PostgreSQL 16 + volume pgdata
  redis:       # Redis 7
  backend:     # FastAPI (uvicorn)
  worker:      # Celery worker
  beat:        # Celery beat (scheduler)
  frontend:    # Nginx serve React build + proxy /api/
```
## Deployment Flow
### Trên VM
```powershell
cd ~/CRM
git pull
docker compose up -d --build <service>
docker compose exec backend alembic upgrade head
docker compose exec frontend nginx -s reload
```
### Env vars
```powershell
APP_NAME=language-school-crm
APP_ENV=production
APP_DEBUG=false

DATABASE_URL=postgresql+asyncpg://crm:crm@postgres:5432/crm
REDIS_URL=redis://redis:6379/0

JWT_ALGORITHM=RS256
JWT_PRIVATE_KEY_PATH=/app/secrets/jwt_private.pem
JWT_PUBLIC_KEY_PATH=/app/secrets/jwt_public.pem
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=604800

CORS_ORIGINS=["http://34.87.184.165:8081"]
```
Không hard-code secret. .env không commit.

### Nginx (trong frontend container)
server {
    listen 80;

    resolver 127.0.0.11 valid=10s ipv6=off;

    location /api/ {
        set $backend_upstream http://backend:8000;
        proxy_pass $backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /health {
        proxy_pass http://backend:8000/api/v1/health;
    }

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
### Health Check
/health — liveness (backend)

/ready — readiness (DB + Redis)

/api/v1/integrations/health — integration status

### Logging
Structured JSON (structlog)

Request ID + correlation ID

Docker logs: docker compose logs <service>

Log aggregation: Phase sau (Loki/ELK)

### Monitoring
Metrics: Prometheus (Phase sau)

Dashboard: Grafana (Phase sau)

Alert: Alertmanager (Phase sau)

Uptime: healthchecks.io

### Backup
Daily full DB + WAL

Upload GCS (optional)

Retention: 30/90/365

Restore test hàng quý

Chi tiết: docs/backup-restore.md

### SSL/HTTPS
Hiện tại: HTTP only. Cần làm trước khi dùng production thật.

Options:

Let's Encrypt (cần domain)

Cloudflare Tunnel (không cần domain, miễn phí)

Cloudflare Proxy (cần domain, DDoS protection)

### Firewall
Google Cloud VPC firewall rules:

allow-crm → TCP 8081

allow-ssh → TCP 22 (chỉ IP admin)

Không mở port khác

### Resource
VM: Google Cloud instance

CPU: 2 vCPU

RAM: 4 GB

Disk: 20 GB SSD

### Scaling (Phase sau)
Vertical: tăng CPU/RAM VM

Horizontal: nhiều backend container + load balancer

Database: managed PostgreSQL + read replica

Redis: managed Redis

CDN cho frontend static

### Disaster Recovery
#### Backup
DB: daily + WAL

Env files: git (nhưng không secret)

Secrets: lưu riêng (1Password, GCP Secret Manager)

#### Restore
##### DB
gunzip < backup.sql.gz | docker compose exec -T postgres psql -U crm crm

##### Code
git clone https://github.com/LKTNLAC/CRM.git
cd CRM
cp .env.example .env  # fill secrets
docker compose up -d --build

#### RTO / RPO
RTO (Recovery Time Objective): 1 giờ

RPO (Recovery Point Objective): 24 giờ (backup hàng ngày)

#### Checklist khi deploy lần đầu
□ VM có Docker + Compose
□ Clone repo
□ Tạo .env
□ Sinh JWT keys
□ docker compose up -d --build
□ Migration
□ Seed
□ Mở firewall port
□ Test health
□ Test login
□ Setup backup cron
□ Setup SSL/HTTPS
□ Setup monitoring

#### Checklist khi update code
□ Commit + push trên Windows
□ SSH vào VM
□ git pull
□ docker compose up -d --build <service>
□ Migration (nếu có)
□ Reload Nginx (nếu sửa frontend)
□ Test
□ Không sửa file trực tiếp trên VM