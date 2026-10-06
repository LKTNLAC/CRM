import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadFile } from "@/utils/download";

interface Props {
  /** Ví dụ: "/export/students" */
  endpoint: string;
  /** Tên file không cần extension: "students_20261006" */
  filenamePrefix: string;
  /** Query params thêm (VD: { class_id: "..." }) */
  params?: Record<string, string>;
}

export function ExportButton({ endpoint, filenamePrefix, params = {} }: Props) {
  const [loading, setLoading] = useState<"xlsx" | "pdf" | null>(null);

  async function handleExport(format: "xlsx" | "pdf") {
    setLoading(format);
    try {
      const query = new URLSearchParams({ ...params, format }).toString();
      const url = `${endpoint}?${query}`;
      await downloadFile(url, `${filenamePrefix}.${format}`);
      toast.success(`Đã tải file ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? "Không tải được file");
    } finally {
      setLoading(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={!!loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Xuất
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("xlsx")}>
          <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <FileText className="h-4 w-4 mr-2" /> PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}