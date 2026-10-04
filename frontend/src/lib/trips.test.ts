import { expect, test } from "vitest";
import type { TripDocument } from "./contracts";
import { emptyDay, newItem, newTrip } from "./trip-ui";
import { tripInput } from "./trips";

test("a saved flight and subtype survive reopening as an editable trip", () => {
  const input = newTrip();
  const day = emptyDay(input.start_date);
  const flight = { ...newItem("flight", day, input.base_currency, input.start_date), airport_before_minutes: 90, airport_after_minutes: 0 };
  const transport = { ...newItem("transfer", day, input.base_currency, input.start_date), subtype: "train" as const };
  const saved = { ...input, days: [day], rates: [], items: [flight, transport] } as unknown as TripDocument;

  expect(tripInput(saved).items).toEqual([
    expect.objectContaining({ airport_before_minutes: 90, airport_after_minutes: 0 }),
    expect.objectContaining({ subtype: "train" }),
  ]);
});
