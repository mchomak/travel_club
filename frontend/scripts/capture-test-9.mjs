import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const output = new URL("../../docs/qa/test-9/", import.meta.url).pathname.replace(/^\/([A-Z]:)/i, "$1");
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
for (const width of [1440, 390, 768, 1920]) {
  const page = await browser.newPage({ viewport: { width, height: 1080 }, reducedMotion: "reduce" });
  await page.goto(`${base}/test_9?hero=1`);
  for (let id = 1; id <= 20; id++) {
    const number = String(id).padStart(2, "0");
    await page.getByRole("button", { name: `Hero ${number}`, exact: true }).click();
    await page.getByRole("button", { name: "HIDE CONTROLS", exact: true }).click();
    await page.evaluate(() => document.fonts.ready);
    await page.locator("#start").scrollIntoViewIfNeeded();
    await page.evaluate(() => scrollTo(0, 0));
    for (const img of await page.locator("#hero img").all()) {
      await img.evaluate(el => el.decode());
    }
    const height = await page.locator("#hero").evaluate(el => Math.ceil(el.getBoundingClientRect().bottom) + 8);
    await page.screenshot({ path: `${output}/${width}-hero-${number}.png`, fullPage: true, clip: { x: 0, y: 0, width, height },
      style: "button[class*='show'] { visibility: hidden; }" });
    console.log(`${width} / ${number} / ${height}px`);
    await page.getByRole("button", { name: "SHOW CONTROLS", exact: true }).click();
  }
  await page.close();
}
await browser.close();
