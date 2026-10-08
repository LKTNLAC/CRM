import { useState } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAuthStore } from "@/stores/authStore";
import { useChangeOwnPassword } from "../services";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const change = useChangeOwnPassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");

  function submit() {
    if (next.length < 12) return toast.error("Mật khẩu mới tối thiểu 12 ký tự");
    change.mutate(
      { current_password: current, new_password: next },
      {
        onSuccess: () => {
          toast.success("Đã đổi mật khẩu");
          setCurrent("");
          setNext("");
        },
        onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Không đổi được"),
      }
    );
  }

  return (
    <div>
      <PageHeader title="Hồ sơ" description="Thông tin tài khoản và đổi mật khẩu" />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Họ tên</span>
              <span className="font-medium">{user?.full_name}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Vai trò</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {user?.roles.map((r) => <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Đổi mật khẩu</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Mật khẩu hiện tại</Label>
              <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Mật khẩu mới (tối thiểu 12 ký tự)</Label>
              <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
            </div>
            <Button onClick={submit} disabled={change.isPending || !current || !next}>
              <KeyRound className="h-4 w-4" /> Đổi mật khẩu
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tùy chọn thông báo</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link to="/settings/notifications">
                <Bell className="h-4 w-4" />
                Cấu hình thông báo
              </Link>
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}