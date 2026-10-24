import { expect, test } from "@playwright/test";

test("chapter index exposes all seven source chapters and stays noindex", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/test_17");

  await expect(page.getByRole("heading", { name: "Выберите главу", level: 1 })).toBeVisible();
  const chapterLinks = page.getByRole("navigation", { name: "Главы выпуска" }).getByRole("link");
  await expect(chapterLinks).toHaveCount(7);
  for (const chapter of ["Услуги", "О нас", "Первая поездка", "Таиланд", "Китай", "Архив", "Начать"]) {
    await expect(chapterLinks.getByText(chapter, { exact: true })).toBeVisible();
  }
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("every chapter opens its complete original spread and returns to the index", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const chapters = [
    ["Услуги", "Hero + Formats"],
    ["О нас", "О нас"],
    ["Первая поездка", "Next Issue"],
    ["Таиланд", "Thailand ’26"],
    ["Китай", "China ’26"],
    ["Архив", "Archive ’25"],
    ["Начать", "Point of View + Start"],
  ] as const;

  for (const [number, [label, title]] of chapters.entries()) {
    await page.goto("/test_17");
    await page.getByRole("navigation", { name: "Главы выпуска" })
      .getByRole("link", { name: `Открыть главу ${label}` }).click();

    await expect(page).toHaveURL(new RegExp(`/test_17\\?spread=${number + 1}$`));
    await expect(page.getByTestId("chapter-reader")).toHaveAttribute("data-spread", String(number + 1));
    await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
    await expect(page.locator("[data-magazine-page]")).toHaveCount(2);
    await expect(page.getByRole("link", { name: "Все главы" })).toBeVisible();
    await page.getByRole("link", { name: "Все главы" }).click();
    await expect(page).toHaveURL(/\/test_17$/);
    await expect(page.getByRole("heading", { name: "Выберите главу", level: 1 })).toBeVisible();
  }
});

test("direct chapter links are validated and browser back restores the index", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const chapterTitles = [
    "Hero + Formats", "О нас", "Next Issue", "Thailand ’26", "China ’26", "Archive ’25", "Point of View + Start",
  ];

  for (const [index, title] of chapterTitles.entries()) {
    await page.goto(`/test_17?spread=${index + 1}`);
    await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
    await expect(page.locator("[data-magazine-page]")).toHaveCount(2);
  }

  for (const query of ["spread=0", "spread=8", "spread=01", "spread=1&spread=2"]) {
    await page.goto(`/test_17?${query}`);
    await expect(page.getByRole("heading", { name: "Выберите главу", level: 1 })).toBeVisible();
    await expect(page.getByTestId("chapter-reader")).toHaveCount(0);
  }

  await page.goto("/test_17");
  await page.getByRole("navigation", { name: "Главы выпуска" })
    .getByRole("link", { name: "Открыть главу Китай" }).click();
  await page.goBack();
  await expect(page).toHaveURL(/\/test_17$/);
  await expect(page.getByRole("heading", { name: "Выберите главу", level: 1 })).toBeVisible();
});

test("portrait and landscape phone sizes keep the index and chapter within readable bounds", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 700 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/test_17");
    const indexBounds = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      cardTargets: [...document.querySelectorAll<HTMLElement>('[aria-label="Главы выпуска"] a')]
        .every(link => link.getBoundingClientRect().width >= 44 && link.getBoundingClientRect().height >= 44),
      introSize: Number.parseFloat(getComputedStyle(document.querySelector("main > header > p:nth-of-type(2)")!).fontSize),
    }));
    expect(indexBounds.width).toBeLessThanOrEqual(indexBounds.viewport);
    expect(indexBounds.cardTargets).toBe(true);
    expect(indexBounds.introSize).toBeGreaterThanOrEqual(16);

    await page.goto("/test_17?spread=5");
    const chapterBounds = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      returnTarget: document.querySelector<HTMLAnchorElement>('main[data-testid="chapter-reader"] a[href="/test_17"]')!.getBoundingClientRect().height,
      bodySizes: [...document.querySelectorAll<HTMLElement>("[data-magazine-page] p")]
        .map(paragraph => Number.parseFloat(getComputedStyle(paragraph).fontSize)),
      missingImageAlternatives: document.querySelectorAll("[data-magazine-page] img:not([alt])").length,
    }));
    expect(chapterBounds.width).toBeLessThanOrEqual(chapterBounds.viewport);
    expect(chapterBounds.returnTarget).toBeGreaterThanOrEqual(44);
    expect(chapterBounds.bodySizes.length).toBeGreaterThan(0);
    expect(chapterBounds.bodySizes.every(size => size >= 16)).toBe(true);
    expect(chapterBounds.missingImageAlternatives).toBe(0);
  }
});

test("chapter controls work from the keyboard and honor reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/test_17");

  const firstChapter = page.getByRole("navigation", { name: "Главы выпуска" })
    .getByRole("link", { name: "Открыть главу Услуги" });
  await firstChapter.focus();
  await expect(firstChapter).toBeFocused();
  expect(await firstChapter.evaluate(element => getComputedStyle(element).outlineWidth)).toBe("3px");
  expect(await firstChapter.evaluate(element => getComputedStyle(element).transitionDuration)).toBe("0s");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/test_17\?spread=1$/);
  await expect(page.getByRole("heading", { name: "Hero + Formats", level: 1 })).toBeVisible();

  const returnLink = page.getByRole("link", { name: "Все главы" });
  await returnLink.focus();
  await expect(returnLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/test_17$/);
  await expect(page.getByRole("heading", { name: "Выберите главу", level: 1 })).toBeVisible();
});
