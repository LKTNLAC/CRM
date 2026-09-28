import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Communication, CommunicationCreate } from "./types";

export function useCommunications(params: { channel?: string; status?: string } = {}) {
  return useQuery({
    queryKey: ["communications", params],
    queryFn: async () => {
      const { data } = await api.get<Communication[]>("/communications", { params });
      return data;
    },
  });
}

export function useCreateCommunication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CommunicationCreate) => {
      const { data } = await api.post<Communication>("/communications", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["communications"] }),
  });
}