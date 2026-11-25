import type { DayInput, ItemInput } from "./contracts";

type ScheduleItem = Pick<ItemInput, "day_id" | "end_day_id" | "start_time" | "end_time" | "departure_utc_offset_minutes" | "arrival_utc_offset_minutes">;
type ScheduleDay = Pick<DayInput, "id" | "date">;
export const DAY_MINUTES = 1440;
const microsecondsPerMinute = 60_000_000;
export function localClockMicroseconds(time: string | null | undefined): number | null {
  const match = /^(\d{2}):(\d{2})(?::([0-5]\d)(?:\.(\d{1,6}))?)?$/.exec(time ?? "");
  if (!match) return null;
  const hour = Number(match[1]), minute = Number(match[2]);
  if (hour >= 24 || minute >= 60) return null;
  return (hour * 60 + minute) * microsecondsPerMinute + Number(match[3] ?? 0) * 1_000_000 + Number((match[4] ?? "").padEnd(6, "0"));
}
export function localMinute(time: string | null | undefined): number | null {
  const clock = localClockMicroseconds(time);
  return clock === null ? null : Math.floor(clock / microsecondsPerMinute);
}
export function absoluteLocalMinute(date: string, minute: number): number {
  return Date.parse(`${date}T00:00:00Z`) / 60000 + minute;
}
export function localDateAndMinute(value: number): { date: string; minute: number } {
  const day = Math.floor(value / DAY_MINUTES);
  return { date: new Date(day * 86400000).toISOString().slice(0, 10), minute: value - day * DAY_MINUTES };
}
export function hasUtcOffsets(item: Pick<ItemInput, "departure_utc_offset_minutes" | "arrival_utc_offset_minutes">): boolean {
  return item.departure_utc_offset_minutes != null && item.arrival_utc_offset_minutes != null;
}
export function itemEndDate(days: ScheduleDay[], item: ScheduleItem): string | null {
  const start = days.find(day => day.id === item.day_id)?.date;
  if (!start) return null;
  if (item.end_day_id) return days.find(day => day.id === item.end_day_id)?.date ?? null;
  const departure = localClockMicroseconds(item.start_time), arrival = localClockMicroseconds(item.end_time);
  return !hasUtcOffsets(item) && departure !== null && arrival !== null && arrival < departure
    ? localDateAndMinute(absoluteLocalMinute(start, 0) + DAY_MINUTES).date : start;
}
export interface ItemSchedule {
  startDate: string; endDate: string; startMinute: number; endMinute: number;
  durationMinutes: number; hasOffsets: boolean; localReversed: boolean;
}
/** UTC is used only to validate duration; the calendar retains both local endpoints. */
export function resolveItemSchedule(days: ScheduleDay[], item: ScheduleItem): ItemSchedule | null {
  const startDate = days.find(day => day.id === item.day_id)?.date;
  const endDate = itemEndDate(days, item), startClock = localClockMicroseconds(item.start_time), endClock = localClockMicroseconds(item.end_time);
  if (!startDate || !endDate || startClock === null || endClock === null) return null;
  const startMinute = Math.floor(startClock / microsecondsPerMinute), endMinute = Math.floor(endClock / microsecondsPerMinute);
  const hasOffsets = hasUtcOffsets(item);
  const dateMinutes = absoluteLocalMinute(endDate, 0) - absoluteLocalMinute(startDate, 0);
  const localDuration = dateMinutes * microsecondsPerMinute + endClock - startClock;
  const offsetMinutes = hasOffsets ? item.departure_utc_offset_minutes! - item.arrival_utc_offset_minutes! : 0;
  const elapsed = localDuration + offsetMinutes * microsecondsPerMinute;
  if (elapsed <= 0) return null;
  return { startDate, endDate, startMinute, endMinute, durationMinutes: Math.floor(elapsed / microsecondsPerMinute), hasOffsets, localReversed: localDuration <= 0 };
}
export function offsetLabel(value: number): string {
  const magnitude = Math.abs(value);
  return `UTC${value < 0 ? "−" : "+"}${String(Math.floor(magnitude / 60)).padStart(2, "0")}:${String(magnitude % 60).padStart(2, "0")}`;
}
