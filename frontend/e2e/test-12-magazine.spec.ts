import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const titles = ["Hero + Formats", "О нас", "Next Issue", "Thailand ’26", "China ’26", "Archive ’25", "Point of View + Start"];
const labels = ["Услуги", "О нас", "Первая поездка", "Таиланд", "Китай", "Архив", "Начать"];
const pages = '[data-magazine-book] > [data-magazine-page]';
const chapter = (page: Page, number: number) => page.getByRole("navigation").getByRole("button", { name: `0${number} ${labels[number - 1]}`, exact: true });
async function landed(page: Page, number: number) {
  await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-spread", String(number));
  await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-turning", "false");
  await expect(chapter(page, number)).toHaveAttribute("aria-current", "page");
  await expect(page.locator(pages)).toHaveCount(2);
  await expect(page.locator(`${pages} footer > span:last-child`)).toHaveText([String(number * 2).padStart(2, "0"), String(number * 2 + 1).padStart(2, "0")]);
}
test.use({ viewport: { width: 1440, height: 900 } });

test("all seven direct URLs commit the corresponding article, active entry and physical folios", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (let number = 1; number <= 7; number++) {
    await page.goto(`/test_12?spread=${number}&source=acceptance`);
    await landed(page, number);
    await expect(page.getByRole("status")).toHaveText(`Разворот ${number} из 7. ${titles[number - 1]}`);
    await expect(page).toHaveURL(new RegExp(`spread=${number}&source=acceptance$`));
  }
});

test("sequential Next and Previous traverse all seven chapters and preserve query/history", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_12?spread=1&source=sequence");
  await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
  for (let number = 2; number <= 7; number++) {
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await landed(page, number);
  }
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
  for (let number = 6; number >= 1; number--) {
    await page.getByRole("button", { name: "Previous", exact: true }).click();
    await landed(page, number);
  }
  await page.goBack(); await landed(page, 2);
  await page.goForward(); await landed(page, 1);
  await expect(page).toHaveURL(/spread=1&source=sequence$/);
});

test("chapter jumps, keyboard arrows, focus and revisiting the cover retain the chosen chapter", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_12?spread=1");
  await chapter(page, 6).click(); await landed(page, 6);
  await expect(chapter(page, 6)).toBeFocused();
  await page.keyboard.press("ArrowRight"); await landed(page, 7);
  await page.keyboard.press("ArrowRight"); await landed(page, 7);
  await page.keyboard.press("ArrowLeft"); await landed(page, 6);
  await page.getByRole("button", { name: "Обложка", exact: true }).click();
  const open = page.getByRole("button", { name: "Открыть журнал", exact: true });
  await expect(open).toBeFocused();
  await page.keyboard.press("Enter");
  await landed(page, 6);
  await expect(page.locator("[data-magazine-book]")).toBeFocused();
  await page.keyboard.press("ArrowLeft"); await landed(page, 5);
});

test("invalid, repeated and out-of-range spreads normalize without removing unrelated query values", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const query of ["spread=bad", "spread=0", "spread=8", "spread=-1", "spread=1.5", "spread=01", "spread=2&spread=3", "spread="]) {
    await page.goto(`/test_12?${query}&source=qa&tag=a&tag=b`);
    await landed(page, 1);
    const url = new URL(page.url());
    expect(url.searchParams.getAll("spread")).toEqual(["1"]);
    expect(url.searchParams.get("source")).toBe("qa");
    expect(url.searchParams.getAll("tag")).toEqual(["a", "b"]);
    await expect(page.locator("canvas,[data-reading-turn]")).toHaveCount(0);
  }
});

test("services expose the agreed product names, purpose, prices, caveat and real destination links", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_12?spread=1");
  const left = page.locator(`${pages}[data-magazine-page="left"]`);
  const right = page.locator(`${pages}[data-magazine-page="right"]`);
  await expect(left).toContainText("Travel Club — независимая редакция путешествий");
  await expect(left.locator('a[href="/start"]')).toHaveCount(0);
  await expect(right.getByRole("heading", { name: "С нами в путь", exact: true })).toBeVisible();
  await expect(right).toContainText("Создаём индивидуальные маршруты, помогаем организовывать путешествия и собираем небольшие компании для совместных поездок");
  const products = [
    ["Travel Design", "Индивидуальный маршрут", "5 000 ₽"],
    ["Travel Ready", "Подготовка и организация поездки", "10 000 ₽"],
    ["TC Trips", "Авторские групповые путешествия", "По согласованию"],
  ];
  for (const [name, subtitle, price] of products) {
    const row = right.locator('a[href="/formats"]').filter({ has: page.getByRole("heading", { name, exact: true }) });
    await expect(row).toHaveCount(1); await expect(row).toBeVisible();
    await expect(row).toContainText(subtitle); await expect(row).toContainText(price);
  }
  await expect(right).toContainText(/самостоятельно|сам(?:и)? брониру|Бронируете и оплачиваете сами/);
  await expect(right).toContainText(/время|поиск/);
  await expect(right).toContainText(/Travel Design и Travel Ready/);
  await expect(right).toContainText(/транспорт.*проживание.*отдельно/i);
  expect(await right.innerText()).not.toMatch(/24\/7|календар[ья] (?:оплат|платежей)|6–9/);
  await expect(right.getByRole("link", { name: /Обсудить поездку/ })).toHaveAttribute("href", "/start");
  await expect(right.getByRole("link", { name: /Подробнее о форматах/ })).toHaveAttribute("href", "/formats");
});

test("About gives both founders equal roles, honest replaceable portraits and a factual shared origin", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_12?spread=2");
  const left = page.locator(`${pages}[data-magazine-page="left"]`), right = page.locator(`${pages}[data-magazine-page="right"]`);
  await expect(left.getByRole("heading", { name: "Василиса", exact: true })).toBeVisible();
  await expect(right.getByRole("heading", { name: "Рамиль", exact: true })).toBeVisible();
  for (const leaf of [left, right]) await expect(leaf).toContainText("Сооснователь Travel Club");
  await expect(left).toContainText(/Сопровождение\s*и люди/);
  await expect(right).toContainText(/Системы\s*и организация/);
  await expect(left).toContainText("Фото Василисы"); await expect(right).toContainText("Фото Рамиля");
  await expect(page.locator(`${pages} img`)).toHaveCount(0);
  const text = await page.locator("[data-magazine-book]").innerText();
  expect(text).toMatch(/друз/); expect(text).toMatch(/маршрут/); expect(text).toMatch(/организац/);
  expect(text).toMatch(/самостоятельн/i); expect(text).toMatch(/индивидуальн/i); expect(text).toMatch(/группов/i);
  expect(text).toMatch(/равноправн|вместе.*решени/);
  expect(text).not.toMatch(/квалифицированн|лучший сопровождающий|штат|\d+%|201\d|202\d/);
});

for (const key of ["Enter", "Space"]) test(`ready WebGL cover has a visible cue and opens by ${key}`, async ({ page }) => {
  await page.goto("/test_12");
  const root = page.getByTestId("magazine-experience"), scene = page.getByTestId("magazine-intro-scene");
  await expect(scene).toHaveAttribute("data-ready", "true", { timeout: 20000 });
  const open = page.getByRole("button", { name: "Открыть журнал", exact: true });
  await expect(open.locator("span").first()).toBeVisible();
  await expect(open).toHaveCSS("cursor", "pointer");
  await page.waitForTimeout(2200);
  const frames = await scene.getAttribute("data-frames");
  await page.waitForTimeout(200); await expect(scene).toHaveAttribute("data-frames", frames!);
  await open.focus(); await expect(open).toBeFocused();
  await page.keyboard.press(key);
  await expect(root).toHaveAttribute("data-intro-waiting", "false");
  await expect(open).toBeHidden();
  await expect(root).toHaveAttribute("data-stage", "reading", { timeout: 18000 });
  await expect(root).toHaveAttribute("data-intro-result", "target");
  await landed(page, 1);
  await expect(page.locator("canvas,[data-magazine-intro]")).toHaveCount(0);
});

test("pointer activation supports skip and reduced-motion cover remains static", async ({ page }) => {
  await page.goto("/test_12");
  await page.getByRole("button", { name: "Открыть журнал", exact: true }).click({ position: { x: 20, y: 20 } });
  await page.getByRole("button", { name: "Пропустить вступление ↗" }).click();
  await landed(page, 1); await expect(page.locator("[data-magazine-book]")).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_12");
  await expect(page.getByRole("button", { name: "Открыть журнал", exact: true }).locator("span").first()).toBeVisible();
  expect(await page.getByTestId("magazine-experience").evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === "running").length)).toBe(0);
  await page.getByRole("button", { name: "Открыть журнал", exact: true }).focus();
  await page.keyboard.press("Space"); await landed(page, 1);
  await chapter(page, 2).click(); await landed(page, 2);
  await expect(page.locator("canvas,[data-reading-turn]")).toHaveCount(0);
});

test("real GPU turn integrates the inserted About spread, locks repeat input and settles both directions", async ({ page }, testInfo) => {
  await page.goto("/test_12?spread=1"); await page.waitForTimeout(3300);
  const root = page.getByTestId("magazine-experience");
  const time = new Date("2026-10-20T09:00:00Z");
  await page.clock.install({ time }); await page.clock.pauseAt(new Date(time.getTime() + 1000));
  for (const direction of ["ArrowRight", "ArrowLeft"]) {
    await page.keyboard.press(direction);
    const scene = page.locator('[data-reading-turn="webgl"]'); await expect(scene).toBeVisible();
    await page.clock.runFor(420);
    const geometry = JSON.parse((await scene.getAttribute("data-geometry"))!);
    expect(geometry.curvature).toBeGreaterThan(.1); expect(geometry.spineError).toBeLessThan(.001);
    const pixels = JSON.parse((await scene.getAttribute("data-texture-colors"))!); expect(pixels.front).not.toEqual(pixels.back);
    await testInfo.attach(`test12-curved-${direction}`, { body: await page.screenshot(), contentType: "image/png" });
    await page.keyboard.press(direction); await expect(root).toHaveAttribute("data-spread", direction === "ArrowRight" ? "2" : "1");
    await page.clock.runFor(650);
    await page.locator(`${pages} img`).evaluateAll(images => Promise.all(images.map(image => (image as HTMLImageElement).decode())));
    await page.clock.runFor(100); await landed(page, direction === "ArrowRight" ? 2 : 1);
    await expect(page.locator("canvas,[data-reading-turn]")).toHaveCount(0);
    const landing = JSON.parse((await root.getAttribute("data-reading-endpoint"))!);
    expect(landing.error).toBeLessThan(1); expect(landing.curvature).toBeLessThan(.001);
    await page.clock.runFor(3300);
  }
});

test("Back interrupts an active turn and leaves keyboard navigation usable", async ({ page }) => {
  await page.goto("/test_12?spread=2&source=interrupt");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-turning", "true");
  await page.goBack(); await landed(page, 2);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.keyboard.press("ArrowRight"); await landed(page, 3);
  await expect(page.getByRole("link", { name: /Хочу поехать с вами/ })).toHaveAttribute("href", "/start?format=group");
});

test("protected motion and capture engines remain byte-identical to TEST_11", () => {
  for (const filename of ["intro-scene.ts", "magazine-intro.tsx", "capture-page.ts", "reading-turn.tsx", "reading-turn-engine.ts"]) {
    const read = (version: string) => readFileSync(resolve("src/components", version, filename));
    expect(read("test_12").equals(read("test_11")), filename).toBe(true);
  }
});

test("small screens retain the existing ordinary-site fallback", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/test_12");
  await expect(page.getByRole("heading", { name: "Журнал для большого экрана." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Открыть обычную версию ↗" })).toHaveAttribute("href", "/test_8");
  await expect(page.locator("canvas")).toHaveCount(0);
});
