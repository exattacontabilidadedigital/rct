"use client";

import { useMemo } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useCalendar } from "@/calendar/contexts/calendar-context";
import { DroppableTimeBlock } from "@/calendar/components/dnd/droppable-time-block";
import { DraggableEvent } from "@/calendar/components/dnd/draggable-event";
import { getEventBlockStyle, getVisibleHours, groupEvents } from "@/calendar/helpers";
import { getEventColorStyles } from "@/calendar/colors";
import type { CalendarEvent } from "@/calendar/interfaces";
import { cn } from "@/lib/utils";

interface CalendarDayViewProps {
  selectedDate: Date;
  singleDayEvents: CalendarEvent[];
  multiDayEvents: CalendarEvent[];
}

const MINUTE_STEP = 30;

function buildTimeSlots(from: number, to: number) {
  const slots: { hour: number; minute: number; label: string | null }[] = [];
  for (let hour = from; hour < to; hour += 1) {
    for (let minute = 0; minute < 60; minute += MINUTE_STEP) {
      const label = minute === 0 ? `${hour.toString().padStart(2, "0")}:00` : null;
      slots.push({ hour, minute, label });
    }
  }
  return slots;
}

export function CalendarDayView({ selectedDate, singleDayEvents, multiDayEvents }: CalendarDayViewProps) {
  const { visibleHours } = useCalendar();

  const allEvents = useMemo(() => [...multiDayEvents, ...singleDayEvents], [multiDayEvents, singleDayEvents]);

  const dayEvents = useMemo(() => {
    return allEvents.filter(event => {
      const start = parseISO(event.startDate);
      const end = parseISO(event.endDate);
      return isSameDay(start, selectedDate) || (start < selectedDate && end > selectedDate);
    });
  }, [allEvents, selectedDate]);

  const { hours } = useMemo(() => getVisibleHours(visibleHours, dayEvents), [visibleHours, dayEvents]);
  const timeSlots = useMemo(() => buildTimeSlots(hours[0] ?? visibleHours.from, (hours[hours.length - 1] ?? visibleHours.to) + 1), [hours, visibleHours]);
  const groups = groupEvents(dayEvents);
  const totalGroups = Math.max(groups.length, 1);

  const visibleRange = {
    from: hours[0] ?? visibleHours.from,
    to: (hours[hours.length - 1] ?? visibleHours.to) + 1,
  };

  return (
    <div className="grid grid-cols-[120px_1fr]">
      <div className="border-r bg-muted/40">
        <div className="border-b px-4 py-4">
          <p className="text-xs font-medium text-muted-foreground">{format(selectedDate, "EEEE", { locale: ptBR })}</p>
          <p className="text-xl font-semibold text-foreground">{format(selectedDate, "d 'de' MMMM", { locale: ptBR })}</p>
        </div>
        {timeSlots.map(slot => (
          <div key={`${slot.hour}-${slot.minute}`} className="h-12 border-b px-4 text-[11px] text-muted-foreground">
            {slot.label}
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-0">
          {timeSlots.map(slot => (
            <DroppableTimeBlock
              key={`${slot.hour}-${slot.minute}`}
              date={selectedDate}
              hour={slot.hour}
              minute={slot.minute}
            >
              <div className="h-12 border-b border-dashed border-border/50" />
            </DroppableTimeBlock>
          ))}
        </div>

        <div className="relative min-h-[600px]">
          {groups.map((group, groupIndex) =>
            group.map(event => {
              const color = getEventColorStyles(event.color);
              const style = getEventBlockStyle(event, selectedDate, groupIndex, totalGroups, visibleRange);

              return (
                <DraggableEvent key={`${event.id}-${groupIndex}`} event={event}>
                  <div
                    className={cn(
                      "absolute rounded-md border px-3 py-2 text-sm shadow-sm",
                      color.border,
                      color.pill
                    )}
                    style={{ top: style.top, height: style.height, left: style.left, width: style.width }}
                  >
                    <p className="font-medium leading-tight">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(event.startDate), "HH:mm")} - {format(parseISO(event.endDate), "HH:mm")}
                    </p>
                    {event.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{event.description}</p>
                    ) : null}
                  </div>
                </DraggableEvent>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
