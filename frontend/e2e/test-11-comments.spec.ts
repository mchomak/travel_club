import { expect, test } from "@playwright/test";

test("reduced motion keeps both hero lines inside every clipping ancestor", async ({ page }) => {
  await page.setViewportSize({ width: 1314, height: 1244 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_11?spread=1");
  await page.evaluate(() => document.fonts.ready);
  // A captured destination can remain pending; reduced motion must print it fully.
  await page.locator("[data-magazine-book] > [data-magazine-page]").evaluateAll(elements => elements.forEach(element => element.setAttribute("data-reveal", "pending")));
  const clipped = await page.locator("[class*=heroSlogan] > span > span").evaluateAll(lines => lines.flatMap(line => {
    const range = document.createRange(); range.selectNodeContents(line);
    const text = range.getBoundingClientRect();
    for (let ancestor = line.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (![style.overflowX, style.overflowY].some(value => ["hidden", "clip", "auto", "scroll"].includes(value))) continue;
      const bounds = ancestor.getBoundingClientRect();
      if (text.top < bounds.top - 1 || text.bottom > bounds.bottom + 1 || text.left < bounds.left - 1 || text.right > bounds.right + 1) return [line.textContent];
    }
    return [];
  }));
  expect(clipped).toEqual([]);
  await page.goto("/test_11?spread=6");
  const finalPage = page.locator("[data-magazine-book] > [data-magazine-page=right]");
  expect(await finalPage.evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1);
});

test("requested editorial lines and final action keep their composition", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 768 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_11?spread=1");
  const heading = page.getByRole("heading", { name: "С нами в путь", exact: true });
  await expect(heading).toBeVisible();
  const oneLine = (element: HTMLElement | SVGElement) => {
    const range = document.createRange(); range.selectNodeContents(element);
    const lines = Array.from(range.getClientRects()).filter(rect => rect.width > 0 && rect.height > 0);
    return new Set(lines.map(rect => Math.round(rect.top))).size === 1;
  };
  expect(await heading.evaluate(oneLine)).toBe(true);
  await page.goto("/test_11?spread=3");
  const route = page.locator("[class*=thaiRoute] > span");
  await expect(route).toBeVisible();
  const alignedRoute = await route.evaluate(element => {
    const icon = element.querySelector("svg")!.getBoundingClientRect();
    const range = document.createRange(); range.selectNodeContents(element.lastChild!);
    const text = range.getBoundingClientRect();
    return icon.right < text.left && Math.abs((icon.top + icon.bottom - text.top - text.bottom) / 2) < 5;
  });
  expect(alignedRoute).toBe(true);
  await page.goto("/test_11?spread=6");
  const steps = page.locator("[class*=startProcess]");
  const action = page.getByRole("link", { name: "Обсудить поездку" });
  const stepsBox = (await steps.boundingBox())!;
  const actionBox = (await action.boundingBox())!;
  expect(actionBox.y).toBeGreaterThanOrEqual(stepsBox.y + stepsBox.height);
  await action.click();
  await expect(page).toHaveURL(/\/start$/);
});
