import { Link, useNavigate } from "react-router-dom";
import { ClipboardCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePermission } from "@/permissions/usePermission";
import { useEnrollments, useStudentMap } from "../services";
import type { Enrollment } from "../types";

export default function EnrollmentsListPage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const { data = [], isLoading } = useEnrollments();
  const studentMap = useStudentMap();

  const columns: Column<Enrollment>[] = [
    {
      key: "student",
      header: "Học viên",
      cell: (r) => {
        const s = studentMap.get(r.student_id);
        return s ? (
          <div className="flex flex-col">
            <span className="font-medium">{s.name}</span>
            <span className="text-xs text-muted-foreground font-mono">{s.code}</span>
          </div>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">
            {r.student_id.slice(0, 8)}...
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Trạng thái",
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "start",
      header: "Bắt đầu",
      cell: (r) => new Date(r.start_date).toLocaleDateString("vi-VN"),
    },
    {
      key: "end",
      header: "Kết thúc",
      cell: (r) =>
        r.end_date ? new Date(r.end_date).toLocaleDateString("vi-VN") : "—",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Ghi danh"
        description="Danh sách ghi danh học viên vào khóa học"
        actions={
          can("enrollment.create") && (
            <Button asChild>
              <Link to="/enrollments/new">
                <Plus className="h-4 w-4" /> Thêm ghi danh
              </Link>
            </Button>
          )
        }
      />
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        onRowClick={(r) => navigate(`/enrollments/${r.id}`)}
        emptyState={<EmptyState icon={ClipboardCheck} title="Chưa có ghi danh nào" />}
      />
    </div>
  );
}