import { expect, test } from "@playwright/test";

test("responsive type follows the rendered preview canvas and keeps numeric targets editable", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1400 });
  await page.goto("/design-system");

  const preview = page.getByRole("region", { name: "Live preview" });
  const masthead = preview.getByTestId("display-xl");
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

test("source DISPLAY L and H1 mobile clamps survive at 390px and 320px and stay editable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto("/design-system");

  const preview = page.getByRole("region", { name: "Live preview" });
  const sizeAt = async (testId: string, width: number) => {
    await preview.evaluate((element, canvasWidth) => {
      element.style.width = `${canvasWidth}px`;
      element.style.maxWidth = "none";
    }, width);
    return Number.parseFloat(await preview.getByTestId(testId).evaluate((element) => getComputedStyle(element).fontSize));
  };

  expect(await sizeAt("display-xl", 1440)).toBeCloseTo(182.88, 1);
  expect(await sizeAt("display-xl", 768)).toBeCloseTo(97.536, 1);
  expect(await sizeAt("display-xl", 390)).toBeCloseTo(47.58, 1);
  expect(await sizeAt("display-l", 390)).toBeCloseTo(42.12, 1);
  expect(await sizeAt("role-h1", 390)).toBeCloseTo(40.56, 1);
  expect(await sizeAt("display-l", 320)).toBeCloseTo(33.28, 1);
  expect(await sizeAt("role-h1", 320)).toBeCloseTo(35, 1);

  await page.getByText("DISPLAY L", { exact: true }).click();
  await page.getByRole("spinbutton", { name: "DISPLAY L mobile size" }).fill("50");
  expect(await sizeAt("display-l", 390)).toBeCloseTo(50, 1);
  expect(await sizeAt("display-l", 320)).toBeGreaterThan(33.28);

  await page.getByText("H1", { exact: true }).click();
  await page.getByRole("spinbutton", { name: "H1 mobile size" }).fill("48");
  expect(await sizeAt("role-h1", 390)).toBeCloseTo(48, 1);
  expect(await sizeAt("role-h1", 320)).toBeGreaterThan(35);
});

test("mobile canvas uses the real narrow browser width below 360px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/design-system");
  await page.getByRole("button", { name: "Mobile viewport" }).click();

  const preview = page.getByRole("region", { name: "Live preview" });
  const displayLSize = async () => Number.parseFloat(await preview.getByTestId("display-l").evaluate((element) => getComputedStyle(element).fontSize));
  await expect(preview).toHaveCSS("width", "390px");
  expect(await displayLSize()).toBeCloseTo(42.12, 1);

  await page.setViewportSize({ width: 320, height: 900 });
  await expect(preview).toHaveCSS("width", "320px");
  expect(await displayLSize()).toBeCloseTo(33.28, 1);
  await expect(preview.getByTestId("role-h1")).toHaveCSS("font-size", "35px");

  await page.getByText("DISPLAY L", { exact: true }).click();
  await page.getByRole("spinbutton", { name: "DISPLAY L mobile size" }).fill("50");
  expect(await displayLSize()).toBeGreaterThan(33.28);
});
