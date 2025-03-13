import React, { useState, useRef, useEffect } from "react";
import { Professor, Class, Room, ScheduleEvent } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import "./Calendar.css";

// Types
interface CalendarEvent {
  id: string;
  day: string;
  top: number;
  height: number;
  isRepeat?: boolean;
  repeatGroup?: string;
  repeatPattern?: string;
  professor?: Professor;
  classAssigned?: Class;
  room?: Room;
  justCreated?: boolean;
}

interface DragState {
  eventId: string;
  dragType: "move" | "resize-top" | "resize-bottom";
  startY: number;
  initialTop: number;
  initialHeight: number;
}

// Configuration
const startHour = 8;
const endHour = 18;
const hourHeight = 100;
const defaultEventDuration = 80;
const minDuration = 30;
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const restrictedDays = ["Wednesday", "Thursday", "Friday"] as const;
const restrictionStart = 9 * 60; // 9 AM in minutes

// Helper functions
const minutesToPx = (minutes: number): number => (minutes / 60) * hourHeight;
const pxToMinutes = (px: number): number => (px / hourHeight) * 60;

const formatTime = (totalMinutes: number): string => {
  const total = startHour * 60 + totalMinutes;
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 || 12;
  const minuteStr = minute.toString().padStart(2, "0");
  return `${displayHour}:${minuteStr} ${period}`;
};

const snapTime = (totalMinutes: number): number => {
  if (totalMinutes === defaultEventDuration) return totalMinutes;
  return Math.round(totalMinutes / 30) * 30;
};

const approxEqual = (a: number, b: number, tol = 2): boolean => Math.abs(a - b) <= tol;

const generateUniqueId = () => Date.now().toString() + Math.floor(Math.random() * 1000).toString();

// Main Calendar Component
const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const calendarGridRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch necessary data
  const { data: professors } = useQuery<Professor[]>({
    queryKey: ["/api/professors"],
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: rooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  // Event mutations
  const createEventMutation = useMutation({
    mutationFn: async (event: Omit<ScheduleEvent, "id">) => {
      const response = await fetch("/api/schedule-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create event");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-events"] });
      toast({ title: "Event created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Event handling functions
  const syncRepeatedEvents = (masterEvent: CalendarEvent) => {
    if (!masterEvent.repeatGroup) return;
    setEvents(prevEvents =>
      prevEvents.map(ev => {
        if (ev.isRepeat && ev.repeatGroup === masterEvent.repeatGroup) {
          return {
            ...ev,
            top: masterEvent.top,
            height: masterEvent.height,
            professor: masterEvent.professor,
            classAssigned: masterEvent.classAssigned,
            room: masterEvent.room,
          };
        }
        return ev;
      })
    );
  };

  const checkAndCreateRepeats = (masterEvent: CalendarEvent, forceRecreate = false) => {
    const groupId = masterEvent.repeatGroup;
    const duration = Math.round(pxToMinutes(masterEvent.height));
    let expectedRepeats: { day: string; pattern: string }[] = [];

    if (masterEvent.day === "Monday") {
      if (approxEqual(duration, 50)) {
        expectedRepeats = [
          { day: "Wednesday", pattern: "MWF" },
          { day: "Friday", pattern: "MWF" },
        ];
      } else if (approxEqual(duration, 80)) {
        expectedRepeats = [{ day: "Wednesday", pattern: "MWF" }];
      }
    } else if (masterEvent.day === "Tuesday" && approxEqual(duration, 80)) {
      expectedRepeats = [{ day: "Thursday", pattern: "TR" }];
    }

    const currentRepeats = events.filter(ev => ev.isRepeat && ev.repeatGroup === groupId);
    const currentRepeatDays = currentRepeats.map(ev => ev.day);

    if (!forceRecreate &&
        expectedRepeats.length === currentRepeats.length &&
        expectedRepeats.every(exp => currentRepeatDays.includes(exp.day))) {
      syncRepeatedEvents(masterEvent);
      return;
    }

    // Remove old repeats
    setEvents(prevEvents =>
      prevEvents.filter(ev => !(ev.isRepeat && ev.repeatGroup === groupId))
    );

    // Create new repeats
    expectedRepeats.forEach(({ day, pattern }) => {
      const newRepeat: CalendarEvent = {
        id: generateUniqueId(),
        day,
        top: masterEvent.top,
        height: masterEvent.height,
        isRepeat: true,
        repeatGroup: groupId,
        repeatPattern: pattern,
        professor: masterEvent.professor,
        classAssigned: masterEvent.classAssigned,
        room: masterEvent.room,
      };
      setEvents(prev => [...prev, newRepeat]);
    });
  };

  // Mouse event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;

      setEvents(prevEvents =>
        prevEvents.map(ev => {
          if (ev.id !== dragState.eventId) return ev;

          const parentHeight = calendarGridRef.current?.clientHeight || 0;

          if (dragState.dragType === "move") {
            let newTop = dragState.initialTop + (e.clientY - dragState.startY);
            newTop = Math.max(0, Math.min(newTop, parentHeight - ev.height));
            return { ...ev, top: newTop };
          } else if (dragState.dragType === "resize-top") {
            let newTop = dragState.initialTop + (e.clientY - dragState.startY);
            let currentBottom = dragState.initialTop + dragState.initialHeight;
            newTop = Math.max(0, Math.min(newTop, currentBottom - minutesToPx(minDuration)));
            return { ...ev, top: newTop, height: currentBottom - newTop };
          } else if (dragState.dragType === "resize-bottom") {
            let newHeight = dragState.initialHeight + (e.clientY - dragState.startY);
            newHeight = Math.max(
              minutesToPx(minDuration),
              Math.min(newHeight, parentHeight - ev.top)
            );
            return { ...ev, height: newHeight };
          }
          return ev;
        })
      );
    };

    const handleMouseUp = () => {
      if (!dragState) return;

      setEvents(prevEvents =>
        prevEvents.map(ev => {
          if (ev.id !== dragState.eventId) return ev;

          let snappedTop = minutesToPx(snapTime(pxToMinutes(ev.top)));
          if (restrictedDays.includes(ev.day as typeof restrictedDays[number]) &&
              snappedTop < minutesToPx(restrictionStart)) {
            snappedTop = minutesToPx(restrictionStart);
          }

          const updatedEvent = { ...ev, top: snappedTop };

          if (dragState.dragType !== "move") {
            const snappedHeight = minutesToPx(snapTime(pxToMinutes(ev.height)));
            updatedEvent.height = snappedHeight;
          }

          syncRepeatedEvents(updatedEvent);
          return updatedEvent;
        })
      );

      setDragState(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState]);

  const handleDayClick = (e: React.MouseEvent<HTMLDivElement>, day: string) => {
    if ((e.target as HTMLElement).closest(".event")) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    let clickMinutes = pxToMinutes(clickY);

    if (restrictedDays.includes(day as typeof restrictedDays[number]) && clickMinutes < restrictionStart) {
      toast({
        title: "Invalid time slot",
        description: `Events on ${day} must be scheduled after ${formatTime(restrictionStart)}`,
        variant: "destructive",
      });
      return;
    }

    let snappedMinutes = snapTime(clickMinutes);
    if (restrictedDays.includes(day as typeof restrictedDays[number]) && snappedMinutes < restrictionStart) {
      snappedMinutes = restrictionStart;
    }

    const snappedY = minutesToPx(snappedMinutes);
    const newEvent: CalendarEvent = {
      id: generateUniqueId(),
      day,
      top: snappedY,
      height: minutesToPx(defaultEventDuration),
      repeatGroup: generateUniqueId(),
      justCreated: true,
    };

    setEvents(prev => [...prev, newEvent]);
    checkAndCreateRepeats(newEvent);
  };


  const handleEventMouseDown = (
    e: React.MouseEvent,
    event: CalendarEvent,
    dragType: "move" | "resize-top" | "resize-bottom"
  ) => {
    e.stopPropagation();
    if (event.justCreated) {
      setEvents(prevEvents =>
        prevEvents.map(ev => (ev.id === event.id ? { ...ev, justCreated: false } : ev))
      );
    }
    setDragState({
      eventId: event.id,
      dragType,
      startY: e.clientY,
      initialTop: event.top,
      initialHeight: event.height,
    });
  };

  // Render calendar grid
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Faculty Schedule</h1>

      {/* Day Headers */}
      <div className="flex relative">
        <div className="w-16"></div>
        {days.map(day => (
          <div key={day} className="flex-1 text-center font-bold">
            {day}
          </div>
        ))}
      </div>

      <div className="flex relative">
        {/* Time Gutter */}
        <div className="w-16 relative">
          {Array.from({ length: endHour - startHour + 1 }, (_, i) => {
            const y = i * hourHeight;
            return (
              <div
                key={i}
                className="absolute right-1 text-xs"
                style={{ top: y - 7 }}
              >
                {formatTime(i * 60)}
              </div>
            );
          })}
        </div>

        {/* Calendar Grid */}
        <div
          ref={calendarGridRef}
          className="flex-1 relative border border-gray-200"
          style={{ height: hourHeight * (endHour - startHour) }}
        >
          <div className="flex h-full">
            {days.map(day => (
              <div
                key={day}
                className="flex-1 relative border-r border-gray-100"
                onClick={(e) => handleDayClick(e, day)}
                data-day={day}
              >
                {/* Hour lines */}
                {Array.from({ length: endHour - startHour + 1 }, (_, i) => {
                  const y = i * hourHeight;
                  return (
                    <React.Fragment key={i}>
                      <div
                        className="absolute w-full h-px bg-gray-200"
                        style={{ top: y }}
                      />
                      {/* Half-hour snap lines */}
                      {i < endHour - startHour && (
                        <div
                          className="absolute w-full h-px bg-gray-100"
                          style={{ top: y + hourHeight / 2 }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Events */}
                {events
                  .filter(ev => ev.day === day)
                  .map(ev => (
                    <div
                      key={ev.id}
                      className={`absolute left-1 right-1 rounded shadow-sm cursor-grab 
                        ${ev.isRepeat ? 'bg-green-100' : 'bg-blue-100'}
                        ${dragState?.eventId === ev.id ? 'opacity-75' : 'opacity-100'}
                      `}
                      style={{
                        top: ev.top,
                        height: ev.height,
                      }}
                      onMouseDown={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.classList.contains("resize-handle")) return;

                        setDragState({
                          eventId: ev.id,
                          dragType: "move",
                          startY: e.clientY,
                          initialTop: ev.top,
                          initialHeight: ev.height,
                        });
                      }}
                    >
                      {/* Resize handles */}
                      {!ev.isRepeat && (
                        <>
                          <div
                            className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize bg-gray-200 rounded-t"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setDragState({
                                eventId: ev.id,
                                dragType: "resize-top",
                                startY: e.clientY,
                                initialTop: ev.top,
                                initialHeight: ev.height,
                              });
                            }}
                          />
                          <div
                            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-gray-200 rounded-b"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setDragState({
                                eventId: ev.id,
                                dragType: "resize-bottom",
                                startY: e.clientY,
                                initialTop: ev.top,
                                initialHeight: ev.height,
                              });
                            }}
                          />
                        </>
                      )}

                      {/* Event content */}
                      <div className="p-2 text-xs">
                        <div className="font-bold">
                          {formatTime(Math.round(pxToMinutes(ev.top)))} -{" "}
                          {formatTime(Math.round(pxToMinutes(ev.top + ev.height)))}
                        </div>
                        {ev.professor && (
                          <div className="text-gray-600">{ev.professor.name}</div>
                        )}
                        {ev.classAssigned && (
                          <div className="text-gray-600">
                            {ev.classAssigned.prefix} {ev.classAssigned.code}
                          </div>
                        )}
                        {ev.room && (
                          <div className="text-gray-600">{ev.room.name}</div>
                        )}
                        {ev.repeatPattern && (
                          <div className="text-gray-500 text-xs">
                            Pattern: {ev.repeatPattern}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;