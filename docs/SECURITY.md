# Security

## 1. Nguyên tắc

- **JWT carries identity, not authority.**
- **Frontend ≠ Security.**
- Backend luôn kiểm tra: **Authentication → Permission → Data Scope → Resource → Action**.
- Không hard-code secret.
- Mọi hành động nhạy cảm phải audit.

## 2. Authentication

### Access Token (JWT RS256)
- Lifetime: **15 phút**
- Chứa: `sub` (user_id), `org_id`, `branch_id`, `roles`, `jti`, `iat`, `exp`
- **KHÔNG** chứa permission list
- **KHÔNG** chứa data scope

### Refresh Token (opaque)
- Lifetime: 7 ngày, absolute max 30 ngày
- Lưu hash trong DB
- **Rotation** mỗi lần refresh
- **Reuse detection** → revoke family + audit

### Password
- Hash: **Argon2id**
- Min length: **12 ký tự**
- Phải có: chữ hoa, chữ thường, số, ký tự đặc biệt
- History: 5 password gần nhất không trùng
- Không dùng common password list

### Failed Login
- 5 lần sai → khóa 15 phút
- 10 lần sai → khóa 1 giờ + notify email
- 20 lần sai → khóa 24 giờ + audit alert

## 3. Authorization

- **RBAC:** User → Role → Permission → Resource + Action
- **Data Scope:** own, assigned_students, assigned_classes, organization, branch, all
- **Field-level policy:** Teacher chỉ update academic_note, evaluation
- **Permission cache** Redis TTL 60s, invalidate khi role/permission đổi

## 4. Transport

- HTTPS bắt buộc (production)
- CORS whitelist
- Security headers: HSTS, X-Content-Type-Options, X-Frame-Options
- Rate limit Redis-based (IP + user)

## 5. Input Validation

- Pydantic / Zod
- SQL: ORM + parameterized query
- File upload: MIME whitelist, size limit, virus scan, checksum

## 6. Webhook

- Signature verification
- Idempotency qua `provider_event_id`
- Audit + retry + timeout

## 7. Secrets

- `.env` cho dev
- Secret manager cho production
- `gitleaks` CI gate

## 8. Audit

Ghi: login, logout, create, update, delete, permission change, payment, refund, student info change, role change, config change.

Immutable. Không user thường xóa.

## 9. Backup

- Daily full + WAL archiving
- Retention: 30/90/365 ngày
- Restore test hàng quý
- WHAT, WHEN, WHERE, HOW, HOW TO RESTORE

## 10. CI Security Gate

- `gitleaks` — secret scan
- `bandit` — Python security
- `npm audit` — JS vulnerabilities
- `import-linter` — architecture test
- 