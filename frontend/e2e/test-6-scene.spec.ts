import { expect, test, type Page } from "@playwright/test";

async function range(page: Page, label: string, value: number) {
  await page.getByRole("slider", { name: label, exact: true }).evaluate((element, next) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(element, String(next)); element.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}
async function ready(page: Page) {
  await page.goto("/test_6");
  await expect(page.getByRole("button", { name: "Final State", exact: true })).toBeEnabled({ timeout: 30000 });
}

test("switching animation presets replays six faster leaves and preserves camera tuning", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await page.getByRole("button", { name: "Final State", exact: true }).click();
  await page.getByRole("button", { name: "Tuning controls +", exact: true }).click();
  await page.getByText("Camera", { exact: true }).click();
  await range(page, "Yaw", 12);
  const fast = page.getByRole("button", { name: "Анимация 2 · Свой темп", exact: true });
  const start = await fast.evaluate(element => {
    (element as HTMLButtonElement).click();
    const host = document.querySelector('[data-testid="magazine-scene"]') as HTMLElement;
    return { elapsed: host.dataset.elapsed, paused: host.dataset.paused };
  });
  expect(start).toEqual({ elapsed: "0.0000", paused: "false" });
  await expect(fast).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("slider", { name: "Yaw", exact: true })).toHaveValue("12");
  const scene = page.getByTestId("magazine-scene");
  await expect(scene).toHaveAttribute("data-leaf-count", "24");
  await page.getByRole("button", { name: "Ровно", exact: true }).click();
  await range(page, "Количество листов", 6);
  for (let leaf = 0; leaf < 6; leaf++) {
    await range(page, "Sequence progress", (.93 + leaf * .41 + .17) / 3.39 * 100);
    await expect(scene).toHaveAttribute("data-phase", `FLIP_${leaf + 1}`);
    expect(Number(await scene.getAttribute("data-active-progress"))).toBeCloseTo(.5, 2);
  }
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(fast).toHaveAttribute("aria-pressed", "true");
  await expect(scene).toHaveAttribute("data-leaf-count", "24");
  await page.getByRole("button", { name: "Ровно", exact: true }).click();
  await range(page, "Количество листов", 6);
  await range(page, "Sequence progress", (3.15 / 3.39) * 100);
  await expect(scene).toHaveAttribute("data-phase", "FLIP_6");
  await page.getByText("Animation", { exact: true }).click();
  await expect(page.getByRole("slider", { name: "Flip duration", exact: true })).toHaveValue("0.34");
  await expect(page.getByRole("slider", { name: "Delay between flips", exact: true })).toHaveValue("0.07");
  await page.getByRole("button", { name: "Final State", exact: true }).click();
  await expect(scene).toHaveAttribute("data-phase", "TARGET");
  await expect(scene).toHaveAttribute("data-paused", "true");
  const fastTarget = await page.screenshot({ clip: { x: 300, y: 250, width: 650, height: 400 } });
  await page.getByRole("button", { name: "Анимация 1 · 3 листа", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Flip duration", exact: true })).toHaveValue("0.68");
  await range(page, "Sequence progress", 38.73);
  await expect(scene).toHaveAttribute("data-phase", "FLIP_1");
  await page.getByRole("button", { name: "Final State", exact: true }).click();
  expect((await page.screenshot({ clip: { x: 300, y: 250, width: 650, height: 400 } })).equals(fastTarget)).toBe(true);
});

test("both animation choices respect reduced motion and fit the mobile controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  for (const name of ["Анимация 2 · Свой темп", "Анимация 1 · 3 листа"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.getByTestId("magazine-scene")).toHaveAttribute("data-phase", "TARGET");
    await expect(page.getByTestId("magazine-scene")).toHaveAttribute("data-paused", "true");
    await expect(page.getByRole("button", { name, exact: true })).toBeInViewport();
  }
  expect(await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight])).toEqual([390, 844]);
});

test("custom count and draggable speed curve persist across variant switches", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 }); await ready(page);
  const scene = page.getByTestId("magazine-scene");
  await page.getByRole("button", { name: "Анимация 2 · Свой темп", exact: true }).click();
  await page.getByRole("button", { name: "Final State", exact: true }).click();
  await page.getByRole("button", { name: "Tuning controls +", exact: true }).click();
  await page.getByRole("spinbutton", { name: "Количество листов числом" }).fill("120");
  await expect(scene).toHaveAttribute("data-leaf-count", "120");
  await page.getByRole("button", { name: "Ровно", exact: true }).click();
  expect(Number(await scene.getAttribute("data-total"))).toBeCloseTo(50.13, 3);
  await range(page, "Sequence progress", 49.89 / 50.13 * 100);
  await expect(scene).toHaveAttribute("data-phase", "FLIP_120");
  expect(Number(await scene.getAttribute("data-active-progress"))).toBeCloseTo(.5, 2);
  await page.getByRole("button", { name: "Точка кривой 2", exact: true }).click();
  await range(page, "Позиция точки", 38);
  await range(page, "Темп точки", 3);
  await expect(page.getByRole("slider", { name: "Позиция точки" })).toHaveValue("38");
  await page.getByRole("button", { name: "Быстро → медленно", exact: true }).click();
  const graph = page.getByRole("img", { name: "Кривая темпа" });
  await graph.scrollIntoViewIfNeeded();
  const box = (await graph.boundingBox())!, circle = (await graph.locator('[data-curve-point="4"]').boundingBox())!;
  await page.mouse.move(circle.x + circle.width / 2, circle.y + circle.height / 2);
  await page.mouse.down();
  // Drag the endpoint left/down: its position stays pinned to the final leaf.
  await page.mouse.move(box.x + box.width * .8, box.y + 119 / 148 * box.height, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByRole("slider", { name: "Позиция точки" })).toBeDisabled();
  await expect(page.getByRole("slider", { name: "Позиция точки" })).toHaveValue("100");
  const tempo = await page.getByRole("slider", { name: "Темп точки" }).inputValue();
  expect(Number(tempo)).toBeLessThan(.45);
  const duration = await scene.getAttribute("data-total");
  await page.screenshot({ path: info.outputPath("custom-speed-curve.png") });
  await page.getByRole("button", { name: "Анимация 1 · 3 листа", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Количество листов" })).toHaveCount(0);
  await expect(scene).toHaveAttribute("data-leaf-count", "3");
  await page.getByRole("button", { name: "Анимация 2 · Свой темп", exact: true }).click();
  await expect(scene).toHaveAttribute("data-leaf-count", "120");
  await expect(scene).toHaveAttribute("data-total", duration!);
  await page.getByRole("button", { name: "Точка кривой 5", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Темп точки" })).toHaveValue(tempo);
  await page.getByRole("button", { name: "Final State", exact: true }).click();
  await expect(scene).toHaveAttribute("data-phase", "TARGET");
  const frames = await scene.getAttribute("data-frames"); await page.waitForTimeout(180);
  expect(await scene.getAttribute("data-frames")).toBe(frames);
});

test("mobile count and curve edits retain the stationary reduced-motion target", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.emulateMedia({ reducedMotion: "reduce" }); await ready(page);
  await page.getByRole("button", { name: "Анимация 2 · Свой темп", exact: true }).click();
  await page.getByRole("button", { name: "Tuning controls +", exact: true }).click();
  await range(page, "Количество листов", 80);
  await page.getByRole("button", { name: "Точка кривой 3", exact: true }).click();
  const tempo = page.getByRole("slider", { name: "Темп точки" });
  await tempo.scrollIntoViewIfNeeded(); await tempo.focus(); await tempo.press("End");
  await expect(page.getByTestId("magazine-scene")).toHaveAttribute("data-leaf-count", "80");
  await expect(page.getByTestId("magazine-scene")).toHaveAttribute("data-phase", "TARGET");
  await expect(page.getByTestId("magazine-scene")).toHaveAttribute("data-paused", "true");
  await expect(page.getByRole("slider", { name: "Темп точки" })).toBeInViewport();
  expect(await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight])).toEqual([390, 844]);
});

test("opening does not reveal a second printed cover behind the moving leaf", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  // At this time the cover has passed vertical, but has not landed on the left.
  await range(page, "Sequence progress", 19);
  await expect(page.getByTestId("magazine-scene")).toHaveAttribute("data-phase", "OPENING");
  await page.screenshot({ path: info.outputPath("opening-before-touchdown.png") });
  // This patch lies outside the turning cover. It must remain Cloud space;
  // the prematurely visible duplicate used to fill it with black printed paper.
  const patch = await page.screenshot({ clip: { x: 250, y: 590, width: 32, height: 40 } });
  const darkFraction = await page.evaluate(async bytes => {
    const bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: "image/png" }));
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext("2d")!;
    context.drawImage(bitmap, 0, 0); bitmap.close();
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let dark = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] < 100 && pixels[i + 1] < 100 && pixels[i + 2] < 100) dark++;
    }
    return dark / (pixels.length / 4);
  }, [...patch]);
  expect(darkFraction).toBeLessThan(.02);
});

test("seek, replay, pause, final, reset and immediate tuning", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const warnings: string[] = [];
  page.on("console", message => { if (message.type() === "warning") warnings.push(message.text()); });
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const scene = page.getByTestId("magazine-scene");
  await range(page, "Sequence progress", 0);
  await expect(scene).toHaveAttribute("data-phase", "CLOSED");
  await page.screenshot({ path: info.outputPath("baseline-00-initial.png") });
  await range(page, "Sequence progress", 25);
  await page.screenshot({ path: info.outputPath("baseline-25.png") });
  await range(page, "Sequence progress", 38.73);
  await expect(scene).toHaveAttribute("data-phase", "FLIP_1");
  await page.screenshot({ path: info.outputPath("baseline-paper-midflip.png") });
  const frozen = await scene.getAttribute("data-elapsed");
  await page.waitForTimeout(180);
  expect(await scene.getAttribute("data-elapsed")).toBe(frozen);
  await range(page, "Sequence progress", 75);
  await page.screenshot({ path: info.outputPath("baseline-75.png") });
  await page.getByRole("button", { name: "Final State", exact: true }).click();
  await expect(scene).toHaveAttribute("data-phase", "TARGET");
  await page.screenshot({ path: info.outputPath("baseline-100-final.png") });
  const frames = await scene.getAttribute("data-frames");
  await page.waitForTimeout(220);
  expect(await scene.getAttribute("data-frames")).toBe(frames);
  await page.getByRole("button", { name: "Tuning controls +", exact: true }).click();
  await page.getByText("Camera", { exact: true }).click();
  await range(page, "Yaw", 12);
  expect(Number(await scene.getAttribute("data-frames"))).toBeGreaterThan(Number(frames));
  await expect(scene).toHaveAttribute("data-phase", "TARGET");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Yaw", exact: true })).toHaveValue("-8");
  // Seek is deterministic even when the software WebGL runner delays UI clicks.
  await range(page, "Sequence progress", 30);
  await page.getByText("Animation", { exact: true }).click();
  await range(page, "Flip duration", 2);
  await expect(scene).toHaveAttribute("data-paused", "true");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(scene).toHaveAttribute("data-paused", "true");
  const paused = await scene.getAttribute("data-elapsed");
  await page.waitForTimeout(140); expect(await scene.getAttribute("data-elapsed")).toBe(paused);
  // Observe the first resumed draw in the click task: slow software rendering can
  // finish the real-time sequence before the next Playwright assertion runs.
  const resumed = await page.getByRole("button", { name: "Play", exact: true }).evaluate(element => {
    const host = document.querySelector('[data-testid="magazine-scene"]') as HTMLElement;
    const before = { elapsed: host.dataset.elapsed, frames: Number(host.dataset.frames) };
    (element as HTMLButtonElement).click();
    return { before, elapsed: host.dataset.elapsed, frames: Number(host.dataset.frames), paused: host.dataset.paused };
  });
  expect(resumed.paused).toBe("false");
  expect(resumed.elapsed).toBe(resumed.before.elapsed);
  expect(resumed.frames).toBeGreaterThan(resumed.before.frames);
  const replayStart = await page.getByRole("button", { name: "Replay", exact: true }).evaluate(element => {
    (element as HTMLButtonElement).click();
    const host = document.querySelector('[data-testid="magazine-scene"]') as HTMLElement;
    return { elapsed: host.dataset.elapsed, paused: host.dataset.paused };
  });
  expect(Number(replayStart.elapsed)).toBe(0);
  expect(replayStart.paused).toBe("false");
  await info.attach("console-warnings", { body: JSON.stringify(warnings, null, 2), contentType: "application/json" });
  expect(warnings.filter(message => message.startsWith("THREE.Material:"))).toEqual([]);
  expect(errors).toEqual([]);
});

test("reduced motion starts and remains at the stationary final spread", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" }); await ready(page);
  const scene = page.getByTestId("magazine-scene");
  await expect(scene).toHaveAttribute("data-phase", "TARGET");
  await page.getByRole("button", { name: "Replay", exact: true }).click();
  await expect(scene).toHaveAttribute("data-phase", "TARGET");
  await expect(scene).toHaveAttribute("data-paused", "true");
});

test("automatic completion stops rendering and dynamic reduced motion stops a replay", async ({ page }) => {
  await ready(page);
  const scene = page.getByTestId("magazine-scene");
  await expect(scene).toHaveAttribute("data-phase", "TARGET", { timeout: 15000 });
  await expect(scene).toHaveAttribute("data-paused", "true");
  const frames = await scene.getAttribute("data-frames");
  await page.waitForTimeout(220);
  expect(await scene.getAttribute("data-frames")).toBe(frames);
  await page.getByRole("button", { name: "Replay", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(scene).toHaveAttribute("data-phase", "TARGET");
  await expect(scene).toHaveAttribute("data-paused", "true");
});

test("mobile laboratory has no document scroll and controls remain reachable", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await ready(page);
  await page.getByRole("button", { name: "Final State", exact: true }).click();
  await page.screenshot({ path: info.outputPath("baseline-mobile-final.png") });
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(844);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Tuning controls +", exact: true }).click();
  await range(page, "Bend", 2);
  await expect(page.getByRole("slider", { name: "Bend", exact: true })).toHaveValue("2");
});

test("every tuning group wakes the stationary renderer without restarting the sequence", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: "Final State", exact: true }).click();
  await page.getByRole("button", { name: "Tuning controls +", exact: true }).click();
  const groups = [
    ["Camera", [["Distance", 11], ["FOV", 34], ["Pitch", 21], ["Yaw", 5], ["Roll", 3]]],
    ["Magazine", [["Scale", .9], ["Overall tilt", 2], ["Page thickness", .006]]],
    ["Page", [["Bend", 2.3], ["Curl", 1], ["Stiffness", .3], ["Lift", .5]]],
    ["Light & shadow", [["Ambient intensity", 2], ["Main light intensity", 2.5], ["Light X", -1], ["Light Y", 2], ["Light Z", 10], ["Shadow strength", .22], ["Shadow softness", 5]]],
    ["Animation", [["Flip duration", .8], ["Delay between flips", .2]]],
  ] as const;
  const scene = page.getByTestId("magazine-scene");
  for (const [group, controls] of groups) {
    const details = page.locator("details").filter({ has: page.locator("summary", { hasText: group }) });
    if (await details.getAttribute("open") === null) await details.locator("summary").click();
    for (const [label, value] of controls) {
      const frames = Number(await scene.getAttribute("data-frames"));
      await range(page, label, value);
      await expect(page.getByRole("slider", { name: label, exact: true })).toHaveValue(String(value));
      expect(Number(await scene.getAttribute("data-frames"))).toBeGreaterThan(frames);
      await expect(scene).toHaveAttribute("data-phase", "TARGET");
      await expect(scene).toHaveAttribute("data-paused", "true");
    }
  }
  await page.getByRole("checkbox", { name: "Debug geometry" }).check();
  await expect(page.getByText(/56 × 16 segments/)).toBeVisible();
  await page.getByRole("button", { name: "Close controls −", exact: true }).click();
  await expect(page.getByRole("complementary")).toHaveCount(0);
});

test("context loss disposes the scene and owned fonts, retry restores one canvas", async ({ page }) => {
  await ready(page);
  const before = await page.evaluate(() => document.fonts.size);
  await page.locator("canvas").evaluate(canvas => canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
  await expect(page.getByTestId("living-issue-lab").getByRole("alert")).toContainText("Контекст WebGL потерян");
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(await page.evaluate(() => document.fonts.size)).toBe(before - 2);
  const scene = page.getByTestId("magazine-scene"), frames = await scene.getAttribute("data-frames");
  await page.waitForTimeout(180); expect(await scene.getAttribute("data-frames")).toBe(frames);
  await page.getByRole("button", { name: "Повторить", exact: true }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Final State", exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.fonts.size)).toBe(before);
});

for (const width of [1440, 1280, 768]) {
  test(`responsive paper inspection at ${width}px has no scroll or browser errors`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.setViewportSize({ width, height: 900 }); await ready(page);
    const scene = page.getByTestId("magazine-scene");
    // First paper, not percentages of the entire cover + three-leaf sequence.
    for (const active of [.25, .5, .75]) {
      await range(page, "Sequence progress", (1 + active * .68) / 3.46 * 100);
      await expect(scene).toHaveAttribute("data-phase", "FLIP_1");
      expect(Number(await scene.getAttribute("data-active-progress"))).toBeCloseTo(active, 2);
      await page.screenshot({ path: info.outputPath(`paper-${active * 100}.png`) });
    }
    await page.getByRole("button", { name: "Final State", exact: true }).click();
    expect(await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight])).toEqual([width, 900]);
    expect(errors).toEqual([]);
  });
}

test("hidden document freezes the clock and returning does not catch up elapsed time", async ({ page }) => {
  await ready(page); await range(page, "Sequence progress", 35);
  await page.getByRole("button", { name: "Play", exact: true }).evaluate(element => (element as HTMLButtonElement).click());
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
  const scene = page.getByTestId("magazine-scene"), elapsed = Number(await scene.getAttribute("data-elapsed"));
  const frames = await scene.getAttribute("data-frames");
  await page.waitForTimeout(250); expect(await scene.getAttribute("data-frames")).toBe(frames);
  const resumed = await scene.evaluate(element => new Promise<number>(resolve => {
    const observer = new MutationObserver(records => {
      if (records.some(record => record.attributeName === "data-frames")) {
        observer.disconnect(); resolve(Number((element as HTMLElement).dataset.elapsed));
      }
    });
    observer.observe(element, { attributes: true });
    Object.defineProperty(document, "hidden", { configurable: true, value: false }); document.dispatchEvent(new Event("visibilitychange"));
  }));
  // The first resumed draw has no clock delta, independent of the runner's speed.
  expect(resumed).toBe(elapsed);
});
