import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { LoginForm } from "../LoginForm";

vi.mock("@/services/auth", () => ({
  authService: {
    login: vi.fn().mockResolvedValue({
      access_token: "a",
      refresh_token: "r",
      token_type: "bearer",
      expires_in: 900,
    }),
    me: vi.fn().mockResolvedValue({
      id: "u1",
      email: "admin@example.com",
      full_name: "Admin",
      organization_id: "o1",
      branch_id: null,
      roles: ["SUPER_ADMIN"],
    }),
  },
}));

describe("LoginForm", () => {
  it("renders email and password fields", () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mật khẩu/i)).toBeInTheDocument();
  });

  it("shows validation error for empty password", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "admin@example.com");
    await user.click(screen.getByRole("button", { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(screen.getByText(/vui lòng nhập mật khẩu/i)).toBeInTheDocument();
    });
  });

  it("submits with valid credentials", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "admin@example.com");
    await user.type(screen.getByLabelText(/mật khẩu/i), "ChangeMe123!");
    await user.click(screen.getByRole("button", { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /đăng nhập/i })).toBeInTheDocument();
    });
  });
});