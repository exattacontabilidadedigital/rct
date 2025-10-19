export type CalendarView = "day" | "week" | "month" | "year" | "agenda";
export type EventColor = "blue" | "green" | "red" | "yellow" | "purple" | "orange" | "gray";
export type BadgeVariant = "dot" | "colored" | "mixed";
export type WorkingHours = { [weekDay: number]: { from: number; to: number } };
export type VisibleHours = { from: number; to: number };
