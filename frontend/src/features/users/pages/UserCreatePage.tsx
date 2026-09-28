import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { useCreateUser, useRoles } from "../services";

const schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(12, "Mật khẩu tối thiểu 12 ký tự"),
  full_name: z.string().min(1, "Nhập họ tên"),
  role_codes: z.array(z.string()).min(1, "Chọn ít nhất 1 vai trò"),
});
type FormValues = z.infer<typeof schema>;

export default function UserCreatePage() {
  const navigate = useNavigate();
  const create = useCreateUser();
  const { data: roles = [] } = useRoles();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", full_name: "", role_codes: [] },
  });

  const onSubmit = form.handleSubmit((v) => {
    create.mutate(v, {
      onSuccess: (u) => {
        toast.success("Đã tạo người dùng");
        navigate(`/users/${u.id}`);
      },
      onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Không tạo được"),
    });
  });

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/users")} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>
      <PageHeader title="Thêm người dùng" />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Họ tên *</Label>
              <Input {...form.register("full_name")} />
            </div>
            <div className="space-y-2">
              <Label>Mật khẩu * (tối thiểu 12 ký tự, có chữ hoa, số, ký tự đặc biệt)</Label>
              <Input type="password" {...form.register("password")} />
              {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Vai trò *</Label>
              <Controller
                control={form.control}
                name="role_codes"
                render={({ field }) => (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {roles.map((role) => {
                      const checked = field.value.includes(role.code);
                      return (
                        <label
                          key={role.id}
                          className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-secondary/50"
                        >
                          <Checkbox
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) field.onChange([...field.value, role.code]);
                              else field.onChange(field.value.filter((c) => c !== role.code));
                            }}
                          />
                          <span className="text-sm">{role.code}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              />
              {form.formState.errors.role_codes && <p className="text-xs text-destructive">{form.formState.errors.role_codes.message}</p>}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate("/users")}>Hủy</Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Tạo
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}