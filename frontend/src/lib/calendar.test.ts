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
  const first = item({ id: "a", end_day_id: null, start_time: "10:00", end_time: "12:00" });
  const second = item({ id: "b", end_day_id: null, start_time: "11:00", end_time: "13:00" });
  const incomplete = item({ id: "c", end_day_id: null, start_time: "14:00", end_time: null });
  const result = buildCalendarEntries(days, [first, second, incomplete], [dates[0]]);
  expect(result.events.map(({ itemId, lane, laneCount }) => ({ itemId, lane, laneCount }))).toEqual([
    { itemId: "a", lane: 0, laneCount: 2 },
    { itemId: "b", lane: 1, laneCount: 2 },
  ]);
});
