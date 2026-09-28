import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Exam, ExamCreate, ExamResult, ResultCreate } from "./types";

export function useExams(params: { class_id?: string; status?: string } = {}) {
  return useQuery({
    queryKey: ["exams", params],
    queryFn: async () => {
      const { data } = await api.get<Exam[]>("/exams", { params });
      return data;
    },
  });
}

export function useExam(id: string | undefined) {
  return useQuery({
    queryKey: ["exam", id],
    queryFn: async () => {
      const { data } = await api.get<Exam>(`/exams/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useExamResults(id: string | undefined) {
  return useQuery({
    queryKey: ["exam-results", id],
    queryFn: async () => {
      const { data } = await api.get<ExamResult[]>(`/exams/${id}/results`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ExamCreate) => {
      const { data } = await api.post<Exam>("/exams", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
}

export function useAddResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ examId, payload }: { examId: string; payload: ResultCreate }) => {
      const { data } = await api.post<ExamResult>(`/exams/${examId}/results`, payload);
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["exam-results", vars.examId] }),
  });
}

export function usePublishExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<Exam>(`/exams/${id}`, { status: "PUBLISHED" });
      return data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      qc.invalidateQueries({ queryKey: ["exam", id] });
    },
  });
}