import { expect, test } from "@playwright/test";

test("format URLs select their context and unknown or repeated values fall back safely", async ({ page }) => {
  for (const [query, selected] of [
    ["route", "Маршрут"], ["complete", "Под ключ"], ["group", "В компании"],
    ["unknown", "Маршрут"], ["group&format=complete", "Маршрут"],
  ]) {
    await page.goto(`/start?format=${query}`);
    await expect(page.getByRole("radio", { name: new RegExp(`^${selected}`) })).toBeChecked();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Начнёмс разговора.");
  }
});

test("missing or malformed contact stays on the form with a focused, described error", async ({ page }) => {
  await page.goto("/start");
  const contact = page.getByLabel("Ваш контакт — обязательно");
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(contact).toBeFocused();
  await expect(contact).toHaveAttribute("aria-invalid", "true");
  await expect(contact).toHaveAccessibleDescription("Оставьте Telegram, телефон или email.");
  await contact.fill("поговорим когда-нибудь");
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(contact).toBeFocused();
  await expect(contact).toHaveAccessibleDescription("Проверьте контакт: @username, номер телефона или email.");
  await expect(page).toHaveURL(/\/start$/);
});

test("a supplied participant count must be a positive integer, with the first error focused", async ({ page }) => {
  await page.goto("/start");
  const participants = page.getByLabel("Количество человек");
  for (const value of ["0", "-3", "2.5", "1e2", "трое"]) {
    await participants.fill(value);
    await page.getByRole("button", { name: "Продолжить" }).click();
    await expect(participants).toBeFocused();
    await expect(participants).toHaveAccessibleDescription("Укажите положительное целое число людей или оставьте поле пустым.");
    await expect(page).toHaveURL(/\/start$/);
  }
});

for (const contact of ["editorial@example.com", "+7 (999) 123-45-67", "@travel_friend"]) {
  test(`accepts ${contact} with optional fields blank and opens the honest thanks page`, async ({ page }) => {
    await page.goto("/start");
    await page.getByLabel("Ваш контакт — обязательно").fill(contact);
    await expect(page.getByText("Тестовая форма. Данные не отправляются и не сохраняются.")).toBeVisible();
    await page.getByRole("button", { name: "Продолжить" }).click();
    await expect(page).toHaveURL(/\/thanks$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Демонстрациязавершена.");
    await expect(page.getByText("Данные не отправлены и не сохранены.", { exact: true })).toBeVisible();
  });
}

test("filled personal answers are absent from requests, URL, browser writes, and logs", async ({ page, context }) => {
  await page.addInitScript(() => {
    const writes: string[] = [];
    Object.defineProperty(window, "publicationWrites", { value: writes });
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      writes.push(`${key}:${value}`);
      return setItem.call(this, key, value);
    };
    for (const method of ["add", "put"] as const) {
      const original = IDBObjectStore.prototype[method];
      IDBObjectStore.prototype[method] = function (value, key) {
        writes.push(String(value));
        return key === undefined ? original.call(this, value) : original.call(this, value, key);
      };
    }
  });
  const requests: string[] = [];
  const logs: string[] = [];
  page.on("request", (request) => requests.push(`${request.method()} ${request.url()} ${request.postData() ?? ""}`));
  page.on("console", (message) => logs.push(message.text()));
  await page.goto("/start?format=group");
  const cookiesBefore = await context.cookies();
  await page.getByLabel("Куда хотите поехать?").fill("PRIVATE_DESTINATION_7b2");
  await page.getByLabel("Когда?", { exact: true }).fill("PRIVATE_DATE_7b2");
  await page.getByLabel("Количество человек").fill("4");
  await page.getByLabel("Ориентировочный бюджет").fill("PRIVATE_BUDGET_7b2");
  await page.getByLabel("Комментарий / пожелания").fill("PRIVATE_COMMENT_7b2");
  await page.getByLabel("Ваш контакт — обязательно").fill("private_7b2@example.com");
  const writesBefore = await page.evaluate(() => (window as unknown as { publicationWrites: string[] }).publicationWrites);
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(page).toHaveURL(/\/thanks$/);
  const writesAfter = await page.evaluate(() => (window as unknown as { publicationWrites: string[] }).publicationWrites);
  expect(writesBefore).toEqual([]);
  expect(writesAfter).toEqual([]);
  expect(await context.cookies()).toEqual(cookiesBefore);
  expect(requests.filter((request) => !request.startsWith("GET "))).toEqual([]);
  expect([...requests, ...logs].join("\n")).not.toMatch(/PRIVATE_|private_7b2/);
});

test("native choices and fields work by keyboard with visible focus under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/start");
  await page.getByRole("radio", { name: /^Маршрут/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /^Под ключ/ })).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /^В компании/ })).toBeChecked();
  await page.keyboard.press("Tab");
  const destination = page.getByLabel("Куда хотите поехать?");
  await expect(destination).toBeFocused();
  expect(await destination.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("solid");
  expect(await destination.evaluate((element) => Number.parseFloat(getComputedStyle(element).outlineWidth))).toBeGreaterThan(0);
  for (let step = 0; step < 5; step += 1) await page.keyboard.press("Tab");
  await expect(page.getByLabel("Ваш контакт — обязательно")).toBeFocused();
  await page.keyboard.type("keyboard@example.com");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/thanks$/);
});

test("the form has no horizontal overflow at desktop, tablet, or narrow mobile widths", async ({ page }) => {
  await page.goto("/start?format=complete");
  for (const width of [1440, 1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const form = page.getByRole("form", { name: "Начать историю" });
    const box = await form.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    await expect(page.getByRole("radio", { name: /^Под ключ/ })).toBeChecked();
  }
});
