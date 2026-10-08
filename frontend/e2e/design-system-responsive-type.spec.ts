import { expect, test } from "@playwright/test";

test("responsive type follows the rendered preview canvas and keeps numeric targets editable", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1400 });
  await page.goto("/design-system");

  const preview = page.getByRole("region", { name: "Live preview" });
  const masthead = preview.getByText("TRAVEL CLUB", { exact: true });
  const fontSizeAt = async (width: number) => {
    await preview.evaluate((element, canvasWidth) => {
      element.style.width = `${canvasWidth}px`;
      element.style.maxWidth = "none";
    }, width);
    return Number.parseFloat(await masthead.evaluate((element) => getComputedStyle(element).fontSize));
  };

  expect(await fontSizeAt(1440)).toBeCloseTo(182.88, 1);
  expect(await fontSizeAt(768)).toBeCloseTo(97.536, 1);
  expect(await fontSizeAt(390)).toBeCloseTo(47.58, 1);

  await page.getByRole("spinbutton", { name: "DISPLAY XL desktop size" }).fill("160");
  expect(await fontSizeAt(1440)).toBeCloseTo(160, 1);
  expect(await fontSizeAt(768)).toBeCloseTo(97.536, 1);

  await page.getByRole("spinbutton", { name: "DISPLAY XL mobile size" }).fill("50");
  expect(await fontSizeAt(390)).toBeCloseTo(50, 1);
});
