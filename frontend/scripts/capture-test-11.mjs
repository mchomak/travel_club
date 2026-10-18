import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const output = new URL("../../docs/qa/test-11/", import.meta.url);
const sizes = [
  { width: 1280, height: 768 },
  { width: 1440, height: 900 },
  { width: 1728, height: 900 },
  { width: 1920, height: 1080 },
];
const names = ["hero-formats", "next-issue", "thailand"];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const captures = [];
try {
  for (const viewport of sizes) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    const warnings = [];
    page.on("console", message => {
      if (["error", "warning"].includes(message.type())) warnings.push(message.text());
    });
    page.on("pageerror", error => warnings.push(`PAGE ERROR: ${error.message}`));
    async function settle() {
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(Array.from(document.images, image => image.decode()));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== "running"));
    }
    async function capture(name) {
      await settle();
      const filename = `${name}-${viewport.width}x${viewport.height}.png`;
      const metrics = await page.evaluate(() => {
        const book = document.querySelector("[data-magazine-book]").getBoundingClientRect();
        return {
          stage: document.querySelector("[data-stage]").getAttribute("data-stage"),
          book: { x: book.x, y: book.y, width: book.width, height: book.height },
          pageOverflow: Array.from(document.querySelectorAll("[data-magazine-book] > [data-magazine-page]"), page => ({ side: page.getAttribute("data-magazine-page"), horizontal: page.scrollWidth - page.clientWidth, vertical: page.scrollHeight - page.clientHeight })),
          documentOverflow: { horizontal: document.documentElement.scrollWidth - innerWidth, vertical: document.documentElement.scrollHeight - innerHeight },
          brokenImages: Array.from(document.images).filter(image => !image.complete || image.naturalWidth === 0).map(image => image.src),
          runningAnimations: document.getAnimations().filter(animation => animation.playState === "running").length,
          canvases: document.querySelectorAll("canvas").length,
        };
      });
      await page.screenshot({ path: fileURLToPath(new URL(filename, output)) });
      captures.push({ filename, viewport, ...metrics, warnings: [...new Set(warnings)] });
    }
    for (let spread = 1; spread <= 3; spread++) {
      await page.goto(`${baseURL}/test_11?spread=${spread}`);
      await page.locator('[data-stage="reading"][data-turning="false"]').waitFor();
      await capture(names[spread - 1]);
    }
    if (viewport.width === 1440 || viewport.width === 1920) {
      await page.getByRole("button", { name: "Обложка", exact: true }).click();
      await page.locator("[data-magazine-cover]").waitFor();
      await capture("cover");
    }
    await page.close();
  }
  await writeFile(new URL("capture-results.json", output), JSON.stringify({ generatedAt: new Date().toISOString(), baseURL, browser: browser.version(), captures }, null, 2) + "\n");
  console.log(`Saved ${captures.length} final screenshots to ${fileURLToPath(output)} (${baseURL}).`);
} finally {
  await browser.close();
}
