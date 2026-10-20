import { expect, test } from "@playwright/test";

test("hero gives the photograph the space freed by its captions", async ({ page }) => {
  await page.goto("/test_12?spread=1");
  const hero = page.locator('[aria-label="Travel Club — знакомство"]');

  await expect(hero.getByText(/Muharrem Alper/)).toHaveCount(0);
  await expect(hero.getByText("Иллюстративная фотография")).toHaveCount(0);
  await expect(hero.getByText("Travel Club — независимая редакция путешествий")).toHaveCount(0);

  const image = hero.locator('[data-reveal-object="hero-photo"]');
  const folio = hero.locator("footer");
  const remainingGap = await image.evaluate((element) => {
    const art = element.parentElement!.getBoundingClientRect();
    const footer = element.closest("section")!.querySelector("footer")!.getBoundingClientRect();
    return footer.top - art.bottom;
  });
  await expect(folio).toBeVisible();
  expect(remainingGap).toBeLessThan(24);
});

test("each service row shows an explicit link to its format", async ({ page }) => {
  await page.goto("/test_12?spread=1");
  const services = page.locator('[aria-label="Три формата путешествий"] a[aria-label][href="/formats"]');

  await expect(services).toHaveCount(3);
  await expect(page.getByText("Подробнее о формате", { exact: true })).toHaveCount(3);
});

test("founder portraits have no placeholder caption and use a larger area", async ({ page }) => {
  await page.goto("/test_12?spread=2");

  for (const founder of ["vasilisa", "ramil"]) {
    const portrait = page.locator(`[data-founder-photo="${founder}"]`);
    await expect(portrait.locator("figcaption")).toHaveCount(0);
    const widthRatio = await portrait.evaluate((element) => {
      const portraitBox = element.getBoundingClientRect();
      const bodyBox = element.parentElement!.getBoundingClientRect();
      return portraitBox.width / bodyBox.width;
    });

    expect(widthRatio).toBeGreaterThanOrEqual(0.48);
  }
});

test("founder role headings align with the tops of their portraits", async ({ page }) => {
  await page.goto("/test_12?spread=2");

  for (const founder of ["vasilisa", "ramil"]) {
    const portrait = page.locator(`[data-founder-photo="${founder}"]`);
    const heading = portrait.locator("xpath=ancestor::section").locator("h3");
    const headingOffset = await portrait.evaluate((element) => {
      const portraitBox = element.getBoundingClientRect();
      const headingBox = element.parentElement!.querySelector("h3")!.getBoundingClientRect();
      return Math.abs(headingBox.top - portraitBox.top);
    });

    await expect(heading).toBeVisible();
    expect(headingOffset).toBeLessThan(18);
  }
});

test("Thailand artwork has no yellow diagonal line", async ({ page }) => {
  await page.goto("/test_12?spread=4");
  await expect(page.locator('[data-reveal-object="thai-line"]')).toHaveCount(0);
});

test("the cover cue sits above the cover and disappears when the journal opens", async ({ page }) => {
  await page.goto("/test_12");
  const openButton = page.getByRole("button", { name: "Открыть журнал", exact: true });
  const cue = openButton.locator(":scope > span");
  await expect(cue).toBeVisible();

  const geometry = await page.evaluate(() => {
    const cueBox = document.querySelector('[aria-label="Открыть журнал"] > span')!.getBoundingClientRect();
    const coverBox = document.querySelector("[data-magazine-cover]")!.getBoundingClientRect();
    return { cueBottom: cueBox.bottom, coverTop: coverBox.top };
  });
  expect(geometry.cueBottom).toBeLessThan(geometry.coverTop);

  await openButton.click();
  await expect(openButton).toBeHidden({ timeout: 10000 });
});
