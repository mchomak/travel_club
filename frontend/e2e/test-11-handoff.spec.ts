import { expect, test } from "@playwright/test";
import sharp from "sharp";

test("a destination image that never responds cannot lock magazine navigation", async ({ page }) => {
  test.setTimeout(45000);
  await page.setViewportSize({ width: 1440, height: 900 });
  let requests = 0;
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/test_11/together.webp", async route => {
    requests++;
    await held;
    await route.continue();
  });
  try {
    await page.goto("/test_11?spread=3");
    await page.keyboard.press("ArrowLeft");
    await expect.poll(() => requests).toBeGreaterThan(0);
    const magazine = page.getByTestId("magazine-experience");
    await expect(magazine).toHaveAttribute("data-turning", "true");
    // Keep the actual HTTP response pending through recovery and another turn.
    // A decode stub would miss the browser's real loading/capture deadlock.
    await expect(magazine).toHaveAttribute("data-turning", "false", { timeout: 9000 });
    await expect(magazine).toHaveAttribute("data-spread", "2");
    const destination = page.locator('[data-magazine-book] > [data-magazine-page="right"]');
    await expect(destination).toBeVisible();
    await expect(destination).toContainText("Есть места, которые интереснее открывать вместе.");
    const next = page.getByRole("button", { name: "Next", exact: true });
    await expect(next).toBeEnabled();
    await next.click();
    await expect(magazine).toHaveAttribute("data-spread", "3");
    await expect(magazine).toHaveAttribute("data-turning", "false", { timeout: 9000 });
    await expect(next).toBeEnabled();
  } finally {
    release();
    await page.unrouteAll({ behavior: "wait" });
  }
});

for (const [from, to] of [[1, 2], [2, 1], [2, 3], [3, 2], [3, 4], [4, 3], [4, 5], [5, 4], [5, 6], [6, 5]]) {
test(`the last turning frame and first live spread are visually continuous ${from}→${to}`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    new MutationObserver(() => {
      const root = document.querySelector('[data-testid="magazine-experience"]');
      if (root?.getAttribute("data-turning") !== "false" || !document.querySelector('[data-reading-endpoint]')) return;
      for (const animation of document.querySelector('[data-magazine-book]')!.getAnimations({ subtree: true })) {
        animation.pause(); animation.currentTime = 0;
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-turning"] });
  });
  await page.goto(`/test_11?spread=${from}`);
  await expect(page.locator('[data-magazine-book] > [data-magazine-page]').first()).toHaveAttribute("data-reveal", "enter");
  await page.waitForTimeout(3300);
  await page.evaluate(() => {
    const original = HTMLImageElement.prototype.decode;
    let release!: () => void;
    const blocked = new Promise<void>(resolve => { release = resolve; });
    Object.assign(window, { releaseLiveDecode: release });
    HTMLImageElement.prototype.decode = async function () {
      await original.call(this);
      if (this.closest('[data-magazine-book] > [data-magazine-page]')) await blocked;
    };
  });
  await page.keyboard.press(to > from ? "ArrowRight" : "ArrowLeft");
  const scene = page.locator('[data-reading-turn="webgl"]');
  await expect(scene).toHaveAttribute('data-progress', '1.0000', { timeout: 8000 });
  await expect(page.getByTestId('magazine-experience')).toHaveAttribute('data-turning', 'true');
  const book = page.locator('[data-magazine-book]');
  const box = (await book.boundingBox())!;
  const before = await page.screenshot({ clip: box, path: testInfo.outputPath("last-turn-frame.png") });
  await page.evaluate(() => (window as unknown as { releaseLiveDecode(): void }).releaseLiveDecode());
  await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-turning", "false");
  const after = await page.screenshot({ clip: box, path: testInfo.outputPath("first-live-frame.png") });
  const a = await sharp(before).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const b = await sharp(after).removeAlpha().raw().toBuffer();
  let changed = 0, total = 0;
  // Ignore the spine and the outside edge, where the the navigation controls appear at landing.
  for (let y = 12; y < a.info.height - 12; y++) for (let x = 64; x < a.info.width - 64; x++) {
    if (Math.abs(x - a.info.width / 2) < 24) continue;
    const i = (y * a.info.width + x) * 3;
    if (Math.max(...[0, 1, 2].map(c => Math.abs(a.data[i + c] - b[i + c]))) > 24) changed++;
    total++;
  }
  await testInfo.attach("last-turn-frame", { body: before, contentType: "image/png" });
  await testInfo.attach("first-live-frame", { body: after, contentType: "image/png" });
  await testInfo.attach("pixel-jump", { body: JSON.stringify({ from, to, changedFraction: changed / total }), contentType: "application/json" });
  expect(changed / total, "a landing must not repaint a large part of the spread").toBeLessThan(.03);
});
}

test("the final printed leaf stays visible until the live destination images finish decoding", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/test_11?spread=1');
  await page.waitForTimeout(3300);
  await page.evaluate(() => {
    const original = HTMLImageElement.prototype.decode;
    let release!: () => void;
    const blocked = new Promise<void>(resolve => { release = resolve; });
    Object.assign(window, { releaseLiveDecode: release });
    HTMLImageElement.prototype.decode = async function () {
      await original.call(this);
      if (this.closest('[data-magazine-book] > [data-magazine-page]')) await blocked;
    };
  });
  await page.keyboard.press('ArrowRight');
  const scene = page.locator('[data-reading-turn="webgl"]');
  await expect(scene).toHaveAttribute('data-progress', '1.0000', { timeout: 8000 });
  await page.waitForTimeout(160);
  await expect(scene.locator('canvas')).toBeVisible();
  await expect(page.getByTestId('magazine-experience')).toHaveAttribute('data-turning', 'true');
  await page.evaluate(() => (window as unknown as { releaseLiveDecode(): void }).releaseLiveDecode());
  await expect(scene).toHaveCount(0);
  await expect(page.getByTestId('magazine-experience')).toHaveAttribute('data-turning', 'false');
});

