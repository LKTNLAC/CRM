import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { useStudents } from "@/features/students/services";
import { useCourses } from "@/features/courses/services";
import { useClasses } from "@/features/classes/services";
import { useCreateEnrollment } from "../services";

export default function EnrollmentCreatePage() {
  const navigate = useNavigate();
  const create = useCreateEnrollment();
  const { data: students = [] } = useStudents();
  const { data: courses = [] } = useCourses();
  const [courseId, setCourseId] = useState("");
  const { data: classes = [] } = useClasses({ course_id: courseId || undefined });

  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  function submit() {
    if (!studentId || !courseId || !classId) return toast.error("Chọn học viên, khóa học, lớp");
    create.mutate(
      { student_id: studentId, course_id: courseId, class_id: classId, start_date: startDate, note: note || null },
      {
        onSuccess: (e) => {
          toast.success("Đã ghi danh");
          navigate(`/enrollments/${e.id}`);
        },
        onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Không ghi danh được"),
      }
    );
  }

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/enrollments")} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>
      <PageHeader title="Thêm ghi danh" />
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Học viên *</Label>
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">— Chọn —</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.student_code} — {s.full_name}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Khóa học *</Label>
            <Select value={courseId} onChange={(e) => { setCourseId(e.target.value); setClassId(""); }}>
              <option value="">— Chọn —</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Lớp *</Label>
            <Select value={classId} onChange={(e) => setClassId(e.target.value)} disabled={!courseId}>
              <option value="">— Chọn —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ngày bắt đầu *</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate("/enrollments")}>Hủy</Button>
            <Button onClick={submit} disabled={create.isPending}>Ghi danh</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}