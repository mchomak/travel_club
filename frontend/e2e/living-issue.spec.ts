import { expect, test } from "@playwright/test";

test("the experiment deep link opens the original hero, while baseline keeps its form anchor", async ({ page }) => {
  await page.goto("/test_2#start");
  const header = page.getByRole("banner");
  await expect.poll(async () => (await header.boundingBox())!.y).toBeLessThan(2);
  await expect.poll(() => page.locator("#start").evaluate(e => Math.abs(e.getBoundingClientRect().top))).toBeLessThan(2);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Travel Club — начало страницы" })).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(900);
  await page.getByRole("link", { name: "К содержимому" }).focus();
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(900);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  await expect(page.getByRole("heading", { name: "Куда — важно. С кем — важнее." })).toBeVisible();
  await page.getByRole("banner").getByRole("link", { name: "Начать историю" }).click();
  await expect(page).toHaveURL(/#story$/);
  await expect(page.locator("#story").getByRole("textbox", { name: /Ваш контакт/ })).toBeVisible();
  await page.goto("/test#start");
  await expect(page.locator("#start").getByRole("textbox", { name: /Ваш контакт/ })).toBeVisible();
});

for (const viewport of [{ width: 320, height: 568 }, { width: 667, height: 375 }]) {
  test(`cover and spread remain readable on ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/test_2");
    const scene = page.getByRole("region", { name: "TRAVEL CLUB", exact: true });
    const photo = scene.getByRole("article").getByRole("img");
    expect((await photo.boundingBox())!.height).toBeGreaterThan(70);
    await page.evaluate(() => window.scrollTo(0, innerHeight * 0.38));
    const headline = scene.getByText("Место за общим столом.", { exact: true });
    const note = scene.getByText(/У каждой поездки — свои люди/);
    const cover = scene.getByRole("article");
    await expect.poll(() => cover.evaluate(e => Number(getComputedStyle(e).opacity))).toBe(0);
    const rightPhoto = scene.locator('img[src*="hero-table"]');
    const headlineBounds = (await headline.boundingBox())!;
    const noteBounds = (await note.boundingBox())!;
    const photoBounds = (await rightPhoto.boundingBox())!;
    expect(noteBounds.y).toBeGreaterThanOrEqual(headlineBounds.y + headlineBounds.height);
    if (viewport.width === 320) expect(noteBounds.y + noteBounds.height).toBeLessThan(photoBounds.y);
    expect(noteBounds.y + noteBounds.height).toBeLessThan(viewport.height);
    expect(photoBounds.height).toBeGreaterThan(60);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

for (const width of [1440, 1024, 390]) {
  test(`native opening, reverse scroll and keyboard skip at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto("/test_2");
    await expect(page.getByRole("heading", { name: "TRAVEL CLUB", exact: true })).toBeVisible();
    const scene = page.getByRole("region", { name: "TRAVEL CLUB", exact: true });
    const cover = scene.getByRole("article");
    const initial = await cover.evaluate(e => getComputedStyle(e).transform);
    const viewport = await page.evaluate(() => innerHeight);
    await page.mouse.wheel(0, viewport * 0.37);
    await expect.poll(() => cover.evaluate(e => getComputedStyle(e).transform)).not.toBe(initial);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.mouse.wheel(0, viewport * 1.1);
    await expect.poll(async () => (await page.getByRole("banner").boundingBox())!.y).toBeLessThan(viewport);
    expect(await page.evaluate(() => location.hash)).toBe("");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => cover.evaluate(e => getComputedStyle(e).transform)).toBe(initial);
    const skip = scene.getByRole("link", { name: "К сайту" });
    await skip.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#start$/);
    await expect.poll(() => page.locator("#start").evaluate(e => Math.abs(e.getBoundingClientRect().top))).toBeLessThan(2);
  });
}

test("reduced motion stays static and does not add an empty scroll journey", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_2");
  const scene = page.getByRole("region", { name: "TRAVEL CLUB", exact: true });
  const cover = scene.getByRole("article");
  expect(await cover.evaluate(e => getComputedStyle(e).transform)).toBe("none");
  await expect(scene.getByRole("heading", { name: "Место за общим столом." })).toBeVisible();
  await expect(scene.getByRole("paragraph").filter({ hasText: "У каждой поездки — свои люди, места и истории." })).toBeVisible();
  const viewport = await page.evaluate(() => innerHeight);
  expect((await scene.boundingBox())!.height).toBe(viewport);
  await page.mouse.wheel(0, viewport * 0.3);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(viewport * 0.2);
  expect(await cover.evaluate(e => getComputedStyle(e).transform)).toBe("none");
  await page.goto("/test_2#start");
  await expect.poll(() => page.locator("#start").evaluate(e => Math.abs(e.getBoundingClientRect().top))).toBeLessThan(2);
});

test("without JavaScript the cover, skip and original content remain accessible", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/test_2");
  await expect(page.getByRole("heading", { name: "TRAVEL CLUB", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "К сайту" }).click();
  await expect(page).toHaveURL(/#start$/);
  await expect.poll(() => page.locator("#start").evaluate(e => Math.abs(e.getBoundingClientRect().top))).toBeLessThan(2);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await context.close();
});

test("experiment uses Russian editorial content and keeps the format and form flow", async ({ page }) => {
  await page.goto("/test");
  await expect(page.locator("#top")).toContainText("ISSUE 00");
  await page.goto("/test_2#start");
  const editorialText = (await page.locator("#top").innerText()).replace(/travel club/gi, "");
  expect(editorialText).not.toMatch(/[a-z]/i);
  await expect(page.locator("#memory")).toContainText("Страница из книги поездки");
  expect(await page.locator("#top [data-printed-photo]").count()).toBeGreaterThanOrEqual(2);
  await page.getByRole("link").filter({ has: page.getByRole("heading", { name: "Под ключ", exact: true }) }).click();
  const form = page.locator("#story");
  await expect(form.getByRole("radio", { name: "Хочу под ключ", exact: true })).toBeChecked();
  await form.getByRole("button", { name: "Обсудить поездку", exact: true }).click();
  await expect(form.getByRole("alert")).toHaveText("Оставьте телеграм, телефон или электронную почту.");
  await expect(form.getByRole("textbox", { name: /Ваш контакт/ })).toBeFocused();
  const ids = await page.locator("[id]").evaluateAll(elements => elements.map(e => e.id));
  expect(new Set(ids).size).toBe(ids.length);
});
