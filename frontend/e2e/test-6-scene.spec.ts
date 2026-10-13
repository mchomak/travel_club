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

test("seek, replay, pause, final, reset and immediate tuning", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const scene = page.getByTestId("magazine-scene");
  await range(page, "Sequence progress", 0);
  await expect(scene).toHaveAttribute("data-phase", "CLOSED");
  await page.screenshot({ path: info.outputPath("baseline-00-initial.png") });
  await range(page, "Sequence progress", 25);
  await page.screenshot({ path: info.outputPath("baseline-25.png") });
  await range(page, "Sequence progress", 38.86);
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
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(scene).toHaveAttribute("data-paused", "false");
  const replayStart = await page.getByRole("button", { name: "Replay", exact: true }).evaluate(element => {
    (element as HTMLButtonElement).click();
    return (document.querySelector('[data-testid="magazine-scene"]') as HTMLElement).dataset.elapsed;
  });
  expect(Number(replayStart)).toBe(0);
  await expect(scene).toHaveAttribute("data-paused", "false");
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
