import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Link2, Loader2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/PageHeader";
import { usePermission } from "@/permissions/usePermission";
import { api } from "@/services/api";
import { useUsers } from "@/features/users/services";
import { useGuardian } from "../services";
import { useGuardianStudents } from "../services";
import { Badge } from "@/components/ui/badge";

export default function GuardianDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();
  const qc = useQueryClient();

  const { data: guardian, isLoading } = useGuardian(id);
  const { data: users = [] } = useUsers({ role: "PARENT" });

  const { data: students = [] } = useGuardianStudents(id);

  const [linkUserId, setLinkUserId] = useState("");
  const [linking, setLinking] = useState(false);

  if (isLoading || !guardian) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function handleLink() {
    if (!id || !linkUserId) return;
    setLinking(true);
    try {
      await api.post(`/guardians/${id}/link-user`, { user_id: linkUserId });
      toast.success("Đã liên kết tài khoản");
      qc.invalidateQueries({ queryKey: ["guardian", id] });
      setLinkUserId("");
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? "Không liên kết được");
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlink() {
    if (!id) return;
    setLinking(true);
    try {
      await api.delete(`/guardians/${id}/link-user`);
      toast.success("Đã bỏ liên kết");
      qc.invalidateQueries({ queryKey: ["guardian", id] });
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? "Không bỏ được");
    } finally {
      setLinking(false);
    }
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/guardians")}
        className="mb-3 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>

      <PageHeader
        title={guardian.full_name}
        description={guardian.phone}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Card 1: Thông tin */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Họ tên" value={guardian.full_name} />
            <Separator />
            <Row label="Điện thoại" value={guardian.phone} />
            <Separator />
            <Row label="Email" value={guardian.email ?? "—"} />
            <Separator />
            <Row
              label="Quan hệ"
              value={
                guardian.relationship === "father"
                  ? "Bố"
                  : guardian.relationship === "mother"
                  ? "Mẹ"
                  : guardian.relationship === "guardian"
                  ? "Người giám hộ"
                  : guardian.relationship ?? "—"
              }
            />
            <Separator />
            <Row label="Địa chỉ" value={guardian.address ?? "—"} />
          </CardContent>
        </Card>

        {/* Card 2: Tài khoản */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {guardian.user_id ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Đã liên kết</span>
                  <span className="text-xs font-mono">
                    {guardian.user_id.slice(0, 8)}...
                  </span>
                </div>
                {can("guardian.update") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnlink}
                    disabled={linking}
                  >
                    <Unlink className="h-3.5 w-3.5" /> Bỏ liên kết
                  </Button>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Chưa có tài khoản liên kết
                </p>
                {can("guardian.update") && (
                  <div className="space-y-2">
                    <Select
                      value={linkUserId}
                      onChange={(e) => setLinkUserId(e.target.value)}
                    >
                      <option value="">— Chọn user role PARENT —</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.email} — {u.full_name}
                        </option>
                      ))}
                    </Select>
                    <Button
                      size="sm"
                      onClick={handleLink}
                      disabled={!linkUserId || linking}
                    >
                      <Link2 className="h-3.5 w-3.5" /> Liên kết
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Học viên liên kết */}
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Học viên giám hộ ({students.length})</CardTitle>
            </CardHeader>
            <CardContent>
                {students.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                    Chưa có học viên nào được giám hộ.
                </p>
                ) : (
                <ul className="space-y-2">
                    {students.map((s: any) => (
                    <li
                        key={s.student_id}
                        className="flex items-center justify-between rounded-md border px-3 py-2 cursor-pointer hover:bg-secondary/50"
                        onClick={() => navigate(`/students/${s.student_id}`)}
                    >
                        <div className="flex flex-col">
                        <span className="text-sm font-medium">{s.full_name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{s.student_code}</span>
                        </div>
                        {s.is_primary && <Badge variant="info" className="text-[10px]">Chính</Badge>}
                    </li>
                    ))}
                </ul>
                )}
            </CardContent>
            </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}