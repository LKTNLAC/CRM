import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePermission } from "@/permissions/usePermission";
import { CHANNELS } from "../types";
import { useCommunications, useCreateCommunication } from "../services";
import type { Communication } from "../types";

export default function CommunicationsPage() {
  const { can } = usePermission();
  const [channel, setChannel] = useState("");
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useCommunications({ channel: channel || undefined });

  const columns: Column<Communication>[] = [
    {
      key: "channel",
      header: "Kênh",
      cell: (r) => <span className="font-medium">{r.channel}</span>,
      className: "w-20",
    },
    {
      key: "recipient",
      header: "Người nhận",
      cell: (r) => (
        <div className="flex flex-col">
          <span>{r.recipient}</span>
          {r.subject && <span className="text-xs text-muted-foreground">{r.subject}</span>}
        </div>
      ),
    },
    { key: "status", header: "Trạng thái", cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "created",
      header: "Ngày tạo",
      cell: (r) => new Date(r.created_at).toLocaleString("vi-VN"),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Liên lạc"
        description="Lịch sử gửi tin nhắn đến học viên, phụ huynh"
        actions={
          can("communication.send") && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Gửi tin nhắn
            </Button>
          )
        }
      />
      <div className="mb-4 max-w-xs">
        <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
          <option value="">Tất cả kênh</option>
          {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        emptyState={<EmptyState icon={MessageSquare} title="Chưa có tin nhắn nào" />}
      />
      <CreateDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

const schema = z.object({
  channel: z.string().min(1),
  recipient: z.string().min(1, "Nhập người nhận"),
  subject: z.string().optional(),
  body: z.string().min(1, "Nhập nội dung"),
});
type FormValues = z.infer<typeof schema>;

function CreateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateCommunication();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { channel: "EMAIL", recipient: "", subject: "", body: "" },
  });

  const onSubmit = form.handleSubmit((v) => {
    create.mutate(
      { ...v, subject: v.subject || null },
      {
        onSuccess: () => {
          toast.success("Đã tạo tin nhắn (sẽ gửi qua worker)");
          form.reset();
          onOpenChange(false);
        },
        onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Không tạo được"),
      }
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Gửi tin nhắn</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kênh</Label>
              <Select {...form.register("channel")}>
                {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Người nhận *</Label>
              <Input placeholder="email / SĐT" {...form.register("recipient")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tiêu đề</Label>
            <Input {...form.register("subject")} />
          </div>
          <div className="space-y-2">
            <Label>Nội dung *</Label>
            <Textarea rows={5} {...form.register("body")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={create.isPending}>Gửi</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}