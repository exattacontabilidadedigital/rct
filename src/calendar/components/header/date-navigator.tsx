import { ChevronLeft, ChevronRight } from "lucide-react";

import { useCalendar } from "@/calendar/contexts/calendar-context";
import { Button } from "@/components/ui/button";
import { getEventsCount, navigateDate, rangeText } from "@/calendar/helpers";
import type { CalendarEvent } from "@/calendar/interfaces";

interface DateNavigatorProps {
  events: CalendarEvent[];
}

export function DateNavigator({ events }: DateNavigatorProps) {
  const { selectedDate, setSelectedDate, selectedView } = useCalendar();

  const handleNavigate = (direction: "previous" | "next") => {
    const nextDate = navigateDate(selectedDate, selectedView, direction);
    setSelectedDate(nextDate);
  };

  const subtitle = `${getEventsCount(events, selectedDate, selectedView)} evento(s)`;

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="icon" onClick={() => handleNavigate("previous")}>
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex flex-col items-center">
        <span className="text-sm font-semibold capitalize">{rangeText(selectedView, selectedDate)}</span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>

      <Button variant="outline" size="icon" onClick={() => handleNavigate("next")}>
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
