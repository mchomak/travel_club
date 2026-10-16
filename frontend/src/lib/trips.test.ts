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

test("places and day route choices survive the editable draft roundtrip", () => {
  const input = newTrip();
  const place = { name: "Hotel", address: "Tokyo", latitude: 35.68, longitude: 139.76, provider: "manual" as const };
  const day = { ...emptyDay(input.start_date), map_start: place, map_end: place,
    map_leg_modes: [{ from_key: "day:start", to_key: "day:end", mode: "walk" as const }] };
  const item = { ...newItem("flight", day, "RUB", day.date), map_place: place,
    map_end_place: { ...place, name: "Airport" } };
  const saved = { ...input, days: [day], rates: [], items: [item] } as unknown as TripDocument;

  const draft = tripInput(saved);
  expect(draft.days[0]).toEqual(day);
  expect(draft.items[0]).toEqual(item);
  const repeated = { ...saved, ...draft,
    items: draft.items.map(item => ({ ...item, original_amount: "0", rate_used: "1", normalized_amount: "0" })) };
  expect(tripInput(repeated).items[0]).toEqual(item);
});
