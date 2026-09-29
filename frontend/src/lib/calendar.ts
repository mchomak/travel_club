import type { DayInput, ItemInput, ItemType } from "./contracts";

export interface CalendarEvent {
  kind: "event";
  itemId: string;
  title: string;
  itemType: ItemType;
  date: string;
  startMinute: number;
  endMinute: number;
  lane: number;
  laneCount: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

export interface CalendarHotelBar {
  kind: "hotel";
  itemId: string;
  title: string;
  startDate: string;
  endDate: string;
  startIndex: number;
  endIndex: number;
  clippedStart: boolean;
  clippedEnd: boolean;
}

export interface CalendarHotelMarker {
  kind: "check-in" | "check-out";
  itemId: string;
  title: string;
  date: string;
  minute: number;
}

export interface CalendarEntries {
  events: CalendarEvent[];
  hotelBars: CalendarHotelBar[];
  markers: CalendarHotelMarker[];
}

function minuteOf(value: string | null): number | null {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]), minute = Number(match[2]);
  return hour < 24 && minute < 60 ? hour * 60 + minute : null;
}

function nextDate(date: string): string {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

function placeLanes(events: CalendarEvent[]): void {
  const byDate = new Map<string, CalendarEvent[]>();
  for (const event of events) byDate.set(event.date, [...(byDate.get(event.date) ?? []), event]);
  for (const dayEvents of byDate.values()) {
    dayEvents.sort((a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute || a.itemId.localeCompare(b.itemId));
    let group: CalendarEvent[] = [], active: CalendarEvent[] = [];
    const finishGroup = () => {
      const count = Math.max(1, ...group.map(event => event.lane + 1));
      for (const event of group) event.laneCount = count;
      group = [];
    };
    for (const event of dayEvents) {
      active = active.filter(previous => previous.endMinute > event.startMinute);
      if (!active.length && group.length) finishGroup();
      const occupied = new Set(active.map(previous => previous.lane));
      let lane = 0;
      while (occupied.has(lane)) lane++;
      event.lane = lane;
      group.push(event);
      active.push(event);
    }
    if (group.length) finishGroup();
  }
}

/** Dates and times are local wall-clock values; no timezone conversion is performed. */
export function buildCalendarEntries(days: DayInput[], items: ItemInput[], visibleDates: string[]): CalendarEntries {
  const events: CalendarEvent[] = [], hotelBars: CalendarHotelBar[] = [], markers: CalendarHotelMarker[] = [];
  const datesById = new Map(days.map(day => [day.id, day.date]));
  const visible = [...new Set(visibleDates)].sort();
  const visibleSet = new Set(visible);

  for (const item of items) {
    if (item.type === "hotel") {
      const startDate = item.check_in, endDate = item.check_out;
      if (!startDate || !endDate || endDate <= startDate || !visible.length) continue;
      const indices = visible.flatMap((date, index) => date >= startDate && date < endDate ? [index] : []);
      if (indices.length) hotelBars.push({
        kind: "hotel", itemId: item.id, title: item.title, startDate, endDate,
        startIndex: indices[0], endIndex: indices[indices.length - 1] + 1,
        clippedStart: startDate < visible[0], clippedEnd: endDate > visible[visible.length - 1],
      });
      const checkInMinute = minuteOf(item.check_in_time);
      const checkOutMinute = minuteOf(item.check_out_time);
      if (checkInMinute !== null && visibleSet.has(startDate)) markers.push({ kind: "check-in", itemId: item.id, title: item.title, date: startDate, minute: checkInMinute });
      if (checkOutMinute !== null && visibleSet.has(endDate)) markers.push({ kind: "check-out", itemId: item.id, title: item.title, date: endDate, minute: checkOutMinute });
      continue;
    }

    const startDate = item.day_id ? datesById.get(item.day_id) : undefined;
    const startMinute = minuteOf(item.start_time), endMinute = minuteOf(item.end_time);
    if (!startDate || startMinute === null || endMinute === null) continue;
    const explicitEndDate = item.end_day_id ? datesById.get(item.end_day_id) : undefined;
    if (item.end_day_id && !explicitEndDate) continue;
    const endDate = explicitEndDate ?? (endMinute < startMinute ? nextDate(startDate) : startDate);
    if (endDate < startDate || (endDate === startDate && endMinute <= startMinute)) continue;
    for (const date of visible) {
      if (date < startDate || date > endDate) continue;
      const segmentStart = date === startDate ? startMinute : 0;
      const segmentEnd = date === endDate ? endMinute : 1440;
      if (segmentEnd <= segmentStart) continue;
      events.push({ kind: "event", itemId: item.id, title: item.title, itemType: item.type,
        date, startMinute: segmentStart, endMinute: segmentEnd, lane: 0, laneCount: 1,
        continuesBefore: date > startDate, continuesAfter: date < endDate });
    }
  }
  placeLanes(events);
  events.sort((a, b) => a.date.localeCompare(b.date) || a.startMinute - b.startMinute || a.lane - b.lane);
  hotelBars.sort((a, b) => a.startIndex - b.startIndex || a.itemId.localeCompare(b.itemId));
  markers.sort((a, b) => a.date.localeCompare(b.date) || a.minute - b.minute);
  return { events, hotelBars, markers };
}
