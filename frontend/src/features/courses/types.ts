export interface Course {
  id: string;
  code: string;
  name: string;
  description: string | null;
  language: string | null;
  is_active: boolean;
}

export interface CourseLevel {
  id: string;
  course_id: string;
  code: string;
  name: string;
  sequence: number;
  duration_hours: number | null;
}

export interface CourseCreate {
  code: string;
  name: string;
  description?: string | null;
  language?: string | null;
}

export interface LevelCreate {
  code: string;
  name: string;
  sequence?: number;
  duration_hours?: number | null;
}