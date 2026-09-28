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
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { useCreateStudent } from "../services";

const schema = z.object({
  full_name: z.string().min(1, "Vui lòng nhập họ tên"),
  student_code: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function StudentCreatePage() {
  const navigate = useNavigate();
  const create = useCreateStudent();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "", student_code: "", email: "", phone: "",
      date_of_birth: "", gender: "", address: "",
    },
  });

  const onSubmit = form.handleSubmit((v) => {
    const payload = {
      ...v,
      student_code: v.student_code || null,
      email: v.email || null,
      phone: v.phone || null,
      date_of_birth: v.date_of_birth || null,
      gender: v.gender || null,
      address: v.address || null,
    };
    create.mutate(payload, {
      onSuccess: (s) => {
        toast.success("Đã tạo học viên");
        navigate(`/students/${s.id}`);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error?.message ?? "Không tạo được học viên");
      },
    });
  });

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/students")} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>

      <PageHeader title="Thêm học viên" description="Nhập thông tin học viên mới" />

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
                <Label htmlFor="student_code">Mã học viên</Label>
                <Input id="student_code" placeholder="Tự sinh nếu bỏ trống" {...form.register("student_code")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Điện thoại</Label>
                <Input id="phone" {...form.register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Ngày sinh</Label>
                <Input id="date_of_birth" type="date" {...form.register("date_of_birth")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Giới tính</Label>
                <Select id="gender" {...form.register("gender")}>
                  <option value="">— Chọn —</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input id="address" {...form.register("address")} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/students")}>
                Hủy
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Tạo học viên
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}