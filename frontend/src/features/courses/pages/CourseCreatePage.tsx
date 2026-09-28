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
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { useCreateCourse } from "../services";

const schema = z.object({
  code: z.string().min(1, "Vui lòng nhập mã"),
  name: z.string().min(1, "Vui lòng nhập tên"),
  language: z.string().optional(),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function CourseCreatePage() {
  const navigate = useNavigate();
  const create = useCreateCourse();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "", name: "", language: "", description: "" },
  });

  const onSubmit = form.handleSubmit((v) => {
    create.mutate(
      { ...v, language: v.language || null, description: v.description || null },
      {
        onSuccess: (c) => {
          toast.success("Đã tạo khóa học");
          navigate(`/courses/${c.id}`);
        },
        onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Không tạo được"),
      }
    );
  });

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/courses")} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>
      <PageHeader title="Thêm khóa học" />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Mã *</Label>
                <Input id="code" placeholder="VD: ENG" {...form.register("code")} />
                {form.formState.errors.code && <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Tên *</Label>
                <Input id="name" placeholder="VD: English" {...form.register("name")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="language">Ngôn ngữ</Label>
                <Input id="language" placeholder="VD: English" {...form.register("language")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" rows={3} {...form.register("description")} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate("/courses")}>Hủy</Button>
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