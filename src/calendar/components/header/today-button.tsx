import { format } from "date-fns";

import { useCalendar } from "@/calendar/contexts/calendar-context";

export function TodayButton() {
  const { setSelectedDate } = useCalendar();

  const today = new Date();

  const handleClick = () => {
    setSelectedDate(today);
  };

  return (
    <button
      type="button"
      className="flex size-14 flex-col items-center overflow-hidden rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={handleClick}
    >
      <span className="flex h-6 w-full items-center justify-center bg-primary text-xs font-semibold text-primary-foreground">
        {format(today, "MMM").toUpperCase()}
      </span>
      <span className="flex w-full flex-1 items-center justify-center text-lg font-bold">{today.getDate()}</span>
    </button>
  );
}
