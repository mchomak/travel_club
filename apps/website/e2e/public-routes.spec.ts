import { expect, test } from "@playwright/test";
import { resolve } from "node:path";

const publicRoutes = [
  "/", "/formats", "/archive", "/start", "/thanks", "/legal", "/privacy", "/personal-data",
  "/payment", "/services/route", "/services/turnkey", "/tours",
];
const placeholderRoutes = ["/payment", "/services/route", "/services/turnkey", "/tours"];

test("all active public routes load with the Website font and without legacy test links", async ({ page }) => {
  const failedAssets: string[] = [];
  page.on("response", response => {
    if (response.url().includes("/_app/website/_next/") && response.status() >= 400) failedAssets.push(response.url());
  });
  for (const route of publicRoutes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("body")).not.toBeEmpty();
    const appRoot = page.locator("[data-publication-root], [data-editorial-home='website'], body").first();
    expect(await appRoot.evaluate(element => getComputedStyle(element).fontFamily), route).toContain("Travel Club Lato");
    const tokens = await page.evaluate(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden";
      probe.style.backgroundColor = "var(--pub-color-cloud)";
      probe.style.fontSize = "var(--pub-type-body-size)";
      probe.style.paddingLeft = "var(--pub-space-l)";
      document.body.append(probe);
      const aliases = getComputedStyle(probe);
      const result = {
        paper: rootStyle.getPropertyValue("--tc-paper").trim(),
        font: rootStyle.getPropertyValue("--tc-font-sans").trim(),
        aliasPaper: aliases.backgroundColor,
        aliasBodySize: aliases.fontSize,
        aliasSpacing: aliases.paddingLeft,
      };
      probe.style.backgroundColor = "var(--tc-paper)";
      probe.style.fontSize = "var(--tc-size-body)";
      probe.style.paddingLeft = "var(--tc-space-6)";
      const approved = getComputedStyle(probe);
      const approvedValues = {
        approvedPaper: approved.backgroundColor,
        approvedBodySize: approved.fontSize,
        approvedSpacing: approved.paddingLeft,
      };
      probe.remove();
      return { ...result, ...approvedValues };
    });
    expect(tokens.paper.toLowerCase(), route).toBe("#f5f0dc");
    expect(tokens.font, route).toContain("Travel Club Lato");
    expect(tokens.aliasPaper, route).toBe(tokens.approvedPaper);
    expect(tokens.aliasBodySize, route).toBe(tokens.approvedBodySize);
    expect(tokens.aliasSpacing, route).toBe(tokens.approvedSpacing);
    const websiteFontLoaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return Array.from(document.fonts).some(face => face.family === "Travel Club Lato" && face.status === "loaded");
    });
    expect(websiteFontLoaded, route).toBe(true);
    if (route === "/") {
      const homeHero = page.locator("[data-photo-slot='hero-terrace'] img");
      await expect(homeHero).toHaveAttribute("src", /\/_app\/website\/_next\/image\?/);
      await expect.poll(() => homeHero.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    const legacyLinks = await page.locator("a[href]").evaluateAll(links => links
      .map(link => (link as HTMLAnchorElement).getAttribute("href") ?? "")
      .filter(href => /^\/test(?:_\d+)?(?:\/|$)/.test(href)));
    expect(legacyLinks, route).toEqual([]);
  }
  expect(failedAssets).toEqual([]);
});

test("the former test routes resolve to the branded not-found page", async ({ page }) => {
  const routes = ["/test", ...Array.from({ length: 21 }, (_, index) => `/test_${index + 1}`)];
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(404);
    await expect(page.getByText("СТРАНИЦА НЕ НАЙДЕНА")).toBeVisible();
  }
});

test("the required contact completes the start-to-thanks flow", async ({ page }) => {
  await page.goto("/start");
  await page.getByRole("textbox", { name: "Ваш контакт — обязательно" }).fill("@travel_club");
  await page.getByRole("button", { name: /Продолжить/ }).click();
  await expect(page).toHaveURL(/\/thanks$/);
  await expect(page.getByRole("heading", { name: /Демонстрация завершена/ })).toBeVisible();
  await expect(page.getByText("Данные не отправлены и не сохранены.")).toBeVisible();
});

test("the home photo editor saves, reloads, and resets an IndexedDB image", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator('[data-photo-slot="hero-terrace"]');
  const image = hero.locator("img");
  await expect(image).toHaveAttribute("src", /\/_app\/website\/_next\/image\?/);

  await hero.getByRole("button", { name: /Редактировать фото/ }).click();
  await page.getByRole("menuitem", { name: "Заменить фото" }).click();
  await page.getByLabel("Выберите фото").setInputFiles(resolve("public/website/assets/photos/beijing-hutong.jpg"));

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const save = dialog.getByRole("button", { name: "Сохранить фото" });
  await expect(save).toBeEnabled();
  await save.click();
  await expect(dialog).toBeHidden();
  await expect.poll(() => image.getAttribute("src")).toMatch(/^blob:/);

  await page.reload();
  await expect.poll(() => image.getAttribute("src")).toMatch(/^blob:/);
  await hero.getByRole("button", { name: /Редактировать фото/ }).click();
  await page.getByRole("menuitem", { name: "Вернуть исходное фото" }).click();
  await expect.poll(() => image.getAttribute("src")).toMatch(/\/_app\/website\/_next\/image\?/);

  await page.reload();
  await expect(image).toHaveAttribute("src", /\/_app\/website\/_next\/image\?/);
});

test("placeholder pages use Website font, color, type, and spacing tokens", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  for (const route of placeholderRoutes) {
    await page.goto(route);
    const values = await page.evaluate(() => {
      const layout = document.querySelector("[data-public-layout]");
      const heading = document.querySelector("main h1");
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden";
      probe.style.fontSize = "var(--pub-type-h1-size)";
      probe.style.width = "var(--pub-layout-page-padding)";
      probe.style.color = "var(--pub-color-brand-blue)";
      probe.style.backgroundColor = "var(--pub-color-cloud)";
      document.body.append(probe);
      const computed = {
        headingFont: heading ? getComputedStyle(heading).fontFamily : "",
        headingSize: heading ? getComputedStyle(heading).fontSize : "",
        tokenSize: getComputedStyle(probe).fontSize,
        headingColor: heading ? getComputedStyle(heading).color : "",
        tokenColor: getComputedStyle(probe).color,
        layoutSpacing: layout ? getComputedStyle(layout).paddingLeft : "",
        tokenSpacing: getComputedStyle(probe).width,
        background: getComputedStyle(document.body).backgroundColor,
        tokenBackground: getComputedStyle(probe).backgroundColor,
      };
      probe.remove();
      return computed;
    });
    expect(values.headingFont, route).toContain("Travel Club Lato");
    expect(values.headingSize, route).toBe(values.tokenSize);
    expect(values.headingColor, route).toBe(values.tokenColor);
    expect(values.layoutSpacing, `${route}: ${JSON.stringify(values)}`).toBe(values.tokenSpacing);
    expect(values.background, route).toBe(values.tokenBackground);
  }
});
