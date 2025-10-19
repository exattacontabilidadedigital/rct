"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { DayPickerProps } from "react-day-picker";

const SingleDayPicker = React.forwardRef<HTMLDivElement, DayPickerProps>(
  ({ className, classNames, showOutsideDays = true, mode = "single", ...props }, ref) => (
    <div ref={ref} className="text-sm">
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        mode={mode}
        classNames={{
          months: "flex flex-col space-y-4",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium capitalize",
          nav: "space-x-1 flex items-center",
          nav_button: cn(buttonVariants({ variant: "outline" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "text-muted-foreground opacity-50",
          day_disabled: "text-muted-foreground opacity-50",
          day_hidden: "invisible",
          caption_dropdowns: "flex gap-2",
          ...classNames,
        }}
        components={{
          IconLeft: ({ className, ...iconProps }: { className?: string }) => (
            <ChevronLeft className={cn("h-4 w-4", className)} {...iconProps} />
          ),
          IconRight: ({ className, ...iconProps }: { className?: string }) => (
            <ChevronRight className={cn("h-4 w-4", className)} {...iconProps} />
          ),
        }}
        {...props}
      />
    </div>
  )
);
SingleDayPicker.displayName = "SingleDayPicker";

export { SingleDayPicker };
