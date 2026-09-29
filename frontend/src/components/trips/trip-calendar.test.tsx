import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DayInput, ItemInput } from "@/lib/contracts";
import { TripCalendar } from "./trip-calendar";

afterEach(cleanup);

test("day heading is only actionable when date selection is available", async () => {
  const day = { id: "day-1", date: "2026-10-01", status: "День вылета" } as DayInput;
  const { rerender } = render(<TripCalendar days={[day]} items={[]} onOpenItem={vi.fn()} />);
  expect(screen.queryByRole("button", { name: /1 окт/ })).toBeNull();
  const select = vi.fn();
  rerender(<TripCalendar days={[day]} items={[]} onOpenItem={vi.fn()} onSelectDate={select} />);
  const heading = screen.getByRole("button", { name: /1 окт/ });
  heading.focus();
  await userEvent.setup().keyboard("{Enter}");
  expect(select).toHaveBeenCalledWith("day-1");
  await userEvent.setup().click(heading);
  expect(select).toHaveBeenCalledTimes(2);
});

test("calendar buttons open both overnight segments and navigate to later dates", async () => {
  const dates = Array.from({ length: 8 }, (_, index) => `2026-10-${String(index + 1).padStart(2, "0")}`);
  const days = dates.map((date, index) => ({ id: `day-${index}`, date })) as DayInput[];
  const flight = { id: "flight", day_id: days[0].id, end_day_id: days[1].id, type: "flight", title: "Ночной рейс", start_time: "22:00", end_time: "01:00" } as ItemInput;
  const hotel = { id: "hotel", type: "hotel", title: "Отель у моря", check_in: dates[0], check_out: dates[2], check_in_time: "15:00", check_out_time: "11:00" } as ItemInput;
  const open = vi.fn();
  const user = userEvent.setup();
  render(<TripCalendar days={days} items={[flight, hotel]} onOpenItem={open} />);
  const segments = screen.getAllByRole("button", { name: /Открыть перелёт Ночной рейс/ });
  expect(segments).toHaveLength(2);
  await user.click(segments[0]);
  await user.click(segments[1]);
  expect(open.mock.calls).toEqual([["flight"], ["flight"]]);
  await user.click(screen.getByRole("button", { name: /Открыть отель Отель у моря, 2026-10-01/ }));
  await user.click(screen.getByRole("button", { name: /Открыть отель Отель у моря: заезд/ }));
  await user.click(screen.getByRole("button", { name: /Открыть отель Отель у моря: выезд/ }));
  expect(open.mock.calls).toEqual([["flight"], ["flight"], ["hotel"], ["hotel"], ["hotel"]]);
  await user.click(screen.getByRole("button", { name: "Следующие дни" }));
  expect(screen.getByText(/8 окт/, { selector: ".trip-calendar-day-heading strong" })).toBeVisible();
  expect(screen.queryByRole("button", { name: /Открыть перелёт Ночной рейс/ })).toBeNull();
});
