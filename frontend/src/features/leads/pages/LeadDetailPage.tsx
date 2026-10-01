import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LeadStatusPipeline } from "../components/LeadStatusPipeline";
import { ConvertLeadDialog } from "../components/ConvertLeadDialog";
import { useLead, useUpdateLeadStatus } from "../services";

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lead, isLoading } = useLead(id);
  const updateStatus = useUpdateLeadStatus();
  const [convertOpen, setConvertOpen] = useState(false);

  if (isLoading || !lead) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  function handleStatusChange(status: string) {
    if (!id) return;
    updateStatus.mutate(
      { id, payload: { status } },
      {
        onSuccess: () => toast.success("Đã cập nhật trạng thái"),
        onError: (err: any) =>
          toast.error(err?.response?.data?.error?.message ?? "Không cập nhật được"),
      }
    );
  }

  const canConvert = lead.status !== "ENROLLED" && lead.status !== "LOST";

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate("/leads")} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>

      <PageHeader
        title={lead.full_name}
        description={`Lead · ${lead.phone ?? lead.email ?? "—"}`}
        actions={
          canConvert && (
            <Button onClick={() => setConvertOpen(true)}>
              <UserCheck className="h-4 w-4" /> Chuyển thành học viên
            </Button>
          )
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadStatusPipeline
              current={lead.status}
              onChange={handleStatusChange}
              disabled={updateStatus.isPending}
            />
            {lead.status === "ENROLLED" && (
              <div className="mt-3 rounded-md bg-blue-500/10 border border-blue-500/30 px-3 py-2 text-xs text-blue-700 dark:text-blue-400">
                ℹ️ Lead đã ghi danh thành công. Trạng thái không thể thay đổi.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Trạng thái" value={<StatusBadge status={lead.status} />} />
            <Separator />
            <Row label="Email" value={lead.email ?? "—"} />
            <Separator />
            <Row label="Điện thoại" value={lead.phone ?? "—"} />
            <Separator />
            <Row label="Nguồn" value={lead.source ?? "—"} />
            <Separator />
            <Row label="Điểm" value={lead.score} />
            <Separator />
            <Row
              label="Ngày tạo"
              value={new Date(lead.created_at).toLocaleString("vi-VN")}
            />
            {lead.converted_student_id && (
              <>
                <Separator />
                <Row
                  label="Học viên"
                  value={
                    <button
                      onClick={() => navigate(`/students/${lead.converted_student_id}`)}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Xem học viên
                    </button>
                  }
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {id && (
        <ConvertLeadDialog leadId={id} open={convertOpen} onOpenChange={setConvertOpen} />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}