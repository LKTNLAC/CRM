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
import { useCourses } from "@/features/courses/services";
import { useCreateClass } from "../services";

const schema = z.object({
  course_id: z.string().min(1, "Chọn khóa học"),
  code: z.string().min(1, "Nhập mã"),
  name: z.string().min(1, "Nhập tên"),
  room: z.string().optional(),
  capacity: z.coerce.number().min(1).default(20),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function ClassCreatePage() {
  const navigate = useNavigate();
  const create = useCreateClass();
  const { data: courses = [] } = useCourses();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { course_id: "", code: "", name: "", room: "", capacity: 20, start_date: "", end_date: "" },
  });

  const onSubmit = form.handleSubmit((v) => {
    create.mutate(
      {
        ...v,
        room: v.room || null,
        start_date: v.start_date || null,
        end_date: v.end_date || null,
      },
      {
        onSuccess: (c) => {
          toast.success("Đã tạo lớp");
          navigate(`/classes/${c.id}`);
        },
        onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Không tạo được"),
      }
    );
  });

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/classes")} className="mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>
      <PageHeader title="Thêm lớp học" />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Khóa học *</Label>
                <Select {...form.register("course_id")}>
                  <option value="">— Chọn —</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                {form.formState.errors.course_id && <p className="text-xs text-destructive">{form.formState.errors.course_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Mã *</Label>
                <Input placeholder="VD: ENG-A1-01" {...form.register("code")} />
              </div>
              <div className="space-y-2">
                <Label>Tên *</Label>
                <Input placeholder="VD: English A1 Morning" {...form.register("name")} />
              </div>
              <div className="space-y-2">
                <Label>Phòng</Label>
                <Input {...form.register("room")} />
              </div>
              <div className="space-y-2">
                <Label>Sức chứa</Label>
                <Input type="number" {...form.register("capacity")} />
              </div>
              <div className="space-y-2">
                <Label>Ngày bắt đầu</Label>
                <Input type="date" {...form.register("start_date")} />
              </div>
              <div className="space-y-2">
                <Label>Ngày kết thúc</Label>
                <Input type="date" {...form.register("end_date")} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate("/classes")}>Hủy</Button>
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