import { expect, test, type Page } from "@playwright/test";

const sectionIds = ["hero", "formats", "next-issue", "field-notes", "field-note-china", "field-note-madagascar", "field-note-thailand", "point-of-view", "final-cta"];
const home = (page: Page) => page.locator('[data-editorial-home="test-20"]');

async function loadedImages(page: Page) {
  for (const frame of await home(page).locator("[data-photo-slot]").all()) {
    if (!await frame.isVisible()) continue;
    await frame.scrollIntoViewIfNeeded();
    await expect.poll(() => frame.locator("img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  }
  await page.evaluate(() => document.fonts.ready);
}

for (const width of [1920, 1440, 1024, 768, 390, 320]) {
  test(`editorial composition, services and safe text bounds at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto("/test_20");
    await expect(home(page)).toBeVisible();
    await expect(page.locator("main")).toHaveCount(1);
    expect(await home(page).locator("main > section[id]").evaluateAll(nodes => nodes.map(node => node.id))).toEqual(sectionIds);
    await expect(home(page).getByRole("heading", { level: 1 })).toContainText("Куда — важно.");
    await expect(home(page).getByRole("heading", { level: 1 })).toContainText("С кем — важнее");
    await expect(page.locator("#hero")).toContainText("Создаём индивидуальные маршруты, организуем путешествия под ключ и собираем небольшие компании для совместных поездок.");
    await expect(page.locator("#hero").getByRole("link", { name: /Обсудить поездку/ })).toHaveAttribute("href", "/start");
    await expect(page.locator("#hero").getByRole("link", { name: /формат/ })).toHaveAttribute("href", "#formats");
    await expect(home(page)).not.toContainText(/\u041e\u0431\u0449\u0438\u0435\s+\u0438\u0441\u0442\u043e\u0440\u0438\u0438/i);
    await expect(page.locator("#hero")).not.toContainText(/\u0438\u043b\u043b\u044e\u0441\u0442\u0440\u0430\u0442\u0438\u0432\u043d\u044b\u0439\s+\u043a\u0430\u0434\u0440/i);
    await expect(home(page)).not.toContainText(/иллюстратив/i);
    // The photograph fills the hero itself, including its text, rather than a subsequent figure.
    const heroGeometry = await page.locator("#hero").evaluate(hero => {
      const bounds = hero.getBoundingClientRect();
      const photo = hero.querySelector('[data-photo-slot="hero-terrace"]')!.getBoundingClientRect();
      return { x: Math.abs(photo.x - bounds.x), y: Math.abs(photo.y - bounds.y), width: Math.abs(photo.width - bounds.width), height: Math.abs(photo.height - bounds.height) };
    });
    for (const difference of Object.values(heroGeometry)) expect(difference).toBeLessThanOrEqual(2);
    const formats = page.locator("#formats [data-format]");
    await expect(formats).toHaveCount(4);
    await expect(formats.getByRole("link")).toHaveCount(4);
    await expect(page.locator('[data-design-section="nav"] img[alt="Travel Club"]')).toBeVisible();
    const languageMenu = page.locator("[data-language-picker]");
    await expect(languageMenu.locator("summary")).toContainText("RU");
    await expect(languageMenu.locator("button")).toHaveCount(3);
    await expect(languageMenu.locator("button").nth(0)).toHaveAttribute("aria-current", "page");
    await expect(languageMenu.locator("button").nth(1)).toContainText("English");
    await expect(languageMenu.locator("button").nth(1)).toBeEnabled();
    await expect(languageMenu.locator("button").nth(2)).toHaveAttribute("lang", "zh-Hans");
    await expect(languageMenu.locator("button").nth(2)).toBeEnabled();
    await languageMenu.locator("summary").click();
    await expect(languageMenu.locator("button").nth(1)).toBeVisible();
    await expect(languageMenu.locator("button").nth(2)).toBeVisible();
    await languageMenu.locator("button").nth(1).click();
    await expect(languageMenu.locator("summary")).toContainText("EN");
    await expect(languageMenu.locator("button").nth(1)).toHaveAttribute("aria-current", "page");
    await expect(home(page)).toContainText("Куда — важно.");
    await languageMenu.locator("button").nth(0).click();
    await expect(languageMenu.locator("summary")).toContainText("RU");
    await expect(languageMenu.locator("button").nth(0)).toHaveAttribute("aria-current", "page");
    for (const [format, english, href] of [["route", "Travel Design", "/formats#route-title"], ["complete", "Travel Ready", "/formats#complete-title"], ["group", "TC Trips", "/formats#group-title"], ["moscow", "Moscow Guide", "/formats#moscow-title"]]) {
      const card = page.locator(`[data-format="${format}"]`);
      await expect(card.locator('[role="heading"][aria-level="3"]')).toHaveText(english);
      const hasRussianSecondaryName = await card.locator('[role="heading"][aria-level="3"]').evaluate(element => Boolean(element.nextElementSibling?.textContent?.trim()));
      expect(hasRussianSecondaryName).toBe(true);
      await expect(card.locator("a")).toHaveAttribute("href", href);
      const priceBeforeSummary = await card.evaluate(element => {
        const price = element.querySelector("[data-format-price]")!;
        const summary = element.querySelector("[data-format-summary]")!;
        return Boolean(price.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING)
          && getComputedStyle(price).borderTopWidth === "0px";
      });
      expect(priceBeforeSummary, `${format} price is above its description without a divider`).toBe(true);
    }
    await expect(page.locator('[data-format="route"]')).toContainText("от 5 000 ₽");
    await expect(page.locator('[data-format="complete"]')).toContainText("от 10 000 ₽");
    await expect(page.locator('[data-format="group"]')).toContainText("По согласованию");
    await expect(page.locator('[data-format="moscow"]')).toContainText("Гид по Москве");
    await expect(page.locator('[data-format="moscow"]')).toContainText(/уточня/i);
    await expect(page.locator('[data-format="moscow"]')).not.toContainText(/\d[\d ]*\s?₽/);
    for (const [index, card] of (await formats.all()).entries()) {
      await expect(card.locator("[data-format-number]")).toHaveText(`0${index + 1}`);
      const overlap = await card.evaluate(element => {
        const number = element.querySelector("[data-format-number]")!.getBoundingClientRect();
        const heading = element.querySelector('h3, [role="heading"][aria-level="3"]')!.getBoundingClientRect();
        return Math.min(number.right, heading.right) - Math.max(number.left, heading.left) > 1 && Math.min(number.bottom, heading.bottom) - Math.max(number.top, heading.top) > 1;
      });
      expect(overlap, `service ${index + 1} numeral must not cover its heading`).toBe(false);
    }
    await expect(page.locator("#field-note-china").getByRole("heading", { name: /CHINA/ })).toBeVisible();
    await expect(page.locator("#field-notes").getByRole("heading", { name: /FIELD\s*NOTES/ })).toBeVisible();
    await expect(page.locator("#field-note-china [data-photo-slot]")).toHaveCount(3);
    await expect(page.locator("#field-note-china [data-china-copy] > p")).toHaveCount(4);
    if (width === 1440) {
      const chinaHeight = await page.locator("#field-note-china").evaluate(section => section.getBoundingClientRect().height);
      expect(chinaHeight).toBeGreaterThan(1300);
    }
    await expect(page.locator("#field-note-china")).toContainText(/[’']25/);
    await expect(page.locator("#field-note-china")).not.toContainText(/CHINA\s*[’']26|4\s*\+\s*2|местных друга/);
    await expect(page.locator("#field-note-china")).toContainText(/5 человек|пять человек|5 PEOPLE/i);
    await expect(page.locator("#field-note-china")).toContainText(/BEIJING\s*→\s*SHANGHAI\s*→\s*SUZHOU\s*→\s*SANYA|Пекин\s*→\s*Шанхай\s*→\s*Сучжоу\s*→\s*Санья/i);
    await expect(page.locator("#field-note-madagascar").getByRole("heading", { name: /MADAGAS\s*CAR/ })).toBeVisible();
    await expect(page.locator("#field-note-madagascar")).toContainText(/[’']25/);
    await expect(page.locator("#field-note-thailand").getByRole("heading", { name: /THAILAND/ })).toBeVisible();
    await expect(page.locator("#field-note-thailand")).toContainText(/[’']26/);
    await expect(page.locator("#next-issue")).toHaveCSS("background-color", "rgb(185, 54, 37)");
    await expect(page.locator("#next-issue [data-type-role=display] > span").first()).toHaveCSS("color", "rgb(245, 226, 160)");
    await expect(page.locator('#next-issue [class*="nextMark"]')).toHaveCSS("color", "rgb(245, 226, 160)");
    await expect(page.locator('#next-issue [class*="status"] svg')).toHaveCSS("color", "rgb(245, 226, 160)");
    await expect(page.locator('#next-issue [class*="sectionBar"] > span').first()).toHaveCSS("color", "rgb(245, 226, 160)");
    await expect(page.locator("#formats")).toHaveCSS("background-color", "rgb(245, 240, 220)");
    expect(await home(page).locator('a[href^="#"]').evaluateAll(links => links.map(link => link.getAttribute("href")!).filter(href => !document.getElementById(href.slice(1))))).toEqual([]);
    if (width > 760) {
      const madagascarAlignment = await page.locator("#field-note-madagascar").evaluate(section => {
        const copy = section.querySelector('[class*="madagascarCopy"]')!.getBoundingClientRect();
        const photo = section.querySelector("figure")!.getBoundingClientRect();
        return Math.abs(copy.top - photo.top);
      });
      expect(madagascarAlignment).toBeLessThanOrEqual(1);
    }
    await loadedImages(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    // Check actual text ink as well as scroll width: overflow:hidden must not conceal broken titles.
    const escapingText = await home(page).locator("main h1, main h2, main h3, main p, main dt, main dd, main a").evaluateAll(elements => elements.flatMap(element => {
      if (element.closest('[aria-hidden="true"]') || !element.textContent?.trim()) return [];
      const range = document.createRange(); range.selectNodeContents(element);
      const rects = [...range.getClientRects()];
      return rects.some(rect => rect.width > 0 && (rect.left < -2 || rect.right > innerWidth + 2)) ? [element.textContent.trim().slice(0, 100)] : [];
    }));
    expect(escapingText).toEqual([]);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `test-results/test-20/${width}-hero.png` });
    await page.screenshot({ path: `test-results/test-20/${width}-full.png`, fullPage: true });
    for (const section of ["formats", "next-issue", "field-notes", "field-note-china", "field-note-madagascar", "point-of-view", "final-cta"]) {
      await page.locator(`#${section}`).screenshot({ path: `test-results/test-20/${width}-${section}.png` });
    }
    expect(errors).toEqual([]);
  });
}

for (const width of [1440, 390, 320]) {
  test(`sticky navigation and anchors remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/test_20");
    const nav = page.getByRole("navigation", { name: "Основная навигация" });
    if (width === 320) {
      const sizes = await nav.locator("a").evaluateAll(links => links.map(link => parseFloat(getComputedStyle(link).fontSize)));
      for (const size of sizes) expect(size).toBeGreaterThanOrEqual(12);
    }
    await expect(nav.getByRole("link", { name: "Архив", exact: true })).toHaveAttribute("href", "/archive");
    for (const [label, section] of [["Услуги", "formats"], ["О нас", "point-of-view"], ["Начать поездку", "final-cta"]]) {
      await nav.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#${section}$`));
      await expect.poll(() => page.locator(`#${section}`).evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
      const geometry = await page.locator(`#${section}`).evaluate(el => {
        const header = document.querySelector('[data-design-section="nav"]')!;
        return { headingTop: el.getBoundingClientRect().top, navBottom: header.getBoundingClientRect().bottom, navTop: header.getBoundingClientRect().top };
      });
      expect(geometry.navTop).toBeGreaterThanOrEqual(-1);
      expect(geometry.navTop).toBeLessThanOrEqual(1);
      expect(geometry.headingTop).toBeGreaterThanOrEqual(geometry.navBottom - 2);
    }
    await nav.getByRole("link", { name: "Архив", exact: true }).click();
    await expect(page).toHaveURL(/\/archive$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

test("service details links replace per-card selection and the general CTA remains available", async ({ page }) => {
  await page.goto("/test_20#formats");
  for (const [format, expected] of [["route", "/formats#route-title"], ["complete", "/formats#complete-title"], ["group", "/formats#group-title"], ["moscow", "/formats#moscow-title"]]) {
    const link = page.locator(`[data-format="${format}"]`).locator("a");
    await expect(link).toHaveAttribute("href", expected);
    await expect(link).toBeVisible();
  }
  await expect(page.locator("[data-format-cta]")).toHaveAttribute("href", "/start");
  await expect(page.locator("#next-issue").getByRole("link").first()).toHaveAttribute("href", "/start?format=group");
  await page.locator('[data-format="moscow"] a').click();
  await expect(page).toHaveURL(/\/formats#moscow-title$/);
  await expect(page.locator("#moscow-title")).toBeInViewport();
});

test("default solid-section text, links and buttons meet readable contrast", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/test_20");
  const contrastResult = await home(page).evaluate(root => {
    const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
    function rgba(color: string) {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color; context.fillRect(0, 0, 1, 1);
      const pixel = context.getImageData(0, 0, 1, 1).data;
      return [pixel[0], pixel[1], pixel[2], pixel[3] / 255];
    }
    function composite(front: number[], back: number[]) {
      const alpha = front[3] + back[3] * (1 - front[3]);
      if (alpha === 0) return [0, 0, 0, 0];
      return [0, 1, 2].map(index => (front[index] * front[3] + back[index] * back[3] * (1 - front[3])) / alpha).concat(alpha);
    }
    function background(element: Element) {
      let color = [0, 0, 0, 0];
      let current: Element | null = element;
      while (current && color[3] < 0.999) {
        color = composite(color, rgba(getComputedStyle(current).backgroundColor));
        current = current.parentElement;
      }
      return composite(color, [255, 255, 255, 1]);
    }
    function luminance(color: number[]) {
      const linear = color.slice(0, 3).map(value => value / 255 <= 0.04045 ? value / 255 / 12.92 : ((value / 255 + 0.055) / 1.055) ** 2.4);
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    }
    const failures: { text: string; contrast: number; minimum: number; section: string | null }[] = [];
    let samples = 0;
    const sections = new Set<string>();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode;
      const element = text.parentElement;
      // Hero and photographic display lettering require pixel sampling; these assertions cover solid editorial surfaces.
      if (!element || !text.textContent?.trim() || element.closest('[aria-hidden="true"], [data-design-section="hero"], [data-photo-slot], [data-type-role="display"]')) continue;
      const section = element.closest("[data-design-section]");
      if (!section) continue;
      const range = document.createRange(); range.selectNodeContents(text);
      if (![...range.getClientRects()].some(rect => rect.width && rect.height)) continue;
      const style = getComputedStyle(element);
      const size = parseFloat(style.fontSize);
      const minimum = size >= 24 || size >= 18.66 && parseFloat(style.fontWeight) >= 700 ? 3 : 4.5;
      const back = background(element);
      const fore = composite(rgba(style.color), back);
      const values = [luminance(back), luminance(fore)].sort((a, b) => b - a);
      const contrast = (values[0] + 0.05) / (values[1] + 0.05);
      samples += 1;
      sections.add(section.getAttribute("data-design-section")!);
      if (!Number.isFinite(contrast) || contrast + 0.01 < minimum) failures.push({ text: text.textContent.trim().slice(0, 80), contrast, minimum, section: section.getAttribute("data-design-section") });
    }
    return { failures, samples, sections: [...sections].sort() };
  });
  expect(contrastResult.samples).toBeGreaterThan(80);
  expect(contrastResult.sections).toEqual(["approach", "china", "conversation", "footer", "formats", "madagascar", "nav", "next", "thailand"]);
  expect(contrastResult.failures).toEqual([]);
});

for (const touch of [false, true]) {
  test(`hero upload, crop, cancellation, persistence and reset (${touch ? "touch" : "desktop"})`, async ({ browser }) => {
    const context = await browser.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000", viewport: { width: touch ? 390 : 1440, height: 900 }, hasTouch: touch, isMobile: touch });
    const page = await context.newPage();
    await page.goto("/test_20");
    const frame = page.locator('[data-photo-slot="hero-terrace"]');
    const photo = frame.locator("img");
    const trigger = frame.getByRole("button", { name: /Редактировать фото/ });
    const original = await photo.getAttribute("src");
    if (touch) await expect(trigger).toBeVisible();
    else await frame.hover();
    await page.screenshot({ path: `test-results/test-20/hero-photo-trigger-${touch ? "touch" : "desktop"}.png` });
    const upload = async () => {
      if (touch) await trigger.tap(); else await trigger.click();
      const chooser = page.waitForEvent("filechooser");
      await page.getByRole("menuitem", { name: "Заменить фото", exact: true }).click();
      const image = await page.evaluate(() => {
        const canvas = document.createElement("canvas"); canvas.width = 900; canvas.height = 600;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#253746"; ctx.fillRect(0, 0, 900, 600);
        ctx.fillStyle = "#CE3C28"; ctx.fillRect(250, 150, 400, 300);
        return canvas.toDataURL("image/png").split(",")[1];
      });
      await (await chooser).setFiles({ name: "test-20-photo.png", mimeType: "image/png", buffer: Buffer.from(image, "base64") });
      const dialog = page.getByRole("dialog", { name: "Кадрирование фото" });
      await expect(dialog).toBeVisible();
      return dialog;
    };
    let dialog = await upload();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(photo).toHaveAttribute("src", original!);
    await expect(trigger).toBeFocused();
    dialog = await upload();
    await dialog.getByRole("button", { name: "Увеличить", exact: true }).click();
    await expect(dialog.getByRole("slider", { name: "Масштаб" })).not.toHaveValue("1");
    await dialog.getByRole("button", { name: "Сохранить фото", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(photo).toHaveAttribute("src", /^blob:/);
    await page.reload();
    await expect(photo).toHaveAttribute("src", /^blob:/);
    await page.goto("/test_19");
    await expect(page.locator('[data-photo-slot="hero-table"] img')).not.toHaveAttribute("src", /^blob:/);
    await expect(page.locator('[data-editorial-home="test-19"]')).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("С кем — важнее.");
    await page.goto("/test_20");
    await expect(photo).toHaveAttribute("src", /^blob:/);
    if (touch) await trigger.tap(); else await trigger.click();
    await page.getByRole("menuitem", { name: "Вернуть исходное фото", exact: true }).click();
    await expect(photo).toHaveAttribute("src", original!);
    await page.reload();
    await expect(photo).toHaveAttribute("src", original!);
    await context.close();
  });
}
