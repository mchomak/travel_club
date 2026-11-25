import { expect, test } from "vitest";
import type { TripDocument } from "./contracts";
import { calculateTrip } from "./pricing";
import { emptyDay, newItem, newTrip } from "./trip-ui";
import { tripInput, validationPrompt } from "./trips";

test("the editable draft retains the chosen cover and day photo", () => {
  const trip = newTrip();
  const day = { ...emptyDay(trip.start_date), photo_id: "thai-train" };
  const input = { ...trip, cover_photo_id: "tropical-coast", days: [day], items: [], rates: [] };
  const saved = { ...input, id: "trip", version: 2, created_at: "", updated_at: "",
    created_by: "user", calculation: calculateTrip(input) };
  expect(tripInput(saved)).toMatchObject({
    cover_photo_id: "tropical-coast", days: [{ photo_id: "thai-train" }],
  });
});

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

test("flight cities, transport labels and pending transfer snapshot survive edit-save", () => {
  const input = newTrip(), day = emptyDay(input.start_date);
  const item = { ...newItem("transfer", day, "RUB", day.date),
    departure_country_code: "RU", departure_city: "Москва", arrival_country_code: "CN", arrival_city: "Пекин",
    departure_label: "Терминал", arrival_label: "Отель", price_pending: true, included: false,
    auto_transfer: { from_key: "day:start", to_key: "day:end", mode: "drive" as const,
      duration_seconds: 540, source_signature: '[[1,2,"14:00"],[3,4,"15:00"]]' } };
  const doc = { ...input, days: [day], rates: [], items: [{ ...item,
    original_amount: "0", rate_used: "1", normalized_amount: "0" }] } as unknown as TripDocument;
  expect(tripInput(doc).items[0]).toMatchObject(item);
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
  expect(draft.items[0]).toMatchObject(item);
  const repeated = { ...saved, ...draft,
    items: draft.items.map(item => ({ ...item, original_amount: "0", rate_used: "1", normalized_amount: "0" })) };
  expect(tripInput(repeated).items[0]).toMatchObject(item);
});


test("editable draft preserves explicit link sharing and defaults legacy links to private", () => {
  const input = newTrip(), day = emptyDay(input.start_date);
  const item = { ...newItem("flight", day, "RUB", day.date), external_url: "https://example.com", publish_external_url: true };
  const saved = { ...input, days: [day], rates: [], items: [item] } as unknown as TripDocument;
  expect(tripInput(saved).items[0].publish_external_url).toBe(true);
  const legacy = { ...saved, items: [{ ...item, publish_external_url: undefined }] } as unknown as TripDocument;
  expect(tripInput(legacy).items[0].publish_external_url).toBe(false);
});

test("validationPrompt includes only selected issues, human context and preservation constraints", () => {

    const trip = { days: [{ id: "d", date: "2027-04-01", title: "День" }], items: [{ id: "i", title: "Музей", day_id: "d" }] } as TripDocument;
    const issues = [
      { id: "a", code: "missing", category: "client", severity: "warning", title: "Описание", message: "Добавьте описание", path: "/trip/items/0", day_id: "d", item_id: "i" },
      { id: "b", code: "other", category: "client", severity: "info", title: "Не выбрано", message: "Текст", path: "/trip" },
    ];
    const prompt = validationPrompt(trip, issues, ["a"]);
    expect(prompt).toContain("2027-04-01");
    expect(prompt).toContain("Музей");
    expect(prompt).toContain("UUID");
    expect(prompt).toContain("полный JSON");
    expect(prompt).not.toContain("Не выбрано");
});
