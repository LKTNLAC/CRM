import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePermission } from "@/permissions/usePermission";
import { useCourses } from "../services";
import type { Course } from "../types";

export default function CoursesListPage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const { data = [], isLoading } = useCourses();

  const columns: Column<Course>[] = [
    { key: "code", header: "Mã", cell: (r) => <span className="font-mono text-xs">{r.code}</span>, className: "w-24" },
    { key: "name", header: "Tên khóa học", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "lang", header: "Ngôn ngữ", cell: (r) => r.language ?? "—" },
    {
      key: "active",
      header: "Trạng thái",
      cell: (r) => <Badge variant={r.is_active ? "success" : "secondary"}>{r.is_active ? "Đang mở" : "Đóng"}</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Khóa học"
        description="Danh sách khóa học của trường"
        actions={
          can("course.create") && (
            <Button asChild>
              <Link to="/courses/new">
                <Plus className="h-4 w-4" /> Thêm khóa học
              </Link>
            </Button>
          )
        }
      />
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        onRowClick={(r) => navigate(`/courses/${r.id}`)}
        emptyState={<EmptyState icon={BookOpen} title="Chưa có khóa học nào" />}
      />
    </div>
  );
}