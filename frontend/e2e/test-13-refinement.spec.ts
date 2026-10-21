import { expect, test } from "@playwright/test";

const pages = '[data-magazine-book] > [data-magazine-page]';
test.use({ viewport: { width: 1440, height: 900 } });

test("destination text and drawn rules stay hidden until handoff", async ({ page }) => {
  await page.goto("/test_13?spread=1");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  const snapshot = await page.waitForFunction(selector => {
    const pending = document.querySelector(selector);
    if (!pending) return null;
    const fixed = pending.querySelector('[data-draw]')!;
    return {
      text: [...pending.querySelectorAll('[data-editorial], [data-text-legacy]')].map(element => ({
        text: element.textContent?.slice(0, 40), opacity: getComputedStyle(element).opacity,
      })),
      fixedOpacity: getComputedStyle(fixed).opacity,
      ruleTransform: getComputedStyle(fixed, "::after").transform,
    };
  }, pages + '[data-reveal="pending"]', { timeout: 15000 });
  const pending = (await snapshot.jsonValue())!;
  expect(pending.text.length).toBeGreaterThan(2);
  expect(pending.text.filter(element => element.opacity !== "0")).toEqual([]);
  expect(pending.fixedOpacity).toBe("1");
  expect(pending.ruleTransform).toBe("matrix(0, 0, 0, 1, 0, 0)");
  await expect(page.locator(pages + '[data-reveal="enter"]')).toHaveCount(2, { timeout: 15000 });
  const heading = page.getByRole("heading", { name: "Василиса", exact: true });
  await expect(heading).toHaveCSS("animation-duration", "1s");
  await expect(heading).toHaveCSS("clip-path", "none", { timeout: 5000 });
});

test("opening button sits close below the closed magazine", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
      if (String(args[0]).startsWith("webgl")) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto("/test_13");
  const cover = await page.locator('[data-magazine-intro] [data-magazine-cover]').boundingBox();
  const button = await page.getByRole("button", { name: "Открыть журнал", exact: true }).boundingBox();
  expect(cover && button).toBeTruthy();
  expect(button!.y - cover!.y - cover!.height).toBeGreaterThan(6);
  expect(button!.y - cover!.y - cover!.height).toBeLessThan(40);
  expect(button!.height).toBeLessThan(60);
  await page.getByRole("button", { name: "Открыть журнал", exact: true }).click();
  await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-stage", "reading");
});

test("chapter buttons grow upward on hover without moving the book or underline", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_13?spread=1");
  const button = page.getByRole("navigation").getByRole("button", { name: "02 О нас", exact: true });
  const before = (await button.boundingBox())!;
  const book = await page.locator('[data-magazine-book]').boundingBox();
  const line = await page.locator('[data-nav-indicator]').boundingBox();
  await button.hover();
  const after = (await button.boundingBox())!;
  expect(after.height - before.height).toBeGreaterThanOrEqual(5);
  expect(after.width).toBe(before.width);
  expect(after.y + after.height).toBeCloseTo(before.y + before.height, 2);
  expect(await page.locator('[data-magazine-book]').boundingBox()).toEqual(book);
  expect(await page.locator('[data-nav-indicator]').boundingBox()).toEqual(line);
  await button.click();
  await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-spread", "2");
});
