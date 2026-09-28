import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Archive, ArrowLeft, Link2, Loader2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { usePermission } from "@/permissions/usePermission";
import { api } from "@/services/api";
import { useUsers } from "@/features/users/services";
import { useArchiveStudent, useStudent } from "../services";

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();
  const qc = useQueryClient();

  const { data: student, isLoading } = useStudent(id);
  const { data: users = [] } = useUsers({ role: "STUDENT" });
  const archive = useArchiveStudent();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [linkUserId, setLinkUserId] = useState("");
  const [linking, setLinking] = useState(false);

  if (isLoading || !student) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  function handleArchive() {
    if (!id) return;
    archive.mutate(id, {
      onSuccess: () => {
        toast.success("Đã lưu trữ học viên");
        setConfirmOpen(false);
        navigate("/students");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error?.message ?? "Không lưu trữ được");
      },
    });
  }

  async function handleLink() {
    if (!id || !linkUserId) return;
    setLinking(true);
    try {
      await api.post(`/students/${id}/link-user`, { user_id: linkUserId });
      toast.success("Đã liên kết tài khoản");
      qc.invalidateQueries({ queryKey: ["student", id] });
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
      await api.delete(`/students/${id}/link-user`);
      toast.success("Đã bỏ liên kết");
      qc.invalidateQueries({ queryKey: ["student", id] });
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
        onClick={() => navigate("/students")}
        className="mb-3 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>

      <PageHeader
        title={student.full_name}
        description={`${student.student_code} · ${student.email ?? student.phone ?? "—"}`}
        actions={
          can("student.archive") &&
          student.status !== "ARCHIVED" && (
            <Button variant="outline" onClick={() => setConfirmOpen(true)}>
              <Archive className="h-4 w-4" /> Lưu trữ
            </Button>
          )
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Card 1: Thông tin cơ bản */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Trạng thái" value={<StatusBadge status={student.status} />} />
            <Separator />
            <Row
              label="Mã HV"
              value={<span className="font-mono text-xs">{student.student_code}</span>}
            />
            <Separator />
            <Row label="Email" value={student.email ?? "—"} />
            <Separator />
            <Row label="Điện thoại" value={student.phone ?? "—"} />
            <Separator />
            <Row label="Ngày sinh" value={student.date_of_birth ?? "—"} />
            <Separator />
            <Row
              label="Giới tính"
              value={
                student.gender === "male"
                  ? "Nam"
                  : student.gender === "female"
                  ? "Nữ"
                  : student.gender ?? "—"
              }
            />
            <Separator />
            <Row
              label="Ngày tạo"
              value={new Date(student.created_at).toLocaleString("vi-VN")}
            />
          </CardContent>
        </Card>

        {/* Card 2: Tài khoản */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {student.user_id ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Đã liên kết</span>
                  <span className="text-xs font-mono">
                    {student.user_id.slice(0, 8)}...
                  </span>
                </div>
                {can("student.update") && (
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
                {can("student.update") && (
                  <div className="space-y-2">
                    <Select
                      value={linkUserId}
                      onChange={(e) => setLinkUserId(e.target.value)}
                    >
                      <option value="">— Chọn user role STUDENT —</option>
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

        {/* Card 3: Hoạt động */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Enrollment, attendance, exam sẽ hiển thị ở Phase 12.
            </p>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Lưu trữ học viên?"
        description="Học viên sẽ không còn hiển thị trong danh sách mặc định."
        confirmLabel="Lưu trữ"
        destructive
        loading={archive.isPending}
        onConfirm={handleArchive}
      />
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