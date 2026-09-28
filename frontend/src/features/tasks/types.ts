export interface Task {
  id: string;
  task_type: string;
  title: string;
  description: string | null;
  assignee_id: string;
  related_type: string | null;
  related_id: string | null;
  priority: string;
  status: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface TaskCreate {
  task_type: string;
  title: string;
  description?: string | null;
  assignee_id: string;
  related_type?: string | null;
  related_id?: string | null;
  priority?: string;
  due_at?: string | null;
}

export const TASK_TYPES = [
  "CALL_LEAD",
  "FOLLOW_UP",
  "CALL_PARENT",
  "RENEWAL",
  "PAYMENT_REMINDER",
  "STUDENT_SUPPORT",
  "ACADEMIC_INTERVENTION",
  "CUSTOM",
] as const;