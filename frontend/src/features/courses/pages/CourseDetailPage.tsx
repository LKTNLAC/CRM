import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { ArrowLeft, Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { usePermission } from "@/permissions/usePermission";
import { useCourse, useCourseLevels, useCreateLevel, useUpdateCourse } from "../services";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();
  const { data: course, isLoading } = useCourse(id);
  const { data: levels = [] } = useCourseLevels(id);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading || !course) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/courses")}
        className="mb-3 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>

      <PageHeader
        title={course.name}
        description={`Mã: ${course.code}`}
        actions={
          can("course.update") && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Chỉnh sửa
            </Button>
          )
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Mã" value={course.code} />
            <Separator />
            <Row label="Ngôn ngữ" value={course.language ?? "—"} />
            <Separator />
            <Row label="Mô tả" value={course.description ?? "—"} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Cấp độ ({levels.length})</CardTitle>
            {can("course.create") && (
              <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Thêm
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {levels.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Chưa có cấp độ nào.
              </p>
            ) : (
              <ul className="space-y-2">
                {levels.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div>
                      <span className="font-mono text-xs text-muted-foreground mr-2">
                        {l.code}
                      </span>
                      <span className="font-medium">{l.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">#{l.sequence}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {course && (
        <EditCourseDialog course={course} open={editOpen} onOpenChange={setEditOpen} />
      )}

      {id && <LevelDialog courseId={id} open={open} onOpenChange={setOpen} />}
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

function LevelDialog({
  courseId,
  open,
  onOpenChange,
}: {
  courseId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const create = useCreateLevel();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [sequence, setSequence] = useState("0");
  const [hours, setHours] = useState("");

  function submit() {
    if (!code || !name) return toast.error("Nhập mã và tên");
    create.mutate(
      {
        courseId,
        payload: {
          code,
          name,
          sequence: parseInt(sequence) || 0,
          duration_hours: hours ? parseInt(hours) : null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã thêm cấp độ");
          setCode("");
          setName("");
          setSequence("0");
          setHours("");
          onOpenChange(false);
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.error?.message ?? "Không thêm được"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm cấp độ</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Mã *</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VD: A1"
            />
          </div>
          <div className="space-y-2">
            <Label>Tên *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Beginner"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Thứ tự</Label>
              <Input
                type="number"
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Giờ học</Label>
              <Input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            Thêm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditCourseDialog({
  course,
  open,
  onOpenChange,
}: {
  course: {
    id: string;
    name: string;
    description: string | null;
    language: string | null;
    is_active: boolean;
  };
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const update = useUpdateCourse();
  const form = useForm({
    defaultValues: {
      name: course.name,
      description: course.description ?? "",
      language: course.language ?? "",
      is_active: course.is_active,
    },
  });

  const onSubmit = form.handleSubmit((v) => {
    update.mutate(
      {
        id: course.id,
        payload: {
          name: v.name,
          description: v.description || null,
          language: v.language || null,
          is_active: v.is_active,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật khóa học");
          onOpenChange(false);
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.error?.message ?? "Không cập nhật được"),
      }
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa khóa học</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tên *</Label>
            <Input {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label>Ngôn ngữ</Label>
            <Input {...form.register("language")} />
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea rows={3} {...form.register("description")} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("is_active")} />
            Đang hoạt động
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}