# API

## 1. Base

- Version: `/api/v1`
- Content-Type: `application/json`
- Auth: `Authorization: Bearer <access_token>`

## 2. Response Format

```json
{
  "data": {},
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO8601"
  }
}
```
## 3. Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "...",
    "details": [],
    "request_id": "uuid"
  }
}
```
Error codes:

VALIDATION_ERROR (422)

UNAUTHORIZED (401)

FORBIDDEN (403)

NOT_FOUND (404)

CONFLICT (409)

RATE_LIMITED (429)

INTERNAL_ERROR (500)

TOKEN_REUSE_DETECTED (401)

## 4. Pagination
Query: ?page=1&page_size=20&sort=-created_at

Response meta:
```json
{
  "total": 100,
  "page": 1,
  "page_size": 20,
  "total_pages": 5
}
```

## 5. Filtering / Search
```bash
?filter[status]=active&search=keyword
```

## 6. Idempotency
Client POST critical: header Idempotency-Key: <uuid>:

POST /payments

POST /enrollments

POST /leads/{id}/convert

POST /refunds

POST /invoices

Webhook: dùng provider_event_id (không dùng Idempotency-Key).

## 7. Resource Pattern
GET    /api/v1/{resource}
POST   /api/v1/{resource}
GET    /api/v1/{resource}/{id}
PATCH  /api/v1/{resource}/{id}
DELETE /api/v1/{resource}/{id}

## 8. Delete Policy
IMMUTABLE → 405

STATE_TRANSITION → dùng /cancel, /archive

SOFT_DELETE → DELETE soft

HARD_DELETE → DELETE hard (audit)

## 9. Timezone
Request/response: ISO 8601 có offset

DB: UTC

## 10. Health
GET /api/v1/health — liveness

GET /api/v1/ready — readiness (DB + Redis)