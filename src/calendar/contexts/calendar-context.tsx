"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { CalendarEvent, CalendarUser } from "@/calendar/interfaces";
import type { BadgeVariant, CalendarView, VisibleHours, WorkingHours } from "@/calendar/types";

type EventMutationState = {
  loading: boolean;
  error?: string;
};

interface CalendarContextValue {
  selectedDate: Date;
  setSelectedDate: (date: Date | undefined) => void;
  selectedView: CalendarView;
  setSelectedView: Dispatch<SetStateAction<CalendarView>>;
  selectedUserId: CalendarUser["id"] | "all";
  setSelectedUserId: Dispatch<SetStateAction<CalendarUser["id"] | "all">>;
  badgeVariant: BadgeVariant;
  setBadgeVariant: Dispatch<SetStateAction<BadgeVariant>>;
  users: CalendarUser[];
  events: CalendarEvent[];
  setLocalEvents: Dispatch<SetStateAction<CalendarEvent[]>>;
  workingHours: WorkingHours;
  setWorkingHours: Dispatch<SetStateAction<WorkingHours>>;
  visibleHours: VisibleHours;
  setVisibleHours: Dispatch<SetStateAction<VisibleHours>>;
  eventMutation: EventMutationState;
  createEvent: (payload: CalendarEvent) => Promise<void>;
  updateEvent: (payload: CalendarEvent) => Promise<void>;
  deleteEvent: (payload: CalendarEvent) => Promise<void>;
}

const WORKING_HOURS: WorkingHours = {
  0: { from: 0, to: 0 },
  1: { from: 8, to: 17 },
  2: { from: 8, to: 17 },
  3: { from: 8, to: 17 },
  4: { from: 8, to: 17 },
  5: { from: 8, to: 17 },
  6: { from: 8, to: 12 },
};

const VISIBLE_HOURS: VisibleHours = { from: 7, to: 18 };

interface CalendarProviderProps {
  children: ReactNode;
  users: CalendarUser[];
  events: CalendarEvent[];
  initialView?: CalendarView;
  onCreateEvent?: (event: CalendarEvent) => Promise<void> | void;
  onUpdateEvent?: (event: CalendarEvent) => Promise<void> | void;
  onDeleteEvent?: (event: CalendarEvent) => Promise<void> | void;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({
  children,
  users,
  events,
  initialView = "month",
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
}: CalendarProviderProps) {
  const [badgeVariant, setBadgeVariant] = useState<BadgeVariant>("colored");
  const [visibleHours, setVisibleHours] = useState<VisibleHours>(VISIBLE_HOURS);
  const [workingHours, setWorkingHours] = useState<WorkingHours>(WORKING_HOURS);

  const [selectedDate, setSelectedDateState] = useState(() => new Date());
  const [selectedView, setSelectedView] = useState<CalendarView>(initialView);
  const [selectedUserId, setSelectedUserId] = useState<CalendarUser["id"] | "all">("all");
  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>(events);
  const [eventMutation, setEventMutation] = useState<EventMutationState>({ loading: false });

  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  const memoizedUsers = useMemo(() => users, [users]);

  const setSelectedDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDateState(date);
  };

  const runMutation = async (
    cb: ((event: CalendarEvent) => Promise<void> | void) | undefined,
    event: CalendarEvent,
    optimisticUpdater: (events: CalendarEvent[]) => CalendarEvent[]
  ) => {
    setEventMutation({ loading: true });
    setLocalEvents(prev => optimisticUpdater(prev));

    if (!cb) {
      setEventMutation({ loading: false });
      return;
    }

    try {
      await cb(event);
      setEventMutation({ loading: false });
    } catch (error) {
      console.error(error);
      setEventMutation({ loading: false, error: error instanceof Error ? error.message : "Failed to update event" });
    }
  };

  const createEvent = async (event: CalendarEvent) => {
    await runMutation(onCreateEvent, event, prev => [...prev, event]);
  };

  const updateEvent = async (event: CalendarEvent) => {
    await runMutation(onUpdateEvent, event, prev => prev.map(item => (item.id === event.id ? event : item)));
  };

  const deleteEvent = async (event: CalendarEvent) => {
    await runMutation(onDeleteEvent, event, prev => prev.filter(item => item.id !== event.id));
  };

  const value: CalendarContextValue = {
    selectedDate,
    setSelectedDate,
    selectedView,
    setSelectedView,
    selectedUserId,
    setSelectedUserId,
    badgeVariant,
    setBadgeVariant,
    users: memoizedUsers,
    events: localEvents,
    setLocalEvents,
    workingHours,
    setWorkingHours,
    visibleHours,
    setVisibleHours,
    eventMutation,
    createEvent,
    updateEvent,
    deleteEvent,
  };

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) throw new Error("useCalendar must be used within a CalendarProvider");
  return context;
}
