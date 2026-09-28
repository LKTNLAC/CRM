export interface Communication {
  id: string;
  channel: string;
  recipient: string;
  subject: string | null;
  body: string;
  status: string;
  error: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface CommunicationCreate {
  channel: string;
  recipient: string;
  subject?: string | null;
  body: string;
  related_type?: string | null;
  related_id?: string | null;
}

export const CHANNELS = ["EMAIL", "SMS", "ZALO", "PUSH"] as const;