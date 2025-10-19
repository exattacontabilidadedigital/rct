"use client";

import { useMemo, useRef } from "react";
import { useDrop } from "react-dnd";
import { differenceInMilliseconds, parseISO } from "date-fns";

import { ItemTypes } from "@/calendar/components/dnd/draggable-event";
import { useUpdateEvent } from "@/calendar/hooks/use-update-event";

import type { CalendarEvent } from "@/calendar/interfaces";
import type { ReactNode } from "react";

interface DroppableTimeBlockProps {
  date: Date;
  hour: number;
  minute: number;
  children: ReactNode;
}

export function DroppableTimeBlock({ date, hour, minute, children }: DroppableTimeBlockProps) {
  const { updateEvent } = useUpdateEvent();

  const ref = useRef<HTMLDivElement | null>(null);

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ItemTypes.EVENT,
      drop: (item: { event: CalendarEvent }) => {
        const event = item.event;
        const startDate = parseISO(event.startDate);
        const endDate = parseISO(event.endDate);
        const duration = differenceInMilliseconds(endDate, startDate);

        const newStart = new Date(date);
        newStart.setHours(hour, minute, 0, 0);
        const newEnd = new Date(newStart.getTime() + duration);

        void updateEvent({
          ...event,
          startDate: newStart.toISOString(),
          endDate: newEnd.toISOString(),
        });

        return { moved: true };
      },
      collect: monitor => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [date, hour, minute, updateEvent]
  );

  const className = useMemo(() => {
    if (isOver && canDrop) return "bg-accent/50";
    return undefined;
  }, [canDrop, isOver]);

  drop(ref);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
