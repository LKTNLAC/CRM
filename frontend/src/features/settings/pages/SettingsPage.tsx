import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAuthStore } from "@/stores/authStore";
import { usePermission } from "@/permissions/usePermission";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { can } = usePermission();

  const { data: health } = useQuery({
    queryKey: ["system-health"],
    queryFn: async () => {
      const { data } = await api.get("/ready");
      return data;
    },
    refetchInterval: 30_000,
  });

  const { data: integrations } = useQuery({
    queryKey: ["integrations-health"],
    queryFn: async () => {
      const { data } = await api.get("/integrations/health");
      return data;
    },
    enabled: can("integration.read"),
  });

  return (
    <div>
      <PageHeader title="Cài đặt" description="Thông tin hệ thống và cấu hình" />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Email" value={user?.email ?? "—"} />
            <Separator />
            <Row label="Họ tên" value={user?.full_name ?? "—"} />
            <Separator />
            <Row
              label="Vai trò"
              value={
                <div className="flex flex-wrap gap-1 justify-end">
                  {user?.roles.map((r) => (
                    <Badge key={r} variant="outline" className="text-[10px]">
                      {r}
                    </Badge>
                  ))}
                </div>
              }
            />
            <Separator />
            <Row label="Organization" value={<span className="font-mono text-xs">{user?.organization_id.slice(0, 8)}...</span>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trạng thái hệ thống</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row
              label="API"
              value={<Badge variant={health?.status === "ok" ? "success" : "warning"}>{health?.status ?? "—"}</Badge>}
            />
            <Separator />
            <Row
              label="Database"
              value={
                <Badge variant={health?.checks?.db ? "success" : "destructive"}>
                  {health?.checks?.db ? "Online" : "Offline"}
                </Badge>
              }
            />
            <Separator />
            <Row
              label="Redis"
              value={
                <Badge variant={health?.checks?.redis ? "success" : "destructive"}>
                  {health?.checks?.redis ? "Online" : "Offline"}
                </Badge>
              }
            />
          </CardContent>
        </Card>

        {integrations && can("integration.read") && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Tích hợp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {Object.entries(integrations.channels ?? {}).map(([channel, status]: any) => (
                <div key={channel}>
                  <Row
                    label={channel}
                    value={
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{status.detail}</span>
                        <Badge variant={status.healthy ? "success" : "secondary"}>
                          {status.healthy ? "OK" : "Chưa cấu hình"}
                        </Badge>
                      </div>
                    }
                  />
                  <Separator className="mt-3" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
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