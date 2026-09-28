import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";

export function useStudentProfile() {
  return useQuery({
    queryKey: ["portal-student-me"],
    queryFn: async () => (await api.get("/portal/student/me")).data,
  });
}

export function useStudentClasses() {
  return useQuery({
    queryKey: ["portal-student-classes"],
    queryFn: async () => (await api.get("/portal/student/classes")).data,
  });
}

export function useStudentAttendance() {
  return useQuery({
    queryKey: ["portal-student-attendance"],
    queryFn: async () => (await api.get("/portal/student/attendance")).data,
  });
}

export function useStudentExams() {
  return useQuery({
    queryKey: ["portal-student-exams"],
    queryFn: async () => (await api.get("/portal/student/exams")).data,
  });
}

export function useParentChildren() {
  return useQuery({
    queryKey: ["portal-parent-children"],
    queryFn: async () => (await api.get("/portal/parent/children")).data,
  });
}

export function useChildSchedule(studentId: string | null) {
  return useQuery({
    queryKey: ["portal-child-schedule", studentId],
    queryFn: async () => (await api.get(`/portal/parent/child/${studentId}/schedule`)).data,
    enabled: !!studentId,
  });
}

export function useChildAttendance(studentId: string | null) {
  return useQuery({
    queryKey: ["portal-child-attendance", studentId],
    queryFn: async () => (await api.get(`/portal/parent/child/${studentId}/attendance`)).data,
    enabled: !!studentId,
  });
}