export interface Notification {
  id: string;
  notification_type: string;
  title: string;
  body: string | null;
  related_type: string | null;
  related_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}