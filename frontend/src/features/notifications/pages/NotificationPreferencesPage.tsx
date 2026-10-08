import { toast } from "sonner";
import { Bell, Loader2, Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  useNotificationPreferences,
  useUpdateNotificationPreference,
} from "../services";

const CHANNELS = [
  { code: "IN_APP", label: "Trong ứng dụng" },
  { code: "EMAIL", label: "Email" },
  { code: "SMS", label: "SMS" },
  { code: "PUSH", label: "Push" },
];

export default function NotificationPreferencesPage() {
  const { data = [], isLoading } = useNotificationPreferences();
  const update = useUpdateNotificationPreference();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  function handleToggle(
    notificationType: string,
    channel: string,
    enabled: boolean
  ) {
    update.mutate(
      { notification_type: notificationType, channel, enabled },
      {
        onSuccess: () => toast.success("Đã cập nhật"),
        onError: (err: any) =>
          toast.error(err?.response?.data?.error?.message ?? "Không cập nhật được"),
      }
    );
  }

  return (
    <div>
      <PageHeader
        title="Cài đặt thông báo"
        description="Chọn loại thông báo và kênh bạn muốn nhận"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Tùy chọn thông báo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Header row */}
          <div className="grid grid-cols-5 gap-2 pb-3 border-b mb-2">
            <div className="text-xs font-medium text-muted-foreground uppercase">
              Loại thông báo
            </div>
            {CHANNELS.map((c) => (
              <div
                key={c.code}
                className="text-xs font-medium text-muted-foreground uppercase text-center"
              >
                {c.label}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {data.map((pref) => (
            <div
              key={pref.notification_type}
              className="grid grid-cols-5 gap-2 items-center py-3 border-b last:border-0"
            >
              <div className="text-sm font-medium">{pref.type_label}</div>
              {pref.channels.map((ch) => (
                <div key={ch.channel} className="flex justify-center">
                  {ch.locked ? (
                    <div
                      className="flex items-center justify-center h-5 w-9 rounded-full bg-muted"
                      title="Không thể tắt"
                    >
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    </div>
                  ) : (
                    <Switch
                      checked={ch.enabled}
                      onCheckedChange={(checked) =>
                        handleToggle(
                          pref.notification_type,
                          ch.channel,
                          checked
                        )
                      }
                      disabled={update.isPending}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}