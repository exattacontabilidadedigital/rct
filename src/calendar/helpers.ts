import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInMinutes,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isSameWeek,
  isSameYear,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";

import type { CalendarEvent, CalendarCell } from "@/calendar/interfaces";
import type { CalendarView, VisibleHours, WorkingHours } from "@/calendar/types";

export function rangeText(view: CalendarView, date: Date) {
  const formatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
  const formatterYear = new Intl.DateTimeFormat("pt-BR", { year: "numeric" });
  const formatterDay = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" });

  switch (view) {
    case "agenda":
    case "month":
      return formatter.format(date);
    case "year":
      return formatterYear.format(date);
    case "week": {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      const end = endOfWeek(date, { weekStartsOn: 1 });
      const startFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });
      const endFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric" });
      return `${startFormatter.format(start)} - ${endFormatter.format(end)}`;
    }
    case "day":
      return formatterDay.format(date);
    default:
      return formatter.format(date);
  }
}

export function navigateDate(date: Date, view: CalendarView, direction: "previous" | "next"): Date {
  const operations = {
    agenda: direction === "next" ? addMonths : subMonths,
    year: direction === "next" ? addYears : subYears,
    month: direction === "next" ? addMonths : subMonths,
    week: direction === "next" ? addWeeks : subWeeks,
    day: direction === "next" ? addDays : subDays,
  } satisfies Record<CalendarView, (date: Date, amount: number) => Date>;

  return operations[view](date, 1);
}

export function getEventsCount(events: CalendarEvent[], date: Date, view: CalendarView): number {
  const comparer = {
    agenda: isSameMonth,
    year: isSameYear,
    day: isSameDay,
    week: isSameWeek,
    month: isSameMonth,
  } satisfies Record<CalendarView, (dateLeft: Date, dateRight: Date) => boolean>;

  return events.filter(event => comparer[view](parseISO(event.startDate), date)).length;
}

export function getCurrentEvents(events: CalendarEvent[]) {
  const now = new Date();
  return events.filter(event => {
    const start = parseISO(event.startDate);
    const end = parseISO(event.endDate);
    return isWithinInterval(now, { start, end });
  });
}

export function groupEvents(events: CalendarEvent[]) {
  const sorted = [...events].sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
  const groups: CalendarEvent[][] = [];

  sorted.forEach(event => {
    const start = parseISO(event.startDate);
    const end = parseISO(event.endDate);

    let placed = false;

    for (const group of groups) {
      const overlap = group.some(groupEvent => {
        const groupStart = parseISO(groupEvent.startDate);
        const groupEnd = parseISO(groupEvent.endDate);
        return start < groupEnd && end > groupStart;
      });

      if (!overlap) {
        group.push(event);
        placed = true;
        break;
      }
    }

    if (!placed) {
      groups.push([event]);
    }
  });

  return groups;
}

export function getEventBlockStyle(
  event: CalendarEvent,
  day: Date,
  groupIndex: number,
  groupSize: number,
  visibleHoursRange?: { from: number; to: number }
) {
  const start = parseISO(event.startDate);
  const end = parseISO(event.endDate);

  const totalMinutes = differenceInMinutes(end, start);
  const minutesFromVisibleStart = visibleHoursRange
    ? Math.max(0, (start.getHours() - visibleHoursRange.from) * 60 + start.getMinutes())
    : start.getHours() * 60 + start.getMinutes();

  const offset = (minutesFromVisibleStart / 60) * 96;
  const height = Math.max(32, (totalMinutes / 60) * 96 - 8);

  const isSameDayEvent = isSameDay(start, day);
  const isSameDayEnd = isSameDay(end, day);

  return {
    top: `${offset}px`,
    height: `${height}px`,
    left: `${(groupIndex / groupSize) * 100}%`,
    width: `${100 / groupSize}%`,
    isStart: isSameDayEvent,
    isEnd: isSameDayEnd,
  };
}

export function isWorkingHour(day: Date, hour: number, workingHours: WorkingHours) {
  const dayIndex = day.getDay();
  const hoursConfig = workingHours[dayIndex];
  if (!hoursConfig) return false;
  return hour >= hoursConfig.from && hour < hoursConfig.to;
}

export function getVisibleHours(visibleHours: VisibleHours, events: CalendarEvent[]) {
  let earliestHour = visibleHours.from;
  let latestHour = visibleHours.to;

  events.forEach(event => {
    const startHour = parseISO(event.startDate).getHours();
    const endDate = parseISO(event.endDate);
    const endHour = endDate.getHours() + (endDate.getMinutes() > 0 ? 1 : 0);
    if (startHour < earliestHour) earliestHour = startHour;
    if (endHour > latestHour) latestHour = endHour;
  });

  latestHour = Math.min(24, Math.max(latestHour, earliestHour + 1));

  const hours = Array.from({ length: latestHour - earliestHour }, (_, index) => earliestHour + index);
  return { hours, earliestEventHour: earliestHour, latestEventHour: latestHour };
}

export function getCalendarCells(selectedDate: Date): CalendarCell[] {
  const firstDayOfMonth = startOfMonth(selectedDate);
  const lastDayOfMonth = endOfMonth(selectedDate);

  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return days.map(day => ({
    day: day.getDate(),
    currentMonth: day.getMonth() === selectedDate.getMonth(),
    date: day,
  }));
}

export function calculateMonthEventPositions(
  multiDayEvents: CalendarEvent[],
  singleDayEvents: CalendarEvent[],
  selectedDate: Date
) {
  const positions: Record<string, number> = {};
  const weeks = eachDayOfInterval({
    start: startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 1 }),
  });

  const weeksByIndex: CalendarCell[][] = [];
  for (let i = 0; i < weeks.length; i += 7) {
    const weekDays = weeks.slice(i, i + 7).map(day => ({
      day: day.getDate(),
      currentMonth: day.getMonth() === selectedDate.getMonth(),
      date: day,
    }));
    weeksByIndex.push(weekDays);
  }

  const eventsByWeek = [...multiDayEvents, ...singleDayEvents];

  weeksByIndex.forEach(week => {
    const usedRows: CalendarEvent[][] = [];

    week.forEach(cell => {
      eventsByWeek
        .filter(event => isSameDay(parseISO(event.startDate), cell.date) || isWithinInterval(cell.date, {
          start: startOfDay(parseISO(event.startDate)),
          end: startOfDay(parseISO(event.endDate)),
        }))
        .forEach(event => {
          if (positions[event.id]) return;

          let row = 0;
          while (usedRows[row] && usedRows[row].some(existing => {
            const existingStart = startOfDay(parseISO(existing.startDate));
            const existingEnd = startOfDay(parseISO(existing.endDate));
            const eventStart = startOfDay(parseISO(event.startDate));
            const eventEnd = startOfDay(parseISO(event.endDate));

            return isWithinInterval(existingStart, { start: eventStart, end: eventEnd }) ||
              isWithinInterval(eventStart, { start: existingStart, end: existingEnd });
          })) {
            row += 1;
          }

          if (!usedRows[row]) usedRows[row] = [];
          usedRows[row].push(event);
          positions[event.id] = row;
        });
    });
  });

  return positions;
}

export function getMonthCellEvents(
  date: Date,
  events: CalendarEvent[],
  eventPositions: Record<string, number>
) {
  return events
    .filter(event => {
      const start = startOfDay(parseISO(event.startDate));
      const end = startOfDay(parseISO(event.endDate));
      const current = startOfDay(date);
      return isWithinInterval(current, { start, end });
    })
    .map(event => ({
      ...event,
      position: eventPositions[event.id] ?? 0,
    }))
    .sort((a, b) => a.position - b.position);
}
