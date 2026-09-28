import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../StatusBadge";

describe("StatusBadge", () => {
  it("shows Vietnamese label for ENROLLED", () => {
    render(<StatusBadge status="ENROLLED" />);
    expect(screen.getByText("Đã ghi danh")).toBeInTheDocument();
  });

  it("shows raw status if unknown", () => {
    render(<StatusBadge status="CUSTOM_STATUS" />);
    expect(screen.getByText("CUSTOM_STATUS")).toBeInTheDocument();
  });
});