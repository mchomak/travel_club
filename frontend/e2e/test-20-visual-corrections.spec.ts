import { expect, test } from "@playwright/test";

test("service number and English name sit on a backing separate from the details link", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_20");

  const card = page.locator('[data-format="route"]');
  const identity = card.locator("[data-format-identity]");
  await expect(identity).toHaveCount(1);
  await expect(identity.locator("[data-format-number]")).toHaveText("01");
  await expect(identity.getByRole("heading", { level: 3 })).toHaveText("Travel Design");
  await expect(card.getByRole("link", { name: /Подробнее/ })).toBeVisible();
  await expect(identity.locator("a")).toHaveCount(0);

  const surfaces = await identity.evaluate(element => ({
    panel: getComputedStyle(element).backgroundColor,
    section: getComputedStyle(element.closest("#formats")!).backgroundColor,
  }));
  expect(surfaces.panel).not.toBe(surfaces.section);
});

test("NEXT ISSUE note matches the original test_13 editorial treatment", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_20");

  const note = page.locator('#next-issue [class*="nextArtNote"]');
  await expect(note).toHaveText(/\u0415\u0449\u0451 \u043d\u0435 \u043d\u0430 \u043a\u0430\u0440\u0442\u0435\.\s*\u0423\u0436\u0435 \u0432 \u043f\u043b\u0430\u043d\u0430\u0445\./);
  await expect(note.locator("br")).toHaveCount(1);
  await expect(page.locator("#next-issue")).not.toContainText(/\u041f\u0435\u0440\u0432\u043e\u0435 \u0433\u0440\u0443\u043f\u043f\u043e\u0432\u043e\u0435\s*\/\s*\u0432 \u043f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0435/i);
  const treatment = await note.evaluate(element => {
    const art = element.parentElement!.getBoundingClientRect();
    const bounds = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      fontFamily: style.fontFamily,
      textAlign: style.textAlign,
      leftGap: Math.abs(bounds.left - art.left),
      bottomGap: art.bottom - bounds.bottom,
      expectedBottomGap: art.height * 0.25,
    };
  });
  expect(treatment.fontFamily).toContain("TC Lora");
  expect(treatment.textAlign).toBe("left");
  expect(treatment.leftGap).toBeLessThanOrEqual(1);
  expect(Math.abs(treatment.bottomGap - treatment.expectedBottomGap)).toBeLessThanOrEqual(1);
});

test("FIELD NOTES icon uses the warm red from the reference", async ({ page }) => {
  await page.goto("/test_20");

  const icon = page.locator('[class*="fieldNotesGrid"] h2 svg');
  await expect(icon).toHaveCount(1);
  await expect(icon).toHaveCSS("color", "rgb(206, 60, 40)");
});

test("Thailand year sits above and to the right of the country title", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/test_20");

    const art = page.locator('[class*="thaiArt"]');
    const year = art.locator("[data-thai-year]");
    const location = art.locator("[data-thai-location]");
    await expect(year).toHaveText("’26");
    await expect(location).toContainText("Таиланд");

    const positions = await Promise.all([year, location].map(element => element.boundingBox()));
    const frame = await art.boundingBox();
    expect(frame).not.toBeNull();
    expect(positions[0]).not.toBeNull();
    expect(positions[1]).not.toBeNull();
    expect(Math.abs(positions[0]!.y - frame!.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(positions[0]!.x + positions[0]!.width - frame!.x - frame!.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(positions[1]!.x - frame!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(positions[1]!.y + positions[1]!.height - frame!.y - frame!.height)).toBeLessThanOrEqual(1);
  }
});

test("China background has a subtle local ornamental pattern below its content", async ({ page }) => {
  await page.goto("/test_20");

  const china = page.locator("#field-note-china");
  const pattern = await china.evaluate(element => {
    const style = getComputedStyle(element, "::before");
    return {
      image: style.backgroundImage,
      opacity: Number(style.opacity),
      pointerEvents: style.pointerEvents,
    };
  });
  expect(pattern.image).toContain("/test_20/china-pattern.svg");
  expect(pattern.opacity).toBeGreaterThan(0);
  expect(pattern.opacity).toBeLessThanOrEqual(0.16);
  expect(pattern.pointerEvents).toBe("none");
});
