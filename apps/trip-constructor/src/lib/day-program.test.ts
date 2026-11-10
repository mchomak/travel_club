import { expect, test } from "vitest";
import { emptyDay, newItem, newTrip } from "./trip-ui";
import type { ItemInput, TripInput } from "./contracts";
import { getDayProgram, reviewTrip } from "./day-program";

const days = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"].map(emptyDay);
const item = (type: ItemInput["type"], patch: Partial<ItemInput> = {}): ItemInput => ({ ...newItem(type, days[0], "RUB", days[0].date), ...patch });
const trip = (items: ItemInput[]): TripInput => ({ ...newTrip(), start_date: days[0].date, end_date: days[3].date, days, items, rates: [] });

test("day program derives stays including checkout, arrivals, untimed items and real timezone duration once per ID", () => {
  const old = item("hotel", { id: "old", check_in: days[0].date, check_out: days[1].date, check_out_time: "11:00" });
  const next = item("hotel", { id: "next", day_id: days[1].id, check_in: days[1].date, check_out: days[3].date, check_in_time: "15:00" });
  const night = item("flight", { id: "night", start_time: "22:00", end_time: "02:00", end_day_id: days[1].id, departure_utc_offset_minutes: 180, arrival_utc_offset_minutes: 240, map_end_place: { name: "Airport", address: "Arrival address", latitude: 1, longitude: 2, provider: "manual" } });
  const walk = item("activity", { id: "walk", day_id: days[1].id, start_time: null, end_time: null, location: "Old town" });
  const input = trip([old, next, night, walk]);
  const program = getDayProgram(input, days[1].id);
  expect(program.entries.map(entry => entry.item.id)).toEqual(["night", "old", "next", "walk"]);
  expect(program.entries[0]).toMatchObject({ durationMinutes: 180, address: "Arrival address", arrival: true, overnight: true, startDate: days[0].date, endDate: days[1].date });
  expect(program.entries.find(entry => entry.item.id === "walk")).toMatchObject({ startTime: null, address: "Old town" });
  expect(program.route.start.source).toBe("overnight"); expect(program.route.end.source).toBe("hotel");
  expect(getDayProgram({ ...input, items: input.items.filter(value => value.id !== "night") }, days[1].id).entries.map(entry => entry.item.id)).not.toContain("night");
  expect(getDayProgram(input, "missing").entries).toEqual([]);
});

test("review reports actionable nonblocking issues and excludes transit and the last day from missing nights", () => {
  const bus = item("train_bus", { id: "bus", end_day_id: days[2].id, start_time: "20:00", end_time: "08:00" });
  const one = item("activity", { id: "one", day_id: days[2].id, start_time: "10:00", end_time: "12:00", price_pending: true, currency: "EUR" });
  const two = item("meal", { id: "two", day_id: days[2].id, start_time: "11:00", end_time: "13:00" });
  const input = trip([bus, one, two]); const original = JSON.stringify(input);
  const warnings = reviewTrip(input);
  expect(warnings).toEqual(expect.arrayContaining([
    expect.objectContaining({ code: "time_conflict", dayId: days[2].id, itemIds: ["one", "two"] }),
    expect.objectContaining({ code: "missing_price", itemIds: ["one"] }),
    expect.objectContaining({ code: "missing_fx", itemIds: ["one"] }),
    expect.objectContaining({ code: "missing_place", itemIds: ["bus"] }),
    expect.objectContaining({ code: "missing_night", dayId: days[2].id }),
    expect.objectContaining({ code: "blank_day", dayId: days[3].id }),
  ]));
  expect(warnings.filter(warning => warning.code === "missing_night").map(warning => warning.dayId)).toEqual([days[2].id]);
  expect(warnings.some(warning => warning.code === "blank_day" && warning.dayId === days[1].id)).toBe(false);
  expect(JSON.stringify(input)).toBe(original);
});

test("midnight arrivals, untimed multi-day transit and date-line durations remain in day projections", () => {
  const midnight = item("transfer", { id: "midnight", start_time: "23:00", end_time: "00:00", end_day_id: null });
  expect(getDayProgram(trip([midnight]), days[1].id).entries.map(entry => entry.item.id)).toEqual(["midnight"]);
  const bus = item("train_bus", { id: "bus", start_time: null, end_time: null, end_day_id: days[2].id });
  expect(getDayProgram(trip([bus]), days[1].id).entries.map(entry => entry.item.id)).toEqual(["bus"]);
  const flight = item("flight", { id: "west", start_time: "12:00", end_time: "10:00", departure_utc_offset_minutes: 180, arrival_utc_offset_minutes: -240 });
  const west = getDayProgram(trip([flight]), days[0].id).entries;
  expect(west).toHaveLength(1); expect(west[0].durationMinutes).toBe(300);
  expect(west[0].segments).toHaveLength(2);
});

test("checkout keeps the hotel address and midnight arrivals precede morning events; ambiguity clears with a manual place", () => {
  const place = { name: "Hotel", address: "Hotel street", latitude: 1, longitude: 2, provider: "manual" as const };
  const old = item("hotel", { id: "old", check_in: days[0].date, check_out: days[1].date, check_out_time: "11:00", map_place: place });
  const midnight = item("transfer", { id: "midnight", start_time: "23:00", end_time: "00:00" });
  const visit = item("activity", { id: "visit", day_id: days[1].id, start_time: "09:00", end_time: "10:00" });
  const program = getDayProgram(trip([old, midnight, visit]), days[1].id);
  expect(program.entries.map(entry => entry.item.id)).toEqual(["midnight", "visit", "old"]);
  expect(program.entries[2].address).toBe("Hotel street");
  const overlapping = trip([old, { ...old, id: "other" }]);
  expect(reviewTrip(overlapping)).toEqual(expect.arrayContaining([expect.objectContaining({ code: "ambiguous_boundary", dayId: days[1].id })]));
  const manual = { ...overlapping, days: overlapping.days.map(day => ({ ...day, map_start: place, map_end: place })) };
  expect(reviewTrip(manual).some(warning => warning.code === "ambiguous_boundary" || warning.code === "missing_night")).toBe(false);
});
