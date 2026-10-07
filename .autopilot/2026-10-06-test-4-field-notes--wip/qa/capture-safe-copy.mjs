import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const require = createRequire(resolve("package.json"));
const { chromium, expect } = require("@playwright/test");
const out = resolve("../.autopilot/2026-10-06-test-4-field-notes--wip/qa");
const mode = process.argv[2];
assert(["baseline", "copy"].includes(mode));
const route = mode === "baseline" ? "test_2" : "test_4";
const browser = await chromium.launch();
const results = [];

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const img of document.images) img.loading = "eager";
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) {
      scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    await Promise.race([
      Promise.all([...document.images].map(img => img.decode())),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Local image decode exceeded 10 seconds")), 10000)),
    ]);
    scrollTo(0, 0);
  });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.waitForTimeout(250);
}

for (const viewport of [{width:1440,height:900},{width:1280,height:800},{width:390,height:844}]) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const response = await page.goto(`http://127.0.0.1:3001/${route}`);
  assert.equal(response.status(), 200);
  await settle(page);
  const screenshot = `${mode}-${viewport.width}x${viewport.height}-reduced.png`;
  const bytes = await page.screenshot({ path: resolve(out, screenshot), fullPage: true, animations: "disabled" });
  const snapshot = await page.evaluate(() => ({
    text: document.body.innerText,
    anchors: [...document.querySelectorAll("a")].map(a => ({ text: a.innerText, href: a.getAttribute("href") })),
    ids: [...document.querySelectorAll("[id]")].map(e => e.id),
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: innerWidth,
    height: document.documentElement.scrollHeight,
  }));
  assert.equal(snapshot.scrollWidth, snapshot.viewportWidth);
  assert.equal(errors.length, 0, errors.join("\n"));
  if (mode === "copy") {
    const originalBytes = await readFile(resolve(out, `baseline-${viewport.width}x${viewport.height}-reduced.png`));
    assert(bytes.equals(originalBytes), `Reduced-motion pixels differ at ${viewport.width}x${viewport.height}`);
    const baseline = JSON.parse(await readFile(resolve(out, "baseline-dom.json"), "utf8"));
    assert.deepEqual(snapshot, baseline.find(entry => entry.viewport.width === viewport.width).snapshot);
  }
  results.push({ viewport, screenshot, snapshot, errors, pixelsEqual: mode === "copy" ? true : undefined });
  await context.close();
  console.log(`${mode}: ${viewport.width}x${viewport.height} reduced full-page capture, text/anchors, no overflow or JS errors`);
}

const context = await browser.newContext({viewport:{width:1440,height:900},reducedMotion:"no-preference"});
const page = await context.newPage();
await page.goto(`http://127.0.0.1:3001/${route}`);
await settle(page);
const scene = page.getByRole("region", {name:"TRAVEL CLUB",exact:true});
const cover = scene.getByRole("article");
const initial = await cover.evaluate(e => getComputedStyle(e).transform);
await page.evaluate(() => scrollTo(0, innerHeight * 0.38));
await expect.poll(() => cover.evaluate(e => getComputedStyle(e).transform)).not.toBe(initial);
await page.waitForTimeout(250);
await page.screenshot({path:resolve(out,`${mode}-1440x900-normal-opening.png`),animations:"disabled"});
await page.evaluate(() => scrollTo(0, 0));
await expect.poll(() => cover.evaluate(e => getComputedStyle(e).transform)).toBe(initial);
await scene.getByRole("link",{name:"К сайту"}).focus();
await page.keyboard.press("Enter");
await expect(page).toHaveURL(/#start$/);
await expect.poll(() => page.locator("#start").evaluate(e => Math.abs(e.getBoundingClientRect().top))).toBeLessThan(2);
await page.getByRole("banner").getByRole("link",{name:"Начать историю"}).click();
await expect(page).toHaveURL(/#story$/);
await expect(page.locator("#story").getByRole("textbox",{name:/Ваш контакт/})).toBeVisible();
await context.close();
await browser.close();
await writeFile(resolve(out, `${mode}-dom.json`), JSON.stringify(results,null,2)+"\n");
console.log(`${mode}: normal opening, reverse scroll, keyboard skip #start, navigation #story passed`);
