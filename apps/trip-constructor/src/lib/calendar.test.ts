import { expect, test } from "vitest";
import type { DayInput, ItemInput } from "./contracts";
import { buildCalendarEntries } from "./calendar";

const dates = ["2026-10-01", "2026-10-02", "2026-10-03"];
const days = dates.map((date, index) => ({ id: `day-${index}`, date })) as DayInput[];
const item = (patch: Partial<ItemInput>): ItemInput => ({
  id: "flight-1", day_id: days[0].id, end_day_id: days[1].id,
  type: "flight", title: "Ночной рейс", start_time: "22:30", end_time: "01:15",
  ...patch,
} as ItemInput);

test("overnight flight covers local clock hours on both calendar dates", () => {
  const result = buildCalendarEntries(days, [item({})], dates);
  expect(result.events.map(({ date, startMinute, endMinute }) => ({ date, startMinute, endMinute }))).toEqual([
    { date: dates[0], startMinute: 1350, endMinute: 1440 },
    { date: dates[1], startMinute: 0, endMinute: 75 },
  ]);
});

test("westbound flight shows separate local endpoints and arrival airport block on the same date", () => {
  const flight = item({ end_day_id: null, start_time: "12:00", end_time: "10:00",
    departure_utc_offset_minutes: 180, arrival_utc_offset_minutes: -240 });
  const result = buildCalendarEntries(days, [flight], dates);
  expect(result.events.map(event => [event.date, event.startMinute, event.endMinute])).toEqual([
    [dates[0], 600, 615], [dates[0], 720, 735],
  ]);
  expect(result.airportBlocks.find(block => block.airportKind === "after")).toMatchObject({ date: dates[0], startMinute: 600, endMinute: 660 });
  expect(result.events.some(event => event.date === dates[1])).toBe(false);
});

test("legacy overnight interval and a clipped visible slice retain the arrival segment", () => {
  const legacy = item({ end_day_id: null });
  const result = buildCalendarEntries(days, [legacy], [dates[1]]);
  expect(result.events.map(({ date, startMinute, endMinute, continuesBefore }) => ({ date, startMinute, endMinute, continuesBefore }))).toEqual([
    { date: dates[1], startMinute: 0, endMinute: 75, continuesBefore: true },
  ]);
});

test("hotel spans visible nights while exact check-in and check-out times become separate markers", () => {
  const hotel = item({ id: "hotel-1", type: "hotel", title: "Отель", check_in: dates[0], check_out: dates[2], check_in_time: "15:00", check_out_time: "11:30" });
  const result = buildCalendarEntries(days, [hotel], dates);
  expect(result.hotelBars).toMatchObject([{ itemId: "hotel-1", startIndex: 0, endIndex: 2, clippedStart: false, clippedEnd: false }]);
  expect(result.markers.map(({ kind, date, minute }) => ({ kind, date, minute }))).toEqual([
    { kind: "check-in", date: dates[0], minute: 900 },
    { kind: "check-out", date: dates[2], minute: 690 },
  ]);
  expect(result.events).toEqual([]);
  expect(buildCalendarEntries(days, [{ ...hotel, check_in_time: null, check_out_time: null }], dates).markers).toEqual([]);
  expect(buildCalendarEntries(days, [hotel], [dates[1]]).hotelBars).toMatchObject([{ startIndex: 0, endIndex: 1, clippedStart: true, clippedEnd: true }]);
});

test("overlapping intervals use separate lanes and incomplete time stays out of the hourly grid", () => {
  const first = item({ id: "a", type: "activity", end_day_id: null, start_time: "10:00", end_time: "12:00" });
  const second = item({ id: "b", type: "activity", end_day_id: null, start_time: "11:00", end_time: "13:00" });
  const incomplete = item({ id: "c", type: "activity", end_day_id: null, start_time: "14:00", end_time: null });
  const result = buildCalendarEntries(days, [first, second, incomplete], [dates[0]]);
  expect(result.events.map(({ itemId, lane, laneCount }) => ({ itemId, lane, laneCount }))).toEqual([
    { itemId: "a", lane: 0, laneCount: 2 },
    { itemId: "b", lane: 1, laneCount: 2 },
  ]);
});

test("flight airport intervals follow both boundaries across midnight and clip to visible trip days", () => {
  const flight = item({ airport_before_minutes: 180, airport_after_minutes: 60 });
  const result = buildCalendarEntries(days, [flight], dates);
  expect(result.airportBlocks.map(({ airportKind, date, startMinute, endMinute }) => ({ airportKind, date, startMinute, endMinute }))).toEqual([
    { airportKind: "before", date: dates[0], startMinute: 1170, endMinute: 1350 },
    { airportKind: "after", date: dates[1], startMinute: 75, endMinute: 135 },
  ]);
  expect(buildCalendarEntries(days, [flight], [dates[1]]).airportBlocks.map(block => block.airportKind)).toEqual(["after"]);
  expect(buildCalendarEntries(days, [{ ...flight, airport_before_minutes: 0, airport_after_minutes: 0 }], dates).airportBlocks).toEqual([]);
});
