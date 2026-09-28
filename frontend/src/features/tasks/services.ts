import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Task, TaskCreate } from "./types";

export function useTasks(params: { status?: string; assignee_id?: string } = {}) {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: async () => {
      const { data } = await api.get<Task[]>("/tasks", { params });
      return data;
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TaskCreate) => {
      const { data } = await api.post<Task>("/tasks", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Task> }) => {
      const { data } = await api.patch<Task>(`/tasks/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}