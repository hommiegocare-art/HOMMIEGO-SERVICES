// src/components/ui/switch.tsx
import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // Track: 44×24, real 2px padding so the thumb never touches the edge
      "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center",
      "rounded-full border border-transparent p-0.5 transition-colors",
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // Thumb: 20×20, fits inside the 20×40 content box exactly
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-md ring-0",
        "transition-transform duration-200 ease-in-out",
        // LTR: 0 → +20px (content width 40 − thumb 20 = 20)
        "translate-x-0 data-[state=checked]:translate-x-5",
        // RTL: mirror the travel so it never exits the track
        "rtl:translate-x-0 rtl:data-[state=checked]:-translate-x-5",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };