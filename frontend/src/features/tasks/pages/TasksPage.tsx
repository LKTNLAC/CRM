import { useState } from "react";
import { toast } from "sonner";
import { CheckSquare, Pencil, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuthStore } from "@/stores/authStore";
import { usePermission } from "@/permissions/usePermission";
import { useCreateTask, useTasks, useUpdateTask } from "../services";
import { TASK_TYPES, type Task } from "../types";

export default function TasksPage() {
  const user = useAuthStore((s) => s.user);
  const { can } = usePermission();
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const { data = [], isLoading } = useTasks({
    status: status || undefined,
    assignee_id: user?.id,
  });
  const update = useUpdateTask();

  const columns: Column<Task>[] = [
    {
      key: "title",
      header: "Tiêu đề",
      cell: (t) => (
        <div className="flex flex-col">
          <span className="font-medium">{t.title}</span>
          <span className="text-xs text-muted-foreground">{t.task_type}</span>
        </div>
      ),
    },
    { key: "status", header: "Trạng thái", cell: (t) => <StatusBadge status={t.status} /> },
    { key: "priority", header: "Ưu tiên", cell: (t) => t.priority },
    {
      key: "due",
      header: "Hạn",
      cell: (t) => (t.due_at ? new Date(t.due_at).toLocaleDateString("vi-VN") : "—"),
    },
    {
      key: "action",
      header: "",
      cell: (t) => (
        <div className="flex gap-1 justify-end">
          {t.status !== "DONE" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                update.mutate(
                  { id: t.id, payload: { status: "DONE" } },
                  {
                    onSuccess: () => toast.success("Đã hoàn thành"),
                    onError: () => toast.error("Không cập nhật được"),
                  }
                );
              }}
            >
              Hoàn thành
            </Button>
          )}
          {can("task.update") && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setEditTask(t);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
      className: "w-44 text-right",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Công việc của tôi"
        description="Task được giao cho bạn"
        actions={
          can("task.create") && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Thêm task
            </Button>
          )
        }
      />

      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả</option>
          <option value="OPEN">Mở</option>
          <option value="IN_PROGRESS">Đang làm</option>
          <option value="DONE">Hoàn thành</option>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        emptyState={
          <EmptyState
            icon={CheckSquare}
            title="Không có task nào"
            description="Bạn đã hoàn thành hết công việc!"
          />
        }
      />

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />

      {editTask && (
        <EditTaskDialog
          task={editTask}
          open={!!editTask}
          onOpenChange={(v) => !v && setEditTask(null)}
        />
      )}
    </div>
  );
}

const createSchema = z.object({
  task_type: z.string().min(1),
  title: z.string().min(1, "Vui lòng nhập tiêu đề"),
  description: z.string().optional(),
  due_at: z.string().optional(),
  priority: z.string().default("NORMAL"),
});
type CreateFormValues = z.infer<typeof createSchema>;

function CreateTaskDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const user = useAuthStore((s) => s.user);
  const create = useCreateTask();
  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      task_type: "FOLLOW_UP",
      title: "",
      description: "",
      due_at: "",
      priority: "NORMAL",
    },
  });

  const onSubmit = form.handleSubmit((v) => {
    if (!user) return;
    create.mutate(
      {
        ...v,
        assignee_id: user.id,
        description: v.description || null,
        due_at: v.due_at ? new Date(v.due_at).toISOString() : null,
      },
      {
        onSuccess: () => {
          toast.success("Đã tạo task");
          form.reset();
          onOpenChange(false);
        },
        onError: () => toast.error("Không tạo được task"),
      }
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm task</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task_type">Loại</Label>
            <Select id="task_type" {...form.register("task_type")}>
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea id="description" rows={3} {...form.register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="priority">Ưu tiên</Label>
              <Select id="priority" {...form.register("priority")}>
                <option value="LOW">Thấp</option>
                <option value="NORMAL">Bình thường</option>
                <option value="HIGH">Cao</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_at">Hạn</Label>
              <Input id="due_at" type="datetime-local" {...form.register("due_at")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Tạo task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditTaskDialog({
  task,
  open,
  onOpenChange,
}: {
  task: Task;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const update = useUpdateTask();
  const form = useForm({
    defaultValues: {
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      status: task.status,
      due_at: task.due_at ? task.due_at.slice(0, 16) : "",
    },
  });

  const onSubmit = form.handleSubmit((v) => {
    update.mutate(
      {
        id: task.id,
        payload: {
          title: v.title,
          description: v.description || null,
          priority: v.priority,
          status: v.status,
          due_at: v.due_at ? new Date(v.due_at).toISOString() : null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật task");
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
          <DialogTitle>Chỉnh sửa task</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tiêu đề *</Label>
            <Input {...form.register("title")} />
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea rows={3} {...form.register("description")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select {...form.register("status")}>
                <option value="OPEN">Mở</option>
                <option value="IN_PROGRESS">Đang làm</option>
                <option value="DONE">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ưu tiên</Label>
              <Select {...form.register("priority")}>
                <option value="LOW">Thấp</option>
                <option value="NORMAL">Bình thường</option>
                <option value="HIGH">Cao</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hạn</Label>
              <Input type="datetime-local" {...form.register("due_at")} />
            </div>
          </div>
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