import { useState } from "react";
import { BookOpen, Calendar, FileText, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  useStudentAttendance,
  useStudentClasses,
  useStudentExams,
  useStudentProfile,
} from "../services";

const DAY_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

export default function StudentPortalPage() {
  const { data: profile, isLoading } = useStudentProfile();
  const { data: classes = [] } = useStudentClasses();
  const { data: attendance = [] } = useStudentAttendance();
  const { data: exams = [] } = useStudentExams();

  if (isLoading || !profile) {
    return <Skeleton className="h-64" />;
  }

  return (
    <div>
      <PageHeader
        title={`Xin chào, ${profile.full_name}`}
        description={`${profile.student_code} · ${profile.status}`}
      />

      <Tabs defaultValue="classes">
        <TabsList>
          <TabsTrigger value="classes">Lớp học</TabsTrigger>
          <TabsTrigger value="attendance">Điểm danh</TabsTrigger>
          <TabsTrigger value="exams">Kết quả</TabsTrigger>
        </TabsList>

        <TabsContent value="classes">
          {classes.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Chưa có lớp học nào.</CardContent></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {classes.map((c: any) => (
                <Card key={c.class_id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{c.class_name}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">{c.class_code}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    {c.room && <p className="text-xs text-muted-foreground mt-2">Phòng: {c.room}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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

        <TabsContent value="exams">
          {exams.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Chưa có kết quả.</CardContent></Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {exams.map((e: any) => (
                <Card key={e.exam_id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{e.exam_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{e.exam_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold">{e.score}</p>
                        <p className="text-xs text-muted-foreground">/ {e.max_score}</p>
                      </div>
                    </div>
                    {e.grade && <Badge variant="outline" className="mt-2">{e.grade}</Badge>}
                    {e.feedback && <p className="text-xs text-muted-foreground mt-2">{e.feedback}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}