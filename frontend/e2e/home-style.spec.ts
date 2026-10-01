import { expect, test } from "@playwright/test";

test("palette, wheel and fonts change the homepage and survive reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Хорошая поездка начинается с хорошей компании." })).toBeVisible();
  const panel = page.getByRole("complementary", { name: "Настройки стиля" });
  await expect(panel).toBeVisible();

  await page.getByRole("textbox", { name: "Главный — HEX" }).fill("#7545CC");
  await expect(page.locator(".travel-home")).toHaveCSS("--tc-primary", "#7545CC");
  await expect(page.getByRole("button", { name: "Главный: #7545CC" })).toBeVisible();

  await page.getByRole("combobox", { name: "Заголовки" }).selectOption("editorial");
  await expect(page.locator(".home-hero h1")).toHaveCSS("font-family", /Georgia/);

  const wheel = page.getByRole("img", { name: /Цветовой круг/ });
  await wheel.scrollIntoViewIfNeeded();
  const box = await wheel.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width * 0.75, box!.y + box!.height * 0.5);
  await expect(page.getByRole("textbox", { name: "Главный — HEX" })).not.toHaveValue("#7545CC");
  const picked = await page.getByRole("textbox", { name: "Главный — HEX" }).inputValue();

  await page.reload();
  await expect(page.getByRole("textbox", { name: "Главный — HEX" })).toHaveValue(picked);
  await expect(page.getByRole("combobox", { name: "Заголовки" })).toHaveValue("editorial");
  await page.getByRole("button", { name: "Вернуть исходный вариант" }).click();
  await expect(page.getByRole("textbox", { name: "Главный — HEX" })).toHaveValue("#285D5B");
});

test("mobile settings open without covering the page by default", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const panel = page.locator("#style-lab");
  await expect(panel).toBeHidden();
  await page.getByRole("button", { name: "Настроить стиль" }).click();
  await expect(panel).toBeVisible();
  await expect(page.getByRole("button", { name: "Закрыть настройки" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Вернуть исходный вариант" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(page.getByRole("button", { name: "Настроить стиль" })).toBeFocused();
  await page.getByRole("button", { name: "Настроить стиль" }).click();
  const bounds = await panel.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
});
