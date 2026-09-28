import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Guardian, GuardianCreate } from "./types";

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