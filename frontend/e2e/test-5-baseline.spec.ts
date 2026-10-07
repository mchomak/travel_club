import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const screenshotDirectory = "test-results/baseline-test-5";

test("isolated copy serves the complete original homepage", async ({ page }) => {
  test.setTimeout(120_000);
  const response = await page.goto("http://localhost:3001/test_5#start");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Куда — важно. С кем — важнее." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Сначала мы просто ездили сами." })).toBeVisible();

  if (process.env.CAPTURE_TEST_5_BASELINE !== "1") return;
  await mkdir(screenshotDirectory, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [label, url] of [
    ["source3000", "http://localhost:3000/test_4"],
    ["source3001", "http://localhost:3001/test_4"],
    ["target3001", "http://localhost:3001/test_5"],
  ]) {
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let offset = 0; offset < height; offset += 800) {
      await page.evaluate(y => window.scrollTo(0, y), offset);
      await page.waitForTimeout(25);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => page.locator("img").evaluateAll(images => images.filter(image => {
      const rect = image.getBoundingClientRect();
      return rect.top < innerHeight && rect.bottom > 0;
    }).every(image => (image as HTMLImageElement).complete))).toBe(true);
    const capture = async (name: string, fullPage = false) => {
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.screenshot({ path: `${screenshotDirectory}/${label}-${name}.png`, fullPage, style: "nextjs-portal { display: none !important; }" });
    };
    await capture("cover");
    await page.evaluate(() => window.scrollTo(0, innerHeight * .38));
    await capture("spread");
    await page.goto(`${url}#start`);
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(() => page.locator("#start").evaluate(e => Math.abs(e.getBoundingClientRect().top))).toBeLessThan(2);
    await capture("start");
    await capture("full", true);
  }
});
