import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePermission } from "@/permissions/usePermission";
import { useUsers } from "../services";
import type { User } from "../types";

export default function UsersListPage() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useUsers({ role: role || undefined, search: search || undefined });

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Họ tên",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.full_name}</span>
          <span className="text-xs text-muted-foreground">{r.email}</span>
        </div>
      ),
    },
    {
      key: "roles",
      header: "Vai trò",
      cell: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.roles.map((role) => (
            <Badge key={role} variant="outline" className="text-[10px]">{role}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: "active",
      header: "Trạng thái",
      cell: (r) => <Badge variant={r.is_active ? "success" : "secondary"}>{r.is_active ? "Đang hoạt động" : "Đã khóa"}</Badge>,
    },
    {
      key: "created",
      header: "Ngày tạo",
      cell: (r) => new Date(r.created_at).toLocaleDateString("vi-VN"),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Người dùng"
        description="Quản lý tài khoản và vai trò"
        actions={can("user.create") && (
          <Button asChild><Link to="/users/new"><Plus className="h-4 w-4" /> Thêm người dùng</Link></Button>
        )}
      />
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên / email..." />
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-full md:w-48">
          <option value="">Tất cả vai trò</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="SCHOOL_ADMIN">School Admin</option>
          <option value="ACADEMIC_MANAGER">Academic Manager</option>
          <option value="COUNSELOR">Counselor</option>
          <option value="TEACHER">Teacher</option>
          <option value="ACCOUNTANT">Accountant</option>
          <option value="STUDENT_SERVICE">Student Service</option>
          <option value="STUDENT">Student</option>
          <option value="PARENT">Parent</option>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        onRowClick={(r) => navigate(`/users/${r.id}`)}
        emptyState={<EmptyState icon={UsersIcon} title="Chưa có người dùng nào" />}
      />
    </div>
  );
}