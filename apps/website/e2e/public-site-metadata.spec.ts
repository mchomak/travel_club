import { expect, test } from "@playwright/test";

const indexablePages = [
  { path: "/", title: "Travel Club — Куда — важно. С кем — важнее" },
  { path: "/formats", title: "Форматы — Travel Club" },
  { path: "/archive", title: "Архив — Travel Club" },
  { path: "/legal", title: "Документы — Travel Club" },
  { path: "/privacy", title: "Политика конфиденциальности — Travel Club" },
  { path: "/personal-data", title: "Обработка персональных данных — Travel Club" },
  { path: "/start", title: "Начать поездку — Travel Club" },
  { path: "/payment", title: "Оплата путешествия — Travel Club" },
  { path: "/services/route", title: "Ваш личный маршрут — Travel Club" },
  { path: "/services/turnkey", title: "Путешествие под ключ — Travel Club" },
  { path: "/tours", title: "Групповые путешествия — Travel Club" },
] as const;

function contrastRatio(foreground: string, background: string) {
  const luminance = (color: string) => {
    const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    if (!channels || channels.length !== 3) throw new Error(`Expected an RGB color, received ${color}`);
    const [red, green, blue] = channels.map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };

  const values = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("public routes have unique titles, descriptions, self canonicals, and indexable robots", async ({ page }) => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();

  for (const { path, title } of indexablePages) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page).toHaveTitle(title);
    expect(titles.has(title), `duplicate title on ${path}`).toBe(false);
    titles.add(title);

    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description, `missing description on ${path}`).toBeTruthy();
    expect(description?.trim().length, `empty description on ${path}`).toBeGreaterThan(0);
    expect(descriptions.has(description!), `duplicate description on ${path}`).toBe(false);
    descriptions.add(description!);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", path);
    const robots = page.locator('meta[name="robots"]');
    if (await robots.count()) await expect(robots).toHaveAttribute("content", /index, follow/);
  }
});

test("the request confirmation is excluded from indexing and stays neutral without a verified receipt", async ({ page }) => {
  const response = await page.goto("/thanks");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Заявка — Travel Club");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "Статус отправленной заявки Travel Club.");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "/thanks");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("проверить заявку");
  await expect(page.getByText(/Заявка сохранена/)).toHaveCount(0);
});

test("small Next Issue labels meet WCAG AA contrast on the red section", async ({ page }) => {
  await page.goto("/");
  const section = page.locator('[data-design-section="next"]');
  const labels = [
    section.getByText("NEXT ISSUE / TC TRIPS", { exact: true }),
    section.getByText("Предварительные заявки", { exact: true }),
  ];

  for (const label of labels) {
    await expect(label).toBeVisible();
    const colors = await label.evaluate((element) => ({
      foreground: getComputedStyle(element).color,
      background: getComputedStyle(element.closest("section")!).backgroundColor,
    }));
    expect(contrastRatio(colors.foreground, colors.background), JSON.stringify(colors)).toBeGreaterThanOrEqual(4.5);
  }
});
