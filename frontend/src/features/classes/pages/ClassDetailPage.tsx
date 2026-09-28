import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { usePermission } from "@/permissions/usePermission";
import { useClass, useClassSchedules } from "../services";
import { ScheduleDialog } from "../components/ScheduleDialog";
import { DAY_NAMES } from "../types";

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();
  const { data: cls, isLoading } = useClass(id);
  const { data: schedules = [] } = useClassSchedules(id);
  const [open, setOpen] = useState(false);

  if (isLoading || !cls) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate("/classes")} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>

      <PageHeader title={cls.name} description={`Mã: ${cls.code}`} />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Trạng thái" value={<StatusBadge status={cls.status} />} />
            <Separator />
            <Row label="Phòng" value={cls.room ?? "—"} />
            <Separator />
            <Row label="Sức chứa" value={cls.capacity} />
            <Separator />
            <Row label="Bắt đầu" value={cls.start_date ?? "—"} />
            <Separator />
            <Row label="Kết thúc" value={cls.end_date ?? "—"} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Lịch học ({schedules.length})</CardTitle>
            {can("schedule.manage") && (
              <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Thêm lịch
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Chưa có lịch học.</p>
            ) : (
              <ul className="space-y-2">
                {schedules.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span className="font-medium">{DAY_NAMES[s.day_of_week]}</span>
                    <span className="font-mono text-xs">{s.start_time} → {s.end_time}</span>
                    <span className="text-muted-foreground text-xs">{s.room ?? "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {id && <ScheduleDialog classId={id} open={open} onOpenChange={setOpen} />}
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