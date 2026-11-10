import { expect, test, type Page } from "@playwright/test";

const design20 = (page: Page) => page.locator('[data-editorial-home="test-20"]');
const design21 = (page: Page) => page.locator('[data-editorial-home="test-21"]');
const viewportWidths = [375, 768, 1280, 1440];

async function signature(page: Page, selector: string) {
  const root = page.locator(selector);
  return root.evaluate(element => {
    const sections = [...element.querySelectorAll<HTMLElement>("[data-design-section]")];
    const typeRoles = [...element.querySelectorAll<HTMLElement>("[data-type-role]")];
    return {
      sections: sections.map(section => ({ name: section.dataset.designSection, background: getComputedStyle(section).backgroundColor })),
      roles: typeRoles.map(role => ({ name: role.dataset.typeRole, size: Number.parseFloat(getComputedStyle(role).fontSize) })),
      photoSlots: [...element.querySelectorAll<HTMLElement>("[data-photo-slot]")].map(slot => slot.dataset.photoSlot),
      links: [...element.querySelectorAll<HTMLAnchorElement>("a")].map(link => link.getAttribute("href")),
      logos: [...element.querySelectorAll<HTMLImageElement>('img[alt="Travel Club"]')].map(image => image.getAttribute("src")),
      overflow: element.scrollWidth > document.documentElement.clientWidth,
    };
  });
}

test("/test_21 uses the centralized defaults and retains /test_20 composition", async ({ page }) => {
  await page.goto("/test_20");
  await page.evaluate(() => localStorage.removeItem("travel-club-test-20-design-v1"));
  await page.reload();
  await expect(design20(page)).toBeVisible();

  for (const width of viewportWidths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/test_20");
    const expected = await signature(page, '[data-editorial-home="test-20"]');

    await page.goto("/test_21");
    await page.evaluate(() => document.fonts.ready);
    await expect(design21(page)).toBeVisible();
    const actual = await signature(page, '[data-editorial-home="test-21"]');
    expect({ ...actual, roles: [] }).toEqual({ ...expected, roles: [] });
    expect(actual.roles.map(role => role.name)).toEqual(expected.roles.map(role => role.name));
    actual.roles.forEach((role, index) => expect(Math.abs(role.size - expected.roles[index].size)).toBeLessThanOrEqual(0.001));
    await expect(page.getByRole("button", { name: "Design Settings" })).toHaveCount(0);
    await expect(page.getByText("Настройки дизайна", { exact: true })).toHaveCount(0);
    await expect(design21(page)).toHaveCSS("font-family", /Travel Club Lato/);
    expect((await signature(page, '[data-editorial-home="test-21"]')).overflow).toBe(false);

    const cyrillicLato = await page.evaluate(async () => {
      await document.fonts.load('400 16px "Travel Club Lato"', "Путешествие и компания");
      return document.fonts.check('400 16px "Travel Club Lato"', "Путешествие и компания");
    });
    expect(cyrillicLato).toBe(true);
  }
});

test("/test_21 keeps the photo replacement and crop workflow without settings", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/test_21");
  const frame = page.locator('[data-photo-slot="hero-terrace"]');
  const trigger = frame.getByRole("button", { name: /Редактировать фото/ });
  await frame.hover();
  await trigger.click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("menuitem", { name: "Заменить фото", exact: true }).click();
  const image = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 600;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#253746";
    context.fillRect(0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await (await chooser).setFiles({ name: "test-21-photo.png", mimeType: "image/png", buffer: Buffer.from(image, "base64") });
  const dialog = page.getByRole("dialog", { name: "Кадрирование фото" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS("font-family", /Travel Club Lato/);
  await expect(dialog.getByRole("button", { name: "Сохранить фото", exact: true })).toBeEnabled();
  await dialog.getByRole("button", { name: "Сохранить фото", exact: true }).click();
  await expect(frame.locator("img")).toHaveAttribute("src", /^blob:/);
  expect(await page.evaluate(() => indexedDB.databases().then(databases => databases.map(database => database.name)))).toContain("travel-club-test-21-photos");
  await expect(page.getByRole("button", { name: "Design Settings" })).toHaveCount(0);
});
