import { expect, test } from "vitest";
import { emptyDay, itemDisplayLabel, newCategoryItem, newItem, newTrip, nextItemTitle } from "./trip-ui";

test("event titles advance by display label after the maximum and preserve custom names", () => {
  const day = emptyDay("2026-10-01");
  const flight = newItem("flight", day, "RUB", day.date);
  const taxi = newCategoryItem("transfer", "taxi", day, "RUB", day.date);
  const trip = { ...newTrip(), days: [day], rates: [], items: [{ ...flight, title: "Перелёт 3" }, { ...flight, id: "old", title: "Перелёт 1" }, { ...taxi, title: "Такси 7" }] };
  expect(nextItemTitle(trip, flight)).toBe("Перелёт 4");
  expect(nextItemTitle(trip, taxi)).toBe("Такси 8");
  expect(nextItemTitle(trip, { ...flight, title: "Домой через Стамбул" })).toBe("Домой через Стамбул");
  expect(nextItemTitle(trip, { ...taxi, title: "Такси 2" })).toBe("Такси 8");
  expect(itemDisplayLabel({ type: "transfer", subtype: "car" })).toBe("Автомобиль");
  expect(itemDisplayLabel({ type: "transfer", subtype: "walk" })).toBe("Пеший переход");
});
