import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { ArrowLeft, Link2, Loader2, Pencil, Plus, Unlink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { usePermission } from "@/permissions/usePermission";
import { api } from "@/services/api";
import { useUsers } from "@/features/users/services";
import { useStudents } from "@/features/students/services";
import {
  useGuardian,
  useGuardianStudents,
  useLinkGuardianToStudent,
  useUnlinkGuardianFromStudent,
  useUpdateGuardian,
} from "../services";
import type { Guardian, GuardianUpdate } from "../types";

export default function GuardianDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();
  const qc = useQueryClient();

  const { data: guardian, isLoading } = useGuardian(id);
  const { data: students = [] } = useGuardianStudents(id);
  const { data: users = [] } = useUsers({ role: "PARENT" });
  const unlink = useUnlinkGuardianFromStudent();

  const [editOpen, setEditOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUserId, setLinkUserId] = useState("");
  const [linking, setLinking] = useState(false);

  if (isLoading || !guardian) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function handleLinkUser() {
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

  async function handleUnlinkUser() {
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

  function handleUnlinkStudent(studentId: string) {
    if (!id) return;
    unlink.mutate(
      { guardianId: id, studentId },
      {
        onSuccess: () => toast.success("Đã bỏ liên kết với học viên"),
        onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Không bỏ được"),
      }
    );
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate("/guardians")} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>

      <PageHeader
        title={guardian.full_name}
        description={guardian.phone}
        actions={
          can("guardian.update") && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Chỉnh sửa
            </Button>
          )
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {guardian.user_id ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Đã liên kết</span>
                  <span className="text-xs font-mono">{guardian.user_id.slice(0, 8)}...</span>
                </div>
                {can("guardian.update") && (
                  <Button variant="outline" size="sm" onClick={handleUnlinkUser} disabled={linking}>
                    <Unlink className="h-3.5 w-3.5" /> Bỏ liên kết
                  </Button>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Chưa có tài khoản liên kết</p>
                {can("guardian.update") && (
                  <div className="space-y-2">
                    <Select value={linkUserId} onChange={(e) => setLinkUserId(e.target.value)}>
                      <option value="">— Chọn user role PARENT —</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.email} — {u.full_name}
                        </option>
                      ))}
                    </Select>
                    <Button size="sm" onClick={handleLinkUser} disabled={!linkUserId || linking}>
                      <Link2 className="h-3.5 w-3.5" /> Liên kết
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Học viên giám hộ ({students.length})</CardTitle>
            {can("guardian.update") && (
              <Button size="sm" variant="outline" onClick={() => setLinkOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Thêm
              </Button>
            )}
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
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div
                      className="flex flex-col cursor-pointer flex-1"
                      onClick={() => navigate(`/students/${s.student_id}`)}
                    >
                      <span className="text-sm font-medium">{s.full_name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{s.student_code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.is_primary && <Badge variant="info" className="text-[10px]">Chính</Badge>}
                      {can("guardian.update") && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleUnlinkStudent(s.student_id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {guardian && (
        <EditGuardianDialog
          guardian={guardian}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}

      {id && (
        <LinkStudentDialog
          guardianId={id}
          open={linkOpen}
          onOpenChange={setLinkOpen}
        />
      )}
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

function EditGuardianDialog({
  guardian,
  open,
  onOpenChange,
}: {
  guardian: Guardian;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const update = useUpdateGuardian();
  const form = useForm<GuardianUpdate>({
    defaultValues: {
      full_name: guardian.full_name,
      email: guardian.email ?? "",
      phone: guardian.phone,
      relationship: guardian.relationship ?? "",
      address: guardian.address ?? "",
    },
  });

  const onSubmit = form.handleSubmit((v) => {
    update.mutate(
      {
        id: guardian.id,
        payload: {
          full_name: v.full_name,
          email: v.email || null,
          phone: v.phone,
          relationship: v.relationship || null,
          address: v.address || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật");
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
          <DialogTitle>Chỉnh sửa phụ huynh</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Họ tên *</Label>
            <Input {...form.register("full_name")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Điện thoại *</Label>
              <Input {...form.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...form.register("email")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Quan hệ</Label>
            <Select {...form.register("relationship")}>
              <option value="">— Chọn —</option>
              <option value="father">Bố</option>
              <option value="mother">Mẹ</option>
              <option value="guardian">Người giám hộ</option>
              <option value="other">Khác</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Địa chỉ</Label>
            <Input {...form.register("address")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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

function LinkStudentDialog({
  guardianId,
  open,
  onOpenChange,
}: {
  guardianId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const link = useLinkGuardianToStudent();
  const { data: students = [] } = useStudents();
  const [studentId, setStudentId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  function submit() {
    if (!studentId) return toast.error("Chọn học viên");
    link.mutate(
      { guardianId, studentId, isPrimary },
      {
        onSuccess: () => {
          toast.success("Đã liên kết");
          setStudentId("");
          setIsPrimary(false);
          onOpenChange(false);
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.error?.message ?? "Không liên kết được"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Liên kết học viên</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Học viên</Label>
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">— Chọn —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.student_code} — {s.full_name}
                </option>
              ))}
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
            />
            Là người giám hộ chính
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={submit} disabled={link.isPending || !studentId}>
            Liên kết
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}