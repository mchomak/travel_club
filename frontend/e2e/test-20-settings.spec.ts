import { expect, test, type Page } from "@playwright/test";

const storageKey = "travel-club-test-20-design-v1";
const roleNames = { display: "Display", h1: "H1", h2: "H2", h3: "H3", subheading: "Подзаголовки", body: "Основной текст", caption: "Подписи", metadata: "Metadata", cta: "CTA" };
const root = (page: Page) => page.locator('[data-editorial-home="test-20"]');
const panel = (page: Page) => page.getByRole("dialog", { name: "Настройки дизайна" });

async function openSettings(page: Page) {
  await page.getByRole("button", { name: "Design Settings", exact: true }).click();
  await expect(panel(page)).toBeVisible();
}

async function openGroup(page: Page, name: string) {
  const summary = panel(page).locator("summary").filter({ hasText: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) });
  if (!await summary.evaluate(element => element.parentElement?.hasAttribute("open"))) await summary.click();
}

for (const width of [1440, 390]) {
  test(`all nine typography roles change real page text and survive reload at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/test_20");
    await openSettings(page);
    for (const [role, label] of Object.entries(roleNames)) {
      const family = panel(page).getByRole("combobox", { name: `Шрифт: ${label}`, exact: true });
      const before = await family.inputValue();
      const chosen = before === "TC Lora" ? "TC Golos" : "TC Lora";
      await family.selectOption(chosen);
      const size = ["display", "h1", "h2"].includes(role) ? 36 : role === "h3" ? 28 : role === "metadata" || role === "caption" ? 15 : 21;
      await panel(page).getByRole("spinbutton", { name: `Размер на desktop: ${label}`, exact: true }).fill(String(size));
      await panel(page).getByRole("spinbutton", { name: `Размер на mobile: ${label}`, exact: true }).fill(String(size));
      const text = root(page).locator(`[data-type-role="${role}"]`).first();
      await expect(text, `page exposes real ${role} typography`).toHaveCount(1);
      await expect(text).toHaveCSS("font-family", new RegExp(chosen));
      await expect(text).toHaveCSS("font-size", `${size}px`);
    }
    await expect.poll(() => page.evaluate(key => localStorage.getItem(key), storageKey)).not.toBeNull();
    await page.reload();
    await openSettings(page);
    for (const [role, label] of Object.entries(roleNames)) {
      const family = await panel(page).getByRole("combobox", { name: `Шрифт: ${label}`, exact: true }).inputValue();
      await expect(root(page).locator(`[data-type-role="${role}"]`).first()).toHaveCSS("font-family", new RegExp(family));
      await expect(panel(page).getByRole("spinbutton", { name: `Размер на desktop: ${label}`, exact: true })).toHaveValue(String(["display", "h1", "h2"].includes(role) ? 36 : role === "h3" ? 28 : role === "metadata" || role === "caption" ? 15 : 21));
    }
    await page.screenshot({ path: `test-results/test-20/${width}-settings-type.png` });
    await panel(page).getByRole("button", { name: "Сбросить настройки", exact: true }).click();
    await expect(root(page).locator("#formats")).toHaveCSS("background-color", "rgb(245, 240, 220)");
    await expect(root(page).locator('[data-type-role="h1"]').first()).toHaveCSS("font-size", width === 1440 ? "70px" : "40px");
    await expect(panel(page).getByRole("combobox", { name: "Шрифт: H1", exact: true })).toHaveValue("TC Golos");
  });
}

test("large ordinary type settings remain authoritative and wrap across viewports", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto("/test_20");
  await openSettings(page);
  const sizes = { h1: [110, 80], h2: [96, 70], h3: [54, 42], subheading: [40, 32] };
  for (const [role, [desktop, mobile]] of Object.entries(sizes)) {
    const label = roleNames[role as keyof typeof roleNames];
    await panel(page).getByRole("spinbutton", { name: `Размер на desktop: ${label}`, exact: true }).fill(String(desktop));
    await panel(page).getByRole("spinbutton", { name: `Размер на mobile: ${label}`, exact: true }).fill(String(mobile));
  }
  await panel(page).getByRole("button", { name: "Свернуть настройки", exact: true }).click();
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [role, [desktop, mobile]] of Object.entries(sizes)) {
      const expectedSize = mobile + (desktop - mobile) * (width - 390) / (1440 - 390);
      const actualSize = await root(page).locator(`[data-type-role="${role}"]`).first().evaluate(element => parseFloat(getComputedStyle(element).fontSize));
      expect(Math.abs(actualSize - expectedSize), `${role} at ${width}px must honor its selected responsive size`).toBeLessThan(0.05);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const overflow = await root(page).locator("h1, h2, h3, [role='heading'], [data-type-role='subheading']").evaluateAll(elements => elements.flatMap(element => {
      if (!element.textContent?.trim()) return [];
      const range = document.createRange(); range.selectNodeContents(element);
      return [...range.getClientRects()].some(rect => rect.width > 0 && (rect.left < -2 || rect.right > innerWidth + 2)) ? [element.textContent] : [];
    }));
    expect(overflow, `large selected type stays readable at ${width}px`).toEqual([]);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `test-results/test-20/${width}-large-type-hero.png` });
  }
});

test("global colors and China presets affect visible sections without discarding other settings", async ({ page }) => {
  await page.goto("/test_20");
  await openSettings(page);
  await openGroup(page, "Основные цвета");
  await panel(page).getByRole("textbox", { name: "HEX: Бумага", exact: true }).fill("#e8e0ca");
  await expect(page.locator("#formats")).toHaveCSS("background-color", "rgb(232, 224, 202)");
  await panel(page).getByRole("textbox", { name: "HEX: Фирменный синий", exact: true }).fill("#183249");
  await expect(page.locator("#formats h2").first()).toHaveCSS("color", "rgb(24, 50, 73)");
  for (const [preset, expected] of [["PANTONE 7546 C", "rgb(37, 55, 70)"], ["Текущий China", "rgb(35, 40, 49)"], ["Синий из палитры", "rgb(22, 58, 95)"]]) {
    await panel(page).getByRole("button", { name: preset, exact: true }).click();
    await expect(page.locator("#field-note-china")).toHaveCSS("background-color", expected);
    await expect(page.locator("#formats")).toHaveCSS("background-color", "rgb(232, 224, 202)");
    await expect(page.locator("#next-issue")).toHaveCSS("background-color", "rgb(185, 54, 37)");
  }
  await page.reload();
  await expect(page.locator("#formats")).toHaveCSS("background-color", "rgb(232, 224, 202)");
  await expect(page.locator("#field-note-china")).toHaveCSS("background-color", "rgb(22, 58, 95)");
  await openSettings(page);
  await panel(page).getByRole("button", { name: "Сбросить настройки", exact: true }).click();
  await expect(page.locator("#formats")).toHaveCSS("background-color", "rgb(245, 240, 220)");
  await expect(page.locator("#field-note-china")).toHaveCSS("background-color", "rgb(37, 55, 70)");
});

test("section overrides use HEX and native pickers, stay local, validate and reset", async ({ page }) => {
  await page.goto("/test_20");
  await openSettings(page);
  await openGroup(page, "Цвета секций");
  const sections = ["Навигация", "Hero", "Наши форматы", "Next Issue", "China ’25", "Madagascar ’25", "Thailand ’26", "Наш подход", "Начнём с разговора", "Footer"];
  for (const section of sections) {
    await openGroup(page, section);
    for (const field of ["Фон", "Заголовки", "Текст", "Акценты", "Линии", "Кнопки", "Ссылки"]) {
      await expect(panel(page).getByRole("textbox", { name: `HEX: ${section} — ${field}`, exact: true })).toBeVisible();
      await expect(panel(page).getByLabel(`Выбрать цвет: ${section} — ${field}`, { exact: true })).toHaveAttribute("type", "color");
    }
  }
  await panel(page).getByRole("textbox", { name: "HEX: Наши форматы — Фон", exact: true }).fill("#e0dbc8");
  await expect(page.locator("#formats")).toHaveCSS("background-color", "rgb(224, 219, 200)");
  await expect(page.locator("#point-of-view")).toHaveCSS("background-color", "rgb(245, 240, 220)");
  const headingHex = panel(page).getByRole("textbox", { name: "HEX: Наши форматы — Заголовки", exact: true });
  await headingHex.fill("#123456");
  await expect(page.locator("#formats h2").first()).toHaveCSS("color", "rgb(18, 52, 86)");
  await expect(panel(page).getByLabel("Выбрать цвет: Наши форматы — Заголовки", { exact: true })).toHaveValue("#123456");
  await headingHex.fill("#zzzzzz");
  await expect(headingHex).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#formats h2").first()).toHaveCSS("color", "rgb(18, 52, 86)");
  await headingHex.fill("#263748");
  await expect(headingHex).not.toHaveAttribute("aria-invalid", "true");
  const picker = panel(page).getByLabel("Выбрать цвет: Наши форматы — Ссылки", { exact: true });
  // Dispatch the native color-picker event; Chromium's OS picker has no DOM controls.
  await picker.evaluate((input: HTMLInputElement) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "#445566");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(panel(page).getByRole("textbox", { name: "HEX: Наши форматы — Ссылки", exact: true })).toHaveValue("#445566");
  await expect(page.locator('#formats a[href="/formats"]').first()).toHaveCSS("color", "rgb(68, 85, 102)");
  await panel(page).getByRole("textbox", { name: "HEX: Наши форматы — Кнопки", exact: true }).fill("#172f50");
  await expect(page.locator("#formats [data-format-cta]")).toHaveCSS("background-color", "rgb(23, 47, 80)");
  await page.reload();
  await expect(page.locator("#formats")).toHaveCSS("background-color", "rgb(224, 219, 200)");
  await expect(page.locator("#formats h2").first()).toHaveCSS("color", "rgb(38, 55, 72)");
  await openSettings(page);
  await openGroup(page, "Цвета секций");
  await openGroup(page, "Наши форматы");
  await panel(page).getByRole("button", { name: "Вернуть общую палитру: Наши форматы", exact: true }).click();
  await expect(page.locator("#formats")).toHaveCSS("background-color", "rgb(245, 240, 220)");
});

test("complete palette presets compare existing art directions and preserve type choices", async ({ page }) => {
  await page.goto("/test_20");
  await openSettings(page);
  await panel(page).getByRole("combobox", { name: "Шрифт: H1", exact: true }).selectOption("TC Lora");
  for (const [preset, paper, china] of [
    ["Редакция /test_19", "rgb(243, 242, 238)", "rgb(35, 40, 49)"],
    ["Палитра направлений", "rgb(242, 240, 234)", "rgb(22, 58, 95)"],
    ["Тёплая редакция", "rgb(245, 240, 220)", "rgb(37, 55, 70)"],
  ]) {
    await panel(page).getByRole("button", { name: preset, exact: true }).click();
    await expect(page.locator("#formats")).toHaveCSS("background-color", paper);
    await expect(page.locator("#field-note-china")).toHaveCSS("background-color", china);
    await expect(page.locator("#next-issue")).toHaveCSS("background-color", "rgb(185, 54, 37)");
    await expect(root(page).locator('[data-type-role="h1"]')).toHaveCSS("font-family", /TC Lora/);
  }
});

for (const width of [1440, 390, 320]) {
  test(`settings overlay contains keyboard focus, closes with Escape and leaves layout intact at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/test_20");
    const before = await page.locator("#hero").boundingBox();
    const opener = page.getByRole("button", { name: "Design Settings", exact: true });
    if (width <= 390) {
      const triggerBounds = await opener.boundingBox();
      expect(triggerBounds!.width).toBeLessThanOrEqual(48);
      expect(triggerBounds!.height).toBeGreaterThanOrEqual(44);
    }
    await opener.focus();
    await page.keyboard.press("Enter");
    await expect(panel(page)).toBeVisible();
    expect(await page.locator("#hero").boundingBox()).toEqual(before);
    const bounds = await panel(page).boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
    expect(bounds!.height).toBeLessThanOrEqual(844);
    await panel(page).getByRole("button", { name: "Свернуть настройки", exact: true }).focus();
    await page.keyboard.press("Shift+Tab");
    expect(await panel(page).evaluate(element => element.contains(document.activeElement))).toBe(true);
    await panel(page).getByRole("button", { name: "Сбросить настройки", exact: true }).focus();
    for (let index = 0; index < 12; index++) {
      await page.keyboard.press("Tab");
      expect(await panel(page).evaluate(element => element.contains(document.activeElement))).toBe(true);
    }
    await page.screenshot({ path: `test-results/test-20/${width}-settings-overlay.png` });
    await page.keyboard.press("Escape");
    await expect(panel(page)).not.toBeVisible();
    await expect(opener).toBeFocused();
    await opener.click();
    await panel(page).getByRole("button", { name: "Свернуть настройки", exact: true }).click();
    await expect(panel(page)).not.toBeVisible();
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

for (const value of ["{broken json", JSON.stringify({ version: 1, colors: { paper: "red;position:fixed" }, typography: { body: { family: "nonexistent font", desktopSize: -1, mobileSize: 99999 } }, sections: { formats: { background: "javascript:bad" } } })]) {
  test(`invalid saved settings recover safely (${value.startsWith("{broken") ? "JSON" : "schema"})`, async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: storageKey, value });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/test_20");
    await expect(page.locator("#formats")).toHaveCSS("background-color", "rgb(245, 240, 220)");
    await expect(root(page).getByRole("heading", { level: 1 })).toBeVisible();
    await openSettings(page);
    await expect(panel(page).getByRole("combobox", { name: "Шрифт: Основной текст", exact: true })).toHaveValue("TC Golos");
    expect(errors).toEqual([]);
  });
}

test("test_20 design changes do not leak into test_19", async ({ page }) => {
  const signature = async () => page.locator('[data-editorial-home="test-19"]').evaluate(element => {
    const h1 = element.querySelector("h1")!;
    const formats = element.querySelector("#formats")!;
    return { heading: h1.textContent, family: getComputedStyle(h1).fontFamily, size: getComputedStyle(h1).fontSize, ink: getComputedStyle(h1).color, formatsBackground: getComputedStyle(formats).backgroundColor, sections: [...element.querySelectorAll("main > section[id]")].map(section => section.id) };
  });
  await page.goto("/test_19");
  await page.evaluate(() => document.fonts.ready);
  const before = await signature();
  await page.goto("/test_20");
  await openSettings(page);
  await openGroup(page, "Основные цвета");
  await panel(page).getByRole("textbox", { name: "HEX: Бумага", exact: true }).fill("#aabbcc");
  await panel(page).getByRole("combobox", { name: "Шрифт: H1", exact: true }).selectOption("TC Golos");
  await page.goto("/test_19");
  await page.evaluate(() => document.fonts.ready);
  expect(await signature()).toEqual(before);
  await expect(page.getByRole("button", { name: "Design Settings", exact: true })).toHaveCount(0);
  await expect(page.locator('[data-photo-slot="hero-table"] img')).not.toHaveAttribute("src", /^blob:/);
});
