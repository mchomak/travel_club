import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const captures = "test-results/test-5-opening-stability/captures";
const continuationEvidence = "test-results/test-5-page-continuation";
const screenshotStyle = "nextjs-portal { display: none !important; }";

async function settle(page: Page, progress: number) {
  const camera = page.locator("[data-animated='true']");
  // scrollTo is pixel rounded by the browser; wait for that new target first.
  await expect.poll(() => camera.evaluate((e, p) => Math.abs(Number((e as HTMLElement).dataset.targetProgress) - p), progress)).toBeLessThan(.002);
  await expect(camera).toHaveAttribute("data-motion", "idle");
}

test("the editorial left surface unfolds with the cover and remains the same page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_5");
  await page.evaluate(() => document.fonts.ready);
  const left = page.getByText("Города разные. Люди — свои.", { exact: true }).locator("..");
  expect(await left.evaluate(e => {
    const heading = e.querySelector("h3")!;
    const r = heading.getBoundingClientRect();
    return heading.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
  })).toBe(false);
  const samples: { x: number; width: number; exposed: boolean }[] = [];
  for (const progress of [.3, .36, .43, .47]) {
    await page.evaluate(p => window.scrollTo(0, innerHeight * 1.25 * p), progress);
    await settle(page, progress);
    samples.push(await left.evaluate(e => {
      const r = e.getBoundingClientRect();
      const heading = e.querySelector("h3")!;
      const h = heading.getBoundingClientRect();
      return { x: r.x, width: r.width, exposed: heading.contains(document.elementFromPoint(h.x + h.width / 2, h.y + h.height / 2)) };
    }));
  }
  // A turning printed surface starts narrow, expands around the spine, and
  // remains exposed when the cover reaches its final flat position.
  expect(samples[0].width).toBeLessThan(samples[3].width * .8);
  expect(samples[1].width).toBeGreaterThan(samples[0].width);
  expect(samples[2].width).toBeGreaterThan(samples[1].width);
  expect(samples[3].exposed).toBe(true);
  await page.evaluate(() => window.scrollTo(0, innerHeight * 1.25 * .3));
  await settle(page, .3);
  expect((await left.boundingBox())!.width).toBeCloseTo(samples[0].width, 0);
  await expect(page.getByText("Города разные. Люди — свои.", { exact: true })).toHaveCount(1);
});

test("native wheel frames keep the live homepage aligned with the right page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_5");
  await page.evaluate(() => document.fonts.ready);
  for (const [progress, wheel] of [[.35, 90], [.65, 60], [.86, 45], [.86, -45], [.65, -60], [.35, -90]]) {
    await page.evaluate(p => window.scrollTo(0, innerHeight * 1.25 * p), progress);
    await settle(page, progress);
    const frames = page.evaluate(async () => {
      const right = document.querySelector<HTMLElement>("[class*='rightPage']")!;
      const header = document.querySelector<HTMLElement>("#start")!;
      const samples: { scroll: number; gap: number }[] = [];
      for (let frame = 0; frame < 24; frame++) {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        samples.push({ scroll: scrollY, gap: header.getBoundingClientRect().top - right.getBoundingClientRect().top });
      }
      return samples;
    });
    await page.mouse.wheel(0, wheel);
    const samples = await frames;
    // These are rendered rectangles during real wheel/compositor frames, including
    // the first scroll frame, rather than only the camera's eventual settled state.
    expect(Math.max(...samples.map(sample => sample.scroll)) - Math.min(...samples.map(sample => sample.scroll))).toBeGreaterThan(10);
    expect(Math.max(...samples.map(sample => Math.abs(sample.gap)))).toBeLessThan(2);
  }
});

test("the open right page contains the actual complete hero instead of a China panel", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_5");
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, innerHeight * 1.25 * .47));
  const camera = page.locator("[data-animated='true']");
  await settle(page, .47);
  await expect.poll(() => camera.evaluate(e => Number(getComputedStyle(e).getPropertyValue("--open")))).toBe(1);
  await expect(page.locator("[class*='chinaPanel']")).toHaveCount(0);
  await expect(page.locator("#hero-title")).toHaveText("Куда — важно.С кем — важнее.");
  const hero = page.locator("#main > section").first();
  await expect(hero.locator("p").first()).toContainText("путешествия");
  const image = hero.locator("[data-photo-slot='hero-table']");
  const imageBox = (await image.boundingBox())!;
  expect(imageBox.x).toBeGreaterThan(700);
  expect(imageBox.y).toBeGreaterThan(100);
  expect(imageBox.y + imageBox.height).toBeLessThan(780);
  expect(await image.evaluate(e => {
    // The preview is deliberately inert; temporarily enable hit testing to check
    // the real photograph is painted rather than covered by an opening layer.
    const site = e.closest<HTMLElement>("[inert]")!;
    site.inert = false;
    const r = e.getBoundingClientRect();
    const exposed = e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    site.inert = true;
    return exposed;
  })).toBe(true);
  await expect(page.locator("#hero-title")).toHaveCount(1);
});

test("the closed cover grows responsively and stays within safe viewport margins", async ({ page }) => {
  for (const [width, height] of [[1920, 1080], [1440, 900], [1280, 720], [1050, 700], [768, 1024], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto("/test_5");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("[data-animated='true']")).toHaveAttribute("data-motion", "idle");
    const geometry = await page.locator("[data-opening-cover]").evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width, height: rect.height, scrollWidth: document.documentElement.scrollWidth };
    });
    const minimumWidthRatio = width <= 760 ? .8 : width >= 1900 ? .3 : .4;
    expect(geometry.left).toBeGreaterThanOrEqual(-1);
    expect(geometry.right).toBeLessThanOrEqual(width + 1);
    expect(geometry.width / width).toBeGreaterThanOrEqual(minimumWidthRatio);
    expect(geometry.height / height).toBeGreaterThanOrEqual(.6);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(width);
    if (width === 1440 || width === 390) {
      await mkdir(continuationEvidence, { recursive: true });
      await page.screenshot({ path: `${continuationEvidence}/${width}-closed-cover.png`, style: screenshotStyle });
    }
  }
});

test("the open right page uses the full paper width and continues through the real site", async ({ page }) => {
  for (const [width, height] of [[1920, 1080], [1440, 900], [1280, 720], [1050, 700]]) {
    await page.setViewportSize({ width, height });
    await page.goto("/test_5");
    await page.evaluate(() => document.fonts.ready);
    const camera = page.locator("[data-animated='true']");
    await page.evaluate(() => window.scrollTo({ top: innerHeight * 1.25 * .47, behavior: "instant" }));
    await expect.poll(() => camera.evaluate(e => Math.abs(Number((e as HTMLElement).dataset.targetProgress) - .47))).toBeLessThan(.002);
    await expect(camera).toHaveAttribute("data-motion", "idle");

    const contents = page.locator('aside[aria-label="Содержание выпуска"]');
    const formats = page.locator("#formats");
    await expect(contents).toHaveCount(1);
    await expect(formats.locator("a[data-format]")).toHaveCount(3);
    await expect(page.locator("#story form")).toHaveCount(1);
    await expect(page.locator("#hero-title")).toHaveCount(1);

    const geometry = await page.evaluate(() => {
      const paper = document.querySelector<HTMLElement>("[data-opening-page]")!;
      const surface = document.querySelector<HTMLElement>("[data-opening-surface]")!;
      const hero = document.querySelector<HTMLElement>("[data-page-hero]")!;
      const contents = document.querySelector<HTMLElement>("aside")!;
      const formats = document.querySelector<HTMLElement>("#formats")!;
      const targets = [
        hero.querySelector("#hero-title")!,
        hero.querySelector<HTMLElement>('[data-photo-slot="hero-table"]')!,
        contents.querySelector("h2")!,
        formats.querySelector<HTMLElement>("a[data-format]")!,
      ];
      const rect = (element: Element) => {
        const box = element.getBoundingClientRect();
        return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
      };
      const paperBox = rect(paper);
      const contentsBox = rect(contents);
      const formatsBox = rect(formats);
      const surfaceBox = rect(surface);
      const surfaceStyle = getComputedStyle(surface);
      const scale = Number(surfaceStyle.getPropertyValue("--site-scale"));
      const clipLeft = Number.parseFloat(surfaceStyle.getPropertyValue("--clip-left"));
      const clipRight = Number.parseFloat(surfaceStyle.getPropertyValue("--clip-right"));
      const visibleSurface = {
        left: surfaceBox.left + clipLeft * scale,
        width: surfaceBox.width - (clipLeft + clipRight) * scale,
      };
      const visibleTargets = targets.filter(element => {
        const box = element.getBoundingClientRect();
        const x = box.left + box.width / 2, y = box.top + box.height / 2;
        return x >= paperBox.left && x <= paperBox.right && y >= paperBox.top && y <= paperBox.bottom;
      });
      const site = surface.parentElement!;
      site.inert = false;
      const hits = visibleTargets.map(element => {
        const box = element.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return Boolean(hit && element.contains(hit));
      });
      site.inert = true;
      return {
        paper: paperBox,
        surface: visibleSurface,
        hero: rect(hero),
        contentWidth: Math.max(contentsBox.right, formatsBox.right) - Math.min(contentsBox.left, formatsBox.left),
        compositionBottom: Math.max(contentsBox.bottom, formatsBox.bottom),
        hits,
      };
    });
    const paperInnerWidth = geometry.paper.width - 56;
    const compositionGap = geometry.paper.bottom - Math.min(geometry.compositionBottom, geometry.paper.bottom);
    const leftSurfaceGap = geometry.surface.left - geometry.paper.left;
    const rightSurfaceGap = geometry.paper.right - (geometry.surface.left + geometry.surface.width);
    expect(leftSurfaceGap).toBeGreaterThanOrEqual(-1);
    expect(leftSurfaceGap).toBeLessThanOrEqual(geometry.paper.width * .04);
    expect(rightSurfaceGap).toBeGreaterThanOrEqual(-1);
    expect(rightSurfaceGap).toBeLessThanOrEqual(geometry.paper.width * .04);
    expect(geometry.surface.width / geometry.paper.width, `${width}px surface should fill its paper: ${JSON.stringify(geometry)}`).toBeGreaterThanOrEqual(.9);
    expect(geometry.contentWidth / paperInnerWidth).toBeGreaterThanOrEqual(.88);
    const minimumPageMargin = 8;
    expect(geometry.hero.left - geometry.paper.left).toBeGreaterThanOrEqual(minimumPageMargin);
    expect(geometry.paper.right - geometry.hero.right).toBeGreaterThanOrEqual(minimumPageMargin);
    expect(geometry.hero.top).toBeGreaterThanOrEqual(geometry.paper.top);
    expect(geometry.hero.bottom).toBeLessThan(geometry.paper.bottom);
    expect(compositionGap).toBeLessThanOrEqual(geometry.paper.height * .05);
    expect(geometry.hits).toHaveLength(4);
    expect(geometry.hits.every(Boolean)).toBe(true);

    if ([1920, 1440, 1280].includes(width)) {
      await mkdir(continuationEvidence, { recursive: true });
      await page.screenshot({ path: `${continuationEvidence}/${width}-open-spread.png`, style: screenshotStyle });
    }

    for (const progress of [.61, .82]) {
      await page.evaluate(value => window.scrollTo({ top: innerHeight * 1.25 * value, behavior: "instant" }), progress);
      await settle(page, progress);
      const alignment = await page.evaluate(() => {
        const paper = document.querySelector<HTMLElement>("[data-opening-page]")!;
        const surface = document.querySelector<HTMLElement>("[data-opening-surface]")!;
        const paperBox = paper.getBoundingClientRect();
        const surfaceBox = surface.getBoundingClientRect();
        const styles = getComputedStyle(surface);
        const scale = Number(styles.getPropertyValue("--site-scale"));
        const left = surfaceBox.left + Number.parseFloat(styles.getPropertyValue("--clip-left")) * scale;
        const right = surfaceBox.right - Number.parseFloat(styles.getPropertyValue("--clip-right")) * scale;
        const bottom = surfaceBox.top + Math.min(Number.parseFloat(styles.getPropertyValue("--clip-height")), surface.offsetHeight) * scale;
        return {
          leftDelta: left - paperBox.left,
          widthDelta: right - left - paperBox.width,
          bottomDelta: bottom - paperBox.bottom,
        };
      });
      expect(Math.abs(alignment.leftDelta), `${width}px left page edge at progress ${progress}: ${JSON.stringify(alignment)}`).toBeLessThan(1);
      expect(Math.abs(alignment.widthDelta), `${width}px page width at progress ${progress}: ${JSON.stringify(alignment)}`).toBeLessThan(1);
      expect(Math.abs(alignment.bottomDelta), `${width}px lower page edge at progress ${progress}: ${JSON.stringify(alignment)}`).toBeLessThan(1);
    }
  }
});

test("the camera eases across multiple frames, settles at rest and releases native flow at the boundary", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_5");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("[data-animated='true']")).toHaveAttribute("data-motion", "idle");
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const scales = await page.evaluate(async () => {
    const site = document.querySelector<HTMLElement>("#top")!.parentElement!;
    window.scrollTo(0, innerHeight * 1.25 * .8);
    const samples: number[] = [];
    for (let i = 0; i < 6; i++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      samples.push(new DOMMatrix(getComputedStyle(site).transform).a);
    }
    return samples;
  });
  expect(new Set(scales).size).toBeGreaterThan(2);
  expect(scales.every((scale, index) => index === 0 || scale >= scales[index - 1])).toBe(true);
  const camera = page.locator("[data-animated='true']");
  await expect(camera).toHaveAttribute("data-motion", "idle");
  await expect.poll(() => camera.evaluate(e => Math.abs(Number((e as HTMLElement).dataset.targetProgress) - Number((e as HTMLElement).dataset.renderedProgress)))).toBeLessThan(.0001);
  const still = await page.locator("#top").evaluate(e => getComputedStyle(e.parentElement!).transform);
  expect(still).not.toBe("none");
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await page.locator("#top").evaluate(e => getComputedStyle(e.parentElement!).transform)).toBe(still);
  await page.mouse.wheel(0, 700);
  await expect(camera).toHaveAttribute("data-complete", "true");
  await expect.poll(() => page.locator("#start").evaluate(e => e.getBoundingClientRect().top)).toBeLessThan(-100);
});

test("the live homepage masthead grows from the right page and continues into native scroll", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_5");
  await page.evaluate(() => window.scrollTo(0, innerHeight * 1.25 * .5));
  const masthead = page.locator("#top").getByText("TRAVEL CLUB", { exact: true }).first();
  await expect.poll(async () => (await masthead.boundingBox())!.y).toBeLessThan(450);
  expect((await masthead.boundingBox())!.x).toBeGreaterThan(600);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await page.evaluate(() => window.scrollTo(0, innerHeight * 1.25));
  await expect.poll(() => page.locator("#start").evaluate(e => Math.abs(e.getBoundingClientRect().top))).toBeLessThan(2);
  await page.evaluate(() => window.scrollBy(0, 120));
  await expect.poll(async () => (await page.locator("#start").boundingBox())!.y).toBeLessThan(-110);
});

for (const viewport of [{ width: 1920, height: 1080 }, { width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 667, height: 375 }]) {
  test(`camera lifecycle and visual stages at ${viewport.width}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await mkdir(captures, { recursive: true });
    await page.setViewportSize(viewport);
    await page.goto("/test_5");
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(() => page.locator("[data-photo-slot='hero-table'] img").evaluate(e => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0)).toBe(true);
    const capture = async (name: string, progress: number) => {
      await settle(page, progress);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.screenshot({ path: `${captures}/${viewport.width}-${name}.png`, style: screenshotStyle });
    };
    for (const [name, progress] of [["cover", 0], ["opening-early", .23], ["opening", .3], ["opening-late", .36], ["open", .43], ["spread", .47], ["focus", .65], ["merge", .8], ["late-merge", .93], ["hero", 1]] as const) {
      await page.evaluate(p => window.scrollTo(0, innerHeight * 1.25 * p), progress);
      await capture(name, progress);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await expect.poll(() => page.locator("#start").evaluate(e => Math.abs(e.getBoundingClientRect().top))).toBeLessThan(2);
    await page.evaluate(() => window.scrollTo(0, innerHeight * 3));
    await page.evaluate(() => window.scrollTo(0, innerHeight * 1.25 * .65));
    await capture("reverse-focus", .65);
    await page.evaluate(() => window.scrollTo(0, 0));
    await capture("reverse-cover", 0);
    await page.reload();
    await expect(page.getByRole("heading", { name: "TRAVEL CLUB", exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("deep link, keyboard navigation and reduced motion open the source homepage directly", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_4#start");
  await page.evaluate(() => document.fonts.ready);
  const original = await page.screenshot({ style: screenshotStyle });
  await page.goto("/test_5#start");
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.locator("#start").evaluate(e => Math.abs(e.getBoundingClientRect().top))).toBeLessThan(2);
  expect(await page.screenshot({ style: screenshotStyle })).toEqual(original);
  await page.locator("#start").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Travel Club — начало страницы" })).toBeFocused();
  await expect(page.getByRole("banner").getByRole("link", { name: "Начать историю" })).toHaveAttribute("href", "/start");
  await page.locator("#story").scrollIntoViewIfNeeded();
  await page.getByRole("textbox", { name: /Ваш контакт/ }).fill("@retained_camera_state");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.getByRole("textbox", { name: /Ваш контакт/ })).toHaveValue("@retained_camera_state");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_5");
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await expect(page.getByRole("heading", { name: "Куда — важно. С кем — важнее." })).toBeVisible();
  expect(await page.locator("#start").evaluate(e => e.getBoundingClientRect().top)).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.getByRole("heading", { name: "TRAVEL CLUB", exact: true })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("heading", { name: "Куда — важно. С кем — важнее." })).toBeVisible();
});

test("resize, restoration, slow reverse and skip preserve a usable single homepage", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_5");
  for (let step = 0; step <= 20; step++) {
    await page.evaluate(p => window.scrollTo(0, innerHeight * 1.25 * p), step / 20);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  }
  await page.locator("#story").scrollIntoViewIfNeeded();
  await page.getByRole("textbox", { name: /Ваш контакт/ }).fill("@keep_after_reverse");
  await page.evaluate(() => { history.replaceState(null, "", "/test_5"); window.scrollTo(0, innerHeight * .8); });
  await page.setViewportSize({ width: 1280, height: 720 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("textbox", { name: /Ваш контакт/ })).toHaveValue("@keep_after_reverse");
  await page.reload();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500);
  for (let step = 15; step >= 0; step--) {
    await page.evaluate(p => window.scrollTo(0, innerHeight * 1.25 * p), step / 20);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  }
  const skip = page.getByRole("link", { name: "К сайту" });
  await skip.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#start$/);
  await expect.poll(() => page.locator("#start").evaluate(e => Math.abs(e.getBoundingClientRect().top))).toBeLessThan(2);
  await expect(page.locator("#start")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Travel Club — начало страницы" })).toBeFocused();
});

test("fast wheel settles into native scrolling and reverses without a second hero", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_5");
  await page.mouse.wheel(0, 1250);
  await expect.poll(async () => (await page.locator("#start").boundingBox())!.y).toBeLessThan(-100);
  await expect(page.getByRole("heading", { name: "Куда — важно. С кем — важнее." })).toBeVisible();
  await page.mouse.wheel(0, -1250);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.getByRole("heading", { name: "TRAVEL CLUB", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("without JavaScript the original homepage and skip remain accessible", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto("/test_5", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "К сайту" }).click();
  await expect(page).toHaveURL(/#start$/);
  await expect(page.getByRole("region", { name: "TRAVEL CLUB", exact: true })).toBeHidden();
  await expect(page.getByRole("heading", { name: "Куда — важно. С кем — важнее." })).toBeVisible();
  await expect.poll(() => page.locator("#start").evaluate(e => Math.abs(e.getBoundingClientRect().top))).toBeLessThan(2);
  await page.goto("/test_5#start", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("region", { name: "TRAVEL CLUB", exact: true })).toBeHidden();
  await expect(page.getByRole("heading", { name: "Куда — важно. С кем — важнее." })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.locator("img").evaluateAll(images => images.filter(image => {
    const rect = image.getBoundingClientRect();
    return rect.top < innerHeight && rect.bottom > 0;
  }).every(image => (image as HTMLImageElement).complete))).toBe(true);
  await mkdir(captures, { recursive: true });
  await page.screenshot({ path: `${captures}/nojs-direct-start.png`, style: screenshotStyle });
  await context.close();
});
