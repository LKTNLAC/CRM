import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import NotFoundPage from "@/pages/NotFoundPage";

// CRM
const LeadsListPage = lazy(() => import("@/features/leads/pages/LeadsListPage"));
const LeadCreatePage = lazy(() => import("@/features/leads/pages/LeadCreatePage"));
const LeadDetailPage = lazy(() => import("@/features/leads/pages/LeadDetailPage"));
const StudentsListPage = lazy(() => import("@/features/students/pages/StudentsListPage"));
const StudentCreatePage = lazy(() => import("@/features/students/pages/StudentCreatePage"));
const StudentDetailPage = lazy(() => import("@/features/students/pages/StudentDetailPage"));
const GuardiansListPage = lazy(() => import("@/features/guardians/pages/GuardiansListPage"));
const GuardianCreatePage = lazy(() => import("@/features/guardians/pages/GuardianCreatePage"));
const GuardianDetailPage = lazy(() => import("@/features/guardians/pages/GuardianDetailPage"));
const TasksPage = lazy(() => import("@/features/tasks/pages/TasksPage"));

// Academic
const CoursesListPage = lazy(() => import("@/features/courses/pages/CoursesListPage"));
const CourseCreatePage = lazy(() => import("@/features/courses/pages/CourseCreatePage"));
const CourseDetailPage = lazy(() => import("@/features/courses/pages/CourseDetailPage"));
const ClassesListPage = lazy(() => import("@/features/classes/pages/ClassesListPage"));
const ClassCreatePage = lazy(() => import("@/features/classes/pages/ClassCreatePage"));
const ClassDetailPage = lazy(() => import("@/features/classes/pages/ClassDetailPage"));
const EnrollmentsListPage = lazy(() => import("@/features/enrollments/pages/EnrollmentsListPage"));
const EnrollmentCreatePage = lazy(() => import("@/features/enrollments/pages/EnrollmentCreatePage"));
const EnrollmentDetailPage = lazy(() => import("@/features/enrollments/pages/EnrollmentDetailPage"));
const AttendancePage = lazy(() => import("@/features/attendance/pages/AttendancePage"));
const AttendanceRecordPage = lazy(() => import("@/features/attendance/pages/AttendanceRecordPage"));
const ExamsListPage = lazy(() => import("@/features/exams/pages/ExamsListPage"));
const ExamCreatePage = lazy(() => import("@/features/exams/pages/ExamCreatePage"));
const ExamDetailPage = lazy(() => import("@/features/exams/pages/ExamDetailPage"));

// Automation & Reporting
const NotificationsPage = lazy(() => import("@/features/notifications/pages/NotificationsPage"));
const CommunicationsPage = lazy(() => import("@/features/communications/pages/CommunicationsPage"));
const WorkflowsPage = lazy(() => import("@/features/workflows/pages/WorkflowsPage"));
const ReportsPage = lazy(() => import("@/features/reports/pages/ReportsPage"));

// Users & Roles
const UsersListPage = lazy(() => import("@/features/users/pages/UsersListPage"));
const UserCreatePage = lazy(() => import("@/features/users/pages/UserCreatePage"));
const UserDetailPage = lazy(() => import("@/features/users/pages/UserDetailPage"));
const RolesListPage = lazy(() => import("@/features/users/pages/RolesListPage"));
const ProfilePage = lazy(() => import("@/features/users/pages/ProfilePage"));

// Portal
const StudentPortalPage = lazy(() => import("@/features/portal/pages/StudentPortalPage"));
const ParentPortalPage = lazy(() => import("@/features/portal/pages/ParentPortalPage"));

const SettingsPage = lazy(() => import("@/features/settings/pages/SettingsPage"));

import { useAuthStore } from "@/stores/authStore";

function PortalRouter() {
  const user = useAuthStore((s) => s.user);
  if (user?.roles.includes("PARENT")) return <ParentPortalPage />;
  return <StudentPortalPage />;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: "/login", element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: "/", element: <DashboardPage /> },

          // CRM
          { path: "/leads", element: <Lazy><LeadsListPage /></Lazy> },
          { path: "/leads/new", element: <Lazy><LeadCreatePage /></Lazy> },
          { path: "/leads/:id", element: <Lazy><LeadDetailPage /></Lazy> },
          { path: "/students", element: <Lazy><StudentsListPage /></Lazy> },
          { path: "/students/new", element: <Lazy><StudentCreatePage /></Lazy> },
          { path: "/students/:id", element: <Lazy><StudentDetailPage /></Lazy> },
          { path: "/guardians", element: <Lazy><GuardiansListPage /></Lazy> },
          { path: "/guardians/new", element: <Lazy><GuardianCreatePage /></Lazy> },
          { path: "/guardians/:id", element: <Lazy><GuardianDetailPage /></Lazy> },
          { path: "/tasks", element: <Lazy><TasksPage /></Lazy> },

          // Academic
          { path: "/courses", element: <Lazy><CoursesListPage /></Lazy> },
          { path: "/courses/new", element: <Lazy><CourseCreatePage /></Lazy> },
          { path: "/courses/:id", element: <Lazy><CourseDetailPage /></Lazy> },
          { path: "/classes", element: <Lazy><ClassesListPage /></Lazy> },
          { path: "/classes/new", element: <Lazy><ClassCreatePage /></Lazy> },
          { path: "/classes/:id", element: <Lazy><ClassDetailPage /></Lazy> },
          { path: "/enrollments", element: <Lazy><EnrollmentsListPage /></Lazy> },
          { path: "/enrollments/new", element: <Lazy><EnrollmentCreatePage /></Lazy> },
          { path: "/enrollments/:id", element: <Lazy><EnrollmentDetailPage /></Lazy> },
          { path: "/attendance", element: <Lazy><AttendancePage /></Lazy> },
          { path: "/attendance/record", element: <Lazy><AttendanceRecordPage /></Lazy> },
          { path: "/exams", element: <Lazy><ExamsListPage /></Lazy> },
          { path: "/exams/new", element: <Lazy><ExamCreatePage /></Lazy> },
          { path: "/exams/:id", element: <Lazy><ExamDetailPage /></Lazy> },

          // Automation
          { path: "/notifications", element: <Lazy><NotificationsPage /></Lazy> },
          { path: "/communications", element: <Lazy><CommunicationsPage /></Lazy> },
          { path: "/workflows", element: <Lazy><WorkflowsPage /></Lazy> },

          // Reports
          { path: "/reports", element: <Lazy><ReportsPage /></Lazy> },

          // Users & Roles
          { path: "/users", element: <Lazy><UsersListPage /></Lazy> },
          { path: "/users/new", element: <Lazy><UserCreatePage /></Lazy> },
          { path: "/users/:id", element: <Lazy><UserDetailPage /></Lazy> },
          { path: "/roles", element: <Lazy><RolesListPage /></Lazy> },
          { path: "/profile", element: <Lazy><ProfilePage /></Lazy> },

          // Portal
          { path: "/portal", element: <Lazy><PortalRouter /></Lazy> },
        
          { path: "/settings", element: <Lazy><SettingsPage /></Lazy> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
  
]);