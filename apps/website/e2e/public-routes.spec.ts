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
    const url = response.url();
    if ((url.includes("/_app/website/_next/") || url.includes("/website/assets/photos/")) && response.status() >= 400) {
      failedAssets.push(url);
    }
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
      await expect(homeHero).toHaveAttribute("src", "/website/assets/photos/vietnam_mu_cang_chai.webp");
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

test("a mocked lead submission verifies before showing the thank-you state", async ({ page }) => {
  const submissions: Record<string, unknown>[] = [];
  let receiptChecks = 0;
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith("/api/leads") && request.method() === "POST") {
      submissions.push(JSON.parse(request.postData() ?? "{}") as Record<string, unknown>);
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ lead_number: "TC-000123", receipt_token: "ui-test-receipt" }) });
      return;
    }
    if (url.pathname.endsWith("/api/leads/receipt") && request.method() === "GET") {
      receiptChecks += 1;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ lead_number: "TC-000123" }) });
      return;
    }
    if (request.method() !== "GET") {
      await route.abort();
      return;
    }
    await route.continue();
  });

  await page.goto("/start?format=group&source=formats");
  const form = page.getByRole("form", { name: "Заявка на поездку", exact: true });
  const product = form.getByLabel("Что вам интересно?");
  await expect(product).toHaveValue("group");
  await product.selectOption("moscow_guide");
  await form.getByLabel("Предпочтительный способ связи").selectOption("telegram");
  await form.getByLabel("Контакт").fill("@travel_club");
  await form.getByRole("checkbox", { name: /Согласен/ }).check();

  await form.getByRole("button", { name: "Отправить заявку", exact: true }).click();
  await expect(page).toHaveURL(/\/thanks\?receipt=ui-test-receipt$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Спасибо");
  await expect(page.getByText("Заявка сохранена. Команда свяжется с вами выбранным способом.")).toBeVisible();
  await expect(page.getByText("TC-000123")).toBeVisible();
  expect(submissions).toHaveLength(1);
  expect(submissions[0]).toMatchObject({
    product_id: "moscow_guide",
    contact_method: "telegram",
    contact_value: "@travel_club",
    source: "formats",
    consent: true,
  });
  expect(receiptChecks).toBeGreaterThanOrEqual(1);
});

test("direct thanks visits stay neutral and failed submissions remain on the form", async ({ page }) => {
  await page.goto("/thanks");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("проверить заявку");
  await expect(page.getByText(/Заявка сохранена/)).toHaveCount(0);

  await page.route("**/api/leads", async (route) => {
    expect(route.request().method()).toBe("POST");
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ detail: "Database connection failed" }) });
  });
  await page.goto("/start");
  const form = page.getByRole("form", { name: "Заявка на поездку", exact: true });
  await form.getByLabel("Что вам интересно?").selectOption("undecided");
  await form.getByLabel("Предпочтительный способ связи").selectOption("email");
  await form.getByLabel("Контакт").fill("private_failure@example.test");
  await form.getByRole("checkbox", { name: /Согласен/ }).check();
  await form.getByRole("button", { name: "Отправить заявку", exact: true }).click();
  await expect(page).toHaveURL(/\/start$/);
  await expect(form.getByRole("alert")).toContainText("Ваши ответы остались в форме");
  await expect(form.getByLabel("Контакт")).toHaveValue("private_failure@example.test");
  await expect(page.getByText(/Заявка сохранена/)).toHaveCount(0);
});

test("the home photo editor saves, reloads, and resets an IndexedDB image", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator('[data-photo-slot="hero-terrace"]');
  const image = hero.locator("img");
  await expect(image).toHaveAttribute("src", "/website/assets/photos/vietnam_mu_cang_chai.webp");

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
  await expect.poll(() => image.getAttribute("src")).toBe("/website/assets/photos/vietnam_mu_cang_chai.webp");

  await page.reload();
  await expect(image).toHaveAttribute("src", "/website/assets/photos/vietnam_mu_cang_chai.webp");
});

test("placeholder pages use Website font, color, type, and spacing tokens", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  for (const route of placeholderRoutes) {
    await page.goto(route);
    const values = await page.evaluate(() => {
      const layout = document.querySelector("[data-public-container=standard]");
      const heading = document.querySelector("main h1");
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden";
      probe.style.fontSize = "var(--pub-type-h1-size)";
      probe.style.width = "calc(var(--tc-container-gutter-wide) / 2)";
      probe.style.color = "var(--pub-color-brand-blue)";
      probe.style.backgroundColor = "var(--pub-color-cloud)";
      document.body.append(probe);
      const computed = {
        headingFont: heading ? getComputedStyle(heading).fontFamily : "",
        headingSize: heading ? getComputedStyle(heading).fontSize : "",
        tokenSize: getComputedStyle(probe).fontSize,
        headingColor: heading ? getComputedStyle(heading).color : "",
        tokenColor: getComputedStyle(probe).color,
        layoutSpacing: layout ? `${Math.round(layout.getBoundingClientRect().left)}px` : "",
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
