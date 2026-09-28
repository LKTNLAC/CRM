import { useState } from "react";
import { GraduationCap, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useChildAttendance, useChildSchedule, useParentChildren } from "../services";

const DAY_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

export default function ParentPortalPage() {
  const { data: children = [], isLoading } = useParentChildren();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-64" />;

  if (children.length === 0) {
    return (
      <Card>
        <EmptyState icon={Users} title="Chưa có con nào được liên kết" description="Liên hệ nhà trường để liên kết tài khoản." />
      </Card>
    );
  }

  const selected = selectedId ?? children[0].student_id;

  return (
    <div>
      <PageHeader title="Portal phụ huynh" description="Theo dõi việc học của con" />

      {children.length > 1 && (
        <Tabs value={selected} onValueChange={setSelectedId}>
          <TabsList>
            {children.map((c: any) => (
              <TabsTrigger key={c.student_id} value={c.student_id}>{c.full_name}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <div className="mt-4">
        <ChildDetail child={children.find((c: any) => c.student_id === selected) ?? children[0]} />
      </div>
    </div>
  );
}

function ChildDetail({ child }: { child: any }) {
  const { data: schedule = [] } = useChildSchedule(child.student_id);
  const { data: attendance = [] } = useChildAttendance(child.student_id);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold">{child.full_name}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">{child.student_code}</p>
            </div>
            <div className="flex gap-2">
              {child.is_primary && <Badge variant="info">Chính</Badge>}
              <StatusBadge status={child.status} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Lịch học</TabsTrigger>
          <TabsTrigger value="attendance">Điểm danh</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Card>
            <CardContent className="p-0">
              {schedule.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">Chưa có lịch học.</p>
              ) : (
                <ul className="divide-y">
                  {schedule.map((s: any, i: number) => (
                    <li key={i} className="flex items-center justify-between p-3 text-sm">
                      <span className="font-medium">{DAY_NAMES[s.day_of_week]}</span>
                      <span className="font-mono text-xs">{s.start_time} → {s.end_time}</span>
                      <span className="text-muted-foreground text-xs">{s.class_name}</span>
                      <span className="text-muted-foreground text-xs">{s.room ?? "—"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardContent className="p-0">
              {attendance.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">Chưa có điểm danh.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-3 text-xs uppercase text-muted-foreground">Ngày</th>
                      <th className="text-left p-3 text-xs uppercase text-muted-foreground">Trạng thái</th>
                      <th className="text-left p-3 text-xs uppercase text-muted-foreground">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a: any) => (
                      <tr key={a.id} className="border-b last:border-0">
                        <td className="p-3">{new Date(a.session_date).toLocaleDateString("vi-VN")}</td>
                        <td className="p-3"><StatusBadge status={a.status} /></td>
                        <td className="p-3 text-muted-foreground">{a.note ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}