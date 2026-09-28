import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { usePermission } from "@/permissions/usePermission";
import { useAssignRoles, useResetPassword, useRoles, useUser } from "../services";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();
  const { data: user, isLoading } = useUser(id);
  const { data: roles = [] } = useRoles();
  const assign = useAssignRoles();
  const reset = useResetPassword();
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  function toggleRole(code: string, checked: boolean) {
    if (!id) return;
    const current = user!.roles;
    const next = checked ? [...current, code] : current.filter((c) => c !== code);
    assign.mutate(
      { id, role_codes: next },
      {
        onSuccess: () => toast.success("Đã cập nhật vai trò"),
        onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Không cập nhật được"),
      }
    );
  }

  function handleReset() {
    if (!id || newPassword.length < 12) return toast.error("Mật khẩu tối thiểu 12 ký tự");
    reset.mutate(
      { id, new_password: newPassword },
      {
        onSuccess: () => {
          toast.success("Đã đặt lại mật khẩu");
          setNewPassword("");
          setResetOpen(false);
        },
        onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Không đặt lại được"),
      }
    );
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate("/users")} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>

      <PageHeader
        title={user.full_name}
        description={user.email}
        actions={
          can("user.update") && (
            <Button variant="outline" onClick={() => setResetOpen(true)}>
              <KeyRound className="h-4 w-4" /> Đặt lại mật khẩu
            </Button>
          )
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Email" value={user.email} />
            <Separator />
            <Row label="Trạng thái" value={<Badge variant={user.is_active ? "success" : "secondary"}>{user.is_active ? "Hoạt động" : "Đã khóa"}</Badge>} />
            <Separator />
            <Row label="Ngày tạo" value={new Date(user.created_at).toLocaleString("vi-VN")} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Vai trò</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {roles.map((role) => {
                const checked = user.roles.includes(role.code);
                return (
                  <label
                    key={role.id}
                    className="flex items-start gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-secondary/50"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={!can("user.update") || assign.isPending}
                      onChange={(e) => toggleRole(role.code, e.target.checked)}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{role.code}</span>
                      <span className="text-xs text-muted-foreground">{role.name}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Đặt lại mật khẩu</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Mật khẩu mới (tối thiểu 12 ký tự)</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Hủy</Button>
            <Button onClick={handleReset} disabled={reset.isPending}>Đặt lại</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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