import { LEAD_STATUSES } from "../types";
import { cn } from "@/utils/cn";

interface Props {
  current: string;
  onChange: (status: string) => void;
  disabled?: boolean;
}

export function LeadStatusPipeline({ current, onChange, disabled }: Props) {
  const currentIndex = LEAD_STATUSES.indexOf(current as any);
  const isEnrolled = current === "ENROLLED";
  const isLocked = isEnrolled;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {LEAD_STATUSES.map((status, i) => {
        const active = i <= currentIndex && current !== "LOST";
        const isCurrent = status === current;
        const buttonDisabled = disabled || isCurrent || isLocked;

        return (
          <button
            key={status}
            disabled={buttonDisabled}
            onClick={() => onChange(status)}
            className={cn(
              "px-2.5 py-1 text-xs rounded-md font-medium transition-colors",
              isCurrent
                ? "bg-primary text-primary-foreground"
                : active
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80",
              buttonDisabled && "opacity-50 cursor-not-allowed"
            )}
            title={isLocked ? "Lead đã ghi danh, không thể đổi trạng thái" : ""}
          >
            {status}
          </button>
        );
      })}
    </div>
  );
}