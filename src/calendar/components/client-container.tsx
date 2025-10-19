"use client";

import { useMemo } from "react";
import { isSameDay, parseISO } from "date-fns";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { DndProviderWrapper } from "@/calendar/components/dnd/dnd-provider";
import { CalendarHeader } from "@/calendar/components/header/calendar-header";
import { CalendarYearView } from "@/calendar/components/year-view/calendar-year-view";
import { CalendarMonthView } from "@/calendar/components/month-view/calendar-month-view";
import { CalendarAgendaView } from "@/calendar/components/agenda-view/calendar-agenda-view";
import { CalendarDayView } from "@/calendar/components/week-and-day-view/calendar-day-view";
import { CalendarWeekView } from "@/calendar/components/week-and-day-view/calendar-week-view";

export function ClientContainer() {
  const { events, selectedDate, selectedView, selectedUserId } = useCalendar();

  const filteredEvents = useMemo(() => {
    if (selectedUserId === "all") return events;
    return events.filter(event => event.user?.id === selectedUserId);
  }, [events, selectedUserId]);

  const { singleDayEvents, multiDayEvents } = useMemo(() => {
    const multiDay: typeof filteredEvents = [];
    const singleDay: typeof filteredEvents = [];

    filteredEvents.forEach(event => {
      const start = parseISO(event.startDate);
      const end = parseISO(event.endDate);

      const isSingleDay = isSameDay(start, end);
      if (isSingleDay) {
        singleDay.push(event);
      } else {
        multiDay.push(event);
      }
    });

    return { singleDayEvents: singleDay, multiDayEvents: multiDay };
  }, [filteredEvents]);

  return (
    <DndProviderWrapper>
      <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
        <CalendarHeader events={filteredEvents} />

        {selectedView === "year" && <CalendarYearView allEvents={filteredEvents} />}
        {selectedView === "month" && (
          <CalendarMonthView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />
        )}
        {selectedView === "week" && (
          <CalendarWeekView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />
        )}
        {selectedView === "day" && (
          <CalendarDayView selectedDate={selectedDate} singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />
        )}
        {selectedView === "agenda" && (
          <CalendarAgendaView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />
        )}
      </div>
    </DndProviderWrapper>
  );
}
