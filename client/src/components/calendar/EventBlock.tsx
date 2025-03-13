import { useState, useRef } from "react";
import { type ScheduleEvent } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { minutesToPx, pxToMinutes, formatTime, snapTime } from "@/lib/time";
import { AssignProfessorDialog } from "@/components/dialogs/AssignProfessorDialog";
import { AssignClassDialog } from "@/components/dialogs/AssignClassDialog";
import { Trash2, GripVertical } from "lucide-react";

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
        className={`absolute left-1 right-1 ${
          event.repeatPattern ? "opacity-70" : ""
        }`}
        style={{
          top: minutesToPx(event.startTime),
          height: minutesToPx(event.duration),
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-2 cursor-ns-resize"
          onMouseDown={(e) => handleMouseDown(e, "resize-top")}
        />

        <div className="p-2">
          <div className="flex justify-between items-center mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProfessorDialog(true)}
            >
              {event.professorId ? "Prof. Assigned" : "Assign Professor"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClassDialog(true)}
            >
              {event.classId ? "Class Assigned" : "Assign Class"}
            </Button>
          </div>

          <div 
            className="flex items-center justify-center"
            onMouseDown={(e) => handleMouseDown(e, "move")}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
            <span className="ml-2">
              {formatTime(event.startTime)} - {formatTime(event.startTime + event.duration)}
            </span>
          </div>

          {!event.repeatPattern && (
            <Button
              variant="destructive"
              size="sm"
              className="mt-2"
              onClick={() => onDelete(event.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div
          className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize"
          onMouseDown={(e) => handleMouseDown(e, "resize-bottom")}
        />
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