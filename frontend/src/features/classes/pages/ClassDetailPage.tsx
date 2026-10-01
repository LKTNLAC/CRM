import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { usePermission } from "@/permissions/usePermission";
import { useUsers } from "@/features/users/services";
import {
  useClass,
  useClassSchedules,
  useUpdateClass,
  useUpdateSchedule,
  useDeleteSchedule,
  useClassTeachers,
  useAssignTeacher,
  useUnassignTeacher,
} from "../services";
import { ScheduleDialog } from "../components/ScheduleDialog";
import { DAY_NAMES } from "../types";

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();

  const { data: cls, isLoading } = useClass(id);
  const { data: schedules = [] } = useClassSchedules(id);
  const { data: teachers = [] } = useClassTeachers(id);
  const { data: teacherUsers = [] } = useUsers({ role: "TEACHER" });

  const unassign = useUnassignTeacher();

  const [addScheduleOpen, setAddScheduleOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<any | null>(null);
  const [deleteScheduleState, setDeleteScheduleState] = useState<any | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  const deleteSch = useDeleteSchedule();

  if (isLoading || !cls) {
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
        onClick={() => navigate("/classes")}
        className="mb-3 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>

      <PageHeader
        title={cls.name}
        description={`Mã: ${cls.code}`}
        actions={
          can("class.update") && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Chỉnh sửa
            </Button>
          )
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Card 1: Thông tin */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Trạng thái" value={<StatusBadge status={cls.status} />} />
            <Separator />
            <Row label="Phòng" value={cls.room ?? "—"} />
            <Separator />
            <Row label="Sức chứa" value={cls.capacity} />
            <Separator />
            <Row label="Bắt đầu" value={cls.start_date ?? "—"} />
            <Separator />
            <Row label="Kết thúc" value={cls.end_date ?? "—"} />
          </CardContent>
        </Card>

        {/* Card 2: Lịch học */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Lịch học ({schedules.length})</CardTitle>
            {can("schedule.manage") && (
              <Button size="sm" variant="outline" onClick={() => setAddScheduleOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Thêm lịch
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Chưa có lịch học.
              </p>
            ) : (
              <ul className="space-y-2">
                {schedules.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm gap-3"
                  >
                    <span className="font-medium">{DAY_NAMES[s.day_of_week]}</span>
                    <span className="font-mono text-xs">
                      {s.start_time} → {s.end_time}
                    </span>
                    <span className="text-muted-foreground text-xs flex-1">
                      {s.room ?? "—"}
                    </span>
                    {can("schedule.manage") && (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setEditSchedule(s)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => setDeleteScheduleState(s)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Giáo viên */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Giáo viên ({teachers.length})</CardTitle>
            {can("class.assign_teacher") && (
              <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
                <UserPlus className="h-3.5 w-3.5" /> Gán giáo viên
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {teachers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Chưa có giáo viên nào được gán.
              </p>
            ) : (
              <ul className="grid md:grid-cols-2 gap-2">
                {teachers.map((t: any) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{t.teacher_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.teacher_email} · {t.role}
                      </span>
                    </div>
                    {can("class.assign_teacher") && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() =>
                          unassign.mutate(
                            { classId: id!, teacherId: t.teacher_id },
                            {
                              onSuccess: () => toast.success("Đã bỏ gán giáo viên"),
                              onError: (err: any) =>
                                toast.error(
                                  err?.response?.data?.error?.message ?? "Không bỏ được"
                                ),
                            }
                          )
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Thêm lịch học */}
      {id && (
        <ScheduleDialog
          classId={id}
          open={addScheduleOpen}
          onOpenChange={setAddScheduleOpen}
        />
      )}

      {/* Dialog: Sửa lớp */}
      {cls && (
        <EditClassDialog cls={cls} open={editOpen} onOpenChange={setEditOpen} />
      )}

      {/* Dialog: Sửa lịch học */}
      {id && editSchedule && (
        <EditScheduleDialog
          classId={id}
          schedule={editSchedule}
          open={!!editSchedule}
          onOpenChange={(v) => !v && setEditSchedule(null)}
        />
      )}

      {/* Dialog: Xóa lịch học */}
      {id && (
        <ConfirmDialog
          open={!!deleteScheduleState}
          onOpenChange={(v) => !v && setDeleteScheduleState(null)}
          title="Xóa lịch học?"
          description={`${DAY_NAMES[deleteScheduleState?.day_of_week ?? 0]} ${
            deleteScheduleState?.start_time ?? ""
          } → ${deleteScheduleState?.end_time ?? ""}`}
          confirmLabel="Xóa"
          destructive
          loading={deleteSch.isPending}
          onConfirm={() => {
            if (!id || !deleteScheduleState) return;
            deleteSch.mutate(
              { classId: id, scheduleId: deleteScheduleState.id },
              {
                onSuccess: () => {
                  toast.success("Đã xóa lịch học");
                  setDeleteScheduleState(null);
                },
                onError: (err: any) =>
                  toast.error(err?.response?.data?.error?.message ?? "Không xóa được"),
              }
            );
          }}
        />
      )}

      {/* Dialog: Gán giáo viên */}
      {id && (
        <AssignTeacherDialog
          classId={id}
          teachers={teacherUsers}
          open={assignOpen}
          onOpenChange={setAssignOpen}
        />
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

/* ============================================================
   DIALOG 1: Sửa lớp học
   ============================================================ */

function EditClassDialog({
  cls,
  open,
  onOpenChange,
}: {
  cls: {
    id: string;
    name: string;
    room: string | null;
    capacity: number;
    status: string;
    start_date: string | null;
    end_date: string | null;
  };
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const update = useUpdateClass();
  const form = useForm({
    defaultValues: {
      name: cls.name,
      room: cls.room ?? "",
      capacity: cls.capacity,
      status: cls.status,
      start_date: cls.start_date ?? "",
      end_date: cls.end_date ?? "",
    },
  });

  const onSubmit = form.handleSubmit((v) => {
    update.mutate(
      {
        id: cls.id,
        payload: {
          name: v.name,
          room: v.room || null,
          capacity: Number(v.capacity),
          status: v.status,
          start_date: v.start_date || null,
          end_date: v.end_date || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật lớp học");
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
          <DialogTitle>Chỉnh sửa lớp học</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tên *</Label>
            <Input {...form.register("name")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Phòng</Label>
              <Input {...form.register("room")} />
            </div>
            <div className="space-y-2">
              <Label>Sức chứa</Label>
              <Input type="number" {...form.register("capacity")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Trạng thái</Label>
            <Select {...form.register("status")}>
              <option value="PLANNED">Dự kiến</option>
              <option value="OPEN">Đang mở</option>
              <option value="ACTIVE">Đang học</option>
              <option value="CLOSED">Đã đóng</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Bắt đầu</Label>
              <Input type="date" {...form.register("start_date")} />
            </div>
            <div className="space-y-2">
              <Label>Kết thúc</Label>
              <Input type="date" {...form.register("end_date")} />
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

/* ============================================================
   DIALOG 2: Sửa lịch học
   ============================================================ */

function EditScheduleDialog({
  classId,
  schedule,
  open,
  onOpenChange,
}: {
  classId: string;
  schedule: {
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room: string | null;
  };
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const update = useUpdateSchedule();
  const [day, setDay] = useState(String(schedule.day_of_week));
  const [start, setStart] = useState(schedule.start_time.slice(0, 5));
  const [end, setEnd] = useState(schedule.end_time.slice(0, 5));
  const [room, setRoom] = useState(schedule.room ?? "");

  function submit() {
    update.mutate(
      {
        classId,
        scheduleId: schedule.id,
        payload: {
          day_of_week: parseInt(day),
          start_time: start + ":00",
          end_time: end + ":00",
          room: room || null,
        } as any,
      },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật lịch học");
          onOpenChange(false);
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.error?.message ?? "Không cập nhật được"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa lịch học</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Thứ</Label>
            <Select value={day} onChange={(e) => setDay(e.target.value)}>
              {DAY_NAMES.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Bắt đầu</Label>
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Kết thúc</Label>
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phòng</Label>
            <Input value={room} onChange={(e) => setRoom(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={submit} disabled={update.isPending}>
            {update.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   DIALOG 3: Gán giáo viên
   ============================================================ */

function AssignTeacherDialog({
  classId,
  teachers,
  open,
  onOpenChange,
}: {
  classId: string;
  teachers: { id: string; full_name: string; email: string }[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const assign = useAssignTeacher();
  const [teacherId, setTeacherId] = useState("");
  const [role, setRole] = useState("MAIN");

  function submit() {
    if (!teacherId) return toast.error("Chọn giáo viên");
    assign.mutate(
      {
        classId,
        payload: {
          teacher_id: teacherId,
          role,
          from_date: new Date().toISOString().slice(0, 10),
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã gán giáo viên");
          setTeacherId("");
          setRole("MAIN");
          onOpenChange(false);
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.error?.message ?? "Không gán được"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gán giáo viên</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Giáo viên</Label>
            <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">— Chọn —</option>
              {teachers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} — {u.email}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Vai trò</Label>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="MAIN">Giáo viên chính</option>
              <option value="ASSISTANT">Trợ giảng</option>
              <option value="SUBSTITUTE">Dạy thay</option>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={submit} disabled={!teacherId || assign.isPending}>
            {assign.isPending ? "Đang lưu..." : "Gán"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}