import { expect, test } from "@playwright/test";

for (const width of [1440, 768, 390, 320]) {
  test(`concept chapters, brand and links at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/test_8");
    await expect(page.getByTestId("magazine-handoff")).toHaveAttribute("data-stage", "site");
    const chapters = await page.locator("main > section[id]").evaluateAll(nodes => nodes.map(node => node.id));
    expect(chapters).toEqual(["hero", "formats", "next-issue", "field-notes", "archive-2025", "point-of-view", "final-cta"]);
    await expect(page.locator("#hero-title")).toContainText("С кем — важнее.");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("header#start")).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.locator("#hero-title").evaluate(el => getComputedStyle(el).fontFamily)).toContain("TC Golos");
    expect(await page.locator("#hero-title span").evaluate(el => getComputedStyle(el).fontFamily)).toContain("TC Lora");
    expect(await page.locator("[data-concept-home]").evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(243, 242, 238)");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    expect(await page.locator("main").evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    expect(await page.locator('[data-photo-slot="hero-table"]').evaluate(el => Math.abs(el.getBoundingClientRect().height - el.parentElement!.getBoundingClientRect().height))).toBeLessThan(2);
    expect(await page.locator("#next-issue dd").first().evaluate(el => getComputedStyle(el).color)).toBe("rgb(23, 47, 80)");
    expect(await page.locator("#field-note-china figcaption").first().evaluate(el => getComputedStyle(el).color)).toBe("rgb(243, 242, 238)");
    expect(await page.getByText("Независимая редакция ваших путешествий.", { exact: true }).evaluate(el => getComputedStyle(el).fontFamily)).toContain("TC Lora");
    expect(await page.locator("#next-issue a").first().evaluate(el => getComputedStyle(el).fontSize)).toBe("13px");
    const brokenAnchors = await page.locator('a[href^="#"]').evaluateAll(nodes => nodes.map(node => node.getAttribute("href")!).filter(href => !document.getElementById(href.slice(1))));
    expect(brokenAnchors).toEqual([]);
    expect(await page.locator('a[href^="/archive/"]').count()).toBe(0);
    // Full-page capture does not trigger lazy images below the viewport.
    await page.locator("#footer").scrollIntoViewIfNeeded();
    for (const photo of await page.locator("[data-photo-slot]").all()) {
      if (!(await photo.isVisible())) continue;
      await photo.scrollIntoViewIfNeeded();
      await expect(photo.locator("img")).toHaveJSProperty("complete", true);
      expect(await photo.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    }
    await page.locator("#start").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/test-8-concept/${width}.png`, fullPage: true });
  });
}

test("format selection works by keyboard and carries the format to the request", async ({ page }) => {
  await page.goto("/test_8#formats");
  const route = page.getByRole("button", { name: "Выбрать Маршрут — TRAVEL DESIGN" });
  await route.focus();
  await page.keyboard.press("Enter");
  await expect(route).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#tcFormatsSelection")).toContainText("Маршрут / Travel Design");
  await expect(page.locator('a[data-format-cta]')).toHaveAttribute("href", "/start?format=route");
  await page.getByRole("button", { name: "Выбрать В компании — TRAVEL TRIPS" }).click();
  await expect(route).toHaveAttribute("aria-pressed", "false");
  await page.locator('a[data-format-cta]').click();
  await expect(page).toHaveURL(/\/start\?format=group$/);
});

test("magazine handoff opens the new homepage and keeps its photo editor", async ({ page }) => {
  await page.goto("/test_8");
  const root = page.getByTestId("magazine-handoff");
  await expect(root).toHaveAttribute("data-stage", "ready", { timeout: 20000 });
  await expect(page.getByTestId("magazine-scene")).toHaveAttribute("data-leaf-count", "8");
  await page.evaluate(() => scrollTo(0, innerHeight * 1.25));
  await expect(root).toHaveAttribute("data-stage", "site");
  await expect(page.locator("#hero-title")).toBeVisible();
  await page.locator('[data-photo-slot="hero-table"]').click({ button: "right" });
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.evaluate(() => scrollTo(0, 0));
  await expect(root).toHaveAttribute("data-stage", "ready");
});
