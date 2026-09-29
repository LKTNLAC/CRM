import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Archive, ArrowLeft, Link2, Loader2, Pencil, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { usePermission } from "@/permissions/usePermission";
import { api } from "@/services/api";
import { useUsers } from "@/features/users/services";
import { useArchiveStudent, useStudent, useUpdateStudent } from "../services";
import type { Student } from "../types";

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();
  const qc = useQueryClient();

  const { data: student, isLoading } = useStudent(id);
  const { data: users = [] } = useUsers({ role: "STUDENT" });
  const archive = useArchiveStudent();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
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
          <div className="flex gap-2">
            {can("student.update") && (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" /> Chỉnh sửa
              </Button>
            )}
            {can("student.archive") && student.status !== "ARCHIVED" && (
              <Button variant="outline" onClick={() => setConfirmOpen(true)}>
                <Archive className="h-4 w-4" /> Lưu trữ
              </Button>
            )}
          </div>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Enrollment, attendance, exam sẽ hiển thị ở Phase sau.
            </p>
          </CardContent>
        </Card>
      </div>

      {student && (
        <EditStudentDialog
          student={student}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}

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

function EditStudentDialog({
  student,
  open,
  onOpenChange,
}: {
  student: Student;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const update = useUpdateStudent();
  const form = useForm({
    defaultValues: {
      full_name: student.full_name,
      email: student.email ?? "",
      phone: student.phone ?? "",
      date_of_birth: student.date_of_birth ?? "",
      gender: student.gender ?? "",
    },
  });

  const onSubmit = form.handleSubmit((v) => {
    update.mutate(
      {
        id: student.id,
        payload: {
          full_name: v.full_name,
          email: v.email || null,
          phone: v.phone || null,
          date_of_birth: v.date_of_birth || null,
          gender: v.gender || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật học viên");
          onOpenChange(false);
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.error?.message ?? "Không cập nhật được"),
      }
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa học viên</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Họ tên *</Label>
            <Input {...form.register("full_name")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...form.register("email")} />
            </div>
            <div className="space-y-2">
              <Label>Điện thoại</Label>
              <Input {...form.register("phone")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Ngày sinh</Label>
              <Input type="date" {...form.register("date_of_birth")} />
            </div>
            <div className="space-y-2">
              <Label>Giới tính</Label>
              <Select {...form.register("gender")}>
                <option value="">— Chọn —</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}