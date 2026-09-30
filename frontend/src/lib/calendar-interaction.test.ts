import { expect, test } from "vitest";
import { moveEvent, moveHotel, selectionRange } from "./calendar-interaction";

const days = ["2026-10-01", "2026-10-02", "2026-10-03"].map((date, index) => ({ id: `day-${index}`, date }));

test("selection snaps to quarter hours and a tap creates one hour", () => {
  expect(selectionRange(9 * 60 + 8, 10 * 60 + 2, true)).toEqual({ start: "09:00", end: "10:15" });
  expect(selectionRange(9 * 60 + 8, 9 * 60 + 8, false)).toEqual({ start: "09:00", end: "10:00" });
  expect(selectionRange(1438, 1438, false)).toEqual({ start: "22:45", end: "23:45" });
  expect(selectionRange(1438, 1438, true)).toEqual({ start: "23:30", end: "23:45" });
});

test("moving an overnight event preserves duration and rejects a trip overrun", () => {
  const item = { day_id: "day-0", end_day_id: "day-1", start_time: "22:00", end_time: "01:00" };
  expect(moveEvent(item, days, "day-1", 21 * 60)).toEqual({ dayId: "day-1", endDayId: "day-2", start: "21:00", end: "00:00" });
  expect(moveEvent(item, days, "day-2", 21 * 60)).toBeNull();
  expect(moveEvent(item, days, "day-0", -15)).toBeNull();
  expect(moveEvent(item, days, "day-0", 1440)).toBeNull();
});

test("hotel movement preserves nights and allows checkout after the last trip day", () => {
  expect(moveHotel({ check_in: "2026-10-01", check_out: "2026-10-03" }, days, "day-1")).toEqual({ dayId: "day-1", checkIn: "2026-10-02", checkOut: "2026-10-04" });
  expect(moveHotel({ check_in: "2026-10-01", check_out: "2026-10-03" }, days, "day-2")).toBeNull();
});
