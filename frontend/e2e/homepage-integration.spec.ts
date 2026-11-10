import { expect, test, type Page } from "@playwright/test";

const viewportWidths = [375, 768, 1280, 1440];
const responsiveRoutes = ["/", "/test_21", "/formats", "/archive", "/start"];
const testRoutes = ["/test", ...Array.from({ length: 20 }, (_, index) => `/test_${index + 2}`)];

async function homepageSignature(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  return page.locator('[data-editorial-home="test-21"]').evaluate(root => {
    const sections = [...root.querySelectorAll<HTMLElement>("[data-design-section]")];
    const title = root.querySelector<HTMLElement>("h1");
    const hero = root.querySelector<HTMLElement>("[data-page-hero]");

    return {
      sections: sections.map(section => ({
        name: section.dataset.designSection,
        background: getComputedStyle(section).backgroundColor,
        color: getComputedStyle(section).color,
      })),
      photoSlots: [...root.querySelectorAll<HTMLElement>("[data-photo-slot]")].map(slot => slot.dataset.photoSlot),
      title: title?.textContent,
      titleFont: title ? getComputedStyle(title).fontFamily : null,
      titleSize: title ? getComputedStyle(title).fontSize : null,
      heroSize: hero ? { width: hero.getBoundingClientRect().width, height: hero.getBoundingClientRect().height } : null,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
}

test("/ renders the same Test21 experience directly with public metadata", async ({ page }) => {
  let rootMetadata: { title: string; description: string } | undefined;

  for (const width of viewportWidths) {
    await page.setViewportSize({ width, height: 900 });

    const rootResponse = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(rootResponse?.status()).toBe(200);
    expect(rootResponse?.request().redirectedFrom()).toBeNull();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('[data-editorial-home="test-21"]')).toBeVisible();
    await expect(page.locator('[data-photo-slot="hero-terrace"]')).toBeVisible();

    const title = await page.title();
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(title).toContain("Travel Club");
    expect(description).toBeTruthy();
    expect(description).not.toBe("Путешествия, продуманные в деталях");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index, follow/);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical && new URL(canonical, page.url()).pathname).toBe("/");
    rootMetadata = { title, description: description! };
    const rootSignature = await homepageSignature(page);
    expect(rootSignature.overflow).toBe(false);

    const test21Response = await page.goto("/test_21", { waitUntil: "domcontentloaded" });
    expect(test21Response?.status()).toBe(200);
    expect(test21Response?.request().redirectedFrom()).toBeNull();
    await expect(page).toHaveURL(/\/test_21$/);
    await expect(page.locator('[data-editorial-home="test-21"]')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, nofollow/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    expect({ title: await page.title(), description: await page.locator('meta[name="description"]').getAttribute("content") }).toEqual(rootMetadata);
    expect(await homepageSignature(page)).toEqual(rootSignature);
  }
});

test("existing test routes remain directly available", async ({ page }) => {
  for (const route of testRoutes) {
    const response = await page.request.get(route, { maxRedirects: 0 });
    expect(response.status(), `${route} should respond without a redirect`).toBe(200);
  }
});

test("public pages have no horizontal overflow at supported widths", async ({ page }) => {
  for (const width of viewportWidths) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of responsiveRoutes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
        `${route} should fit a ${width}px viewport`,
      ).toBe(true);
    }
  }
});
