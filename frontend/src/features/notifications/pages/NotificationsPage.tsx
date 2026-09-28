import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import { useMarkAllRead, useMarkRead, useNotifications } from "../services";

export default function NotificationsPage() {
  const { data = [], isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  const unreadCount = data.filter((n) => !n.is_read).length;

  return (
    <div>
      <PageHeader
        title="Thông báo"
        description={unreadCount > 0 ? `${unreadCount} chưa đọc` : "Tất cả đã đọc"}
        actions={
          unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() =>
                markAll.mutate(undefined, {
                  onSuccess: () => toast.success("Đã đánh dấu tất cả đã đọc"),
                })
              }
              disabled={markAll.isPending}
            >
              <CheckCheck className="h-4 w-4" /> Đánh dấu tất cả
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <Card>
          <EmptyState icon={Bell} title="Không có thông báo nào" />
        </Card>
      ) : (
        <div className="space-y-2">
          {data.map((n) => (
            <Card
              key={n.id}
              className={cn("cursor-pointer transition-colors", !n.is_read && "border-primary/30 bg-primary/5")}
              onClick={() => {
                if (!n.is_read) markRead.mutate(n.id);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5 h-2 w-2 rounded-full shrink-0", n.is_read ? "bg-transparent" : "bg-primary")} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{n.title}</p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(n.created_at).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
                    <Badge variant="outline" className="mt-2 text-[10px]">
                      {n.notification_type}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}