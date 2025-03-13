import { useRef, useState } from "react";
import { type Day, type ScheduleEvent, type InsertEvent } from "@shared/schema";
import { EventBlock } from "./EventBlock";
import { pxToMinutes, minutesToPx, snapTime, DEFAULT_EVENT_DURATION, HOUR_HEIGHT } from "@/lib/time";
import { checkTimeRestriction } from "@/lib/calendar";
import { useToast } from "@/hooks/use-toast";

interface DayColumnProps {
  day: Day;
  events: ScheduleEvent[];
  onEventCreate: (event: InsertEvent) => void;
  onEventUpdate: (event: Partial<ScheduleEvent> & { id: number }) => void;
  onEventDelete: (id: number) => void;
}

export function DayColumn({ day, events, onEventCreate, onEventUpdate, onEventDelete }: DayColumnProps) {
  const columnRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const handleColumnClick = (e: React.MouseEvent) => {
    if (!columnRef.current || isDragging) return;

    // Check if we clicked on an event or its children
    if (e.target instanceof Element && (
      e.target.closest('.event') ||
      e.target.closest('button') ||
      e.target.closest('.resize-handle')
    )) {
      return;
    }

    const rect = columnRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const clickMinutes = pxToMinutes(clickY);

    if (!checkTimeRestriction(day, clickMinutes)) {
      toast({
        title: "Time Restriction",
        description: `Events on ${day} must be after 9 AM`,
        variant: "destructive"
      });
      return;
    }

    const snappedMinutes = snapTime(clickMinutes);
    onEventCreate({
      day,
      startTime: snappedMinutes,
      duration: DEFAULT_EVENT_DURATION,
      repeatPattern: null,
      repeatGroupId: null,
      professorId: null,
      classId: null
    });
  };

  return (
    <div
      ref={columnRef}
      className="flex-1 relative border-r cursor-pointer"
      onClick={handleColumnClick}
    >
      {/* Hour grid lines */}
      <div className="absolute inset-0">
        {Array.from({ length: 24 }, (_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 border-t border-gray-200"
            style={{ top: i * HOUR_HEIGHT }}
          />
        ))}
      </div>

      {/* Events */}
      {events.map((event) => (
        <EventBlock
          key={event.id}
          event={event}
          onUpdate={onEventUpdate}
          onDelete={onEventDelete}
          setIsDragging={setIsDragging}
        />
      ))}
    </div>
  );
}