import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { useEnrollments } from "@/features/enrollments/services";
import { useStudents } from "@/features/students/services";
import { useBulkRecord } from "../services";
import { ATTENDANCE_STATUSES, ATTENDANCE_LABELS } from "../types";

interface Row {
  student_id: string;
  student_name: string;
  status: string;
  note: string;
}

export default function AttendanceRecordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const classId = params.get("class_id") ?? "";
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Row[]>([]);
  const bulk = useBulkRecord();

  const { data: students = [] } = useStudents();
  const { data: enrollments = [] } = useEnrollments();

  useEffect(() => {
    if (!classId) return;
    // Filter students by enrollments — đơn giản: hiển thị tất cả học viên ACTIVE
    const list = students
      .filter((s) => s.status === "ACTIVE")
      .map((s) => ({
        student_id: s.id,
        student_name: `${s.student_code} — ${s.full_name}`,
        status: "PRESENT",
        note: "",
      }));
    setRows(list);
  }, [classId, students, enrollments]);

  function submit() {
    if (!classId) return toast.error("Thiếu class_id");
    bulk.mutate(
      {
        class_id: classId,
        session_date: date,
        records: rows.map((r) => ({ student_id: r.student_id, status: r.status, note: r.note || undefined })),
      },
      {
        onSuccess: (res) => {
          toast.success(`Đã ghi ${res.created} bản ghi`);
          navigate("/attendance");
        },
        onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Không ghi được"),
      }
    );
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate("/attendance")} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>

      <PageHeader title="Ghi điểm danh" description={`Lớp: ${classId.slice(0, 8)}...`} />

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2 max-w-xs">
            <Label>Ngày</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Chưa có học viên.</p>
            ) : (
              rows.map((r, i) => (
                <div key={r.student_id} className="grid grid-cols-12 gap-2 items-center border-b pb-2">
                  <div className="col-span-6 text-sm font-medium truncate">{r.student_name}</div>
                  <div className="col-span-3">
                    <Select
                      value={r.status}
                      onChange={(e) => {
                        const copy = [...rows];
                        copy[i].status = e.target.value;
                        setRows(copy);
                      }}
                    >
                      {ATTENDANCE_STATUSES.map((s) => (
                        <option key={s} value={s}>{ATTENDANCE_LABELS[s]}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input
                      placeholder="Ghi chú"
                      value={r.note}
                      onChange={(e) => {
                        const copy = [...rows];
                        copy[i].note = e.target.value;
                        setRows(copy);
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={submit} disabled={bulk.isPending || rows.length === 0}>
              Lưu điểm danh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}