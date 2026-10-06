import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePermission } from "@/permissions/usePermission";
import { useLeads } from "../services";
import { LEAD_STATUSES, type Lead } from "../types";
import { ExportButton } from "@/components/shared/ExportButton";

export default function LeadsListPage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const { data = [], isLoading } = useLeads({
    status: status || undefined,
    search: search || undefined,
  });

  const columns: Column<Lead>[] = [
    {
      key: "name",
      header: "Họ tên",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.full_name}</span>
          <span className="text-xs text-muted-foreground">{row.phone ?? row.email ?? "—"}</span>
        </div>
      ),
    },
    { key: "source", header: "Nguồn", cell: (row) => row.source ?? "—" },
    { key: "status", header: "Trạng thái", cell: (row) => <StatusBadge status={row.status} /> },
    { key: "score", header: "Điểm", cell: (row) => row.score, className: "w-16 text-center" },
    {
      key: "created",
      header: "Ngày tạo",
      cell: (row) => new Date(row.created_at).toLocaleDateString("vi-VN"),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Quản lý khách hàng tiềm năng"
        actions={
          <div className="flex gap-2">
            {can("lead.read") && (
              <ExportButton
                endpoint="/export/leads"
                filenamePrefix={`leads_${new Date().toISOString().slice(0, 10)}`}
              />
            )}
            {can("lead.create") && (
              <Button asChild>
                <Link to="/leads/new">
                  <Plus className="h-4 w-4" /> Thêm lead
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên..." />
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full md:w-48"
        >
          <option value="">Tất cả trạng thái</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        onRowClick={(row) => navigate(`/leads/${row.id}`)}
        emptyState={
          <EmptyState
            icon={Users}
            title="Chưa có lead nào"
            description="Bắt đầu bằng cách thêm lead đầu tiên."
          />
        }
      />
    </div>
  );
}