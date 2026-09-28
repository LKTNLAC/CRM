export interface Exam {
  id: string;
  class_id: string;
  name: string;
  exam_type: string;
  max_score: number;
  scheduled_at: string | null;
  status: string;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  grade: string | null;
  feedback: string | null;
  published_at: string | null;
}

export interface ExamCreate {
  class_id: string;
  name: string;
  exam_type: string;
  max_score?: number;
  scheduled_at?: string | null;
}

export interface ResultCreate {
  student_id: string;
  score: number;
  grade?: string | null;
  feedback?: string | null;
}

export const EXAM_TYPES = ["QUIZ", "MIDTERM", "FINAL", "PLACEMENT"] as const;