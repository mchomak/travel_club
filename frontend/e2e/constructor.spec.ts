import { expect, test, type Page } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import type { TripDocument } from "../src/lib/contracts";
import { newItem, newTrip } from "../src/lib/trip-ui";
import { tripInput } from "../src/lib/trips";

const login = `fixture-constructor-${Date.now()}-${randomBytes(4).toString("hex")}`;
const password = randomBytes(32).toString("base64url");
const project = path.resolve(import.meta.dirname, "../..");
function database(code: string, input: object) {
  return execFileSync("docker", ["compose", "exec", "-T", "backend", "python", "-c", code], { cwd: project, input: JSON.stringify(input), encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
}
test.beforeAll(() => {
  database("import json,sys; from app.db import SessionLocal; from app.bootstrap import create_admin; p=json.load(sys.stdin); db=SessionLocal(); create_admin(db,p['login'],p['password']); db.close()", { login, password });
});
test.afterAll(() => {
  // Only this run's random fixture identity and its owned trips are removed.
  database("import json,sys; from sqlalchemy import select,delete; from app.db import SessionLocal; from app.models import User,Trip,LoginAttempt; p=json.load(sys.stdin); db=SessionLocal(); user=db.scalar(select(User).where(User.login==p['login'])); db.execute(delete(Trip).where(Trip.created_by==user.id)) if user else None; db.delete(user) if user else None; db.execute(delete(LoginAttempt).where(LoginAttempt.login==p['login'])); db.commit(); db.close()", { login });
});
async function saved(page: Page) { await expect(page.locator(".save-status")).toHaveText("Сохранено", { timeout: 15000 }); }
const apiHeaders = { "X-Requested-With": "TravelClub" };
async function fixtureTrip(page: Page) {
  const auth = await page.request.post("/api/auth/login", { headers: apiHeaders, data: { login, password } });
  expect(auth.ok()).toBe(true);
  const response = await page.request.post("/api/trips", { headers: apiHeaders, data: { ...newTrip(), internal_title: "Проверка сохранения", start_date: "2026-10-01", end_date: "2026-10-05" } });
  expect(response.ok()).toBe(true);
  return await response.json() as TripDocument;
}
async function updateFixture(page: Page, trip: TripDocument) {
  const response = await page.request.put(`/api/trips/${trip.id}`, { headers: apiHeaders, data: { ...tripInput(trip), version: trip.version } });
  expect(response.ok()).toBe(true);
  return await response.json() as TripDocument;
}

test("saved finances display the server calculation even when the local estimate disagrees", async ({ page }) => {
  let trip = await fixtureTrip(page);
  trip.items = [{ ...newItem("other", trip.days[0], "RUB", trip.start_date), title: "Проверка суммы", unit_price: "100", original_amount: "100.00", normalized_amount: "100.00", rate_used: "1" }];
  trip = await updateFixture(page, trip);
  await page.goto(`/admin/trips/${trip.id}`);
  await expect(page.locator(".finance-total")).toHaveText("100,00 RUB");
  // A future server pricing change must still remain authoritative after save.
  await page.route(`**/api/trips/${trip.id}?*`, async route => {
    const response = await route.fetch();
    const document = await response.json() as TripDocument;
    const calculation = document.calculation;
    calculation.cost_total = "777.00";
    calculation.cost_per_person = "388.50";
    calculation.client_price = "999.00";
    calculation.profit = "222.00";
    calculation.actual_margin_percent = "22.2222";
    calculation.by_type.other = "777.00";
    calculation.days[0].total = "777.00";
    calculation.days[0].groups.other = "777.00";
    calculation.items[0].normalized_amount = "777.00";
    await route.fulfill({ response, json: document });
  });
  await page.getByLabel("Наценка, %", { exact: true }).fill("10");
  await expect(page.locator(".client-total strong")).toHaveText("110,00 RUB");
  await saved(page);
  await expect(page.locator(".finance-total")).toHaveText("777,00 RUB");
  await expect(page.locator(".client-total strong")).toHaveText("999,00 RUB");
  await expect(page.locator(".day-total b")).toHaveText("777,00 RUB");
  await expect(page.locator(".item-cost")).toHaveText("777,00 RUB");
  await expect(page.getByRole("alert").filter({ hasText: "Предварительный расчёт отличается от сервера" })).toContainText("Показана сохранённая серверная смета");
});

async function changeEndDate(page: Page, end: string) {
  await page.getByRole("button", { name: "Параметры", exact: true }).click();
  const modal = page.getByRole("dialog");
  await modal.getByLabel("Окончание", { exact: true }).fill(end);
  await modal.getByRole("button", { name: "Применить изменения" }).click();
}

test("date shrink lists the removed days and cancel retains their contents", async ({ page }) => {
  let trip = await fixtureTrip(page);
  trip.days[3].client_note = "Не потерять четвёртый день";
  trip.days[4].client_note = "Не потерять пятый день";
  trip = await updateFixture(page, trip);
  await page.goto(`/admin/trips/${trip.id}`);
  await changeEndDate(page, "2026-10-03");
  const modal = page.getByRole("dialog", { name: "Сократить поездку?" });
  await expect(modal.getByText("4 октября", { exact: true })).toBeVisible();
  await expect(modal.getByText("5 октября", { exact: true })).toBeVisible();
  await modal.getByRole("button", { name: "Отмена", exact: true }).click();
  await saved(page);
  await page.reload();
  await page.getByRole("button", { name: /День 5/ }).click();
  await expect(page.locator(".client-note")).toContainText("Не потерять пятый день");
  await page.getByRole("button", { name: /День 4/ }).click();
  await expect(page.locator(".client-note")).toContainText("Не потерять четвёртый день");
});

test("invalid hotel range offers restoring trip dates without losing other edits", async ({ page }) => {
  let trip = await fixtureTrip(page);
  trip.items = [{ ...newItem("hotel", trip.days[0], "RUB", trip.start_date), check_out: "2026-10-05", unit_price: "100", original_amount: "400.00", normalized_amount: "400.00", rate_used: "1" }];
  trip = await updateFixture(page, trip);
  await page.goto(`/admin/trips/${trip.id}`);
  await page.getByRole("button", { name: "Параметры", exact: true }).click();
  const modal = page.getByRole("dialog");
  await modal.getByLabel("Окончание", { exact: true }).fill("2026-10-03");
  await modal.getByLabel("Название поездки", { exact: true }).fill("Сохранить новое название");
  await modal.getByRole("button", { name: "Применить изменения" }).click();
  await expect(page.locator(".error-notice")).toContainText("исправьте даты проживания");
  await page.getByRole("button", { name: "Вернуть прежние даты" }).click();
  await saved(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Сохранить новое название", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /День 5/ })).toBeVisible();
  await expect(page.locator(".finance-total")).toHaveText("400,00 RUB");
  await page.getByRole("button", { name: "Изменить Проживание", exact: true }).click();
  await expect(page.getByRole("dialog").getByLabel("Выезд", { exact: false })).toHaveValue("2026-10-05");
  await page.getByRole("dialog").getByRole("button", { name: "Отмена", exact: true }).click();
});

test("version conflict reload uses one confirmation and fetches the latest saved trip", async ({ page }) => {
  const trip = await fixtureTrip(page);
  await page.goto(`/admin/trips/${trip.id}`);
  await expect(page.getByRole("heading", { name: "Проверка сохранения", exact: true })).toBeVisible();
  await updateFixture(page, { ...trip, internal_title: "Изменено в другой вкладке" });
  await page.getByLabel("Наценка, %", { exact: true }).fill("10");
  await expect(page.locator(".save-status")).toHaveText("Не удалось сохранить");
  const reload = page.getByRole("button", { name: "Перечитать с сервера", exact: true });
  await reload.click();
  await page.getByRole("dialog").getByRole("button", { name: "Отмена", exact: true }).click();
  await expect(page.getByLabel("Наценка, %", { exact: true })).toHaveValue("10");
  const nativeDialogs: string[] = [];
  page.on("dialog", async dialog => { nativeDialogs.push(dialog.type()); await dialog.accept(); });
  await reload.click();
  await page.getByRole("dialog").getByRole("button", { name: "Перечитать с сервера", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Изменено в другой вкладке", exact: true })).toBeVisible();
  await saved(page);
  await expect(page.getByLabel("Наценка, %", { exact: true })).toHaveValue(/^0(?:\.0+)?$/);
  expect(nativeDialogs).toEqual([]);
});

test("real constructor saves all seven formulas, reopens, and prints a safe client itinerary on mobile", async ({ page }) => {
  test.setTimeout(120000);
  const pageErrors: string[] = [];
  page.on("pageerror", e => pageErrors.push(e.message));
  await page.goto("/admin/login");
  await page.getByLabel("Логин", { exact: true }).fill(login);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Войти в кабинет" }).click();
  await expect(page).toHaveURL(/\/admin\/trips$/);
  await page.getByRole("link", { name: "Создать поездку", exact: true }).click();
  await page.getByLabel("Название поездки", { exact: true }).fill("Проверка маршрута в Японии");
  await page.getByLabel("Название для клиента", { exact: false }).fill("Пять дней в Японии");
  await page.getByLabel("Начало", { exact: true }).fill("2026-10-01");
  await page.getByLabel("Окончание", { exact: true }).fill("2026-10-05");
  await page.getByLabel("Участники", { exact: true }).fill("5");
  await page.getByLabel("Заметка для клиента", { exact: true }).fill("Клиентская заметка поездки");
  await page.getByLabel("Внутренняя заметка", { exact: false }).fill("PRIVATE_TRIP_SECRET");
  await page.getByRole("button", { name: "Создать поездку", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/trips\/[0-9a-f-]+$/);
  const url = page.url();
  await page.getByRole("button", { name: "Изменить день" }).click();
  let modal = page.getByRole("dialog");
  await modal.getByLabel("Страна", { exact: true }).fill("Япония");
  await modal.getByLabel("Город", { exact: true }).fill("Токио");
  await modal.getByLabel("Заметка для клиента", { exact: true }).fill("Клиентская заметка дня");
  await modal.getByLabel("Внутренняя заметка", { exact: false }).fill("PRIVATE_DAY_SECRET");
  await modal.getByRole("button", { name: "Сохранить день" }).click();
  const items = [
    { label: "Перелёт", price: "35000", mode: "per_person" },
    { label: "Трансфер", price: "4000", mode: "capacity" },
    { label: "Проживание", price: "10000", mode: "hotel" },
    { label: "Активность", price: "2000", mode: "per_person", subgroup: "3" },
    { label: "Экскурсия", price: "15000", mode: "fixed" },
    { label: "Страховка", price: "100", mode: "per_person_per_day", days: "5" },
    { label: "Аренда транспорта", price: "1000", mode: "per_day", days: "3", quantity: "2" },
    { label: "Прочее", price: "750", mode: "manual", general: true },
    { label: "Прочее", price: "10", mode: "fixed", quantity: "2", currency: "EUR" },
  ];
  for (const item of items) {
    await page.locator(".item-type-buttons").getByRole("button", { name: item.label, exact: true }).click();
    modal = page.getByRole("dialog");
    await modal.getByLabel("Правило расчёта").selectOption(item.mode);
    await modal.getByLabel(item.mode === "manual" ? "Итоговая сумма" : item.mode === "hotel" ? "Цена номера за ночь" : "Цена за единицу", { exact: true }).fill(item.price);
    if (item.mode === "hotel") await modal.getByLabel("Выезд", { exact: false }).fill("2026-10-05");
    if (item.days) await modal.getByLabel("Число дней", { exact: false }).fill(item.days);
    if (item.quantity) await modal.getByLabel("Количество", { exact: false }).fill(item.quantity);
    if (item.subgroup) await modal.getByLabel("Участники элемента", { exact: false }).fill(item.subgroup);
    if (item.general) await modal.getByLabel("День маршрута").selectOption("");
    if (item.currency) { await modal.getByLabel("Валюта цены").fill(item.currency); await modal.getByLabel("Курс EUR", { exact: false }).fill("96.20"); }
    if (item.label === "Перелёт") {
      await modal.getByLabel("Начало по местному времени").fill("23:00");
      await modal.getByLabel("Окончание по местному времени", { exact: false }).fill("02:00");
      await modal.getByText("Заметки", { exact: true }).click();
      await modal.getByLabel("Заметка для клиента", { exact: true }).fill("Клиентская заметка элемента");
      await modal.getByLabel("Внутренняя заметка", { exact: false }).fill("PRIVATE_ITEM_SECRET");
    }
    await modal.getByRole("button", { name: "Сохранить элемент" }).click();
    await expect(modal, `${item.label}: ${await modal.getByRole("alert").allTextContents()}`).not.toBeVisible();
  }
  await expect(page.locator(".finance-total")).toHaveText("335 174,00 RUB");
  await page.getByLabel("Наценка, %", { exact: true }).fill("20");
  await expect(page.locator(".client-total strong")).toHaveText("402 208,80 RUB");
  await page.getByLabel("Цена для клиента", { exact: true }).selectOption("target_margin");
  await expect(page.locator(".client-total strong")).toHaveText("418 967,50 RUB");
  await saved(page);
  await page.screenshot({ path: "test-results/constructor-desktop.png", fullPage: true });
  await page.reload();
  await expect(page.locator(".finance-total")).toHaveText("335 174,00 RUB");
  await expect(page.getByText("23:00 – 02:00 на следующий день", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Клиентский вид" }).click();
  await expect(page).toHaveURL(/\/preview$/);
  await expect(page.getByRole("heading", { name: "Пять дней в Японии", exact: true })).toBeVisible();
  for (const text of ["Клиентская заметка поездки", "Клиентская заметка дня", "Клиентская заметка элемента"]) await expect(page.getByText(text, { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("PRIVATE_");
  await expect(page.locator(".client-preview")).not.toContainText("335");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await expect(page.locator(".finance-total")).toHaveText("335 174,00 RUB");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator(".item-type-buttons").getByRole("button", { name: "Трансфер", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Сохранить элемент" })).toBeVisible();
  await page.screenshot({ path: "test-results/constructor-mobile-form.png", fullPage: true });
  await page.getByRole("dialog").getByRole("button", { name: "Отмена", exact: true }).click();
  await expect(page.getByRole("button", { name: "Сохранить", exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
