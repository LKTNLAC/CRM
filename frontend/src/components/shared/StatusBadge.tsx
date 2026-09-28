import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
  // Lead
  NEW: "info",
  CONTACTED: "info",
  QUALIFIED: "warning",
  CONSULTING: "warning",
  TRIAL: "warning",
  OFFER: "warning",
  ENROLLED: "success",
  LOST: "destructive",
  // Student
  ACTIVE: "success",
  INACTIVE: "secondary",
  ARCHIVED: "secondary",
  // Task
  OPEN: "info",
  IN_PROGRESS: "warning",
  DONE: "success",
  CANCELLED: "secondary",
  OVERDUE: "destructive",
  // Generic
  PENDING: "warning",
  SUCCESS: "success",
  FAILED: "destructive",
};

const LABEL: Record<string, string> = {
  NEW: "Mới",
  CONTACTED: "Đã liên hệ",
  QUALIFIED: "Tiềm năng",
  CONSULTING: "Tư vấn",
  TRIAL: "Học thử",
  OFFER: "Đề xuất",
  ENROLLED: "Đã ghi danh",
  LOST: "Mất",
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Ngừng",
  ARCHIVED: "Đã lưu trữ",
  OPEN: "Mở",
  IN_PROGRESS: "Đang làm",
  DONE: "Hoàn thành",
  CANCELLED: "Đã hủy",
  OVERDUE: "Quá hạn",
  PENDING: "Chờ",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "outline"}>
      {LABEL[status] ?? status}
    </Badge>
  );
}