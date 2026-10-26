import { expect, test, type Page } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import Decimal from "decimal.js";
import type { ItemInput, TripDocument, TripInput } from "../src/lib/contracts";
import { newItem } from "../src/lib/trip-ui";
import { tripInput } from "../src/lib/trips";

const login = `t04-${randomBytes(8).toString("hex")}`;
const password = randomBytes(32).toString("base64url");
const project = path.resolve(import.meta.dirname, "../..");
const headers = { "X-Requested-With": "TravelClub" };
const ownedTrips: string[] = [];
const qa = path.join(project, "test-results/trip-builder");

function database(code: string, input: object) {
  return execFileSync(
    "docker",
    process.env.PLAYWRIGHT_BACKEND_CONTAINER
      ? ["exec", "-i", process.env.PLAYWRIGHT_BACKEND_CONTAINER, "python", "-c", code]
      : ["compose", "exec", "-T", "backend", "python", "-c", code],
    { cwd: project, input: JSON.stringify(input), encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
  );
}

test.beforeAll(() => {
  database(
    "import json,sys; from app.db import SessionLocal; from app.bootstrap import create_admin; p=json.load(sys.stdin); db=SessionLocal(); create_admin(db,p['login'],p['password']); db.close()",
    { login, password },
  );
});

test.afterAll(() => {
  database(
    "import json,sys; from sqlalchemy import select,delete; from app.db import SessionLocal; from app.models import User,Trip,LoginAttempt; p=json.load(sys.stdin); db=SessionLocal(); user=db.scalar(select(User).where(User.login==p['login'])); db.execute(delete(Trip).where(Trip.created_by==user.id)) if user else None; db.delete(user) if user else None; db.execute(delete(LoginAttempt).where(LoginAttempt.login==p['login'])); db.commit(); db.close()",
    { login },
  );
});

async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Логин", { exact: true }).fill(login);
  await page.getByLabel("Пароль", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Войти в кабинет", exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
}

async function createTrip(page: Page, title: string) {
  await page.goto("/admin/trips");
  await page.getByRole("link", { name: "Создать поездку", exact: true }).click();
  await page.getByLabel("Название поездки", { exact: true }).fill(title);
  await page.getByLabel("Начало", { exact: true }).fill("2026-11-01");
  await page.getByLabel("Окончание", { exact: true }).fill("2026-11-08");
  await page.getByLabel("Участники", { exact: true }).fill("5");
  await page.getByLabel("Базовая валюта", { exact: true }).fill("CNY");
  await page.getByRole("button", { name: "Создать поездку", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/trips\/[0-9a-f-]+\/builder\?step=2(?:&|$)/);
  const id = page.url().match(/\/trips\/([0-9a-f-]+)\/builder/)?.[1];
  expect(id).toBeTruthy();
  ownedTrips.push(id!);
  const response = await page.request.get(`/api/trips/${id}`);
  expect(response.ok()).toBe(true);
  return await response.json() as TripDocument;
}

function place(name: string, latitude: number, longitude: number) {
  return { name, address: `${name}, Tokyo`, latitude, longitude, provider: "manual" as const };
}

function fixtureItem(type: ItemInput["type"], day: TripInput["days"][number] | null, title: string, price: string, start: string) {
  return { ...newItem(type, day, "CNY", start), title, unit_price: price };
}

async function addBuilderFlight(page: Page, trip: TripDocument, item: {
  title: string; price: string; dayId: string; endDayId: string; start: string; end: string; departureOffset: number; arrivalOffset: number;
}) {
  await page.getByRole("region", { name: "Дальние переезды", exact: true }).getByRole("button", { name: "Добавить перелёт", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Название элемента", { exact: true }).fill(item.title);
  await dialog.getByLabel("День маршрута", { exact: true }).selectOption(item.dayId);
  await dialog.getByLabel("Вылет по местному времени", { exact: true }).fill(item.start);
  await dialog.getByLabel("Дата окончания", { exact: true }).selectOption(item.endDayId);
  await dialog.getByLabel("Прилёт по местному времени", { exact: true }).fill(item.end);
  await dialog.getByLabel("UTC при отправлении", { exact: true }).selectOption(String(item.departureOffset));
  await dialog.getByLabel("UTC при прибытии", { exact: true }).selectOption(String(item.arrivalOffset));
  await dialog.getByLabel("Цена билета", { exact: true }).fill(item.price);
  await dialog.getByRole("button", { name: "Сохранить элемент", exact: true }).click();
  await expect(dialog).not.toBeVisible({ timeout: 10000 });
  await saved(page);
  const response = await page.request.get("/api/trips/" + trip.id);
  expect(response.ok()).toBe(true);
  return await response.json() as TripDocument;
}

async function addBuilderHotel(page: Page, trip: TripDocument, item: { title: string; checkIn: string; checkOut: string; price: string }) {
  await page.getByRole("region", { name: "Отели поездки", exact: true }).getByRole("button", { name: "Добавить отель", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Название элемента", { exact: true }).fill(item.title);
  await dialog.getByLabel("Заезд — дата", { exact: true }).fill(item.checkIn);
  await dialog.getByLabel("Выезд — дата", { exact: true }).fill(item.checkOut);
  await dialog.getByLabel("Цена номера за ночь", { exact: true }).fill(item.price);
  await dialog.getByRole("button", { name: "Сохранить элемент", exact: true }).click();
  await expect(dialog).not.toBeVisible({ timeout: 10000 });
  await saved(page);
  const response = await page.request.get("/api/trips/" + trip.id);
  expect(response.ok()).toBe(true);
  return await response.json() as TripDocument;
}

async function seedEightDays(page: Page, trip: TripDocument) {
  const input = tripInput(trip);
  input.days.forEach((day, index) => {
    day.country = "Япония";
    day.city = index < 4 ? "Токио" : "Киото";
    day.title = `День ${index + 1}`;
  });
  input.days[0].client_note = "Первый день маршрута";
  const tea = fixtureItem("meal", input.days[0], "Чайная церемония", "100", input.start_date);
  Object.assign(tea, { subtype: "restaurant", start_time: "09:00", end_time: "10:00" });
  const garden = fixtureItem("activity", input.days[0], "Сад у дворца", "150", input.start_date);
  Object.assign(garden, { subtype: "activity", participants_override: 3, start_time: "11:00", end_time: "12:00", map_place: place("Сад", 35.64, 139.70) });
  const taxi = fixtureItem("transfer", input.days[0], "Такси до вокзала", "900", input.start_date);
  Object.assign(taxi, { subtype: "taxi", calculation_mode: "capacity", capacity: 4, start_time: "12:30", end_time: "13:00" });
  const secondMeal = fixtureItem("meal", input.days[2], "Ужин в Киото", "80", input.start_date);
  Object.assign(secondMeal, { subtype: "restaurant", start_time: "19:00", end_time: "20:00", map_place: place("Ресторан", 35.01, 135.76) });
  input.items = [...input.items, tea, garden, taxi, secondMeal];
  const response = await page.request.put(`/api/trips/${trip.id}`, { headers, data: { ...input, version: trip.version } });
  expect(response.ok(), await response.text()).toBe(true);
  return await response.json() as TripDocument;
}

async function mapProvider(page: Page) {
  await page.route("**/api/maps/config", route => route.fulfill({ json: { maps_key: "TEST_ONLY_MAPS_KEY_NOT_VALID", search_enabled: true, routing_enabled: true } }));
  await page.route("https://maps.geoapify.com/**", route => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e6ede5"/></svg>' }));
  await page.route("**/api/maps/route", route => {
    const { from, to } = route.request().postDataJSON();
    return route.fulfill({ json: { status: "ok", distance_m: 1200, duration_s: 600, geometry: { type: "LineString", coordinates: [[from.longitude, from.latitude], [to.longitude, to.latitude]] }, approximate: false, message: null } });
  });
}

async function saved(page: Page) {
  await expect(page.locator(".save-status")).toHaveText("Сохранено", { timeout: 15000 });
}

test("builder round-trips an eight-day itinerary through UI, API and PostgreSQL", async ({ page }) => {
  test.setTimeout(120000);
  page.setDefaultTimeout(10000);
  await mapProvider(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await signIn(page);
  const created = await createTrip(page, "Сквозная приёмка — Япония");
  expect(created.status).toBe("draft");
  expect(created.participants).toBe(5);
  expect(created.days).toHaveLength(8);

  let afterFlights = await addBuilderFlight(page, created, {
    title: "Перелёт Пекин — Токио", price: "1000", dayId: created.days[0].id, endDayId: created.days[1].id,
    start: "23:30", end: "05:30", departureOffset: 480, arrivalOffset: 540,
  });
  expect(afterFlights.items.find(item => item.title === "Перелёт Пекин — Токио")).toMatchObject({
    start_time: "23:30:00", end_time: "05:30:00", end_day_id: created.days[1].id,
    departure_utc_offset_minutes: 480, arrival_utc_offset_minutes: 540,
  });
  afterFlights = await addBuilderFlight(page, created, {
    title: "Перелёт Токио — Киото", price: "800", dayId: created.days[4].id, endDayId: created.days[4].id,
    start: "10:00", end: "15:00", departureOffset: 540, arrivalOffset: 540,
  });
  expect(afterFlights.items.filter(item => item.type === "flight")).toHaveLength(2);
  const longHaulStep = page.getByRole("region", { name: "Дальние переезды", exact: true });
  await expect(longHaulStep).toContainText("Перелёт Пекин — Токио");
  await expect(longHaulStep).toContainText("Перелёт Токио — Киото");

  await page.getByRole("navigation", { name: "Этапы поездки" }).getByRole("button", { name: /Проживание/ }).click();
  await expect(page).toHaveURL(/step=3/);
  expect(afterFlights.items.filter(item => item.type === "flight")).toHaveLength(2);
  const afterTokyoHotel = await addBuilderHotel(page, created, { title: "Отель в Токио", checkIn: "2026-11-02", checkOut: "2026-11-05", price: "1000" });
  expect(afterTokyoHotel.items.filter(item => item.type === "hotel")).toHaveLength(1);
  const afterHotels = await addBuilderHotel(page, created, { title: "Отель в Киото", checkIn: "2026-11-05", checkOut: "2026-11-08", price: "1200" });
  expect(afterHotels.items.filter(item => item.type === "hotel")).toHaveLength(2);
  await expect(page.getByRole("region", { name: "Отели поездки", exact: true })).toContainText("Отель в Токио");
  await expect(page.getByRole("region", { name: "Отели поездки", exact: true })).toContainText("Отель в Киото");
  await page.getByRole("navigation", { name: "Этапы поездки" }).getByRole("button", { name: /Программа по дням/ }).click();
  const latest = await (await page.request.get("/api/trips/" + created.id)).json() as TripDocument;
  const seeded = await seedEightDays(page, latest);
  expect(seeded.items).toHaveLength(8);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Программа по дням", exact: true })).toBeVisible();
  await page.getByRole("navigation", { name: "Этапы поездки" }).getByRole("button", { name: /Проживание/ }).click();
  const hotels = page.getByRole("region", { name: "Отели поездки", exact: true });
  await expect(hotels).toContainText("Отель в Токио");
  await expect(hotels).toContainText("Отель в Киото");
  await page.getByRole("navigation", { name: "Этапы поездки" }).getByRole("button", { name: /Программа по дням/ }).click();

  const tripCalendar = page.getByRole("region", { name: "Календарь поездки", exact: true });
  await expect(tripCalendar.locator(".trip-calendar-hotel-bar").filter({ hasText: "Отель в Токио" })).toBeVisible();
  await expect(tripCalendar.locator(".trip-calendar-hotel-bar").filter({ hasText: "Отель в Киото" })).toBeVisible();
  const splitLongHaul = tripCalendar.locator(".trip-calendar-event[aria-label*='Перелёт Пекин']");
  await expect(splitLongHaul).toHaveCount(2);
  await expect(splitLongHaul.nth(0)).toHaveAttribute("aria-label", /2026-11-01, 23:30 — 24:00/);
  await expect(splitLongHaul.nth(1)).toHaveAttribute("aria-label", /2026-11-02, 00:00 — 05:30/);
  const firstDay = page.getByRole("region", { name: "Программа дня", exact: true });
  await expect(firstDay).toContainText("Чайная церемония");
  await expect(firstDay).toContainText("Сад у дворца");
  await page.getByRole("button", { name: "Следующий день", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`day=${seeded.days[1].id}`));
  await expect(page.getByRole("button", { name: "Предыдущий день", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Предыдущий день", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`day=${seeded.days[0].id}`));

  const teaEvent = tripCalendar.locator(".trip-calendar-event[aria-label*='Чайная церемония']");
  await teaEvent.scrollIntoViewIfNeeded();
  await teaEvent.click();
  let itemDialog = page.getByRole("dialog");
  await itemDialog.getByLabel("Название элемента", { exact: true }).fill("Чайная церемония — общая сетка");
  await itemDialog.getByRole("button", { name: "Сохранить элемент", exact: true }).click();
  await expect(itemDialog).not.toBeVisible();
  await saved(page);

  const gardenMarker = page.getByRole("region", { name: "Маршрут дня", exact: true }).getByLabel("Карта выбранного дня", { exact: true }).locator('.leaflet-marker-icon[title="Сад у дворца"]');
  await expect(gardenMarker).toBeVisible();
  await gardenMarker.click({ timeout: 8000 });
  const gardenRow = firstDay.locator("li").filter({ hasText: "Сад у дворца" });
  await expect(gardenRow.getByRole("button").first()).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("region", { name: "Маршрут дня", exact: true }).locator("li[aria-current='true']")).toContainText("Сад у дворца");

  await firstDay.getByRole("button", { name: "Редактировать Чайная церемония — общая сетка", exact: true }).click();
  itemDialog = page.getByRole("dialog");
  await itemDialog.getByLabel("Название элемента", { exact: true }).fill("Чайная церемония — список дня");
  await itemDialog.getByRole("button", { name: "Сохранить элемент", exact: true }).click();
  await saved(page);

  await firstDay.getByRole("button", { name: "Редактировать Чайная церемония — список дня", exact: true }).click();
  itemDialog = page.getByRole("dialog");
  await itemDialog.getByLabel("День маршрута", { exact: true }).selectOption(seeded.days[1].id);
  await itemDialog.getByRole("button", { name: "Сохранить элемент", exact: true }).click();
  await saved(page);
  const moved = await (await page.request.get(`/api/trips/${created.id}`)).json() as TripDocument;
  const tea = moved.items.find(item => item.title === "Чайная церемония — список дня");
  expect(tea?.day_id).toBe(seeded.days[1].id);
  expect(moved.items.filter(item => item.id === tea?.id)).toHaveLength(1);

  const taxiRow = firstDay.locator("li").filter({ hasText: "Такси до вокзала" });
  await taxiRow.getByRole("button", { name: "Удалить Такси до вокзала", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Удалить элемент", exact: true }).click();
  await saved(page);
  let persisted = await (await page.request.get(`/api/trips/${created.id}`)).json() as TripDocument;
  expect(persisted.items.some(item => item.title === "Такси до вокзала")).toBe(false);
  expect(persisted.calculation.cost_total).toBe("30150.00");
  expect(new Set(persisted.items.map(item => item.id)).size).toBe(persisted.items.length);
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await saved(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Программа по дням", exact: true })).toBeVisible();
  persisted = await (await page.request.get(`/api/trips/${created.id}`)).json() as TripDocument;
  expect(persisted.items.find(item => item.title === "Чайная церемония — список дня")?.day_id).toBe(seeded.days[1].id);
  expect(persisted.items.find(item => item.title === "Перелёт Пекин — Токио")).toMatchObject({ departure_utc_offset_minutes: 480, arrival_utc_offset_minutes: 540, end_day_id: seeded.days[1].id });

  const sql = database(
    "import json,sys; from sqlalchemy import text; from app.db import SessionLocal; p=json.load(sys.stdin); db=SessionLocal(); trip=db.execute(text('SELECT id::text,created_by::text,version,cost_total::text,client_price::text FROM trips WHERE id=:id AND created_by=(SELECT id FROM users WHERE login=:login)'),p).mappings().one(); days=db.execute(text('SELECT id::text,date::text FROM trip_days WHERE trip_id=:id ORDER BY date'),p).mappings().all(); items=db.execute(text('SELECT id::text,title,type,day_id::text,end_day_id::text,departure_utc_offset_minutes,arrival_utc_offset_minutes,original_amount::text,rate_used::text,normalized_amount::text FROM trip_items WHERE trip_id=:id ORDER BY title'),p).mappings().all(); print(json.dumps({'trip':dict(trip),'days':[dict(x) for x in days],'items':[dict(x) for x in items]},default=str)); db.close()",
    { id: created.id, login },
  );
  const dbRows = JSON.parse(sql) as { trip: { cost_total: string }; days: { id: string }[]; items: { id: string; title: string; original_amount: string; rate_used: string; normalized_amount: string; departure_utc_offset_minutes: number | null; arrival_utc_offset_minutes: number | null }[] };
  expect(dbRows.days).toHaveLength(8);
  expect(dbRows.items).toHaveLength(7);
  expect(new Set(dbRows.items.map(item => item.id)).size).toBe(7);
  expect(dbRows.trip.cost_total).toBe("30150.00");
  expect(dbRows.items.find(item => item.title === "Чайная церемония — список дня")).toMatchObject({ original_amount: "500.00", rate_used: "1.00000000", normalized_amount: "500.00" });
  expect(dbRows.items.find(item => item.title === "Перелёт Пекин — Токио")).toMatchObject({ departure_utc_offset_minutes: 480, arrival_utc_offset_minutes: 540 });

  await mkdir(qa, { recursive: true });
  await page.screenshot({ path: path.join(qa, "desktop.png"), fullPage: true, mask: [page.locator("header > div > span")], maskColor: "#e8ede7" });
  const columnLayout = page.getByRole("region", { name: "Программа дня", exact: true }).locator("..");
  const desktopColumns = await columnLayout.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length);
  expect(desktopColumns).toBe(3);
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect.poll(() => columnLayout.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length)).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: /День 2/ }).click();
  await expect(page.getByRole("region", { name: "Программа дня", exact: true })).toContainText("Чайная церемония — список дня");
  await page.screenshot({ path: path.join(qa, "tablet.png"), fullPage: true, mask: [page.locator("header > div > span")], maskColor: "#e8ede7" });

  await page.getByRole("navigation", { name: "Этапы поездки" }).getByRole("button", { name: /Проверка/ }).click();
  await page.getByRole("button", { name: "Завершить и открыть полный редактор", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/trips/${created.id}$`));
  await expect(page.getByRole("heading", { name: "Сквозная приёмка — Япония", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Пошаговый конструктор", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/trips/${created.id}/builder\\?step=4`));
  await page.goto(`/admin/trips/${created.id}/builder?step=4&day=${seeded.days[3].id}`);
  await expect(page.getByRole("navigation", { name: "Дни поездки" }).getByRole("button", { name: /День 4/ })).toHaveAttribute("aria-current", "date");
  await expect(page.getByRole("region", { name: "Программа дня" }).getByRole("heading", { name: "День 4", exact: true })).toBeVisible();
});

test("save error can be retried and a delayed write keeps the last rapid day edit", async ({ page }) => {
  test.setTimeout(120000);
  await signIn(page);
  const trip = await createTrip(page, "Сохранение и быстрые переходы");
  await page.getByRole("navigation", { name: "Этапы поездки" }).getByRole("button", { name: /Программа по дням/ }).click();

  let failNext = true;
  await page.route(`**/api/trips/${trip.id}*`, async route => {
    if (route.request().method() === "PUT" && failNext) { failNext = false; await route.abort("failed"); return; }
    await route.continue();
  });
  await page.getByRole("button", { name: "Детали и заметки дня", exact: true }).click();
  let dayDialog = page.getByRole("dialog");
  await dayDialog.getByLabel("Город", { exact: true }).fill("Сохранить после ошибки");
  await dayDialog.getByRole("button", { name: "Сохранить день", exact: true }).click();
  await expect(page.locator(".save-status")).toHaveText("Не удалось сохранить", { timeout: 15000 });
  await page.getByRole("alert").getByRole("button", { name: "Повторить", exact: true }).click();
  await saved(page);
  await page.unroute(`**/api/trips/${trip.id}*`);

  let release!: () => void;
  let started!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const requestStarted = new Promise<void>(resolve => { started = resolve; });
  let delayFirstPut = true;
  await page.route(`**/api/trips/${trip.id}*`, async route => {
    if (route.request().method() === "PUT" && delayFirstPut) {
      delayFirstPut = false;
      started();
      await gate;
    }
    await route.continue();
  });
  await page.getByRole("button", { name: "Детали и заметки дня", exact: true }).click();
  dayDialog = page.getByRole("dialog");
  await dayDialog.getByLabel("Город", { exact: true }).fill("Первый запрос задержан");
  await dayDialog.getByRole("button", { name: "Сохранить день", exact: true }).click();
  await requestStarted;
  await expect(page.locator(".save-status")).toHaveText("Сохранение…");
  await page.getByRole("button", { name: "Следующий день", exact: true }).click();
  await page.getByRole("button", { name: "Детали и заметки дня", exact: true }).click();
  dayDialog = page.getByRole("dialog");
  await dayDialog.getByLabel("Город", { exact: true }).fill("Последняя быстрая правка");
  await dayDialog.getByRole("button", { name: "Сохранить день", exact: true }).click();
  release();
  await saved(page);
  const final = await (await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
  expect(final.days[0].city).toBe("Первый запрос задержан");
  expect(final.days[1].city).toBe("Последняя быстрая правка");
});

test("legacy null-offset overnight items remain editable and protected routes require auth", async ({ page, request }) => {
  const denied = await request.get("/api/trips");
  expect(denied.status()).toBe(401);
  await signIn(page);
  let trip = await createTrip(page, "Совместимость старого маршрута");
  const input = tripInput(trip);
  const legacy = fixtureItem("flight", input.days[0], "Старый ночной рейс", "500", input.start_date);
  Object.assign(legacy, { start_time: "23:00", end_time: "02:00", end_day_id: null, departure_utc_offset_minutes: null, arrival_utc_offset_minutes: null });
  input.items = [legacy];
  const seeded = await page.request.put(`/api/trips/${trip.id}`, { headers, data: { ...input, version: trip.version } });
  expect(seeded.ok(), await seeded.text()).toBe(true);
  trip = await seeded.json() as TripDocument;
  expect(trip.items[0]).toMatchObject({ departure_utc_offset_minutes: null, arrival_utc_offset_minutes: null, end_day_id: null });
  await page.goto(`/admin/trips/${trip.id}`);
  const event = page.getByRole("button", { name: /Старый ночной рейс/ }).first();
  await event.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Название элемента", { exact: true })).toHaveValue("Старый ночной рейс");
  await dialog.getByLabel("Название элемента", { exact: true }).fill("Старый ночной рейс — сохранён");
  await dialog.getByRole("button", { name: "Сохранить элемент", exact: true }).click();
  await saved(page);
  const persisted = await (await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
  expect(persisted.items[0]).toMatchObject({ title: "Старый ночной рейс — сохранён", start_time: "23:00:00", end_time: "02:00:00", departure_utc_offset_minutes: null, arrival_utc_offset_minutes: null });
  expect([null, trip.days[1].id]).toContain(persisted.items[0].end_day_id);
});

test("editing saved flight and hotel dates updates calendar, day programs, API and PostgreSQL", async ({ page }) => {
  test.setTimeout(90000);
  page.setDefaultTimeout(10000);
  await mapProvider(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await signIn(page);
  const trip = await createTrip(page, "R51 date projection review");
  const createdFlightTrip = await addBuilderFlight(page, trip, {
    title: "R51 overnight flight", price: "1000", dayId: trip.days[0].id, endDayId: trip.days[1].id,
    start: "23:30", end: "05:30", departureOffset: 480, arrivalOffset: 540,
  });
  const originalFlight = createdFlightTrip.items.find(item => item.title === "R51 overnight flight")!;
  await page.getByRole("navigation", { name: "Этапы поездки" }).getByRole("button", { name: /Проживание/ }).click();
  const createdHotelTrip = await addBuilderHotel(page, trip, {
    title: "R51 Tokyo hotel", checkIn: "2026-11-02", checkOut: "2026-11-04", price: "1000",
  });
  const originalHotel = createdHotelTrip.items.find(item => item.title === "R51 Tokyo hotel")!;
  expect(originalHotel.id).toBeTruthy();

  await page.getByRole("navigation", { name: "Этапы поездки" }).getByRole("button", { name: /Программа по дням/ }).click();
  const calendar = page.getByRole("region", { name: "Календарь поездки", exact: true });
  const flightSegments = calendar.locator(".trip-calendar-event").filter({ has: page.locator("strong", { hasText: "R51 overnight flight" }) });
  await expect(flightSegments).toHaveCount(2);
  await expect(flightSegments.nth(0)).toHaveAttribute("aria-label", /2026-11-01/);
  await expect(flightSegments.nth(1)).toHaveAttribute("aria-label", /2026-11-02/);
  const flightEvent = calendar.locator(".trip-calendar-event[aria-label*='R51 overnight flight']").first();
  await flightEvent.scrollIntoViewIfNeeded();
  await flightEvent.click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("День маршрута", { exact: true }).selectOption(trip.days[2].id);
  await dialog.getByLabel("Дата окончания", { exact: true }).selectOption(trip.days[3].id);
  await dialog.getByRole("button", { name: "Сохранить элемент", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await saved(page);

  const editedFlightTrip = await (await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
  const editedFlight = editedFlightTrip.items.find(item => item.id === originalFlight.id)!;
  expect(editedFlightTrip.items.filter(item => item.id === originalFlight.id)).toHaveLength(1);
  expect(editedFlight).toMatchObject({ id: originalFlight.id, day_id: trip.days[2].id, end_day_id: trip.days[3].id,
    departure_utc_offset_minutes: 480, arrival_utc_offset_minutes: 540 });
  const movedFlightSegments = calendar.locator(".trip-calendar-event[aria-label*='R51 overnight flight']");
  await expect(movedFlightSegments).toHaveCount(2);
  await expect(movedFlightSegments.nth(0)).toHaveAttribute("aria-label", /2026-11-03/);
  await expect(movedFlightSegments.nth(1)).toHaveAttribute("aria-label", /2026-11-04/);
  await expect(calendar.locator(".trip-calendar-event[aria-label*='R51 overnight flight'][aria-label*='2026-11-01']")).toHaveCount(0);
  await expect(calendar.locator(".trip-calendar-event[aria-label*='R51 overnight flight'][aria-label*='2026-11-02']")).toHaveCount(0);

  const hotelBar = calendar.locator(".trip-calendar-hotel-bar").filter({ hasText: "R51 Tokyo hotel" });
  await expect(hotelBar).toHaveAttribute("aria-label", /2026-11-02 — 2026-11-04/);
  await hotelBar.click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Заезд — дата", { exact: true }).fill("2026-11-06");
  await dialog.getByLabel("Выезд — дата", { exact: true }).fill("2026-11-08");
  await dialog.getByRole("button", { name: "Сохранить элемент", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await saved(page);

  const edited = await (await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
  const flight = edited.items.find(item => item.id === originalFlight.id)!;
  const hotel = edited.items.find(item => item.id === originalHotel.id)!;
  expect(edited.items.filter(item => item.id === originalFlight.id)).toHaveLength(1);
  expect(edited.items.filter(item => item.id === originalHotel.id)).toHaveLength(1);
  expect(flight).toMatchObject({ id: originalFlight.id, day_id: trip.days[2].id, end_day_id: trip.days[3].id });
  expect(hotel).toMatchObject({ id: originalHotel.id, day_id: trip.days[5].id, check_in: "2026-11-06", check_out: "2026-11-08" });
  expect(edited.days).toHaveLength(8);
  expect(new Set(edited.days.map(day => day.id)).size).toBe(8);
  expect(new Set(edited.days.map(day => day.date)).size).toBe(8);
  const dayTotal = (date: string) => edited.calculation.days.find(day => day.date === date)!.total;
  expect(dayTotal("2026-11-01")).toBe("0.00");
  expect(dayTotal("2026-11-02")).toBe("0.00");
  expect(dayTotal("2026-11-03")).toBe(flight.normalized_amount);
  expect(dayTotal("2026-11-04")).toBe("0.00");
  expect(dayTotal("2026-11-06")).toBe(new Decimal(hotel.normalized_amount).div(2).toFixed(2));
  expect(dayTotal("2026-11-07")).toBe(new Decimal(hotel.normalized_amount).div(2).toFixed(2));
  expect(dayTotal("2026-11-08")).toBe("0.00");

  await expect(calendar.locator(".trip-calendar-hotel-bar").filter({ hasText: "R51 Tokyo hotel" })).toHaveAttribute("aria-label", /2026-11-06 — 2026-11-08/);
  await expect(calendar.locator(".trip-calendar-day[data-date='2026-11-02'] .trip-calendar-check-in, .trip-calendar-day[data-date='2026-11-03'] .trip-calendar-check-in")).toHaveCount(0);
  await expect(calendar.locator(".trip-calendar-day[data-date='2026-11-04'] .trip-calendar-check-out")).toHaveCount(0);
  await expect(calendar.locator(".trip-calendar-day[data-date='2026-11-06'] .trip-calendar-check-in")).toHaveCount(1);
  await calendar.getByRole("button", { name: "Следующие дни", exact: true }).click();
  await expect(calendar.locator(".trip-calendar-day[data-date='2026-11-08'] .trip-calendar-check-out")).toHaveCount(1);

  const program = page.getByRole("region", { name: "Программа дня", exact: true });
  const dayButton = (number: number) => page.getByRole("navigation", { name: "Дни поездки" }).getByRole("button", { name: new RegExp(`День ${number}\\b`) });
  const expectProgramItem = async (number: number, title: string, present: boolean) => {
    await dayButton(number).click();
    const rows = program.locator("li").filter({ hasText: title });
    if (present) await expect(rows).toHaveCount(1);
    else await expect(rows).toHaveCount(0);
  };
  await expectProgramItem(1, "R51 overnight flight", false);
  await expectProgramItem(2, "R51 overnight flight", false);
  await expectProgramItem(3, "R51 overnight flight", true);
  await expectProgramItem(4, "R51 overnight flight", true);
  await expectProgramItem(4, "R51 Tokyo hotel", false);
  await expectProgramItem(6, "R51 Tokyo hotel", true);
  await expectProgramItem(7, "R51 Tokyo hotel", true);
  await expectProgramItem(8, "R51 Tokyo hotel", true);

  const sql = database(
    "import json,sys; from sqlalchemy import text; from app.db import SessionLocal; p=json.load(sys.stdin); db=SessionLocal(); owner=db.execute(text('SELECT id FROM trips WHERE id=CAST(:trip_id AS uuid) AND created_by=(SELECT id FROM users WHERE login=:login)'),p).one(); days=db.execute(text('SELECT id::text,date::text FROM trip_days WHERE trip_id=CAST(:trip_id AS uuid) ORDER BY date'),p).mappings().all(); items=db.execute(text('SELECT i.id::text,i.type,i.day_id::text,i.end_day_id::text,i.check_in::text,i.check_out::text FROM trip_items i JOIN trips t ON t.id=i.trip_id WHERE t.id=CAST(:trip_id AS uuid) AND t.created_by=(SELECT id FROM users WHERE login=:login) AND i.id IN (CAST(:flight_id AS uuid),CAST(:hotel_id AS uuid)) ORDER BY i.id'),p).mappings().all(); print(json.dumps({'owner':str(owner.id),'days':[dict(x) for x in days],'items':[dict(x) for x in items]})); db.close()",
    { trip_id: trip.id, login, flight_id: originalFlight.id, hotel_id: originalHotel.id },
  );
  const rows = JSON.parse(sql) as { days: { id: string; date: string }[]; items: { id: string; type: string; day_id: string; end_day_id: string | null; check_in: string | null; check_out: string | null }[] };
  expect(rows.days).toHaveLength(8);
  expect(new Set(rows.days.map(day => day.id)).size).toBe(8);
  expect(new Set(rows.days.map(day => day.date)).size).toBe(8);
  expect(rows.items).toHaveLength(2);
  expect(rows.items.find(item => item.id === originalFlight.id)).toMatchObject({ day_id: trip.days[2].id, end_day_id: trip.days[3].id });
  expect(rows.items.find(item => item.id === originalHotel.id)).toMatchObject({ day_id: trip.days[5].id, check_in: "2026-11-06", check_out: "2026-11-08" });
});

test("a version conflict keeps the local draft until an explicit reload", async ({ page }) => {
  test.setTimeout(60000);
  page.setDefaultTimeout(10000);
  await signIn(page);
  const trip = await createTrip(page, "Черновик при конфликте версии");
  const externalInput = tripInput(trip);
  externalInput.days[1].city = "Другая вкладка";
  const externalSave = await page.request.put("/api/trips/" + trip.id, { headers, data: { ...externalInput, version: trip.version } });
  expect(externalSave.ok(), await externalSave.text()).toBe(true);

  await page.getByRole("navigation", { name: "Этапы поездки" }).getByRole("button", { name: /Программа по дням/ }).click();
  await page.getByRole("button", { name: "Детали и заметки дня", exact: true }).click();
  const dayDialog = page.getByRole("dialog");
  await dayDialog.getByLabel("Город", { exact: true }).fill("Локальный черновик");
  await dayDialog.getByRole("button", { name: "Сохранить день", exact: true }).click();
  await expect(page.locator(".save-status")).toHaveText("Не удалось сохранить", { timeout: 15000 });
  await expect(page.getByRole("region", { name: "Программа дня", exact: true })).toContainText("Локальный черновик");
  await page.getByRole("button", { name: "Перечитать с сервера", exact: true }).click();
  const confirm = page.getByRole("dialog");
  await expect(confirm).toContainText("Открыть последнюю версию?");
  await confirm.getByRole("button", { name: "Отмена", exact: true }).click();
  await expect(page.getByRole("region", { name: "Программа дня", exact: true })).toContainText("Локальный черновик");
  const server = await (await page.request.get("/api/trips/" + trip.id)).json() as TripDocument;
  expect(server.days[0].city).toBe("");
  expect(server.days[1].city).toBe("Другая вкладка");
});
