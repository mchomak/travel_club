import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DayInput, ItemInput } from "@/lib/contracts";
import { AirportBlockForm } from "./airport-block-form";

afterEach(cleanup);

const days = ["2026-10-01", "2026-10-02", "2026-10-03"].map((date, index) => ({ id: `day-${index}`, date })) as DayInput[];
const flight = { id: "flight", type: "flight", title: "Ночной рейс", day_id: days[1].id, end_day_id: days[2].id, start_time: "01:00", end_time: "03:00" } as ItemInput;

test("airport arrival boundary crosses midnight, validates range, and allows zero to hide the block", async () => {
  const save = vi.fn();
  render(<AirportBlockForm flight={flight} days={days} kind="before" onSave={save} onCancel={vi.fn()} />);
  const date = screen.getByLabelText("Дата приезда");
  const time = screen.getByLabelText("Время приезда");
  expect(date).toHaveValue("2026-10-01");
  expect(time).toHaveValue("22:00");

  fireEvent.change(date, { target: { value: "2026-10-01" } });
  fireEvent.change(time, { target: { value: "23:30" } });
  await userEvent.setup().click(screen.getByRole("button", { name: "Сохранить время" }));
  expect(save).toHaveBeenCalledWith(90);

  save.mockClear();
  fireEvent.change(date, { target: { value: "2026-09-29" } });
  await userEvent.setup().click(screen.getByRole("button", { name: "Сохранить время" }));
  expect(save).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent("Интервал должен быть от 0 до 24 часов");

  fireEvent.change(date, { target: { value: "2026-10-02" } });
  fireEvent.change(time, { target: { value: "01:00" } });
  await userEvent.setup().click(screen.getByRole("button", { name: "Сохранить время" }));
  expect(save).toHaveBeenCalledWith(0);
});

test("airport exit end can cross midnight and rejects a boundary before arrival", async () => {
  const save = vi.fn();
  const lateFlight = { ...flight, start_time: "20:00", end_time: "23:30", day_id: days[0].id, end_day_id: days[1].id };
  render(<AirportBlockForm flight={lateFlight} days={days} kind="after" onSave={save} onCancel={vi.fn()} />);
  expect(screen.getByLabelText("Дата окончания выхода")).toHaveValue("2026-10-03");
  expect(screen.getByLabelText("Время окончания выхода")).toHaveValue("00:30");
  fireEvent.change(screen.getByLabelText("Дата окончания выхода"), { target: { value: "2026-10-03" } });
  fireEvent.change(screen.getByLabelText("Время окончания выхода"), { target: { value: "00:15" } });
  await userEvent.setup().click(screen.getByRole("button", { name: "Сохранить время" }));
  expect(save).toHaveBeenCalledWith(45);
  save.mockClear();
  fireEvent.change(screen.getByLabelText("Дата окончания выхода"), { target: { value: "2026-10-02" } });
  await userEvent.setup().click(screen.getByRole("button", { name: "Сохранить время" }));
  expect(save).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent("Интервал должен быть от 0 до 24 часов");
});
