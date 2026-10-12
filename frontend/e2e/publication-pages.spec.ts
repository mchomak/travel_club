import { mkdir } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { BASE_TOKENS } from "../src/components/design-system/tokens";
import { createSiteVariables } from "../src/components/public-site/site-tokens";

const publicationPages = [
  { path: "/formats", title: /Три способа\s*путешествовать/, status: 200 },
  { path: "/archive", title: "Истории до начала клуба.", status: 200 },
  { path: "/start", title: /Начнём\s*с разговора\./, status: 200 },
  { path: "/thanks", title: /Демонстрация\s*завершена/, status: 200 },
  { path: "/legal", title: /Документы/, status: 200 },
  { path: "/privacy", title: "Политика конфиденциальности", status: 200 },
  { path: "/personal-data", title: "Обработка персональных данных", status: 200 },
  { path: "/a-page-outside-the-route", title: /Этой страницы\s*нет в маршруте\./, status: 404 },
] as const;
const headerLinks = ["/formats", "/archive", "/start"];
const footerLinks = [...headerLinks, "/legal", "/privacy", "/personal-data", "/thanks"];

async function loadAllImages(page: Page) {
  // Visit the real document flow so browser-native lazy images also get checked.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * .8) {
      window.scrollTo(0, y);
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    }
    window.scrollTo(0, 0);
    await document.fonts.ready;
  });
  await expect.poll(() => page.locator("[data-publication-root] img").evaluateAll(images => images.every(image => {
    const photo = image as HTMLImageElement;
    return photo.complete && photo.naturalWidth > 0 && !!photo.alt.trim();
  }))).toBe(true);
}

for (const width of [1440, 1280, 768, 390]) {
  for (const publication of publicationPages) {
    test(`publication ${publication.path} at ${width}: semantics, images, layout and screenshot`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => {
        if (message.type() !== "error") return;
        // Chromium reports the intentionally unknown document's HTTP 404.
        if (publication.status === 404 && message.location().url.endsWith(publication.path) && /404/.test(message.text())) return;
        errors.push(message.text());
      });
      const response = await page.goto(publication.path);
      expect(response?.status()).toBe(publication.status);
      await expect(page.locator("[data-publication-root]")).toHaveCount(1);
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(publication.title);
      expect(await page.getByRole("navigation", { name: "Основная навигация" }).locator("a").evaluateAll(links => links.map(link => link.getAttribute("href")))).toEqual(headerLinks);
      expect(await page.getByRole("navigation", { name: "Все страницы сайта" }).locator("a").evaluateAll(links => links.map(link => link.getAttribute("href")))).toEqual(footerLinks);
      await loadAllImages(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      if (["/privacy", "/personal-data"].includes(publication.path)) {
        await expect(page.getByRole("heading", { name: /Документ находится в подготовке/ })).toContainText("Не является действующим документом.");
      }
      await mkdir("test-results/publication", { recursive: true });
      await page.screenshot({ path: `test-results/publication/${publication.path.slice(1)}-${width}.png`, fullPage: true });
      expect(errors).toEqual([]);
    });
  }
}

test("one scoped token set changes real serif, h1, body and Cloud on every publication page", async ({ page }) => {
  test.setTimeout(60_000);
  const tokens = structuredClone(BASE_TOKENS);
  tokens.typography.h1.desktopSize = 37;
  tokens.typography.h1.mobileSize = 29;
  tokens.typography.body.desktopSize = 19;
  tokens.typography.body.mobileSize = 17;
  tokens.colors.cloud = "#e1eadf";
  const variables = { ...createSiteVariables(tokens), "--pub-font-serif": "Georgia, serif" } as Record<string, string | number>;
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const publication of publicationPages) {
      await page.goto(publication.path);
      const actual = await page.locator("[data-publication-root]").evaluate((root, { allowInheritedBody, variables }) => {
        const element = root as HTMLElement;
        const h1 = element.querySelector("main h1")!;
        const bodyParagraph = Array.from(element.querySelectorAll("main p")).find(p => p.className.split(" ").some(name => /(?:^|__)body(?:__|$)/.test(name)));
        // Notice pages deliberately use lead/small paragraphs; their normal main
        // flow still inherits the body role from the scoped publication root.
        const body = bodyParagraph ?? (allowInheritedBody ? element.querySelector("main") : null);
        if (!body) throw new Error("Page must render a real shared body role");
        // Exercise BASE -> adapter -> scoped CSS -> actual rendered roles.
        // Only serif uses the documented primitive override; sizes/colors enter
        // through changed BASE values rather than downstream semantic overrides.
        for (const [name, value] of Object.entries(variables)) element.style.setProperty(name, String(value));
        return {
          family: getComputedStyle(h1).fontFamily,
          headingSize: getComputedStyle(h1).fontSize,
          bodySize: getComputedStyle(body).fontSize,
          background: getComputedStyle(element).backgroundColor,
        };
      }, { variables, allowInheritedBody: publication.path === "/thanks" || publication.status === 404 });
      expect(actual, `${publication.path} at ${width}`).toEqual({ family: "Georgia, serif", headingSize: width === 1440 ? "37px" : "29px", bodySize: width === 1440 ? "19px" : "17px", background: "rgb(225, 234, 223)" });
    }
  }
});

test("all publication pages support keyboard skip, visible focus and a real return home", async ({ page }) => {
  test.setTimeout(60_000);
  for (const publication of publicationPages) {
    await page.goto(publication.path);
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "К содержимому", exact: true });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    expect(await skip.evaluate(link => getComputedStyle(link).outlineStyle)).toBe("solid");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    await expect(page).toHaveURL(/#publication-main$/);
    await page.getByRole("banner").getByRole("link", { name: "Travel Club — главная" }).click();
    await expect(page).toHaveURL(/\/test_5$/);
    await expect(page.getByRole("heading", { name: "TRAVEL CLUB", exact: true })).toBeVisible();
  }
});

test("header and footer links open every real publication destination", async ({ page }) => {
  for (const path of footerLinks) {
    await page.goto("/formats");
    const navigation = page.getByRole("navigation", { name: headerLinks.includes(path) ? "Основная навигация" : "Все страницы сайта" });
    await navigation.locator(`a[href='${path}']`).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  }
});

test("editorial pages remain complete with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/formats", "/archive"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const cta = page.getByRole("main").locator("a").first();
    expect(await cta.evaluate(link => getComputedStyle(link).transitionDuration)).toBe("0s");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});

test("homepage routes lead to the publication while genuine content anchors stay local", async ({ page }) => {
  await page.goto("/test_5#start");
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "Начать историю" })).toHaveAttribute("href", "/start");
  await expect(header.getByRole("link", { name: "Форматы", exact: true })).toHaveAttribute("href", "/formats");
  await expect(header.getByRole("link", { name: "Выпуски", exact: true })).toHaveAttribute("href", "/archive");
  for (const [id, format] of [["plan", "route"], ["turnkey", "complete"], ["group", "group"]]) {
    await expect(page.locator(`#formats a[data-format='${id}']`)).toHaveAttribute("href", `/start?format=${format}`);
  }
  await expect(page.getByRole("contentinfo").getByRole("link", { name: /^Документы/ })).toHaveAttribute("href", "/legal");
  await expect(page.locator("#story form")).toHaveCount(1);
  const anchors = await page.locator("#top a[href^='#']").evaluateAll(links => links.map(link => ({
    href: link.getAttribute("href")!, exists: !!document.getElementById(link.getAttribute("href")!.slice(1)),
  })));
  expect(anchors.length).toBeGreaterThan(4);
  expect(anchors.every(anchor => anchor.exists)).toBe(true);
  await header.getByRole("link", { name: "Начать историю" }).click();
  await expect(page).toHaveURL(/\/start$/);
});

test("formats offer three distinct ways to travel with contextual links", async ({ page }) => {
  const response = await page.goto("/formats");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Три способа путешествовать.");
  for (const [name, format] of [["Хочу свой маршрут", "route"], ["Обсудить поездку под ключ", "complete"], ["Хочу в компанию", "group"]]) {
    await expect(page.getByRole("link", { name, exact: false })).toHaveAttribute("href", `/start?format=${format}`);
  }
  await expect(page.getByText(/Вы самостоятельно бронируете и оплачиваете поставщиков\./)).toBeVisible();
  await expect(page.getByText("6–9 человек", { exact: false })).toBeVisible();
  await expect(page.getByRole("list", { name: "От разговора до дороги" }).getByRole("listitem")).toHaveCount(4);
});

test("archive distinguishes friends' field notes from future official issues", async ({ page }) => {
  const response = await page.goto("/archive");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Истории до начала клуба.");
  for (const name of ["2026", "2025"]) await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  const recent = page.getByRole("region", { name: "2026", exact: true });
  await expect(recent.getByText("4 PEOPLE", { exact: true })).toBeVisible();
  await expect(recent.getByText("4 FRIENDS + 2 LOCAL FRIENDS IN BEIJING", { exact: true })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(5);
  await expect(page.getByRole("article").getByRole("link")).toHaveCount(0);
  await expect(page.getByText(/Это не коммерческие Issues и не туры Travel Club\./)).toBeVisible();
  await expect(page.getByText(/Фотографии иллюстративные/)).toBeVisible();
});
