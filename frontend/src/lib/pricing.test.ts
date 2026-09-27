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
  }
});

test("an explicit base currency rate other than one is rejected", () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  input.rates = [{ currency: "RUB", rate: "2" }];
  expect(() => calculateTrip(input)).toThrow(/базовой валюты/);
});
