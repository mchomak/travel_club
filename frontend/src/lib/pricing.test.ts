import { expect, test } from "vitest";
import Decimal from "decimal.js";
import { vectors } from "../test-fixtures";
import type { TripInput } from "./contracts";
import { calculateTrip } from "./pricing";

test("shared independent pricing vectors match the preview calculator", () => {
  for (const vector of vectors.cases) {
    const result = calculateTrip(vector.input as TripInput);
    for (const [key, expected] of Object.entries(vector.expected)) {
      expect(new Decimal(result[key as keyof typeof vector.expected]).equals(expected!), `${vector.name}: ${key}`).toBe(true);
    }
    if (vector.day_totals) expect(result.days.map(day => day.total), vector.name).toEqual(vector.day_totals);
    if (vector.day_groups) expect(result.days.map(day => day.groups), vector.name).toEqual(vector.day_groups);
    const allocated = result.days.reduce((total, day) => total.plus(day.total), new Decimal(result.general_total));
    expect(allocated.equals(result.cost_total), `${vector.name}: daily + general = trip`).toBe(true);
  }
});

test("an explicit base currency rate other than one is rejected", () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  input.rates = [{ currency: "RUB", rate: "2" }];
  expect(() => calculateTrip(input)).toThrow(/базовой валюты/);
});

test("multi-day duration outside the trip fails even for excluded items", () => {
  const source = vectors.cases.find(vector => vector.name === "tiny_multi_day_last_cent")!;
  const input = structuredClone(source.input);
  input.items[0].day_id = input.days[1].id;
  input.items[0].included = false;
  expect(() => calculateTrip(input)).toThrow(/Малая аренда.*число дней.*пределы поездки/);
});
