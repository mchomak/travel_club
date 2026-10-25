import { expect, test } from "vitest";
import type { ItemInput, MapPlace, TripInput } from "./contracts";
import type { RouteLeg } from "./day-route";
import { autoTransferStatus, planAutoTransfer, refreshAutoTransfer } from "./auto-transfers";
import { emptyDay, newItem, newTrip } from "./trip-ui";

const days = ["2026-10-01", "2026-10-02", "2026-10-03"].map((date, index) => ({ ...emptyDay(date), id: `d${index}` }));
const place = (name: string, latitude: number): MapPlace => ({ name, address: name, latitude, longitude: 139, provider: "manual" });
const origin: ItemInput = { ...newItem("activity", days[1], "RUB", days[0].date), id: "origin", start_time: "10:00", end_time: "11:00", map_place: place("Museum", 35) };
const target: ItemInput = { ...newItem("activity", days[1], "RUB", days[0].date), id: "target", start_time: "15:00", end_time: "16:00", map_place: place("Park", 36) };
const trip = (items = [origin, target]): TripInput => ({ ...newTrip(), start_date: days[0].date, end_date: days[2].date, days, rates: [], items });
function leg(input: TripInput, mode: "drive" | "walk" = "drive"): RouteLeg {
  const [from, to] = input.items;
  return { key: `item:${from.id}:start>item:${to.id}:start`, from: { key: `item:${from.id}:start`, kind: "event", itemId: from.id, label: from.title, place: from.map_place!, date: days[1].date, time: from.start_time },
    to: { key: `item:${to.id}:start`, kind: "event", itemId: to.id, label: to.title, place: to.map_place!, date: days[1].date, time: to.start_time }, mode, kind: "connection" };
}
const eta = { status: "ok" as const, duration_s: 540, distance_m: 900 };

test("provider ETA becomes a numbered calendar snapshot with explicit pending taxi price", () => {
  const input = trip();
  const planned = planAutoTransfer(input, leg(input), eta);
  expect(planned.ok).toBe(true);
  if (!planned.ok) return;
  expect(planned.item).toMatchObject({ type: "transfer", subtype: "taxi", title: "Такси 1", day_id: days[1].id, end_day_id: null, start_time: "14:51", end_time: "15:00", price_pending: true, included: false, unit_price: "0", auto_transfer: { duration_seconds: 540, from_key: "item:origin:start", to_key: "item:target:start", mode: "drive" } });
  expect(input.items).toEqual([origin, target]);
  const walking = planAutoTransfer(input, leg(input, "walk"), { ...eta, duration_s: 540.2 });
  expect(walking.ok && walking.item).toMatchObject({ title: "Пеший переход 1", start_time: "14:50", calculation_mode: "fixed", included: true, price_pending: false, auto_transfer: { duration_seconds: 541 } });
});

test("airport buffers, previous-event conflicts and midnight preserve local calendar bounds", () => {
  const flight = { ...target, type: "flight" as const, start_time: "15:00", end_time: "18:00", airport_before_minutes: 180 };
  const toFlight = trip([origin, flight]);
  expect(planAutoTransfer(toFlight, leg(toFlight), eta)).toMatchObject({ ok: true, item: { start_time: "11:51", end_time: "12:00" } });
  const arriving = { ...origin, type: "flight" as const, start_time: "10:00", end_time: "14:00", airport_after_minutes: 60 };
  const noGap = trip([arriving, target]);
  const conflict = planAutoTransfer(noGap, leg(noGap), eta);
  expect(conflict).toMatchObject({ ok: false, reason: "conflict", conflicts: [{ itemId: origin.id }] });
  expect(planAutoTransfer(noGap, leg(noGap), eta, { allowConflict: true })).toMatchObject({ ok: true, conflicts: [{ itemId: origin.id }], item: { start_time: "14:51" } });
  const overnight = trip([{ ...origin, day_id: days[0].id, start_time: "20:00", end_time: "21:00" }, { ...target, start_time: "00:05" }]);
  const overnightLeg = leg(overnight); overnightLeg.from.date = days[0].date;
  expect(planAutoTransfer(overnight, overnightLeg, eta)).toMatchObject({ ok: true, item: { day_id: days[0].id, end_day_id: days[1].id, start_time: "23:56", end_time: "00:05" } });
  const outside = { ...overnight, start_date: days[1].date };
  expect(planAutoTransfer(outside, overnightLeg, eta)).toMatchObject({ ok: false, reason: "outside_trip" });
  const overlap = { ...origin, id: "overlap", start_time: "14:50", end_time: "14:55" };
  const crowded = { ...trip(), items: [origin, target, overlap] };
  expect(planAutoTransfer(crowded, leg(crowded), eta)).toMatchObject({ ok: false, reason: "conflict", conflicts: [{ itemId: overlap.id }] });
});

test("missing time and stale or missing routing data cannot silently create events or duplicates", () => {
  const noTime = trip([origin, { ...target, start_time: null }]);
  expect(planAutoTransfer(noTime, leg(noTime), eta)).toMatchObject({ ok: false, reason: "arrival_required", requiresArrivalTime: true });
  expect(planAutoTransfer(noTime, leg(noTime), eta, { arrivalDate: days[1].date, arrivalTime: "17:00" })).toMatchObject({ ok: true, item: { start_time: "16:51", end_time: "17:00" } });
  expect(planAutoTransfer(trip(), leg(trip()), { status: "unavailable", duration_s: null, distance_m: null })).toMatchObject({ ok: false, reason: "route_unavailable" });
  expect(planAutoTransfer(trip(), leg(trip()), eta, { routeKey: "old-provider-response" })).toMatchObject({ ok: false, reason: "stale_route" });
  const moved = trip([origin, { ...target, map_place: place("new", 37) }]);
  expect(planAutoTransfer(moved, leg(trip()), eta)).toMatchObject({ ok: false, reason: "stale_route" });
  const created = planAutoTransfer(trip(), leg(trip()), eta);
  expect(created.ok).toBe(true); if (!created.ok) return;
  const saved = { ...trip(), items: [...trip().items, created.item] };
  expect(planAutoTransfer(saved, leg(trip()), eta)).toMatchObject({ ok: false, reason: "already_exists", existingItemId: created.item.id });
  expect(autoTransferStatus(saved, created.item)).toMatchObject({ stale: false, state: "current" });
  const changed = { ...saved, items: saved.items.map(item => item.id === target.id ? { ...item, start_time: "16:00" } : item) };
  expect(autoTransferStatus(changed, created.item)).toMatchObject({ stale: true, state: "changed" });
  expect(changed.items.find(item => item.id === created.item.id)?.start_time).toBe("14:51");
  const edited = { ...created.item, title: "Наш водитель", included: true, price_pending: false, unit_price: "1234" };
  const refreshed = refreshAutoTransfer(changed, edited, eta);
  expect(refreshed).toMatchObject({ ok: true, item: { id: created.item.id, title: "Наш водитель", start_time: "15:51", end_time: "16:00", included: true, price_pending: false, unit_price: "1234" } });
  if (refreshed.ok) expect(autoTransferStatus(changed, refreshed.item).stale).toBe(false);
  const deletedSource = { ...saved, items: saved.items.filter(item => item.id !== target.id) };
  expect(autoTransferStatus(deletedSource, created.item)).toMatchObject({ stale: true, state: "source_missing" });
  expect(refreshAutoTransfer(deletedSource, created.item, eta)).toMatchObject({ ok: false, reason: "source_missing" });
});

test("hotel checkout, undated destinations and UUID remapping retain safe editable source snapshots", () => {
  const hotel = { ...newItem("hotel", days[0], "RUB", days[0].date), id: "hotel", map_place: origin.map_place, check_in: days[0].date, check_out: days[1].date, check_out_time: "15:00" };
  const input = trip([hotel, target]);
  const hotelLeg = leg(input); hotelLeg.from.time = undefined;
  expect(planAutoTransfer(input, hotelLeg, eta)).toMatchObject({ ok: false, reason: "conflict", conflicts: [{ itemId: hotel.id }] });
  const noDate = trip([origin, { ...target, day_id: null, start_time: null, end_time: null }]);
  const noDateLeg = leg(noDate); noDateLeg.to.date = undefined;
  expect(planAutoTransfer(noDate, noDateLeg, eta)).toMatchObject({ ok: false, reason: "arrival_required", requiresArrivalTime: true });
  expect(planAutoTransfer(noDate, noDateLeg, eta, { arrivalDate: days[1].date, arrivalTime: "17:00" })).toMatchObject({ ok: true, item: { end_time: "17:00" } });
  const created = planAutoTransfer(trip(), leg(trip()), eta);
  expect(created.ok).toBe(true); if (!created.ok) return;
  const saved = { ...trip(), items: [origin, target, created.item] };
  const idMap = new Map(saved.items.map((item, index) => [item.id, `new-${index}`]));
  const remapped = { ...saved, items: saved.items.map(item => ({ ...item, id: idMap.get(item.id)!, auto_transfer: item.auto_transfer ? { ...item.auto_transfer, from_key: `item:${idMap.get(origin.id)}:start`, to_key: `item:${idMap.get(target.id)}:start` } : null })) };
  expect(autoTransferStatus(remapped, remapped.items[2])).toMatchObject({ stale: false, state: "current" });
  expect(created.item.auto_transfer?.source_signature).not.toMatch(/origin|target/);
  expect(planAutoTransfer(trip(), leg(trip()), { ...eta, duration_s: Number.MAX_VALUE })).toMatchObject({ ok: false, reason: "outside_trip" });
});

test("legacy invalidated signatures can explicitly refresh valid sources without creating another item", () => {
  const created = planAutoTransfer(trip(), leg(trip()), eta);
  expect(created.ok).toBe(true); if (!created.ok) return;
  for (const source_signature of ["", "legacy-opaque-signature"]) {
    const legacy = { ...created.item, auto_transfer: { ...created.item.auto_transfer!, source_signature } };
    const saved = { ...trip(), items: [origin, target, legacy] };
    const status = autoTransferStatus(saved, legacy);
    expect(status).toMatchObject({ stale: true, state: "changed", leg: { from: { key: "item:origin:start" }, to: { key: "item:target:start" } } });
    const refreshed = refreshAutoTransfer(saved, legacy, eta);
    expect(refreshed).toMatchObject({ ok: true, item: { id: legacy.id, start_time: "14:51", end_time: "15:00" } });
    if (refreshed.ok) expect(autoTransferStatus(saved, refreshed.item)).toMatchObject({ stale: false, state: "current" });
    expect(saved.items).toHaveLength(3);
  }
});

test("day-boundary duplicate identity includes the original day even when the snapshot crosses midnight", () => {
  const mappedDays = days.map(day => ({ ...day, map_start: place("Start", 35), map_end: place("End", 36) }));
  const input = { ...trip([]), days: mappedDays };
  const boundaryLeg = (date: string, mode: "drive" | "walk" = "drive"): RouteLeg => ({ key: "day:start>day:end", kind: "connection", mode,
    from: { key: "day:start", kind: "start", label: "Start", place: mappedDays[0].map_start, date },
    to: { key: "day:end", kind: "end", label: "End", place: mappedDays[0].map_end, date } });
  const created = planAutoTransfer(input, boundaryLeg(days[1].date), eta, { arrivalTime: "00:05" });
  expect(created.ok).toBe(true); if (!created.ok) return;
  expect(created.item).toMatchObject({ day_id: days[0].id, end_day_id: days[1].id });
  const saved = { ...input, items: [created.item] };
  expect(planAutoTransfer(saved, boundaryLeg(days[1].date), eta, { arrivalTime: "00:05" })).toMatchObject({ ok: false, reason: "already_exists", existingItemId: created.item.id });
  expect(planAutoTransfer(saved, boundaryLeg(days[2].date), eta, { arrivalTime: "00:05" })).toMatchObject({ ok: true, item: { day_id: days[1].id, end_day_id: days[2].id } });
  expect(planAutoTransfer(saved, boundaryLeg(days[1].date, "walk"), eta, { arrivalTime: "12:00" })).toMatchObject({ ok: true, item: { subtype: "walk" } });
  const refreshed = refreshAutoTransfer(saved, created.item, eta, { arrivalTime: "00:05" });
  expect(refreshed).toMatchObject({ ok: true, item: { id: created.item.id, day_id: days[0].id, end_day_id: days[1].id } });
  const legacy = { ...created.item, auto_transfer: { ...created.item.auto_transfer!, source_signature: "" } };
  const legacySaved = { ...saved, items: [legacy] };
  expect(planAutoTransfer(legacySaved, boundaryLeg(days[1].date), eta, { arrivalTime: "00:05" })).toMatchObject({ ok: false, reason: "already_exists" });
  expect(refreshAutoTransfer(legacySaved, legacy, eta, { arrivalTime: "00:05" })).toMatchObject({ ok: true, item: { id: legacy.id, day_id: days[0].id, end_day_id: days[1].id } });
});
