export interface Attendance {
  id: string;
  class_id: string;
  student_id: string;
  session_date: string;
  status: string;
  note: string | null;
}

export interface AttendanceRecord {
  class_id: string;
  student_id: string;
  session_date: string;
  status: string;
  note?: string | null;
}

export interface AttendanceBulkRecord {
  class_id: string;
  session_date: string;
  records: Array<{ student_id: string; status: string; note?: string }>;
}

export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;

export const ATTENDANCE_LABELS: Record<string, string> = {
  PRESENT: "Có mặt",
  ABSENT: "Vắng",
  LATE: "Muộn",
  EXCUSED: "Có phép",
};