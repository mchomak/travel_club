import { chromium } from "../../../frontend/node_modules/@playwright/test/index.mjs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const directory = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
for (const width of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("http://127.0.0.1:3001/test_4#start");
  const frame = page.locator('[data-photo-slot="hero-ferry"]');
  await frame.locator("img").click({ button: "right" });
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("menuitem", { name: "Заменить фото", exact: true }).click();
  await (await chooser).setFiles(path.resolve(directory, "../../../frontend/public/test/hero-table.jpg"));
  const dialog = page.getByRole("dialog", { name: "Кадрирование фото" });
  await dialog.getByRole("button", { name: "Сохранить фото", exact: true }).waitFor();
  await page.screenshot({ path: path.join(directory, `editor-${width}.png`) });
  const crop = await dialog.locator(".reactEasyCrop_CropArea").boundingBox();
  console.log(JSON.stringify({ width, dialog: await dialog.boundingBox(), cropRatio: crop.width / crop.height, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), errors }));
  await page.close();
}
await browser.close();
