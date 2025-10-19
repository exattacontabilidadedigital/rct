"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useCalendar } from "@/calendar/contexts/calendar-context";
import type { CalendarEvent } from "@/calendar/interfaces";
import { cn } from "@/lib/utils";

interface CalendarYearViewProps {
  allEvents: CalendarEvent[];
}

export function CalendarYearView({ allEvents }: CalendarYearViewProps) {
  const { selectedDate, setSelectedDate, setSelectedView } = useCalendar();

  const year = selectedDate.getFullYear();

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, monthIndex) => new Date(year, monthIndex, 1)),
    [year]
  );

  return (
    <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
      {months.map(monthDate => {
        const monthEvents = allEvents.filter(event => {
          const start = parseISO(event.startDate);
          return start.getFullYear() === monthDate.getFullYear() && start.getMonth() === monthDate.getMonth();
        });

        const topEvents = monthEvents.slice(0, 3);

        return (
          <button
            key={monthDate.toISOString()}
            type="button"
            onClick={() => {
              setSelectedDate(monthDate);
              setSelectedView("month");
            }}
            className={cn(
              "flex h-full w-full flex-col gap-3 rounded-xl border bg-background/60 p-4 text-left shadow-sm transition",
              "hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            )}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">{format(monthDate, "MMMM", { locale: ptBR })}</p>
              <span className="text-xs text-muted-foreground">{monthEvents.length} tarefa(s)</span>
            </div>

            <div className="space-y-2">
              {topEvents.length ? (
                topEvents.map(event => (
                  <div key={event.id} className="rounded-md border border-border/60 bg-card p-3 text-xs text-foreground">
                    <p className="line-clamp-2 font-medium">{event.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(parseISO(event.startDate), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Nenhuma tarefa programada.</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
