import { expect, test, type Page } from "@playwright/test";

async function imageFile(page: Page) {
  const data = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 7200;
    canvas.height = 3600;
    const context = canvas.getContext("2d")!;
    for (const [index, color] of ["#ef2222", "#22bb44", "#2244ef"].entries()) {
      context.fillStyle = color;
      context.fillRect(index * 2400, 0, 2400, 3600);
    }
    return canvas.toDataURL("image/png").split(",")[1];
  });
  return { name: "wide-photo.png", mimeType: "image/png", buffer: Buffer.from(data, "base64") };
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
test(`wide photo crops into a portrait frame and persists until reset at ${viewport.width}px`, async ({ page }) => {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_5#start");
  const photo = page.locator('[data-photo-slot="hero-ferry"] img');
  const stock = await photo.getAttribute("src");
  const before = await photo.boundingBox();
  await photo.click({ button: "right" });
  const menu = page.getByRole("menu", { name: "Фотография" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Вернуть исходное фото" })).toBeDisabled();
  const picker = page.waitForEvent("filechooser");
  await menu.getByRole("menuitem", { name: "Заменить фото", exact: true }).click();
  await (await picker).setFiles(await imageFile(page));
  const dialog = page.getByRole("dialog", { name: "Кадрирование фото" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Сохранить фото", exact: true })).toBeEnabled();
  const crop = dialog.locator(".reactEasyCrop_CropArea");
  const ratio = await photo.locator("..").getAttribute("data-photo-ratio");
  const cropBox = (await crop.boundingBox())!;
  expect(cropBox.width / cropBox.height).toBeCloseTo(Number(ratio), 2);
  expect(Number(ratio)).toBe(.8);
  const bounds = (await dialog.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
  const source = dialog.locator("img");
  const transform = await source.evaluate(e => getComputedStyle(e).transform);
  await dialog.getByRole("button", { name: "Увеличить" }).click();
  await dialog.getByRole("button", { name: "Увеличить" }).click();
  const zoomedSource = (await source.boundingBox())!;
  await page.mouse.move(cropBox.x + cropBox.width / 2, cropBox.y + cropBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(cropBox.x + cropBox.width / 2 + zoomedSource.width * .28, cropBox.y + cropBox.height / 2 + 25, { steps: 8 });
  await page.mouse.up();
  expect(await source.evaluate(e => getComputedStyle(e).transform)).not.toBe(transform);
  const visibleSource = (await source.boundingBox())!;
  const visibleCrop = (await crop.boundingBox())!;
  const centreBand = Math.floor((visibleCrop.x + visibleCrop.width / 2 - visibleSource.x) / visibleSource.width * 3);
  // A centred crop would be green; drag must move the preview centre into the red band.
  expect(centreBand).toBe(0);
  const expectedColour = [[239, 34, 34], [34, 187, 68], [34, 68, 239]][centreBand];
  await dialog.getByRole("button", { name: "Сохранить фото", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(photo).toHaveAttribute("src", /^blob:/);
  await expect.poll(() => photo.evaluate(e => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0)).toBe(true);
  const after = (await photo.boundingBox())!;
  expect(after.width).toBeCloseTo(before!.width, 1);
  expect(after.height).toBeCloseTo(before!.height, 1);
  const output = await photo.evaluate(e => ({ width: (e as HTMLImageElement).naturalWidth, height: (e as HTMLImageElement).naturalHeight }));
  expect(Math.max(output.width, output.height)).toBeLessThanOrEqual(2400);
  expect(output.width / output.height).toBeCloseTo(Number(ratio), 2);
  const pixels = await photo.evaluate(e => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    canvas.getContext("2d")!.drawImage(e as HTMLImageElement, (e as HTMLImageElement).naturalWidth / 2, (e as HTMLImageElement).naturalHeight / 2, 1, 1, 0, 0, 1, 1);
    return [...canvas.getContext("2d")!.getImageData(0, 0, 1, 1).data];
  });
  // Compare export with the visible preview against independently known fixture colours.
  for (const channel of [0, 1, 2]) expect(Math.abs(pixels[channel] - expectedColour[channel])).toBeLessThan(15);
  await page.reload();
  await expect(photo).toHaveAttribute("src", /^blob:/);
  await photo.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Вернуть исходное фото" }).click();
  await expect(photo).toHaveAttribute("src", stock!);
  await page.reload();
  await expect(photo).toHaveAttribute("src", stock!);
});
}

test("cancel, Escape and rejected files keep the original photo and release previews", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_5#start");
  const frame = page.locator('[data-photo-slot="hero-table"]');
  const photo = frame.locator("img");
  const stock = await photo.getAttribute("src");
  const file = await imageFile(page);
  for (const action of ["Отмена", "Escape"]) {
    await frame.getByRole("button").focus();
    await page.keyboard.press("Enter");
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("menuitem", { name: "Заменить фото", exact: true }).click();
    await (await chooser).setFiles(file);
    const dialog = page.getByRole("dialog", { name: "Кадрирование фото" });
    await expect(dialog).toBeVisible();
    const preview = await dialog.locator("img").getAttribute("src");
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate(e => e.contains(document.activeElement))).toBe(true);
    if (action === "Escape") await page.keyboard.press("Escape");
    else await dialog.getByRole("button", { name: "Отмена", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(photo).toHaveAttribute("src", stock!);
    await expect(frame.getByRole("button")).toBeFocused();
    expect(await page.evaluate(async url => { try { await fetch(url!); return true; } catch { return false; } }, preview)).toBe(false);
  }
  for (const rejected of [
    { name: "bad.gif", mimeType: "image/gif", buffer: Buffer.from("not supported") },
    { name: "broken.jpg", mimeType: "image/jpeg", buffer: Buffer.from("not a photograph") },
  ]) {
    await photo.click({ button: "right" });
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("menuitem", { name: "Заменить фото", exact: true }).click();
    await (await chooser).setFiles(rejected);
    await expect(page.getByRole("alert").filter({ has: page.getByRole("button", { name: "Закрыть сообщение" }) })).toBeVisible();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(photo).toHaveAttribute("src", stock!);
    await page.getByRole("button", { name: "Закрыть сообщение" }).click();
  }
  const prevented = await page.getByRole("heading", { level: 1 }).evaluate(e => {
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    e.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(prevented).toBe(false);
  await expect(page.getByRole("menu")).not.toBeVisible();
  await photo.click({ button: "right" });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).not.toBeVisible();
});

test("quota failure keeps the crop editor and old photo until a successful retry", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_5#start");
  const photo = page.locator('[data-photo-slot="hero-table"] img');
  const stock = await photo.getAttribute("src");
  await photo.click({ button: "right" });
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("menuitem", { name: "Заменить фото", exact: true }).click();
  await (await chooser).setFiles(await imageFile(page));
  const dialog = page.getByRole("dialog", { name: "Кадрирование фото" });
  await expect(dialog.getByRole("button", { name: "Сохранить фото", exact: true })).toBeEnabled();
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    Object.defineProperty(window, "restorePhotoWrite", { configurable: true, value: () => { IDBObjectStore.prototype.put = original; } });
    IDBObjectStore.prototype.put = () => { throw new DOMException("Quota exhausted", "QuotaExceededError"); };
  });
  await dialog.getByRole("button", { name: "Сохранить фото", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Фото не сохранено");
  await expect(photo).toHaveAttribute("src", stock!);
  await expect(dialog).toBeVisible();
  await page.evaluate(() => (window as unknown as { restorePhotoWrite: () => void }).restorePhotoWrite());
  await dialog.getByRole("button", { name: "Сохранить фото", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(photo).toHaveAttribute("src", /^blob:/);
  await page.reload();
  await expect(photo).toHaveAttribute("src", /^blob:/);
});
