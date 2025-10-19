import type { EventColor } from "@/calendar/types";

export interface CalendarUser {
  id: string;
  name: string;
  picturePath?: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  color: EventColor;
  user: CalendarUser;
  metadata?: Record<string, unknown>;
}

export interface CalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
