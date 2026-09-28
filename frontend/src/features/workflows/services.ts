import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Workflow, WorkflowExecution } from "./types";

export function useWorkflows() {
  return useQuery({
    queryKey: ["workflows"],
    queryFn: async () => {
      const { data } = await api.get<Workflow[]>("/workflows");
      return data;
    },
  });
}

export function useExecutions(params: { limit?: number } = {}) {
  return useQuery({
    queryKey: ["workflow-executions", params],
    queryFn: async () => {
      const { data } = await api.get<WorkflowExecution[]>("/workflows/executions", { params });
      return data;
    },
    refetchInterval: 10_000,
  });
}

export function useToggleWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      await api.post(`/workflows/${id}/${enabled ? "enable" : "disable"}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });
}