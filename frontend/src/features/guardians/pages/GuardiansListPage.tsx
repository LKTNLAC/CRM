import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePermission } from "@/permissions/usePermission";
import { useGuardians } from "../services";
import type { Guardian } from "../types";
import { useNavigate } from "react-router-dom";

export default function GuardiansListPage() {
  const { can } = usePermission();
  const navigate = useNavigate(); 
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useGuardians({ search: search || undefined });

  const columns: Column<Guardian>[] = [
    { key: "name", header: "Họ tên", cell: (r) => <span className="font-medium">{r.full_name}</span> },
    { key: "phone", header: "Điện thoại", cell: (r) => r.phone },
    { key: "email", header: "Email", cell: (r) => r.email ?? "—" },
    { key: "relation", header: "Quan hệ", cell: (r) => r.relationship ?? "—" },
  ];

  return (
    <div>
      <PageHeader
        title="Phụ huynh"
        description="Người giám hộ của học viên"
        actions={
          can("guardian.create") && (
            <Button asChild>
              <Link to="/guardians/new">
                <Plus className="h-4 w-4" /> Thêm phụ huynh
              </Link>
            </Button>
          )
        }
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên..." />
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        onRowClick={(r) => navigate(`/guardians/${r.id}`)} 
        emptyState={
          <EmptyState
            icon={UserCircle}
            title="Chưa có phụ huynh nào"
            description="Thêm phụ huynh để liên kết với học viên."
          />
        }
      />
    </div>
  );
}