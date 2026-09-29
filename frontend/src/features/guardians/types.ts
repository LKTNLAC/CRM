export interface Guardian {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  relationship: string | null;
  address: string | null;
  user_id: string | null;
}

export interface GuardianCreate {
  full_name: string;
  email?: string | null;
  phone: string;
  relationship?: string | null;
  address?: string | null;
  note?: string | null;
}

export interface GuardianUpdate {
  full_name?: string;
  email?: string | null;
  phone?: string;
  relationship?: string | null;
  address?: string | null;
  note?: string | null;
}

export interface GuardianStudent {
  student_id: string;
  student_code: string;
  full_name: string;
  status: string;
  is_primary: boolean;
}