"use client";

import { Fragment, useMemo } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useCalendar } from "@/calendar/contexts/calendar-context";
import { getEventColorStyles } from "@/calendar/colors";
import type { CalendarEvent } from "@/calendar/interfaces";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CalendarAgendaViewProps {
  singleDayEvents: CalendarEvent[];
  multiDayEvents: CalendarEvent[];
}

export function CalendarAgendaView({ singleDayEvents, multiDayEvents }: CalendarAgendaViewProps) {
  const { selectedDate } = useCalendar();

  const events = useMemo(() => {
    return [...multiDayEvents, ...singleDayEvents].sort((a, b) => {
      const left = parseISO(a.startDate).getTime();
      const right = parseISO(b.startDate).getTime();
      return left - right;
    });
  }, [multiDayEvents, singleDayEvents]);

  const groupedByDay = useMemo(() => {
    const groups = new Map<string, CalendarEvent[]>();
    events.forEach(event => {
      const start = parseISO(event.startDate);
      const key = format(start, "yyyy-MM-dd");
      const bucket = groups.get(key) ?? [];
      bucket.push(event);
      groups.set(key, bucket);
    });
    return groups;
  }, [events]);

  if (!events.length) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Nenhuma tarefa programada para este período.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[560px]">
      <div className="space-y-6 p-4">
        {[...groupedByDay.entries()].map(([key, dayEvents]) => {
          const dayDate = parseISO(`${key}T00:00:00`);
          const isSelectedDay = isSameDay(dayDate, selectedDate);

          return (
            <Fragment key={key}>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {format(dayDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dayEvents.length} tarefa(s)
                  </p>
                </div>
                {isSelectedDay ? (
                  <Badge variant="outline" className="text-xs uppercase text-primary">
                    Hoje
                  </Badge>
                ) : null}
              </div>

              <div className="space-y-3">
                {dayEvents.map(event => {
                  const start = parseISO(event.startDate);
                  const end = parseISO(event.endDate);
                  const color = getEventColorStyles(event.color);

                  return (
                    <div
                      key={event.id}
                      className={`flex flex-col gap-2 rounded-lg border bg-background/60 p-4 shadow-sm ${color.border}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`size-2.5 rounded-full ${color.dot}`} aria-hidden />
                        <p className="text-sm font-semibold text-foreground">{event.title}</p>
                        <Badge variant="outline" className={`text-[10px] uppercase ${color.badge}`}>
                          {format(start, "HH:mm", { locale: ptBR })} - {format(end, "HH:mm", { locale: ptBR })}
                        </Badge>
                      </div>
                      {event.description ? (
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>Responsável:</span>
                        <span className="font-medium text-foreground">{event.user?.name ?? "Sem responsável"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Fragment>
          );
        })}
      </div>
    </ScrollArea>
  );
}
