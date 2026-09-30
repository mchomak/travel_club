import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DayInput, ItemInput } from "@/lib/contracts";
import { TripCalendar } from "./trip-calendar";

afterEach(cleanup);

function positionDays() {
  document.querySelectorAll<HTMLElement>(".trip-calendar-day").forEach((day, index) => {
    vi.spyOn(day, "getBoundingClientRect").mockReturnValue({ left: 48 + index * 200, right: 248 + index * 200, top: 100, bottom: 1444, width: 200, height: 1344 } as DOMRect);
  });
}

test("mouse drag selects a quarter-hour range and a touch tap creates an hour", () => {
  const day = { id: "day-0", date: "2026-10-01" } as DayInput;
  const create = vi.fn();
  render(<TripCalendar days={[day]} items={[]} onOpenItem={vi.fn()} onCreateRange={create} />);
  positionDays();
  const cell = document.querySelector<HTMLElement>(".trip-calendar-day")!;
  fireEvent.pointerDown(cell, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 100, clientY: 100 + 9 * 56 + 8 });
  fireEvent.pointerMove(cell, { pointerId: 1, pointerType: "mouse", clientX: 100, clientY: 100 + 10 * 56 + 8 });
  expect(screen.getByRole("status", { name: /Выбран интервал/ })).toBeVisible();
  fireEvent.pointerUp(cell, { pointerId: 1, pointerType: "mouse", clientX: 100, clientY: 100 + 10 * 56 + 8 });
  expect(create).toHaveBeenCalledWith("day-0", "09:00", "10:15");
  fireEvent.pointerDown(cell, { pointerId: 2, pointerType: "touch", button: 0, clientX: 100, clientY: 100 + 12 * 56 });
  fireEvent.pointerUp(cell, { pointerId: 2, pointerType: "touch", clientX: 100, clientY: 100 + 12 * 56 });
  expect(create).toHaveBeenLastCalledWith("day-0", "12:00", "13:00");
});

test("touch drag selects time only in the explicit selection mode", () => {
  const day = { id: "day-0", date: "2026-10-01" } as DayInput;
  const create = vi.fn();
  render(<TripCalendar days={[day]} items={[]} onOpenItem={vi.fn()} onCreateRange={create} />);
  positionDays();
  const cell = document.querySelector<HTMLElement>(".trip-calendar-day")!;
  fireEvent.pointerDown(cell, { pointerId: 5, pointerType: "touch", button: 0, clientX: 100, clientY: 100 + 9 * 56 });
  fireEvent.pointerMove(cell, { pointerId: 5, pointerType: "touch", clientX: 100, clientY: 100 + 10 * 56 });
  fireEvent.pointerUp(cell, { pointerId: 5, pointerType: "touch", clientX: 100, clientY: 100 + 10 * 56 });
  expect(create).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Выбирать и переносить касанием" }));
  fireEvent.pointerDown(cell, { pointerId: 6, pointerType: "touch", button: 0, clientX: 100, clientY: 100 + 9 * 56 });
  fireEvent.pointerMove(cell, { pointerId: 6, pointerType: "touch", clientX: 100, clientY: 100 + 10 * 56 });
  fireEvent.pointerUp(cell, { pointerId: 6, pointerType: "touch", clientX: 100, clientY: 100 + 10 * 56 });
  expect(create).toHaveBeenCalledWith("day-0", "09:00", "10:15");
});

test("dragging a timed event moves it across days, while click still opens it", () => {
  const days = ["2026-10-01", "2026-10-02"].map((date, index) => ({ id: `day-${index}`, date })) as DayInput[];
  const item = { id: "event", day_id: "day-0", end_day_id: null, type: "activity", title: "Прогулка", start_time: "09:00", end_time: "10:00" } as ItemInput;
  const open = vi.fn(), move = vi.fn();
  render(<TripCalendar days={days} items={[item]} onOpenItem={open} onMoveItem={move} />);
  positionDays();
  const button = screen.getByRole("button", { name: /Открыть занятие Прогулка/ });
  fireEvent.click(button);
  expect(open).toHaveBeenCalledWith("event");
  fireEvent.pointerDown(button, { pointerId: 3, pointerType: "mouse", button: 0, clientX: 100, clientY: 100 + 9 * 56 + 8 });
  fireEvent.pointerMove(button, { pointerId: 3, pointerType: "mouse", clientX: 350, clientY: 100 + 11 * 56 + 8 });
  expect(screen.getByRole("status", { name: /Новое положение/ })).toBeVisible();
  fireEvent.pointerUp(button, { pointerId: 3, pointerType: "mouse", clientX: 350, clientY: 100 + 11 * 56 + 8 });
  fireEvent.click(button);
  expect(move).toHaveBeenCalledWith("event", "day-1", "11:00", "12:00", null);
  expect(open).toHaveBeenCalledTimes(1);
});

test("ordinary touch on an event keeps scrolling available and drag requires selection mode", () => {
  const day = { id: "day-0", date: "2026-10-01" } as DayInput;
  const item = { id: "event", day_id: "day-0", end_day_id: null, type: "activity", title: "Прогулка", start_time: "09:00", end_time: "10:00" } as ItemInput;
  const move = vi.fn(), open = vi.fn();
  render(<TripCalendar days={[day]} items={[item]} onOpenItem={open} onMoveItem={move} />);
  positionDays();
  const button = screen.getByRole("button", { name: /Открыть занятие Прогулка/ });
  expect(button.style.touchAction).toBe("auto");
  fireEvent.pointerDown(button, { pointerId: 10, pointerType: "touch", button: 0, clientX: 100, clientY: 100 + 9 * 56 });
  fireEvent.pointerMove(button, { pointerId: 10, pointerType: "touch", clientX: 100, clientY: 100 + 10 * 56 });
  fireEvent.pointerUp(button, { pointerId: 10, pointerType: "touch", clientX: 100, clientY: 100 + 10 * 56 });
  expect(move).not.toHaveBeenCalled();
  fireEvent.click(button);
  expect(open).toHaveBeenCalledWith("event");
  fireEvent.click(screen.getByRole("button", { name: "Выбирать и переносить касанием" }));
  expect(button.style.touchAction).toBe("none");
  fireEvent.pointerDown(button, { pointerId: 11, pointerType: "touch", button: 0, clientX: 100, clientY: 100 + 9 * 56 });
  fireEvent.pointerMove(button, { pointerId: 11, pointerType: "touch", clientX: 100, clientY: 100 + 10 * 56 });
  fireEvent.pointerUp(button, { pointerId: 11, pointerType: "touch", clientX: 100, clientY: 100 + 10 * 56 });
  expect(move).toHaveBeenCalledWith("event", "day-0", "10:00", "11:00", null);
});

test("dragging the continuation of an overnight event can move its start past midnight", () => {
  const days = ["2026-10-01", "2026-10-02", "2026-10-03"].map((date, index) => ({ id: `day-${index}`, date })) as DayInput[];
  const flight = { id: "flight", day_id: "day-0", end_day_id: "day-1", type: "flight", title: "Ночной рейс", start_time: "22:00", end_time: "01:00" } as ItemInput;
  const move = vi.fn();
  render(<TripCalendar days={days} items={[flight]} onOpenItem={vi.fn()} onMoveItem={move} />);
  positionDays();
  const continuation = screen.getAllByRole("button", { name: /Открыть перелёт Ночной рейс/ })[1];
  fireEvent.pointerDown(continuation, { pointerId: 7, pointerType: "mouse", button: 0, clientX: 350, clientY: 108 });
  fireEvent.pointerMove(continuation, { pointerId: 7, pointerType: "mouse", clientX: 550, clientY: 100 + 2 * 56 + 8 });
  fireEvent.pointerUp(continuation, { pointerId: 7, pointerType: "mouse", clientX: 550, clientY: 100 + 2 * 56 + 8 });
  expect(move).toHaveBeenCalledWith("flight", "day-2", "00:00", "03:00", null);
});

test("overnight move preview covers both occupied dates", () => {
  const days = ["2026-10-01", "2026-10-02"].map((date, index) => ({ id: `day-${index}`, date })) as DayInput[];
  const flight = { id: "flight", day_id: "day-0", end_day_id: "day-1", type: "flight", title: "Ночной рейс", start_time: "21:00", end_time: "01:00" } as ItemInput;
  render(<TripCalendar days={days} items={[flight]} onOpenItem={vi.fn()} onMoveItem={vi.fn()} />);
  positionDays();
  const first = screen.getAllByRole("button", { name: /Открыть перелёт Ночной рейс/ })[0];
  fireEvent.pointerDown(first, { pointerId: 8, pointerType: "mouse", button: 0, clientX: 100, clientY: 100 + 21 * 56 + 8 });
  fireEvent.pointerMove(first, { pointerId: 8, pointerType: "mouse", clientX: 100, clientY: 100 + 22 * 56 + 8 });
  expect(screen.getAllByRole("status", { name: /Новое положение/ })).toHaveLength(2);
});

test("touch drag moves a hotel band in selection mode, while ordinary touch scrolls", () => {
  const days = ["2026-10-01", "2026-10-02", "2026-10-03"].map((date, index) => ({ id: `day-${index}`, date })) as DayInput[];
  const hotel = { id: "hotel", day_id: "day-0", type: "hotel", title: "Отель", check_in: days[0].date, check_out: days[1].date } as ItemInput;
  const open = vi.fn(), move = vi.fn();
  render(<TripCalendar days={days} items={[hotel]} onOpenItem={open} onMoveHotel={move} />);
  positionDays();
  const button = screen.getByRole("button", { name: /Открыть отель Отель/ });
  fireEvent.click(button);
  fireEvent.pointerDown(button, { pointerId: 4, pointerType: "touch", button: 0, clientX: 100, clientY: 80 });
  fireEvent.pointerMove(button, { pointerId: 4, pointerType: "touch", clientX: 350, clientY: 80 });
  fireEvent.pointerUp(button, { pointerId: 4, pointerType: "touch", clientX: 350, clientY: 80 });
  expect(move).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Выбирать и переносить касанием" }));
  fireEvent.pointerDown(button, { pointerId: 9, pointerType: "touch", button: 0, clientX: 100, clientY: 80 });
  fireEvent.pointerMove(button, { pointerId: 9, pointerType: "touch", clientX: 350, clientY: 80 });
  expect(screen.getByLabelText(/Новое положение отеля/)).toBeVisible();
  fireEvent.pointerUp(button, { pointerId: 9, pointerType: "touch", clientX: 350, clientY: 80 });
  fireEvent.click(button);
  expect(move).toHaveBeenCalledWith("hotel", "2026-10-02", "2026-10-03", "day-1");
  expect(open).toHaveBeenCalledTimes(1);
});

test("day heading totals unique visible event prices, including excluded and overnight items", () => {
  const days = ["2026-10-01", "2026-10-02"].map((date, index) => ({ id: `day-${index}`, date })) as DayInput[];
  const flight = { id: "flight", day_id: "day-0", end_day_id: "day-1", type: "flight", title: "Рейс", start_time: "22:00", end_time: "01:00", included: false } as ItemInput;
  const hotel = { id: "hotel", type: "hotel", title: "Отель", check_in: days[0].date, check_out: "2026-10-03" } as ItemInput;
  const calculation = { items: [{ id: "flight", normalized_amount: "120.00" }, { id: "hotel", normalized_amount: "80.00" }] } as import("@/lib/contracts").Calculation;
  render(<TripCalendar days={days} items={[flight, hotel]} calculation={calculation} baseCurrency="RUB" onOpenItem={vi.fn()} />);
  expect(screen.getAllByText("2 события")).toHaveLength(2);
  expect(screen.getAllByText(/200,00/)).toHaveLength(2);
  expect(screen.getAllByText("Стоимость событий")).toHaveLength(2);
});

test("day heading does not present a false zero when an event price is unavailable", () => {
  const days = ["2026-10-01", "2026-10-02"].map((date, index) => ({ id: `day-${index}`, date })) as DayInput[];
  const event = { id: "event", day_id: days[0].id, type: "activity", title: "Прогулка", start_time: "09:00", end_time: "10:00" } as ItemInput;
  render(<TripCalendar days={days} items={[event]} calculation={null} baseCurrency="RUB" onOpenItem={vi.fn()} />);
  const headings = document.querySelectorAll(".trip-calendar-dates > div");
  expect(headings[0]).toHaveTextContent("1 событиеСтоимость событий—");
  expect(headings[1]).toHaveTextContent("0 событийСтоимость событий0,00 RUB");
});

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
