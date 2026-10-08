import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Notification } from "./types";

export function useNotifications(params: { is_read?: boolean } = {}) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: async () => {
      const { data } = await api.get<Notification[]>("/notifications", { params });
      return data;
    },
    refetchInterval: 30_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notifications/${id}/read`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ marked: number }>("/notifications/read-all");
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const { data } = await api.get<Notification[]>("/notifications", { params: { is_read: false } });
      return data.length;
    },
    refetchInterval: 30_000,
  });
}

export interface ChannelPref {
  channel: string;
  channel_label: string;
  enabled: boolean;
  locked: boolean;
}

export interface TypePref {
  notification_type: string;
  type_label: string;
  channels: ChannelPref[];
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const { data } = await api.get<TypePref[]>("/notifications/preferences");
      return data;
    },
  });
}

export function useUpdateNotificationPreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      notification_type: string;
      channel: string;
      enabled: boolean;
    }) => {
      await api.post("/notifications/preferences", payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-preferences"] }),
  });
}