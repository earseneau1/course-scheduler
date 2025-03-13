import { useState, useRef } from "react";
import { type ScheduleEvent } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { minutesToPx, pxToMinutes, formatTime, snapTime } from "@/lib/time";
import { AssignProfessorDialog } from "@/components/dialogs/AssignProfessorDialog";
import { AssignClassDialog } from "@/components/dialogs/AssignClassDialog";
import { Trash2, UserPlus, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventBlockProps {
  event: ScheduleEvent;
  onUpdate: (event: Partial<ScheduleEvent> & { id: number }) => void;
  onDelete: (id: number) => void;
  setIsDragging: (dragging: boolean) => void;
}

export function EventBlock({ event, onUpdate, onDelete, setIsDragging }: EventBlockProps) {
  const [isDragging, setDragging] = useState(false);
  const [isResizing, setResizing] = useState<"top" | "bottom" | null>(null);
  const [showProfessorDialog, setShowProfessorDialog] = useState(false);
  const [showClassDialog, setShowClassDialog] = useState(false);

  const startY = useRef(0);
  const initialTop = useRef(0);
  const initialHeight = useRef(0);

  const handleMouseDown = (e: React.MouseEvent, type: "move" | "resize-top" | "resize-bottom") => {
    e.preventDefault();
    e.stopPropagation();

    startY.current = e.clientY;
    initialTop.current = event.startTime;
    initialHeight.current = event.duration;

    if (type === "move") {
      setDragging(true);
    } else {
      setResizing(type === "resize-top" ? "top" : "bottom");
    }
    setIsDragging(true);

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const deltaY = e.clientY - startY.current;
      const deltaMins = pxToMinutes(deltaY);

      if (isDragging) {
        const newStartTime = initialTop.current + deltaMins;
        onUpdate({ id: event.id, startTime: snapTime(newStartTime) });
      } else if (isResizing) {
        if (isResizing === "top") {
          const newStartTime = initialTop.current + deltaMins;
          const newDuration = initialHeight.current - deltaMins;
          onUpdate({ 
            id: event.id, 
            startTime: snapTime(newStartTime),
            duration: snapTime(newDuration)
          });
        } else {
          const newDuration = initialHeight.current + deltaMins;
          onUpdate({ id: event.id, duration: snapTime(newDuration) });
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setDragging(false);
      setResizing(null);
      setIsDragging(false);

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleDurationPreset = (duration: number) => {
    onUpdate({ id: event.id, duration });
  };

  return (
    <>
      <Card
        className={cn(
          "absolute left-1 right-1 overflow-hidden event",
          event.repeatPattern ? "opacity-70" : "",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{
          top: minutesToPx(event.startTime),
          height: minutesToPx(event.duration),
        }}
        onMouseDown={(e) => handleMouseDown(e, "move")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Resize handles */}
        <div
          className="absolute inset-x-0 top-0 h-2 cursor-ns-resize resize-handle"
          onMouseDown={(e) => handleMouseDown(e, "resize-top")}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize resize-handle"
          onMouseDown={(e) => handleMouseDown(e, "resize-bottom")}
        />

        {/* Event content */}
        <div className="p-2 relative">
          {/* Top row with assign buttons */}
          <div className="flex justify-between items-center mb-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                setShowProfessorDialog(true);
              }}
            >
              <UserPlus className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                setShowClassDialog(true);
              }}
            >
              <BookOpen className="h-4 w-4" />
            </Button>
          </div>

          {/* Time display */}
          <div className="text-xs text-center mt-1">
            {formatTime(event.startTime)} - {formatTime(event.startTime + event.duration)}
          </div>

          {/* Bottom section with duration presets and delete */}
          {!event.repeatPattern && (
            <div className="mt-1">
              <div className="flex justify-between items-center">
                {/* Delete button on the left */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(event.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                {/* Duration presets on the right */}
                <div className="flex gap-1">
                  {event.day !== "Tuesday" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDurationPreset(50);
                      }}
                    >
                      50
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDurationPreset(80);
                    }}
                  >
                    80
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDurationPreset(160);
                    }}
                  >
                    160
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <AssignProfessorDialog
        open={showProfessorDialog}
        onOpenChange={setShowProfessorDialog}
        onAssign={(professorId: number) => {
          onUpdate({ id: event.id, professorId });
        }}
      />

      <AssignClassDialog
        open={showClassDialog}
        onOpenChange={setShowClassDialog}
        onAssign={(classId: number) => {
          onUpdate({ id: event.id, classId });
        }}
      />
    </>
  );
}