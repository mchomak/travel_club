import { expect, test } from "vitest";
import type { ItemInput, MapPlace, TripInput } from "./contracts";
import { emptyDay, newItem, newTrip } from "./trip-ui";
import { buildDayRoute, setMapLegMode, summarizeDayRoute, formatRouteDistance, formatRouteDuration } from "./day-route";
import { planAutoTransfer } from "./auto-transfers";

const days = ["2026-10-01", "2026-10-02", "2026-10-03"].map((date, i) => ({ ...emptyDay(date), id: `day-${i}` }));
const place = (name: string, latitude = 35): MapPlace => ({ name, address: name, latitude, longitude: 139, provider: "manual" });
const hotel = (id: string, checkIn: string, checkOut: string, mapPlace: MapPlace | null = place(id)): ItemInput => ({
  ...newItem("hotel", days[0], "RUB", days[0].date), id, title: id, check_in: checkIn, check_out: checkOut, map_place: mapPlace,
});
const event = (id: string, patch: Partial<ItemInput> = {}): ItemInput => ({
  ...newItem("activity", days[1], "RUB", days[0].date), id, title: id, map_place: place(id), ...patch,
});
const trip = (items: ItemInput[], patch: Partial<TripInput> = {}): TripInput => ({
  ...newTrip(), start_date: days[0].date, end_date: days[2].date, days, items, rates: [], ...patch,
});

test("intermediate transit days never return to hotels or invent a local road leg; manual boundaries win", () => {
  const bus = event("long-bus", { type: "train_bus", day_id: days[0].id, end_day_id: days[2].id, start_time: "20:00", end_time: "08:00", map_end_place: place("Destination") });
  const input = trip([bus, hotel("unused-stay", days[0].date, "2026-10-04")]);
  const middle = buildDayRoute(input, days[1].id);
  expect(middle.start.source).toBe("transit"); expect(middle.end.source).toBe("transit");
  expect(middle.start.place).toBeNull(); expect(middle.end.place).toBeNull();
  expect(middle.legs.map(leg => leg.kind)).toEqual(["scheduled"]);
  const manual = buildDayRoute({ ...input, days: input.days.map(day => day.id === days[1].id ? { ...day, map_start: place("Meeting") } : day) }, days[1].id);
  expect(manual.start).toMatchObject({ source: "manual", place: { name: "Meeting" } });
});

test("hotel night predicates select the previous and next stay without extra hotel visits", () => {
  const input = trip([hotel("old", "2026-09-30", days[1].date), hotel("new", days[1].date, "2026-10-04")]);
  const route = buildDayRoute(input, days[1].id);
  expect(route.start).toMatchObject({ source: "hotel", place: { name: "old" } });
  expect(route.end).toMatchObject({ source: "hotel", place: { name: "new" } });
  expect(route.nodes.map(n => n.key)).toEqual(["item:old:start", "item:new:start"]);
  expect(buildDayRoute(input, days[2].id).end.place?.name).toBe("new");
});

test("a date-line flight keeps its earlier local arrival day and later departure day in the route", () => {
  const flight=event('date-line',{type:'flight',day_id:days[1].id,end_day_id:days[0].id,start_time:'01:00',end_time:'23:00',departure_utc_offset_minutes:840,arrival_utc_offset_minutes:-600,map_place:place('Origin'),map_end_place:place('Destination')});
  const input=trip([flight]);
  expect(buildDayRoute(input,days[0].id).legs.filter(leg=>leg.kind==='scheduled')).toMatchObject([{departureDate:days[1].date,arrivalDate:days[0].date}]);
  expect(buildDayRoute(input,days[0].id).nodes.some(node=>node.itemId===flight.id&&node.place?.name==='Destination')).toBe(true);
  expect(buildDayRoute(input,days[1].id).nodes.some(node=>node.itemId===flight.id&&node.place?.name==='Origin')).toBe(true);
});

test("overlapping hotels stay ambiguous including unknown places; manual overrides resolve either boundary", () => {
  const input = trip([hotel("a", days[0].date, "2026-10-04", null), hotel("b", days[0].date, "2026-10-04")]);
  const route = buildDayRoute(input, days[1].id);
  expect(route.start.source).toBe("ambiguous");
  expect(route.end.source).toBe("ambiguous");
  expect(route.start.place).toBeNull();
  expect(route.start.candidates.map(n => [n.key, n.place?.name ?? null])).toEqual([["item:a:start", null], ["item:b:start", "b"]]);
  const manual = buildDayRoute({ ...input, days: input.days.map(d => d.id === days[1].id ? { ...d, map_start: place("chosen"), map_end: place("custom") } : d) }, days[1].id);
  expect(manual.start.source).toBe("manual");
  expect(manual.end.source).toBe("manual");
  expect(manual.nodes.map(n => n.key)).toEqual(["day:start", "day:end"]);
  expect(route.start.explanation).toMatch(/несколько/i);
});

test("events follow start times then stable persisted manual position; financial extras and hotel visits are excluded", () => {
  const route = buildDayRoute(trip([
    hotel("stay", days[0].date, "2026-10-04"), event("late", { start_time: "18:00" }),
    event("b", { position: 2 }), event("a", { position: 1 }), event("early", { start_time: "09:00" }),
    event("insurance", { type: "insurance" }), event("fee", { type: "other", subtype: "visa_fee", map_place: null }), event("general", { day_id: null }),
  ]), days[1].id);
  expect(route.nodes.map(n => n.key)).toEqual(["item:stay:start", "item:early:start", "item:late:start", "item:a:start", "item:b:start", "item:stay:start"]);
  expect(route.legs).toHaveLength(5);
  expect(route.legs.every(l => l.kind === "connection" && l.mode === "drive")).toBe(true);
});

test("overnight arrival and departure outrank hotels, preserve local dates, and never become airport road routes", () => {
  const input = trip([hotel("stay", days[0].date, "2026-10-04"), event("in", { type: "flight", day_id: days[0].id, end_day_id: days[1].id, start_time: "23:00", end_time: "02:00", map_place: place("origin"), map_end_place: place("arrive", 36) }),
    event("out", { type: "train_bus", end_day_id: days[2].id, start_time: "22:00", end_time: "06:00", map_place: place("station", 37), map_end_place: place("next city", 38) })]);
  const route = buildDayRoute(input, days[1].id);
  expect(route.start).toMatchObject({ source: "overnight", place: { name: "arrive" } });
  expect(route.end).toMatchObject({ source: "overnight", place: { name: "station" } });
  expect(route.nodes.map(n => n.key)).toEqual(["item:in:end", "item:out:start"]);
  expect(route.legs.map(l => l.kind)).toEqual(["connection", "scheduled", "scheduled"]);
  expect(route.legs.filter(l => l.kind === "connection").map(l => [l.from.place?.name, l.to.place?.name])).toEqual([["arrive", "station"]]);
  expect(route.legs.find(l => l.itemId === "out")).toMatchObject({ departureDate: days[1].date, arrivalDate: days[2].date, departureTime: "22:00", arrivalTime: "06:00" });
  expect(route.legs.find(l => l.itemId === "out")?.to).toMatchObject({ date: days[2].date, time: "06:00" });
  expect(route.start.explanation).toMatch(/ноч/i);
});

test("legacy, explicit midnight, untimed transport, and unknown arrivals preserve calendar semantics", () => {
  for (const type of ["flight", "train_bus", "transfer"] as const) {
    const transport = event(type, { type, day_id: days[0].id, start_time: "23:30", end_time: "00:00", map_end_place: place("destination", 36) });
    const input = trip([transport]);
    const departure = buildDayRoute(input, days[0].id), arrival = buildDayRoute(input, days[1].id);
    expect(departure.end.place?.name).toBe(type);
    expect(arrival.start.place?.name).toBe("destination");
    expect(arrival.nodes.filter(n => n.itemId === type)).toHaveLength(1);
    expect(departure.legs.filter(l => l.kind === "scheduled")).toHaveLength(1);
    expect(departure.legs.filter(l => l.kind === "connection").every(l => !l.to.key.endsWith(":end"))).toBe(true);
    expect(buildDayRoute(trip([{ ...transport, map_end_place: null }]), days[1].id).start.place).toBeNull();
  }
  const explicit = event("long", { type: "flight", day_id: days[0].id, end_day_id: days[2].id, start_time: "20:00", end_time: "21:00", map_end_place: place("far") });
  expect(buildDayRoute(trip([explicit]), days[2].id).start.source).toBe("overnight");
  const middle = buildDayRoute(trip([explicit]), days[1].id);
  expect(middle.start.source).toBe("transit");
  expect(middle.nodes.filter(n => n.itemId === "long")).toHaveLength(1);
  expect(middle.legs.filter(l => l.kind === "scheduled")).toHaveLength(1);
  const untimed = buildDayRoute(trip([event("bus", { type: "transfer", map_end_place: place("station") })]), days[1].id);
  expect(untimed.legs.filter(l => l.kind === "scheduled")).toMatchObject([{ departureTime: null, arrivalTime: null }]);
  const unknown = buildDayRoute(trip([event("missing", { type: "flight", day_id: days[0].id, start_time: "22:00", end_time: "02:00", map_end_place: null })]), days[1].id);
  expect(unknown.start).toMatchObject({ source: "overnight", place: null, candidates: [{ place: null }] });
});

test("unknown stops break connectivity and connection-only totals remain explicitly incomplete", () => {
  const input = trip([event("a", { position: 1 }), event("unknown", { position: 2, map_place: null }), event("c", { position: 3, map_place: place("c", 36) }), event("d", { position: 4, map_place: place("d", 37) })],
    { days: days.map(d => d.id === days[1].id ? { ...d, map_start: place("start", 34), map_end: place("end", 38) } : d) });
  const route = buildDayRoute(input, days[1].id);
  expect(route.legs.map(l => [l.from.key, l.to.key])).toEqual([["day:start", "item:a:start"], ["item:a:start", "item:unknown:start"], ["item:unknown:start", "item:c:start"], ["item:c:start", "item:d:start"], ["item:d:start", "day:end"]]);
  const measurement = { status: "ok" as const, distance_m: 1500, duration_s: 180 };
  expect(summarizeDayRoute(route, {})).toEqual({ distance_m: null, duration_s: null, complete: false, resolved_legs: 0, total_legs: 5 });
  expect(summarizeDayRoute(route, { [route.legs[3].key]: measurement })).toEqual({ distance_m: 1500, duration_s: 180, complete: false, resolved_legs: 1, total_legs: 5 });
  const scheduled = buildDayRoute(trip([event("bus", { type: "transfer", start_time: "10:00", end_time: "11:00", map_place: place("same"), map_end_place: place("arrive", 36) })],
    { days: days.map(d => d.id === days[1].id ? { ...d, map_start: place("same"), map_end: place("arrive", 36) } : d) }), days[1].id);
  expect(summarizeDayRoute(scheduled, Object.fromEntries(scheduled.legs.map(l => [l.key, measurement])))).toEqual({ distance_m: 0, duration_s: 0, complete: true, resolved_legs: 2, total_legs: 2 });
  expect(summarizeDayRoute(buildDayRoute(trip([]), days[1].id), {})).toMatchObject({ distance_m: null, complete: false });
});

test("saved pair modes survive reordering and immutable updates; distance and time labels distinguish missing and zero", () => {
  const preferences = [{ from_key: "item:a:start", to_key: "item:b:start", mode: "walk" as const }, { from_key: "item:stale:start", to_key: "day:end", mode: "transit" as const }];
  const updated = setMapLegMode(preferences, "item:a:start", "item:b:start", "transit");
  expect(updated).toEqual([{ ...preferences[0], mode: "transit" }, preferences[1]]);
  expect(preferences[0].mode).toBe("walk");
  const appended = setMapLegMode(updated, "day:start", "item:a:start", "walk");
  expect(appended).toHaveLength(3);
  const input = trip([event("b", { position: 3 }), event("a", { position: 1 })], { days: days.map(d => d.id === days[1].id ? { ...d, map_leg_modes: updated } : d) });
  const first = buildDayRoute(input, days[1].id);
  const reordered = buildDayRoute({ ...input, items: [...input.items].reverse() }, days[1].id);
  expect(reordered).toEqual(first);
  expect(first.legs.find(l => l.from.key === "item:a:start" && l.to.key === "item:b:start")?.mode).toBe("drive");
  expect([null, 0, 850, 1500].map(formatRouteDistance)).toEqual(["Нет данных", "На месте", "850 м", "1,5 км"]);
  expect([null, 0, 1, 60, 3660].map(formatRouteDuration)).toEqual(["Нет данных", "На месте", "1 мин", "1 мин", "1 ч 1 мин"]);
  expect(formatRouteDistance(Number.NaN)).toBe("Нет данных");
  expect(formatRouteDuration(-1)).toBe("Нет данных");
});

test("events starting during a scheduled journey produce an explicit chronology conflict", () => {
  const bus = event("bus", { type: "train_bus", start_time: "10:00", end_time: "12:00", map_end_place: place("station", 36) });
  const during = event("museum", { start_time: "11:00", end_time: "11:30" });
  const after = event("lunch", { start_time: "12:00" });
  const route = buildDayRoute(trip([bus, during, after]), days[1].id);
  expect(route.warnings).toEqual([expect.stringMatching(/пересечение расписания.*museum.*bus.*не является последовательным/i)]);
  expect(buildDayRoute(trip([bus, after]), days[1].id).warnings).toEqual([]);
  expect(route.legs.filter(leg => leg.kind === "scheduled")).toHaveLength(1);
  expect(route.legs.some(leg => leg.kind === "connection" && leg.from.key === "item:bus:start" && leg.to.key === "item:bus:end")).toBe(false);
});

test("untimed custom items with saved places are manual stops while costs without places are excluded", () => {
  const route = buildDayRoute(trip([
    event("last", { type: "other", position: 3 }),
    event("fee", { type: "other", subtype: "service_fee", position: 2, map_place: null }),
    event("first", { type: "other", position: 1 }),
  ]), days[1].id);
  expect(route.nodes.map(node => node.key)).toEqual(["day:start", "item:first:start", "item:last:start", "day:end"]);
  expect(route.legs.map(leg => [leg.from.key, leg.to.key])).toContainEqual(["item:first:start", "item:last:start"]);
});

test("explicit overnight end days infer untimed arrival and departure boundaries ahead of hotels", () => {
  for (const type of ["flight", "activity", "other"] as const) {
    const overnight = event("night", { type, day_id: days[0].id, end_day_id: days[1].id, start_time: null, end_time: null, map_place: place("departure"), map_end_place: place("arrival", 36) });
    const input = trip([hotel("stay", "2026-09-30", "2026-10-04"), overnight]);
    const departure = buildDayRoute(input, days[0].id), arrival = buildDayRoute(input, days[1].id);
    expect(departure.end).toMatchObject({ source: "overnight", place: { name: "departure" } });
    expect(arrival.start).toMatchObject({ source: "overnight", place: { name: "arrival" } });
    expect(departure.nodes.filter(node => node.itemId === "night")).toHaveLength(1);
    expect(arrival.nodes.filter(node => node.itemId === "night")).toHaveLength(1);
    expect(arrival.nodes[0]).toMatchObject({ key: "item:night:end", date: days[1].date, time: null });
  }
});

test("generated local transfers retain one routed leg and cannot double a direct edge or daily totals", () => {
  const input = trip([
    event("origin", { start_time: "10:00", end_time: "11:00", map_place: place("museum", 35) }),
    event("target", { start_time: "15:00", end_time: "16:00", map_place: place("park", 36) }),
  ], { days: days.map(day => day.id === days[1].id ? { ...day, map_start: place("museum", 35), map_end: place("park", 36) } : day) });
  const original = buildDayRoute(input, days[1].id).legs.find(leg => leg.from.itemId === "origin" && leg.to.itemId === "target")!;
  const planned = planAutoTransfer(input, original, { status: "ok", distance_m: 900, duration_s: 540 });
  expect(planned.ok).toBe(true); if (!planned.ok) return;
  const saved = { ...input, items: [...input.items, planned.item] };
  const route = buildDayRoute(saved, days[1].id);
  const generated = route.legs.find(leg => leg.itemId === planned.item.id)!;
  expect(generated).toMatchObject({ kind: "connection", mode: "drive", sourceFromKey: original.from.key, sourceToKey: original.to.key });
  expect(route.legs.filter(leg => leg.kind === "scheduled")).toHaveLength(0);
  expect(route.legs.filter(leg => leg.from.key === original.from.key && leg.to.key === original.to.key)).toHaveLength(0);
  expect(route.legs.filter(leg => leg.from.place?.latitude !== leg.to.place?.latitude)).toEqual([generated]);
  expect(summarizeDayRoute(route, { [generated.key]: { status: "ok", distance_m: 900, duration_s: 540 } })).toMatchObject({ distance_m: 900, duration_s: 540, complete: true });
  const legacyTransit = { ...input, days: input.days.map(day => ({ ...day, map_leg_modes: [{ from_key: original.from.key, to_key: original.to.key, mode: "transit" as const }] })) };
  expect(buildDayRoute(legacyTransit, days[1].id).legs.find(leg => leg.key === original.key)?.mode).toBe("drive");
});
