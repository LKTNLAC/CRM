import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePermission } from "@/permissions/usePermission";
import { useClasses } from "../services";
import { useCourses } from "@/features/courses/services";
import type { Class } from "../types";

export default function ClassesListPage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [status, setStatus] = useState("");
  const [courseId, setCourseId] = useState("");
  const { data = [], isLoading } = useClasses({
    status: status || undefined,
    course_id: courseId || undefined,
  });
  const { data: courses = [] } = useCourses();

  const columns: Column<Class>[] = [
    { key: "code", header: "Mã", cell: (r) => <span className="font-mono text-xs">{r.code}</span>, className: "w-28" },
    { key: "name", header: "Tên lớp", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "room", header: "Phòng", cell: (r) => r.room ?? "—" },
    { key: "capacity", header: "Sức chứa", cell: (r) => r.capacity, className: "w-24 text-center" },
    { key: "status", header: "Trạng thái", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Lớp học"
        description="Danh sách lớp học đang mở"
        actions={can("class.create") && (
          <Button asChild>
            <Link to="/classes/new"><Plus className="h-4 w-4" /> Thêm lớp</Link>
          </Button>
        )}
      />
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full md:w-64">
          <option value="">Tất cả khóa học</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full md:w-48">
          <option value="">Tất cả trạng thái</option>
          <option value="PLANNED">Dự kiến</option>
          <option value="OPEN">Đang mở</option>
          <option value="ACTIVE">Đang học</option>
          <option value="CLOSED">Đã đóng</option>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        onRowClick={(r) => navigate(`/classes/${r.id}`)}
        emptyState={<EmptyState icon={CalendarDays} title="Chưa có lớp nào" />}
      />
    </div>
  );
}