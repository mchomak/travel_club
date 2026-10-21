import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("the intro camera approaches from 11.5 to 7 before unlocking scroll", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const time = new Date("2026-10-15T09:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.goto("/test_7");
  const root = page.getByTestId("magazine-handoff"), scene = page.getByTestId("magazine-scene");
  await expect(scene).toHaveAttribute("data-phase", "CLOSED", { timeout: 20000 });
  await expect(scene).toHaveAttribute("data-camera-distance", "11.5000");
  const pageWidth = () => root.evaluate(element => {
    const corners = JSON.parse((element as HTMLElement).dataset.pageCorners!) as { x: number }[];
    return corners[1].x - corners[0].x;
  });
  const initialWidth = await pageWidth();
  let previous = 11.5;
  for (const step of [900, 900, 900]) {
    await page.clock.runFor(step);
    const distance = Number(await scene.getAttribute("data-camera-distance"));
    expect(distance).toBeLessThan(previous);
    expect(distance).toBeGreaterThan(7);
    previous = distance;
    await expect(root).toHaveAttribute("data-stage", "opening");
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  }
  await page.clock.runFor(900);
  await expect(root).toHaveAttribute("data-stage", "ready");
  await expect(scene).toHaveAttribute("data-camera-distance", "7.0000");
  expect(await pageWidth()).toBeGreaterThan(initialWidth * 1.4);
  await page.evaluate(() => { scrollTo(0, innerHeight * 1.25); dispatchEvent(new Event("scroll")); });
  await page.clock.runFor(50);
  await expect(root).toHaveAttribute("data-stage", "site");
  await page.evaluate(() => { scrollTo(0, 0); dispatchEvent(new Event("scroll")); });
  await page.clock.runFor(50);
  await expect(root).toHaveAttribute("data-stage", "ready");
  await expect(scene).toHaveAttribute("data-camera-distance", "7.0000");
});

test("the preset opens eight leaves, then scroll turns the live right page into the website", async ({ page }) => {
  await page.goto("/test_7");
  const root = page.getByTestId("magazine-handoff");
  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute("data-stage", "opening");
  await page.mouse.wheel(0, 600);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await expect(root).toHaveAttribute("data-stage", "ready", { timeout: 20000 });
  await expect(page.getByTestId("magazine-scene")).toHaveAttribute("data-leaf-count", "8");
  await expect(page.locator("#hero-title")).toHaveCount(1);
  await page.evaluate(() => scrollTo(0, innerHeight * 1.25));
  await expect(root).toHaveAttribute("data-stage", "site");
  const header = page.locator("header#start");
  expect(Math.abs((await header.boundingBox())!.y)).toBeLessThan(2);
  await expect(page.locator("#hero-title")).toBeVisible();
  await page.evaluate(() => scrollTo(0, 0));
  await expect(root).toHaveAttribute("data-stage", "ready");
  await expect(page.getByTestId("magazine-scene")).toHaveAttribute("data-phase", "TARGET");
});

for (const [width, height] of [[1440, 900], [1280, 720], [768, 1024], [390, 844]]) {
  test(`the live paper stays aligned through focus and native flow at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height });
    await page.goto("/test_7");
    const root = page.getByTestId("magazine-handoff");
    await expect(root).toHaveAttribute("data-stage", "ready", { timeout: 20000 });
    for (const progress of [0, .5, .99]) {
      await page.evaluate(p => scrollTo(0, innerHeight * 1.25 * p), progress);
      await expect.poll(() => root.getAttribute("data-progress").then(value => Math.abs(Number(value) - progress))).toBeLessThan(.002);
      const error = await root.evaluate(element => {
        const surface = element.querySelector<HTMLElement>("[data-page-surface]")!;
        const width = surface.offsetWidth, height = Number((element as HTMLElement).dataset.sourceHeight);
        const expected = JSON.parse((element as HTMLElement).dataset.pageCorners!) as { x: number; y: number }[];
        const matrix = new DOMMatrix(getComputedStyle(surface).transform);
        return Math.max(...[[0, 0], [width, 0], [width, height], [0, height]].map(([x, y], i) => {
          const p = matrix.transformPoint(new DOMPoint(x, y));
          return Math.hypot(p.x / p.w - expected[i].x, p.y / p.w - expected[i].y);
        }));
      });
      // Browsers serialize computed projective coefficients with limited precision.
      expect(error).toBeLessThan(.5);
    }
    // Near the flow boundary the projected header already occupies the native position.
    expect(Math.abs((await page.locator("header#start").boundingBox())!.x)).toBeLessThan(42);
    expect(Math.abs((await page.locator("header#start").boundingBox())!.y)).toBeLessThan(1);
    await page.evaluate(() => scrollTo(0, innerHeight * 1.25));
    await expect(root).toHaveAttribute("data-stage", "site");
    const contact = page.locator('input[name="contact"]');
    await contact.fill("@keep_this_value");
    await page.evaluate(() => scrollTo(0, 0));
    await expect(root).toHaveAttribute("data-stage", "ready");
    await page.evaluate(() => scrollTo(0, innerHeight * 1.25));
    await expect(root).toHaveAttribute("data-stage", "site");
    await expect(contact).toHaveValue("@keep_this_value");
    await expect(page.locator("header#start")).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("the local Docker preset is exactly the supplied root JSON", async () => {
  const source = JSON.parse(await readFile("../test-6-settings.json", "utf8"));
  const runtime = JSON.parse(await readFile("src/components/test_7/preset.json", "utf8"));
  expect(runtime).toEqual(source);
});

test("skip releases the intro and leaves the photo editor and site usable", async ({ page }) => {
  await page.goto("/test_7");
  await page.getByRole("button", { name: "К сайту" }).click();
  await expect(page.getByTestId("magazine-handoff")).toHaveAttribute("data-bypass", "true");
  await expect(page.locator("header#start")).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  await page.locator('[data-photo-slot="hero-table"] img').click({ button: "right" });
  await expect(page.getByRole("menuitem", { name: "Заменить фото", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
});

test("hash entry opens the actual destination without starting WebGL", async ({ page }) => {
  await page.goto("/test_7#story");
  await expect(page.getByTestId("magazine-handoff")).toHaveAttribute("data-bypass", "true");
  await expect(page.locator("#story")).toBeFocused();
  await expect(page.getByTestId("magazine-scene").locator("canvas")).toHaveCount(0);
});

test("reduced motion starts in the site and a changed preference releases an active intro", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_7");
  await expect(page.getByTestId("magazine-handoff")).toHaveAttribute("data-bypass", "true");
  await expect(page.getByTestId("magazine-scene").locator("canvas")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/test_7");
  await expect(page.getByTestId("magazine-handoff")).toHaveAttribute("data-stage", "opening");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByTestId("magazine-handoff")).toHaveAttribute("data-stage", "site");
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("unavailable WebGL releases the document instead of leaving an empty locked intro", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type.startsWith("webgl")) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/test_7");
  await expect(page.getByTestId("magazine-handoff")).toHaveAttribute("data-bypass", "true", { timeout: 20000 });
  await expect(page.locator("header#start")).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});
