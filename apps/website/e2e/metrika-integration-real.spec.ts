import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const tagPath = process.env.METRIKA_REAL_TAG_PATH;
test.skip(!tagPath || process.env.WEBSITE_TEST_METRIKA_ENABLED !== "true", "Opt-in real tag isolation probe");
test.setTimeout(120_000);
const tag = tagPath ? readFileSync(tagPath) : Buffer.alloc(0);
const marker = "TC_SYNTHETIC_PRIVATE_CANARY_47395";

type Capture = { url: string; headers: string; body: string };
function contains(value: string): boolean {
  for (let n = 0; n < 5; n++) {
    if (value.includes(marker)) return true;
    try { const decoded = decodeURIComponent(value); if (decoded === value) break; value = decoded; } catch { break; }
  }
  return false;
}

async function isolate(page: Page, localOrigin: string) {
  const seen: Capture[] = [];
  let scripts = 0;
  await page.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== localOrigin) {
      seen.push({ url: request.url(), headers: JSON.stringify(request.headers()), body: request.postDataBuffer()?.toString("utf8") ?? "" });
      if (url.origin === "https://mc.yandex.ru" && url.pathname === "/metrika/tag.js") {
        scripts++;
        return route.fulfill({ status: 200, contentType: "application/javascript", body: tag });
      }
      return route.fulfill({ status: 200, body: "" });
    }
    if (url.pathname === "/api/leads" && request.method() === "POST") return route.fulfill({ status: 201, contentType: "application/json", headers: { "set-cookie": `travel_club_receipt=11111111-1111-4111-8111-111111111111.${marker}; HttpOnly; SameSite=Strict; Path=/api/leads/receipt` }, body: JSON.stringify({ lead_number: "TC-000001", confirmation_id: "11111111-1111-4111-8111-111111111111" }) });
    if (url.pathname === "/api/leads/receipt") {
      const valid = url.searchParams.get("token") === marker || (url.searchParams.get("confirmation") === "11111111-1111-4111-8111-111111111111" && (request.headers().cookie ?? "").includes(`travel_club_receipt=11111111-1111-4111-8111-111111111111.${marker}`));
      return route.fulfill({ status: valid ? 200 : 404, contentType: "application/json", body: JSON.stringify(valid ? { lead_number: "TC-000001" } : {}) });
    }
    return route.continue();
  });
  return { seen, scripts: () => scripts, leaked: () => seen.some(r => contains(r.url) || contains(r.headers) || contains(r.body)), watches: () => seen.filter(r => new URL(r.url).pathname.startsWith("/watch/")).length };
}

test("real tag: positive leak control, actual entry and form isolation", async ({ browser, baseURL }) => {
  const origin = new URL(baseURL ?? "");
  expect(origin.protocol).toBe("http:");
  expect(origin.hostname).toBe("127.0.0.1");
  expect(origin.port).not.toBe("");
  expect(tag.length).toBeGreaterThan(10_000);
  const control = await browser.newPage({ serviceWorkers: "block" });
  const baseline = await isolate(control, origin.origin);
  await control.addInitScript(() => {
    const ym = (...args: unknown[]) => { (ym.a ??= []).push(args); };
    ym.a = [] as unknown[][];
    (window as unknown as { ym: unknown }).ym = ym;
    const script = document.createElement("script");
    script.src = "https://mc.yandex.ru/metrika/tag.js";
    document.addEventListener("DOMContentLoaded", () => document.head.appendChild(script));
    ym(114346486, "init", { defer: true, webvisor: true, clickmap: false, trackLinks: false, trackHash: false, sendTitle: false });
    window.addEventListener("load", () => ym(114346486, "hit", location.origin + location.pathname, { referer: "", title: "" }));
  });
  await control.goto(`/formats?receipt=${marker}#${marker}`);
  await expect.poll(() => baseline.watches(), { timeout: 20_000 }).toBeGreaterThan(0);
  await expect.poll(() => baseline.leaked(), { timeout: 10_000 }).toBe(true);
  expect(baseline.scripts()).toBe(1);
  await control.close();

  // A clean public entry must run the actual integration before mutations.
  const page = await browser.newPage({ serviceWorkers: "block" });
  const actual = await isolate(page, origin.origin);
  await page.goto("/formats");
  await expect.poll(() => actual.scripts(), { timeout: 20_000 }).toBe(1);
  await expect.poll(() => actual.watches(), { timeout: 20_000 }).toBeGreaterThan(0);
  await page.evaluate((value) => { history.pushState({}, "", `/formats?token=${value}`); }, marker);
  await page.evaluate((value) => { location.hash = value; }, marker);
  await page.evaluate((value) => { history.pushState({}, "", `/start?token=${value}#${value}`); }, marker);
  await page.mouse.move(100, 100);
  await page.waitForTimeout(3000);
  expect.soft(actual.leaked(), `synthetic pushState/hash canary ${marker} reached an external request`).toBe(false);
  await page.goto("/formats");
  await page.evaluate(() => { (window as unknown as { __realmProbe: boolean }).__realmProbe = true; });
  await page.locator('a[href^="/start"]').first().click();
  await expect(page).toHaveURL(/\/start/);
  expect(await page.evaluate(() => (window as unknown as { __realmProbe?: boolean }).__realmProbe ?? null)).toBeNull();
  await expect.poll(() => page.evaluate(() => Boolean(document.querySelector('script[data-website-metrika]')))).toBe(false);
  await expect(page.locator('button[type="submit"]')).toBeEnabled();
  await page.locator("#lead-product").selectOption("route");
  await page.locator("#lead-contact-method").selectOption("telegram");
  await page.locator("#lead-contact").fill("@synthetic_traveler");
  await page.locator("#lead-message").fill(marker);
  await page.locator("#lead-consent").check();
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/thanks\?confirmation=/, { timeout: 25_000 });
  await expect(page.getByText("TC-000001")).toBeVisible({ timeout: 25_000 });
  expect(await page.evaluate(() => Boolean(document.querySelector('script[data-website-metrika]')))).toBe(false);
  await page.goBack();
  await expect(page).toHaveURL(/\/start/);
  await page.goBack();
  await expect(page).toHaveURL(/\/formats/);
  await page.waitForTimeout(3000);
  expect.soft(actual.leaked(), `synthetic form/navigation canary ${marker} reached an external request`).toBe(false);
  await page.close();

  for (const target of [`/start?token=${marker}#${marker}`, `/thanks?receipt=${marker}#${marker}`, `/formats?token=${marker}#${marker}`, "/start", "/thanks"]) {
    const incoming = await browser.newPage({ serviceWorkers: "block" });
    const capture = await isolate(incoming, origin.origin);
    await incoming.goto(target);
    await incoming.waitForLoadState("networkidle");
    expect(capture.scripts(), `tag loaded at ${target}`).toBe(0);
    expect(capture.leaked(), `synthetic direct-entry canary ${marker} reached an external request`).toBe(false);
    await incoming.close();
  }
  const referrer = await browser.newPage({ serviceWorkers: "block" });
  const refCapture = await isolate(referrer, origin.origin);
  await referrer.goto("/formats", { referer: `https://example.test/${marker}?token=${marker}` });
  await referrer.waitForLoadState("networkidle");
  expect(refCapture.scripts()).toBe(0);
  expect(refCapture.leaked()).toBe(false);
  await referrer.close();

  const returning = await browser.newPage({ serviceWorkers: "block" });
  const returnCapture = await isolate(returning, origin.origin);
  await returning.goto(`/start?token=${marker}#${marker}`);
  await returning.locator('a[href="/"]').first().click();
  await expect(returning).toHaveURL(`${origin.origin}/`);
  await returning.waitForLoadState("networkidle");
  expect(await returning.evaluate(() => document.referrer)).toBe("");
  await expect.poll(() => returnCapture.scripts()).toBe(1);
  await expect.poll(() => returnCapture.watches()).toBeGreaterThan(0);
  expect(returnCapture.leaked()).toBe(false);
  await returning.close();
});

