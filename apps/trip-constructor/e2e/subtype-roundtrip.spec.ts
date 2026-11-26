import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { randomBytes } from "node:crypto";
import type { TripDocument } from "../src/lib/contracts";
import { newTrip } from "../src/lib/trip-ui";
import { database } from "./test-database";
import { requirePlaywrightBaseURL } from "./isolation-guard";

const login = `subtypes-${randomBytes(8).toString("hex")}`;
const password = randomBytes(32).toString("base64url");
const headers = { "X-Requested-With": "TravelClub" };

let cookies: Awaited<ReturnType<APIRequestContext["storageState"]>>["cookies"] = [];
test.beforeAll(async ({ playwright }) => {
  database("import json,sys; from app.db import SessionLocal; from app.bootstrap import create_admin; p=json.load(sys.stdin); db=SessionLocal(); create_admin(db,p['login'],p['password']); db.close()", { login, password });
  const context = await playwright.request.newContext({ baseURL: requirePlaywrightBaseURL(process.env.PLAYWRIGHT_BASE_URL) });
  try {
    const auth = await context.post("/api/auth/login", { headers, data: { login, password } });
    expect(auth.ok()).toBe(true);
    cookies = (await context.storageState()).cookies.filter(cookie => cookie.name === "travel_session");
    expect(cookies).toHaveLength(1);
  } finally { await context.dispose(); }
});
test.afterAll(() => {
  database("import json,sys; from sqlalchemy import select,delete; from app.db import SessionLocal; from app.models import User,Trip,LoginAttempt; p=json.load(sys.stdin); db=SessionLocal(); user=db.scalar(select(User).where(User.login==p['login'])); db.execute(delete(Trip).where(Trip.created_by==user.id)) if user else None; db.delete(user) if user else None; db.execute(delete(LoginAttempt).where(LoginAttempt.login==p['login'])); db.commit(); db.close()", { login });
});

const cases = [
  ...["bus", "train", "taxi", "car", "walk", "rental", "water", "other"].map(subtype => ({ type: "transfer", category: "Транспорт", subtype, expense: false })),
  ...["restaurant", "cafe", "bar", "street_food", "other"].map(subtype => ({ type: "meal", category: "Еда", subtype, expense: false })),
  ...["activity", "excursion", "other"].map(subtype => ({ type: "activity", category: "Впечатления", subtype, expense: false })),
  ...[["insurance", "Страховка"], ["sim", "SIM-карта"], ["communication", "Связь"], ["visa_fee", "Визовый сбор"], ["service_fee", "Сервисный сбор"], ["other", "Другое"]].map(([subtype, category]) => ({ type: "other", category, subtype, expense: true })),
];

async function saved(page: Page) {
  await expect(page.locator(".save-status")).toHaveText("Сохранено", { timeout: 15000 });
}

for (const item of cases) {
  test(`${item.type}/${item.subtype} survives creation, reload and editing`, async ({ page }) => {
    await page.context().addCookies(cookies);
    const response = await page.request.post("/api/trips", { headers, data: { ...newTrip(), internal_title: `E2E ${item.type} ${item.subtype}`, start_date: "2026-10-01", end_date: "2026-10-02" } });
    expect(response.ok()).toBe(true);
    const trip = await response.json() as TripDocument;
    await page.goto(`/admin/trips/${trip.id}`);
    await page.locator(".trip-calendar-day-heading").first().click();
    const section = page.getByRole("region", { name: item.expense ? "Дополнительные расходы" : "Добавить в маршрут" });
    await section.getByRole("button", { name: item.category, exact: true }).click();
    const dialog = page.getByRole("dialog");
    if (!item.expense) {
      await dialog.getByText("Дополнительные настройки", { exact: true }).click();
      await dialog.getByText("Изменить подвид", { exact: true }).click();
      await dialog.getByLabel("Подвид").selectOption(item.subtype);
    }
    if (!await dialog.getByLabel("Название события").isVisible()) await dialog.locator("summary").getByText("Маршрут", { exact: true }).click();
    const title = `E2E ${item.type} ${item.subtype}`;
    await dialog.getByLabel("Название события").fill(title);
    if (!await dialog.getByLabel("Правило расчёта").isVisible()) await dialog.locator("summary").getByText("Стоимость", { exact: true }).click();
    await dialog.getByLabel("Правило расчёта").selectOption("fixed");
    await dialog.getByLabel("Цена за единицу", { exact: true }).fill("123");
    await dialog.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await saved(page);
    await page.reload();
    const persisted = await (await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
    expect(persisted.items.find(entry => entry.title === title)).toMatchObject({ type: item.type, subtype: item.subtype, unit_price: "123.00", calculation_mode: "fixed" });
    if (item.expense) await section.getByRole("button", { name: new RegExp(title) }).click();
    else await page.getByRole("region", { name: "Без времени" }).getByRole("button", { name: new RegExp(title) }).click();
    await dialog.getByText("Дополнительные настройки", { exact: true }).click();
    await dialog.getByText("Изменить подвид", { exact: true }).click();
    await expect(dialog.getByLabel("Подвид")).toHaveValue(item.subtype);
    if (!await dialog.getByLabel("Название события").isVisible()) await dialog.locator("summary").getByText("Маршрут", { exact: true }).click();
    await expect(dialog.getByLabel("Название события")).toHaveValue(title);
    await dialog.getByLabel("Название события").fill(`${title} edited`);
    if (!await dialog.getByLabel("Цена за единицу", { exact: true }).isVisible()) await dialog.locator("summary").getByText("Стоимость", { exact: true }).click();
    await dialog.getByLabel("Цена за единицу", { exact: true }).fill("234");
    await expect(dialog.getByLabel("Цена за единицу", { exact: true })).toHaveValue("234");
    await dialog.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(dialog, `Form errors: ${await dialog.getByRole("alert").allTextContents()}`).not.toBeVisible();
    await saved(page);
    await page.reload();
    const edited = await (await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
    expect(edited.items.find(entry => entry.title === `${title} edited`)).toMatchObject({ type: item.type, subtype: item.subtype, unit_price: "234.00", calculation_mode: "fixed" });
    if (item.expense) await section.getByRole("button", { name: new RegExp(`${title} edited`) }).click();
    else await page.getByRole("region", { name: "Без времени" }).getByRole("button", { name: new RegExp(`${title} edited`) }).click();
    if (!await dialog.getByLabel("Название события").isVisible()) await dialog.locator("summary").getByText("Маршрут", { exact: true }).click();
    await expect(dialog.getByLabel("Название события")).toHaveValue(`${title} edited`);
    if (!await dialog.getByLabel("Цена за единицу", { exact: true }).isVisible()) await dialog.locator("summary").getByText("Стоимость", { exact: true }).click();
    await expect(dialog.getByLabel("Цена за единицу", { exact: true })).toHaveValue(/^234(?:\.00)?$/);
  });
}
