import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConvertLead } from "../services";

interface Props {
  leadId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ConvertLeadDialog({ leadId, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const convert = useConvertLead();
  const [studentCode, setStudentCode] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");

  function handleSubmit() {
    convert.mutate(
      {
        id: leadId,
        payload: {
          student_code: studentCode || undefined,
          date_of_birth: dob || undefined,
          gender: gender || undefined,
          address: address || undefined,
        },
      },
      {
        onSuccess: (res) => {
          toast.success("Đã chuyển thành học viên");
          onOpenChange(false);
          navigate(`/students/${res.student_id}`);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error?.message ?? "Không chuyển được");
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chuyển thành học viên</DialogTitle>
          <DialogDescription>
            Lead sẽ được chuyển thành học viên. Thông tin có thể bổ sung sau.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="student_code">Mã học viên (bỏ trống để tự sinh)</Label>
            <Input
              id="student_code"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              placeholder="VD: ST000001"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dob">Ngày sinh</Label>
              <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Giới tính</Label>
              <Select id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">— Chọn —</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={convert.isPending}>
            {convert.isPending ? "Đang xử lý..." : "Chuyển"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}