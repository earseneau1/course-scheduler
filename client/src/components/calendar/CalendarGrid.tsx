import { DAYS, type Day, type ScheduleEvent, type InsertEvent } from "@shared/schema";
import { TimeColumn } from "./TimeColumn";
import { DayColumn } from "./DayColumn";
import { START_HOUR, END_HOUR, HOUR_HEIGHT } from "@/lib/time";

interface CalendarGridProps {
  events: ScheduleEvent[];
  onEventCreate: (event: InsertEvent) => void;
  onEventUpdate: (event: Partial<ScheduleEvent> & { id: number }) => void;
  onEventDelete: (id: number) => void;
}

export function CalendarGrid({ events, onEventCreate, onEventUpdate, onEventDelete }: CalendarGridProps) {
  const gridHeight = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex border-b">
        <div className="w-20 flex-shrink-0" />
        {DAYS.map((day) => (
          <div key={day} className="flex-1 p-2 text-center font-semibold">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex" style={{ height: gridHeight }}>
        <TimeColumn />
        
        <div className="flex flex-1">
          {DAYS.map((day) => (
            <DayColumn
              key={day}
              day={day as Day}
              events={events.filter(e => e.day === day)}
              onEventCreate={onEventCreate}
              onEventUpdate={onEventUpdate}
              onEventDelete={onEventDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
