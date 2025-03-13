import React, { useState, useRef, useEffect } from "react";
import { Professor, Class, Room, ScheduleEvent } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserCircle2, BookOpen } from "lucide-react";
import "./Calendar.css";

// Types and Constants
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
const approxEqual = (a: number, b: number, tol = 2): boolean => Math.abs(a - b) <= tol;
const generateUniqueId = () => Date.now().toString() + Math.floor(Math.random() * 1000).toString();

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

  // Event mutation
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

  const handleEventMouseDown = (e: React.MouseEvent, event: CalendarEvent, dragType: DragState["dragType"]) => {
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
            checkAndCreateRepeats(updatedEvent, true);
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

  const renderEventContent = (ev: CalendarEvent) => (
    <>
      {/* Controls - Top */}
      <div className="event-controls top">
        <button
          className="control-button"
          onClick={(e) => {
            e.stopPropagation();
            const newProf = prompt("Assign Professor", ev.professor?.name || "");
            if (newProf !== null) {
              setEvents(prev =>
                prev.map(event =>
                  event.id === ev.id ? { ...event, professor: { name: newProf } } : event
                )
              );
              syncRepeatedEvents({ ...ev, professor: { name: newProf } });
            }
          }}
        >
          <UserCircle2 className="h-4 w-4" />
        </button>
        <button
          className="control-button"
          onClick={(e) => {
            e.stopPropagation();
            const newClass = prompt("Assign Class", ev.classAssigned?.name || "");
            if (newClass !== null) {
              setEvents(prev =>
                prev.map(event =>
                  event.id === ev.id ? { ...event, classAssigned: { name: newClass } } : event
                )
              );
              syncRepeatedEvents({ ...ev, classAssigned: { name: newClass } });
            }
          }}
        >
          <BookOpen className="h-4 w-4" />
        </button>
      </div>

      {/* Event Time */}
      <div className="event-time">
        {formatTime(Math.round(pxToMinutes(ev.top)))} -{" "}
        {formatTime(Math.round(pxToMinutes(ev.top + ev.height)))}
      </div>

      {/* Controls - Bottom */}
      <div className="event-controls bottom">
        <button
          className="control-button delete-button"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm("Delete this event and its repeats?")) {
              setEvents(prev =>
                prev.filter(
                  event => event.id !== ev.id && event.repeatGroup !== ev.repeatGroup
                )
              );
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <div className="flex gap-1">
          {!ev.isRepeat && ev.day !== "Tuesday" && (
            <button
              className="time-button"
              onClick={(e) => {
                e.stopPropagation();
                ev.height = minutesToPx(50);
                syncRepeatedEvents(ev);
                checkAndCreateRepeats(ev, true);
              }}
            >
              50
            </button>
          )}
          <button
            className="time-button"
            onClick={(e) => {
              e.stopPropagation();
              ev.height = minutesToPx(80);
              syncRepeatedEvents(ev);
              checkAndCreateRepeats(ev, true);
            }}
          >
            80
          </button>
          <button
            className="time-button"
            onClick={(e) => {
              e.stopPropagation();
              ev.height = minutesToPx(160);
              syncRepeatedEvents(ev);
              checkAndCreateRepeats(ev, true);
            }}
          >
            160
          </button>
        </div>
      </div>

      {/* Event Details */}
      <div className="event-details">
        {ev.professor && (
          <div>{ev.professor.name}</div>
        )}
        {ev.classAssigned && (
          <div>
            {ev.classAssigned.prefix} {ev.classAssigned.code}
          </div>
        )}
        {ev.room && (
          <div>{ev.room.name}</div>
        )}
        {ev.repeatPattern && (
          <div>
            Pattern: {ev.repeatPattern}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="calendar-container">
      <h1 className="text-2xl font-bold mb-4">Faculty Schedule</h1>

      {/* Day Headers */}
      <div className="flex">
        <div className="w-16" />
        {days.map(day => (
          <div key={day} className="flex-1 text-center font-bold py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="flex flex-1">
        {/* Time Gutter */}
        <div className="time-gutter">
          {Array.from({ length: endHour - startHour + 1 }, (_, i) => {
            const y = i * hourHeight;
            return (
              <div
                key={i}
                className="time-label"
                style={{ top: y }}
              >
                {formatTime(i * 60)}
              </div>
            );
          })}
        </div>

        {/* Calendar Grid */}
        <div
          ref={calendarGridRef}
          className="flex-1 flex border border-gray-200"
        >
          {days.map(day => (
            <div
              key={day}
              className="day-column"
              onClick={(e) => handleDayClick(e, day)}
            >
              {/* Hour lines */}
              {Array.from({ length: endHour - startHour + 1 }, (_, i) => {
                const y = i * hourHeight;
                return (
                  <React.Fragment key={i}>
                    <div
                      className="hour-line"
                      style={{ top: y }}
                    />
                    {i < endHour - startHour && (
                      <div
                        className="half-hour-line"
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
                    className={`event ${dragState?.eventId === ev.id ? 'dragging' : ''} ${ev.isRepeat ? 'repeat' : ''}`}
                    style={{
                      top: ev.top,
                      height: ev.height,
                    }}
                    onMouseDown={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('button')) return;
                      if (target.classList.contains('resize-handle')) return;
                      handleEventMouseDown(e, ev, "move");
                    }}
                  >
                    {!ev.isRepeat && (
                      <>
                        <div
                          className="resize-handle top"
                          onMouseDown={(e) => handleEventMouseDown(e, ev, "resize-top")}
                        />
                        <div
                          className="resize-handle bottom"
                          onMouseDown={(e) => handleEventMouseDown(e, ev, "resize-bottom")}
                        />
                      </>
                    )}
                    {renderEventContent(ev)}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;