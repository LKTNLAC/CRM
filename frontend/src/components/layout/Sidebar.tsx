import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Bell,
  MessageSquare,
  Workflow,
  BarChart3,
  CheckSquare,
  Settings,
  Shield
} from "lucide-react";
import { cn } from "@/utils/cn";
import { usePermission } from "@/permissions/usePermission";
import { useAuthStore } from "@/stores/authStore";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  permission?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: "Tổng quan",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, permission: "report.dashboard" },
    ],
  },
  {
    title: "CRM",
    items: [
      { to: "/leads", label: "Leads", icon: Users, permission: "lead.read" },
      { to: "/students", label: "Học viên", icon: GraduationCap, permission: "student.read" },
      { to: "/guardians", label: "Phụ huynh", icon: UserCircle, permission: "guardian.read" },
      { to: "/tasks", label: "Công việc", icon: CheckSquare, permission: "task.read" },
    ],
  },
  {
    title: "Học vụ",
    items: [
      { to: "/courses", label: "Khóa học", icon: BookOpen, permission: "course.read" },
      { to: "/classes", label: "Lớp học", icon: CalendarDays, permission: "class.read" },
      { to: "/enrollments", label: "Ghi danh", icon: ClipboardCheck, permission: "enrollment.read" },
      { to: "/attendance", label: "Điểm danh", icon: ClipboardCheck, permission: "attendance.read" },
      { to: "/exams", label: "Kiểm tra", icon: FileText, permission: "exam.read" },
    ],
  },
  {
    title: "Vận hành",
    items: [
      { to: "/notifications", label: "Thông báo", icon: Bell, permission: "notification.read" },
      { to: "/communications", label: "Liên lạc", icon: MessageSquare, permission: "communication.read" },
      { to: "/workflows", label: "Tự động hóa", icon: Workflow, permission: "workflow.read" },
    ],
  },
  {
    title: "Phân tích",
    items: [
      { to: "/reports", label: "Báo cáo", icon: BarChart3, permission: "report.dashboard" },
      { to: "/settings", label: "Cài đặt", icon: Settings, permission: "setting.read" },
    ],
  },
    {
    title: "Hệ thống",
    items: [
      { to: "/users", label: "Người dùng", icon: Users, permission: "user.read" },
      { to: "/roles", label: "Phân quyền", icon: Shield, permission: "role.read" },
    ],
  }
];

interface SidebarProps {
  /** true khi render trong mobile Sheet — bỏ hidden lg:flex */
  mobile?: boolean;
}

export function Sidebar({ mobile = false }: SidebarProps) {
  const { can } = usePermission();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);  // Lấy user hiện tại

  // Kiểm tra role
  const isPortalUser = user?.roles.some((r) => ["STUDENT", "PARENT"].includes(r));

  // Nếu là Student hoặc Parent → render sidebar riêng
  if (isPortalUser) {
    return (
      <aside className={cn(
        "flex-col border-r bg-background h-full",
        mobile ? "flex w-full" : "hidden lg:flex w-60"
      )}>
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b px-5 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">Language CRM</span>
        </div>

        {/* Nav — chỉ 2 mục */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            <li>
              <NavLink
                to="/portal"
                className={({ isActive }) => cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Portal</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/notifications"
                className={({ isActive }) => cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <Bell className="h-4 w-4" />
                <span>Thông báo</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="border-t px-5 py-3 text-xs text-muted-foreground shrink-0">
          v0.1.0
        </div>
      </aside>
    );
  }
  
  return (
    <aside
      className={cn(
        "flex-col border-r bg-background h-full",
        mobile ? "flex w-full" : "hidden lg:flex w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-5 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GraduationCap className="h-4 w-4" />
        </div>
        <span className="font-semibold tracking-tight">Language CRM</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {SECTIONS.map((section) => {
          const visible = section.items.filter((i) => !i.permission || can(i.permission));
          if (visible.length === 0) return null;
          return (
            <div key={section.title} className="mb-5">
              <div className="px-3 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {section.title}
              </div>
              <ul className="space-y-0.5">
                {visible.map((item) => {
                  const Icon = item.icon;
                  const active =
                    location.pathname === item.to ||
                    location.pathname.startsWith(item.to + "/");
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t px-5 py-3 text-xs text-muted-foreground shrink-0">
        v0.1.0 · Phase 11
      </div>
    </aside>
  );
}