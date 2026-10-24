import { expect, test } from "@playwright/test";

test("opens the chapter named by a direct spread link", async ({ page }) => {
  await page.goto("/test_16?spread=5");

  await expect(page.getByRole("status", { name: "Положение в выпуске" })).toHaveText("Глава 5 из 7 · Китай");
  await expect(page.getByRole("heading", { name: "Дальше — вместе." })).toBeVisible();
  await expect(page.locator("[data-mobile-issue] [data-magazine-page]")).toHaveCount(2);
});

test("chapter selection keeps other query values and follows browser history", async ({ page }) => {
  await page.goto("/test_16?source=compare&spread=2");

  await page.getByLabel("Перейти к главе").selectOption("4");
  await expect(page).toHaveURL(/source=compare.*spread=5/);
  await expect(page.getByRole("status", { name: "Положение в выпуске" })).toHaveText("Глава 5 из 7 · Китай");
  await expect(page.getByRole("button", { name: "Следующая: Архив →" })).toBeVisible();

  await page.goBack();
  await expect(page.getByRole("status", { name: "Положение в выпуске" })).toHaveText("Глава 2 из 7 · О нас");
  await page.goForward();
  await expect(page.getByRole("status", { name: "Положение в выпуске" })).toHaveText("Глава 5 из 7 · Китай");
});

test("malformed and repeated spread parameters fall back to the first chapter", async ({ page }) => {
  for (const url of ["/test_16?spread=5&spread=6", "/test_16?spread=8"]) {
    await page.goto(url);
    await expect(page.getByRole("status", { name: "Положение в выпуске" })).toHaveText("Глава 1 из 7 · Услуги");
    await expect(page.getByRole("heading", { name: "С нами в путь" })).toBeVisible();
    await expect(page.locator("[data-mobile-issue] [data-magazine-page]")).toHaveCount(2);
  }
});

test("named previous and next controls work from the keyboard", async ({ page }) => {
  await page.goto("/test_16?spread=1");

  const next = page.getByRole("button", { name: "Следующая: О нас →" });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/spread=2/);
  await expect(page.getByRole("status", { name: "Положение в выпуске" })).toHaveText("Глава 2 из 7 · О нас");

  const previous = page.getByRole("button", { name: "← Предыдущая: Услуги" });
  await previous.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status", { name: "Положение в выпуске" })).toHaveText("Глава 1 из 7 · Услуги");
});

test("chapter changes bring the new reading heading below the sticky controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_16?spread=6");

  const firstReadingHeading = page.locator('[data-mobile-issue] [data-magazine-page] h1, [data-mobile-issue] [data-magazine-page] h2').first();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(firstReadingHeading).not.toBeInViewport();

  await page.getByRole("button", { name: "← Предыдущая: Китай" }).click();

  const newReadingHeading = page.locator('[data-mobile-issue] [data-magazine-page] h1, [data-mobile-issue] [data-magazine-page] h2').first();
  await expect(newReadingHeading).toHaveText("CHINA’26");
  await expect(newReadingHeading).toBeInViewport();
  const [headingTop, controlsBottom] = await Promise.all([
    newReadingHeading.evaluate(element => element.getBoundingClientRect().top),
    page.getByRole("navigation", { name: "Положение и выбор главы" }).evaluate(element => element.getBoundingClientRect().bottom),
  ]);
  expect(headingTop).toBeGreaterThanOrEqual(controlsBottom);
});

for (const viewport of [
  { width: 320, height: 700 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
]) {
  test(`keeps the chapter readable at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/test_16?spread=4");

    const layout = await page.evaluate(() => {
      const bodyCopy = [...document.querySelectorAll<HTMLElement>('[data-mobile-issue] [data-magazine-page] p:not(.credit)')];
      const controls = [...document.querySelectorAll<HTMLElement>(
        'a[href="/test_16?spread=1"], nav[aria-label="Положение и выбор главы"] select, nav[aria-label="Переход между главами"] button',
      )];
      const sourceLinks = [...document.querySelectorAll<HTMLElement>('[data-mobile-issue] [data-magazine-page] a')];
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        copySizes: bodyCopy.map(element => Number.parseFloat(getComputedStyle(element).fontSize)),
        controlHeights: controls.map(element => element.getBoundingClientRect().height),
        sourceLinkHeights: sourceLinks.map(element => element.getBoundingClientRect().height),
        pageCount: document.querySelectorAll('[data-mobile-issue] [data-magazine-page]').length,
      };
    });

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.copySizes.length).toBeGreaterThan(0);
    expect(layout.copySizes.every(size => size >= 16)).toBe(true);
    expect(layout.controlHeights.every(height => height >= 44)).toBe(true);
    expect(layout.sourceLinkHeights.length).toBeGreaterThan(0);
    expect(layout.sourceLinkHeights.every(height => height >= 44)).toBe(true);
    expect(layout.pageCount).toBe(2);
  });
}
