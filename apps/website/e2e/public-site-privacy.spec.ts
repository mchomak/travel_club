import { errors, expect, test, type Page } from "@playwright/test";

const personalAnswerMarkers = [
  "private_7b2@example.test",
  "PRIVATE_NAME_7b2",
  "PRIVATE_COMMENT_7b2",
];

const personalFieldNames = new Set(["contact", "contact_value", "name", "message", "comment"]);

function containsPersonalAnswer(value: string, additionalMarkers: readonly string[] = []) {
  const variants = [value];
  let candidate = value;
  for (let depth = 0; depth < 5; depth += 1) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(candidate.replaceAll("+", " "));
    } catch {
      break;
    }
    if (decoded === candidate) break;
    variants.push(decoded);
    candidate = decoded;
  }

  const markers = [...personalAnswerMarkers, ...additionalMarkers].map((marker) => marker.toLowerCase());
  return variants.some((variant) => {
    const normalized = variant.toLowerCase();
    return markers.some((marker) => normalized.includes(marker));
  });
}

function containsPersonalFieldQuery(value: string) {
  try {
    const query = new URL(value).searchParams;
    return [...query.keys()].some((key) => personalFieldNames.has(key.toLowerCase()));
  } catch {
    return false;
  }
}

async function readWebStorage(page: Page) {
  return page.evaluate(() => {
    const entries = (storage: Storage) => Array.from({ length: storage.length }, (_, index) => {
      const key = storage.key(index);
      return key === null ? null : [key, storage.getItem(key)] as const;
    }).filter((entry): entry is readonly [string, string | null] => entry !== null)
      .sort(([left], [right]) => left.localeCompare(right));

    return JSON.stringify({
      localStorage: entries(window.localStorage),
      sessionStorage: entries(window.sessionStorage),
    });
  });
}

test("lead answers go only to the API and stay out of URL, browser storage, cookies, and console logs", async ({ browser }, testInfo) => {
  expect(containsPersonalAnswer("http://example.test/start?contact=private_7b2%40example.test")).toBe(true);
  expect(containsPersonalAnswer("http://example.test/start?contact=private_7b2%2540example.test")).toBe(true);
  expect(containsPersonalFieldQuery("http://example.test/start?%63ontact_value=private_7b2%40example.test")).toBe(true);
  const context = await browser.newContext({ baseURL: testInfo.project.use.baseURL as string });
  try {
    const initialCookies = await context.cookies();
    expect(initialCookies.length).toBe(0);
    const initialCookieSnapshot = JSON.stringify(initialCookies);
    const page = await context.newPage();
    await page.addInitScript(() => {
      const writes: string[] = [];
      Object.defineProperty(window, "__travelClubFormWrites", { value: writes });

      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        writes.push(`Storage.setItem:${key}:${value}`);
        return originalSetItem.call(this, key, value);
      };

      const storePrototype = IDBObjectStore.prototype as unknown as Record<
        "add" | "put",
        (this: IDBObjectStore, ...args: unknown[]) => IDBRequest
      >;
      for (const method of ["add", "put"] as const) {
        const original = storePrototype[method];
        storePrototype[method] = function (this: IDBObjectStore, ...args: unknown[]) {
          writes.push(String(args[0]));
          return original.apply(this, args);
        };
      }
    });

    const requests: { method: string; url: string; body: string }[] = [];
    const submissions: Record<string, unknown>[] = [];
    const consoleOutput: string[] = [];
    let mockedSubmissions = 0;
    page.on("request", (request) => {
      const body = request.postData() ?? "";
      requests.push({ method: request.method(), url: request.url(), body });
    });
    page.on("console", (message) => consoleOutput.push(message.text()));
    page.on("pageerror", (error) => consoleOutput.push(error.message));
    await page.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.pathname.endsWith("/api/leads") && request.method() === "POST") {
        mockedSubmissions += 1;
        submissions.push(JSON.parse(request.postData() ?? "{}") as Record<string, unknown>);
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ lead_number: "TC-000123", receipt_token: "opaque-ui-test-receipt" }),
        });
        return;
      }
      if (url.pathname.endsWith("/api/leads/receipt") && request.method() === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ lead_number: "TC-000123" }) });
        return;
      }
      if (request.method() !== "GET") {
        await route.abort();
        return;
      }
      await route.continue();
    });

    await page.goto("/start?format=group&source=home");
    const form = page.getByRole("form", { name: "Заявка на поездку", exact: true });
    const product = form.getByLabel("Что вам интересно?");
    const channel = form.getByLabel("Предпочтительный способ связи");
    const contact = form.getByLabel("Контакт");
    const name = form.getByLabel("Как к вам обращаться? Необязательно");
    const message = form.getByLabel("Пара слов о поездке Необязательно");
    await expect(product).toHaveValue("group");
    const storageAtStart = await readWebStorage(page);

    async function assertNoBrowserLeak(stage: string, expectedSubmissions = 0) {
      const writes = await page.evaluate(() =>
        (window as unknown as Window & { __travelClubFormWrites: string[] }).__travelClubFormWrites,
      );
      const nonSubmissionRequests = requests.filter(({ method, url }) => method !== "POST" || !new URL(url).pathname.endsWith("/api/leads"));
      const currentStorage = await readWebStorage(page);
      const cookieStateUnchanged = JSON.stringify(await context.cookies()) === initialCookieSnapshot;
      expect(currentStorage, `${stage}: browser storage must remain unchanged`).toBe(storageAtStart);
      expect(containsPersonalAnswer(currentStorage), `${stage}: storage must not contain answers`).toBe(false);
      expect(containsPersonalAnswer(writes.join("\n")), `${stage}: write log must not contain answers`).toBe(false);
      expect(requests.some(({ url }) => containsPersonalFieldQuery(url)), `${stage}: answers must not be query params`).toBe(false);
      expect(containsPersonalAnswer(page.url()), `${stage}: URL must not contain answers`).toBe(false);
      expect(containsPersonalAnswer(consoleOutput.join("\n")), `${stage}: console must not contain answers`).toBe(false);
      expect(containsPersonalAnswer(nonSubmissionRequests.map(({ url, body }) => `${url} ${body}`).join("\n")), `${stage}: answers must not go to unrelated requests`).toBe(false);
      expect(mockedSubmissions, `${stage}: only explicit submit may create the mocked API request`).toBe(expectedSubmissions);
      expect(cookieStateUnchanged, `${stage}: cookies must remain unchanged`).toBe(true);
    }

    await channel.selectOption("email");
    await contact.fill(personalAnswerMarkers[0]);
    await name.fill(personalAnswerMarkers[1]);
    await message.fill(personalAnswerMarkers[2]);
    await form.getByRole("checkbox", { name: /Согласен/ }).check();
    await assertNoBrowserLeak("before submit");

    await form.getByRole("button", { name: "Отправить заявку", exact: true }).click();
    await expect(page).toHaveURL(/\/thanks\?receipt=opaque-ui-test-receipt$/);
    await expect(page.getByText("Заявка сохранена. Команда свяжется с вами выбранным способом.")).toBeVisible();
    await assertNoBrowserLeak("after submit", 1);
    expect(mockedSubmissions).toBe(1);
    expect(submissions[0]).toMatchObject({
      product_id: "group",
      contact_method: "email",
      contact_value: personalAnswerMarkers[0],
      name: personalAnswerMarkers[1],
      message: personalAnswerMarkers[2],
      source: "home",
      consent: true,
    });
  } finally {
    await context.close();
  }
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("without JavaScript the form sends no request", async ({ page }) => {
    const privateAnswer = "private_7c3@example.test";
    let interceptedSubmissions = 0;
    const isSubmissionRequest = (request: { url(): string; method(): string; postData(): string | null }) =>
      request.method() !== "GET"
      || containsPersonalAnswer(`${request.url()} ${request.postData() ?? ""}`, [privateAnswer])
      || containsPersonalFieldQuery(request.url());
    await page.route("**/*", async (route) => {
      if (isSubmissionRequest(route.request())) {
        interceptedSubmissions += 1;
        await route.abort();
        return;
      }
      await route.continue();
    });

    for (const action of ["click", "Enter"] as const) {
      await page.goto("/start");
      const form = page.getByRole("form", { name: "Заявка на поездку", exact: true });
      const method = form.getByLabel("Предпочтительный способ связи");
      const contact = form.getByLabel("Контакт");
      const submit = form.getByRole("button", { name: "Отправить заявку", exact: true });
      await expect(contact).toBeDisabled();
      await expect(method).toHaveValue("");
      const requestObserved = page.waitForRequest(isSubmissionRequest, { timeout: 300 }).then(
        () => true,
        (error: unknown) => {
          if (error instanceof errors.TimeoutError) return false;
          throw error;
        },
      );

      if (action === "click") {
        await submit.evaluate((button) => (button as HTMLButtonElement).click());
      } else {
        await method.press("Enter");
      }

      expect(await requestObserved).toBe(false);
      expect(interceptedSubmissions).toBe(0);
      await expect(page).toHaveURL(/\/start$/);
      await expect(submit).toBeDisabled();
      await expect(page.locator("noscript p")).toHaveText("Чтобы отправить заявку, включите JavaScript. Сейчас данные не будут отправлены.");
      await expect(page.locator("noscript p")).toBeVisible();
    }
  });
});

const publicPages = [
  "/",
  "/formats",
  "/services/route",
  "/services/turnkey",
  "/tours",
  "/payment",
  "/archive",
  "/start",
  "/thanks",
  "/legal",
  "/privacy",
  "/personal-data",
  "/a-page-outside-the-route",
];
const headerLinks = [
  { name: "Услуги", href: "/formats" },
  { name: "О нас", href: "/#point-of-view" },
  { name: "Архив", href: "/archive" },
  { name: "Начать поездку", href: "/start" },
];
const footerNavigationLinks = headerLinks;
const documentLinks = [
  { name: "Правовая информация", href: "/legal" },
  { name: "Конфиденциальность", href: "/privacy" },
  { name: "Персональные данные", href: "/personal-data" },
  { name: "О демонстрации", href: "/thanks" },
];

test("every public route uses the same accessible shell and landmarks", async ({ page }) => {
  for (const path of publicPages) {
    const response = await page.goto(path);
    const isNotFound = path === "/a-page-outside-the-route";
    expect(response?.status(), path).toBe(isNotFound ? 404 : 200);
    await expect(page.locator("[data-public-site-shell]")).toHaveCount(1);
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Основная навигация", exact: true })).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Навигация внизу страницы", exact: true })).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Документы", exact: true })).toHaveCount(1);

    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: "К содержимому", exact: true });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    expect(await skipLink.evaluate((link) => getComputedStyle(link).outlineStyle)).toBe("solid");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    await expect(page).toHaveURL(/#main$/);

    await page.getByRole("banner").getByRole("link", { name: "Travel Club — главная", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  }
});

test("the mobile menu opens, follows links, and closes with Escape", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/formats");
  const toggle = page.getByRole("button", { name: "Открыть меню" });
  const navigation = page.getByRole("navigation", { name: "Основная навигация", exact: true });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(navigation).not.toBeVisible();

  await toggle.click();
  await expect(page.getByRole("button", { name: "Закрыть меню" })).toHaveAttribute("aria-expanded", "true");
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Услуги" })).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await expect(navigation).not.toBeVisible();

  await toggle.click();
  await navigation.getByRole("link", { name: "Архив" }).click();
  await expect(page).toHaveURL(/\/archive$/);
  await expect(page.getByRole("button", { name: "Открыть меню" })).toHaveAttribute("aria-expanded", "false");
});

test("the site metadata favicon resolves to the approved brand asset", async ({ page }) => {
  await page.goto("/");
  const iconHref = "/website/assets/brand/travel-club-navy.svg";
  await expect(page.locator('head link[rel="icon"]').first()).toHaveAttribute("href", iconHref);

  const response = await page.request.get(iconHref);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
  expect(await response.text()).toMatch(/<svg\b/);
});

test("shared header and footer links reach every real public destination", async ({ page }) => {
  for (const { href, name } of headerLinks) {
    await page.goto("/formats");
    const link = page.getByRole("navigation", { name: "Основная навигация", exact: true })
      .getByRole("link", { name, exact: true });
    await expect(link).toHaveAttribute("href", href);
    await link.click();
    if (href === "/#point-of-view") {
      await expect(page).toHaveURL(/\/#point-of-view$/);
      await expect(page.locator("#point-of-view")).toBeInViewport();
    } else {
      await expect(page).toHaveURL(new RegExp(`${href.replaceAll("/", "\\/")}$`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    }
  }

  for (const [navigationName, links] of [
    ["Навигация внизу страницы", footerNavigationLinks],
    ["Документы", documentLinks],
  ] as const) {
    for (const { href, name } of links) {
      await page.goto("/formats");
      const link = page.getByRole("navigation", { name: navigationName, exact: true })
        .getByRole("link", { name, exact: true });
      await expect(link).toHaveAttribute("href", href);
      await link.click();
      if (href === "/#point-of-view") {
        await expect(page).toHaveURL(/\/#point-of-view$/);
        await expect(page.locator("#point-of-view")).toBeInViewport();
      } else {
        await expect(page).toHaveURL(new RegExp(`${href.replaceAll("/", "\\/")}$`));
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      }
    }
  }
});
