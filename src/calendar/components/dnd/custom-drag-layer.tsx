"use client";

import { useMemo } from "react";
import { useDragLayer } from "react-dnd";
import { format } from "date-fns";
import { parseISO } from "date-fns";

import { ItemTypes } from "@/calendar/components/dnd/draggable-event";
import { cn } from "@/lib/utils";

import type { CSSProperties } from "react";

export function CustomDragLayer() {
  const { isDragging, item, differenceFromInitialOffset } = useDragLayer(monitor => ({
    item: monitor.getItem(),
    differenceFromInitialOffset: monitor.getDifferenceFromInitialOffset(),
    isDragging: monitor.isDragging(),
  }));

  const style = useMemo(() => {
    if (!differenceFromInitialOffset) return undefined;
    const { x, y } = differenceFromInitialOffset;
    return {
      transform: `translate(${x}px, ${y}px)`,
    } satisfies CSSProperties;
  }, [differenceFromInitialOffset]);

  if (!isDragging || !item || item.type !== ItemTypes.EVENT) return null;

  const { event } = item;
  const start = parseISO(event.startDate);
  const end = parseISO(event.endDate);

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <div className="absolute" style={style}>
        <div
          className={cn(
            "flex flex-col gap-0.5 rounded-md border bg-background px-2 py-1.5 text-xs shadow-xl",
            "min-w-[160px] border-border/80"
          )}
        >
          <span className="font-semibold">{event.title}</span>
          <span className="text-muted-foreground">
            {format(start, "dd MMM yyyy HH:mm")} - {format(end, "dd MMM yyyy HH:mm")}
          </span>
        </div>
      </div>
    </div>
  );
}
