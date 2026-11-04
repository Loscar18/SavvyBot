"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "../../lib/utils";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Scrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.Scrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      "duration-200 ease-in-out group",
      "bg-transparent p-0 hover:bg-black/10 dark:hover:bg-white/10",
      "data-[state=dragging]:bg-black/20 dark:data-[state=dragging]:bg-white/20",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px] group-hover:w-3 group-data-[state=dragging]:w-3",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px] group-hover:h-3 group-data-[state=dragging]:h-3",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.Thumb
      className={cn(
        "relative flex-1 rounded-full bg-border group-hover:bg-black/30 dark:group-hover:bg-white/30",
        "group-data-[state=dragging]:bg-black/50 dark:group-data-[state=dragging]:bg-white/50",
        orientation === "vertical" && "min-h-[20px]"
      )}
    />
  </ScrollAreaPrimitive.Scrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.Scrollbar.displayName;

const Corner = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Corner>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Corner>
>(({ className, ...props }, ref) => (
  <ScrollAreaPrimitive.Corner
    ref={ref}
    className={cn("bg-border", className)}
    {...props}
  />
));
Corner.displayName = ScrollAreaPrimitive.Corner.displayName;

export { ScrollArea, ScrollBar, Corner };
