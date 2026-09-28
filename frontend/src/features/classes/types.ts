export interface Class {
  id: string;
  course_id: string;
  level_id: string | null;
  code: string;
  name: string;
  room: string | null;
  capacity: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

export interface ClassCreate {
  course_id: string;
  level_id?: string | null;
  code: string;
  name: string;
  room?: string | null;
  capacity?: number;
  start_date?: string | null;
  end_date?: string | null;
}

export interface ClassSchedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  status: string;
}

export interface ScheduleCreate {
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string | null;
}

export interface TeacherAssign {
  teacher_id: string;
  role?: string;
  from_date: string;
}

export const DAY_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];