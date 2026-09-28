import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { usePermission } from "@/permissions/usePermission";
import { useExam, useExamResults, usePublishExam } from "../services";
import { AddResultDialog } from "../components/AddResultDialog";

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();
  const { data: exam, isLoading } = useExam(id);
  const { data: results = [] } = useExamResults(id);
  const publish = usePublishExam();
  const [open, setOpen] = useState(false);

  if (isLoading || !exam) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate("/exams")} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>

      <PageHeader
        title={exam.name}
        description={`${exam.exam_type} · Điểm tối đa: ${exam.max_score}`}
        actions={
          <div className="flex gap-2">
            <StatusBadge status={exam.status} />
            {can("exam.update") && exam.status === "DRAFT" && (
              <Button
                variant="outline"
                onClick={() =>
                  publish.mutate(exam.id, {
                    onSuccess: () => toast.success("Đã công bố"),
                  })
                }
                disabled={publish.isPending}
              >
                <Send className="h-4 w-4" /> Công bố
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Kết quả ({results.length})</CardTitle>
          {can("exam_result.update") && (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Thêm kết quả
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Chưa có kết quả.</p>
          ) : (
            <ul className="space-y-2">
              {results.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="font-mono text-xs">{r.student_id.slice(0, 8)}...</span>
                  <span className="font-medium">{r.score} / {exam.max_score}</span>
                  <span className="text-muted-foreground">{r.grade ?? "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {id && <AddResultDialog examId={id} open={open} onOpenChange={setOpen} />}
    </div>
  );
}