import { expect, test } from "@playwright/test";

test("continuous issue exposes all seven chapters and fourteen original pages", async ({ page }) => {
  await page.goto("/test_15");

  const navigation = page.getByRole("navigation", { name: /chapter|глав/i });
  await expect(navigation.getByRole("link")).toHaveCount(7);
  await expect(page.getByRole("main").locator("[data-magazine-page]")).toHaveCount(14);
});

test("chapter links jump to their section and announce the current chapter", async ({ page }) => {
  await page.goto("/test_15");

  const navigation = page.getByRole("navigation", { name: /chapter|глав/i });
  const links = navigation.getByRole("link");
  const destination = links.nth(3);
  const href = await destination.getAttribute("href");
  expect(href).toMatch(/^#/);

  await destination.click();

  const heading = page.locator(`[id="${href?.slice(1)}"]`);
  await expect(heading).toBeInViewport();
  await expect(destination).toHaveAttribute("aria-current", "location");
});

for (const viewport of [
  { width: 320, height: 700 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
]) {
  test(`keeps the reading layout usable at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/test_15");

    const layout = await page.evaluate(() => {
      const navigation = document.querySelector('nav[aria-label]');
      const links = [...(navigation?.querySelectorAll("a") ?? [])];
      const bodyCopy = document.querySelector("main p");
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        linkHeights: links.map(link => link.getBoundingClientRect().height),
        bodyFontSize: bodyCopy ? Number.parseFloat(getComputedStyle(bodyCopy).fontSize) : 0,
      };
    });

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.bodyFontSize).toBeGreaterThanOrEqual(16);
    expect(layout.linkHeights.length).toBe(7);
    expect(layout.linkHeights.every(height => height >= 44)).toBe(true);
  });
}
