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
import { useClasses } from "@/features/classes/services";
import { useCreateExam } from "../services";
import { EXAM_TYPES } from "../types";

export default function ExamCreatePage() {
  const navigate = useNavigate();
  const create = useCreateExam();
  const { data: classes = [] } = useClasses();
  const [classId, setClassId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("QUIZ");
  const [maxScore, setMaxScore] = useState("100");
  const [scheduled, setScheduled] = useState("");

  function submit() {
    if (!classId || !name) return toast.error("Chọn lớp và nhập tên");
    create.mutate(
      {
        class_id: classId,
        name,
        exam_type: type,
        max_score: parseFloat(maxScore) || 100,
        scheduled_at: scheduled ? new Date(scheduled).toISOString() : null,
      },
      {
        onSuccess: (e) => {
          toast.success("Đã tạo bài kiểm tra");
          navigate(`/exams/${e.id}`);
        },
        onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Không tạo được"),
      }
    );
  }

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/exams")} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>
      <PageHeader title="Thêm bài kiểm tra" />
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Lớp *</Label>
            <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">— Chọn —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tên bài kiểm tra *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Loại</Label>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Điểm tối đa</Label>
              <Input type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Thời gian</Label>
            <Input type="datetime-local" value={scheduled} onChange={(e) => setScheduled(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate("/exams")}>Hủy</Button>
            <Button onClick={submit} disabled={create.isPending}>Tạo</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}