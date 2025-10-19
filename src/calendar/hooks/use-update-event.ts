"use client";

import { useCallback } from "react";

import { useCalendar } from "@/calendar/contexts/calendar-context";
import type { CalendarEvent } from "@/calendar/interfaces";

export function useUpdateEvent() {
  const { updateEvent } = useCalendar();

  const handleUpdate = useCallback(
    async (event: CalendarEvent) => {
      await updateEvent(event);
    },
    [updateEvent]
  );

  return { updateEvent: handleUpdate };
}
