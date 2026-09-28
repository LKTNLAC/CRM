import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useClasses } from "@/features/classes/services";
import { usePermission } from "@/permissions/usePermission";
import { useExams } from "../services";
import type { Exam } from "../types";

export default function ExamsListPage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [classId, setClassId] = useState("");
  const { data: classes = [] } = useClasses();
  const { data = [], isLoading } = useExams({ class_id: classId || undefined });

  const columns: Column<Exam>[] = [
    { key: "name", header: "Tên bài kiểm tra", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "type", header: "Loại", cell: (r) => r.exam_type },
    { key: "max", header: "Điểm tối đa", cell: (r) => r.max_score, className: "w-28 text-center" },
    { key: "status", header: "Trạng thái", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Kiểm tra"
        description="Bài kiểm tra và kết quả"
        actions={can("exam.create") && (
          <Button asChild><Link to="/exams/new"><Plus className="h-4 w-4" /> Thêm bài kiểm tra</Link></Button>
        )}
      />
      <div className="mb-4 max-w-md">
        <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Tất cả lớp</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        onRowClick={(r) => navigate(`/exams/${r.id}`)}
        emptyState={<EmptyState icon={FileText} title="Chưa có bài kiểm tra nào" />}
      />
    </div>
  );
}