import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DayInput, ItemInput } from "@/lib/contracts";
import { TripCalendar } from "./trip-calendar";

test("calendar buttons open both overnight segments and navigate to later dates", async () => {
  const dates = Array.from({ length: 8 }, (_, index) => `2026-10-${String(index + 1).padStart(2, "0")}`);
  const days = dates.map((date, index) => ({ id: `day-${index}`, date })) as DayInput[];
  const flight = { id: "flight", day_id: days[0].id, end_day_id: days[1].id, type: "flight", title: "Ночной рейс", start_time: "22:00", end_time: "01:00" } as ItemInput;
  const open = vi.fn();
  const user = userEvent.setup();
  render(<TripCalendar days={days} items={[flight]} onOpenItem={open} />);
  const segments = screen.getAllByRole("button", { name: /Открыть перелёт Ночной рейс/ });
  expect(segments).toHaveLength(2);
  await user.click(segments[1]);
  expect(open).toHaveBeenCalledWith("flight");
  await user.click(screen.getByRole("button", { name: "Следующие дни" }));
  expect(screen.getByRole("button", { name: /8 окт/ })).toBeVisible();
  expect(screen.queryByRole("button", { name: /Открыть перелёт Ночной рейс/ })).toBeNull();
});
