import { List, Columns, Grid2x2, Grid3x3, CalendarRange, Plus } from "lucide-react";

import { useCalendar } from "@/calendar/contexts/calendar-context";
import type { CalendarEvent } from "@/calendar/interfaces";
import { Button } from "@/components/ui/button";
import { AddEventDialog } from "@/calendar/components/dialogs/add-event-dialog";
import { TodayButton } from "@/calendar/components/header/today-button";
import { DateNavigator } from "@/calendar/components/header/date-navigator";
import { UserSelect } from "@/calendar/components/header/user-select";

interface CalendarHeaderProps {
  events: CalendarEvent[];
}

const VIEW_BUTTONS = [
  { value: "day", icon: List, label: "Dia" },
  { value: "week", icon: Columns, label: "Semana" },
  { value: "month", icon: Grid2x2, label: "Mês" },
  { value: "year", icon: Grid3x3, label: "Ano" },
  { value: "agenda", icon: CalendarRange, label: "Agenda" },
] as const;

export function CalendarHeader({ events }: CalendarHeaderProps) {
  const { selectedView, setSelectedView } = useCalendar();

  return (
    <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <TodayButton />
          <DateNavigator events={events} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="inline-flex overflow-hidden rounded-lg border">
            {VIEW_BUTTONS.map(({ value, icon: Icon, label }, index) => (
              <Button
                key={value}
                type="button"
                size="icon"
                variant={selectedView === value ? "default" : "ghost"}
                className={index === 0 ? "rounded-none" : "-ml-px rounded-none"}
                aria-label={`Visualizar por ${label}`}
                onClick={() => setSelectedView(value)}
              >
                <Icon strokeWidth={1.8} className="size-5" />
              </Button>
            ))}
          </div>

          <UserSelect />
        </div>
      </div>

      <AddEventDialog>
        <Button className="w-full gap-2 sm:w-auto">
          <Plus className="size-4" />
          Nova tarefa
        </Button>
      </AddEventDialog>
    </div>
  );
}
