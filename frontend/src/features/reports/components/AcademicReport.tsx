import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttendanceSummary, useClassFill } from "../services";

export function AcademicReport() {
  const { data: att, isLoading: l1 } = useAttendanceSummary(30);
  const { data: fill = [], isLoading: l2 } = useClassFill(20);

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase">Buổi học</p>
            <p className="text-2xl font-semibold mt-1">{l1 ? "—" : att?.total_sessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase">Tỉ lệ có mặt</p>
            <p className="text-2xl font-semibold mt-1">{l1 ? "—" : `${att?.attendance_rate}%`}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase">Vắng mặt</p>
            <p className="text-2xl font-semibold mt-1">{l1 ? "—" : att?.by_status?.ABSENT ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Điểm danh theo trạng thái</CardTitle></CardHeader>
        <CardContent>
          {l1 ? <Skeleton className="h-64" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={Object.entries(att?.by_status ?? {}).map(([k, v]) => ({ name: k, value: v }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Tỉ lệ lấp đầy lớp</CardTitle></CardHeader>
        <CardContent>
          {l2 ? <Skeleton className="h-64" /> : fill.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Chưa có dữ liệu</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={fill} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="code" type="category" fontSize={11} tickLine={false} axisLine={false} width={100} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="fill_rate" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="% lấp đầy" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}