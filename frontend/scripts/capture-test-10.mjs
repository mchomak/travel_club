import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
const output = new URL("../../docs/qa/test-10/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const time = new Date("2026-10-18T09:00:00Z");
  await page.clock.install({ time }); await page.clock.pauseAt(time);
  await page.goto(`${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001"}/test_10`);
  await page.getByTestId("magazine-intro-scene").waitFor();
  await page.waitForFunction(() => document.querySelector('[data-testid="magazine-intro-scene"]')?.getAttribute("data-phase") === "CLOSED");
  const samples = [];
  async function sample(name) {
    samples.push(await page.getByTestId("magazine-experience").evaluate(element => {
      const scene = element.querySelector('[data-testid="magazine-intro-scene"]');
      return { phase: element.dataset.introPhase, stage: element.dataset.stage, elapsed: scene?.getAttribute("data-elapsed"), corners: element.dataset.introCorners };
    }));
    await page.screenshot({ path: new URL(`${name}.png`, output).pathname.replace(/^\/(\w:)/,"$1") });
  }
  await sample("intro-closed");
  await page.clock.runFor(500); await sample("intro-cover-opening");
  await page.clock.runFor(1400); await sample("intro-auto-flips");
  for (let i = 0; i < 150; i++) {
    if (await page.getByTestId("magazine-experience").getAttribute("data-intro-phase") === "FLIP_8") break;
    await page.clock.runFor(10);
  }
  for (let i = 0; i < 20; i++) { await sample(`intro-final-${String(i).padStart(2,"0")}`); await page.clock.runFor(25); }
  await page.clock.runFor(200); await sample("intro-reading");
  await writeFile(new URL("intro-final-samples.json", output), JSON.stringify(samples, null, 2));
} finally { await browser.close(); }
