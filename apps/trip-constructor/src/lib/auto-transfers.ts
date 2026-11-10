import type { ItemInput, MapPlace, TripInput } from "./contracts";
import type { RouteLeg, RouteMeasurement, RouteNode } from "./day-route";
import { airportBlockInterval, buildCalendarEntries } from "./calendar";
import { newCategoryItem, nextItemTitle } from "./trip-ui";
import { hasUtcOffsets, itemEndDate } from "./transport-schedule";

export interface AutoTransferOptions {
  arrivalDate?: string; arrivalTime?: string; allowConflict?: boolean;
  /** Cache key of the response being used; rejects a response for a different point or mode. */
  routeKey?: string;
}
export interface AutoTransferConflict { itemId: string; title: string; message: string }
export type AutoTransferFailureReason = "unsupported_mode" | "missing_places" | "route_unavailable" | "stale_route" | "source_missing" | "arrival_required" | "outside_trip" | "conflict" | "already_exists";
export type AutoTransferPlan =
  | { ok: true; item: ItemInput; conflicts: AutoTransferConflict[] }
  | { ok: false; reason: AutoTransferFailureReason; message: string; requiresArrivalTime: boolean; conflicts: AutoTransferConflict[]; existingItemId?: string };
export interface AutoTransferStatus {
  stale: boolean; state: "not_auto" | "current" | "changed" | "source_missing";
  leg: RouteLeg | null;
}

interface Source {
  node: RouteNode; item?: ItemInput; date: string; time: string | null;
  available: number | null;
}
interface SourceSnapshot {
  date: string; time: string | null; available: number | null;
  point: [number, number] | null; schedule: unknown[];
}
interface Signature {
  v: 1; mode: "drive" | "walk"; bounds: [string, string];
  from: SourceSnapshot; to: SourceSnapshot;
}
const minute = (time: string | null | undefined): number | null => {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(time ?? "");
  return match && Number(match[1]) < 24 && Number(match[2]) < 60 ? Number(match[1]) * 60 + Number(match[2]) : null;
};
const absolute = (date: string, time: string | null | undefined): number | null => {
  const value = minute(time), parsed = Date.parse(`${date}T00:00:00Z`);
  return value === null || !Number.isFinite(parsed) ? null : parsed / 60000 + value;
};
function clock(value: number): { date: string; time: string } {
  const date = new Date(value * 60000).toISOString();
  return { date: date.slice(0, 10), time: date.slice(11, 16) };
}
function fail(reason: AutoTransferFailureReason, message: string, extra: Partial<Extract<AutoTransferPlan, { ok: false }>> = {}): AutoTransferPlan {
  return { ok: false, reason, message, requiresArrivalTime: reason === "arrival_required", conflicts: [], ...extra };
}
function endDate(trip: TripInput, item: ItemInput, date: string): string | null {
  return itemEndDate(trip.days, item) ?? (item.end_day_id ? null : date);
}
function resolveSource(trip: TripInput, node: RouteNode, side: "from" | "to"): Source | null {
  const match = /^item:(.+):(start|end)$/.exec(node.key);
  const item = match ? trip.items.find(item => item.id === match[1]) : undefined;
  if (match && !item) return null;
  if (!item) {
    const day = trip.days.find(day => day.date === node.date);
    if (!day || (node.key !== "day:start" && node.key !== "day:end")) return null;
    const place = node.key === "day:start" ? day.map_start : day.map_end;
    return { node: { ...node, place: place ?? null }, date: day.date, time: null, available: null };
  }
  const endpoint = match![2];
  const startDate = item.day_id ? trip.days.find(day => day.id === item.day_id)?.date : node.date;
  const place = endpoint === "start" ? item.map_place : item.map_end_place ?? (isTransport(item) ? null : item.map_place);
  if (item.type === "hotel") {
    const date = node.date ?? (side === "from" ? item.check_out : item.check_in);
    if (!date || !item.check_in || !item.check_out || date < item.check_in || date > item.check_out) return null;
    const time = side === "from" && date === item.check_out ? item.check_out_time : side === "to" && date === item.check_in ? item.check_in_time : null;
    return { node: { ...node, place: place ?? null, date, time }, item, date, time: time ?? null, available: absolute(date, time) };
  }
  if (!startDate) return null;
  const finishDate = endDate(trip, item, startDate);
  if (!finishDate) return null;
  const date = endpoint === "end" ? finishDate : startDate;
  const time = endpoint === "end" ? item.end_time : item.start_time;
  let available = side === "from" ? absolute(finishDate, item.end_time) ?? absolute(startDate, item.start_time) : absolute(date, time);
  if (item.type === "flight") {
    const buffer = airportBlockInterval(item, trip.days, side === "from" ? "after" : "before");
    if (buffer) {
      const boundary = side === "from" ? buffer.end : buffer.start;
      available = Date.parse(`${boundary.date}T00:00:00Z`) / 60000 + boundary.minute;
    }
  }
  return { node: { ...node, place: place ?? null, date, time }, item, date, time, available };
}
function isTransport(item: ItemInput): boolean { return item.type === "flight" || item.type === "train_bus" || item.type === "transfer"; }
function snapshot(source: Source): SourceSnapshot {
  const item = source.item;
  return { date: source.date, time: source.time, available: source.available,
    point: source.node.place ? [source.node.place.latitude, source.node.place.longitude] : null,
    schedule: item ? [item.type, item.start_time, item.end_time, item.check_in, item.check_out, item.check_in_time, item.check_out_time,
      item.airport_before_minutes ?? 180, item.airport_after_minutes ?? 60,
      ...(hasUtcOffsets(item) ? [item.departure_utc_offset_minutes, item.arrival_utc_offset_minutes] : [])] : [] };
}
function signature(trip: TripInput, mode: "drive" | "walk", from: Source, to: Source): string {
  return JSON.stringify({ v: 1, mode, bounds: [trip.start_date, trip.end_date], from: snapshot(from), to: snapshot(to) } satisfies Signature);
}
function readSignature(value: string): Signature | null {
  try {
    const parsed = JSON.parse(value) as Signature | null;
    if (parsed?.v === 1 && typeof parsed.from?.date === "string" && typeof parsed.to?.date === "string") return parsed;
  } catch { /* Duplicating legacy metadata may invalidate its opaque signature. */ }
  return null;
}
function isDayBoundary(key: string): boolean { return key === "day:start" || key === "day:end"; }
function sourceDates(trip: TripInput, item: ItemInput): { from: string | undefined; to: string | undefined } {
  const saved = item.auto_transfer ? readSignature(item.auto_transfer.source_signature) : null;
  const start = trip.days.find(day => day.id === item.day_id)?.date;
  const end = start ? endDate(trip, item, start) ?? start : undefined;
  // Boundaries belong to the selected route day, including a departure just before midnight.
  return { from: saved?.from.date ?? (isDayBoundary(item.auto_transfer?.from_key ?? "") ? end : start), to: saved?.to.date ?? end };
}
function sameTransferSource(trip: TripInput, item: ItemInput, leg: RouteLeg, options: AutoTransferOptions): boolean {
  const meta = item.auto_transfer;
  if (!meta) return false;
  if (item.id === leg.itemId) return true;
  if (meta.from_key !== leg.from.key || meta.to_key !== leg.to.key || meta.mode !== leg.mode) return false;
  const dates = sourceDates(trip, item);
  return (!isDayBoundary(meta.from_key) || dates.from === leg.from.date)
    && (!isDayBoundary(meta.to_key) || dates.to === (leg.to.date ?? options.arrivalDate));
}
/** Same key as the protected maps client's routing cache. */
export function autoTransferRouteKey(leg: RouteLeg): string | null {
  const from = leg.from.place, to = leg.to.place;
  return from && to ? `${from.latitude},${from.longitude}:${to.latitude},${to.longitude}:${leg.mode}` : null;
}
function samePoint(a: MapPlace | null | undefined, b: MapPlace | null | undefined): boolean {
  return !!a && !!b && a.latitude === b.latitude && a.longitude === b.longitude;
}
function sourceMoved(original: RouteNode, source: Source): boolean {
  return !samePoint(original.place, source.node.place) || source.item?.type !== "hotel" &&
    ((original.date !== undefined && original.date !== source.date) || (original.time !== undefined && (original.time?.slice(0, 5) ?? null) !== (source.time?.slice(0, 5) ?? null)));
}
function findConflicts(trip: TripInput, from: Source, departure: number, arrival: number): AutoTransferConflict[] {
  const found = new Map<string, AutoTransferConflict>();
  const add = (itemId: string, message: string) => {
    const item = trip.items.find(item => item.id === itemId);
    if (item) found.set(itemId, { itemId, title: item.title, message });
  };
  if (from.item && from.available !== null && departure < from.available) add(from.item.id, "Не хватает времени после предыдущего события, выезда из отеля или выхода из аэропорта.");
  const calendar = buildCalendarEntries(trip.days, trip.items, trip.days.map(day => day.date));
  for (const event of [...calendar.events, ...calendar.airportBlocks]) {
    if (event.kind === "event" && event.endpoint) continue;
    const dayStart = Date.parse(`${event.date}T00:00:00Z`) / 60000;
    if (dayStart + event.startMinute < arrival && dayStart + event.endMinute > departure) add(event.itemId, "Переезд пересекается с событием или временем в аэропорту.");
  }
  for (const marker of calendar.markers) {
    const at = Date.parse(`${marker.date}T00:00:00Z`) / 60000 + marker.minute;
    if (at > departure && at < arrival) add(marker.itemId, "Во время переезда назначен заезд или выезд из отеля.");
  }
  return [...found.values()];
}

/** Creates a proposed item only. The caller explicitly inserts it into the trip. */
export function planAutoTransfer(trip: TripInput, leg: RouteLeg, result: RouteMeasurement, options: AutoTransferOptions = {}): AutoTransferPlan {
  if (leg.mode !== "drive" && leg.mode !== "walk" || leg.kind !== "connection") return fail("unsupported_mode", "Выберите автомобиль или пеший переход.");
  const existing = trip.items.find(item => sameTransferSource(trip, item, leg, options));
  if (existing) return fail("already_exists", "Для этого участка уже добавлен переезд.", { existingItemId: existing.id });
  if (!leg.from.place || !leg.to.place) return fail("missing_places", "Укажите оба места на карте и повторите расчёт.");
  const targetId = /^item:(.+):(start|end)$/.exec(leg.to.key)?.[1];
  const target = trip.items.find(item => item.id === targetId);
  if (target && !target.day_id && target.type !== "hotel" && !leg.to.date && !options.arrivalDate) return fail("arrival_required", "Укажите местные дату и время «Прибыть к».");
  const from = resolveSource(trip, leg.from, "from"), to = resolveSource(trip, { ...leg.to, date: leg.to.date ?? options.arrivalDate }, "to");
  if (!from || !to) return fail("source_missing", "Исходное событие или день не найдено. Выберите участок заново.");
  if (!from.node.place || !to.node.place) return fail("missing_places", "Укажите оба места на карте и повторите расчёт.");
  if (sourceMoved(leg.from, from) || sourceMoved(leg.to, to) || options.routeKey !== undefined && options.routeKey !== autoTransferRouteKey(leg)) return fail("stale_route", "Исходные места или время изменились. Повторите расчёт участка.");
  if (result.status !== "ok" || result.duration_s === null || !Number.isFinite(result.duration_s) || result.duration_s < 0 || result.distance_m === null || !Number.isFinite(result.distance_m) || result.distance_m < 0) return fail("route_unavailable", "Маршрут недоступен. Повторите расчёт перед добавлением.");
  const arrival = options.arrivalTime ? absolute(options.arrivalDate ?? to.date, options.arrivalTime) : to.available;
  if (arrival === null) return fail("arrival_required", "Укажите местные дату и время «Прибыть к».");
  const durationSeconds = Math.ceil(result.duration_s), departure = arrival - Math.ceil(result.duration_s / 60);
  const firstMinute = absolute(trip.start_date, "00:00"), lastMinute = absolute(trip.end_date, "23:59");
  if (!Number.isSafeInteger(durationSeconds) || firstMinute === null || lastMinute === null || departure < firstMinute || arrival > lastMinute) return fail("outside_trip", "Переезд выходит за даты поездки. Измените диапазон поездки.");
  const start = clock(departure), end = clock(arrival);
  const startDay = trip.days.find(day => day.date === start.date), endDay = trip.days.find(day => day.date === end.date);
  if (!startDay || !endDay || start.date < trip.start_date || end.date > trip.end_date) return fail("outside_trip", "Переезд выходит за даты поездки. Измените диапазон поездки.");
  const conflicts = findConflicts(trip, from, departure, arrival);
  if (conflicts.length && !options.allowConflict) return fail("conflict", "Переезд пересекается с расписанием. Подтвердите добавление с конфликтом или измените время прибытия.", { conflicts });
  const item = newCategoryItem("transfer", leg.mode === "drive" ? "taxi" : "walk", startDay, trip.base_currency, trip.start_date);
  item.title = nextItemTitle(trip, item);
  return { ok: true, conflicts, item: { ...item, end_day_id: startDay.id === endDay.id ? null : endDay.id,
    start_time: start.time, end_time: end.time, map_place: from.node.place, map_end_place: to.node.place,
    departure_label: from.node.place.name, arrival_label: to.node.place.name,
    calculation_mode: "fixed", capacity: null, position: Math.max(-1, ...trip.items.map(item => item.position)) + 1,
    included: leg.mode === "walk", price_pending: leg.mode === "drive", auto_transfer: { from_key: leg.from.key, to_key: leg.to.key, mode: leg.mode,
      duration_seconds: durationSeconds, source_signature: signature(trip, leg.mode, from, to) } } };
}

/** Resolves original source references without changing the stored calendar snapshot. */
export function autoTransferStatus(trip: TripInput, item: ItemInput): AutoTransferStatus {
  const meta = item.auto_transfer;
  if (!meta) return { stale: false, state: "not_auto", leg: null };
  const dates = sourceDates(trip, item);
  const makeNode = (key: string, date: string | undefined): RouteNode => ({ key, label: "", kind: "event", place: null, date });
  const from = resolveSource(trip, makeNode(meta.from_key, dates.from), "from");
  const to = resolveSource(trip, makeNode(meta.to_key, dates.to), "to");
  if (!from || !to || !from.node.place || !to.node.place) return { stale: true, state: "source_missing", leg: null };
  const leg: RouteLeg = { key: `${meta.from_key}>${meta.to_key}`, from: { ...from.node, label: from.item?.title ?? from.node.place.name },
    to: { ...to.node, label: to.item?.title ?? to.node.place.name }, mode: meta.mode, kind: "connection" };
  const stale = signature(trip, meta.mode, from, to) !== meta.source_signature;
  return { stale, state: stale ? "changed" : "current", leg };
}

/** Explicit update: retains identity, title, notes, financial inputs and all other manual edits. */
export function refreshAutoTransfer(trip: TripInput, item: ItemInput, result: RouteMeasurement, options: AutoTransferOptions = {}): AutoTransferPlan {
  const status = autoTransferStatus(trip, item);
  if (!status.leg) return fail("source_missing", "Исходное место не найдено. Уточните его в событии или создайте новый участок.");
  const planned = planAutoTransfer({ ...trip, items: trip.items.filter(existing => existing.id !== item.id) }, status.leg, result, options);
  if (!planned.ok) return planned;
  const next = planned.item;
  return { ...planned, item: { ...item, day_id: next.day_id, end_day_id: next.end_day_id,
    start_time: next.start_time, end_time: next.end_time, map_place: next.map_place, map_end_place: next.map_end_place,
    departure_label: next.departure_label, arrival_label: next.arrival_label, auto_transfer: next.auto_transfer } };
}
