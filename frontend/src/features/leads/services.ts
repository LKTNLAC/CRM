import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Lead, LeadConvertRequest, LeadCreate, LeadStatusUpdate } from "./types";

export function useLeads(params: { status?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ["leads", params],
    queryFn: async () => {
      const { data } = await api.get<Lead[]>("/leads", { params });
      return data;
    },
  });
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: async () => {
      const { data } = await api.get<Lead>(`/leads/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: LeadCreate) => {
      const { data } = await api.post<Lead>("/leads", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: LeadStatusUpdate }) => {
      const { data } = await api.post<Lead>(`/leads/${id}/status`, payload);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", vars.id] });
    },
  });
}

export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: LeadConvertRequest }) => {
      const { data } = await api.post<{ student_id: string; already_converted: boolean }>(
        `/leads/${id}/convert`,
        payload
      );
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", vars.id] });
    },
  });
}