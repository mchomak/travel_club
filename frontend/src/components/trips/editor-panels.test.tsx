import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DayForm } from "./editor-panels";
import { emptyDay } from "@/lib/trip-ui";

afterEach(cleanup);

test("day saves an empty status", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(<DayForm day={emptyDay("2026-10-01")} onSave={onSave} onCancel={() => {}} />);
  await user.click(screen.getByRole("button", { name: "Сохранить день" }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ status: "" }));
});

test("day saves a suggested status", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(<DayForm day={emptyDay("2026-10-01")} onSave={onSave} onCancel={() => {}} />);
  const status = screen.getByLabelText("Статус дня");
  expect(document.querySelector('datalist#day-statuses option[value="День вылета"]')).toBeInTheDocument();
  await user.type(status, "День вылета");
  await user.click(screen.getByRole("button", { name: "Сохранить день" }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ status: "День вылета" }));
});

test("day accepts a custom status and trims it on save", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(<DayForm day={emptyDay("2026-10-01")} onSave={onSave} onCancel={() => {}} />);
  await user.type(screen.getByLabelText("Статус дня"), "  День на море  ");
  await user.click(screen.getByRole("button", { name: "Сохранить день" }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ status: "День на море" }));
});

test("day rejects a status over 200 characters before onSave", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(<DayForm day={emptyDay("2026-10-01")} onSave={onSave} onCancel={() => {}} />);
  fireEvent.change(screen.getByLabelText("Статус дня"), { target: { value: "x".repeat(201) } });
  await user.click(screen.getByRole("button", { name: "Сохранить день" }));
  expect(onSave).not.toHaveBeenCalled();
  expect(screen.getByText("Не больше 200 символов")).toBeInTheDocument();
});
