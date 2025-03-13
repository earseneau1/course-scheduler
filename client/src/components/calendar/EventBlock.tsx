import { useState, useRef } from "react";
import { type ScheduleEvent } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { minutesToPx, pxToMinutes, snapTime, formatTime } from "@/lib/time";
import { AssignProfessorDialog } from "@/components/dialogs/AssignProfessorDialog";
import { AssignClassDialog } from "@/components/dialogs/AssignClassDialog";
import { Trash2, GripVertical, UserPlus, BookOpen } from "lucide-react";
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
      const deltaY = e.clientY - startY.current;
      const deltaMins = pxToMinutes(deltaY);

      if (isDragging) {
        const newStartTime = snapTime(initialTop.current + deltaMins);
        onUpdate({ id: event.id, startTime: newStartTime });
      } else if (isResizing) {
        if (isResizing === "top") {
          const newStartTime = snapTime(initialTop.current + deltaMins);
          const newDuration = initialHeight.current - (newStartTime - initialTop.current);
          onUpdate({ 
            id: event.id, 
            startTime: newStartTime,
            duration: newDuration
          });
        } else {
          const newDuration = snapTime(initialHeight.current + deltaMins);
          onUpdate({ id: event.id, duration: newDuration });
        }
      }
    };

    const handleMouseUp = () => {
      setDragging(false);
      setResizing(null);
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <>
      <Card
        className={cn(
          "absolute left-1 right-1 overflow-hidden",
          event.repeatPattern ? "opacity-70" : "",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{
          top: minutesToPx(event.startTime),
          height: minutesToPx(event.duration),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Resize handles */}
        <div
          className="absolute inset-x-0 top-0 h-2 cursor-ns-resize"
          onMouseDown={(e) => handleMouseDown(e, "resize-top")}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize"
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

          {/* Middle section with drag handle and time */}
          <div 
            className="flex flex-col items-center justify-center py-1"
            onMouseDown={(e) => handleMouseDown(e, "move")}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
            <div className="text-xs text-center mt-1">
              {formatTime(event.startTime)} - {formatTime(event.startTime + event.duration)}
            </div>
          </div>

          {/* Bottom row with delete button */}
          {!event.repeatPattern && (
            <div className="flex justify-center mt-1">
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