import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const output = process.env.TEST_11_CAPTURE_DIR
  ? new URL(`file:///${process.env.TEST_11_CAPTURE_DIR.replaceAll("\\", "/").replace(/\/$/, "")}/`)
  : new URL("../../docs/qa/test-11/", import.meta.url);
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
    async function capture(name, final = true) {
      if (final) await settle();
      const filename = `${name}-${viewport.width}x${viewport.height}.png`;
      const metrics = await page.evaluate(() => {
        const book = document.querySelector("[data-magazine-book]").getBoundingClientRect();
        const root = document.querySelector("[data-stage]");
        const scene = document.querySelector('[data-testid="magazine-intro-scene"]');
        return {
          stage: root.getAttribute("data-stage"),
          spread: root.getAttribute("data-spread"),
          introPhase: root.getAttribute("data-intro-phase"),
          introResult: root.getAttribute("data-intro-result"),
          leafCount: scene?.getAttribute("data-leaf-count") ?? null,
          cover: (() => { const box = document.querySelector("[data-magazine-cover]")?.getBoundingClientRect(); return box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null; })(),
          book: { x: book.x, y: book.y, width: book.width, height: book.height },
          pageOverflow: Array.from(document.querySelectorAll("[data-magazine-book] > [data-magazine-page]"), page => ({ side: page.getAttribute("data-magazine-page"), horizontal: page.scrollWidth - page.clientWidth, vertical: page.scrollHeight - page.clientHeight })),
          pageTextBounds: Array.from(document.querySelectorAll("[data-magazine-book] > [data-magazine-page]"), page => {
            const bounds = page.getBoundingClientRect(), violations = [];
            let minTextPx = Infinity;
            const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
              const node = walker.currentNode;
              if (!node.textContent?.trim()) continue;
              const style = getComputedStyle(node.parentElement);
              if (style.display === "none" || style.visibility === "hidden") continue;
              minTextPx = Math.min(minTextPx, parseFloat(style.fontSize));
              const range = document.createRange(); range.selectNodeContents(node);
              if (Array.from(range.getClientRects()).some(rect => rect.width && rect.height && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1))) violations.push(node.textContent.trim());
            }
            return { side: page.getAttribute("data-magazine-page"), minTextPx, violations };
          }),
          documentOverflow: { horizontal: document.documentElement.scrollWidth - innerWidth, vertical: document.documentElement.scrollHeight - innerHeight },
          brokenImages: Array.from(document.images).filter(image => !image.complete || image.naturalWidth === 0).map(image => image.src),
          runningAnimations: document.getAnimations().filter(animation => animation.playState === "running").length,
          canvases: document.querySelectorAll("canvas").length,
        };
      });
      await page.screenshot({ path: fileURLToPath(new URL(filename, output)) });
      captures.push({ filename, viewport, final, ...metrics, warnings: [...new Set(warnings)] });
    }
    for (let spread = 1; spread <= 3; spread++) {
      await page.goto(`${baseURL}/test_11?spread=${spread}`);
      await page.locator('[data-stage="reading"][data-turning="false"]').waitFor();
      await capture(names[spread - 1]);
    }
    if ([1280, 1440, 1920].includes(viewport.width)) {
      await page.goto(`${baseURL}/test_11`);
      await page.locator('[data-testid="magazine-intro-scene"][data-ready="true"]').waitFor({ timeout: 20000 });
      await page.waitForTimeout(4500);
      if (await page.locator('[data-stage="opening"]').count() !== 1) throw new Error("Cover opened without activation");
      await capture("cover");
      if (viewport.width === 1440) {
        await page.getByRole("button", { name: "Открыть журнал", exact: true }).click({ position: { x: 20, y: 20 } });
        for (const [phase, name] of [["OPENING", "opening-cover"], ["FLIP_2", "opening-early-leaf"], ["FLIP_6", "opening-late-leaf"]]) {
          await page.waitForFunction(value => document.querySelector('[data-testid="magazine-intro-scene"]')?.getAttribute("data-phase") === value, phase);
          await page.waitForTimeout(90);
          await capture(name, false);
        }
        await page.locator('[data-stage="reading"][data-intro-result="target"]').waitFor({ timeout: 15000 });
        await capture("intro-hero-endpoint");
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(160);
        await capture("reading-turn", false);
        await page.locator('[data-turning="false"]').waitFor();
        await capture("reading-next-endpoint");
      }
    }
    await page.close();
  }
  await writeFile(new URL("capture-results.json", output), JSON.stringify({ generatedAt: new Date().toISOString(), baseURL, environment: new URL(baseURL).port === "3000" ? "local production Docker" : "development", browser: browser.version(), captures }, null, 2) + "\n");
  console.log(`Saved ${captures.length} screenshots and measured states to ${fileURLToPath(output)} (${baseURL}).`);
} finally {
  await browser.close();
}
