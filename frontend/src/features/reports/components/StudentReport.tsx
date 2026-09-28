import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentSummary, useTaskSummary } from "../services";

const COLORS = ["#10b981", "#f59e0b", "#6b7280"];

export function StudentReport() {
  const { data: student, isLoading: l1 } = useStudentSummary();
  const { data: task, isLoading: l2 } = useTaskSummary();

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase">Tổng học viên</p>
            <p className="text-2xl font-semibold mt-1">{l1 ? "—" : student?.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase">Mới 30 ngày</p>
            <p className="text-2xl font-semibold mt-1">{l1 ? "—" : student?.new_30d}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase">Task của tôi</p>
            <p className="text-2xl font-semibold mt-1">{l2 ? "—" : task?.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase">Quá hạn</p>
            <p className="text-2xl font-semibold mt-1 text-destructive">{l2 ? "—" : task?.overdue}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Học viên theo trạng thái</CardTitle></CardHeader>
          <CardContent>
            {l1 ? <Skeleton className="h-64" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={Object.entries(student?.by_status ?? {}).map(([k, v]) => ({ name: k, value: v }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {Object.keys(student?.by_status ?? {}).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Task theo trạng thái</CardTitle></CardHeader>
          <CardContent>
            {l2 ? <Skeleton className="h-64" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={Object.entries(task?.by_status ?? {}).map(([k, v]) => ({ name: k, value: v }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}