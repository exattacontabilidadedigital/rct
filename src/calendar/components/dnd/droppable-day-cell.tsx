"use client";

import { useCallback, useRef } from "react";
import { useDrop } from "react-dnd";
import { differenceInMilliseconds, parseISO } from "date-fns";

import { ItemTypes } from "@/calendar/components/dnd/draggable-event";
import { useUpdateEvent } from "@/calendar/hooks/use-update-event";

import type { CalendarEvent } from "@/calendar/interfaces";
import type { CalendarCell } from "@/calendar/interfaces";
import type { ReactNode } from "react";

interface DroppableDayCellProps {
  cell: CalendarCell;
  children: ReactNode;
}

export function DroppableDayCell({ cell, children }: DroppableDayCellProps) {
  const { updateEvent } = useUpdateEvent();

  const handleDrop = useCallback(
    async (event: CalendarEvent) => {
      const start = parseISO(event.startDate);
      const end = parseISO(event.endDate);
      const duration = differenceInMilliseconds(end, start);

      const nextStart = new Date(cell.date);
      nextStart.setHours(start.getHours(), start.getMinutes(), 0, 0);

      const nextEnd = new Date(nextStart.getTime() + duration);

      await updateEvent({
        ...event,
        startDate: nextStart.toISOString(),
        endDate: nextEnd.toISOString(),
      });
    },
    [cell.date, updateEvent]
  );

  const ref = useRef<HTMLDivElement | null>(null);

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ItemTypes.EVENT,
      drop: (item: { event: CalendarEvent }) => {
        void handleDrop(item.event);
        return { moved: true };
      },
      collect: monitor => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [handleDrop]
  );

  drop(ref);

  return (
    <div ref={ref} className={isOver && canDrop ? "bg-accent/30" : undefined}>
      {children}
    </div>
  );
}
