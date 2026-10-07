# Frontend Testing

## Stack

- **Vitest** — test runner
- **@testing-library/react** — component testing
- **jsdom** — DOM environment
- **@testing-library/user-event** — simulate user actions

## Chạy

```bash
npm run test          # watch mode
npm run test:run      # run once
npm run test:coverage # with coverage
```

## Cấu trúc
src/test/setup.ts — global setup

src/test/utils.tsx — renderWithProviders helper

**/__tests__/*.test.tsx — test files

## Quy ước
Test file đặt trong __tests__/ cạnh file cần test.

Dùng renderWithProviders thay vì render để có QueryClient + Router.

Mock service ở tầng module (vi.mock).

Ưu tiên test user behavior qua screen.getByRole, getByLabelText.

## Coverage target
Utils: 90%

Shared components: 70%

Feature components: 50%

### Ví dụ
```python
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../StatusBadge";

describe("StatusBadge", () => {
  it("shows Vietnamese label for ENROLLED", () => {
    render(<StatusBadge status="ENROLLED" />);
    expect(screen.getByText("Đã ghi danh")).toBeInTheDocument();
  });
});
```

### Không test
Framework behavior (React rendering)

Library internals

Private methods

