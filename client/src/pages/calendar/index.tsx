import React, { useState, useRef, useEffect } from "react";
import { Professor, Class, Room, ScheduleEvent } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserCircle2, BookOpen } from "lucide-react";
import "./Calendar.css";

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
  master?: boolean;
  justCreated?: boolean;
}

interface DragState {
  eventId: string;
  dragType: "move" | "resize-top" | "resize-bottom";
  startY: number;
  initialTop: number;
  initialHeight: number;
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const restrictedDays = ["Wednesday", "Thursday", "Friday"] as const;
const startHour = 8, endHour = 18, hourHeight = 100;
const defaultEventDuration = 80, minDuration = 30;
const restrictionStart = 9 * 60; // 9 AM in minutes

function generateUniqueId(): string {
  return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
}

function minutesToPx(minutes: number): number {
  return (minutes / 60) * hourHeight;
}

function pxToMinutes(px: number): number {
  return (px / hourHeight) * 60;
}

function formatTime(totalMinutes: number): string {
  const total = startHour * 60 + totalMinutes;
  let hour = Math.floor(total / 60);
  const minute = total % 60;
  const period = hour < 12 ? 'AM' : 'PM';
  hour = hour % 12 === 0 ? 12 : hour % 12;
  const minuteStr = minute < 10 ? '0' + minute : minute.toString();
  return `${hour}:${minuteStr} ${period}`;
}

function snapTime(totalMinutes: number): number {
  if (totalMinutes === defaultEventDuration) return totalMinutes;
  return Math.round(totalMinutes / 30) * 30;
}

function approxEqual(a: number, b: number, tol = 2): boolean {
  return Math.abs(a - b) <= tol;
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const currentEventRef = useRef<CalendarEvent | null>(null);
  const dragTypeRef = useRef<"move" | "resize-top" | "resize-bottom" | null>(null);
  const dragStartYRef = useRef<number>(0);
  const initialTopRef = useRef<number>(0);
  const initialHeightRef = useRef<number>(0);
  const { toast } = useToast();

  // Fetch data
  const { data: professors } = useQuery<Professor[]>({
    queryKey: ["/api/professors"],
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: rooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const syncRepeatedEvents = (masterEvent: CalendarEvent) => {
    if (!masterEvent.repeatGroup) return;
    setEvents(prev => prev.map(ev => {
      if (ev.repeatGroup === masterEvent.repeatGroup && ev.id !== masterEvent.id) {
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
    }));
  };

  const checkAndCreateRepeats = (event: CalendarEvent, forceRecreate: boolean = false) => {
    const duration = Math.round(pxToMinutes(event.height));
    let expectedRepeats: { day: string; pattern: string }[] = [];

    if (event.day === "Monday") {
      if (approxEqual(duration, 50)) {
        expectedRepeats = [
          { day: "Wednesday", pattern: "MWF" },
          { day: "Friday", pattern: "MWF" }
        ];
      } else if (approxEqual(duration, 80)) {
        expectedRepeats = [{ day: "Wednesday", pattern: "MWF" }];
      }
    } else if (event.day === "Tuesday" && approxEqual(duration, 80)) {
      expectedRepeats = [{ day: "Thursday", pattern: "TR" }];
    }

    // Remove old repeats
    setEvents(prev => prev.filter(ev => !(ev.repeatGroup === event.repeatGroup && ev.id !== event.id)));

    // Create new repeats
    expectedRepeats.forEach(({ day, pattern }) => {
      const repeatedEvent: CalendarEvent = {
        id: generateUniqueId(),
        day,
        top: event.top,
        height: event.height,
        isRepeat: true,
        repeatGroup: event.repeatGroup,
        repeatPattern: pattern,
        professor: event.professor,
        classAssigned: event.classAssigned,
        room: event.room
      };
      setEvents(prev => [...prev, repeatedEvent]);
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!currentEventRef.current || !dragTypeRef.current) return;

      const containerHeight = (endHour - startHour) * hourHeight;
      const currentEvent = currentEventRef.current;

      if (dragTypeRef.current === "move") {
        let newTop = initialTopRef.current + (e.clientY - dragStartYRef.current);
        newTop = Math.max(0, Math.min(newTop, containerHeight - currentEvent.height));
        currentEvent.top = newTop;
      } else if (dragTypeRef.current === "resize-top") {
        let newTop = initialTopRef.current + (e.clientY - dragStartYRef.current);
        const currentBottom = initialTopRef.current + initialHeightRef.current;
        newTop = Math.max(0, Math.min(newTop, currentBottom - minutesToPx(minDuration)));
        currentEvent.top = newTop;
        currentEvent.height = currentBottom - newTop;
      } else if (dragTypeRef.current === "resize-bottom") {
        let newHeight = initialHeightRef.current + (e.clientY - dragStartYRef.current);
        newHeight = Math.max(minutesToPx(minDuration), Math.min(newHeight, containerHeight - currentEvent.top));
        currentEvent.height = newHeight;
      }

      setEvents(prev => prev.map(ev => ev.id === currentEvent.id ? { ...currentEvent } : ev));
      syncRepeatedEvents(currentEvent);
    };

    const handleMouseUp = () => {
      if (!currentEventRef.current || !dragTypeRef.current) return;

      let currentEvent = currentEventRef.current;
      let snappedTop = minutesToPx(snapTime(pxToMinutes(currentEvent.top)));

      if (restrictedDays.includes(currentEvent.day as typeof restrictedDays[number]) && 
          snappedTop < minutesToPx(restrictionStart)) {
        snappedTop = minutesToPx(restrictionStart);
      }

      currentEvent.top = snappedTop;

      if (dragTypeRef.current !== "move") {
        currentEvent.height = minutesToPx(snapTime(pxToMinutes(currentEvent.height)));
        checkAndCreateRepeats(currentEvent, true);
      }

      setEvents(prev => prev.map(ev => ev.id === currentEvent.id ? { ...currentEvent } : ev));
      syncRepeatedEvents(currentEvent);

      currentEventRef.current = null;
      dragTypeRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleDayClick = (e: React.MouseEvent<HTMLDivElement>, day: string) => {
    if ((e.target as HTMLElement).closest(".event")) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    let clickMinutes = pxToMinutes(clickY);

    if (restrictedDays.includes(day as typeof restrictedDays[number]) && clickMinutes < restrictionStart) {
      toast({
        title: "Invalid time slot",
        description: `Events on ${day} must be after ${formatTime(restrictionStart)}`
      });
      return;
    }

    let snappedMinutes = snapTime(clickMinutes);
    if (restrictedDays.includes(day as typeof restrictedDays[number]) && snappedMinutes < restrictionStart) {
      snappedMinutes = restrictionStart;
    }

    const newEvent: CalendarEvent = {
      id: generateUniqueId(),
      day,
      top: minutesToPx(snappedMinutes),
      height: minutesToPx(defaultEventDuration),
      master: true,
      repeatGroup: generateUniqueId(),
      justCreated: true
    };

    setEvents(prev => [...prev, newEvent]);
    checkAndCreateRepeats(newEvent);
  };

  return (
    <div className="calendar-container">
      <div className="header-days">
        {days.map(day => (
          <div key={day} className="day-header">
            {day}
          </div>
        ))}
      </div>

      <div style={{ display: "flex" }}>
        <div className="time-gutter">
          {Array.from({ length: endHour - startHour + 1 }, (_, i) => {
            const y = i * hourHeight;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: y - 7,
                  right: 5,
                  fontSize: 12
                }}
              >
                {formatTime(i * 60)}
              </div>
            );
          })}
        </div>

        <div className="day-columns-container">
          {days.map(day => (
            <div
              key={day}
              className="day-column"
              onClick={(e) => handleDayClick(e, day)}
              data-day={day}
            >
              {/* Hour lines */}
              {Array.from({ length: endHour - startHour + 1 }, (_, i) => {
                const y = i * hourHeight;
                return (
                  <div key={i}>
                    <div className="hour-line" style={{ top: y }} />
                    {(() => {
                      const halfY = minutesToPx(i * 60 + 30);
                      if (halfY <= hourHeight * (endHour - startHour)) {
                        return (
                          <div className="snap-line" style={{ top: halfY }} />
                        );
                      }
                      return null;
                    })()}
                  </div>
                );
              })}

              {/* Events */}
              {events
                .filter(ev => ev.day === day)
                .map(ev => (
                  <div
                    key={ev.id}
                    className={`event ${ev.isRepeat ? "repeat-event" : ""}`}
                    style={{
                      top: ev.top,
                      height: ev.height,
                      left: "5px",
                      right: "5px",
                      position: "absolute",
                      border: "1px solid #999",
                      boxSizing: "border-box",
                    }}
                    onMouseDown={(e) => {
                      if (ev.justCreated) {
                        setEvents(prev => prev.map(event => 
                          event.id === ev.id ? { ...event, justCreated: false } : event
                        ));
                      }

                      const target = e.target as HTMLElement;
                      if (target.classList.contains("assign-professor") || 
                          target.classList.contains("assign-class") ||
                          target.classList.contains("preset-button") || 
                          target.classList.contains("delete-button")) return;

                      dragTypeRef.current = target.classList.contains("resize-handle") ? 
                        (target.classList.contains("top") ? "resize-top" : "resize-bottom") : 
                        "move";

                      currentEventRef.current = ev;
                      dragStartYRef.current = e.clientY;
                      initialTopRef.current = ev.top;
                      initialHeightRef.current = ev.height;
                      e.stopPropagation();
                    }}
                  >
                    {!ev.isRepeat && (
                      <>
                        <div className="resize-handle top" />
                        <div className="resize-handle bottom" />
                      </>
                    )}

                    <div className="event-header">
                      <button 
                        className="assign-professor"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newProf = prompt("Assign Professor", ev.professor?.name || "");
                          if (newProf) {
                            setEvents(prev => prev.map(event => 
                              event.id === ev.id ? { ...event, professor: { name: newProf } } : event
                            ));
                            syncRepeatedEvents({ ...ev, professor: { name: newProf } });
                          }
                        }}
                      >
                        <UserCircle2 className="h-4 w-4" />
                      </button>

                      <button 
                        className="assign-class"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newClass = prompt("Assign Class", ev.classAssigned?.name || "");
                          if (newClass) {
                            setEvents(prev => prev.map(event => 
                              event.id === ev.id ? { ...event, classAssigned: { name: newClass } } : event
                            ));
                            syncRepeatedEvents({ ...ev, classAssigned: { name: newClass } });
                          }
                        }}
                      >
                        <BookOpen className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="label">
                      {formatTime(Math.round(pxToMinutes(ev.top)))} -{" "}
                      {formatTime(Math.round(pxToMinutes(ev.top + ev.height)))}
                    </div>

                    {!ev.isRepeat && (
                      <div className="event-controls">
                        <button
                          className="delete-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete this event and its repeats?")) {
                              setEvents(prev => prev.filter(event => 
                                event.id !== ev.id && event.repeatGroup !== ev.repeatGroup
                              ));
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="preset-buttons">
                          {ev.day !== "Tuesday" && (
                            <button
                              className="preset-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const updatedEvent = { ...ev, height: minutesToPx(50) };
                                setEvents(prev => prev.map(event => 
                                  event.id === ev.id ? updatedEvent : event
                                ));
                                syncRepeatedEvents(updatedEvent);
                                checkAndCreateRepeats(updatedEvent, true);
                              }}
                            >
                              50
                            </button>
                          )}
                          <button
                            className="preset-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updatedEvent = { ...ev, height: minutesToPx(80) };
                              setEvents(prev => prev.map(event => 
                                event.id === ev.id ? updatedEvent : event
                              ));
                              syncRepeatedEvents(updatedEvent);
                              checkAndCreateRepeats(updatedEvent, true);
                            }}
                          >
                            80
                          </button>
                          <button
                            className="preset-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updatedEvent = { ...ev, height: minutesToPx(160) };
                              setEvents(prev => prev.map(event => 
                                event.id === ev.id ? updatedEvent : event
                              ));
                              syncRepeatedEvents(updatedEvent);
                              checkAndCreateRepeats(updatedEvent, true);
                            }}
                          >
                            160
                          </button>
                        </div>
                      </div>
                    )}
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