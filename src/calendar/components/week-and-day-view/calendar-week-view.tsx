"use client";

import { useMemo } from "react";
import { addDays, eachDayOfInterval, format, isSameDay, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useCalendar } from "@/calendar/contexts/calendar-context";
import { DroppableTimeBlock } from "@/calendar/components/dnd/droppable-time-block";
import { DraggableEvent } from "@/calendar/components/dnd/draggable-event";
import { getEventBlockStyle, getVisibleHours, groupEvents } from "@/calendar/helpers";
import { getEventColorStyles } from "@/calendar/colors";
import type { CalendarEvent } from "@/calendar/interfaces";
import { cn } from "@/lib/utils";

interface CalendarWeekViewProps {
  singleDayEvents: CalendarEvent[];
  multiDayEvents: CalendarEvent[];
}

const MINUTE_STEP = 30;

function buildTimeSlots(hours: number[], minuteStep: number) {
  const slots: { hour: number; minute: number; label: string | null }[] = [];
  hours.forEach(hour => {
    for (let minute = 0; minute < 60; minute += minuteStep) {
      const label = minute === 0 ? `${hour.toString().padStart(2, "0")}:00` : null;
      slots.push({ hour, minute, label });
    }
  });
  return slots;
}

export function CalendarWeekView({ singleDayEvents, multiDayEvents }: CalendarWeekViewProps) {
  const { selectedDate, visibleHours } = useCalendar();

  const startWeek = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: startWeek, end: addDays(startWeek, 6) });

  const allEvents = useMemo(() => [...multiDayEvents, ...singleDayEvents], [multiDayEvents, singleDayEvents]);

  const weekEvents = useMemo(() => {
    return allEvents.filter(event => {
      const start = parseISO(event.startDate);
      const end = parseISO(event.endDate);
  return start <= addDays(startWeek, 7) && end >= startWeek;
    });
  }, [allEvents, startWeek]);

  const { hours } = useMemo(() => getVisibleHours(visibleHours, weekEvents), [visibleHours, weekEvents]);
  const timeSlots = useMemo(() => buildTimeSlots(hours, MINUTE_STEP), [hours]);
  const visibleRange = useMemo(() => {
    if (!hours.length) return visibleHours;
    const from = hours[0];
    const to = hours[hours.length - 1] + 1;
    return { from, to };
  }, [hours, visibleHours]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-0 border-b bg-muted/40 text-xs font-medium uppercase text-muted-foreground">
          <div className="px-3 py-3">Horário</div>
          {weekDays.map(day => {
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={cn("px-3 py-3 text-center", isToday && "bg-primary/10 text-primary")}
              >
                <p>{format(day, "EEE", { locale: ptBR })}</p>
                <p className="text-sm font-semibold text-foreground">{format(day, "d")}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[80px_repeat(7,1fr)]">
          <div className="border-r">
            {timeSlots.map(slot => (
              <div key={`${slot.hour}-${slot.minute}`} className="h-12 border-b px-3 text-[11px] text-muted-foreground">
                {slot.label}
              </div>
            ))}
          </div>

          {weekDays.map(day => {
            const dayEvents = weekEvents.filter(event => {
              const start = parseISO(event.startDate);
              const end = parseISO(event.endDate);
              return isSameDay(start, day) || (start < day && end > day);
            });

            const groups = groupEvents(dayEvents);
            const totalGroups = Math.max(groups.length, 1);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={cn("relative border-r", isToday && "bg-primary/5")}
              >
                <div className="absolute inset-0">
                  {timeSlots.map(slot => (
                    <DroppableTimeBlock
                      key={`${day.toISOString()}-${slot.hour}-${slot.minute}`}
                      date={day}
                      hour={slot.hour}
                      minute={slot.minute}
                    >
                      <div className="h-12 border-b border-dashed border-border/50" />
                    </DroppableTimeBlock>
                  ))}
                </div>

                <div className="relative">
                  {groups.map((group, groupIndex) =>
                    group.map(event => {
                      const color = getEventColorStyles(event.color);
                      const style = getEventBlockStyle(event, day, groupIndex, totalGroups, visibleRange);

                      return (
                        <DraggableEvent key={`${event.id}-${groupIndex}`} event={event}>
                          <div
                            className={cn(
                              "absolute rounded-md border px-2 py-1 text-[11px] shadow-sm",
                              color.border,
                              color.pill
                            )}
                            style={{ top: style.top, height: style.height, left: style.left, width: style.width }}
                          >
                            <p className="line-clamp-2 font-medium">{event.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {format(parseISO(event.startDate), "HH:mm")} - {format(parseISO(event.endDate), "HH:mm")}
                            </p>
                          </div>
                        </DraggableEvent>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
