import { expect, test } from "@playwright/test";

test("direct selection preserves the page and URL without reloading", async ({ page }) => {
  await page.goto("/test_9?hero=4");
  await expect(page.locator("#hero")).toHaveAttribute("data-hero", "4");
  await page.getByRole("button", { name: "Выбрать Маршрут — TRAVEL DESIGN" }).click();
  await page.getByRole("button", { name: "Hero 08", exact: true }).click();
  await expect(page.locator("#hero")).toHaveAttribute("data-hero", "8");
  await expect(page).toHaveURL(/hero=8/);
  await expect(page.locator("[data-format='route']")).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "HIDE CONTROLS", exact: true }).click();
  await expect(page.getByRole("region", { name: "Hero exploration controls" })).toBeHidden();
  await page.getByRole("button", { name: "SHOW CONTROLS", exact: true }).click();
  await expect(page.getByRole("region", { name: "Hero exploration controls" })).toBeVisible();
});

for (const width of [390, 768, 1440, 1920]) {
  test(`twenty heroes: content, assets, CTA and bounds at ${width}px`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 1080 });
    await page.goto("/test_9?hero=1");
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    for (let id = 1; id <= 20; id++) {
      await page.getByRole("button", { name: `Hero ${String(id).padStart(2, "0")}`, exact: true }).click();
      const hero = page.locator("#hero");
      await expect(hero).toHaveAttribute("data-hero", String(id));
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(hero.locator("h1")).toHaveText("Куда — важно.С кем — важнее.");
      await expect(hero).toContainText("Создаём индивидуальные маршруты, организуем путешествия под ключ и собираем небольшие компании для совместных поездок.");
      await expect(hero.getByRole("link", { name: "Обсудить поездку" })).toHaveAttribute("href", "/start");
      await expect(hero.getByRole("link", { name: "Наши форматы" })).toHaveAttribute("href", "#formats");
      const logo = hero.getByRole("img", { name: "Travel Club", exact: true });
      await expect(logo).toBeVisible();
      await expect(logo).toHaveAttribute("src", /TC_Logo_Editorial_Signature_(Navy|Cream)\.svg/);
      await page.evaluate(() => document.fonts.ready);
      for (const img of await hero.locator("img").all()) {
        await expect(img).toHaveJSProperty("complete", true);
        expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      expect(await hero.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
      const geometry = await hero.evaluate(el => {
        const hero = el.getBoundingClientRect();
        const title = el.querySelector("h1")!.getBoundingClientRect();
        const logo = el.querySelector("[data-page-masthead]")!.getBoundingClientRect();
        return { width: hero.width, left: hero.left, logo: logo.width, titleFits: title.left >= hero.left && title.right <= hero.right + 1 };
      });
      expect(geometry.titleFits).toBe(true);
      expect(geometry.logo).toBeGreaterThan(100);
      expect(geometry.width).toBe(Math.min(width - (width <= 760 ? 36 : 80), 1440));
      if (width === 1920) expect(geometry.left).toBe(240);
      if (id >= 11) {
        const overlay = await hero.locator("[data-placement]").evaluate(frame => {
          const figure = frame.querySelector("figure")!;
          const image = figure.querySelector("img")!;
          const logo = frame.querySelector("[data-page-masthead]")!;
          const title = frame.querySelector("#hero-title")!;
          const photoBox = figure.getBoundingClientRect();
          const logoBox = logo.getBoundingClientRect();
          const titleBox = title.getBoundingClientRect();
          return {
            photoRatio: photoBox.width / photoBox.height,
            imageRatio: (image as HTMLImageElement).naturalWidth / (image as HTMLImageElement).naturalHeight,
            imageFit: getComputedStyle(image).objectFit,
            logoInside: logoBox.left >= photoBox.left && logoBox.right <= photoBox.right && logoBox.top >= photoBox.top && logoBox.bottom <= photoBox.bottom,
            titleInside: titleBox.left >= photoBox.left && titleBox.right <= photoBox.right && titleBox.top >= photoBox.top && titleBox.bottom <= photoBox.bottom,
            separated: logoBox.right <= titleBox.left || titleBox.right <= logoBox.left || logoBox.bottom <= titleBox.top || titleBox.bottom <= logoBox.top,
            logoRect: [logoBox.x, logoBox.y, logoBox.width, logoBox.height],
            titleRect: [titleBox.x, titleBox.y, titleBox.width, titleBox.height],
          };
        });
        expect(Math.abs(overlay.photoRatio - overlay.imageRatio)).toBeLessThan(0.01);
        expect(overlay.imageFit).toBe("contain");
        expect(overlay.logoInside).toBe(true);
        expect(overlay.titleInside).toBe(true);
        expect(overlay.separated, `Hero ${id} logo and tagline overlap at ${width}px: ${JSON.stringify(overlay)}`).toBe(true);
      }
    }
    expect(errors).toEqual([]);
  });
}

test("unchanged chapters match the baseline, including selected state and editor", async ({ page }) => {
  await page.goto("/test_8#start");
  const baseline = await page.locator("main > section:not(#hero)").evaluateAll(nodes => nodes.map(el => el.outerHTML));
  const header = await page.locator("header#start").innerHTML();
  const footer = await page.locator("footer").innerHTML();
  await page.goto("/test_9?hero=6");
  const comparison = await page.locator("main > section:not(#hero)").evaluateAll(nodes => nodes.map(el => el.outerHTML));
  // CSS module hashes differ because the snapshot is isolated; all markup and
  // copy must otherwise match the baseline exactly.
  const normalize = (html: string) => html.replace(/class="[^"]*"/g, "");
  expect(comparison.map(normalize)).toEqual(baseline.map(normalize));
  expect(normalize(await page.locator("header#start").innerHTML())).toBe(normalize(header));
  expect(normalize(await page.locator("footer").innerHTML())).toBe(normalize(footer));
  await page.locator('[data-photo-slot="formats-table"]').click({ button: "right" });
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.locator("#hero").getByRole("link", { name: "Наши форматы" }).click();
  await expect(page).toHaveURL(/#formats$/);
  await expect(page.locator("#formats")).toBeInViewport();
});

test("URL parsing, browser history and clipboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/test_9?hero=bogus");
  await expect(page.locator("#hero")).toHaveAttribute("data-hero", "1");
  await page.getByRole("button", { name: "Previous Hero" }).click();
  await expect(page.locator("#hero")).toHaveAttribute("data-hero", "20");
  await page.getByRole("button", { name: "Next Hero" }).click();
  await expect(page.locator("#hero")).toHaveAttribute("data-hero", "1");
  await page.goBack();
  await expect(page.locator("#hero")).toHaveAttribute("data-hero", "20");
  await page.getByRole("button", { name: "COPY LINK ↗" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/test_9\?hero=20$/);
  await page.reload();
  await expect(page.locator("#hero")).toHaveAttribute("data-hero", "20");
  await page.goto("/test_9?hero=2&hero=8");
  await expect(page.locator("#hero")).toHaveAttribute("data-hero", "1");
  await page.getByRole("button", { name: "Hero 03", exact: true }).click();
  await page.goBack();
  await expect(page.locator("#hero")).toHaveAttribute("data-hero", "1");
});

test("the original Living Issue handoff and reverse work with a new hero", async ({ page }) => {
  await page.goto("/test_9?hero=2&view=issue");
  const root = page.getByTestId("magazine-handoff");
  await expect(root).toHaveAttribute("data-stage", "ready", { timeout: 20000 });
  await expect(page.getByTestId("magazine-scene")).toHaveAttribute("data-leaf-count", "8");
  await page.evaluate(() => scrollTo(0, innerHeight * 1.25));
  await expect(root).toHaveAttribute("data-stage", "site");
  await expect(page.locator("#hero-title")).toBeVisible();
  await page.evaluate(() => scrollTo(0, 0));
  await expect(root).toHaveAttribute("data-stage", "ready");
});

for (const width of [390, 1440]) {
  test(`Living Issue supports all twenty live compositions at ${width}px`, async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/test_9?hero=1&view=issue");
    const root = page.getByTestId("magazine-handoff");
    await expect(root).toHaveAttribute("data-stage", "ready", { timeout: 20000 });
    for (let id = 1; id <= 20; id++) {
      await page.getByRole("button", { name: `Hero ${String(id).padStart(2, "0")}`, exact: true }).click();
      await page.getByRole("button", { name: "HIDE CONTROLS", exact: true }).click();
      await expect(page.locator("#hero")).toHaveAttribute("data-hero", String(id));
      await expect(page.locator("main")).toHaveCount(1);
      await page.evaluate(() => document.fonts.ready);
      for (const img of await page.locator("#hero img").all()) await img.evaluate((el: HTMLImageElement) => el.decode());
      await page.screenshot({ path: `../docs/qa/test-9/issue-${width}-${String(id).padStart(2, "0")}.png`, style: "button[class*='show'] { visibility: hidden; }" });
      await page.evaluate(() => scrollTo(0, innerHeight * 1.25));
      await expect(root).toHaveAttribute("data-stage", "site");
      await expect(page.locator("#hero-title")).toBeVisible();
      await page.evaluate(() => scrollTo(0, 0));
      await expect(root).toHaveAttribute("data-stage", "ready");
      await page.getByRole("button", { name: "SHOW CONTROLS", exact: true }).click();
    }
  });
}

test("static hero works without JavaScript and bad query values fall back", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/test_9?hero=8");
  await expect(page.locator("#hero")).toHaveAttribute("data-hero", "8");
  await expect(page.locator("#hero-title")).toBeVisible();
  await expect(page.locator("#hero").getByRole("link", { name: "Обсудить поездку" })).toHaveAttribute("href", "/start");
  await page.goto("/test_9?hero=2&hero=8");
  await expect(page.locator("#hero")).toHaveAttribute("data-hero", "1");
  await context.close();
});

test("late-loading photographs never shift the hero or following chapter", async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (let id = 1; id <= 20; id++) {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const photos = /\/_next\/image\?.*url=%2Ftest_9%2F/;
    await page.route(photos, async route => { await gate; await route.continue(); });
    await page.goto(`/test_9?hero=${id}`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);
    const measure = () => page.locator("#hero, #hero-title, #formats").evaluateAll(nodes => nodes.map(el => {
      const box = el.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }));
    const before = await measure();
    release();
    for (const img of await page.locator("#hero img").all()) await img.evaluate((el: HTMLImageElement) => el.decode());
    expect(await measure()).toEqual(before);
    await page.unroute(photos);
  }
});
