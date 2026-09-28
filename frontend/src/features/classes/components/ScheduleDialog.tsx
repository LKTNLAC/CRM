import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAddSchedule } from "../services";
import { DAY_NAMES } from "../types";

interface Props { classId: string; open: boolean; onOpenChange: (v: boolean) => void; }

export function ScheduleDialog({ classId, open, onOpenChange }: Props) {
  const add = useAddSchedule();
  const [day, setDay] = useState("0");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("10:00");
  const [room, setRoom] = useState("");

  function submit() {
    add.mutate(
      {
        classId,
        payload: {
          day_of_week: parseInt(day),
          start_time: start + ":00",
          end_time: end + ":00",
          room: room || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã thêm lịch");
          onOpenChange(false);
        },
        onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Không thêm được"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Thêm lịch học</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Thứ</Label>
            <Select value={day} onChange={(e) => setDay(e.target.value)}>
              {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={submit} disabled={add.isPending}>Thêm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}