import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";

const token = "a".repeat(43);
const place = (name: string, latitude: number, longitude: number) => ({ name, latitude, longitude });
const trip = {
  client_title: "Путешествие по Японии", start_date: "2027-04-10", end_date: "2027-04-11", participants: 3,
  client_note: "Проверьте документы перед поездкой.", general_items: [
    { type: "hotel", title: "Отель у вокзала", external_url: "https://example.com/hotel" },
    { type: "insurance", title: "Страхование", external_url: "javascript:alert(1)" },
  ], days: [{ date: "2027-04-10", title: "День в Токио", city: "Токио", items: [
    { type: "activity", title: "Прогулка по саду", start_time: "10:00", description: "Вход через северные ворота.", client_note: "Возьмите воду.", map_place: place("Сад", 35.68, 139.76), external_url: "https://example.com/garden" },
    { type: "transfer", title: "Переезд к музею", start_time: "11:30", movement: { mode: "drive", duration_seconds: 1500 }, map_place: place("Музей", 35.69, 139.77), external_url: "https://example.com/garden" },
  ] }, { date: "2027-04-11", title: "Свободный день", items: [] }],
};

let backend: Server;
test.skip(process.env.BACKEND_URL !== "http://127.0.0.1:45871", "Requires Website configured with the isolated fixture backend at 127.0.0.1:45871.");
test.beforeAll(async () => {
  backend = createServer((request, response) => {
    if (request.url !== `/api/public/trips/${token}`) { response.writeHead(404).end(); return; }
    response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(trip));
  });
  await new Promise<void>((resolve, reject) => backend.once("error", reject).listen(45871, "127.0.0.1", resolve));
});
test.afterAll(async () => { if (backend?.listening) await new Promise<void>((resolve, reject) => backend.close(error => error ? reject(error) : resolve())); });

test("public itinerary works at desktop and mobile widths with isolated fixture data", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["clipboard-write", "clipboard-read"]);
  for (const viewport of [{ width: 1440, height: 900 }, { width: 320, height: 800 }]) {
    await page.setViewportSize(viewport);
    await page.goto(`/trip/${token}`);
    await expect(page.getByRole("heading", { name: "Путешествие по Японии" })).toBeVisible();
    await page.getByRole("button", { name: "Практический план" }).click();
    const day = page.getByRole("region", { name: "Практический план: день 1" });
    const marker = day.getByRole("button", { name: "Выбрать место: Сад" });
    const event = day.getByRole("button", { name: "Выбрать событие: Прогулка по саду" });
    await marker.click();
    await expect(event).toHaveAttribute("aria-pressed", "true");
    await day.getByRole("button", { name: "Выбрать событие: Переезд к музею" }).click();
    await expect(day.getByRole("button", { name: "Выбрать место: Музей" })).toHaveAttribute("aria-pressed", "true");
    await expect(day.getByText("На автомобиле · 25 мин")).toBeVisible();
    await day.getByText("Подробнее").click();
    await expect(day.getByText("Вход через северные ворота.")).toBeVisible();
    await day.getByRole("button", { name: "Скопировать ссылку: Сад" }).click();
    await expect(day.getByText(/скопирована/)).toBeVisible();
    await expect(day.getByRole("link", { name: "Открыть Сад в Google Maps" })).toHaveAttribute("href", /google\.com\/maps/);
    const resources = page.getByRole("region", { name: "Организация поездки" });
    await expect(resources.getByRole("link")).toHaveCount(2);
    await expect(resources.getByRole("heading", { name: "Страхование" })).toHaveCount(0);
    await day.getByText(/Карта дня/).click();
    await expect(marker).toHaveCount(0);
    await day.getByText(/Карта дня/).click();
    await expect(marker).toBeVisible();
    const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    expect(widths.document).toBeLessThanOrEqual(widths.viewport);
    expect(widths.body).toBeLessThanOrEqual(widths.viewport);
    await day.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`trip-${viewport.width}.png`) });
    await page.getByRole("button", { name: "Обзор поездки" }).click();
    await expect(page.getByRole("heading", { name: "Программа по дням" })).toBeVisible();
  }
});
