import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePermission } from "@/permissions/usePermission";
import { useStudents } from "../services";
import type { Student } from "../types";
import { ExportButton } from "@/components/shared/ExportButton";

export default function StudentsListPage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data = [], isLoading } = useStudents({
    status: status || undefined,
    search: search || undefined,
  });

  const columns: Column<Student>[] = [
    { key: "code", header: "Mã HV", cell: (r) => <span className="font-mono text-xs">{r.student_code}</span> },
    {
      key: "name",
      header: "Họ tên",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.full_name}</span>
          <span className="text-xs text-muted-foreground">{r.email ?? r.phone ?? "—"}</span>
        </div>
      ),
    },
    { key: "status", header: "Trạng thái", cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "created",
      header: "Ngày tạo",
      cell: (r) => new Date(r.created_at).toLocaleDateString("vi-VN"),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Học viên"
        description="Danh sách học viên đang theo học"
        actions={
          <div className="flex gap-2">
            {can("student.read") && (
              <ExportButton
                endpoint="/export/students"
                filenamePrefix={`students_${new Date().toISOString().slice(0, 10)}`}
              />
            )}
            {can("student.create") && (
              <Button asChild>
                <Link to="/students/new">
                  <Plus className="h-4 w-4" /> Thêm học viên
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên hoặc mã..." />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full md:w-48">
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Ngừng</option>
          <option value="ARCHIVED">Đã lưu trữ</option>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        onRowClick={(r) => navigate(`/students/${r.id}`)}
        emptyState={
          <EmptyState
            icon={GraduationCap}
            title="Chưa có học viên nào"
            description="Thêm học viên hoặc chuyển lead thành học viên."
          />
        }
      />
    </div>
  );
}