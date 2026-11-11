import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/formats",
  "/services/route",
  "/services/turnkey",
  "/tours",
  "/payment",
  "/archive",
  "/start",
  "/thanks",
  "/legal",
  "/privacy",
  "/personal-data",
  "/a-page-outside-the-route",
] as const;

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "mobile large", width: 430, height: 932 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
  { name: "desktop large", width: 1440, height: 900 },
] as const;

test("all public routes keep their landmarks and fit the five supported viewports", async ({ page }) => {
  test.setTimeout(180_000);
  for (const route of publicRoutes) {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const response = await page.goto(route);
      expect(response?.status(), `${route} at ${viewport.name}`).toBe(route === "/a-page-outside-the-route" ? 404 : 200);

      await expect(page.getByRole("banner"), `${route} at ${viewport.name}: one shared header`).toHaveCount(1);
      await expect(page.getByRole("main"), `${route} at ${viewport.name}: one main landmark`).toHaveCount(1);
      await expect(page.getByRole("contentinfo"), `${route} at ${viewport.name}: one shared footer`).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 }), `${route} at ${viewport.name}: one page heading`).toHaveCount(1);

      const layout = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        fontFamily: getComputedStyle(document.body).fontFamily,
      }));
      expect(layout.document, `${route} at ${viewport.name}: document overflow`).toBeLessThanOrEqual(layout.viewport);
      expect(layout.body, `${route} at ${viewport.name}: body overflow`).toBeLessThanOrEqual(layout.viewport);
      expect(layout.fontFamily, `${route} at ${viewport.name}: approved Website font`).toContain("Travel Club Lato");

      const visibleContentImages = page.locator('img[alt]:not([alt=""]), [data-photo-slot] img, img[data-public-photo]').filter({ visible: true });
      for (const image of await visibleContentImages.all()) {
        await image.scrollIntoViewIfNeeded();
        const source = await image.getAttribute("src");
        const isLocalPhoto = await image.evaluate(element => Boolean(
          element.closest("[data-photo-slot]") || element.hasAttribute("data-public-photo"),
        ));
        if (isLocalPhoto) {
          expect(source, route + " at " + viewport.name + ": local photo is served directly").toMatch(/^\/website\/assets\/photos\//);
          const isPreloaded = await image.evaluate(element => (
            element.closest('[data-photo-slot="hero-terrace"]') !== null
            || element.hasAttribute("data-public-photo-preload")
          ));
          if (!isPreloaded) {
            await expect(image, route + " at " + viewport.name + ": local photo remains lazy").toHaveAttribute("loading", "lazy");
          }
        }
        await expect.poll(async () => image.evaluate((element) => {
          const img = element as HTMLImageElement;
          return img.complete && img.naturalWidth > 0;
        }), {
          timeout: 10_000,
          message: `${route} at ${viewport.name}: content image loads after scrolling into view (${source ?? "no src"})`,
        }).toBe(true);
      }
    }
  }
});

test("mobile navigation opens, closes with Escape, and remains keyboard operable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/formats");

  // The accessible label changes to “Закрыть меню” while open, so keep a stable locator.
  const toggle = page.locator('button[aria-controls="public-site-navigation"]');
  const navigation = page.getByRole("navigation", { name: "Основная навигация", exact: true });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link")).toHaveCount(4);

  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await expect(navigation).toBeHidden();

  await toggle.click();
  await navigation.getByRole("link", { name: "Архив", exact: true }).click();
  await expect(page).toHaveURL(/\/archive$/);
  await expect(page.getByRole("main")).toBeVisible();
});

test("footer is compact, clearly separated, and removes the design-study label", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/formats");

  const footer = page.getByRole("contentinfo");
  await expect(footer).toHaveCount(1);
  await expect(footer).not.toContainText("DESIGN STUDY / 20");

  const appearance = await page.evaluate(() => {
    const footer = document.querySelector("footer");
    const main = document.querySelector("main");
    const lastSection = main?.lastElementChild;
    const footerStyle = footer ? getComputedStyle(footer) : null;
    const sectionStyle = lastSection ? getComputedStyle(lastSection) : null;
    return {
      height: footer?.getBoundingClientRect().height ?? 0,
      footerTopWidth: Number.parseFloat(footerStyle?.borderTopWidth ?? "0"),
      footerTopColor: footerStyle?.borderTopColor ?? "",
      sectionBottomWidth: Number.parseFloat(sectionStyle?.borderBottomWidth ?? "0"),
      sectionBottomColor: sectionStyle?.borderBottomColor ?? "",
      footerTextColor: footerStyle?.color ?? "",
    };
  });

  expect(appearance.height, "25% reduction from the 452.78px baseline").toBeLessThanOrEqual(340);
  expect(appearance.footerTopWidth + appearance.sectionBottomWidth, "one divider at the footer seam").toBe(1);
  const dividerColor = appearance.footerTopWidth > 0 ? appearance.footerTopColor : appearance.sectionBottomColor;
  expect(dividerColor, "divider uses the approved navy footer color").toBe(appearance.footerTextColor);
});
