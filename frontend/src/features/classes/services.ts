import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Class, ClassCreate, ClassSchedule, ScheduleCreate, TeacherAssign } from "./types";

export function useClasses(params: { status?: string; course_id?: string } = {}) {
  return useQuery({
    queryKey: ["classes", params],
    queryFn: async () => {
      const { data } = await api.get<Class[]>("/classes", { params });
      return data;
    },
  });
}

export function useClass(id: string | undefined) {
  return useQuery({
    queryKey: ["class", id],
    queryFn: async () => {
      const { data } = await api.get<Class>(`/classes/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useClassSchedules(classId: string | undefined) {
  return useQuery({
    queryKey: ["class-schedules", classId],
    queryFn: async () => {
      const { data } = await api.get<ClassSchedule[]>(`/classes/${classId}/schedules`);
      return data;
    },
    enabled: !!classId,
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ClassCreate) => {
      const { data } = await api.post<Class>("/classes", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useAddSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, payload }: { classId: string; payload: ScheduleCreate }) => {
      const { data } = await api.post<ClassSchedule>(`/classes/${classId}/schedules`, payload);
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["class-schedules", vars.classId] }),
  });
}

export function useAssignTeacher() {
  return useMutation({
    mutationFn: async ({ classId, payload }: { classId: string; payload: TeacherAssign }) => {
      const { data } = await api.post(`/classes/${classId}/teachers`, payload);
      return data;
    },
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Class> }) => {
      const { data } = await api.patch<Class>(`/classes/${id}`, payload);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["class", vars.id] });
    },
  });
}

