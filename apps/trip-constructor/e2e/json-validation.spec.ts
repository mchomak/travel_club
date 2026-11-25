import { expect, test, type Page } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { TripDocument, TripInput } from "../src/lib/contracts";
import { newItem } from "../src/lib/trip-ui";
import { tripInput } from "../src/lib/trips";
import { database } from "./test-database";

const login = `json-e2e-${randomBytes(8).toString("hex")}`;
const password = randomBytes(32).toString("base64url");
const headers = { "X-Requested-With": "TravelClub" };

test.beforeAll(() => {
  database("import json,sys; from app.db import SessionLocal; from app.bootstrap import create_admin; p=json.load(sys.stdin); db=SessionLocal(); create_admin(db,p['login'],p['password']); db.close()", { login, password });
});

test.afterAll(() => {
  // Only this synthetic user's data is removed; global setup checks the isolated database first.
  database("import json,sys; from sqlalchemy import select,delete; from app.db import SessionLocal; from app.models import User,Trip,TripImportDraft,LoginAttempt; p=json.load(sys.stdin); db=SessionLocal(); user=db.scalar(select(User).where(User.login==p['login'])); db.execute(delete(Trip).where(Trip.created_by==user.id)) if user else None; db.execute(delete(TripImportDraft).where(TripImportDraft.created_by==user.id)) if user else None; db.delete(user) if user else None; db.execute(delete(LoginAttempt).where(LoginAttempt.login==p['login'])); db.commit(); db.close()", { login });
});

async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Логин", { exact: true }).fill(login);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Войти в кабинет", exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
}

test("exports, previews, applies and restores a selected event change", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/trips");
  await page.getByRole("link", { name: "Создать поездку", exact: true }).click();
  await page.getByLabel("Название поездки", { exact: true }).fill("JSON тестовая поездка");
  await page.getByLabel("Начало", { exact: true }).fill("2026-11-01");
  await page.getByLabel("Окончание", { exact: true }).fill("2026-11-02");
  await page.getByLabel("Участники", { exact: true }).fill("2");
  await page.getByLabel("Базовая валюта", { exact: true }).fill("CNY");
  await page.getByRole("button", { name: "Создать поездку", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/trips\/[0-9a-f-]+\/builder\?step=2(?:&|$)/);
  const id = page.url().match(/\/trips\/([0-9a-f-]+)\/builder/)![1];
  const initialResponse = await page.request.get(`/api/trips/${id}`);
  expect(initialResponse.ok()).toBe(true);
  const initial = await initialResponse.json() as TripDocument;
  const input = tripInput(initial);
  const item = { ...newItem("activity", input.days[0], "CNY", input.start_date), title: "Исходное событие", unit_price: "100" };
  input.items.push(item);
  const seeded = await page.request.put(`/api/trips/${id}`, { headers, data: { ...input, version: initial.version } });
  expect(seeded.ok(), await seeded.text()).toBe(true);

  await page.goto(`/admin/trips/${id}`);
  await expect(page.getByRole("region", { name: "Без времени" }).getByText("Исходное событие", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Проверка маршрута" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Скачать актуальный JSON" }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const exported = JSON.parse(await readFile(downloadPath!, "utf8")) as { format: string; version: number; reimport: { trip_id: string; snapshot_id: string }; trip: TripInput };
  expect(exported).toMatchObject({ format: "travel-club-trip", version: 1, reimport: { trip_id: id, snapshot_id: expect.any(String) } });
  expect(exported.reimport.snapshot_id).not.toBe("");
  const exportedItem = exported.trip.items.find(value => value.id === item.id);
  expect(exportedItem?.title).toBe("Исходное событие");
  exportedItem!.title = "Исправленное событие";

  await page.getByRole("button", { name: "Загрузить исправленный JSON" }).click();
  const dialog = page.getByRole("dialog", { name: "Обновление маршрута" });
  await dialog.getByLabel("Исправленный JSON").setInputFiles({ name: "corrected.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(exported)) });
  const change = dialog.getByRole("checkbox", { name: `Выбрать изменение /items/${item.id}/title` });
  await expect(change).not.toBeChecked();
  await expect(dialog.getByRole("button", { name: "Применить выбранное" })).toBeDisabled();
  await change.check();
  await dialog.getByRole("button", { name: "Применить выбранное" }).click();
  await dialog.getByRole("button", { name: "Подтвердить применение" }).click();
  await expect(dialog.getByRole("button", { name: "Восстановить прежнюю версию" })).toBeVisible();
  await expect.poll(async () => ((await (await page.request.get(`/api/trips/${id}`)).json()) as TripDocument).items.find(value => value.id === item.id)?.title).toBe("Исправленное событие");
  await expect(page.getByRole("region", { name: "Без времени", includeHidden: true }).getByText("Исправленное событие", { exact: true })).toHaveText("Исправленное событие");
  const backups = dialog.getByLabel("Резервная версия");
  await expect(backups.locator("option")).toHaveCount(2);
  await backups.selectOption({ index: 1 });
  await dialog.getByRole("button", { name: "Восстановить прежнюю версию" }).click();
  await dialog.getByRole("button", { name: "Подтвердить восстановление" }).click();
  await expect.poll(async () => ((await (await page.request.get(`/api/trips/${id}`)).json()) as TripDocument).items.find(value => value.id === item.id)?.title).toBe("Исходное событие");
  await dialog.getByRole("button", { name: "Закрыть" }).click();
  await expect(page.getByRole("region", { name: "Без времени" }).getByText("Исходное событие", { exact: true })).toBeVisible();
});

test("offers to save a readable invalid import without losing unknown fields", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/trips");
  const source = JSON.stringify({ format: "travel-club-trip", version: 1, trip: { unknown_e2e_field: { marker: "preserve me" } } }, null, 2);
  await page.locator('input[type="file"]').setInputFiles({ name: "invalid.json", mimeType: "application/json", buffer: Buffer.from(source) });
  await page.getByRole("button", { name: "Сохранить исходник как черновик" }).click();
  await expect(page.getByLabel("JSON черновика")).toHaveValue(source);
  await page.reload();
  await page.getByRole("button", { name: /Открыть черновик/ }).click();
  await expect(page.getByLabel("JSON черновика")).toHaveValue(source);
});

test("creates an incomplete trip from a draft while preserving an unknown event", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/trips");
  const source = JSON.stringify({
    format: "travel-club-trip", version: 1,
    trip: {
      internal_title: "Поездка с неизвестным событием", start_date: "2027-04-01", end_date: "2027-04-01",
      participants: 2, base_currency: "RUB",
      items: [{ type: "unknown", title: "Сохранить неизвестное событие", calculation_mode: "fixed", currency: "RUB", unit_price: "50" }],
    },
  }, null, 2);
  await page.locator('input[type="file"]').setInputFiles({ name: "unknown-event.json", mimeType: "application/json", buffer: Buffer.from(source) });
  await page.getByRole("button", { name: "Сохранить исходник как черновик" }).click();
  await expect(page.getByLabel("JSON черновика")).toHaveValue(source);
  const heading = page.getByRole("heading", { name: /^Черновик [0-9a-f-]+ · версия/ });
  const draftId = (await heading.innerText()).match(/Черновик ([0-9a-f-]+)/)?.[1];
  expect(draftId).toBeTruthy();
  await page.getByRole("button", { name: "Создать поездку из черновика" }).click();
  await expect(page).toHaveURL(/\/admin\/trips\/[0-9a-f-]+$/);
  await expect(page.getByRole("status").filter({ hasText: "Часть исходных данных не применена. Смета неполная" })).toBeVisible();
  const id = page.url().match(/\/trips\/([0-9a-f-]+)$/)![1];
  const tripResponse = await page.request.get(`/api/trips/${id}`);
  expect(tripResponse.ok()).toBe(true);
  const trip = await tripResponse.json() as TripDocument;
  expect(trip.items).toHaveLength(0);
  expect(trip.unapplied_import_id).toBe(draftId);
  await page.getByRole("link", { name: "Открыть исходный JSON и отчёт" }).click();
  await page.getByRole("button", { name: new RegExp(`Открыть черновик ${draftId} · версия`) }).click();
  await expect(page.getByLabel("JSON черновика")).toHaveValue(source);
  await expect(page.getByText(/Исходные значения сохранены в JSON выше; смета созданной поездки неполная/)).toBeVisible();
});
