# Architecture Amendment — Phase 9 Findings

## Vấn đề
Một số `application/services.py` import trực tiếp `infrastructure.models` của module khác (thay vì gọi service interface). Vi phạm Dependency Rules trong ARCHITECTURE.md.

## Danh sách vi phạm
- `enrollments/application/services.py` → `students.infrastructure.models`, `classes.infrastructure.models`
- `classes/application/services.py` → `enrollments.infrastructure.models`
- `guardians/application/services.py` → `students.infrastructure.models`
- `leads/application/services.py` → `students.infrastructure.models`
- `reports/application/services.py` → nhiều infrastructure models

## Tác động
- Coupling giữa các module tăng.
- Khó tách module thành microservice sau này.
- Không ảnh hưởng runtime.

## Giải pháp đề xuất (Phase 10)
1. Mỗi module expose service interface (`StudentService.get()`).
2. Module khác gọi interface, không import model.
3. Hoặc dùng DTO cho cross-module data.

## Migration plan
- Refactor từng module một, bắt đầu với `enrollments` (vi phạm nhiều nhất).
- Chạy full test sau mỗi module.
- Bật lại contract "API no infrastructure" trong CI khi hoàn tất.