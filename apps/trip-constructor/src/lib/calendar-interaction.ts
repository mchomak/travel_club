import type { DayInput, ItemInput } from "./contracts";
import { resolveItemSchedule } from "./transport-schedule";

const DAY = 24 * 60;
const QUARTER = 15;

function dateNumber(date: string): number { return Date.parse(`${date}T00:00:00Z`) / 86400000; }
function dateFromNumber(day: number): string { return new Date(day * 86400000).toISOString().slice(0, 10); }
export function minuteOfTime(time: string | null): number | null {
  if (!time) return null;
  const match = /^(\d{2}):(\d{2})(?::[0-5]\d)?$/.exec(time);
  if (!match) return null;
  const hour = Number(match[1]), minute = Number(match[2]);
  return hour < 24 && minute < 60 ? hour * 60 + minute : null;
}
export function timeOfMinute(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}
export function snapMinute(minute: number): number { return Math.max(0, Math.min(DAY - QUARTER, Math.floor(minute / QUARTER) * QUARTER)); }

/** A stationary pointer selects an hour; a drag selects the covered quarter-hour cells. */
export function selectionRange(anchor: number, current: number, dragged: boolean): { start: string; end: string } {
  const first = snapMinute(anchor);
  const lastEnd = DAY - QUARTER;
  if (!dragged) {
    const start = Math.min(first, lastEnd - 60);
    return { start: timeOfMinute(start), end: timeOfMinute(start + 60) };
  }
  const second = snapMinute(current);
  const start = Math.min(first, second);
  // The API stores a local time, so 24:00 is unavailable; use the last valid minute.
  const end = Math.min(DAY - 1, Math.max(first, second) + QUARTER);
  return { start: timeOfMinute(start), end: timeOfMinute(end) };
}

export function moveEvent(item: Pick<ItemInput, "day_id" | "end_day_id" | "start_time" | "end_time" | "departure_utc_offset_minutes" | "arrival_utc_offset_minutes">, days: Pick<DayInput, "id" | "date">[], targetDayId: string, targetMinute: number): { dayId: string; endDayId: string | null; start: string; end: string } | null {
  if (!Number.isFinite(targetMinute) || targetMinute < 0 || targetMinute >= DAY) return null;
  const byId = new Map(days.map(day => [day.id, day]));
  const source = item.day_id ? byId.get(item.day_id) : undefined;
  const target = byId.get(targetDayId);
  const startMinute = minuteOfTime(item.start_time), endMinute = minuteOfTime(item.end_time);
  if (!source || !target || startMinute === null || endMinute === null) return null;
  const schedule = resolveItemSchedule(days, item);
  if (!schedule) return null;
  const begin = snapMinute(targetMinute), absoluteEnd = begin + schedule.durationMinutes
    + (schedule.hasOffsets ? item.arrival_utc_offset_minutes! - item.departure_utc_offset_minutes! : 0);
  const endDate = dateFromNumber(dateNumber(target.date) + Math.floor(absoluteEnd / DAY));
  const finalDay = days.find(day => day.date === endDate);
  if (!finalDay) return null;
  return { dayId: targetDayId, endDayId: finalDay.id === targetDayId ? null : finalDay.id, start: timeOfMinute(begin), end: timeOfMinute(((absoluteEnd % DAY) + DAY) % DAY) };
}

export function moveHotel(item: Pick<ItemInput, "check_in" | "check_out">, days: Pick<DayInput, "id" | "date">[], targetDayId: string): { dayId: string; checkIn: string; checkOut: string } | null {
  const target = days.find(day => day.id === targetDayId);
  if (!target || !item.check_in || !item.check_out) return null;
  const nights = dateNumber(item.check_out) - dateNumber(item.check_in);
  if (nights <= 0) return null;
  const checkout = dateNumber(target.date) + nights;
  const last = Math.max(...days.map(day => dateNumber(day.date)));
  if (checkout > last + 1) return null;
  return { dayId: targetDayId, checkIn: target.date, checkOut: dateFromNumber(checkout) };
}
