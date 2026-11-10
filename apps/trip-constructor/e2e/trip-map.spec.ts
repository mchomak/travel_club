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
const qa = path.join(project, 'docs/qa/map-workflow');
function database(code: string, input: object) {
  return execFileSync('docker', process.env.PLAYWRIGHT_BACKEND_CONTAINER ? ['exec', '-i', process.env.PLAYWRIGHT_BACKEND_CONTAINER, 'python', '-c', code] : ['compose', 'exec', '-T', 'backend', 'python', '-c', code], { cwd: project, input: JSON.stringify(input), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
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
async function keylessProvider(page: Page) {
  await page.route('**/api/maps/config', route => route.fulfill({ json: { maps_key: null, search_enabled: false, routing_enabled: false } }));
}

test('keyboard selection on a map marker keeps the marker focused and its popup open', async ({ page }) => {
  await provider(page);
  const trip = await fixture(page, input => {
    input.items = [event(input, 0, 'Музей на карте', a)];
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/admin/trips/${trip.id}/builder?step=4&day=${trip.days[0].id}`);
  const marker = map(page).locator('.leaflet-marker-icon[title="Музей на карте"]');
  await expect(marker).toBeVisible();
  await marker.focus();
  await marker.press('Enter');
  await expect(map(page).locator('.leaflet-popup-content')).toContainText('Музей на карте');
  await expect(marker).toBeFocused();
  await expect(marker).toHaveAttribute('aria-pressed', 'true');
});
test('Space activates a map marker without scrolling the document', async ({ page }) => {
  await provider(page);
  const trip = await fixture(page, input => {
    input.items = [event(input, 0, 'Музей на карте', a)];
  });
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto(`/admin/trips/${trip.id}/builder?step=4&day=${trip.days[0].id}`);
  const marker = map(page).locator('.leaflet-marker-icon[title="Музей на карте"]');
  await expect(marker).toBeVisible();
  await marker.focus();
  await expect(marker).toBeFocused();
  const scroll = await page.evaluate(() => ({ y: window.scrollY, max: document.documentElement.scrollHeight - window.innerHeight }));
  expect(scroll.max).toBeGreaterThan(scroll.y);
  await marker.press('Space');
  await expect(map(page).locator('.leaflet-popup-content')).toContainText('Музей на карте');
  await expect(marker).toBeFocused();
  await expect(marker).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scroll.y);
});
async function saved(page: Page) { await expect(page.locator('.save-status')).toHaveText('Сохранено', { timeout: 15000 }); }
const section = (page: Page) => page.getByRole('region', { name: 'Маршрут дня', exact: true, includeHidden: true });
const map = (page: Page) => section(page).getByLabel('Карта выбранного дня', { exact: true });
async function chooseDay(page: Page, day: number) { await page.locator('.trip-calendar-day-heading').filter({ hasText: `${day} окт` }).click(); }
async function chooseOption(scope: Page | Locator, label: string, option: RegExp) {
  await scope.getByRole('combobox', { name: label, exact: true }).click();
  await scope.getByRole('listbox', { name: label, exact: true }).getByRole('option', { name: option }).click();
}
async function chooseLink(picker: Locator, url: string, name: RegExp) {
  await picker.getByLabel('Ссылка Google Maps', { exact: true }).fill(url);
  await picker.getByRole('button', { name: 'Найти', exact: true }).click();
  await picker.getByRole('option', { name }).click();
  await expect(picker.getByRole('combobox')).toHaveCount(0);
  await expect(picker.getByLabel('Широта', { exact: true })).toHaveCount(0);
  await expect(picker.getByLabel('Долгота', { exact: true })).toHaveCount(0);
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
  await expect(leg.getByRole('button', { name: /Транспорт/ })).toHaveCount(0);
  expect(await map(page).evaluate((element) => element.getBoundingClientRect().bottom)).toBeLessThan(await leg.evaluate(element => element.getBoundingClientRect().top));
  await leg.getByRole('button', { name: /Пешком/ }).focus();
  await page.keyboard.press('Enter');
  const museumId = trip.items.find(item => item.title === 'Музей утром')!.id;
  const gardenId = trip.items.find(item => item.title === 'Сад вечером')!.id;
  await chooseOption(section(page), 'Конец дня', /^Сад вечером/);
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
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await section(page).screenshot({ path: path.join(qa, `route-${width}.png`) });
    const overflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, elements: Array.from(document.querySelectorAll('body *')).filter(el => el.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(el).position !== 'absolute').slice(0, 12).map(el => ({ tag: el.tagName, class: el.className, right: el.getBoundingClientRect().right })) }));
    expect.soft(overflow.scroll, JSON.stringify(overflow)).toBeLessThanOrEqual(width);
    expect((await map(page).boundingBox())!.height).toBeGreaterThanOrEqual(width > 760 ? 550 : 375);
    const beforePanel = (await map(page).boundingBox())!.height;
    await page.getByRole('region', { name: 'Добавить в маршрут' }).getByRole('button', { name: 'Впечатления', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    if (width === 390) await dialog.evaluate(async element => { await Promise.all(element.getAnimations().map(animation => animation.finished)); });
    expect((await map(page).boundingBox())!.height).toBe(beforePanel);
    if (width === 390) {
      const dialogBox = await dialog.boundingBox();
      expect(dialogBox).not.toBeNull();
      expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
      expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(width);
      await dialog.getByLabel('Название элемента', { exact: true }).fill('Форма доступна на 390px');
      await expect(dialog.getByRole('button', { name: 'Сохранить элемент', exact: true })).toBeVisible();
      const formControls = await dialog.locator('input, select, textarea, button').evaluateAll(elements => elements
        .filter(element => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        })
        .map(element => {
          const rect = element.getBoundingClientRect();
          return { name: element.getAttribute('aria-label') || element.textContent?.trim(), left: rect.left, right: rect.right };
        }));
      expect(formControls.length).toBeGreaterThan(0);
      expect(formControls.filter(control => control.left < 0 || control.right > width), JSON.stringify(formControls)).toEqual([]);
    }
    await page.getByRole('dialog').getByRole('button', { name: 'Отмена', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    if (width === 390) {
      const sectionBox = await section(page).boundingBox();
      expect(sectionBox).not.toBeNull();
      expect(sectionBox!.x).toBeGreaterThanOrEqual(0);
      expect(sectionBox!.x + sectionBox!.width).toBeLessThanOrEqual(width);
      const controls = await section(page).locator('button, select, input').evaluateAll(elements => elements
        .filter(element => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        })
        .map(element => {
          const rect = element.getBoundingClientRect();
          return { name: element.getAttribute('aria-label') || element.textContent?.trim(), left: rect.left, right: rect.right };
        }));
      expect(controls.length).toBeGreaterThan(0);
      expect(controls.filter(control => control.left < sectionBox!.x - 1 || control.right > sectionBox!.x + sectionBox!.width + 1), JSON.stringify(controls)).toEqual([]);
      await expect(section(page).getByRole('group').first().getByRole('button').first()).toBeEnabled();
      const layout = await page.locator('.editor-layout').evaluate(element => {
        const route = element.querySelector('.route-workspace')!.getBoundingClientRect();
        const finances = element.querySelector('.finance-panel')!.getBoundingClientRect();
        return { routeBottom: route.bottom, financeTop: finances.top, financeLeft: finances.left, financeRight: finances.right };
      });
      expect(layout.routeBottom).toBeLessThanOrEqual(layout.financeTop + 1);
      expect(layout.financeLeft).toBeGreaterThanOrEqual(0);
      expect(layout.financeRight).toBeLessThanOrEqual(width);
    }
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

test('keyless Google point selects inline, collapses, reopens and persists without coordinate UI', async ({ page }) => {
  await keylessProvider(page);
  const trip = await fixture(page);
  await page.goto(`/admin/trips/${trip.id}`);
  const config = await page.evaluate(async () => await (await fetch('/api/maps/config')).json());
  expect(config).toEqual({ maps_key: null, search_enabled: false, routing_enabled: false });
  await expect(section(page)).toContainText('Карта ещё не настроена');
  await expect(map(page)).toHaveCount(0);
  await page.getByRole('region', { name: 'Добавить в маршрут' }).getByRole('button', { name: 'Впечатления', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const picker = dialog.getByRole('group', { name: 'Место посещения / отправления', exact: true });
  await dialog.getByLabel('Название элемента', { exact: true }).fill('Точка без ключа');
  await chooseLink(picker, 'https://www.google.com/maps?q=31.23,121.47', /Точка из Google Maps/);
  await expect(picker).toContainText('Адрес не определён');
  await picker.getByRole('button', { name: 'Изменить место' }).click();
  await expect(picker.getByLabel('Ссылка Google Maps')).toHaveValue('https://www.google.com/maps?q=31.23,121.47');
  await picker.getByRole('option', { name: /Точка из Google Maps/ }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByText('Окончание в другом месте', { exact: true }).click();
  const end = dialog.getByRole('group', { name: 'Место окончания / прибытия', exact: true });
  await chooseLink(end, 'https://www.google.com/maps?q=31.24,121.49', /Точка из Google Maps/);
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await dialog.getByRole('button', { name: 'Сохранить элемент', exact: true }).click();
  await saved(page); await page.reload();
  const stored = await (await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
  expect(stored.items[0].map_place).toMatchObject({ latitude: 31.23, longitude: 121.47, provider: 'google_link' });
  expect(stored.items[0].map_end_place).toMatchObject({ latitude: 31.24, longitude: 121.49, provider: 'google_link' });
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await section(page).screenshot({ path: path.join(qa, 'keyless-320.png') });
});

test('failed link opens accessible fallback search; selected place can be replaced and removed', async ({ page }) => {
  await provider(page);
  const found = { ...b, provider: 'geoapify', provider_place_id: 'TEST_ONLY_PLACE' };
  await page.route('**/api/maps/search?*', route => route.fulfill({ json: { places: [found] } }));
  await page.route('**/api/maps/resolve-link', route => route.fulfill({ json: { place: null, query: 'Тестовый сад' } }));
  const trip = await fixture(page);
  await page.goto(`/admin/trips/${trip.id}`);
  await page.getByRole('region', { name: 'Добавить в маршрут' }).getByRole('button', { name: 'Впечатления', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const picker = dialog.getByRole('group', { name: 'Место посещения / отправления', exact: true });
  await dialog.getByLabel('Название элемента', { exact: true }).fill('Поиск места');
  await picker.getByLabel('Ссылка Google Maps').fill('https://maps.app.goo.gl/TEST_ONLY_SHORT_LINK');
  await picker.getByRole('button', { name: 'Найти', exact: true }).click();
  await picker.getByRole('option', { name: /^Сад/ }).click();
  await expect(picker).toContainText('Тестовая точка Сад');
  await expect(picker.getByRole('combobox')).toHaveCount(0);
  await expect(picker.getByLabel('Широта')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Сохранить элемент', exact: true }).click();
  await saved(page); await page.reload();
  await page.locator('.unscheduled-item').filter({ hasText: 'Поиск места' }).click();
  await expect(picker).toContainText('Тестовая точка Сад');
  await picker.getByRole('button', { name: 'Удалить привязку' }).click();
  await dialog.getByRole('button', { name: 'Сохранить элемент', exact: true }).click();
  await saved(page);
  const removed = await (await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
  expect(removed.items[0].map_place).toBeNull();
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
  const boundaries = section(page).getByRole('combobox', { name: /^(Начало|Конец) дня$/ }).locator('../..');
  await expect(boundaries.nth(1).getByRole('combobox')).toHaveValue(/Аэропорт отправления/);
  await expect(boundaries.nth(1).locator('..')).toContainText('Место отправления ночного события');
  await expect(map(page).locator('.leaflet-marker-icon[title="Аэропорт прибытия"]')).toHaveCount(0);
  await expect(section(page)).toContainText('Запланированный переезд · 2026-10-01 23:00 → 2026-10-02 02:00');
  await chooseDay(page, 2);
  await expect(boundaries.nth(0).getByRole('combobox')).toHaveValue(/Аэропорт прибытия/);
  await expect(boundaries.nth(0).locator('..')).toContainText('Место прибытия после ночного события');
  await expect(map(page).locator('.leaflet-marker-icon[title="Аэропорт отправления"]')).toHaveCount(0);
  await expect(boundaries.nth(1).locator('..')).toContainText('Есть несколько вариантов');
  await chooseOption(section(page), 'Конец дня', /^Новый отель/);
  await expect(boundaries.nth(1).getByRole('combobox')).toHaveValue('Новый отель');
  await saved(page);
  await chooseOption(section(page), 'Конец дня', /^Автоматически/);
  await expect(boundaries.nth(1).locator('..')).toContainText('Есть несколько вариантов');
  const start = boundaries.nth(0).locator('..');
  await chooseOption(section(page), 'Начало дня', /^Указать своё место/);
  await page.route('**/api/maps/resolve-link', route => route.fulfill({json:{place:place('Свой старт',39.9,116.1),query:null}}));
  await chooseLink(start.getByRole('group', { name: 'Начало дня — своё место', exact: true }), 'https://www.google.com/maps?q=39.9,116.1', /Свой старт/);
  await expect(start.getByRole('combobox', { name: 'Начало дня' })).toHaveValue('Свой старт');
  await chooseOption(section(page), 'Начало дня', /^Автоматически/);
  await expect(start.getByRole('combobox', { name: 'Начало дня', exact: true })).toHaveValue(/Аэропорт прибытия/);
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
  await expect(leg.getByRole('button', { name: /Транспорт/ })).toHaveCount(0);
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
  await expect(section(page)).toContainText('Тестовая точка Музей');
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
    if (mode === 'walk') await gate;
    await route.fulfill({ json: { status: 'ok', distance_m: 99000, duration_s: 9900, geometry: { type: 'LineString', coordinates: [[from.longitude, from.latitude], [to.longitude, to.latitude]] }, approximate: false, message: null } });
    completed++;
  });
  const trip = await fixture(page, input => {
    input.days[0].map_start = a; input.days[0].map_end = b;
    input.days[1].map_start = place('Новый старт', 40, 116); input.days[1].map_end = place('Новый финиш', 40.01, 116.02);
  });
  try {
    await page.goto(`/admin/trips/${trip.id}`);
    await expect.poll(() => pending).toBe(2);
    await chooseDay(page, 2);
    const leg = section(page).getByRole('group', { name: 'Новый старт → Новый финиш', exact: true });
    await expect(leg.getByRole('button', { name: /Машина/ })).toContainText('4,2 км · 10 мин');
    await expect(map(page).locator('.leaflet-overlay-pane path')).toHaveCount(1);
    release();
    await expect.poll(() => completed).toBe(2);
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
  await expect(section(page)).toContainText('Тестовая точка Музей');
  recovered = true;
  await section(page).getByRole('button', { name: 'Повторить загрузку карты', exact: true }).click();
  await expect(map(page).locator('..')).not.toContainText('Подложка недоступна');
  await expect.poll(() => map(page).locator('img.leaflet-tile').evaluateAll(images => images.filter(image => (image as HTMLImageElement).naturalWidth > 0).length)).toBeGreaterThan(0);
  await expect(map(page).locator('.leaflet-marker-icon')).toHaveCount(2);
  expect(errors).toEqual([]);
});

for (const width of [1440, 390, 320]) {
  test(`flight countries, filtered cities, manual naming and transport endpoints persist at ${width}`, async ({ page }) => {
    await provider(page);
    const searches: URL[] = [];
    await page.route('**/api/maps/search?*', route => {
      const url = new URL(route.request().url()); searches.push(url);
      return route.fulfill({ json: { places: [place(url.searchParams.get('country_code') === 'JP' ? 'Токио' : 'Москва', 35, 139)] } });
    });
    const trip = await fixture(page, input => {
      input.items = [
        {...event(input, 0, 'Музей в 10', a), start_time:'10:00',end_time:'11:00'},
        {...event(input, 0, 'Сад в 15', b), start_time:'15:00',end_time:'16:00'},
        {...newItem('flight',input.days[1],'RUB',input.start_date),title:'Перелёт 3'},
      ];
    });
    await page.setViewportSize({width,height:1000});
    await page.goto(`/admin/trips/${trip.id}`);
    await page.getByRole('region', {name:'Добавить в маршрут'}).getByRole('button',{name:'Перелёт',exact:true}).click();
    const dialog=page.getByRole('dialog');
    await expect(dialog.getByLabel('Название элемента')).toHaveValue('Перелёт 4');
    await chooseOption(dialog,'Вылет — страна',/^Россия · RU$/);
    await dialog.getByRole('combobox',{name:'Вылет — город',exact:true}).fill('Мос');
    await dialog.getByRole('listbox',{name:'Вылет — город',exact:true}).getByRole('option',{name:/^Москва/}).click();
    await chooseOption(dialog,'Прилёт — страна',/^Япония · JP$/);
    await dialog.getByRole('combobox',{name:'Прилёт — город',exact:true}).fill('Ток');
    await dialog.getByRole('listbox',{name:'Прилёт — город',exact:true}).getByRole('option',{name:/^Токио/}).click();
    expect(searches.some(url=>url.searchParams.get('kind')==='city'&&url.searchParams.get('country_code')==='RU')).toBe(true);
    expect(searches.some(url=>url.searchParams.get('kind')==='city'&&url.searchParams.get('country_code')==='JP')).toBe(true);
    await dialog.getByLabel('Название элемента').fill('Мой международный рейс');
    await dialog.getByRole('button',{name:'Сохранить элемент'}).click(); await saved(page);
    await page.getByRole('region',{name:'Добавить в маршрут'}).getByRole('button',{name:'Транспорт',exact:true}).click();
    await dialog.getByLabel('Подвид').selectOption('taxi');
    await expect(dialog.getByLabel('Название элемента')).toHaveValue('Такси 1');
    await dialog.getByLabel('Подвид').selectOption('walk');
    await expect(dialog.getByLabel('Название элемента')).toHaveValue('Пеший переход 1');
    await dialog.getByLabel('Название элемента').fill('Личный переезд');
    await dialog.getByLabel('Подвид').selectOption('taxi');
    await expect(dialog.getByLabel('Название элемента')).toHaveValue('Личный переезд');
    await chooseOption(dialog,'Откуда',/^Музей в 10/);
    await chooseOption(dialog,'Куда',/^Сад в 15/);
    await expect(dialog).toContainText('На машине: около 10 мин');
    await dialog.getByRole('combobox',{name:'Куда',exact:true}).fill('Секретный причал');
    await dialog.getByRole('option',{name:/Использовать «Секретный причал»/}).click();
    await expect(dialog).toContainText('Для оценки пути нужны два места с адресом');
    await dialog.getByRole('button',{name:'Сохранить элемент'}).click(); await saved(page);
    await page.reload();
    const stored=await(await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
    expect(stored.items.find(item=>item.title==='Мой международный рейс')).toMatchObject({departure_country_code:'RU',departure_city:'Москва',arrival_country_code:'JP',arrival_city:'Токио'});
    expect(stored.items.find(item=>item.title==='Личный переезд')).toMatchObject({departure_label:'Музей',arrival_label:'Секретный причал',map_place:a,map_end_place:null});
    await page.locator('.unscheduled-item').filter({hasText:'Мой международный рейс'}).click();
    await expect(dialog.getByRole('combobox',{name:'Прилёт — город',exact:true})).toHaveValue('Токио');
    await chooseOption(dialog,'Прилёт — страна',/^Китай · CN$/);
    await expect(dialog.getByRole('combobox',{name:'Прилёт — город',exact:true})).toHaveValue('');
    await expect(dialog.getByLabel('Название элемента')).toHaveValue('Мой международный рейс');
    await dialog.screenshot({path:path.join(qa,`flight-form-${width}.png`)});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await dialog.getByRole('button',{name:'Отмена',exact:true}).click();
  });
}

for (const mode of ['drive','walk'] as const) {
  test(`auto ${mode} creates a real 9 minute event, avoids duplicates and survives reload and trip duplicate`, async ({page})=>{
    await provider(page);
    await page.route('**/api/maps/route',route=>{
      const {from,to}=route.request().postDataJSON();
      return route.fulfill({json:{status:'ok',distance_m:1200,duration_s:540,geometry:{type:'LineString',coordinates:[[from.longitude,from.latitude],[to.longitude,to.latitude]]},approximate:false,message:null}});
    });
    const trip=await fixture(page,input=>{
      input.items=[{...event(input,0,'Отправная прогулка',a),start_time:'09:00',end_time:'10:00'}, {...event(input,0,'Встреча в саду',b),start_time:'15:00',end_time:'16:00'}];
    });
    await page.setViewportSize({width:1440,height:1000}); await page.goto(`/admin/trips/${trip.id}`);
    const leg=section(page).getByRole('group',{name:'Отправная прогулка → Встреча в саду',exact:true});
    await leg.getByRole('button',{name:mode==='drive'?/Машина/:/Пешком/}).click();
    await expect(leg).toContainText('14:51–15:00');
    await leg.getByRole('button',{name:'Добавить трансфер в маршрут'}).click(); await saved(page);
    const title=mode==='drive'?'Такси 1':'Пеший переход 1';
    const calendar=page.getByRole('region',{name:'Календарь поездки'});
    await expect(calendar.getByRole('button',{name:new RegExp(title+', 2026-10-01, 14:51 — 15:00')})).toBeVisible();
    let stored=await(await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
    let transfer=stored.items.find(item=>item.auto_transfer)!;
    expect(transfer).toMatchObject({title,start_time:'14:51:00',end_time:'15:00:00',price_pending:mode==='drive',included:mode==='walk',auto_transfer:{mode,duration_seconds:540}});
    if(mode==='drive')await expect(page.locator('.finance-panel')).toContainText('Стоимость не указана');
    const open=section(page).getByRole('button',{name:'Открыть трансфер',exact:true});
    await expect(open).toHaveCount(1); await open.click();
    const dialog=page.getByRole('dialog');
    await expect(dialog.getByLabel('Название элемента')).toHaveValue(title);
    await dialog.getByRole('button',{name:'Отмена',exact:true}).click();
    await page.reload();
    stored=await(await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
    expect(stored.items.filter(item=>item.auto_transfer)).toHaveLength(1);
    await expect(section(page).getByRole('button',{name:'Открыть трансфер',exact:true})).toHaveCount(1);
    for(const width of [1440,390,320]){
      await page.setViewportSize({width,height:1000});
      await section(page).scrollIntoViewIfNeeded();
      expect((await map(page).boundingBox())!.height).toBeGreaterThanOrEqual(width>760?550:375);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await section(page).screenshot({path:path.join(qa,`auto-${mode}-${width}.png`)});
    }
    if(mode==='drive'){
      await section(page).getByRole('button',{name:'Открыть трансфер',exact:true}).click();
      await dialog.getByLabel('Цена за единицу',{exact:true}).fill('0');
      await dialog.getByRole('button',{name:'Сохранить элемент'}).click(); await saved(page);
      stored=await(await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
      transfer=stored.items.find(item=>item.auto_transfer)!;
      expect(transfer).toMatchObject({price_pending:false,included:true,unit_price:'0.00'});
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.getByRole('link',{name:'Все поездки',exact:true}).click();
    await page.locator('.trip-row').filter({hasText:trip.internal_title}).getByRole('button',{name:'Копировать'}).click();
    await expect(page).toHaveURL(/\/admin\/trips\/[^/]+$/);
    const copyId=page.url().split('/').at(-1)!; expect(copyId).not.toBe(trip.id);
    const copy=await(await page.request.get(`/api/trips/${copyId}`)).json() as TripDocument;
    const copied=copy.items.find(item=>item.auto_transfer)!;
    expect(copy.items.filter(item=>item.auto_transfer)).toHaveLength(1);
    expect(copied.auto_transfer).toMatchObject({mode,duration_seconds:540,from_key:`item:${copy.items.find(item=>item.title==='Отправная прогулка')!.id}:start`,to_key:`item:${copy.items.find(item=>item.title==='Встреча в саду')!.id}:start`});
    expect(copied.id).not.toBe(transfer.id);
    await expect(section(page).getByRole('button',{name:'Открыть трансфер',exact:true})).toHaveCount(1);
  });
}

test('compact boundary orders day places and fills an addressless event from the same control',async({page})=>{
  await provider(page);
  await page.route('**/api/maps/resolve-link',route=>route.fulfill({json:{place:c,query:null}}));
  const trip=await fixture(page,input=>{
    input.items=[{...event(input,0,'Поздний сад',b),start_time:'15:00',end_time:'16:00'},{...event(input,0,'Ранний музей',a),start_time:'09:00',end_time:'10:00'},event(input,1,'Завтрашнее место',c),event(input,0,'Без адреса',null)];
  });
  await page.goto(`/admin/trips/${trip.id}`);
  const combo=section(page).getByRole('combobox',{name:'Начало дня',exact:true}); await combo.click();
  const options=section(page).getByRole('listbox',{name:'Начало дня',exact:true}).getByRole('option');
  await expect(options).toContainText(['Автоматически','Ранний музей','Поздний сад','Завтрашнее место','Без адреса','Указать своё место']);
  await options.filter({hasText:'Без адреса'}).click();
  const picker=section(page).getByRole('group',{name:'Место события «Без адреса»',exact:true});
  await chooseLink(picker,'https://www.google.com/maps?q=31.22,121.45',/^Отель/); await saved(page);
  const stored=await(await page.request.get(`/api/trips/${trip.id}`)).json() as TripDocument;
  expect(stored.items.find(item=>item.title==='Без адреса')?.map_place).toMatchObject({...c});
  expect(stored.days[0].map_start).toMatchObject({...c});
  await expect(combo).toHaveValue('Без адреса');
  await expect(section(page).getByRole('heading',{name:'Начало дня',exact:true})).toHaveCount(0);
  await expect(section(page).getByRole('listbox')).toHaveCount(0);
});

test('Escape closes a place dropdown inside the real item dialog and keeps the typed draft', async ({page})=>{
  await keylessProvider(page);
  const trip=await fixture(page);
  await page.goto(`/admin/trips/${trip.id}`);
  await page.getByRole('region',{name:'Добавить в маршрут'}).getByRole('button',{name:'Впечатления',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByLabel('Название элемента').fill('Черновик сохраняется при Escape');
  const picker=dialog.getByRole('group',{name:'Место посещения / отправления',exact:true});
  await picker.getByLabel('Ссылка Google Maps',{exact:true}).fill('https://www.google.com/maps?q=31.23,121.47');
  await picker.getByRole('button',{name:'Найти',exact:true}).click();
  const combo=picker.getByRole('combobox',{name:'Выберите место',exact:true});
  await expect(combo).toHaveAttribute('aria-expanded','true');
  await combo.press('Escape');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Название элемента')).toHaveValue('Черновик сохраняется при Escape');
  await expect(picker.getByRole('listbox')).toHaveCount(0);
  await expect(combo).toHaveAttribute('aria-expanded','false');
  await combo.click();
  await picker.getByRole('option',{name:/Точка из Google Maps/}).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:'Сохранить элемент'}).click(); await saved(page);
});
