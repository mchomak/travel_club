import { expect, test as base, type BrowserContext, type Page } from "@playwright/test";

type ResearchFixtures = {
  research: {
    openAuthenticatedRoute: (path?: string) => Promise<void>;
    createStartedInterview: (name: string) => Promise<{ respondentId: string }>;
  };
};

type ResearchWorkerFixtures = {
  researchStorageState: Awaited<ReturnType<BrowserContext["storageState"]>>;
};

async function submitLogin(page: Page, next: string): Promise<void> {
  const loginResponse = page.waitForResponse((response) =>
    response.request().method() === "POST" && new URL(response.url()).pathname === "/api/auth/login",
  );
  await page.getByRole("button", { name: "Войти в кабинет" }).click();
  const response = await loginResponse;
  if (!response.ok()) {
    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible({ timeout: 3000 }).catch(() => undefined);
    const message = await alert.isVisible().catch(() => false) ? (await alert.innerText()).trim() : "no visible login message";
    const throttleHint = response.status() === 429
      ? " Use a fresh synthetic RESEARCH_E2E_LOGIN or wait for the 15-minute limit to expire."
      : "";
    throw new Error(`Research login returned HTTP ${response.status()}: ${message}.${throttleHint}`);
  }
  await page.waitForURL((url) => url.pathname === next);
}

async function createStartedInterview(page: Page, name: string): Promise<{ respondentId: string }> {
  const respondent = await page.evaluate(async (respondentName) => {
    const response = await fetch("/api/research/respondents", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "TravelClub" },
      body: JSON.stringify({ screening_answers: { name: respondentName } }),
    });
    if (!response.ok) throw new Error(`create synthetic respondent failed: ${response.status}`);
    return await response.json() as { id: string; interviews: Array<{ id: string }> };
  }, name);

  const started = await page.evaluate(async (interviewId) => {
    const response = await fetch(`/api/research/interviews/${interviewId}/start`, {
      method: "POST",
      headers: { "X-Requested-With": "TravelClub" },
    });
    if (!response.ok) throw new Error(`start synthetic interview failed: ${response.status}`);
    return await response.json();
  }, respondent.interviews[0].id);

  if (!started) throw new Error("start synthetic interview returned an empty response");
  return { respondentId: respondent.id };
}

export const test = base.extend<ResearchFixtures, ResearchWorkerFixtures>({
  // The backend applies a per-login throttle; authenticate once per suite and share only this synthetic session.
  researchStorageState: [async ({ browser }, use) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3102";
    const context = await browser.newContext();
    const page = await context.newPage();
    const credentials = {
      login: process.env.RESEARCH_E2E_LOGIN ?? "tc_research_e2e",
      password: process.env.RESEARCH_E2E_PASSWORD ?? "test-only-password-2026",
    };
    const next = "/research";

    try {
      await page.goto(`${baseURL}/admin/login?next=${encodeURIComponent(next)}`);
      await page.getByRole("button", { name: "Показать пароль" }).click();
      await expect(page.getByRole("textbox", { name: "Пароль" })).toHaveAttribute("type", "text");
      await page.getByRole("button", { name: "Скрыть пароль" }).click();
      await expect(page.getByRole("textbox", { name: "Пароль" })).toHaveAttribute("type", "password");
      await page.getByLabel("Логин").fill(credentials.login);
      await page.getByRole("textbox", { name: "Пароль" }).fill(credentials.password);
      await submitLogin(page, next);
      await use(await context.storageState());
    } finally {
      await context.close();
    }
  }, { scope: "worker" }],
  storageState: async ({ researchStorageState }, use) => {
    await use(researchStorageState);
  },
  research: async ({ page }, use) => {
    await use({
      async openAuthenticatedRoute(path = "/research") {
        await page.goto(path);
        await page.waitForURL((url) => url.pathname === path);
      },
      createStartedInterview: (name) => createStartedInterview(page, name),
    });
  },
});

export { expect };
