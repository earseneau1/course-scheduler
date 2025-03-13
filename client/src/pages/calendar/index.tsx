import React, { useState, useRef, useEffect } from "react";
import "./Calendar.css"; // Make sure to add appropriate styles if needed

// ----- Configuration & Helper Functions -----
const startHour = 8;
const endHour = 18;
const hourHeight = 100; // pixels per hour
const defaultEventDuration = 80; // in minutes
const minDuration = 30; // in minutes
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const restrictedDays = ["Wednesday", "Thursday", "Friday"];
const restrictionStart = 9 * 60; // minutes (e.g., 9AM)

// Converts minutes to pixel height based on hourHeight
function minutesToPx(minutes: number): number {
  return (minutes / 60) * hourHeight;
}

// Converts pixel value back to minutes
function pxToMinutes(px: number): number {
  return (px / hourHeight) * 60;
}

// Formats minutes (from startHour) into a human-readable time string
function formatTime(totalMinutes: number): string {
  let total = startHour * 60 + totalMinutes;
  let hour = Math.floor(total / 60);
  let minute = total % 60;
  let period = hour < 12 ? "AM" : "PM";
  let displayHour = hour % 12;
  if (displayHour === 0) displayHour = 12;
  let minuteStr = minute < 10 ? "0" + minute : minute.toString();
  return `${displayHour}:${minuteStr} ${period}`;
}

// Snaps a given duration to the nearest 30 minutes unless it is exactly the default duration.
function snapTime(totalMinutes: number): number {
  if (totalMinutes === defaultEventDuration) return totalMinutes;
  return Math.round(totalMinutes / 30) * 30;
}

function approxEqual(a: number, b: number, tol = 2): boolean {
  return Math.abs(a - b) <= tol;
}

function generateUniqueId() {
  return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
}

// ----- Type Definitions -----
type CalendarEvent = {
  id: string;
  day: string;
  top: number; // pixel position from top
  height: number; // pixel height
  isRepeat?: boolean;
  repeatGroup?: string;
  repeatPattern?: string;
  professor?: string;
  classAssigned?: string;
  justCreated?: boolean;
};

type DragState = {
  eventId: string;
  dragType: "move" | "resize-top" | "resize-bottom";
  startY: number;
  initialTop: number;
  initialHeight: number;
};

// ----- Main Calendar Component -----
const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const calendarGridRef = useRef<HTMLDivElement>(null);

  // Global mousemove and mouseup handling for drag/resize functionality.
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
            newHeight = Math.max(minutesToPx(minDuration), Math.min(newHeight, parentHeight - ev.top));
            return { ...ev, height: newHeight };
          }
          return ev;
        })
      );
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragState) return;
      setEvents(prevEvents =>
        prevEvents.map(ev => {
          if (ev.id !== dragState.eventId) return ev;
          // Snap top position and height
          let snappedTop = minutesToPx(snapTime(pxToMinutes(ev.top)));
          if (restrictedDays.includes(ev.day) && snappedTop < minutesToPx(restrictionStart)) {
            snappedTop = minutesToPx(restrictionStart);
          }
          let updatedEvent = { ...ev, top: snappedTop };
          if (dragState.dragType !== "move") {
            let snappedHeight = minutesToPx(snapTime(pxToMinutes(ev.height)));
            updatedEvent.height = snappedHeight;
          }
          // After snapping, update repeated events
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

  // Sync repeated events with the master event.
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
          };
        }
        return ev;
      })
    );
  };

  // Create or update repeated events based on the master event’s repeat pattern.
  const checkAndCreateRepeats = (masterEvent: CalendarEvent, forceRecreate: boolean = false) => {
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
    if (
      !forceRecreate &&
      expectedRepeats.length === currentRepeats.length &&
      expectedRepeats.every(exp => currentRepeatDays.includes(exp.day))
    ) {
      syncRepeatedEvents(masterEvent);
      return;
    }

    // Remove old repeats.
    setEvents(prevEvents =>
      prevEvents.filter(ev => !(ev.isRepeat && ev.repeatGroup === groupId))
    );
    // Create new repeats.
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
      };
      setEvents(prev => [...prev, newRepeat]);
    });
  };

  // ----- Event Handlers -----
  // Handle clicks on day columns to create new events.
  const handleDayClick = (e: React.MouseEvent<HTMLDivElement>, day: string) => {
    if ((e.target as HTMLElement).closest(".event")) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    let clickMinutes = pxToMinutes(clickY);
    if (restrictedDays.includes(day) && clickMinutes < restrictionStart) {
      alert(`Events on ${day} must be scheduled after the restriction time.`);
      return;
    }
    let snappedMinutes = snapTime(clickMinutes);
    if (restrictedDays.includes(day) && snappedMinutes < restrictionStart) {
      snappedMinutes = restrictionStart;
    }
    const snappedY = minutesToPx(snappedMinutes);
    const newEvent: CalendarEvent = {
      id: generateUniqueId(),
      day,
      top: snappedY,
      height: minutesToPx(defaultEventDuration),
      repeatGroup: generateUniqueId(),
      professor: "",
      classAssigned: "",
      justCreated: true,
    };
    setEvents(prev => [...prev, newEvent]);
    checkAndCreateRepeats(newEvent);
  };

  // Handle mousedown on an event’s area for dragging or resizing.
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

  // ----- Rendering -----
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Faculty Schedule</h1>
      {/* Day Headers */}
      <div style={{ display: "flex", position: "relative" }}>
        <div style={{ width: "60px" }}></div>
        {days.map(day => (
          <div key={day} style={{ flex: 1, textAlign: "center", fontWeight: "bold" }}>
            {day}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", position: "relative" }}>
        {/* Time Gutter */}
        <div style={{ width: "60px", position: "relative" }}>
          {Array.from({ length: endHour - startHour + 1 }, (_, i) => {
            const y = i * hourHeight;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: y - 7,
                  right: 5,
                  fontSize: "12px",
                }}
              >
                {formatTime(i * 60)}
              </div>
            );
          })}
        </div>
        {/* Calendar Grid */}
        <div
          ref={calendarGridRef}
          style={{
            flex: 1,
            position: "relative",
            border: "1px solid #ccc",
            height: hourHeight * (endHour - startHour),
          }}
        >
          <div style={{ display: "flex", height: "100%" }}>
            {days.map(day => (
              <div
                key={day}
                className="day-column"
                style={{
                  flex: 1,
                  position: "relative",
                  borderRight: "1px solid #eee",
                }}
                onClick={(e) => handleDayClick(e, day)}
                data-day={day}
              >
                {/* Hour and snap lines */}
                {Array.from({ length: endHour - startHour + 1 }, (_, i) => {
                  const y = i * hourHeight;
                  return (
                    <div key={i}>
                      <div
                        style={{
                          position: "absolute",
                          top: y,
                          width: "100%",
                          height: "1px",
                          backgroundColor: "#ddd",
                        }}
                      ></div>
                      {(() => {
                        const halfY = minutesToPx(i * 60 + 30);
                        if (halfY <= hourHeight * (endHour - startHour)) {
                          return (
                            <div
                              key={"snap" + i}
                              style={{
                                position: "absolute",
                                top: halfY,
                                width: "100%",
                                height: "1px",
                                backgroundColor: "#f0f0f0",
                              }}
                            ></div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  );
                })}
                {/* Render events in the column */}
                {events
                  .filter(ev => ev.day === day)
                  .map(ev => (
                    <div
                      key={ev.id}
                      className="event"
                      style={{
                        position: "absolute",
                        top: ev.top,
                        height: ev.height,
                        left: "5px",
                        right: "5px",
                        backgroundColor: ev.isRepeat ? "#d1e7dd" : "#cfe2ff",
                        border: "1px solid #999",
                        boxSizing: "border-box",
                        cursor:
                          dragState && dragState.eventId === ev.id ? "grabbing" : "grab",
                      }}
                      data-day={ev.day}
                    >
                      {/* Resize Handle (Top) */}
                      <div
                        className="resize-handle top"
                        style={{
                          height: "5px",
                          cursor: "ns-resize",
                          backgroundColor: "#888",
                        }}
                        onMouseDown={(e) => handleEventMouseDown(e, ev, "resize-top")}
                      ></div>
                      {/* Event Label */}
                      <div
                        style={{
                          padding: "2px",
                          textAlign: "center",
                          fontSize: "12px",
                        }}
                      >
                        {formatTime(Math.round(pxToMinutes(ev.top)))} -{" "}
                        {formatTime(Math.round(pxToMinutes(ev.top + ev.height)))}
                      </div>
                      {/* Resize Handle (Bottom) */}
                      <div
                        className="resize-handle bottom"
                        style={{
                          height: "5px",
                          cursor: "ns-resize",
                          backgroundColor: "#888",
                        }}
                        onMouseDown={(e) => handleEventMouseDown(e, ev, "resize-bottom")}
                      ></div>
                      {/* Action Buttons */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "10px",
                          padding: "0 2px",
                        }}
                      >
                        <button
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            const newProf = prompt("Assign Professor", ev.professor || "");
                            if (newProf !== null) {
                              setEvents((prev: CalendarEvent[]) =>
                                prev.map((event: CalendarEvent) =>
                                  event.id === ev.id
                                    ? { ...event, professor: newProf }
                                    : event
                                )
                              );
                              syncRepeatedEvents({ ...ev, professor: newProf });
                            }
                          }}
                        >
                          Assign Prof
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newClass = prompt("Assign Class", ev.classAssigned || "");
                            if (newClass !== null) {
                              setEvents((prev: CalendarEvent[]) =>
                                prev.map((event: CalendarEvent) =>
                                  event.id === ev.id
                                    ? { ...event, classAssigned: newClass }
                                    : event
                                )
                              );
                              syncRepeatedEvents({ ...ev, classAssigned: newClass });
                            }
                          }}
                        >
                          Assign Class
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Delete this event and its repeats?")) {
                              setEvents(prev =>
                                prev.filter(
                                  event =>
                                    event.id !== ev.id &&
                                    event.repeatGroup !== ev.repeatGroup
                                )
                              );
                            }
                          }}
                        >
                          Delete
                        </button>
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