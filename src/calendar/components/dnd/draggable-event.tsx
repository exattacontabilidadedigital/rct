"use client";

import { useDrag } from "react-dnd";

import type { ReactNode } from "react";
import type { CalendarEvent } from "@/calendar/interfaces";

export const ItemTypes = {
  EVENT: "calendar-event",
} as const;

interface DraggableEventProps {
  event: CalendarEvent;
  children: ReactNode;
}

export function DraggableEvent({ event, children }: DraggableEventProps) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ItemTypes.EVENT,
      item: { event, type: ItemTypes.EVENT },
      collect: monitor => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [event]
  );

  return (
    <div ref={drag} className={isDragging ? "opacity-50" : undefined}>
      {children}
    </div>
  );
}
