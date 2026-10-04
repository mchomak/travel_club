import { expect, test } from "@playwright/test";

test("issue archive changes destination identity through keyboard navigation", async ({ page }) => {
  await page.goto("/test");
  const archive = page.getByRole("region", { name: "Выпуски Travel Club" });
  await expect(archive.getByRole("heading", { name: "ISTANBUL", exact: true })).toBeVisible();
  const originalColor = await archive.evaluate((element) => getComputedStyle(element).backgroundColor);
  const shanghai = archive.getByRole("button", { name: "ISSUE 01 / SHANGHAI", exact: true });
  await shanghai.focus();
  await page.keyboard.press("Enter");
  await expect(shanghai).toHaveAttribute("aria-pressed", "true");
  await expect(archive.getByRole("heading", { name: "SHANGHAI", exact: true })).toBeVisible();
  await expect(archive.getByRole("img", { name: /Вечерняя улица Нанкин/ })).toBeVisible();
  await expect.poll(() => archive.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(originalColor);
  await archive.getByRole("button", { name: "NEXT ISSUE / UNKNOWN", exact: true }).click();
  await expect(archive.getByRole("heading", { name: "UNKNOWN", exact: true })).toBeVisible();
  await expect(archive.getByText("В разработке", { exact: true })).toBeVisible();
});

test("format entry selects the service and demo form validates without transmitting contact", async ({ page }) => {
  const submissions: string[] = [];
  page.on("request", (request) => { if (request.method() === "POST") submissions.push(request.url()); });
  await page.goto("/test");
  await page.getByRole("link").filter({ has: page.getByRole("heading", { name: "Под ключ", exact: true }) }).click();
  const form = page.locator("#start");
  await expect(form.getByRole("radio", { name: "Хочу под ключ", exact: true })).toBeChecked();
  const contact = form.getByRole("textbox", { name: /Ваш контакт/ });
  await form.getByRole("button", { name: "Обсудить поездку", exact: true }).click();
  await expect(form.getByRole("alert")).toHaveText("Оставьте Telegram, телефон или email.");
  await expect(contact).toBeFocused();
  await contact.fill("где-нибудь");
  await form.getByRole("textbox", { name: "Куда?", exact: true }).fill("не знаю");
  await form.getByRole("button", { name: "Обсудить поездку", exact: true }).click();
  await expect(form.getByRole("alert")).toHaveText(/Проверьте контакт/);
  await expect(contact).toHaveValue("где-нибудь");
  await contact.fill("@sample_traveler");
  await form.getByRole("button", { name: "Обсудить поездку", exact: true }).click();
  await expect(form.getByRole("status")).toContainText("Данные не отправлены и нигде не сохранены.");
  await expect(form.getByRole("heading", { name: "Так начнётся наша история." })).toBeFocused();
  expect(submissions).toEqual([]);
  await form.getByRole("button", { name: "Попробовать ещё раз" }).click();
  await expect(form.getByRole("radio", { name: "Хочу под ключ", exact: true })).toBeChecked();
  await expect(form.getByRole("textbox", { name: /Ваш контакт/ })).toHaveValue("");
});

for (const width of [1440, 1024, 390]) {
  test(`design stays within the viewport at ${width}px and respects reduced motion`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/test");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    if (width === 390) {
      const formats = page.getByRole("navigation", { name: "Выбрать формат поездки" });
      await expect(formats).toBeVisible();
      const bounds = await formats.boundingBox();
      expect(bounds!.y + bounds!.height).toBeLessThan(844);
    }
    const archive = page.getByRole("region", { name: "Выпуски Travel Club" });
    for (const name of ["ISSUE 00 / ISTANBUL", "ISSUE 01 / SHANGHAI", "NEXT ISSUE / UNKNOWN"]) {
      await archive.getByRole("button", { name, exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(await archive.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe("0s");
    }
  });
}
