"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  color,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { color?: string }) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      style={{ backgroundColor: color ? `${color}45` : undefined }} // Light version with 20% opacity
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 transition-all"
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          backgroundColor: color || undefined,
        }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
