import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test.use({ viewport: { width: 390, height: 844 } });
const pageErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on("pageerror", error => errors.push(error.message));
});
test.afterEach(async ({ page }) => expect(pageErrors.get(page)).toEqual([]));

const chapters = ["Услуги", "О нас", "Первая поездка", "Таиланд", "Китай", "Архив", "Начать"];
const footer = (page: Page) => page.getByRole("navigation", { name: "Перелистывание журнала" });

for (const viewport of [{ width: 320, height: 700 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
  test(`all fifteen leaves and seven chapters at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize(viewport);
    await page.goto("/test_18");
    await mkdir("test-results/test18", { recursive: true });
    for (let number = 1; number <= 15; number++) {
      const article = page.locator(`article[data-pocket-page='${number}']`);
      await expect(article).toBeVisible();
      await expect(page.locator("main")).toHaveCount(1);
      await expect(page.locator("article")).toHaveCount(1);
      await expect(article.locator("h1")).toHaveCount(1);
      expect(await article.getAttribute("aria-label")).toBeTruthy();
      const clippedText = await article.locator("p,h1,h3,figcaption").evaluateAll(elements => elements.filter(element => element.scrollWidth > element.clientWidth + 1 && getComputedStyle(element).display !== "inline").map(element => element.textContent));
      expect(clippedText).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
      const box = await footer(page).boundingBox();
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
      for (const link of await footer(page).getByRole("link").all()) {
        const target = await link.boundingBox();
        expect(target!.width).toBeGreaterThanOrEqual(44);
        expect(target!.height).toBeGreaterThanOrEqual(44);
      }
      if (number % 2 === 0) {
        await footer(page).getByRole("link", { name: /Оглавление/ }).click();
        const dialog = page.getByRole("dialog");
        await expect(dialog.getByRole("link")).toHaveCount(8);
        await expect(dialog.locator("[aria-current]")).toContainText(chapters[number / 2 - 1]);
        await page.keyboard.press("Escape");
      }
      if (viewport.width === 390 || (viewport.width === 320 && [1, 3, 5, 6, 8, 12, 15].includes(number))) {
        await page.screenshot({ path: `test-results/test18/reader-${viewport.width}x${viewport.height}-${String(number).padStart(2, "0")}.png`, fullPage: true, animations: "disabled" });
      }
      if (number < 15) await footer(page).getByRole("link", { name: /^Вперёд:/ }).click();
      else await expect(footer(page).getByRole("link", { name: /^Вперёд:/ })).toHaveCount(0);
    }
    await page.locator("main").getByRole("link", { name: /Вернуться к обложке/ }).click();
    await expect(page.locator('[data-pocket-page="1"]')).toBeVisible();
    await expect(footer(page).getByRole("link", { name: /^Назад:/ })).toHaveCount(0);
  });
}

test("direct invalid queries normalize without losing unrelated repeated values", async ({ page }) => {
  for (const query of ["page=0", "page=16", "page=02", "page=2.0", "page=2&page=3", "page=1e1", "page=%202"]) {
    await page.goto(`/test_18?${query}&keep=one&keep=two`);
    await expect(page.locator('[data-pocket-page="1"]')).toBeVisible();
    await expect.poll(() => new URL(page.url()).searchParams.getAll("page")).toEqual(["1"]);
    expect(new URL(page.url()).searchParams.getAll("keep")).toEqual(["one", "two"]);
  }
  await page.goto("/test_18?page=15");
  await expect(page.locator('[data-pocket-page="15"]')).toBeVisible();
  await expect(page.locator("h1")).not.toBeFocused();
});

test("keyboard excludes modifiers and interactive focus; rapid turns settle instantly in reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_18?page=3");
  await page.keyboard.press("Shift+ArrowRight");
  await expect(page.locator('[data-pocket-page="3"]')).toBeVisible();
  await page.locator('article a[href="/formats"]').first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-pocket-page="3"]')).toBeVisible();
  await page.locator("h1").focus();
  for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-pocket-page="13"]')).toBeVisible();
  expect(await page.locator("article").evaluate(element => element.parentElement!.getAnimations().length)).toBe(0);
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowLeft");
  await expect(page.locator('[data-pocket-page="9"]')).toBeVisible();
});

test("native href and printed contents remain usable without JavaScript or photographs", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 568 } });
  const page = await context.newPage();
  await page.route(/\.(webp|jpg|png)(\?|$)/, route => route.abort());
  await page.goto("/test_18?page=3&keep=yes");
  await expect(page.locator('[data-pocket-page="3"]')).toBeVisible();
  await page.locator("#pocket-contents summary").click();
  await expect(page.locator("#pocket-contents nav a")).toHaveCount(8);
  await page.locator("#pocket-contents").getByRole("link", { name: /Китай/ }).click();
  await expect(page.locator('[data-pocket-page="10"]')).toBeVisible();
  expect(new URL(page.url()).searchParams.get("keep")).toBe("yes");
  await footer(page).getByRole("link", { name: /^Вперёд:/ }).click();
  await expect(page.locator('[data-pocket-page="11"]')).toBeVisible();
  await footer(page).getByRole("link", { name: /^Назад:/ }).click();
  await expect(page.locator('[data-pocket-page="10"]')).toBeVisible();
  await context.close();
});

test("real touch input turns horizontally and leaves vertical scroll, edge gestures and links alone", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const cdp = await context.newCDPSession(page);
  async function swipe(x1: number, y1: number, x2: number, y2: number) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x1, y: y1 }] });
    for (let i = 1; i <= 8; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x1 + (x2 - x1) * i / 8, y: y1 + (y2 - y1) * i / 8 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }
  await page.goto("/test_18?page=5");
  await swipe(300, 420, 110, 425);
  await expect(page.locator('[data-pocket-page="6"]')).toBeVisible();
  await swipe(10, 430, 190, 435);
  await expect(page.locator('[data-pocket-page="6"]')).toBeVisible();
  await page.goto("/test_18?page=3");
  await swipe(200, 650, 205, 250);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  await expect(page.locator('[data-pocket-page="3"]')).toBeVisible();
  const link = page.locator('article a[href="/formats"]').first();
  await link.scrollIntoViewIfNeeded();
  const box = await link.boundingBox();
  await swipe(box!.x + box!.width - 30, Math.max(100, box!.y + 60), box!.x + 30, Math.max(100, box!.y + 65));
  await expect(page.locator('[data-pocket-page="3"]')).toBeVisible();
  await context.close();
  expect(errors).toEqual([]);
});

test("cover opens one live leaf, preserves query, and announces its heading", async ({ page }) => {
  await page.goto("/test_18?campaign=phone&campaign=issue");
  await expect(page.locator("article[data-pocket-page='1']")).toBeVisible();
  await expect(page.locator("h1")).not.toBeFocused();
  await page.getByRole("link", { name: "Открыть журнал", exact: true }).click();
  await expect(page.locator("article[data-pocket-page='2']")).toBeVisible();
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.locator("h1")).toBeFocused();
  expect(new URL(page.url()).searchParams.getAll("campaign")).toEqual(["phone", "issue"]);
  await expect(page.getByRole("status")).toContainText("02 / 15");
  await page.goBack();
  await expect(page.locator("article[data-pocket-page='1']")).toBeVisible();
  await page.goForward();
  await expect(page.locator("article[data-pocket-page='2']")).toBeVisible();
});

test("200 percent text grows body type and keeps leaf actions above the fixed controls", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/test_18?page=5");
  const prose = page.locator("article p").filter({ hasText: "Технологии" }).first();
  const before = await prose.evaluate(element => parseFloat(getComputedStyle(element).fontSize));
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  expect(await prose.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(before * 2);
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowLeft");
  for (let number = 1; number <= 15; number++) {
    await expect(page.locator(`article[data-pocket-page='${number}']`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    expect(await page.locator("article p,article h1,article h3").evaluateAll(elements => elements.filter(element => element.scrollWidth > element.clientWidth + 1 && getComputedStyle(element).display !== "inline").map(element => element.textContent))).toEqual([]);
    const onward = page.locator("main > div:last-of-type a");
    await onward.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const actionBox = await onward.boundingBox();
    const controlsBox = await page.getByRole("navigation", { name: "Перелистывание журнала" }).boundingBox();
    expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(controlsBox!.y);
    if (number < 15) await onward.click();
  }
});

test("printed contents traps focus, marks seven chapters, and restores reading position", async ({ page }) => {
  await page.goto("/test_18?page=3");
  await page.evaluate(() => window.scrollTo(0, 350));
  const trigger = page.getByRole("link", { name: /Оглавление номера/ });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Содержание" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link")).toHaveCount(8);
  await expect(dialog.locator('[aria-current="location"]')).toContainText("Услуги");
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(350);
  await trigger.click();
  await dialog.getByRole("link", { name: /Таиланд/ }).click();
  await expect(page.locator('[data-pocket-page="8"]')).toBeVisible();
  await expect(page.locator("h1")).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.goBack();
  await expect(page.locator('[data-pocket-page="3"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(350);
});

test("Back and Forward from open contents focus the destination heading and restore its scroll", async ({ page }) => {
  await page.goto("/test_18?page=2");
  await page.evaluate(() => window.scrollTo(0, 100));
  await footer(page).getByRole("link", { name: /^Вперёд:/ }).click();
  await expect(page.locator('[data-pocket-page="3"]')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 350));
  await footer(page).getByRole("link", { name: /Оглавление/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator('[data-pocket-page="2"]')).toBeVisible();
  await expect(page.locator("h1")).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(100);
  await footer(page).getByRole("link", { name: /Оглавление/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator('[data-pocket-page="3"]')).toBeVisible();
  await expect(page.locator("h1")).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(350);
});
