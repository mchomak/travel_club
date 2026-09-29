import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DayForm } from "./editor-panels";
import { emptyDay } from "@/lib/trip-ui";

test("day accepts a custom status and trims it on save", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(<DayForm day={emptyDay("2026-10-01")} onSave={onSave} onCancel={() => {}} />);
  await user.type(screen.getByLabelText("Статус дня"), "  День на море  ");
  await user.click(screen.getByRole("button", { name: "Сохранить день" }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ status: "День на море" }));
});
