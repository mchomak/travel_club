import { expect, test } from "@playwright/test";

type FilterGeometry = {
  titleTop: number;
  titleHeight: number;
  controlTop: number;
  controlHeight: number;
  titleText: string;
  hasIcon: boolean;
};

async function filterGeometry(page: import("@playwright/test").Page): Promise<FilterGeometry[]> {
  return page.locator('section[aria-label="Поиск и фильтры"]').evaluate((section) =>
    Array.from(section.querySelectorAll("label"), (label) => {
      const title = label.querySelector(":scope > span");
      const control = label.querySelector("input, select");
      if (!(title instanceof HTMLElement) || !(control instanceof HTMLElement)) {
        throw new Error("A Research filter is missing its title or control.");
      }
      const titleRect = title.getBoundingClientRect();
      const controlRect = control.getBoundingClientRect();
      return {
        titleTop: titleRect.top,
        titleHeight: titleRect.height,
        controlTop: controlRect.top,
        controlHeight: controlRect.height,
        titleText: title.textContent?.trim() ?? "",
        hasIcon: Boolean(title.querySelector("svg")),
      };
    }),
  );
}

test("Research filter titles stay single-line and controls align at desktop and phone widths", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/admin/login?next=%2Fresearch");
  await page.getByLabel("Логин").fill(process.env.RESEARCH_E2E_LOGIN ?? "tc_research_e2e");
  await page.getByRole("textbox", { name: "Пароль" }).fill(process.env.RESEARCH_E2E_PASSWORD ?? "test-only-password-2026");
  await page.getByRole("button", { name: "Войти в кабинет" }).click();
  await page.waitForURL("**/research");

  const filterPanel = page.locator('section[aria-label="Поиск и фильтры"]');
  await expect(filterPanel).toBeVisible();
  const desktop = await filterGeometry(page);
  expect(desktop).toHaveLength(4);
  expect(desktop.every(({ titleHeight }) => titleHeight < 24)).toBe(true);
  expect(Math.max(...desktop.map(({ controlTop }) => controlTop)) - Math.min(...desktop.map(({ controlTop }) => controlTop))).toBeLessThan(1.5);
  expect(desktop[3].titleText).toContain("Сортировка");
  expect(desktop[3].hasIcon).toBe(true);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await filterGeometry(page);
  expect(mobile).toHaveLength(4);
  expect(mobile.every(({ titleHeight }) => titleHeight < 24)).toBe(true);
  expect(mobile.every(({ controlTop, titleTop, titleHeight }) => Math.abs(controlTop - titleTop - titleHeight - 7) < 1.5)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
