import type { EventColor } from "@/calendar/types";

type ColorStyles = {
  badge: string;
  dot: string;
  border: string;
  pill: string;
};

const COLOR_STYLES: Record<EventColor, ColorStyles> = {
  blue: {
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
    border: "border-blue-500/40",
    pill: "bg-blue-500/10 text-blue-700 dark:text-blue-200",
  },
  green: {
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    border: "border-emerald-500/40",
    pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  },
  red: {
    badge: "bg-red-500/15 text-red-700 dark:text-red-300",
    dot: "bg-red-500",
    border: "border-red-500/40",
    pill: "bg-red-500/10 text-red-700 dark:text-red-200",
  },
  yellow: {
    badge: "bg-yellow-400/30 text-yellow-700 dark:text-yellow-200",
    dot: "bg-yellow-400",
    border: "border-yellow-500/40",
    pill: "bg-yellow-400/20 text-yellow-800 dark:text-yellow-200",
  },
  purple: {
    badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
    border: "border-purple-500/40",
    pill: "bg-purple-500/10 text-purple-700 dark:text-purple-200",
  },
  orange: {
    badge: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500",
    border: "border-orange-500/40",
    pill: "bg-orange-500/10 text-orange-700 dark:text-orange-200",
  },
  gray: {
    badge: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
    dot: "bg-slate-500",
    border: "border-slate-500/40",
    pill: "bg-slate-500/10 text-slate-700 dark:text-slate-200",
  },
};

export function getEventColorStyles(color: EventColor): ColorStyles {
  return COLOR_STYLES[color] ?? COLOR_STYLES.blue;
}
