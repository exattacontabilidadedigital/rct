"use client";

import { forwardRef } from "react";
import { DateInput, DateSegment as DateSegmentComponent, TimeField } from "react-aria-components";

import { cn } from "@/lib/utils";

import type { TimeFieldProps, TimeValue } from "react-aria-components";

type TimeInputProps = Omit<TimeFieldProps<TimeValue>, "isDisabled" | "isInvalid"> & {
  readonly dateInputClassName?: string;
  readonly segmentClassName?: string;
  readonly disabled?: boolean;
  readonly "data-invalid"?: boolean;
};

type TimeInputRef = HTMLDivElement;

const TimeInput = forwardRef<TimeInputRef, TimeInputProps>(
  ({ className, dateInputClassName, segmentClassName, disabled, "data-invalid": dataInvalid, ...props }, ref) => {
    return (
      <TimeField
        ref={ref}
        className={cn("relative", className)}
        isDisabled={disabled}
        isInvalid={dataInvalid}
        aria-label="Horário"
        shouldForceLeadingZeros
        {...props}
      >
        <DateInput
          className={cn(
            "peer inline-flex h-9 w-full items-center overflow-hidden whitespace-nowrap rounded-md border bg-background px-3 py-2 text-sm shadow-sm",
            "data-[focus-within]:outline-none data-[focus-within]:ring-1 data-[focus-within]:ring-ring",
            "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
            dateInputClassName
          )}
        >
          {(segment: Parameters<typeof DateSegmentComponent>[0]["segment"]) => (
            <DateSegmentComponent
              segment={segment}
              className={cn(
                "inline rounded px-0.5 py-0.5 caret-transparent outline outline-0",
                "data-[focused]:bg-foreground/10 data-[focused]:text-foreground",
                "data-[placeholder]:text-muted-foreground",
                "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
                segmentClassName
              )}
            />
          )}
        </DateInput>
      </TimeField>
    );
  }
);

TimeInput.displayName = "TimeInput";

export { TimeInput };
