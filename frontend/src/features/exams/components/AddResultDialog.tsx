import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStudents } from "@/features/students/services";
import { useAddResult } from "../services";

interface Props { examId: string; open: boolean; onOpenChange: (v: boolean) => void; }

export function AddResultDialog({ examId, open, onOpenChange }: Props) {
  const add = useAddResult();
  const { data: students = [] } = useStudents();
  const [studentId, setStudentId] = useState("");
  const [score, setScore] = useState("");
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  function submit() {
    if (!studentId || !score) return toast.error("Chọn học viên và nhập điểm");
    add.mutate(
      {
        examId,
        payload: {
          student_id: studentId,
          score: parseFloat(score),
          grade: grade || null,
          feedback: feedback || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã thêm kết quả");
          setStudentId(""); setScore(""); setGrade(""); setFeedback("");
          onOpenChange(false);
        },
        onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Không thêm được"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Thêm kết quả</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Học viên</Label>
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">— Chọn —</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.student_code} — {s.full_name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Điểm *</Label>
              <Input type="number" step="0.1" value={score} onChange={(e) => setScore(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Xếp loại</Label>
              <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="VD: A, B+" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nhận xét</Label>
            <Input value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={submit} disabled={add.isPending}>Thêm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}