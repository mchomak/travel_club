import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { emptyDay, newItem, newTrip } from "@/lib/trip-ui";
import { ItemForm } from "./item-form";

afterEach(cleanup);

test("shows and preserves both exact times of a persisted flight", async () => {
  const day = emptyDay("2026-10-01");
  const item = {
    ...newItem("flight", day, "RUB", day.date),
    start_time: "10:30:15.000001",
    end_time: "10:30:15.000002",
    departure_utc_offset_minutes: 180,
    arrival_utc_offset_minutes: 180,
  };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);

  const departure = screen.getByLabelText("Вылет по местному времени");
  const arrival = screen.getByLabelText("Прилёт по местному времени");
  const save = screen.getByRole("button", { name: "Сохранить перелёт" });
  expect(departure).toHaveValue("10:30:15.000001");
  expect(arrival).toHaveValue("10:30:15.000002");

  await user.click(save);
  expect(onSubmit).toHaveBeenCalledExactlyOnceWith(item, undefined);

  fireEvent.change(arrival, { target: { value: "10:30:15.000003" } });
  await user.click(save);
  expect(onSubmit).toHaveBeenLastCalledWith({ ...item, end_time: "10:30:15.000003" }, undefined);
});

test("shows and preserves exact hotel times and rejects invalid edits", async () => {
  const day = emptyDay("2026-10-01");
  const item = {
    ...newItem("hotel", day, "RUB", day.date),
    check_in_time: "15:00:00.123456",
    check_out_time: "11:00:00.987654",
  };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);

  const checkIn = screen.getByLabelText("Время заселения");
  const save = screen.getByRole("button", { name: "Сохранить элемент" });
  expect(checkIn).toHaveValue("15:00:00.123456");
  expect(screen.getByLabelText("Время выселения")).toHaveValue("11:00:00.987654");

  await user.click(save);
  expect(onSubmit).toHaveBeenCalledExactlyOnceWith(item, undefined);

  fireEvent.change(checkIn, { target: { value: "25:00" } });
  await user.click(save);
  expect(checkIn).toHaveAttribute("aria-invalid", "true");
  expect(onSubmit).toHaveBeenCalledTimes(1);
});
