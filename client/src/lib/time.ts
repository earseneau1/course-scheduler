export const START_HOUR = 8;
export const END_HOUR = 18;
export const HOUR_HEIGHT = 100;
export const DEFAULT_EVENT_DURATION = 80;
export const MIN_DURATION = 30;
export const RESTRICTION_START = 9 * 60; // 9 AM in minutes

export function minutesToPx(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT;
}

export function pxToMinutes(px: number): number {
  return (px / HOUR_HEIGHT) * 60;
}

export function formatTime(totalMinutes: number): string {
  const total = START_HOUR * 60 + totalMinutes;
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 || 12;
  const minuteStr = minute < 10 ? '0' + minute : minute;
  return `${displayHour}:${minuteStr} ${period}`;
}

export function snapTime(totalMinutes: number): number {
  if (totalMinutes === DEFAULT_EVENT_DURATION) return totalMinutes;
  return Math.round(totalMinutes / 30) * 30;
}

export function approxEqual(a: number, b: number, tolerance = 2): boolean {
  return Math.abs(a - b) <= tolerance;
}
