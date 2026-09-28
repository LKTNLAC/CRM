import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRightLeft, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { usePermission } from "@/permissions/usePermission";
import { useClasses } from "@/features/classes/services";
import { useCancelEnrollment, useEnrollment, useEnrollmentClasses, useTransferEnrollment } from "../services";

export default function EnrollmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();
  const { data: e, isLoading } = useEnrollment(id);
  const { data: history = [] } = useEnrollmentClasses(id);
  const cancel = useCancelEnrollment();
  const [transferOpen, setTransferOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (isLoading || !e) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isActive = e.status === "ACTIVE";

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate("/enrollments")} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>

      <PageHeader
        title="Chi tiết ghi danh"
        description={`ID: ${e.id.slice(0, 8)}...`}
        actions={isActive && (
          <div className="flex gap-2">
            {can("enrollment.update") && (
              <Button variant="outline" onClick={() => setTransferOpen(true)}>
                <ArrowRightLeft className="h-4 w-4" /> Chuyển lớp
              </Button>
            )}
            {can("enrollment.cancel") && (
              <Button variant="outline" onClick={() => setCancelOpen(true)}>
                <XCircle className="h-4 w-4" /> Hủy
              </Button>
            )}
          </div>
        )}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Trạng thái" value={<StatusBadge status={e.status} />} />
            <Separator />
            <Row label="Bắt đầu" value={new Date(e.start_date).toLocaleDateString("vi-VN")} />
            <Separator />
            <Row label="Kết thúc" value={e.end_date ? new Date(e.end_date).toLocaleDateString("vi-VN") : "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Lịch sử lớp ({history.length})</CardTitle></CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Chưa có lịch sử.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((h) => (
                  <li key={h.id} className="rounded-md border px-3 py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs">{h.class_id.slice(0, 8)}...</span>
                      <StatusBadge status={h.status} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(h.joined_at).toLocaleDateString("vi-VN")}
                      {h.left_at ? ` → ${new Date(h.left_at).toLocaleDateString("vi-VN")}` : " → nay"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {id && (
        <>
          <TransferDialog enrollmentId={id} open={transferOpen} onOpenChange={setTransferOpen} />
          <ConfirmDialog
            open={cancelOpen}
            onOpenChange={setCancelOpen}
            title="Hủy ghi danh?"
            description="Học viên sẽ không còn trong lớp này."
            confirmLabel="Hủy ghi danh"
            destructive
            loading={cancel.isPending}
            onConfirm={() => {
              cancel.mutate(id, {
                onSuccess: () => {
                  toast.success("Đã hủy");
                  setCancelOpen(false);
                },
              });
            }}
          />
        </>
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

function TransferDialog({ enrollmentId, open, onOpenChange }: { enrollmentId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const transfer = useTransferEnrollment();
  const { data: classes = [] } = useClasses();
  const [newClassId, setNewClassId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");

  function submit() {
    if (!newClassId) return toast.error("Chọn lớp mới");
    transfer.mutate(
      { id: enrollmentId, payload: { new_class_id: newClassId, transfer_date: date, reason: reason || null } },
      {
        onSuccess: () => {
          toast.success("Đã chuyển lớp");
          onOpenChange(false);
        },
        onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Không chuyển được"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Chuyển lớp</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Lớp mới</Label>
            <Select value={newClassId} onChange={(e) => setNewClassId(e.target.value)}>
              <option value="">— Chọn —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ngày chuyển</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Lý do</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={submit} disabled={transfer.isPending}>Chuyển</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}