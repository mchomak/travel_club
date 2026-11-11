import { errors, expect, test, type Page } from "@playwright/test";

const personalAnswerMarkers = [
  "PRIVATE_DESTINATION_7b2",
  "PRIVATE_DATE_7b2",
  "PRIVATE_BUDGET_7b2",
  "PRIVATE_COMMENT_7b2",
  "private_7b2@example.test",
];

const personalFieldNames = new Set(["destination", "when", "participants", "budget", "comment", "contact"]);

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

test("demo answers stay out of requests, URL, browser writes, cookies, and console logs", async ({ browser }, testInfo) => {
  expect(containsPersonalAnswer("http://example.test/start?contact=private_7b2%40example.test")).toBe(true);
  expect(containsPersonalAnswer("http://example.test/start?contact=private_7b2%2540example.test")).toBe(true);
  expect(containsPersonalFieldQuery("http://example.test/start?%70articipants=4")).toBe(true);
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
        writes.push(`${key}:${value}`);
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
    const consoleOutput: string[] = [];
    let interceptedSubmissions = 0;
    page.on("request", (request) => {
      const body = request.postData() ?? "";
      requests.push({ method: request.method(), url: request.url(), body });
    });
    page.on("console", (message) => consoleOutput.push(message.text()));
    page.on("pageerror", (error) => consoleOutput.push(error.message));
    await page.route("**/*", async (route) => {
      const request = route.request();
      const payload = `${request.url()} ${request.postData() ?? ""}`;
      if (request.method() !== "GET" || containsPersonalAnswer(payload) || containsPersonalFieldQuery(request.url())) {
        interceptedSubmissions += 1;
        await route.abort();
        return;
      }
      await route.continue();
    });

    await page.goto("/start?format=group");
    const form = page.getByRole("form", { name: "Начать историю", exact: true });
    const fields = [
      form.getByRole("textbox", { name: "Куда хотите поехать?", exact: true }),
      form.getByRole("textbox", { name: "Когда?", exact: true }),
      form.getByRole("textbox", { name: "Ориентировочный бюджет", exact: true }),
      form.getByRole("textbox", { name: "Комментарий / пожелания", exact: true }),
      form.getByRole("textbox", { name: "Ваш контакт — обязательно", exact: true }),
    ];
    const participants = form.getByRole("textbox", { name: "Количество человек", exact: true });
    const writesAtStart = await page.evaluate(() =>
      (window as unknown as Window & { __travelClubFormWrites: string[] }).__travelClubFormWrites.length,
    );
    const storageAtStart = await readWebStorage(page);

    async function assertNoAnswerPersistence() {
      const writes = await page.evaluate(() =>
        (window as unknown as Window & { __travelClubFormWrites: string[] }).__travelClubFormWrites,
      );
      const requestData = requests.map(({ url, body }) => `${url} ${body}`).join("\n");
      const currentStorage = await readWebStorage(page);
      const cookieStateUnchanged = JSON.stringify(await context.cookies()) === initialCookieSnapshot;
      expect(writes.length).toBe(writesAtStart);
      expect(currentStorage).toBe(storageAtStart);
      expect(containsPersonalAnswer(currentStorage)).toBe(false);
      expect(containsPersonalAnswer(writes.join("\n"))).toBe(false);
      expect(containsPersonalAnswer(requestData)).toBe(false);
      expect(requests.some(({ url }) => containsPersonalFieldQuery(url))).toBe(false);
      expect(containsPersonalAnswer(page.url())).toBe(false);
      expect(containsPersonalAnswer(consoleOutput.join("\n"))).toBe(false);
      expect(requests.some(({ method }) => method !== "GET")).toBe(false);
      expect(interceptedSubmissions).toBe(0);
      expect(cookieStateUnchanged).toBe(true);
    }

    for (const [index, field] of fields.entries()) {
      await field.fill(personalAnswerMarkers[index]);
      await assertNoAnswerPersistence();
    }
    await participants.fill("4");
    await assertNoAnswerPersistence();

    await form.getByRole("button", { name: "Продолжить", exact: true }).click();
    await expect(page).toHaveURL(/\/thanks$/);
    await assertNoAnswerPersistence();
  } finally {
    await context.close();
  }
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("click and Enter cannot submit personal answers through the native form", async ({ page }) => {
    const privateAnswer = "NOJS_PRIVATE_CONTACT_7c3";
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
      const form = page.getByRole("form", { name: "Начать историю", exact: true });
      const contact = form.getByRole("textbox", { name: "Ваш контакт — обязательно", exact: true });
      const submit = form.getByRole("button", { name: "Продолжить", exact: true });
      await contact.fill(privateAnswer);
      const requestObserved = page.waitForRequest(isSubmissionRequest, { timeout: 300 }).then(
        () => true,
        (error: unknown) => {
          if (error instanceof errors.TimeoutError) return false;
          throw error;
        },
      );

      if (action === "click") {
        await submit.click({ force: true, noWaitAfter: true });
      } else {
        await contact.press("Enter");
      }

      expect(await requestObserved).toBe(false);
      expect(interceptedSubmissions).toBe(0);
      await expect(page).toHaveURL(/\/start$/);
      await expect(submit).toBeDisabled();
      await expect(page.locator("noscript p")).toHaveText("Чтобы продолжить, включите JavaScript. Эта тестовая форма не отправляет данные.");
      await expect(page.locator("noscript p")).toBeVisible();
    }
  });
});

const publicationShellPages = [
  "/formats",
  "/archive",
  "/start",
  "/thanks",
  "/legal",
  "/privacy",
  "/personal-data",
  "/a-page-outside-the-route",
];
const legacyPublicLayoutPages = [
  "/payment",
  "/services/route",
  "/services/turnkey",
  "/tours",
];
const headerLinks = [
  { name: "Услуги", href: "/formats" },
  { name: "О нас", href: "/#point-of-view" },
  { name: "Архив", href: "/archive" },
  { name: "Начать поездку", href: "/start" },
];
const footerLinks = [
  ...headerLinks,
  { name: "Документы", href: "/legal" },
  { name: "Политика конфиденциальности", href: "/privacy" },
  { name: "Обработка персональных данных", href: "/personal-data" },
  { name: "О демонстрации", href: "/thanks" },
];

test("the publication shell keeps keyboard skip navigation and a working home link on its routes", async ({ page }) => {
  for (const path of publicationShellPages) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(path === "/a-page-outside-the-route" ? 404 : 200);
    await expect(page.locator("[data-publication-root]")).toHaveCount(1);
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: "К содержимому", exact: true });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    expect(await skipLink.evaluate((link) => getComputedStyle(link).outlineStyle)).toBe("solid");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    await expect(page).toHaveURL(/#publication-main$/);

    await page.getByRole("banner").getByRole("link", { name: "Travel Club — главная", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  }
});

test("the homepage keeps its editorial shell, landmarks, and keyboard skip link", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-editorial-home="website"]')).toHaveCount(1);
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.locator("main#main")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

  const skipLink = page.locator('a[href="#main"]').first();
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeInViewport();
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

test("legacy public routes render their existing placeholder layout", async ({ page }) => {
  for (const path of legacyPublicLayoutPages) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator("[data-public-layout]")).toHaveCount(1);
    await expect(page.locator("[data-public-layout] header")).toHaveCount(1);
    await expect(page.locator("[data-public-layout] main")).toHaveCount(1);
    await expect(page.locator("[data-public-layout] footer")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.locator("[data-public-layout] header a").first()).toHaveAttribute("href", "/");
  }
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

  for (const { href, name } of footerLinks) {
    await page.goto("/formats");
    const link = page.getByRole("navigation", { name: "Все страницы сайта", exact: true })
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
});
