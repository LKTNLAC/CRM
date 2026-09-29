import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Guardian, GuardianCreate, GuardianUpdate } from "./types";

export function useGuardians(params: { search?: string } = {}) {
  return useQuery({
    queryKey: ["guardians", params],
    queryFn: async () => {
      const { data } = await api.get<Guardian[]>("/guardians", { params });
      return data;
    },
  });
}

export function useGuardian(id: string | undefined) {
  return useQuery({
    queryKey: ["guardian", id],
    queryFn: async () => {
      const { data } = await api.get<Guardian>(`/guardians/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateGuardian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: GuardianCreate) => {
      const { data } = await api.post<Guardian>("/guardians", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guardians"] }),
  });
}

export function useUpdateGuardian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: GuardianUpdate }) => {
      const { data } = await api.patch<Guardian>(`/guardians/${id}`, payload);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["guardians"] });
      qc.invalidateQueries({ queryKey: ["guardian", vars.id] });
    },
  });
}

export function useGuardianStudents(guardianId: string | undefined) {
  return useQuery({
    queryKey: ["guardian-students", guardianId],
    queryFn: async () => {
      const { data } = await api.get(`/guardians/${guardianId}/students`);
      return data;
    },
    enabled: !!guardianId,
  });
}

export function useLinkGuardianToStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ guardianId, studentId, isPrimary = false }: { guardianId: string; studentId: string; isPrimary?: boolean }) => {
      const { data } = await api.post(`/guardians/students/${studentId}/link`, {
        guardian_id: guardianId,
        is_primary: isPrimary,
      });
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["guardian-students", vars.guardianId] });
    },
  });
}

export function useUnlinkGuardianFromStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ guardianId, studentId }: { guardianId: string; studentId: string }) => {
      await api.delete(`/guardians/${guardianId}/students/${studentId}`);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["guardian-students", vars.guardianId] });
    },
  });
}