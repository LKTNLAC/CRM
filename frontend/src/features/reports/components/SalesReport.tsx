import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadByCounselor, useLeadBySource, useLeadFunnel } from "../services";

const COLORS = ["#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#6366f1"];

export function SalesReport() {
  const { data: funnel, isLoading: l1 } = useLeadFunnel(30);
  const { data: bySource = [], isLoading: l2 } = useLeadBySource(30);
  const { data: byCounselor = [], isLoading: l3 } = useLeadByCounselor(30);

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase">Tổng leads</p>
            <p className="text-2xl font-semibold mt-1">{l1 ? "—" : funnel?.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase">Đã ghi danh</p>
            <p className="text-2xl font-semibold mt-1">{l1 ? "—" : funnel?.enrolled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase">Tỉ lệ chuyển đổi</p>
            <p className="text-2xl font-semibold mt-1">{l1 ? "—" : `${funnel?.conversion_rate}%`}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Phễu theo trạng thái</CardTitle></CardHeader>
        <CardContent>
          {l1 ? <Skeleton className="h-64" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={Object.entries(funnel?.by_status ?? {}).map(([k, v]) => ({ name: k, value: v }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Theo nguồn</CardTitle></CardHeader>
          <CardContent>
            {l2 ? <Skeleton className="h-64" /> : bySource.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">Chưa có dữ liệu</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={bySource}
                    dataKey="total"
                    nameKey="source"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {bySource.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Theo counselor</CardTitle></CardHeader>
          <CardContent>
            {l3 ? <Skeleton className="h-64" /> : byCounselor.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">Chưa có dữ liệu</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byCounselor.map((c) => ({ name: c.counselor_id.slice(0, 8), total: c.total, enrolled: c.enrolled }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Tổng" />
                  <Bar dataKey="enrolled" fill="#10b981" radius={[4, 4, 0, 0]} name="Ghi danh" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}