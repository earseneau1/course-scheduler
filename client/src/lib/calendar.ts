import { Day, DAYS, RESTRICTED_DAYS } from "@shared/schema";
import { generateUniqueId } from "./utils";
import { DEFAULT_EVENT_DURATION, RESTRICTION_START, approxEqual } from "./time";

export type RepeatPattern = "MWF" | "TR";

export interface RepeatInfo {
  day: Day;
  pattern: RepeatPattern;
}

export function getExpectedRepeats(day: Day, duration: number): RepeatInfo[] {
  if (day === "Monday") {
    if (approxEqual(duration, 50)) {
      return [
        { day: "Wednesday", pattern: "MWF" },
        { day: "Friday", pattern: "MWF" }
      ];
    } else if (approxEqual(duration, 80)) {
      return [{ day: "Wednesday", pattern: "MWF" }];
    }
  } else if (day === "Tuesday" && approxEqual(duration, 80)) {
    return [{ day: "Thursday", pattern: "TR" }];
  }
  return [];
}

export function checkTimeRestriction(day: Day, minutes: number): boolean {
  return !RESTRICTED_DAYS.includes(day as any) || minutes >= RESTRICTION_START;
}

export function createRepeatGroupId(): string {
  return generateUniqueId();
}
