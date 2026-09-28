export interface Student {
  id: string;
  student_code: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  status: string;
  counselor_id: string | null;
  user_id: string | null;
  created_at: string;
}

export interface StudentCreate {
  full_name: string;
  student_code?: string | null;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  counselor_id?: string | null;
}