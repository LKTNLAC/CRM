import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Enrollment, EnrollmentClass, EnrollmentCreate, EnrollmentTransfer } from "./types";

export function useEnrollments(params: { student_id?: string; status?: string } = {}) {
  return useQuery({
    queryKey: ["enrollments", params],
    queryFn: async () => {
      const { data } = await api.get<Enrollment[]>("/enrollments", { params });
      return data;
    },
  });
}

export function useEnrollment(id: string | undefined) {
  return useQuery({
    queryKey: ["enrollment", id],
    queryFn: async () => {
      const { data } = await api.get<Enrollment>(`/enrollments/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useEnrollmentClasses(id: string | undefined) {
  return useQuery({
    queryKey: ["enrollment-classes", id],
    queryFn: async () => {
      const { data } = await api.get<EnrollmentClass[]>(`/enrollments/${id}/classes`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EnrollmentCreate) => {
      const { data } = await api.post<Enrollment>("/enrollments", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["enrollments"] }),
  });
}

export function useTransferEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: EnrollmentTransfer }) => {
      const { data } = await api.post<Enrollment>(`/enrollments/${id}/transfer`, payload);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["enrollments"] });
      qc.invalidateQueries({ queryKey: ["enrollment", vars.id] });
      qc.invalidateQueries({ queryKey: ["enrollment-classes", vars.id] });
    },
  });
}

export function useCancelEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Enrollment>(`/enrollments/${id}/cancel`);
      return data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["enrollments"] });
      qc.invalidateQueries({ queryKey: ["enrollment", id] });
    },
  });
}