import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { useCreateGuardian } from "../services";

const schema = z.object({
  full_name: z.string().min(1, "Vui lòng nhập họ tên"),
  phone: z.string().min(1, "Vui lòng nhập số điện thoại"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  relationship: z.string().optional(),
  address: z.string().optional(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function GuardianCreatePage() {
  const navigate = useNavigate();
  const create = useCreateGuardian();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", phone: "", email: "", relationship: "", address: "", note: "" },
  });

  const onSubmit = form.handleSubmit((v) => {
    const payload = {
      ...v,
      email: v.email || null,
      relationship: v.relationship || null,
      address: v.address || null,
      note: v.note || null,
    };
    create.mutate(payload, {
      onSuccess: () => {
        toast.success("Đã tạo phụ huynh");
        navigate("/guardians");
      },
      onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Không tạo được"),
    });
  });

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/guardians")} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>

      <PageHeader title="Thêm phụ huynh" />

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
                <Label htmlFor="phone">Điện thoại *</Label>
                <Input id="phone" {...form.register("phone")} />
                {form.formState.errors.phone && (
                  <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship">Quan hệ</Label>
                <Select id="relationship" {...form.register("relationship")}>
                  <option value="">— Chọn —</option>
                  <option value="father">Bố</option>
                  <option value="mother">Mẹ</option>
                  <option value="guardian">Người giám hộ</option>
                  <option value="other">Khác</option>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input id="address" {...form.register("address")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="note">Ghi chú</Label>
                <Textarea id="note" rows={3} {...form.register("note")} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/guardians")}>
                Hủy
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Tạo
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}