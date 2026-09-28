import * as React from "react";
import { cn } from "@/utils/cn";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, ...props }, ref) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        className="peer sr-only"
        {...props}
      />
      <div
        className={cn(
          "w-9 h-5 bg-input peer-checked:bg-primary rounded-full transition-colors relative",
          "after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-background",
          "after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-4",
          "after:shadow-sm",
          className
        )}
      />
    </label>
  )
);
Switch.displayName = "Switch";

export { Switch };