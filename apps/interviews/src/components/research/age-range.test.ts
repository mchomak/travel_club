import { describe, expect, it } from "vitest";
import { formatAgeLabel, formatAgeRange } from "./age-range";

describe("Research age display", () => {
  it("normalizes stored separators and adds the age label only in the display helper", () => {
    expect(formatAgeRange("18_22")).toBe("18-22");
    expect(formatAgeRange("23–29")).toBe("23-29");
    expect(formatAgeRange("30—39")).toBe("30-39");
    expect(formatAgeLabel("18_22")).toBe("Возраст: 18-22");
    expect(formatAgeLabel(null)).toBe("Возраст: —");
  });
});
