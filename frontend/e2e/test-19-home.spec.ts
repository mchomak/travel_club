import { expect, test } from "@playwright/test";

for (const width of [1920, 1440, 1024, 768, 390, 320]) {
  test(`vertical editorial home at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto("/test_19");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("С кем — важнее.");
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("canvas, [inert], [data-magazine-page], [data-testid='magazine-handoff']")).toHaveCount(0);
    expect(await page.locator("main > section[id]").evaluateAll(nodes => nodes.map(node => node.id))).toEqual([
      "hero", "formats", "next-issue", "field-notes", "archive-2025", "point-of-view", "final-cta",
    ]);
    // An interaction also confirms hydration before screenshots alter input caret styles.
    await page.locator('[data-format="route"]').click();
    await expect(page.locator('[data-format="route"]')).toHaveAttribute("aria-pressed", "true");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('[data-format="route"]')).toContainText("от 5 000 ₽");
    await expect(page.locator('[data-format="complete"]')).toContainText("от 10 000 ₽");
    await expect(page.locator('[data-format="group"]')).toContainText("По согласованию");
    await expect(page.getByRole("heading", { name: "THAILAND ’26", exact: true })).toHaveCount(1);
    expect(await page.locator("#field-note-thailand").evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(18, 61, 48)");
    expect(await page.locator("#next-issue").evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(185, 54, 37)");
    const artwork = await page.request.get("/test_19/travel-club-navy.svg");
    expect(artwork.ok()).toBe(true);
    expect(await artwork.text()).toContain('fill="#214C78"');
    for (const asset of ["thai-mask.png", "land-mask.png"]) expect((await page.request.get(`/test_19/${asset}`)).ok()).toBe(true);
    const broken = await page.locator('a[href^="#"]').evaluateAll(nodes => nodes.map(node => node.getAttribute("href")!).filter(href => !document.getElementById(href.slice(1))));
    expect(broken).toEqual([]);
    // Compare ink bounds, not flex-box bounds: both words should have equal optical width.
    const lettering = await page.locator('[aria-label="Next Issue"] > span').evaluateAll(nodes => nodes.map(node => {
      const range = document.createRange(); range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width };
    }));
    expect(lettering[1].left).toBeGreaterThan(lettering[0].left + 10);
    expect(Math.abs(lettering[0].width - lettering[1].width) / lettering[0].width).toBeLessThan(.025);
    // Visit lazy images before checking for missing photos and capturing the full document.
    for (const photo of await page.locator("[data-photo-slot]").all()) {
      if (!await photo.isVisible()) continue;
      await photo.scrollIntoViewIfNeeded();
      await expect.poll(() => photo.locator("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    expect(await page.locator("main").evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    await page.evaluate(() => scrollTo(0, 0));
    await expect(page.locator("header#start")).toBeInViewport();
    await page.mouse.wheel(0, 700);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(400);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `test-results/test-19/${width}-home.png`, fullPage: true });
    for (const section of ["hero", "formats", "next-issue", "field-note-thailand", "field-note-china", "archive-2025", "point-of-view", "final-cta", "footer"]) {
      await page.locator(`#${section}`).screenshot({ path: `test-results/test-19/${width}-${section}.png` });
    }
    expect(errors).toEqual([]);
  });
}

test("keyboard choice carries the selected service to the conversation", async ({ page }) => {
  await page.goto("/test_19#formats");
  const route = page.getByRole("button", { name: "Выбрать Маршрут — TRAVEL DESIGN" });
  await route.focus();
  await page.keyboard.press("Enter");
  await expect(route).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("a[data-format-cta]")).toHaveAttribute("href", "/start?format=route");
  await page.getByRole("button", { name: "Выбрать Под ключ — TRAVEL READY" }).focus();
  await page.keyboard.press("Space");
  await expect(route).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("a[data-format-cta]")).toHaveAttribute("href", "/start?format=complete");
  await page.locator("a[data-format-cta]").click();
  await expect(page).toHaveURL(/\/start\?format=complete$/);
});

for (const width of [1440, 390]) {
  test(`photo edits persist independently of test_8 at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/test_19");
    const frame = page.locator('[data-photo-slot="hero-table"]');
    const photo = frame.locator("img");
    const stock = await photo.getAttribute("src");
    await frame.getByRole("button").click();
    const menu = page.getByRole("menu", { name: "Фотография" });
    await expect(menu).toBeVisible();
    const chooser = page.waitForEvent("filechooser");
    await menu.getByRole("menuitem", { name: "Заменить фото", exact: true }).click();
    const data = await page.evaluate(() => {
      const canvas = document.createElement("canvas"); canvas.width = 600; canvas.height = 400;
      const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#214c78"; ctx.fillRect(0, 0, 600, 400);
      return canvas.toDataURL("image/png").split(",")[1];
    });
    await (await chooser).setFiles({ name: "photo.png", mimeType: "image/png", buffer: Buffer.from(data, "base64") });
    const dialog = page.getByRole("dialog", { name: "Кадрирование фото" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Сохранить фото", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(photo).toHaveAttribute("src", /^blob:/);
    await page.reload();
    await expect(photo).toHaveAttribute("src", /^blob:/);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/test_8#start");
    await expect(page.locator('[data-photo-slot="hero-table"] img')).not.toHaveAttribute("src", /^blob:/);
    await page.goto("/test_19");
    await expect(photo).toHaveAttribute("src", /^blob:/);
    await frame.getByRole("button").click();
    await page.getByRole("menuitem", { name: "Вернуть исходное фото" }).click();
    await expect(photo).toHaveAttribute("src", stock!);
  });
}

test("reduced motion and direct anchors retain a normal document", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_19#next-issue");
  await expect(page.locator("#next-issue")).toBeInViewport();
  await page.getByRole("link", { name: "Хочу в компанию" }).click();
  await expect(page).toHaveURL(/\/start\?format=group$/);
});
