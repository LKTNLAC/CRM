export interface LeadFunnel {
  period_days: number;
  total: number;
  by_status: Record<string, number>;
  enrolled: number;
  conversion_rate: number;
}

export interface LeadBySource {
  source: string;
  total: number;
  enrolled: number;
  conversion_rate: number;
}

export interface LeadByCounselor {
  counselor_id: string;
  total: number;
  enrolled: number;
  conversion_rate: number;
}

export interface AttendanceSummary {
  period_days: number;
  total_sessions: number;
  by_status: Record<string, number>;
  attendance_rate: number;
}

export interface ClassFill {
  class_id: string;
  code: string;
  name: string;
  capacity: number;
  enrolled: number;
  fill_rate: number;
}

export interface ExamDistribution {
  exam_id: string;
  exam_name: string;
  max_score: number;
  count: number;
  avg: number;
  min: number;
  max: number;
  median: number;
  buckets: Record<string, number>;
}

export interface StudentSummary {
  by_status: Record<string, number>;
  total: number;
  new_30d: number;
}

export interface TaskSummary {
  by_status: Record<string, number>;
  total: number;
  overdue: number;
}