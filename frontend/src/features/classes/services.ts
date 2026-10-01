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

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      classId,
      scheduleId,
      payload,
    }: {
      classId: string;
      scheduleId: string;
      payload: Partial<ScheduleCreate>;
    }) => {
      const { data } = await api.patch<ClassSchedule>(
        `/classes/${classId}/schedules/${scheduleId}`,
        payload
      );
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["class-schedules", vars.classId] });
    },
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, scheduleId }: { classId: string; scheduleId: string }) => {
      await api.delete(`/classes/${classId}/schedules/${scheduleId}`);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["class-schedules", vars.classId] });
    },
  });
}

export function useClassTeachers(classId: string | undefined) {
  return useQuery({
    queryKey: ["class-teachers", classId],
    queryFn: async () => {
      const { data } = await api.get(`/classes/${classId}/teachers`);
      return data;
    },
    enabled: !!classId,
  });
}

export function useAssignTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, payload }: { classId: string; payload: TeacherAssign }) => {
      const { data } = await api.post(`/classes/${classId}/teachers`, payload);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["class-teachers", vars.classId] });
    },
  });
}

export function useUnassignTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, teacherId }: { classId: string; teacherId: string }) => {
      await api.delete(`/classes/${classId}/teachers/${teacherId}`);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["class-teachers", vars.classId] });
    },
  });
}

