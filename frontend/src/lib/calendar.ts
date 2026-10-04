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

export type AirportKind = "before" | "after";

export interface CalendarAirportBlock {
  kind: "airport";
  airportKind: AirportKind;
  itemId: string;
  title: string;
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
  airportBlocks: CalendarAirportBlock[];
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

function placeLanes(events: (CalendarEvent | CalendarAirportBlock)[]): void {
  const byDate = new Map<string, (CalendarEvent | CalendarAirportBlock)[]>();
  for (const event of events) byDate.set(event.date, [...(byDate.get(event.date) ?? []), event]);
  for (const dayEvents of byDate.values()) {
    dayEvents.sort((a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute || a.itemId.localeCompare(b.itemId));
    let group: (CalendarEvent | CalendarAirportBlock)[] = [], active: (CalendarEvent | CalendarAirportBlock)[] = [];
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

const DAY = 1440;
function absoluteMinute(date: string, minute: number): number { return Date.parse(`${date}T00:00:00Z`) / 60000 + minute; }
function dateAndMinute(value: number): { date: string; minute: number } {
  const day = Math.floor(value / DAY);
  return { date: new Date(day * 86400000).toISOString().slice(0, 10), minute: value - day * DAY };
}

/** Absolute local-clock endpoints of a derived airport interval, including dates outside the trip. */
export function airportBlockInterval(item: ItemInput, days: DayInput[], kind: AirportKind): { start: { date: string; minute: number }; end: { date: string; minute: number } } | null {
  if (item.type !== "flight") return null;
  const datesById = new Map(days.map(day => [day.id, day.date]));
  const startDate = item.day_id ? datesById.get(item.day_id) : undefined;
  if (!startDate) return null;
  const departure = minuteOf(item.start_time), arrival = minuteOf(item.end_time);
  const explicitEndDate = item.end_day_id ? datesById.get(item.end_day_id) : undefined;
  if (item.end_day_id && !explicitEndDate) return null;
  const arrivalDate = explicitEndDate ?? (departure !== null && arrival !== null && arrival < departure ? nextDate(startDate) : startDate);
  if (departure !== null && arrival !== null && absoluteMinute(arrivalDate, arrival) <= absoluteMinute(startDate, departure)) return null;
  const duration = kind === "before" ? item.airport_before_minutes ?? 180 : item.airport_after_minutes ?? 60;
  if (!Number.isInteger(duration) || duration <= 0 || duration > DAY) return null;
  if (kind === "before") {
    if (departure === null) return null;
    const end = absoluteMinute(startDate, departure);
    return { start: dateAndMinute(end - duration), end: dateAndMinute(end) };
  }
  if (arrival === null) return null;
  const start = absoluteMinute(arrivalDate, arrival);
  return { start: dateAndMinute(start), end: dateAndMinute(start + duration) };
}

/** Dates and times are local wall-clock values; no timezone conversion is performed. */
export function buildCalendarEntries(days: DayInput[], items: ItemInput[], visibleDates: string[]): CalendarEntries {
  const events: CalendarEvent[] = [], airportBlocks: CalendarAirportBlock[] = [], hotelBars: CalendarHotelBar[] = [], markers: CalendarHotelMarker[] = [];
  const datesById = new Map(days.map(day => [day.id, day.date]));
  const visible = [...new Set(visibleDates)].sort();
  const visibleSet = new Set(visible);

  for (const item of items) {
    if (item.type === "flight") for (const airportKind of ["before", "after"] as const) {
      const interval = airportBlockInterval(item, days, airportKind);
      if (!interval) continue;
      for (const date of visible) {
        const dayStart = absoluteMinute(date, 0);
        const startMinute = Math.max(0, absoluteMinute(interval.start.date, interval.start.minute) - dayStart);
        const endMinute = Math.min(DAY, absoluteMinute(interval.end.date, interval.end.minute) - dayStart);
        if (endMinute <= startMinute) continue;
        airportBlocks.push({ kind: "airport", airportKind, itemId: item.id, title: item.title, date, startMinute, endMinute, lane: 0, laneCount: 1,
          continuesBefore: date > interval.start.date, continuesAfter: date < interval.end.date });
      }
    }
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
  placeLanes([...events, ...airportBlocks]);
  events.sort((a, b) => a.date.localeCompare(b.date) || a.startMinute - b.startMinute || a.lane - b.lane);
  airportBlocks.sort((a, b) => a.date.localeCompare(b.date) || a.startMinute - b.startMinute || a.lane - b.lane);
  hotelBars.sort((a, b) => a.startIndex - b.startIndex || a.itemId.localeCompare(b.itemId));
  markers.sort((a, b) => a.date.localeCompare(b.date) || a.minute - b.minute);
  return { events, airportBlocks, hotelBars, markers };
}
