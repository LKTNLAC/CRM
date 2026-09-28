import { Outlet } from "react-router-dom";
import { GraduationCap } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Language CRM</span>
          </div>
          <Outlet />
        </div>
      </div>

      {/* Right — decorative panel */}
      <div className="hidden lg:flex items-center justify-center bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.08),transparent_50%),radial-gradient(circle_at_80%_80%,hsl(var(--primary)/0.06),transparent_50%)]" />
        <div className="relative z-10 max-w-md px-12">
          <h2 className="text-3xl font-semibold tracking-tight mb-4 text-balance">
            Quản lý trường ngoại ngữ, đơn giản và hiệu quả.
          </h2>
          <p className="text-muted-foreground text-balance">
            Từ lead đến học viên, từ lớp học đến điểm danh, từ thanh toán đến báo cáo —
            tất cả trong một nền tảng duy nhất.
          </p>
          <div className="mt-8 flex gap-2">
            <div className="h-1 w-12 rounded-full bg-primary" />
            <div className="h-1 w-6 rounded-full bg-primary/30" />
            <div className="h-1 w-3 rounded-full bg-primary/20" />
          </div>
        </div>
      </div>
    </div>
  );
}