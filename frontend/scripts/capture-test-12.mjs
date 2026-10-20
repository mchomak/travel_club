import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3012";
const output = resolve(process.env.TEST_12_CAPTURE_DIR || "../docs/qa/test-12/development");
const names = ["hero-formats", "about", "next-issue", "thailand", "china", "archive", "point-of-view-start"];
const sizes = [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }];
const captures = [], comparisons = [], failures = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of sizes) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const warnings = [];
    page.on("console", message => { if (["warning", "error"].includes(message.type())) warnings.push(`${message.type()}: ${message.text()}`); });
    page.on("pageerror", error => warnings.push(`PAGE ERROR: ${error.message}`));
    await page.addInitScript(() => {
      const request = window.requestAnimationFrame.bind(window); let frames = 0;
      window.requestAnimationFrame = callback => request(time => { frames++; callback(time); });
      Object.defineProperty(window, "__qaFrames", { get: () => frames });
    });
    async function settle() {
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all(Array.from(document.images, image => image.decode())); });
      await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== "running"));
    }
    async function reading(version, spread) {
      await page.goto(`${baseURL}/${version}?spread=${spread}`);
      await page.locator('[data-stage="reading"][data-turning="false"]').waitFor(); await settle();
    }
    async function metrics() {
      return page.evaluate(() => {
        const book = document.querySelector("[data-magazine-book]").getBoundingClientRect();
        const pages = Array.from(document.querySelectorAll("[data-magazine-book] > [data-magazine-page]"));
        const visible = element => { const style = getComputedStyle(element); return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0"; };
        return {
          viewport: { width: innerWidth, height: innerHeight },
          book: { x: book.x, y: book.y, width: book.width, height: book.height },
          documentOverflow: { x: document.documentElement.scrollWidth - innerWidth, y: document.documentElement.scrollHeight - innerHeight },
          pages: pages.map(leaf => {
            const bounds = leaf.getBoundingClientRect(), outsideText = [], textRanges = [];
            const walker = document.createTreeWalker(leaf, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
              const node = walker.currentNode; if (!node.textContent.trim() || !visible(node.parentElement)) continue;
              const range = document.createRange(); range.selectNodeContents(node);
              const boxes = Array.from(range.getClientRects()).filter(box => box.width && box.height);
              const text = node.textContent.trim();
              if (boxes.some(box => box.left < bounds.left - 1 || box.right > bounds.right + 1 || box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1)) outsideText.push(text);
              textRanges.push({ text, boxes: boxes.map(box => ({ x: box.x - bounds.x, y: box.y - bounds.y, width: box.width, height: box.height })) });
            }
            const links = Array.from(leaf.querySelectorAll("a"), link => { const box = link.getBoundingClientRect(); return { text: link.innerText, href: link.getAttribute("href"), visible: visible(link) && box.width > 0 && box.height > 0 && box.left >= bounds.left - 1 && box.right <= bounds.right + 1 && box.top >= bounds.top - 1 && box.bottom <= bounds.bottom + 1 }; });
            return { side: leaf.dataset.magazinePage, overflow: { x: leaf.scrollWidth - leaf.clientWidth, y: leaf.scrollHeight - leaf.clientHeight }, outsideText, links, textRanges };
          }),
          navigation: Array.from(document.querySelectorAll('nav button[aria-current],nav button:has(>span +span)'), button => { const box = button.getBoundingClientRect(); return { text: button.innerText, width: box.width, height: box.height, active: button.getAttribute("aria-current") }; }),
          brokenImages: Array.from(document.images).filter(image => !image.complete || image.naturalWidth === 0).map(image => image.src),
          runningAnimations: document.getAnimations().filter(animation => animation.playState === "running").length,
          canvases: document.querySelectorAll("canvas").length,
        };
      });
    }
    async function signature() {
      return page.locator("[data-magazine-book] > [data-magazine-page]").evaluateAll(leaves => leaves.map(leaf => {
        const bounds = leaf.getBoundingClientRect();
        return [leaf, ...leaf.querySelectorAll("*")].map(element => {
          const style = getComputedStyle(element), box = element.getBoundingClientRect();
          const folioNumber = element.matches("footer > span:last-child");
          return {
            tag: element.tagName, text: folioNumber ? "<folio>" : [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join(""),
            href: element.getAttribute("href"), src: element.getAttribute("src"), alt: element.getAttribute("alt"), ariaLabel: element.getAttribute("aria-label"),
            reveal: element.getAttribute("data-reveal-object"),
            box: [folioNumber ? null : box.x - bounds.x, box.y - bounds.y, folioNumber ? null : box.width, box.height].map(value => value === null ? null : Math.round(value * 1000) / 1000),
            styles: Object.fromEntries(["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform", "color", "backgroundColor", "display", "position", "objectFit", "objectPosition", "gridTemplateColumns", "gap", "padding", "borderWidth", "borderColor", "opacity", "transform", "clipPath"].map(key => [key, style[key]])),
          };
        });
      }));
    }
    const current = [];
    for (let spread = 1; spread <= 7; spread++) {
      await reading("test_12", spread);
      const filename = `${names[spread - 1]}-${viewport.width}x${viewport.height}.png`;
      await page.screenshot({ path: resolve(output, filename) });
      const sample = await metrics();
      const before = await page.evaluate(() => window.__qaFrames); await page.waitForTimeout(160); const after = await page.evaluate(() => window.__qaFrames);
      captures.push({ filename, version: "test_12", spread, url: page.url(), ...sample, idleFrames: { before, after } });
      current[spread] = await signature();
      if (sample.documentOverflow.x || sample.documentOverflow.y || sample.brokenImages.length || sample.runningAnimations || sample.canvases || after !== before) failures.push(`${filename}: document/image/idle check failed`);
      if (spread <= 2) for (const leaf of sample.pages) {
        if (leaf.outsideText.length || leaf.links.some(link => !link.visible) || leaf.overflow.x > 1 || leaf.overflow.y > 1) failures.push(`${filename}: ${leaf.side} clips text or CTA`);
      }
      if (sample.navigation.some(item => item.height < 44)) failures.push(`${filename}: navigation target below44px`);
    }
    for (let oldSpread = 2; oldSpread <= 6; oldSpread++) {
      await reading("test_11", oldSpread);
      const filename = `control-test11-${names[oldSpread]}-${viewport.width}x${viewport.height}.png`;
      await page.screenshot({ path: resolve(output, filename) });
      const previous = await signature();
      let match = true;
      try { assert.deepEqual(current[oldSpread + 1], previous); } catch (error) { match = false; failures.push(`${filename}: protected chapter mismatch: ${error.message.slice(0, 2000)}`); }
      comparisons.push({ filename, viewport, oldSpread, newSpread: oldSpread + 1, match, elementCount: previous.flat().length, excludes: "only footer page-number text and its intrinsic x/width (different digit shapes); vertical geometry and computed styles still compared" });
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`${baseURL}/test_12`);
    await page.locator('[data-testid="magazine-intro-scene"][data-ready="true"]').waitFor({ timeout: 20000 });
    await page.waitForTimeout(2300);
    const filename = `cover-${viewport.width}x${viewport.height}.png`;
    await page.screenshot({ path: resolve(output, filename) });
    captures.push({ filename, version: "test_12", spread: "cover", url: page.url(), viewport, cueVisible: await page.getByRole("button", { name: "Открыть журнал", exact: true }).locator("span").first().isVisible() });
    const meaningfulWarnings = [...new Set(warnings)].filter(message => !/WebGL.*(?:software|deprecated)|GPU stall due to ReadPixels|Automatic fallback to software WebGL|was preloaded using link preload but not used/i.test(message));
    if (meaningfulWarnings.length) failures.push(`browser ${viewport.width}: ${meaningfulWarnings.join(" | ")}`);
    captures.push({ viewport, browserWarnings: [...new Set(warnings)], meaningfulWarnings });
    await page.close();
  }
} catch (error) { failures.push(String(error)); }
finally {
  await writeFile(resolve(output, "capture-results.json"), JSON.stringify({ generatedAt: new Date().toISOString(), baseURL, runtime: process.env.TEST_12_RUNTIME_LABEL || "unspecified runtime; origin alone does not prove development or production", browser: browser.version(), sizes, screenshots: captures.filter(capture => capture.filename).length + comparisons.length, captures, comparisons, failures }, null, 2) + "\n");
  await browser.close();
}
console.log(JSON.stringify({ output, captures: captures.filter(capture => capture.filename).length, comparisons: comparisons.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
