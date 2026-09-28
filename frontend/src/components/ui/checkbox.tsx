import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => (
    <span className="relative inline-flex items-center">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        className="peer h-4 w-4 shrink-0 appearance-none rounded border border-input bg-transparent shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary checked:border-primary"
        {...props}
      />
      {checked && (
        <Check className="pointer-events-none absolute left-0 top-0 h-4 w-4 text-primary-foreground" strokeWidth={3} />
      )}
    </span>
  )
);
Checkbox.displayName = "Checkbox";

export { Checkbox };