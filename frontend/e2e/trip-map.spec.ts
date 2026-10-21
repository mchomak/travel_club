import { expect, test, type APIRequestContext, type Page, type Locator } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import type { TripDocument, TripInput, MapPlace, ItemInput } from '../src/lib/contracts';
import { newItem, newTrip } from '../src/lib/trip-ui';
import { tripInput } from '../src/lib/trips';

const login = `m${randomBytes(4).toString('hex')}`;
const password = randomBytes(32).toString('base64url');
const project = path.resolve(import.meta.dirname, '../..');
const headers = { 'X-Requested-With': 'TravelClub' };
let cookies: Awaited<ReturnType<APIRequestContext['storageState']>>['cookies'] = [];
const qa = path.join(project, 'docs/qa/trip-day-maps');
function database(code: string, input: object) {
  return execFileSync('docker', ['compose', 'exec', '-T', 'backend', 'python', '-c', code], { cwd: project, input: JSON.stringify(input), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}
test.beforeAll(async ({ playwright }) => {
  database("import json,sys; from app.db import SessionLocal; from app.bootstrap import create_admin; p=json.load(sys.stdin); db=SessionLocal(); create_admin(db,p['login'],p['password']); db.close()", { login, password });
  const api = await playwright.request.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000' });
  try {
    expect((await api.post('/api/auth/login', { headers, data: { login, password } })).ok()).toBe(true);
    cookies = (await api.storageState()).cookies.filter(cookie => cookie.name === 'travel_session');
    expect(cookies).toHaveLength(1);
  } finally { await api.dispose(); }
});
test.afterAll(() => {
  // Delete only this run's random admin and its owned trips; preserve all business data.
  database("import json,sys; from sqlalchemy import select,delete; from app.db import SessionLocal; from app.models import User,Trip,LoginAttempt; p=json.load(sys.stdin); db=SessionLocal(); user=db.scalar(select(User).where(User.login==p['login'])); db.execute(delete(Trip).where(Trip.created_by==user.id)) if user else None; db.delete(user) if user else None; db.execute(delete(LoginAttempt).where(LoginAttempt.login==p['login'])); db.commit(); db.close()", { login });
});
const place = (name: string, latitude: number, longitude: number): MapPlace => ({ name, address: `Тестовая точка ${name}`, latitude, longitude, provider: 'manual' });
const a = place('Музей', 31.23, 121.47), b = place('Сад', 31.24, 121.49), c = place('Отель', 31.22, 121.45);
async function fixture(page: Page, seed?: (input: TripInput) => void) {
  await page.context().addCookies(cookies);
  const response = await page.request.post('/api/trips', { headers, data: { ...newTrip(), internal_title: `Карта ${randomBytes(4).toString('hex')}`, start_date: '2026-10-01', end_date: '2026-10-03' } });
  expect(response.ok()).toBe(true);
  let trip = await response.json() as TripDocument;
  if (seed) {
    const input = tripInput(trip); seed(input);
    const updated = await page.request.put(`/api/trips/${trip.id}`, { headers, data: { ...input, version: trip.version } });
    expect(updated.ok(), await updated.text()).toBe(true);
    trip = await updated.json() as TripDocument;
  }
  return trip;
}
function event(input: TripInput, day: number, title: string, map_place: MapPlace | null, position = 0): ItemInput {
  return { ...newItem('activity', input.days[day], 'RUB', input.start_date), title, map_place, position };
}
async function provider(page: Page) {
  await page.route('**/api/maps/config', route => route.fulfill({ json: { maps_key: 'TEST_ONLY_MAPS_KEY_NOT_VALID', search_enabled: true, routing_enabled: true } }));
  // An intentionally neutral tile, not a mocked Leaflet renderer or a geographic claim.
  await page.route('https://maps.geoapify.com/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e6ede5"/><path d="M0 128H256M128 0V256" stroke="#cad5c9"/></svg>' }));
  await page.route('**/api/maps/route', route => {
    const { from, to, mode } = route.request().postDataJSON();
    const [distance_m, duration_s] = mode === 'drive' ? [4200, 600] : mode === 'walk' ? [3100, 2400] : [5000, 1200];
    return route.fulfill({ json: { status: 'ok', distance_m, duration_s, geometry: { type: 'LineString', coordinates: [[from.longitude, from.latitude], [to.longitude, to.latitude]] }, approximate: mode === 'transit', message: null } });
  });
}
async function saved(page: Page) { await expect(page.locator('.save-status')).toHaveText('Сохранено', { timeout: 15000 }); }
const section = (page: Page) => page.getByRole('region', { name: 'Маршрут дня', exact: true });
const map = (page: Page) => section(page).getByLabel('Карта выбранного дня', { exact: true });
async function chooseDay(page: Page, day: number) { await page.locator('.trip-calendar-day-heading').filter({ hasText: `${day} окт` }).click(); }
async function confirmCoords(picker: Locator, name: string, latitude: string, longitude: string) {
  await picker.getByLabel('Название точки', { exact: true }).fill(name);
  await picker.getByLabel('Широта', { exact: true }).fill(latitude);
  await picker.getByLabel('Долгота', { exact: true }).fill(longitude);
  await picker.getByRole('button', { name: 'Подтвердить место', exact: true }).click();
}

test('real Leaflet route, mode and boundaries survive save/reload/duplicate; missing places break connectivity', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await provider(page);
  const trip = await fixture(page, input => {
    input.days[0].map_start = c; input.days[0].map_end = c;
    input.items = [event(input, 0, 'Музей утром', a), event(input, 0, 'Сад вечером', b, 1), event(input, 1, 'До пробела', a), event(input, 1, 'Без места', null, 1), event(input, 1, 'После пробела', b, 2)];
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/admin/trips/${trip.id}`);
  await expect(map(page).locator('.leaflet-marker-icon')).toHaveCount(4);
  await expect(map(page).locator('.leaflet-overlay-pane path')).toHaveCount(3);
  const leg = section(page).getByRole('group', { name: 'Музей утром → Сад вечером', exact: true });
  await expect(leg.getByRole('button', { name: /Машина/ })).toContainText('4,2 км · 10 мин');
  await expect(leg.getByRole('button', { name: /Пешком/ })).toContainText('3,1 км · 40 мин');
  await expect(leg.getByRole('button', { name: /Транспорт/ })).toContainText('5 км · 20 мин');
  await expect(leg.getByRole('button', { name: /Транспорт/ })).toContainText('без гарантии расписания');
  expect(await map(page).evaluate((element) => element.getBoundingClientRect().bottom)).toBeLessThan(await leg.evaluate(element => element.getBoundingClientRect().top));
  await leg.getByRole('button', { name: /Пешком/ }).focus();
  await page.keyboard.press('Enter');
  const museumId = trip.items.find(item => item.title === 'Музей утром')!.id;
  const gardenId = trip.items.find(item => item.title === 'Сад вечером')!.id;
  await section(page).getByLabel('Выбрать конец', { exact: true }).selectOption(`item:${gardenId}:start`);
  await saved(page);
  await page.reload();
  await expect(leg.getByRole('button', { name: /Пешком/ })).toHaveAttribute('aria-pressed', 'true');
  const persisted = await (await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
  expect(persisted.days[0].map_end).toMatchObject({ ...b });
  expect(persisted.days[0].map_leg_modes).toContainEqual({ from_key: `item:${museumId}:start`, to_key: `item:${gardenId}:start`, mode: 'walk' });
  await map(page).locator('.leaflet-marker-icon').first().click();
  await expect(map(page).locator('.leaflet-popup')).toContainText('Отель');
  await expect(map(page).getByText('Geoapify', { exact: true })).toBeVisible();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await section(page).scrollIntoViewIfNeeded();
    await section(page).screenshot({ path: path.join(qa, `route-${width}.png`) });
    const overflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, elements: Array.from(document.querySelectorAll('body *')).filter(el => el.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(el).position !== 'absolute').slice(0, 12).map(el => ({ tag: el.tagName, class: el.className, right: el.getBoundingClientRect().right })) }));
    expect.soft(overflow.scroll, JSON.stringify(overflow)).toBeLessThanOrEqual(width);
    const bounds = await map(page).evaluate(el => { const r=el.getBoundingClientRect(); return Array.from(el.querySelectorAll('.leaflet-marker-icon')).map(marker => { const m=marker.getBoundingClientRect(); return {title:marker.getAttribute('title'),inside:m.left>=r.left&&m.right<=r.right&&m.top>=r.top&&m.bottom<=r.bottom}; }); });
    expect.soft(bounds.filter(marker => !marker.inside), `fit bounds after resize ${width}`).toEqual([]);
  }
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.reload();
    await expect(map(page).locator('.leaflet-marker-icon')).toHaveCount(4);
    await expect.poll(() => map(page).evaluate(el => { const r=el.getBoundingClientRect(); return Array.from(el.querySelectorAll('.leaflet-marker-icon')).every(marker => { const m=marker.getBoundingClientRect(); return m.left>=r.left&&m.right<=r.right&&m.top>=r.top&&m.bottom<=r.bottom; }); })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await section(page).screenshot({ path: path.join(qa, `route-initial-${width}.png`) });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await chooseDay(page, 2);
  await expect(map(page).locator('.leaflet-marker-icon')).toHaveCount(2);
  await expect(map(page).locator('.leaflet-overlay-pane path')).toHaveCount(0);
  await expect(section(page)).toContainText('Укажите оба места. Участок не рассчитан.');
  await expect(section(page)).toContainText('Неполный итог');
  await chooseDay(page, 1);
  await expect(leg.getByRole('button', { name: /Пешком/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: 'Все поездки', exact: true }).click();
  await page.locator('.trip-row').filter({ hasText: trip.internal_title }).getByRole('button', { name: 'Копировать' }).click();
  await expect(page).toHaveURL(/\/admin\/trips\/[^/]+$/);
  const copyId = page.url().split('/').at(-1)!;
  expect(copyId).not.toBe(trip.id);
  const copy = await (await page.request.get(`/api/trips/${copyId}`)).json() as TripDocument;
  expect(copy.days[0].map_end).toMatchObject({ ...b });
  expect(copy.items.find(item => item.title === 'Музей утром')?.map_place).toMatchObject({ ...a });
  expect(copy.days[0].map_leg_modes).toContainEqual({ from_key: `item:${copy.items.find(item => item.title === 'Музей утром')!.id}:start`, to_key: `item:${copy.items.find(item => item.title === 'Сад вечером')!.id}:start`, mode: 'walk' });
  await expect(section(page).getByRole('group', { name: 'Музей утром → Сад вечером', exact: true }).getByRole('button', { name: /Пешком/ })).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('keyless ItemForm accepts manual coordinates and a selected Google point without nested dialogs', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const trip = await fixture(page);
  // Real local authenticated endpoint: this acceptance environment has no provider keys.
  const config = await (await page.request.get('/api/maps/config')).json();
  expect(config).toEqual({ maps_key: null, search_enabled: false, routing_enabled: false });
  await page.goto(`/admin/trips/${trip.id}`);
  await expect(section(page)).toContainText('Карта ещё не настроена');
  await expect(map(page)).toHaveCount(0);
  await expect(section(page)).toContainText('Нет данных');
  await page.getByRole('region', { name: 'Добавить в маршрут' }).getByRole('button', { name: 'Впечатления', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const picker = dialog.getByRole('group', { name: 'Место посещения / отправления', exact: true });
  await dialog.getByLabel('Название элемента', { exact: true }).fill('Точка без ключа');
  await confirmCoords(picker, 'Ручной музей', '31.23', '121.47');
  await expect(picker).toContainText('Сохранено: Ручной музей');
  await dialog.getByText('Окончание в другом месте', { exact: true }).click();
  const end = dialog.getByRole('group', { name: 'Место окончания / прибытия', exact: true });
  await end.getByText('Найти место или вставить Google Maps ссылку', { exact: true }).click();
  await end.getByLabel('Ссылка Google Maps', { exact: true }).fill('https://www.google.com/maps?q=31.24,121.49');
  await end.getByRole('button', { name: 'Получить место из ссылки' }).click();
  await expect(end.getByLabel('Широта', { exact: true })).toHaveValue('31.24');
  await expect(end.getByLabel('Долгота', { exact: true })).toHaveValue('121.49');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await end.getByRole('button', { name: 'Подтвердить место', exact: true }).click();
  await dialog.getByRole('button', { name: 'Сохранить элемент', exact: true }).click();
  await saved(page);
  await page.reload();
  const stored = await (await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
  expect(stored.items[0].map_place).toMatchObject({ name: 'Ручной музей', latitude: 31.23, longitude: 121.47, provider: 'manual' });
  expect(stored.items[0].map_end_place).toMatchObject({ latitude: 31.24, longitude: 121.49, provider: 'google_link' });
  await expect(section(page)).toContainText('31.23, 121.47');
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await section(page).screenshot({ path: path.join(qa, 'keyless-320.png') });
  expect(errors).toEqual([]);
});

test('ItemForm search, short-link confirmation and real map pin remain inline and removable', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await provider(page);
  const found = { ...b, provider: 'geoapify', provider_place_id: 'TEST_ONLY_PLACE' };
  await page.route('**/api/maps/search?*', route => route.fulfill({ json: { places: [found] } }));
  await page.route('**/api/maps/resolve-link', route => route.fulfill({ json: { place: { ...a, provider: 'google_link', source_url: 'https://maps.app.goo.gl/TEST_ONLY_SHORT_LINK' }, query: null } }));
  const trip = await fixture(page);
  await page.goto(`/admin/trips/${trip.id}`);
  await page.getByRole('region', { name: 'Добавить в маршрут' }).getByRole('button', { name: 'Впечатления', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const picker = dialog.getByRole('group', { name: 'Место посещения / отправления', exact: true });
  await dialog.getByLabel('Название элемента', { exact: true }).fill('Поиск и пин');
  await picker.getByRole('button', { name: 'Подтвердить место', exact: true }).click();
  await expect(picker.getByRole('alert')).toContainText('Укажите широту');
  await picker.getByText('Найти место или вставить Google Maps ссылку', { exact: true }).click();
  await picker.getByLabel('Название или адрес', { exact: true }).fill('Тестовый сад');
  await picker.getByRole('button', { name: 'Сад — Тестовая точка Сад', exact: true }).click();
  await expect(picker.getByLabel('Широта', { exact: true })).toHaveValue('31.24');
  await expect(picker).not.toContainText('Сохранено:');
  await picker.getByRole('button', { name: 'Подтвердить место', exact: true }).click();
  await expect(picker).toContainText('Сохранено: Сад');
  await picker.getByText('Найти место или вставить Google Maps ссылку', { exact: true }).click();
  await picker.getByLabel('Ссылка Google Maps', { exact: true }).fill('https://maps.app.goo.gl/TEST_ONLY_SHORT_LINK');
  await picker.getByRole('button', { name: 'Получить место из ссылки' }).click();
  await expect(picker.getByLabel('Широта', { exact: true })).toHaveValue('31.23');
  await expect(picker).toContainText('Сохранено: Сад');
  const canvas = picker.getByLabel('Карта маршрута', { exact: true });
  await expect(canvas.locator('.leaflet-marker-icon')).toHaveCount(1);
  await canvas.click({ position: { x: 90, y: 80 } });
  await expect(picker.getByLabel('Широта', { exact: true })).not.toHaveValue('31.23');
  // Drag the actual Leaflet marker, not a test stand-in.
  const pin = canvas.locator('.leaflet-marker-icon');
  await expect(pin).toHaveCount(1);
  const box = await pin.boundingBox(); expect(box).not.toBeNull();
  const latitudeBeforeDrag = await picker.getByLabel('Широта', { exact: true }).inputValue();
  await page.mouse.move(box!.x + 15, box!.y + 15); await page.mouse.down();
  await page.mouse.move(box!.x + 45, box!.y + 40, { steps: 5 }); await page.mouse.up();
  await expect(picker.getByLabel('Широта', { exact: true })).not.toHaveValue(latitudeBeforeDrag);
  const latitude = Number(await picker.getByLabel('Широта', { exact: true }).inputValue());
  const longitude = Number(await picker.getByLabel('Долгота', { exact: true }).inputValue());
  await picker.getByRole('button', { name: 'Подтвердить место', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await dialog.getByRole('button', { name: 'Сохранить элемент', exact: true }).click();
  await saved(page);
  const stored = await (await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
  expect(stored.items[0].map_place).toMatchObject({ latitude, longitude, provider: 'manual' });
  await page.reload();
  await page.locator('.unscheduled-item').filter({ hasText: 'Поиск и пин' }).click();
  await expect(picker).toContainText('Сохранено: Музей');
  await picker.getByRole('button', { name: 'Удалить привязку' }).click();
  await dialog.getByRole('button', { name: 'Сохранить элемент', exact: true }).click();
  await saved(page);
  const removed = await (await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
  expect(removed.items[0].map_place).toBeNull();
  expect(errors).toEqual([]);
});

test('overnight airports, changing hotels, ambiguous manual boundaries and untimed order follow the selected day', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await provider(page);
  const requests: { from: MapPlace; to: MapPlace }[] = [];
  page.on('request', request => { if (request.url().endsWith('/api/maps/route')) requests.push(request.postDataJSON()); });
  const origin = place('Аэропорт отправления', 35, 120), destination = place('Аэропорт прибытия', 40, 116);
  const nextHotel = place('Новый отель', 40.01, 116.02), alternative = place('Второй отель', 40.02, 116.03);
  const trip = await fixture(page, input => {
    input.items = [
      { ...newItem('flight', input.days[0], 'RUB', input.start_date), title: 'Ночной рейс карты', start_time: '23:00', end_time: '02:00', end_day_id: input.days[1].id, map_place: origin, map_end_place: destination },
      { ...newItem('hotel', input.days[0], 'RUB', input.start_date), title: 'Старый отель', check_in: input.days[0].date, check_out: input.days[1].date, map_place: c },
      { ...newItem('hotel', input.days[1], 'RUB', input.start_date), title: 'Новый отель', check_in: input.days[1].date, check_out: input.days[2].date, map_place: nextHotel },
      { ...newItem('hotel', input.days[1], 'RUB', input.start_date), title: 'Второй отель', check_in: input.days[1].date, check_out: input.days[2].date, map_place: alternative },
      event(input, 1, 'Первая прогулка', a, 0), event(input, 1, 'Вторая прогулка', b, 1),
    ];
  });
  await page.goto(`/admin/trips/${trip.id}`);
  const boundaries = section(page).locator('h3').filter({ hasText: /^(Начало|Конец) дня/ });
  await expect(boundaries.nth(1).locator('..')).toContainText('Аэропорт отправления');
  await expect(boundaries.nth(1).locator('..')).toContainText('Место отправления ночного события');
  await expect(map(page).locator('.leaflet-marker-icon[title="Аэропорт прибытия"]')).toHaveCount(0);
  await expect(section(page)).toContainText('Запланированный переезд · 2026-10-01 23:00 → 2026-10-02 02:00');
  await chooseDay(page, 2);
  await expect(boundaries.nth(0).locator('..')).toContainText('Аэропорт прибытия');
  await expect(boundaries.nth(0).locator('..')).toContainText('Место прибытия после ночного события');
  await expect(map(page).locator('.leaflet-marker-icon[title="Аэропорт отправления"]')).toHaveCount(0);
  await expect(boundaries.nth(1).locator('..')).toContainText('Есть несколько вариантов');
  await section(page).getByLabel('Выбрать конец', { exact: true }).selectOption({ label: 'Новый отель' });
  await expect(boundaries.nth(1)).toContainText('выбрано вручную');
  await saved(page);
  await boundaries.nth(1).locator('..').getByRole('button', { name: 'Автоматически', exact: true }).click();
  await expect(boundaries.nth(1).locator('..')).toContainText('Есть несколько вариантов');
  const start = boundaries.nth(0).locator('..');
  await start.getByText('Указать своё место', { exact: true }).click();
  await confirmCoords(start.getByRole('group', { name: 'Начало дня — своё место', exact: true }), 'Свой старт', '39.9', '116.1');
  await expect(start).toContainText('Свой старт');
  await start.getByRole('button', { name: 'Автоматически', exact: true }).click();
  await expect(start).toContainText('Аэропорт прибытия');
  await section(page).getByText('Порядок событий без времени', { exact: true }).click();
  await section(page).getByRole('button', { name: 'Переместить Вторая прогулка вверх', exact: true }).click();
  await saved(page);
  await page.reload(); await chooseDay(page, 2);
  const stops = section(page).locator('ol > li');
  await expect(stops.nth(1)).toContainText('Вторая прогулка');
  await expect(stops.nth(2)).toContainText('Первая прогулка');
  const current = await (await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
  expect(current.items.find(item => item.title === 'Вторая прогулка')!.position).toBeLessThan(current.items.find(item => item.title === 'Первая прогулка')!.position);
  expect(current.days[1].map_start).toBeNull(); expect(current.days[1].map_end).toBeNull();
  expect(requests.some(request => request.from.name === origin.name && request.to.name === destination.name)).toBe(false);
  // Remove only seeded fixture items to expose the hotel-change inference independently.
  const input = tripInput(current); input.items = input.items.filter(item => !['Ночной рейс карты', 'Второй отель'].includes(item.title));
  expect((await page.request.put(`/api/trips/${trip.id}`, { headers, data: { ...input, version: current.version } })).ok()).toBe(true);
  await page.reload(); await chooseDay(page, 2);
  await expect(start).toContainText('Отель предыдущей ночи'); await expect(start).toContainText('Отель');
  await expect(boundaries.nth(1).locator('..')).toContainText('Отель следующей ночи');
  await expect(boundaries.nth(1).locator('..')).toContainText('Новый отель');
  expect(errors).toEqual([]);
});

test('429, unavailable routes, provider errors and config failures show honest states and recover on retry', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await provider(page);
  let recovered = false;
  await page.route('**/api/maps/route', async route => {
    if (recovered) { await route.fallback(); return; }
    const { mode } = route.request().postDataJSON();
    if (mode === 'walk') await route.fulfill({ json: { status: 'unavailable', distance_m: null, duration_s: null, geometry: null, approximate: false, message: 'Нет данных' } });
    else await route.fulfill({ status: mode === 'drive' ? 429 : 502, json: { code: mode === 'drive' ? 'provider_rate_limited' : 'provider_unavailable', message: 'Test provider failure' } });
  });
  const trip = await fixture(page, input => { input.days[0].map_start = a; input.days[0].map_end = b; });
  await page.goto(`/admin/trips/${trip.id}`);
  const leg = section(page).getByRole('group', { name: 'Музей → Сад', exact: true });
  await expect(leg.getByRole('button', { name: /Машина/ })).toContainText('Слишком много запросов');
  await expect(leg.getByRole('button', { name: /Пешком/ })).toContainText('Нет данных');
  await expect(leg.getByRole('button', { name: /Транспорт/ })).toContainText('Не удалось получить данные карты');
  await expect(section(page)).toContainText('Неполный итог · рассчитано 0 из 1 участков');
  await expect(map(page).locator('.leaflet-overlay-pane path')).toHaveCount(0);
  await section(page).screenshot({ path: path.join(qa, 'provider-errors.png') });
  recovered = true;
  await leg.getByRole('button', { name: 'Повторить расчёт участка', exact: true }).click();
  await expect(leg.getByRole('button', { name: /Машина/ })).toContainText('4,2 км · 10 мин');
  await expect(map(page).locator('.leaflet-overlay-pane path')).toHaveCount(1);
  let configRecovered = false;
  await page.route('**/api/maps/config', async route => { if (configRecovered) await route.fallback(); else await route.fulfill({ status: 503, json: { code: 'unavailable', message: 'Test config unavailable' } }); });
  await page.reload();
  await expect(section(page)).toContainText('Не удалось получить данные карты');
  await expect(map(page)).toHaveCount(0);
  await expect(section(page)).toContainText('31.23, 121.47');
  configRecovered = true;
  await section(page).getByRole('button', { name: 'Повторить', exact: true }).click();
  await expect(map(page).locator('.leaflet-marker-icon')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('late responses from the previous day cannot replace the current day route', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await provider(page);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let pending = 0, completed = 0;
  await page.route('**/api/maps/route', async route => {
    const { from, to, mode } = route.request().postDataJSON();
    if (from.latitude !== a.latitude) { await route.fallback(); return; }
    pending++;
    if (mode === 'transit') await gate;
    await route.fulfill({ json: { status: 'ok', distance_m: 99000, duration_s: 9900, geometry: { type: 'LineString', coordinates: [[from.longitude, from.latitude], [to.longitude, to.latitude]] }, approximate: false, message: null } });
    completed++;
  });
  const trip = await fixture(page, input => {
    input.days[0].map_start = a; input.days[0].map_end = b;
    input.days[1].map_start = place('Новый старт', 40, 116); input.days[1].map_end = place('Новый финиш', 40.01, 116.02);
  });
  try {
    await page.goto(`/admin/trips/${trip.id}`);
    await expect.poll(() => pending).toBe(3);
    await chooseDay(page, 2);
    const leg = section(page).getByRole('group', { name: 'Новый старт → Новый финиш', exact: true });
    await expect(leg.getByRole('button', { name: /Машина/ })).toContainText('4,2 км · 10 мин');
    await expect(map(page).locator('.leaflet-overlay-pane path')).toHaveCount(1);
    release();
    await expect.poll(() => completed).toBe(3);
    await expect(leg.getByRole('button', { name: /Машина/ })).toContainText('4,2 км · 10 мин');
    await expect(section(page)).not.toContainText('99 км');
    await expect(map(page).locator('.leaflet-marker-icon')).toHaveCount(2);
    await expect(map(page).locator('.leaflet-marker-icon[title="Музей"]')).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally { release(); }
});

test('tile failures explain the missing basemap and real Leaflet recovers without losing stops', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await provider(page);
  let recovered = false;
  await page.route('https://maps.geoapify.com/**', async route => { if (recovered) await route.fallback(); else await route.fulfill({ status: 503, body: 'Test tile unavailable' }); });
  const trip = await fixture(page, input => { input.days[0].map_start = a; input.days[0].map_end = b; });
  await page.goto(`/admin/trips/${trip.id}`);
  await expect(section(page)).toContainText('Подложка недоступна');
  await expect(map(page).locator('.leaflet-marker-icon')).toHaveCount(2);
  await expect(section(page)).toContainText('31.23, 121.47');
  recovered = true;
  await section(page).getByRole('button', { name: 'Повторить загрузку карты', exact: true }).click();
  await expect(map(page).locator('..')).not.toContainText('Подложка недоступна');
  await expect.poll(() => map(page).locator('img.leaflet-tile').evaluateAll(images => images.filter(image => (image as HTMLImageElement).naturalWidth > 0).length)).toBeGreaterThan(0);
  await expect(map(page).locator('.leaflet-marker-icon')).toHaveCount(2);
  expect(errors).toEqual([]);
});
