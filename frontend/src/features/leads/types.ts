export interface Lead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  score: number;
  counselor_id: string | null;
  converted_student_id: string | null;
  converted_at: string | null;
  created_at: string;
}

export interface LeadCreate {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  campaign?: string | null;
  note?: string | null;
}

export interface LeadStatusUpdate {
  status: string;
  note?: string | null;
  lost_reason?: string | null;
}

export interface LeadConvertRequest {
  student_code?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
}

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CONSULTING",
  "TRIAL",
  "OFFER",
  "ENROLLED",
  "LOST",
] as const;

export const LEAD_SOURCES = [
  "Facebook",
  "Google",
  "Referral",
  "Walk-in",
  "Zalo",
  "TikTok",
  "Other",
] as const;