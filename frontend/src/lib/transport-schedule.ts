import type { DayInput, ItemInput } from "./contracts";

type ScheduleItem = Pick<ItemInput, "day_id" | "end_day_id" | "start_time" | "end_time" | "departure_utc_offset_minutes" | "arrival_utc_offset_minutes">;
type ScheduleDay = Pick<DayInput, "id" | "date">;
export const DAY_MINUTES = 1440;
export function localMinute(time: string | null | undefined): number | null {
  const match = /^(\d{2}):(\d{2})(?::[0-5]\d)?$/.exec(time ?? "");
  if (!match) return null;
  const hour = Number(match[1]), minute = Number(match[2]);
  return hour < 24 && minute < 60 ? hour * 60 + minute : null;
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
  const departure = localMinute(item.start_time), arrival = localMinute(item.end_time);
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
  const endDate = itemEndDate(days, item), startMinute = localMinute(item.start_time), endMinute = localMinute(item.end_time);
  if (!startDate || !endDate || startMinute === null || endMinute === null) return null;
  const hasOffsets = hasUtcOffsets(item);
  const localStart = absoluteLocalMinute(startDate, startMinute), localEnd = absoluteLocalMinute(endDate, endMinute);
  const durationMinutes = localEnd - localStart + (hasOffsets ? item.departure_utc_offset_minutes! - item.arrival_utc_offset_minutes! : 0);
  if (durationMinutes <= 0) return null;
  return { startDate, endDate, startMinute, endMinute, durationMinutes, hasOffsets, localReversed: localEnd <= localStart };
}
export function offsetLabel(value: number): string {
  const magnitude = Math.abs(value);
  return `UTC${value < 0 ? "−" : "+"}${String(Math.floor(magnitude / 60)).padStart(2, "0")}:${String(magnitude % 60).padStart(2, "0")}`;
}
