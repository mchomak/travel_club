import type { DayInput, ItemInput, TripInput } from "./contracts";
import { buildCalendarEntries, type CalendarEvent } from "./calendar";
import { buildDayRoute, type DayRoutePlan } from "./day-route";
import { itemEndDate, localMinute, resolveItemSchedule } from "./transport-schedule";

export interface DayProgramEntry {
  item: ItemInput;
  segments: CalendarEvent[];
  startDate: string | null; endDate: string | null;
  startTime: string | null; endTime: string | null;
  durationMinutes: number | null;
  address: string;
  arrival: boolean; overnight: boolean;
}
export interface DayProgram { day: DayInput | null; entries: DayProgramEntry[]; route: DayRoutePlan }
export interface TripReviewWarning {
  code: "blank_day" | "time_conflict" | "missing_night" | "missing_place" | "ambiguous_boundary" | "missing_price" | "missing_fx";
  dayId: string | null;
  itemIds: string[];
  message: string;
}

/** Advisory only: never changes the draft or blocks saving. */
export function reviewTrip(trip: TripInput): TripReviewWarning[] {
  const warnings: TripReviewWarning[] = [];
  const add = (code: TripReviewWarning["code"], dayId: string | null, itemIds: string[], message: string) => warnings.push({ code, dayId, itemIds, message });
  const days = [...trip.days].sort((a, b) => a.date.localeCompare(b.date));
  for (const day of days) {
    const program = getDayProgram(trip, day.id);
    if (!program.entries.length) add("blank_day", day.id, [], "Программа дня пока пуста — добавьте событие или заметку.");
    if (day.id !== days.at(-1)?.id && program.route.end.source === "none") add("missing_night", day.id, [], "Ночёвка не определена — добавьте проживание, ночной переезд или уточните конец дня.");
    for (const side of ["start", "end"] as const) {
      if (program.route[side].source === "ambiguous") add("ambiguous_boundary", day.id, [], `${side === "start" ? "Начало" : "Конец"} дня: подходят несколько мест — выберите вручную.`);
    }
    const intervals = program.entries.flatMap(entry => entry.segments.filter(segment => !segment.endpoint));
    const conflicts = new Set<string>();
    for (let index = 0; index < intervals.length; index++) for (const other of intervals.slice(index + 1)) {
      const event = intervals[index];
      if (event.itemId === other.itemId || event.startMinute >= other.endMinute || other.startMinute >= event.endMinute) continue;
      const ids = [event.itemId, other.itemId].sort(), key = ids.join(":");
      if (conflicts.has(key)) continue;
      conflicts.add(key);
      add("time_conflict", day.id, ids, `События «${event.title}» и «${other.title}» пересекаются по времени — проверьте расписание.`);
    }
  }
  for (const item of trip.items) {
    const routeItem = item.type !== "insurance" && (item.type !== "other" || !!item.map_place || !!item.map_end_place || !!item.start_time);
    const transport = item.type === "flight" || item.type === "train_bus" || item.type === "transfer";
    if (routeItem && (!item.map_place || (transport && !item.map_end_place))) add("missing_place", item.day_id, [item.id], `«${item.title}»: укажите ${transport ? "места отправления и прибытия" : "место"} для карты.`);
    if (item.price_pending || !item.unit_price?.trim()) add("missing_price", item.day_id, [item.id], `«${item.title}»: стоимость ещё не указана.`);
    if (item.included && item.currency !== trip.base_currency && !trip.rates.some(rate => rate.currency === item.currency && /^\d+(\.\d+)?$/.test(rate.rate) && /[1-9]/.test(rate.rate))) add("missing_fx", item.day_id, [item.id], `«${item.title}»: укажите ручной курс ${item.currency} к ${trip.base_currency}.`);
  }
  return warnings;
}

/** A projection of the aggregate; entries always refer to the original persisted items. */
export function getDayProgram(trip: TripInput, dayId: string): DayProgram {
  const day = trip.days.find(value => value.id === dayId) ?? null;
  const route = buildDayRoute(trip, dayId);
  if (!day) return { day, entries: [], route };
  const calendar = buildCalendarEntries(trip.days, trip.items, [day.date]);
  const visibleIds = new Set([...calendar.events, ...calendar.airportBlocks, ...calendar.markers, ...calendar.hotelBars].map(entry => entry.itemId));
  for (const leg of route.legs) if (leg.itemId) visibleIds.add(leg.itemId);
  const entries = [...new Map(trip.items.filter(item => item.type === "hotel"
    ? !!item.check_in && !!item.check_out && item.check_in < item.check_out && item.check_in <= day.date && day.date <= item.check_out
    : item.day_id === dayId || visibleIds.has(item.id) || itemEndDate(trip.days, item) === day.date).map(item => [item.id, item])).values()].map(item => {
    const schedule = resolveItemSchedule(trip.days, item);
    const startDate = item.type === "hotel" ? item.check_in : trip.days.find(value => value.id === item.day_id)?.date ?? null;
    const endDate = item.type === "hotel" ? item.check_out : itemEndDate(trip.days, item);
    const arrival = endDate === day.date && startDate !== day.date;
    return { item, segments: calendar.events.filter(event => event.itemId === item.id), startDate, endDate,
      startTime: item.type === "hotel" ? item.check_in_time : item.start_time,
      endTime: item.type === "hotel" ? item.check_out_time : item.end_time,
      durationMinutes: schedule?.durationMinutes ?? null,
      address: (arrival ? item.map_end_place?.address || (item.type !== "flight" && item.type !== "train_bus" && item.type !== "transfer" ? item.map_place?.address : "") : item.map_place?.address) || item.location || "",
      arrival, overnight: !!startDate && !!endDate && startDate !== endDate };
  });
  entries.sort((a, b) => {
    const time = (entry: DayProgramEntry) => entry.segments.length ? Math.min(...entry.segments.map(event => event.startMinute))
      : calendar.markers.find(marker => marker.itemId === entry.item.id)?.minute ?? localMinute(entry.arrival ? entry.endTime : entry.startTime) ?? 1440;
    return time(a) - time(b) || a.item.position - b.item.position || a.item.id.localeCompare(b.item.id);
  });
  return { day, entries, route };
}
