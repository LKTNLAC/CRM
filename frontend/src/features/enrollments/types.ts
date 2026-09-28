export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  level_id: string | null;
  status: string;
  start_date: string;
  end_date: string | null;
}

export interface EnrollmentClass {
  id: string;
  enrollment_id: string;
  class_id: string;
  joined_at: string;
  left_at: string | null;
  left_reason: string | null;
  status: string;
}

export interface EnrollmentCreate {
  student_id: string;
  course_id: string;
  level_id?: string | null;
  class_id: string;
  start_date: string;
  note?: string | null;
}

export interface EnrollmentTransfer {
  new_class_id: string;
  transfer_date: string;
  reason?: string | null;
}