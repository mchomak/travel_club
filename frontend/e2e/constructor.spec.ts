import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import type { TripDocument } from "../src/lib/contracts";
import { newItem, newTrip } from "../src/lib/trip-ui";
import { tripInput } from "../src/lib/trips";

const login = `fixture-constructor-${Date.now()}-${randomBytes(4).toString("hex")}`;
const password = randomBytes(32).toString("base64url");
const project = path.resolve(import.meta.dirname, "../..");
const apiHeaders = { "X-Requested-With": "TravelClub" };
let authCookies: Awaited<ReturnType<APIRequestContext["storageState"]>>["cookies"] = [];
function database(code: string, input: object) {
  return execFileSync("docker", ["compose", "exec", "-T", "backend", "python", "-c", code], { cwd: project, input: JSON.stringify(input), encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
}
test.beforeAll(async ({ playwright }) => {
  database("import json,sys; from app.db import SessionLocal; from app.bootstrap import create_admin; p=json.load(sys.stdin); db=SessionLocal(); create_admin(db,p['login'],p['password']); db.close()", { login, password });
  const context = await playwright.request.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000" });
  try {
    const response = await context.post("/api/auth/login", { headers: apiHeaders, data: { login, password } });
    expect(response.ok()).toBe(true);
    authCookies = (await context.storageState()).cookies.filter(cookie => cookie.name === "travel_session");
    expect(authCookies).toHaveLength(1);
  } finally {
    await context.dispose();
  }
});
test.afterAll(() => {
  // Only this run's random fixture identity and its owned trips are removed.
  database("import json,sys; from sqlalchemy import select,delete; from app.db import SessionLocal; from app.models import User,Trip,LoginAttempt; p=json.load(sys.stdin); db=SessionLocal(); user=db.scalar(select(User).where(User.login==p['login'])); db.execute(delete(Trip).where(Trip.created_by==user.id)) if user else None; db.delete(user) if user else None; db.execute(delete(LoginAttempt).where(LoginAttempt.login==p['login'])); db.commit(); db.close()", { login });
});
async function saved(page: Page) { await expect(page.locator(".save-status")).toHaveText("Сохранено", { timeout: 15000 }); }
async function unloadWouldWarn(page: Page) {
  return page.evaluate(() => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });
}
async function fixtureTrip(page: Page) {
  await page.context().addCookies(authCookies);
  const response = await page.request.post("/api/trips", { headers: apiHeaders, data: { ...newTrip(), internal_title: "Проверка сохранения", start_date: "2026-10-01", end_date: "2026-10-05" } });
  expect(response.ok()).toBe(true);
  return await response.json() as TripDocument;
}
async function updateFixture(page: Page, trip: TripDocument) {
  const response = await page.request.put(`/api/trips/${trip.id}`, { headers: apiHeaders, data: { ...tripInput(trip), version: trip.version } });
  expect(response.ok()).toBe(true);
  return await response.json() as TripDocument;
}

test("day form protects entered notes and clears the warning on cancel or saved submit", async ({ page }) => {
  const trip = await fixtureTrip(page);
  await page.goto(`/admin/trips/${trip.id}`);
  await expect(page.getByRole("heading", { name: "Проверка сохранения", exact: true })).toBeVisible();
  expect(await unloadWouldWarn(page)).toBe(false);
  await page.getByRole("button", { name: "Изменить день" }).click();
  const modal = page.getByRole("dialog");
  expect(await unloadWouldWarn(page)).toBe(false);
  await modal.getByLabel("Заметка для клиента").fill("Заполненная заметка дня");
  expect(await unloadWouldWarn(page)).toBe(true);
  await modal.getByRole("button", { name: "Отмена", exact: true }).click();
  expect(await unloadWouldWarn(page)).toBe(false);
  await page.getByRole("button", { name: "Изменить день" }).click();
  await page.getByRole("dialog").getByLabel("Заметка для клиента").fill("Сохранённая заметка дня");
  await page.getByRole("dialog").getByRole("button", { name: "Сохранить день" }).click();
  await saved(page);
  expect(await unloadWouldWarn(page)).toBe(false);
});

test("trip settings protect unsaved edits and clear the warning after cancel or save", async ({ page }) => {
  const trip = await fixtureTrip(page);
  await page.goto(`/admin/trips/${trip.id}`);
  await expect(page.getByRole("heading", { name: "Проверка сохранения", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Параметры", exact: true }).click();
  let modal = page.getByRole("dialog");
  expect(await unloadWouldWarn(page)).toBe(false);
  await modal.getByLabel("Название поездки", { exact: true }).fill("Несохранённое название");
  expect(await unloadWouldWarn(page)).toBe(true);
  await modal.getByRole("button", { name: "Отмена", exact: true }).click();
  expect(await unloadWouldWarn(page)).toBe(false);
  await page.getByRole("button", { name: "Параметры", exact: true }).click();
  modal = page.getByRole("dialog");
  await modal.getByLabel("Название поездки", { exact: true }).fill("Сохранённое название");
  await modal.getByRole("button", { name: "Применить изменения" }).click();
  await saved(page);
  expect(await unloadWouldWarn(page)).toBe(false);
  await expect(page.getByRole("heading", { name: "Сохранённое название", exact: true })).toBeVisible();
});

test("rate form protects local changes and clears the warning after cancel or save", async ({ page }) => {
  let trip = await fixtureTrip(page);
  trip.rates = [{ currency: "EUR", rate: "96" }];
  trip = await updateFixture(page, trip);
  await page.goto(`/admin/trips/${trip.id}`);
  await expect(page.getByRole("heading", { name: "Проверка сохранения", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Валюты и курсы" }).click();
  let modal = page.getByRole("dialog");
  expect(await unloadWouldWarn(page)).toBe(false);
  await modal.getByLabel("1 EUR в RUB").fill("97");
  expect(await unloadWouldWarn(page)).toBe(true);
  await modal.getByRole("button", { name: "Отмена", exact: true }).click();
  expect(await unloadWouldWarn(page)).toBe(false);
  await page.getByRole("button", { name: "Валюты и курсы" }).click();
  modal = page.getByRole("dialog");
  await expect(modal.getByLabel("1 EUR в RUB")).toHaveValue(/^96(?:\.0+)?$/);
  await modal.getByLabel("1 EUR в RUB").fill("97");
  await modal.getByRole("button", { name: "Применить курсы" }).click();
  await saved(page);
  expect(await unloadWouldWarn(page)).toBe(false);
});

test("unused rate can be removed while a currency used by an item remains required", async ({ page }) => {
  let trip = await fixtureTrip(page);
  trip.rates = [{ currency: "EUR", rate: "96" }];
  trip = await updateFixture(page, trip);
  await page.goto(`/admin/trips/${trip.id}`);
  await page.getByRole("button", { name: "Валюты и курсы" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Удалить курс EUR" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Применить курсы" }).click();
  await saved(page);
  let response = await page.request.get(`/api/trips/${trip.id}`);
  trip = await response.json() as TripDocument;
  expect(trip.rates.some(rate => rate.currency === "EUR")).toBe(false);
  trip.rates = [{ currency: "EUR", rate: "96" }];
  trip.items = [{ ...newItem("other", trip.days[0], "EUR", trip.start_date), unit_price: "10", original_amount: "10.00", normalized_amount: "960.00", rate_used: "96" }];
  await updateFixture(page, trip);
  await page.reload();
  await page.getByRole("button", { name: "Валюты и курсы" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Удалить курс EUR" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Применить курсы" }).click();
  await expect(page.getByRole("dialog")).toContainText("Нужен курс EUR");
  response = await page.request.get(`/api/trips/${trip.id}`);
  trip = await response.json() as TripDocument;
  expect(trip.rates.some(rate => rate.currency === "EUR")).toBe(true);
});

test("new trip form warns on unsaved input and creates without a false leave warning", async ({ page }) => {
  await page.context().addCookies(authCookies);
  await page.goto("/admin/trips/new");
  const title = page.getByLabel("Название поездки", { exact: true });
  expect(await unloadWouldWarn(page)).toBe(false);
  await title.fill("Новая поездка с данными");
  expect(await unloadWouldWarn(page)).toBe(true);
  const dialogs: string[] = [];
  page.on("dialog", async dialog => { dialogs.push(dialog.type()); await dialog.dismiss(); });
  await page.getByRole("link", { name: "Все поездки" }).click();
  await expect(page).toHaveURL(/\/admin\/trips\/new$/);
  expect(dialogs).toEqual(["confirm"]);
  await title.fill("");
  await expect.poll(() => unloadWouldWarn(page)).toBe(false);
  await title.fill("Сохранённая новая поездка");
  await page.getByRole("button", { name: "Создать поездку", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/trips\/[0-9a-f-]+$/);
  await saved(page);
  expect(dialogs).toEqual(["confirm"]);
  expect(await unloadWouldWarn(page)).toBe(false);
});

test("cancelled logout keeps a filled new trip and the admin session", async ({ page }) => {
  await page.context().addCookies(authCookies);
  await page.goto("/admin/trips/new");
  await page.getByLabel("Название поездки", { exact: true }).fill("Не потерять перед выходом");
  const dialogs: string[] = [];
  page.on("dialog", async dialog => { dialogs.push(dialog.type()); await dialog.dismiss(); });
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/admin\/trips\/new$/);
  await expect(page.getByLabel("Название поездки", { exact: true })).toHaveValue("Не потерять перед выходом");
  expect(dialogs).toEqual(["confirm"]);
  const me = await page.request.get("/api/auth/me");
  expect(me.status()).toBe(200);
});

test("unchanged item does not warn; edits warn until reverted, cancelled or saved", async ({ page }) => {
  let trip = await fixtureTrip(page);
  trip.items = [{ ...newItem("other", trip.days[0], "RUB", trip.start_date), title: "Проверка элемента", original_amount: "0.00", normalized_amount: "0.00", rate_used: "1" }];
  trip = await updateFixture(page, trip);
  await page.goto(`/admin/trips/${trip.id}`);
  await page.getByRole("button", { name: "Изменить Проверка элемента" }).click();
  let modal = page.getByRole("dialog");
  expect(await unloadWouldWarn(page)).toBe(false);
  await modal.getByLabel("Название элемента").fill("Другое название");
  expect(await unloadWouldWarn(page)).toBe(true);
  await modal.getByLabel("Название элемента").fill("Проверка элемента");
  await expect.poll(() => unloadWouldWarn(page)).toBe(false);
  await modal.getByLabel("Название элемента").fill("Ещё одна правка");
  await modal.getByRole("button", { name: "Отмена", exact: true }).click();
  expect(await unloadWouldWarn(page)).toBe(false);
  await page.getByRole("button", { name: "Изменить Проверка элемента" }).click();
  modal = page.getByRole("dialog");
  await modal.getByLabel("Название элемента").fill("Сохранённый элемент");
  await modal.getByRole("button", { name: "Сохранить элемент" }).click();
  await saved(page);
  expect(await unloadWouldWarn(page)).toBe(false);
  await expect(page.getByRole("button", { name: "Изменить Сохранённый элемент" })).toBeVisible();
});

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

test("failed save retains the draft and retry persists it", async ({ page }) => {
  const trip = await fixtureTrip(page);
  await page.goto(`/admin/trips/${trip.id}`);
  await page.route(`**/api/trips/${trip.id}?*`, route => route.abort("failed"));
  await page.getByLabel("Наценка, %", { exact: true }).fill("17");
  await expect(page.locator(".save-status")).toHaveText("Не удалось сохранить");
  await expect(page.getByLabel("Наценка, %", { exact: true })).toHaveValue(/^17(?:\.0+)?$/);
  expect((await (await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument).pricing_percent).toBe("0.0000");
  await page.unroute(`**/api/trips/${trip.id}?*`);
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await saved(page);
  await page.reload();
  await expect(page.getByLabel("Наценка, %", { exact: true })).toHaveValue(/^17(?:\.0+)?$/);
});

test("copy is independent; archive, delete, and logout protect own trips", async ({ page }) => {
  const original = await fixtureTrip(page);
  await page.goto("/admin/trips");
  const originalRow = page.locator(".trip-row").filter({ has: page.locator(`a[href="/admin/trips/${original.id}"]`) });
  await originalRow.getByRole("button", { name: "Копировать" }).click();
  await expect(page).toHaveURL(/\/admin\/trips\/[0-9a-f-]+$/);
  const copyId = page.url().split("/").at(-1)!;
  expect(copyId).not.toBe(original.id);
  const copy = await (await page.request.get(`/api/trips/${copyId}`)).json() as TripDocument;
  expect(copy.days.map(day => day.id)).not.toEqual(original.days.map(day => day.id));
  const changed = await page.request.put(`/api/trips/${copyId}`, { headers: apiHeaders, data: { ...tripInput(copy), version: copy.version, internal_title: "Изменена только копия" } });
  expect(changed.ok()).toBe(true);
  expect((await (await page.request.get(`/api/trips/${original.id}`)).json() as TripDocument).internal_title).toBe(original.internal_title);
  await page.goto("/admin/trips");
  await originalRow.getByRole("button", { name: "В архив" }).click();
  await page.getByRole("button", { name: "Архив", exact: true }).click();
  await expect(originalRow).toContainText("В архиве");
  await originalRow.getByRole("button", { name: "Удалить", exact: true }).click();
  await page.getByRole("dialog", { name: "Удалить поездку?" }).getByRole("button", { name: "Удалить поездку" }).click();
  await expect(originalRow).toHaveCount(0);
  expect((await page.request.get(`/api/trips/${original.id}`)).status()).toBe(404);
  await page.getByRole("button", { name: "Все", exact: true }).click();
  const copyRow = page.locator(".trip-row").filter({ has: page.locator(`a[href="/admin/trips/${copyId}"]`) });
  await copyRow.getByRole("button", { name: "Удалить", exact: true }).click();
  await page.getByRole("dialog", { name: "Удалить поездку?" }).getByRole("button", { name: "Удалить поездку" }).click();
  await expect(copyRow).toHaveCount(0);
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect((await page.request.get("/api/trips")).status()).toBe(401);
  await page.goto(`/admin/trips/${copyId}`);
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("two separate transfers persist in order and each contributes once", async ({ page }) => {
  const session = await page.request.post("/api/auth/login", { headers: apiHeaders, data: { login, password } });
  expect(session.ok()).toBe(true);
  const created = await page.request.post("/api/trips", { headers: apiHeaders, data: { ...newTrip(), internal_title: "Два трансфера", start_date: "2026-10-01", end_date: "2026-10-05" } });
  expect(created.ok()).toBe(true);
  let trip = await created.json() as TripDocument;
  trip = await updateFixture(page, { ...trip, participants: 5 });
  await page.goto(`/admin/trips/${trip.id}`);
  await page.locator(".item-type-buttons").getByRole("button", { name: "Трансфер", exact: true }).click();
  const form = page.getByRole("dialog");
  await form.getByLabel("Название элемента").fill("Трансфер из аэропорта");
  await form.getByLabel("Цена за единицу").fill("4000");
  await form.getByLabel("Вместимость одной машины / группы").fill("4");
  await form.getByRole("button", { name: "Сохранить элемент" }).click();
  await saved(page);
  await page.locator(".item-type-buttons").getByRole("button", { name: "Трансфер", exact: true }).click();
  await form.getByLabel("Название элемента").fill("Трансфер от вокзала");
  await form.getByLabel("Цена за единицу").fill("6000");
  await form.getByLabel("Вместимость одной машины / группы").fill("4");
  await form.getByRole("button", { name: "Сохранить элемент" }).click();
  await expect(page.locator(".timeline-item")).toHaveCount(2);
  await expect.poll(async () => (await (await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument).calculation.cost_total).toBe("20000.00");
  await saved(page);
  await page.reload();
  await expect(page.locator(".timeline-item")).toHaveCount(2);
  const persisted = await (await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
  const transfers = persisted.items.filter(item => item.type === "transfer").sort((a, b) => a.position - b.position);
  expect(transfers.map(item => item.title)).toEqual(["Трансфер из аэропорта", "Трансфер от вокзала"]);
  expect(new Set(transfers.map(item => item.id)).size).toBe(2);
  expect(transfers.map(item => item.position)).toEqual([0, 1]);
  expect(transfers.map(item => item.normalized_amount)).toEqual(["8000.00", "12000.00"]);
  expect(persisted.calculation.cost_total).toBe("20000.00");
  expect(persisted.calculation.days[0].total).toBe("20000.00");
  await expect(page.locator(".timeline-item .item-cost")).toHaveText([/8\s000,00 RUB/, /12\s000,00 RUB/]);
  await expect(page.locator(".finance-total")).toHaveText(/20\s000,00 RUB/);
});

test("real constructor saves all seven formulas, reopens, and prints a safe client itinerary on mobile", async ({ page }) => {
  test.setTimeout(180000);
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
  await page.getByRole("button", { name: /День 3/ }).click();
  await page.getByRole("button", { name: "Изменить день" }).click();
  modal = page.getByRole("dialog");
  await modal.getByLabel("Страна", { exact: true }).fill("Италия");
  await modal.getByLabel("Город", { exact: true }).fill("Рим");
  await modal.getByLabel("Место", { exact: true }).fill("Центр");
  await modal.getByRole("button", { name: "Сохранить день" }).click();
  await page.getByRole("button", { name: /День 1/ }).click();
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
  await expect(page.locator(".day-location")).toHaveText("Япония, Токио");
  await page.getByRole("button", { name: /День 3/ }).click();
  await expect(page.locator(".day-location")).toHaveText("Италия, Рим, Центр");
  await page.getByRole("button", { name: /День 1/ }).click();
  const tripId = url.split("/").at(-1)!;
  let persisted = await (await page.request.get(`/api/trips/${tripId}`)).json() as TripDocument;
  expect(persisted.days).toHaveLength(5);
  expect(persisted.days.map(day => [day.country, day.city, day.place])).toEqual(expect.arrayContaining([["Япония", "Токио", ""], ["Италия", "Рим", "Центр"]]));
  expect(persisted.items.map(item => item.calculation_mode)).toEqual(expect.arrayContaining(["per_person", "capacity", "hotel", "fixed", "per_person_per_day", "per_day", "manual"]));
  expect(persisted.items.find(item => item.currency === "EUR")).toMatchObject({ original_amount: "20.00", rate_used: "96.20000000", normalized_amount: "1924.00" });
  await page.getByRole("button", { name: "Параметры", exact: true }).click();
  modal = page.getByRole("dialog");
  await modal.getByLabel("Участники", { exact: true }).fill("9");
  await modal.getByRole("button", { name: "Применить изменения" }).click();
  await saved(page);
  await expect(page.locator(".finance-total")).toHaveText("561 174,00 RUB");
  await expect(page.locator(".client-total strong")).toHaveText("701 467,50 RUB");
  persisted = await (await page.request.get(`/api/trips/${tripId}`)).json() as TripDocument;
  expect(persisted.calculation.cost_per_person).toBe("62352.67");
  expect(persisted.items.find(item => item.type === "activity")?.normalized_amount).toBe("6000.00");
  expect(persisted.items.find(item => item.type === "transfer")?.normalized_amount).toBe("12000.00");
  expect(persisted.items.find(item => item.type === "hotel")?.normalized_amount).toBe("200000.00");
  await page.getByRole("button", { name: "Клиентский вид" }).click();
  await expect(page).toHaveURL(/\/preview$/);
  await expect(page.getByRole("heading", { name: "Пять дней в Японии", exact: true })).toBeVisible();
  for (const text of ["Клиентская заметка поездки", "Клиентская заметка дня", "Клиентская заметка элемента"]) await expect(page.getByText(text, { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("PRIVATE_");
  const preview = await (await page.request.get(`/api/trips/${tripId}/preview`)).json();
  for (const privateField of ["internal_note", "unit_price", "rates", "pricing_percent", "cost_total", "profit", "normalized_amount"]) expect(JSON.stringify(preview)).not.toContain(`"${privateField}"`);
  await expect(page.locator(".client-preview")).not.toContainText("561");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await expect(page.locator(".finance-total")).toHaveText("561 174,00 RUB");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator(".item-type-buttons").getByRole("button", { name: "Трансфер", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Сохранить элемент" })).toBeVisible();
  await page.screenshot({ path: "test-results/constructor-mobile-form.png", fullPage: true });
  await page.getByRole("dialog").getByRole("button", { name: "Отмена", exact: true }).click();
  await expect(page.getByRole("button", { name: "Сохранить", exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
