import { useQuery } from "@tanstack/react-query";
import { Users, GraduationCap, CalendarDays, CheckSquare, TrendingUp } from "lucide-react";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
  total_leads: number;
  new_leads_30d: number;
  active_students: number;
  active_classes: number;
  my_open_tasks: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-semibold mt-1.5 tabular-nums">{value}</p>
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          </div>
          <div className="rounded-lg bg-secondary p-2 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await api.get<DashboardData>("/reports/dashboard");
      return data;
    },
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tổng quan hoạt động của trường
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng leads"
          value={data.total_leads}
          icon={Users}
          hint={`+${data.new_leads_30d} trong 30 ngày`}
        />
        <StatCard label="Học viên đang học" value={data.active_students} icon={GraduationCap} />
        <StatCard label="Lớp đang mở" value={data.active_classes} icon={CalendarDays} />
        <StatCard label="Task của tôi" value={data.my_open_tasks} icon={CheckSquare} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
              Biểu đồ sẽ có ở Phase 13
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trạng thái hệ thống</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">API</span>
              <Badge variant="success">Online</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Database</span>
              <Badge variant="success">Online</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Redis</span>
              <Badge variant="success">Online</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Workers</span>
              <Badge variant="warning">Idle</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}