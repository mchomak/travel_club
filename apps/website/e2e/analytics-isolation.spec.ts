import { test, expect } from "@playwright/test";

test.skip(process.env.WEBSITE_TEST_METRIKA_ENABLED !== "true", "Run with WEBSITE_TEST_METRIKA_ENABLED=true on the isolated local server");
test.setTimeout(90_000);
test.use({ serviceWorkers: "block" });

test("public tag realm ends on private navigation and history traversal", async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? "");
  expect(origin.protocol).toBe("http:");
  expect(origin.hostname).toBe("127.0.0.1");
  expect(origin.port).not.toBe("");
  let scripts = 0;
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin === origin.origin) return route.continue();
    if (url.origin === "https://mc.yandex.ru" && url.pathname === "/metrika/tag.js") {
      scripts++;
      return route.fulfill({ contentType: "application/javascript", body: 'window.__metrikaRealmSentinel = "tag-executed";' });
    }
    return route.fulfill({ status: 200, body: "" });
  });
  const sentinel = () => page.evaluate(() => (window as unknown as { __metrikaRealmSentinel?: string }).__metrikaRealmSentinel ?? null);
  await page.goto("/formats");
  await expect.poll(sentinel).toBe("tag-executed");
  expect(scripts).toBe(1);
  await page.locator('a[href^="/start"]').first().click();
  await expect(page).toHaveURL(/\/start/);
  expect(await sentinel()).toBeNull();
  await page.locator('a[href="/thanks"]').first().click();
  await expect(page).toHaveURL(/\/thanks$/);
  expect(await sentinel()).toBeNull();
  await page.goBack();
  await expect(page).toHaveURL(/\/start/);
  expect(await sentinel()).toBeNull();
  await page.goBack();
  await expect(page).toHaveURL(/\/formats/);
  await expect.poll(sentinel).toBe("tag-executed");
  await page.goForward();
  await expect(page).toHaveURL(/\/start/);
  expect(await sentinel()).toBeNull();
  await page.goForward();
  await expect(page).toHaveURL(/\/thanks$/);
  expect(await sentinel()).toBeNull();
});

test("arbitrary URL and referrer block the counter", async ({ page }) => {
  let scripts = 0;
  await page.route("https://mc.yandex.ru/metrika/tag.js", async route => { scripts++; await route.fulfill({ body: "" }); });
  await page.route("**/api/leads/receipt**", route => route.fulfill({ status: 404, body: "" }));
  for (const url of ["/start?receipt=synthetic#synthetic", "/thanks?receipt=synthetic#synthetic", "/formats?email=synthetic", "/formats#synthetic"]) {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    expect(scripts).toBe(0);
  }
  await page.goto("/formats", { referer: "https://example.test/private?token=synthetic" });
  await page.waitForLoadState("networkidle");
  expect(scripts).toBe(0);
});

test("submission and receipt stay usable without a counter", async ({ page }) => {
  let scripts = 0;
  await page.route("https://mc.yandex.ru/metrika/tag.js", async route => { scripts++; await route.fulfill({ body: "" }); });
  await page.route("**/api/leads", route => route.fulfill({ status: 201, contentType: "application/json", headers: { "set-cookie": "travel_club_receipt=11111111-1111-4111-8111-111111111111.synthetic; HttpOnly; SameSite=Strict; Path=/api/leads/receipt" }, body: JSON.stringify({ lead_number: "TC-000001", confirmation_id: "11111111-1111-4111-8111-111111111111" }) }));
  await page.route("**/api/leads/receipt**", route => {
    const request = route.request();
    const valid = new URL(request.url()).searchParams.get("confirmation") === "11111111-1111-4111-8111-111111111111" && (request.headers().cookie ?? "").includes("travel_club_receipt=11111111-1111-4111-8111-111111111111.synthetic");
    return route.fulfill({ status: valid ? 200 : 404, contentType: "application/json", body: JSON.stringify(valid ? { lead_number: "TC-000001" } : {}) });
  });
  await page.goto("/start?format=route&source=formats");
  await expect(page.locator('button[type="submit"]')).toBeEnabled();
  await page.locator("#lead-contact-method").selectOption("telegram");
  await page.locator("#lead-contact").fill("@synthetic_traveler");
  await page.locator("#lead-consent").check();
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/thanks\?confirmation=/, { timeout: 25_000 });
  await expect(page.getByText("TC-000001")).toBeVisible({ timeout: 25_000 });
  expect(await page.context().cookies()).toContainEqual(expect.objectContaining({ name: "travel_club_receipt", httpOnly: true, sameSite: "Strict", path: "/api/leads/receipt" }));
  await page.reload();
  await expect(page.getByText("TC-000001")).toBeVisible({ timeout: 25_000 });
  expect(scripts).toBe(0);
});
