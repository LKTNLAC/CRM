
---

## 5. `CONTRIBUTING.md`

```markdown
# Contributing

## Quy tắc

1. Đọc `ARCHITECTURE.md` và `HANDOFF.md` trước khi code.
2. Không đổi architecture nếu chưa có `ARCHITECTURE AMENDMENT`.
3. Không bypass `import-linter` trong CI.
4. Không hard-code secret.
5. Không gọi provider trực tiếp từ domain.
6. Không để authorization chỉ ở frontend.
7. Không bỏ qua audit cho operation nhạy cảm.
8. Mọi thay đổi schema phải có migration.
9. Mọi thay đổi phải có test.

## Workflow

1. Tạo branch feature từ `main`.
2. Code + test.
3. Chạy CI local:
   ```bash
   cd backend
   ruff check app
   mypy app
   lint-imports
   pytest app/tests/unit -v
   pytest app/tests/integration -v
4. PR + review.

5. Merge khi CI pass.

Commit message
Conventional Commits:

feat: — feature mới

fix: — bug fix

docs: — documentation

refactor: — refactor không đổi behavior

test: — test

chore: — build, deps

Ví dụ: feat: add export endpoint for students

Deploy
Commit + push lên main.

SSH vào VM: git pull.

Rebuild: docker compose up -d --build <service>.

Migrate: docker compose exec backend alembic upgrade head.

Reload Nginx: docker compose exec frontend nginx -s reload.

Không sửa file trực tiếp trên VM.

