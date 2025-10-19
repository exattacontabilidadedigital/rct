"use client";

import { useMemo } from "react";
import { eachDayOfInterval, endOfWeek, format, isSameDay, isSameMonth, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useCalendar } from "@/calendar/contexts/calendar-context";
import { DroppableDayCell } from "@/calendar/components/dnd/droppable-day-cell";
import { calculateMonthEventPositions, getCalendarCells, getMonthCellEvents } from "@/calendar/helpers";
import { getEventColorStyles } from "@/calendar/colors";
import type { CalendarEvent } from "@/calendar/interfaces";
import { cn } from "@/lib/utils";

interface CalendarMonthViewProps {
  singleDayEvents: CalendarEvent[];
  multiDayEvents: CalendarEvent[];
}

const WEEKDAY_LABELS = eachDayOfInterval({
  start: startOfWeek(new Date(), { weekStartsOn: 1 }),
  end: endOfWeek(new Date(), { weekStartsOn: 1 }),
});

export function CalendarMonthView({ singleDayEvents, multiDayEvents }: CalendarMonthViewProps) {
  const { selectedDate } = useCalendar();

  const allEvents = useMemo(() => [...multiDayEvents, ...singleDayEvents], [multiDayEvents, singleDayEvents]);

  const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate]);

  const positions = useMemo(
    () => calculateMonthEventPositions(multiDayEvents, singleDayEvents, selectedDate),
    [multiDayEvents, singleDayEvents, selectedDate]
  );

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase text-muted-foreground">
        {WEEKDAY_LABELS.map(day => (
          <span key={day.getDay()}>{format(day, "EEEEEE", { locale: ptBR })}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 rounded-lg border bg-background p-2 shadow-inner">
        {cells.map(cell => {
          const dayEvents = getMonthCellEvents(cell.date, allEvents, positions);
          const isToday = isSameDay(cell.date, new Date());

          return (
            <DroppableDayCell key={cell.date.toISOString()} cell={cell}>
              <div
                className={cn(
                  "flex min-h-[108px] flex-col rounded-md border p-2 text-xs transition",
                  cell.currentMonth ? "bg-background" : "bg-muted/40 text-muted-foreground",
                  isToday && "border-primary/60 bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-semibold", !isSameMonth(cell.date, selectedDate) && "opacity-70")}>{
                    cell.day
                  }</span>
                  {dayEvents.length ? (
                    <span className="text-[10px] text-muted-foreground">{dayEvents.length} tarefa(s)</span>
                  ) : null}
                </div>

                <div className="mt-2 space-y-1">
                  {dayEvents.map(event => {
                    const color = getEventColorStyles(event.color);
                    const start = parseISO(event.startDate);
                    const end = parseISO(event.endDate);
                    const multiDay = !isSameDay(start, end);

                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "flex items-center gap-2 rounded-md border px-2 py-1 text-left text-[11px]",
                          color.border,
                          color.pill
                        )}
                      >
                        <span className={cn("size-2 rounded-full", color.dot)} aria-hidden />
                        <span className="line-clamp-1 font-medium">{event.title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(start, "HH:mm")}
                          {multiDay ? " • " + format(end, "dd/MM") : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </DroppableDayCell>
          );
        })}
      </div>
    </div>
  );
}
