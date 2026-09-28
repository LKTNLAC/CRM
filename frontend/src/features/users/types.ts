export interface User {
  id: string;
  email: string;
  full_name: string;
  organization_id: string;
  branch_id: string | null;
  roles: string[];
  is_active: boolean;
  created_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
  role_codes: string[];
}

export interface UserUpdate {
  full_name?: string;
  is_active?: boolean;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  permissions: string[];
}