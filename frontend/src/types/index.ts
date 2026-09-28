export interface User {
  id: string;
  email: string;
  full_name: string;
  organization_id: string;
  branch_id: string | null;
  roles: string[];
}