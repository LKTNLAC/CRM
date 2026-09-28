import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Role, User, UserCreate, UserUpdate } from "./types";

export function useUsers(params: { role?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () => {
      const { data } = await api.get<User[]>("/users", { params });
      return data;
    },
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const { data } = await api.get<User>(`/users/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data } = await api.get<Role[]>("/roles");
      return data;
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UserCreate) => {
      const { data } = await api.post<User>("/users", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UserUpdate }) => {
      const { data } = await api.patch<User>(`/users/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useAssignRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role_codes }: { id: string; role_codes: string[] }) => {
      const { data } = await api.post<User>(`/users/${id}/roles`, { role_codes });
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["user", vars.id] });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ id, new_password }: { id: string; new_password: string }) => {
      await api.post(`/users/${id}/reset-password`, { new_password });
    },
  });
}

export function useChangeOwnPassword() {
  return useMutation({
    mutationFn: async (payload: { current_password: string; new_password: string }) => {
      await api.post("/users/me/change-password", payload);
    },
  });
}