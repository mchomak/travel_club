import { expect, test } from "@playwright/test";

test("service number and name have a visible backing", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_20");

  const card = page.locator('[data-format="route"]');
  const identity = card.locator("[data-format-identity]");
  await expect(identity.locator("[data-format-number]")).toHaveText("01");
  await expect(identity.getByRole("heading", { level: 3 })).toHaveText("Travel Design");
  await expect(card.locator('[class*="detailsLink"]')).toBeVisible();
  await expect(identity.locator("a")).toHaveCount(0);

  const surfaces = await identity.evaluate(element => ({
    panel: getComputedStyle(element).backgroundColor,
    section: getComputedStyle(element.closest("#formats")!).backgroundColor,
  }));
  const channels = (value: string) => {
    const numbers = value.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    return numbers.map(channel => (channel <= 1 ? channel * 255 : channel));
  };
  const panel = channels(surfaces.panel);
  const section = channels(surfaces.section);
  expect(Math.hypot(...panel.map((channel, index) => channel - section[index]))).toBeGreaterThanOrEqual(14);
});

test("NEXT ISSUE note keeps its copy and original compact sans-serif treatment", async ({ page }) => {
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
      fontSize: Number.parseFloat(style.fontSize),
      textAlign: style.textAlign,
      leftGap: Math.abs(bounds.left - art.left),
      bottomGap: art.bottom - bounds.bottom,
      expectedBottomGap: art.height * 0.25,
    };
  });
  expect(treatment.fontFamily).toContain("TC Golos");
  expect(treatment.fontSize).toBeLessThanOrEqual(15);
  expect(treatment.textAlign).toBe("left");
  expect(treatment.leftGap).toBeLessThanOrEqual(1);
  expect(Math.abs(treatment.bottomGap - treatment.expectedBottomGap)).toBeLessThanOrEqual(1);
});

test("FIELD NOTES icon matches its heading color", async ({ page }) => {
  await page.goto("/test_20");

  const icon = page.locator('[class*="fieldNotesGrid"] h2 svg');
  await expect(icon).toHaveCount(1);
  const colors = await icon.evaluate(element => ({
    icon: getComputedStyle(element).color,
    heading: getComputedStyle(element.closest("h2")!).color,
  }));
  expect(colors.icon).toBe(colors.heading);
  expect(colors.icon).not.toBe("rgb(206, 60, 40)");
});

test("Thailand year sits clear of the title on desktop and above it on mobile", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/test_20");

    const opening = page.locator('[class*="thailandOpening"]');
    const art = page.locator('[class*="thaiArt"]');
    const year = opening.locator("[data-thai-year]");
    const title = art.locator("#thailand-title");
    await expect(year).toHaveText("\u201926");
    await expect(art.locator("[data-thai-location]")).toContainText("\u0422\u0430\u0438\u043b\u0430\u043d\u0434");

    const [yearBounds, titleBounds, artBounds] = await Promise.all([year, title, art].map(element => element.boundingBox()));
    expect(yearBounds).not.toBeNull();
    expect(titleBounds).not.toBeNull();
    expect(artBounds).not.toBeNull();
    if (viewport.width > 820) {
      expect(yearBounds!.x).toBeGreaterThanOrEqual(titleBounds!.x + titleBounds!.width - 1);
    } else {
      expect(yearBounds!.y + yearBounds!.height).toBeLessThanOrEqual(artBounds!.y + 1);
    }
  }
});

test("China background uses a compact local ornamental pattern", async ({ page }) => {
  await page.goto("/test_20");

  const pattern = await page.locator("#field-note-china").evaluate(element => {
    const style = getComputedStyle(element, "::before");
    return {
      image: style.backgroundImage,
      size: style.backgroundSize,
      opacity: Number(style.opacity),
      pointerEvents: style.pointerEvents,
    };
  });
  expect(pattern.image).toContain("/test_20/china-pattern.svg");
  expect(pattern.size).toBe("120px 120px");
  expect(pattern.opacity).toBeGreaterThan(0);
  expect(pattern.opacity).toBeLessThanOrEqual(0.12);
  expect(pattern.pointerEvents).toBe("none");
});
