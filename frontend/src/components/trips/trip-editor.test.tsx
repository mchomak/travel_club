import { expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TripEditor } from "./trip-editor";
import { TripProvider } from "./ui";
import { tripApi } from "@/lib/trips";
import { calculateTrip } from "@/lib/pricing";
import type { TripDocument, TripInput } from "@/lib/contracts";
import { vectors } from "../../test-fixtures";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

test("changing base currency clears previous FX and asks for rates in the new base", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  input.rates = [{ currency: "USD", rate: "90" }];
  const calculation = calculateTrip(input);
  const document = { ...input, id: "test-trip", version: 1, created_at: "", updated_at: "", created_by: "user", calculation, items: input.items.map(i => ({ ...i, ...calculation.items.find(c => c.id === i.id)! })) } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const save = vi.spyOn(tripApi, "save").mockRejectedValue(new Error("Курс отсутствует"));
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id="test-trip" /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Параметры" }));
  const dialog = screen.getByRole("dialog");
  const currency = within(dialog).getByLabelText("Базовая валюта", { exact: false });
  await user.clear(currency); await user.type(currency, "USD");
  expect(within(dialog).getByText(/Курсы нужно ввести заново/)).toBeVisible();
  await user.click(within(dialog).getByRole("button", { name: "Применить изменения" }));
  expect(await screen.findByText(/Укажите курс RUB/)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Валюты и курсы" }));
  expect(screen.getByLabelText("1 RUB в USD")).toHaveValue("");
  expect(save).not.toHaveBeenCalled();
});
