"use client";

import { useMemo } from "react";
import { addHours, isValid, parseISO } from "date-fns";

import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { ClientContainer } from "@/calendar/components/client-container";
import type { CalendarEvent, CalendarUser } from "@/calendar/interfaces";
import type { EventColor } from "@/calendar/types";
import type { ChecklistTask, NotificationSeverity } from "@/types/platform";

interface ChecklistTaskCalendarProps {
  tasks: ChecklistTask[];
  onCreateEvent?: (event: CalendarEvent) => Promise<void> | void;
  onUpdateEvent?: (event: CalendarEvent) => Promise<void> | void;
  onDeleteEvent?: (event: CalendarEvent) => Promise<void> | void;
}

const fallbackUser: CalendarUser = {
  id: "sem-responsavel",
  name: "Sem responsável",
};

const severityToColor: Record<NotificationSeverity, EventColor> = {
  vermelho: "red",
  laranja: "orange",
  verde: "green",
};

function ownerToUser(owner?: string): CalendarUser {
  const name = owner?.trim() || fallbackUser.name;
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || fallbackUser.id;
  return { id, name };
}

function normalizeDueDate(dueDate?: string) {
  if (!dueDate) return null;
  const parsed = parseISO(dueDate);
  if (!isValid(parsed)) return null;

  const hasTime = parsed.getHours() !== 0 || parsed.getMinutes() !== 0;
  if (!hasTime) {
    parsed.setHours(9, 0, 0, 0);
  }

  const start = parsed;
  const end = addHours(start, 1);
  return { start, end };
}

export function ChecklistTaskCalendar({ tasks, onCreateEvent, onUpdateEvent, onDeleteEvent }: ChecklistTaskCalendarProps) {
  const { users, events } = useMemo(() => {
    const userMap = new Map<string, CalendarUser>();
    userMap.set(fallbackUser.id, fallbackUser);

    const calendarEvents: CalendarEvent[] = [];

    tasks.forEach(task => {
      if (!task.dueDate) return;
      const normalized = normalizeDueDate(task.dueDate);
      if (!normalized) return;

      const user = ownerToUser(task.owner);
      userMap.set(user.id, user);

      calendarEvents.push({
        id: task.id,
        title: task.title,
        description: task.description,
        startDate: normalized.start.toISOString(),
        endDate: normalized.end.toISOString(),
        color: severityToColor[task.severity] ?? "orange",
        user,
        metadata: {
          checklistTask: task,
        },
      });
    });

    calendarEvents.sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());

    return {
      users: Array.from(userMap.values()),
      events: calendarEvents,
    } as const;
  }, [tasks]);

  return (
    <CalendarProvider
      users={users}
      events={events}
      onCreateEvent={onCreateEvent}
      onUpdateEvent={onUpdateEvent}
      onDeleteEvent={onDeleteEvent}
    >
      <ClientContainer />
    </CalendarProvider>
  );
}
