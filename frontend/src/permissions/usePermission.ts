import { useAuthStore } from "@/stores/authStore";

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  SCHOOL_ADMIN: [
    "user.read", "user.create", "user.update",
    "student.read", "student.create", "student.update", "student.archive",
    "lead.read", "lead.create", "lead.update", "lead.convert",
    "guardian.read", "guardian.create", "guardian.update",
    "course.read", "course.create", "course.update",
    "class.read", "class.create", "class.update", "class.assign_teacher",
    "schedule.read", "schedule.manage",
    "enrollment.read", "enrollment.create", "enrollment.update", "enrollment.cancel",
    "attendance.read", "attendance.create", "attendance.update",
    "exam.read", "exam.create", "exam.update", "exam_result.read", "exam_result.update",
    "task.read", "task.create", "task.update", "task.assign",
    "communication.read", "communication.send",
    "notification.read", "notification.manage",
    "workflow.read", "workflow.manage",
    "report.dashboard", "report.sales", "report.academic", "report.financial",
    "audit.read", "setting.read", "setting.manage",
    "integration.read", "integration.manage",
  ],
  ACADEMIC_MANAGER: [
    "user.read",
    "student.read", "student.create", "student.update", "student.archive",
    "course.read", "course.create", "course.update",
    "class.read", "class.create", "class.update", "class.assign_teacher",
    "schedule.read", "schedule.manage",
    "enrollment.read", "enrollment.create", "enrollment.update", "enrollment.cancel",
    "attendance.read", "attendance.create", "attendance.update",
    "exam.read", "exam.create", "exam.update", "exam_result.read", "exam_result.update",
    "task.read", "task.create", "task.update",
    "communication.read", "communication.send",
    "report.dashboard", "report.academic",
  ],
  COUNSELOR: [
    "user.read",
    "lead.read", "lead.create", "lead.update", "lead.convert",
    "student.read", "student.create", "student.update",
    "guardian.read", "guardian.create", "guardian.update",
    "enrollment.read", "enrollment.create", "enrollment.update",
    "task.read", "task.create", "task.update",
    "communication.read", "communication.send",
    "report.dashboard", "report.sales",
  ],
  TEACHER: [
    "user.read",
    "student.read",
    "class.read", "schedule.read",
    "attendance.read", "attendance.create", "attendance.update",
    "exam.read", "exam.create", "exam_result.read", "exam_result.update",
    "task.read", "task.create", "task.update",
    "communication.send",
    "report.dashboard", "report.academic",
  ],
  ACCOUNTANT: [
    "user.read",
    "student.read", "invoice.read", "invoice.create", "invoice.update",
    "payment.read", "payment.create", "payment.verify", "payment.refund",
    "task.read", "task.create", "task.update",
    "report.dashboard", "report.financial",
  ],
  STUDENT_SERVICE: [
    "user.read",
    "student.read", "student.create", "student.update", "student.archive",
    "guardian.read", "guardian.create", "guardian.update",
    "enrollment.read", "enrollment.create", "enrollment.update",
    "task.read", "task.create", "task.update", "task.assign",
    "communication.read", "communication.send",
    "report.dashboard",
  ],
  STUDENT: ["user.read", "notification.read"],
  PARENT: ["user.read", "notification.read"],
};

export function hasPermission(roles: string[], permission: string): boolean {
  if (roles.includes("SUPER_ADMIN")) return true;
  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role];
    if (perms?.includes(permission)) return true;
  }
  return false;
}

export function usePermission() {
  const user = useAuthStore((s) => s.user);
  return {
    can: (permission: string) => (user ? hasPermission(user.roles, permission) : false),
    roles: user?.roles ?? [],
  };
}