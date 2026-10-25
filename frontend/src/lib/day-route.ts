import type { TripInput, MapPlace, TravelMode, ItemInput, MapLegMode } from "./contracts";
import { buildCalendarEntries } from "./calendar";
import { nextDate } from "./pricing";

export interface RouteNode {
  key: string; label: string; place: MapPlace | null; itemId?: string;
  kind: "start" | "event" | "arrival" | "departure" | "end";
  date?: string; time?: string | null;
}
export interface RouteLeg {
  key: string; from: RouteNode; to: RouteNode; mode: TravelMode;
  kind: "connection" | "scheduled"; itemId?: string;
  departureDate?: string; arrivalDate?: string;
  departureTime?: string | null; arrivalTime?: string | null;
  /** Original sources for a saved local auto transfer; itemId identifies its calendar item. */
  sourceFromKey?: string; sourceToKey?: string;
}
export interface BoundaryResolution {
  source: "manual" | "hotel" | "overnight" | "ambiguous" | "none";
  explanation: string;
  candidates: { key: string; label: string; place: MapPlace | null }[];
  place: MapPlace | null;
}
export interface DayRoutePlan {
  nodes: RouteNode[]; legs: RouteLeg[];
  start: BoundaryResolution; end: BoundaryResolution; warnings: string[];
}
export interface RouteMeasurement { status: "ok" | "unavailable"; distance_m: number | null; duration_s: number | null }
export interface DayRouteSummary { distance_m: number | null; duration_s: number | null; complete: boolean; resolved_legs: number; total_legs: number }
export function summarizeDayRoute(plan: DayRoutePlan, results: Readonly<Record<string, RouteMeasurement | undefined>>): DayRouteSummary {
  const connections = plan.legs.filter(leg => leg.kind === "connection");
  let distance = 0, duration = 0, resolved = 0;
  for (const leg of connections) {
    if (!leg.from.place || !leg.to.place) continue;
    if (sameCoordinates(leg.from.place, leg.to.place)) { resolved++; continue; }
    const result = results[leg.key];
    if (result?.status !== "ok" || !validMeasurement(result.distance_m) || !validMeasurement(result.duration_s)) continue;
    distance += result.distance_m!; duration += result.duration_s!; resolved++;
  }
  const complete = resolved === connections.length && plan.nodes.every(node => node.place !== null);
  const known = resolved > 0 || complete;
  return { distance_m: known ? distance : null, duration_s: known ? duration : null, complete, resolved_legs: resolved, total_legs: connections.length };
}
export function setMapLegMode(preferences: readonly MapLegMode[], fromKey: string, toKey: string, mode: TravelMode): MapLegMode[] {
  const preference = { from_key: fromKey, to_key: toKey, mode };
  return preferences.some(p => p.from_key === fromKey && p.to_key === toKey)
    ? preferences.map(p => p.from_key === fromKey && p.to_key === toKey ? preference : p)
    : [...preferences, preference];
}
export function formatRouteDistance(meters: number | null): string {
  if (!validMeasurement(meters)) return "Нет данных";
  if (meters === 0) return "На месте";
  return meters! < 1000 ? `${Math.round(meters!)} м` : `${(meters! / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} км`;
}
export function formatRouteDuration(seconds: number | null): string {
  if (!validMeasurement(seconds)) return "Нет данных";
  if (seconds === 0) return "На месте";
  const minutes = Math.ceil(seconds! / 60), hours = Math.floor(minutes / 60);
  return hours ? `${hours} ч${minutes % 60 ? ` ${minutes % 60} мин` : ""}` : `${minutes} мин`;
}
export function buildDayRoute(trip: TripInput, dayId: string): DayRoutePlan {
  const day = trip.days.find(day => day.id === dayId);
  if (!day) return { nodes: [], legs: [], start: missingBoundary(), end: missingBoundary(), warnings: ["День не найден"] };
  const hotels = trip.items.filter(item => item.type === "hotel" && item.check_in && item.check_out && item.check_out > item.check_in);
  const scheduledItems = trip.items.filter(isRouteEvent).map(item => ({ item, schedule: scheduleOf(trip, item) }));
  const resolveBoundary = (side: "start" | "end"): BoundaryResolution => {
    const overnight = scheduledItems.filter(({ schedule }) => schedule?.overnight && (side === "start" ? schedule.endDate === day.date : schedule.startDate === day.date))
      .sort((a, b) => itemOrder(a.item, b.item)).map(({ item, schedule }) => ({ ...itemNode(item, side === "start" ? "end" : "start", side === "start" ? "arrival" : "departure"),
        date: day.date, time: side === "start" ? schedule!.endTime : schedule!.startTime }));
    const hotelCandidates = hotels.filter(item => side === "start"
      ? item.check_in! < day.date && day.date <= item.check_out!
      : item.check_in! <= day.date && day.date < item.check_out!)
      .sort(itemOrder).map(item => itemNode(item, "start", "event"));
    const candidates = overnight.length ? overnight : hotelCandidates;
    const manual = side === "start" ? day.map_start : day.map_end;
    if (manual) return { source: "manual", explanation: "Место выбрано вручную", candidates, place: manual };
    if (!candidates.length) return missingBoundary();
    if (candidates.length > 1) return { source: "ambiguous", explanation: "Подходят несколько мест — выберите место вручную", candidates, place: null };
    return { source: overnight.length ? "overnight" : "hotel", explanation: overnight.length
      ? side === "start" ? "Место прибытия после ночного события" : "Место отправления ночного события"
      : side === "start" ? "Отель предыдущей ночи" : "Отель следующей ночи", candidates, place: candidates[0].place };
  };
  const start = resolveBoundary("start"), end = resolveBoundary("end");
  const boundaryNode = (resolution: BoundaryResolution, side: "start" | "end"): RouteNode => ({
    ...((resolution.source === "hotel" || resolution.source === "overnight") ? resolution.candidates[0] : {}),
    key: resolution.source === "hotel" || resolution.source === "overnight" ? resolution.candidates[0].key : `day:${side}`,
    label: resolution.place?.name ?? (side === "start" ? "Начало дня" : "Конец дня"),
    place: resolution.place, kind: side, date: day.date,
  });
  const scheduledLegs: RouteLeg[] = [];
  const eventGroups: { item: ItemInput; time: string | null; nodes: RouteNode[] }[] = [];
  for (const { item, schedule } of scheduledItems) {
    if (!schedule) continue;
    const departure = { ...itemNode(item, "start", isTransport(item) ? "departure" : "event"), date: schedule.startDate, time: schedule.startTime };
    const arrival = { ...itemNode(item, "end", "arrival"), date: schedule.endDate, time: schedule.endTime };
    // Transport destinations are never replaced by the origin when their place is missing.
    if (isTransport(item)) arrival.place = item.map_end_place ?? null;
    const localNodes = [
      ...(schedule.startDate === day.date ? [departure] : []),
      ...(schedule.endDate === day.date && (isTransport(item) || schedule.overnight || item.map_end_place) ? [arrival] : []),
    ];
    if (localNodes.length) eventGroups.push({ item, time: localNodes[0].time, nodes: localNodes });
    if (isTransport(item) && schedule.startDate <= day.date && schedule.endDate >= day.date && (!item.auto_transfer || schedule.startDate === day.date)) scheduledLegs.push({
      key: `${departure.key}>${arrival.key}`, from: departure, to: arrival, mode: item.auto_transfer?.mode ?? "transit", kind: item.auto_transfer ? "connection" : "scheduled", itemId: item.id,
      ...(item.auto_transfer ? { sourceFromKey: item.auto_transfer.from_key, sourceToKey: item.auto_transfer.to_key } : {}),
      departureDate: schedule.startDate, arrivalDate: schedule.endDate, departureTime: schedule.startTime, arrivalTime: schedule.endTime,
    });
  }
  const first = boundaryNode(start, "start"), last = boundaryNode(end, "end");
  const events = eventGroups.sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99") || itemOrder(a.item, b.item)).flatMap(group => group.nodes)
    .filter(node => node.key !== first.key && node.key !== last.key);
  const nodes = [first, ...events, last].filter((node, i, list) => !i || node.key !== list[i - 1].key);
  const legs: RouteLeg[] = nodes.slice(1).flatMap((to, i) => {
    const from = nodes[i];
    if (scheduledLegs.some(leg => leg.from.key === from.key && leg.to.key === to.key)) return [];
    const preference = day.map_leg_modes?.find(pref => pref.from_key === from.key && pref.to_key === to.key)?.mode;
    return [{ key: `${from.key}>${to.key}`, from, to, mode: preference === "walk" ? "walk" : "drive", kind: "connection" as const }];
  });
  const warnings: string[] = [];
  for (const leg of scheduledLegs) {
    if (leg.kind !== "scheduled") continue;
    if (!leg.departureTime || !leg.arrivalTime) continue;
    const departure = `${leg.departureDate}T${leg.departureTime.slice(0, 5)}`;
    const arrival = `${leg.arrivalDate}T${leg.arrivalTime.slice(0, 5)}`;
    for (const group of eventGroups) {
      if (group.item.id === leg.itemId || !group.time) continue;
      const eventStart = `${day.date}T${group.time.slice(0, 5)}`;
      if (eventStart > departure && eventStart < arrival) warnings.push(
        `Пересечение расписания: «${group.item.title}» начинается во время «${leg.from.label}». Проверьте время событий: маршрут не является последовательным расписанием.`,
      );
    }
  }
  return { nodes, legs: [...legs, ...scheduledLegs], start, end, warnings };
}

function missingBoundary(): BoundaryResolution { return { source: "none", explanation: "Место не определено — укажите его вручную", candidates: [], place: null }; }
function itemOrder(a: ItemInput, b: ItemInput): number { return a.position - b.position || a.id.localeCompare(b.id); }
function itemNode(item: ItemInput, endpoint: "start" | "end", kind: RouteNode["kind"]): RouteNode {
  return { key: `item:${item.id}:${endpoint}`, itemId: item.id, label: item.title,
    place: endpoint === "start" ? item.map_place ?? null : item.map_end_place ?? (isTransport(item) ? null : item.map_place ?? null), kind };
}
function isRouteEvent(item: ItemInput): boolean {
  return item.type !== "hotel" && item.type !== "insurance"
    && (item.type !== "other" || !!item.start_time || !!item.map_place || !!item.map_end_place);
}
function isTransport(item: ItemInput): boolean { return item.type === "flight" || item.type === "train_bus" || item.type === "transfer"; }
function sameCoordinates(a: MapPlace, b: MapPlace): boolean { return a.latitude === b.latitude && a.longitude === b.longitude; }
function validMeasurement(value: number | null): boolean { return value !== null && Number.isFinite(value) && value >= 0; }
function scheduleOf(trip: TripInput, item: ItemInput): { startDate: string; endDate: string; startTime: string | null; endTime: string | null; overnight: boolean } | null {
  const startDate = trip.days.find(day => day.id === item.day_id)?.date;
  if (!startDate) return null;
  const explicitEnd = trip.days.find(day => day.id === item.end_day_id)?.date;
  if (item.end_day_id && !explicitEnd) return null;
  // Use the calendar's validation and legacy next-day rules for complete intervals.
  const calendar = buildCalendarEntries(trip.days, [item], [startDate]);
  const valid = calendar.events.length > 0;
  const endDate = explicitEnd ?? (valid && calendar.events[0].continuesAfter ? nextDate(startDate) : startDate);
  return { startDate, endDate, startTime: item.start_time, endTime: item.end_time,
    overnight: endDate > startDate && (valid || !!explicitEnd) };
}
