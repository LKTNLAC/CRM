import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { useCreateLead } from "../services";
import { LEAD_SOURCES } from "../types";

const schema = z.object({
  full_name: z.string().min(1, "Vui lòng nhập họ tên"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  phone: z.string().optional(),
  source: z.string().optional(),
  campaign: z.string().optional(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function LeadCreatePage() {
  const navigate = useNavigate();
  const create = useCreateLead();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", phone: "", source: "", campaign: "", note: "" },
  });

  const onSubmit = form.handleSubmit((v) => {
    const payload = {
      ...v,
      email: v.email || null,
      phone: v.phone || null,
      source: v.source || null,
      campaign: v.campaign || null,
      note: v.note || null,
    };
    create.mutate(payload, {
      onSuccess: () => {
        toast.success("Đã tạo lead");
        navigate("/leads");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error?.message ?? "Không tạo được lead");
      },
    });
  });

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/leads")} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>

      <PageHeader title="Thêm lead mới" description="Nhập thông tin khách hàng tiềm năng" />

      <Card>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Họ tên *</Label>
                <Input id="full_name" {...form.register("full_name")} />
                {form.formState.errors.full_name && (
                  <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Điện thoại</Label>
                <Input id="phone" {...form.register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Nguồn</Label>
                <Select id="source" {...form.register("source")}>
                  <option value="">— Chọn —</option>
                  {LEAD_SOURCES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="campaign">Chiến dịch</Label>
                <Input id="campaign" {...form.register("campaign")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="note">Ghi chú</Label>
                <Textarea id="note" rows={3} {...form.register("note")} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/leads")}>
                Hủy
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Tạo lead
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}