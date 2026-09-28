import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Attendance, AttendanceBulkRecord } from "./types";

export function useAttendance(params: { class_id?: string; student_id?: string; session_date?: string } = {}) {
  return useQuery({
    queryKey: ["attendance", params],
    queryFn: async () => {
      const { data } = await api.get<Attendance[]>("/attendance", { params });
      return data;
    },
    enabled: !!(params.class_id || params.student_id),
  });
}

export function useBulkRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AttendanceBulkRecord) => {
      const { data } = await api.post<{ created: number }>("/attendance/bulk", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

export function useCorrectAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, new_status, reason }: { id: string; new_status: string; reason?: string }) => {
      const { data } = await api.post<Attendance>(`/attendance/${id}/correct`, { new_status, reason });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}