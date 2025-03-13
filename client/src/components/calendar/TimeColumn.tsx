import { START_HOUR, END_HOUR, HOUR_HEIGHT, formatTime } from "@/lib/time";

export function TimeColumn() {
  return (
    <div className="w-20 flex-shrink-0 relative border-r">
      {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
        const hour = START_HOUR + i;
        const y = i * HOUR_HEIGHT;
        
        return (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t text-xs text-gray-500 px-2"
            style={{ top: y }}
          >
            {formatTime(i * 60)}
          </div>
        );
      })}
    </div>
  );
}
