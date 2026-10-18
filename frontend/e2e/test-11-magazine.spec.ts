import { expect, test } from "@playwright/test";

test("direct links open the requested article and keyboard navigation preserves browser history", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_11?spread=2&source=qa");
  const root = page.getByTestId("magazine-experience");
  await expect(root).toHaveAttribute("data-stage", "reading");
  await expect(page.getByRole("link", { name: /Хочу поехать с вами/ })).toHaveAttribute("href", "/start?format=group");
  await page.keyboard.press("ArrowRight");
  await expect(root).toHaveAttribute("data-spread", "3");
  await expect(root).toHaveAttribute("data-turning", "false");
  await expect(page).toHaveURL(/spread=3&source=qa/);
  await expect(page.getByRole("link", { name: /архив/i }).last()).toHaveAttribute("href", "/archive");
  await page.goBack();
  await expect(root).toHaveAttribute("data-spread", "2");
  await page.goForward();
  await expect(root).toHaveAttribute("data-spread", "3");
  await expect(page.locator('[data-magazine-book] > [data-magazine-page]')).toHaveCount(2);
});

test("modified arrow shortcuts pass through to the browser", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_11?spread=2");
  for (const modifier of ["altKey", "ctrlKey", "metaKey"]) {
    const prevented = await page.evaluate(modifier => {
      const event = new KeyboardEvent("keydown", { key: "ArrowRight", [modifier]: true, cancelable: true, bubbles: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    }, modifier);
    expect(prevented).toBe(false);
    await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-spread", "2");
  }
});

test("skipping the cover transfers focus to the usable magazine", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_11");
  await page.getByRole("button", { name: "Пропустить вступление ↗" }).click();
  await expect(page.locator("[data-magazine-book]")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-spread", "2");
});

test("450ms turns reject rapid commands and keep temporary copies out of focus", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 768 });
  await page.goto("/test_11?spread=1");
  const root = page.getByTestId("magazine-experience");
  const time = new Date("2026-10-18T09:00:00Z");
  await page.clock.install({ time }); await page.clock.pauseAt(time);
  await page.getByRole("link", { name: /Обсудить поездку/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("navigation", { name: "Навигация журнала" })).toBeFocused();
  const leaf = page.locator('[aria-hidden="true"][inert]');
  await expect(leaf).toHaveCount(1);
  expect(await leaf.evaluate(element => getComputedStyle(element).animationDuration)).toBe("0.45s");
  expect(await leaf.locator('[data-magazine-page]').evaluateAll(pages => pages.every(page => page.getAttribute('data-reveal') === 'false'))).toBe(true);
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowLeft");
  await expect(root).toHaveAttribute("data-spread", "2");
  await page.clock.runFor(449); await expect(root).toHaveAttribute("data-turning", "true");
  await page.clock.runFor(2); await expect(root).toHaveAttribute("data-turning", "false");
  await expect(leaf).toHaveCount(0);
  await page.getByRole("button", { name: "Следующий разворот", exact: true }).click({ force: true });
  await expect(root).toHaveAttribute("data-spread", "3");
});

test("Back interrupts a turn without leaving a lock or stale article", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_11?spread=1&source=qa");
  const root = page.getByTestId("magazine-experience");
  await page.keyboard.press("ArrowRight");
  await expect(root).toHaveAttribute("data-turning", "true");
  await page.goBack();
  await expect(root).toHaveAttribute("data-spread", "1");
  await expect(root).toHaveAttribute("data-turning", "false");
  await expect(page.getByRole("link", { name: /Подробнее о форматах/ })).toHaveAttribute("href", "/formats");
  await page.keyboard.press("ArrowRight");
  await expect(root).toHaveAttribute("data-spread", "2");
  await expect(root).toHaveAttribute("data-turning", "false");
  await expect(page.getByRole("link", { name: /Хочу поехать с вами/ })).toHaveAttribute("href", "/start?format=group");
});

test("the printed cover opens physically then can be revisited without losing the current article", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_11");
  const root = page.getByTestId("magazine-experience"), cover = page.locator("[data-magazine-cover]");
  await expect(cover).toBeVisible();
  const coverBox = await cover.boundingBox();
  expect(coverBox!.height).toBeGreaterThan(720);
  await expect(page.getByRole("link", { name: /Обсудить поездку/ })).toHaveCount(0);
  await expect(root).toHaveAttribute("data-stage", "reading", { timeout: 10000 });
  await expect(root).toHaveAttribute("data-intro-result", "target");
  await expect(page.locator("[data-magazine-intro]")).toHaveCount(0);
  await page.getByRole("button", { name: /03.*Thailand/i }).click();
  await expect(root).toHaveAttribute("data-turning", "false");
  await page.getByRole("button", { name: "Обложка", exact: true }).click();
  await expect(cover).toBeVisible();
  await expect(page.getByRole("button", { name: "Открыть журнал", exact: true })).toBeFocused();
  await page.waitForTimeout(1800);
  await expect(root).toHaveAttribute("data-stage", "opening");
  await page.getByRole("button", { name: "Открыть журнал", exact: true }).click();
  await expect(root).toHaveAttribute("data-stage", "reading");
  await expect(root).toHaveAttribute("data-spread", "3");
  await expect(page.locator("[data-magazine-book]")).toBeFocused();
  await expect(page.getByRole("link", { name: /архив/i })).toHaveAttribute("href", "/archive");
  await page.waitForTimeout(1800);
  expect(await root.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === "running").length)).toBe(0);
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("invalid and repeated links normalize to the first spread while reduced motion remains static", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const query of ["spread=bad", "spread=2&spread=3"]) {
    await page.goto(`/test_11?${query}&source=qa`);
    await expect(page).toHaveURL(/spread=1&source=qa/);
    const root = page.getByTestId("magazine-experience");
    await expect(root).toHaveAttribute("data-stage", "reading");
    await page.getByRole("button", { name: /03.*Thailand/i }).click();
    await expect(root).toHaveAttribute("data-spread", "3");
    await expect(root).toHaveAttribute("data-turning", "false");
    expect(await root.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === "running").length)).toBe(0);
  }
  await page.goto("/test_11");
  await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-stage", "reading");
  await expect(page.locator("[data-magazine-intro],canvas")).toHaveCount(0);
});

test("runtime reduced motion interrupts both the opening and an active turn", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_11");
  await page.getByRole("button", { name: "Открыть журнал", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  const root = page.getByTestId("magazine-experience");
  await expect(root).toHaveAttribute("data-stage", "reading");
  await expect(page.getByRole("link", { name: /Обсудить поездку/ })).toHaveAttribute("href", "/start");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.keyboard.press("ArrowRight");
  await expect(root).toHaveAttribute("data-turning", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(root).toHaveAttribute("data-turning", "false");
  await page.keyboard.press("ArrowRight");
  await expect(root).toHaveAttribute("data-spread", "3");
  await expect(page.getByRole("link", { name: /архив/i })).toHaveAttribute("href", "/archive");
});

test("resize and unavailable WebGL retain a readable usable publication", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (kind === "webgl" || kind === "webgl2" || kind === "experimental-webgl") return null;
      return original.apply(this, [kind, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto("/test_11");
  await page.getByRole("button", { name: "Открыть журнал", exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 768 });
  await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-stage", "reading");
  await page.getByRole("link", { name: /Подробнее о форматах/ }).click();
  await expect(page).toHaveURL(/\/formats$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("the full-height publication fits desktop sizes and offers the ordinary site below its minimum", async ({ page }) => {
  for (const viewport of [{ width: 1280, height: 768 }, { width: 1440, height: 900 }, { width: 1728, height: 900 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/test_11?spread=1");
    const book = await page.locator("[data-magazine-book]").boundingBox();
    expect(book!.height).toBeGreaterThan(viewport.height * .89);
    expect(book!.y).toBeGreaterThanOrEqual(0);
    expect(book!.y + book!.height).toBeLessThan(viewport.height);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole("link", { name: /Подробнее о форматах/ })).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/test_11");
  await expect(page.getByRole("heading", { name: "Журнал для большого экрана." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Открыть обычную версию ↗" })).toHaveAttribute("href", "/test_8");
  await expect(page.locator("canvas")).toHaveCount(0);
});
