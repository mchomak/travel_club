import { expect, test } from "@playwright/test";

test("direct spreads, keyboard turns and browser history share one magazine", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_10?spread=2&source=qa");
  const root = page.getByTestId("magazine-experience");
  await expect(root).toHaveAttribute("data-stage", "reading");
  await expect(root).toHaveAttribute("data-spread", "2");
  await page.keyboard.press("ArrowRight");
  await expect(root).toHaveAttribute("data-spread", "3");
  await expect(root).toHaveAttribute("data-turning", "false");
  await expect(page).toHaveURL(/spread=3&source=qa/);
  await page.goBack();
  await expect(root).toHaveAttribute("data-spread", "2");
  await expect(root).toHaveAttribute("data-stage", "reading");
  await page.goForward();
  await expect(root).toHaveAttribute("data-spread", "3");
  await expect(page.locator('[data-magazine-book] > [data-magazine-page]')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("the natural eight-leaf intro settles on the whole live spread", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const warnings: string[] = [];
  page.on("console", message => { if (message.type() === "warning" && message.text().startsWith("Magazine intro unavailable")) warnings.push(message.text()); });
  await page.goto("/test_10");
  const root = page.getByTestId("magazine-experience");
  await expect(root).toHaveAttribute("data-stage", "reading", { timeout: 25000 });
  expect(warnings).toEqual([]);
  await expect(root).toHaveAttribute("data-intro-result", "target");
  await expect(root).toHaveAttribute("data-intro-phase", "TARGET");
  expect(await root.evaluate(element => {
    const corners = JSON.parse((element as HTMLElement).dataset.introCorners!) as { x: number; y: number }[];
    const rect = element.querySelector("[data-magazine-book]")!.getBoundingClientRect();
    return Math.max(...[[rect.left, rect.top], [rect.right, rect.top], [rect.right, rect.bottom], [rect.left, rect.bottom]].map(([x,y], i) => Math.hypot(x-corners[i].x,y-corners[i].y)));
  })).toBeLessThan(1);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.keyboard.press("ArrowRight");
  await expect(root).toHaveAttribute("data-spread", "2");
  await expect(root).toHaveAttribute("data-stage", "reading");
});

test("a physical page turn lasts 450ms and locks rapid commands", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 768 });
  await page.goto("/test_10?spread=1");
  const root = page.getByTestId("magazine-experience");
  const time = new Date("2026-10-18T09:00:00Z");
  await page.clock.install({ time }); await page.clock.pauseAt(time);
  await page.keyboard.press("ArrowRight");
  await expect(root).toHaveAttribute("data-turning", "true");
  expect(await page.locator('[aria-hidden="true"][inert]').evaluate(element => getComputedStyle(element).animationDuration)).toBe("0.45s");
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowLeft");
  await expect(root).toHaveAttribute("data-spread", "2");
  await page.clock.runFor(449); await expect(root).toHaveAttribute("data-turning", "true");
  await page.clock.runFor(2); await expect(root).toHaveAttribute("data-turning", "false");
  await expect(page.locator('[aria-hidden="true"][inert]')).toHaveCount(0);
  await page.getByRole("button", { name: "Следующий разворот", exact: true }).click();
  await expect(root).toHaveAttribute("data-spread", "3");
});

test("reduced motion, invalid links and contents work without an intro", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_10?spread=bad&spread=3&source=qa");
  const root = page.getByTestId("magazine-experience");
  await expect(page).toHaveURL(/spread=1&source=qa/);
  await expect(root).toHaveAttribute("data-stage", "reading");
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: /03.*Thailand/i }).click();
  await expect(root).toHaveAttribute("data-spread", "3");
  await expect(root).toHaveAttribute("data-turning", "false");
  await expect(page.getByRole("link", { name: /Читать историю/ })).toHaveAttribute("href", "/archive");
});

test("skip and unavailable WebGL retain a usable book", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_10");
  await page.getByRole("button", { name: "Пропустить вступление ↗" }).click();
  await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-stage", "reading");
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (kind === "webgl" || kind === "webgl2" || kind === "experimental-webgl") return null;
      return original.apply(this, [kind, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto("/test_10");
  await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-stage", "reading", { timeout: 20000 });
  await expect(page.getByRole("link", { name: /Обсудить поездку/ })).toHaveAttribute("href", "/start");
});

test("small viewports offer the ordinary site", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/test_10");
  await expect(page.getByRole("heading", { name: "Журнал для большого экрана." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Открыть обычную версию ↗" })).toHaveAttribute("href", "/test_8");
  await expect(page.locator("canvas")).toHaveCount(0);
});
