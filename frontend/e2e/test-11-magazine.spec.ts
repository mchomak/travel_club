import { expect, test } from "@playwright/test";

test("the distant cover waits indefinitely for background activation", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_11");
  await page.waitForTimeout(4500);
  const root = page.getByTestId("magazine-experience");
  await expect(root).toHaveAttribute("data-stage", "opening");
  const scene = page.getByTestId("magazine-intro-scene");
  await expect(scene).toHaveAttribute("data-ready", "true");
  const idleFrames = await scene.getAttribute("data-frames");
  await page.waitForTimeout(250);
  await expect(scene).toHaveAttribute("data-frames", idleFrames!);
  await page.evaluate(() => {
    const errors: number[] = [];
    Object.assign(window, { projectionErrors: errors });
    const sample = () => {
      const book = document.querySelector<HTMLElement>('[data-magazine-book]')!;
      const root = book.closest<HTMLElement>('main')!;
      if (book.style.position === 'fixed' && book.style.visibility === 'visible') {
        const corners = JSON.parse(root.dataset.introCorners!) as { x: number; y: number }[];
        const xs = corners.map(point => point.x), ys = corners.map(point => point.y);
        const rect = book.getBoundingClientRect();
        errors.push(Math.max(Math.abs(rect.left - Math.min(...xs)), Math.abs(rect.right - Math.max(...xs)), Math.abs(rect.top - Math.min(...ys)), Math.abs(rect.bottom - Math.max(...ys))));
      }
      if (root.dataset.stage !== 'reading') requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.getByRole("button", { name: "Открыть журнал", exact: true }).click({ position: { x: 20, y: 20 } });
  await expect(scene).toHaveAttribute("data-leaf-count", "8");
  await expect(scene).toHaveAttribute("data-phase", /OPENING|FLIP_[1-8]|SPREAD_[1-8]/);
  await expect(root).toHaveAttribute("data-stage", "reading", { timeout: 15000 });
  await expect(root).toHaveAttribute("data-intro-result", "target");
  await expect(root).toHaveAttribute("data-spread", "1");
  await expect(page.locator("canvas,[data-magazine-intro]")).toHaveCount(0);
  const errors = await page.evaluate(() => (window as unknown as { projectionErrors: number[] }).projectionErrors);
  await testInfo.attach('projected-spread-errors', { body: JSON.stringify(errors), contentType: 'application/json' });
  expect(errors.length).toBeGreaterThan(0);
  expect(Math.max(...errors)).toBeLessThan(1);
});

test("an early cover click survives asset loading and reduced navigation stays visible after preference restores", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let release!: () => void;
  const blocked = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/test_11/coast.webp', async route => { await blocked; await route.continue(); });
  await page.goto('/test_11', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Открыть журнал', exact: true }).click();
  await expect(page.getByTestId('magazine-experience')).toHaveAttribute('data-stage', 'opening');
  release();
  await expect(page.getByTestId('magazine-experience')).toHaveAttribute('data-stage', 'reading', { timeout: 15000 });
  await expect(page.getByTestId('magazine-experience')).toHaveAttribute('data-intro-result', 'target');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.keyboard.press('ArrowRight');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  expect(await page.locator('[data-magazine-book] > [data-magazine-page]').evaluateAll(pages => pages.every(page => page.getAttribute('data-reveal') !== 'pending'))).toBe(true);
});

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
  await page.getByRole("button", { name: "Открыть журнал", exact: true }).click();
  await page.getByRole("button", { name: "Пропустить вступление ↗" }).click();
  await expect(page.locator("[data-magazine-book]")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-spread", "2");
});

test("reading turns use a curved textured leaf for a full second in both directions", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_11?spread=1");
  const root = page.getByTestId("magazine-experience");
  await page.waitForTimeout(3300);
  const time = new Date("2026-10-19T09:00:00Z");
  await page.clock.install({ time }); await page.clock.pauseAt(time);
  for (const direction of ["ArrowRight", "ArrowLeft"]) {
    await page.keyboard.press(direction);
    const scene = page.locator('[data-reading-turn="webgl"]');
    await expect(scene).toBeVisible();
    await expect(scene).toHaveAttribute("data-front", direction === "ArrowRight" ? "1:right" : "2:left");
    await expect(scene).toHaveAttribute("data-back", direction === "ArrowRight" ? "2:left" : "1:right");
    const initialGeometry = JSON.parse((await scene.getAttribute("data-geometry"))!);
    expect(initialGeometry.curvature).toBeLessThan(.001);
    await page.clock.runFor(420);
    expect(Number(await scene.getAttribute("data-progress"))).toBeGreaterThan(.3);
    const geometry = JSON.parse((await scene.getAttribute("data-geometry"))!);
    expect(geometry.curvature).toBeGreaterThan(.1);
    expect(geometry.spineError).toBeLessThan(.001);
    expect(geometry.vertexCount).toBeGreaterThan(1000);
    const pixels = JSON.parse((await scene.getAttribute("data-texture-colors"))!);
    expect(pixels.front).not.toEqual(pixels.back);
    await testInfo.attach(`curved-${direction}`, { body: await page.screenshot({ path: testInfo.outputPath(`curved-${direction}.png`) }), contentType: "image/png" });
    await expect(root).toHaveAttribute("data-turning", "true");
    await page.keyboard.press(direction);
    await page.clock.runFor(575);
    await expect(root).toHaveAttribute("data-turning", "true");
    await page.clock.runFor(30);
    await expect(root).toHaveAttribute("data-turning", "false", { timeout: 5000 });
    await expect(root).toHaveAttribute("data-spread", direction === "ArrowRight" ? "2" : "1");
    await expect(page.locator("canvas,[data-reading-turn]")).toHaveCount(0);
    const landing = JSON.parse((await root.getAttribute("data-reading-endpoint"))!);
    expect(landing.error).toBeLessThan(1);
    expect(landing.curvature).toBeLessThan(.001);
    await expect(page.locator('[data-magazine-book] > [data-magazine-page]')).toHaveCount(2);
    await page.clock.runFor(3300);
  }
});

test("Back interrupts a turn without leaving a lock or stale article", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_11?spread=1&source=qa");
  await expect(page.locator('[data-magazine-book] > [data-magazine-page]').first()).toHaveAttribute("data-reveal", "enter");
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
  await expect(page.getByRole("button", { name: "Открыть журнал", exact: true })).toBeVisible();
  const coverBox = await cover.boundingBox();
  expect(coverBox!.height).toBeLessThan(520);
  await page.getByRole("button", { name: "Открыть журнал", exact: true }).click();
  await expect(page.getByRole("link", { name: /Обсудить поездку/ })).toHaveCount(0);
  await expect(root).toHaveAttribute("data-stage", "reading", { timeout: 10000 });
  await expect(root).toHaveAttribute("data-intro-result", "target");
  await expect(page.locator("[data-magazine-intro]")).toHaveCount(0);
  await page.getByRole("button", { name: /03.*Thailand/i }).click();
  await expect(root).toHaveAttribute("data-turning", "false");
  await page.getByRole("button", { name: "Обложка", exact: true }).click();
  await expect(page.getByRole("button", { name: "Открыть журнал", exact: true })).toBeFocused();
  await page.waitForTimeout(1800);
  await expect(root).toHaveAttribute("data-stage", "opening");
  await page.keyboard.press("Enter");
  await expect(root).toHaveAttribute("data-stage", "reading");
  await expect(root).toHaveAttribute("data-spread", "3");
  await expect(page.locator("[data-magazine-book]")).toBeFocused();
  await expect(page.getByRole("link", { name: /архив/i })).toHaveAttribute("href", "/archive");
  await page.waitForTimeout(3400);
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
  await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-stage", "opening");
  await page.getByRole("button", { name: "Открыть журнал", exact: true }).click();
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


test("all six direct chapters and history retain their real two-page content", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 768 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (let spread = 1; spread <= 6; spread++) {
    await page.goto(`/test_11?spread=${spread}&source=complete`);
    const root = page.getByTestId("magazine-experience");
    await expect(root).toHaveAttribute("data-spread", String(spread));
    await expect(page.getByRole("status")).toContainText(`6.`);
    await expect(page.locator('[data-magazine-book] > [data-magazine-page]')).toHaveCount(2);
    const titles = ["Hero + Formats", "Next Issue", "Thailand \u201926", "China \u201926", "Archive \u201925", "Point of View + Start"];
    await expect(page.getByRole("button", { name: `0${spread} ${titles[spread - 1]}`, exact: true })).toHaveAttribute("aria-current", "page");
  }
  await expect(page.locator('[data-magazine-book] a[href="/start"]').first()).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/spread=5&source=complete/);
  await page.goBack(); await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-spread", "6");
  await page.goForward(); await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-spread", "5");
});


test("capture keeps the source stable, hidden time pauses the mesh, context loss and resize release navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_11?spread=1"); await page.waitForTimeout(3300);
  const root = page.getByTestId("magazine-experience"), right = page.locator('[data-magazine-book] > [data-magazine-page="right"]');
  const source = await right.innerText();
  let release!: () => void;
  const blocked = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/test/fonts/golos-text-latin.woff2", async route => { await blocked; await route.continue(); });
  const time = new Date("2026-10-19T11:00:00Z"); await page.clock.install({ time }); await page.clock.pauseAt(time);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-reading-turn="preparing"]')).toHaveCount(1);
  expect(await right.innerText()).toBe(source);
  await page.keyboard.press("ArrowRight");
  await expect(root).toHaveAttribute("data-spread", "2");
  release();
  const scene = page.locator('[data-reading-turn="webgl"]'); await expect(scene).toHaveCount(1);
  await page.clock.runFor(350);
  const before = Number(await scene.getAttribute("data-progress"));
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { value: true, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await page.clock.runFor(1500);
  expect(Number(await scene.getAttribute("data-progress"))).toBe(before);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { value: false, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await page.clock.runFor(120);
  expect(Number(await scene.getAttribute("data-progress"))).toBeGreaterThan(before);
  await scene.locator("canvas").evaluate(canvas => canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
  await expect(root).toHaveAttribute("data-turning", "false"); await expect(page.locator("canvas")).toHaveCount(0);
  await page.keyboard.press("ArrowRight"); await expect(root).toHaveAttribute("data-turning", "true");
  await page.setViewportSize({ width: 1280, height: 768 });
  await expect(root).toHaveAttribute("data-turning", "false"); await expect(root).toHaveAttribute("data-spread", "3");
  await expect(page.locator("canvas,[data-reading-turn]")).toHaveCount(0);
  await page.keyboard.press("ArrowRight"); await expect(root).toHaveAttribute("data-spread", "4");
  await page.goto("/formats"); await expect(page.locator("canvas")).toHaveCount(0);
});

test("unavailable GPU uses a finite CSS leaf whose hidden time is paused", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (kind.includes("webgl")) return null;
      return original.apply(this, [kind, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto("/test_11?spread=1");
  await expect(page.locator('[data-magazine-book] > [data-magazine-page]').first()).toHaveAttribute("data-reveal", "enter");
  await page.keyboard.press("ArrowRight");
  const host = page.locator('[data-reading-turn="fallback"]'); await expect(host).toHaveCount(1);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { value: true, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
  const leaf = page.locator('[data-reading-turn="fallback"] + div');
  expect(await leaf.evaluate(element => getComputedStyle(element).animationPlayState)).toBe("paused");
  expect(await leaf.locator(":scope > div").first().evaluate(element => getComputedStyle(element, "::after").animationPlayState)).toBe("paused");
  await page.waitForTimeout(1200); await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-turning", "true");
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { value: false, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-turning", "false");
  await expect(page.locator("canvas,[data-reading-turn]")).toHaveCount(0);
});
