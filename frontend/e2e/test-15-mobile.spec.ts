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

  const heading = page.locator(`[id="${href?.slice(1)}"]`).locator("h1, h2").last();
  await expect(heading).toBeInViewport();
  const [headingTop, navigationBottom] = await Promise.all([
    heading.evaluate(element => element.getBoundingClientRect().top),
    navigation.evaluate(element => element.getBoundingClientRect().bottom),
  ]);
  expect(headingTop).toBeGreaterThanOrEqual(navigationBottom);
  await expect(destination).toHaveAttribute("aria-current", "location");
});

test("mobile chapter jumps keep the selected heading below the sticky rail", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/test_15");

  const navigation = page.getByRole("navigation", { name: /chapter|глав/i });
  const destination = navigation.getByRole("link").nth(3);
  const href = await destination.getAttribute("href");
  await destination.click();

  const heading = page.locator(`[id="${href?.slice(1)}"]`).locator("h1, h2").last();
  await expect(heading).toBeInViewport();
  const [headingTop, navigationBottom] = await Promise.all([
    heading.evaluate(element => element.getBoundingClientRect().top),
    navigation.evaluate(element => element.getBoundingClientRect().bottom),
  ]);
  expect(headingTop).toBeGreaterThanOrEqual(navigationBottom);
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
      const chapterRail = navigation?.firstElementChild as HTMLElement | null;
      const railBounds = chapterRail?.getBoundingClientRect();
      const chapterLinks = [...(chapterRail?.querySelectorAll("a") ?? [])];
      const sourceLinks = [...document.querySelectorAll('[data-mobile-issue] a')];
      const bodyCopy = document.querySelector("main p");
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        linkHeights: links.map(link => link.getBoundingClientRect().height),
        chapterRailClientWidth: chapterRail?.clientWidth ?? 0,
        chapterRailScrollWidth: chapterRail?.scrollWidth ?? 0,
        chapterLinksFit: Boolean(railBounds) && chapterLinks.every(link => {
          const bounds = link.getBoundingClientRect();
          return bounds.left >= railBounds!.left && bounds.right <= railBounds!.right &&
            bounds.top >= railBounds!.top && bounds.bottom <= railBounds!.bottom;
        }),
        sourceLinkHeights: sourceLinks.map(link => link.getBoundingClientRect().height),
        bodyFontSize: bodyCopy ? Number.parseFloat(getComputedStyle(bodyCopy).fontSize) : 0,
      };
    });

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.bodyFontSize).toBeGreaterThanOrEqual(16);
    expect(layout.linkHeights.length).toBe(7);
    expect(layout.linkHeights.every(height => height >= 44)).toBe(true);
    expect(layout.sourceLinkHeights.length).toBeGreaterThan(0);
    expect(layout.sourceLinkHeights.every(height => height >= 44)).toBe(true);
    if (viewport.width === 320) {
      expect(layout.chapterRailScrollWidth).toBeLessThanOrEqual(layout.chapterRailClientWidth);
      expect(layout.chapterLinksFit).toBe(true);
    }
  });
}
