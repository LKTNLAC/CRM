import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type {
  AttendanceSummary,
  ClassFill,
  LeadByCounselor,
  LeadBySource,
  LeadFunnel,
  StudentSummary,
  TaskSummary,
} from "./types";

export function useLeadFunnel(days = 30) {
  return useQuery({
    queryKey: ["report-sales-funnel", days],
    queryFn: async () => {
      const { data } = await api.get<LeadFunnel>("/reports/sales/funnel", { params: { days } });
      return data;
    },
  });
}

export function useLeadBySource(days = 30) {
  return useQuery({
    queryKey: ["report-sales-source", days],
    queryFn: async () => {
      const { data } = await api.get<LeadBySource[]>("/reports/sales/by-source", { params: { days } });
      return data;
    },
  });
}

export function useLeadByCounselor(days = 30) {
  return useQuery({
    queryKey: ["report-sales-counselor", days],
    queryFn: async () => {
      const { data } = await api.get<LeadByCounselor[]>("/reports/sales/by-counselor", { params: { days } });
      return data;
    },
  });
}

export function useAttendanceSummary(days = 30) {
  return useQuery({
    queryKey: ["report-academic-attendance", days],
    queryFn: async () => {
      const { data } = await api.get<AttendanceSummary>("/reports/academic/attendance", { params: { days } });
      return data;
    },
  });
}

export function useClassFill(limit = 20) {
  return useQuery({
    queryKey: ["report-class-fill", limit],
    queryFn: async () => {
      const { data } = await api.get<ClassFill[]>("/reports/academic/class-fill", { params: { limit } });
      return data;
    },
  });
}

export function useStudentSummary() {
  return useQuery({
    queryKey: ["report-student-summary"],
    queryFn: async () => {
      const { data } = await api.get<StudentSummary>("/reports/students/summary");
      return data;
    },
  });
}

export function useTaskSummary() {
  return useQuery({
    queryKey: ["report-task-summary"],
    queryFn: async () => {
      const { data } = await api.get<TaskSummary>("/reports/tasks/summary");
      return data;
    },
  });
}