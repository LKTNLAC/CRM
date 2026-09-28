import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useClasses } from "@/features/classes/services";
import { usePermission } from "@/permissions/usePermission";
import { useAttendance } from "../services";
import { ATTENDANCE_LABELS, type Attendance } from "../types";

export default function AttendancePage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const { data: classes = [] } = useClasses();
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState("");

  const { data = [], isLoading } = useAttendance({
    class_id: classId || undefined,
    session_date: date || undefined,
  });

  const columns: Column<Attendance>[] = [
    { key: "student", header: "Học viên", cell: (r) => <span className="font-mono text-xs">{r.student_id.slice(0, 8)}...</span> },
    { key: "date", header: "Ngày", cell: (r) => new Date(r.session_date).toLocaleDateString("vi-VN") },
    { key: "status", header: "Trạng thái", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "note", header: "Ghi chú", cell: (r) => r.note ?? "—" },
  ];

  return (
    <div>
      <PageHeader
        title="Điểm danh"
        description="Xem và ghi điểm danh"
        actions={can("attendance.create") && classId && (
          <Button onClick={() => navigate(`/attendance/record?class_id=${classId}`)}>
            <Plus className="h-4 w-4" /> Ghi điểm danh
          </Button>
        )}
      />

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full md:w-64">
          <option value="">— Chọn lớp —</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
        </Select>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full md:w-48" />
      </div>

      {!classId ? (
        <EmptyState icon={ClipboardCheck} title="Chọn lớp để xem điểm danh" />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          loading={isLoading}
          emptyState={<EmptyState icon={ClipboardCheck} title="Chưa có điểm danh" />}
        />
      )}
    </div>
  );
}