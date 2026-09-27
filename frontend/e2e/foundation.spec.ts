import { expect, test } from "@playwright/test";

test("private shell redirects without a session and public pages stay public", async ({ page }) => {
  const fixtureLogin = `fixture-browser-${Date.now()}`;
  await page.goto("/admin/trips");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: "С возвращением" })).toBeVisible();
  await page.getByLabel("Логин", { exact: true }).fill(fixtureLogin);
  await page.getByLabel("Пароль", { exact: true }).fill("FICTIONAL-BROWSER-PASSWORD-ONLY");
  await page.getByRole("button", { name: "Войти в кабинет" }).click();
  await expect(page.locator("#login-error")).toHaveText("Неверный логин или пароль");
  await expect(page.getByLabel("Логин", { exact: true })).toHaveValue(fixtureLogin);
  for (const path of ["/", "/tours", "/services/route", "/services/turnkey", "/payment"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("login works on a narrow screen without horizontal scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/login");
  await expect(page.getByLabel("Логин", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти в кабинет" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
