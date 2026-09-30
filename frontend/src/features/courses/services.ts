import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Course, CourseCreate, CourseLevel, LevelCreate } from "./types";

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data } = await api.get<Course[]>("/courses");
      return data;
    },
  });
}

export function useCourse(id: string | undefined) {
  return useQuery({
    queryKey: ["course", id],
    queryFn: async () => {
      const { data } = await api.get<Course>(`/courses/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CourseCreate) => {
      const { data } = await api.post<Course>("/courses", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useCourseLevels(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course-levels", courseId],
    queryFn: async () => {
      const { data } = await api.get<CourseLevel[]>(`/courses/${courseId}/levels`);
      return data;
    },
    enabled: !!courseId,
  });
}

export function useCreateLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, payload }: { courseId: string; payload: LevelCreate }) => {
      const { data } = await api.post<CourseLevel>(`/courses/${courseId}/levels`, payload);
      return data;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["course-levels", vars.courseId] }),
  });
}
export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Course> }) => {
      const { data } = await api.patch<Course>(`/courses/${id}`, payload);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["course", vars.id] });
    },
  });
}

export function useUpdateLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      courseId,
      levelId,
      payload,
    }: {
      courseId: string;
      levelId: string;
      payload: Partial<LevelCreate>;
    }) => {
      const { data } = await api.patch<CourseLevel>(
        `/courses/${courseId}/levels/${levelId}`,
        payload
      );
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["course-levels", vars.courseId] });
    },
  });
}

export function useDeleteLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, levelId }: { courseId: string; levelId: string }) => {
      await api.delete(`/courses/${courseId}/levels/${levelId}`);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["course-levels", vars.courseId] });
    },
  });
}