import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const output = process.env.TEST_11_CAPTURE_DIR
  ? pathToFileURL(`${resolve(process.env.TEST_11_CAPTURE_DIR)}/`)
  : new URL("../../docs/qa/test-11/completion-production/", import.meta.url);
const evidenceStatus = process.env.TEST_11_EVIDENCE_STATUS || "unreviewed";
const generatedAt = new Date().toISOString();
const sizes = [
  { width: 1280, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
const names = ["hero-formats", "next-issue", "thailand", "china", "archive", "point-of-view-start"];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const captures = [];
let failure = null;
try {
  for (const viewport of sizes) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    const warnings = [];
    await page.addInitScript(() => {
      const request = window.requestAnimationFrame.bind(window);
      let frames = 0;
      window.requestAnimationFrame = callback => request(time => { frames++; callback(time); });
      Object.defineProperty(window, "__qaAnimationFrames", { get: () => frames });
    });
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
      await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== "running"), null, { timeout: 12000 });
    }
    async function capture(name, final = true) {
      if (final) await settle();
      const filename = `${name}-${viewport.width}x${viewport.height}.png`;
      const sampledAt = new Date().toISOString();
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
          readingTurn: (() => { const leaf = document.querySelector("[data-reading-turn]"); return leaf ? Object.fromEntries(Array.from(leaf.attributes).filter(attribute => attribute.name.startsWith("data-")).map(attribute => [attribute.name, attribute.value])) : null; })(),
          reveal: Array.from(document.querySelectorAll("[data-magazine-book] > [data-magazine-page]"), page => ({ side: page.getAttribute("data-magazine-page"), phase: page.getAttribute("data-reveal"), objects: Array.from(page.querySelectorAll("[data-reveal-object]"), element => ({ name: element.getAttribute("data-reveal-object"), opacity: getComputedStyle(element).opacity, clipPath: getComputedStyle(element).clipPath, transform: getComputedStyle(element).transform })) })),
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
      let idleFrames = null;
      if (final && metrics.stage === "reading") {
        const before = await page.evaluate(() => window.__qaAnimationFrames);
        await page.waitForTimeout(750);
        idleFrames = { before, after: await page.evaluate(() => window.__qaAnimationFrames) };
      }
      captures.push({ filename, viewport, final, evidenceStatus, sourceURL: page.url(), sampledAt, ...metrics, idleFrames, warnings: [...new Set(warnings)] });
    }
    for (let spread = 1; spread <= 6; spread++) {
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
        for (const [phase, name] of [["OPENING", "opening-cover"], ["FLIP_2", "opening-early-leaf"], ["FLIP_6", "opening-late-leaf"]]) {
          // Each sample gets its own opening so screenshot/diagnostic overhead cannot skip the next phase.
          await page.goto(`${baseURL}/test_11`);
          await page.locator('[data-testid="magazine-intro-scene"][data-ready="true"]').waitFor({ timeout: 20000 });
          await page.getByRole("button", { name: "Открыть журнал", exact: true }).click({ position: { x: 20, y: 20 } });
          await page.waitForFunction(value => document.querySelector('[data-testid="magazine-intro-scene"]')?.getAttribute("data-phase") === value, phase, { polling: "raf", timeout: 15000 });
          await capture(name, false);
        }
        await page.locator('[data-stage="reading"][data-intro-result="target"]').waitFor({ timeout: 15000 });
        await capture("intro-hero-endpoint");
        for (const [key, direction] of [["ArrowRight", "forward"], ["ArrowLeft", "backward"]]) {
          await page.keyboard.press(key);
          await page.waitForFunction(() => {
            const leaf = document.querySelector("[data-reading-turn]");
            const progress = Number(leaf?.getAttribute("data-progress"));
            return leaf?.getAttribute("data-reading-turn") === "webgl" && leaf.querySelector("canvas") && progress >= .32 && progress <= .65;
          }, null, { polling: "raf", timeout: 12000 });
          await capture(`reading-curved-${direction}`, false);
          await page.locator('[data-stage="reading"][data-turning="false"]').waitFor({ timeout: 12000 });
          await capture(`reading-${direction}-reveal-start`, false);
          await page.waitForTimeout(1100);
          await capture(`reading-${direction}-reveal-middle`, false);
          await capture(`reading-${direction}-endpoint`);
        }
      }
    }
    await page.close();
  }
  console.log(`Saved ${captures.length} screenshots and measured states to ${fileURLToPath(output)} (${baseURL}).`);
} catch (error) {
  failure = { message: String(error), at: new Date().toISOString() };
  throw error;
} finally {
  await writeFile(new URL("capture-results.json", output), JSON.stringify({ generatedAt, completedAt: new Date().toISOString(), baseURL, evidenceStatus, failure, contract: "six reading spreads / twelve pages; October 19 completion", environment: process.env.TEST_11_SOURCE_LABEL || "unspecified runtime (origin alone does not prove production)", browser: browser.version(), captures }, null, 2) + "\n");
  await browser.close();
}
