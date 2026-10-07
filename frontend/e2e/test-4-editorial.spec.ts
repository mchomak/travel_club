import { test, expect } from "@playwright/test";

test("field notes tell past journeys in order and separate the future issue", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_4");
  await expect(page.getByRole("heading", { name: "Сначала мы просто ездили сами." })).toBeVisible();
  const sections = ["story", "field-notes", "field-thailand", "field-china", "from-the-archive", "next-issue", "point-of-view", "club"];
  const positions = await Promise.all(sections.map((id) => page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().top + window.scrollY)));
  expect(positions).toEqual([...positions].sort((a, b) => a - b));
  await expect(page.locator("#memory")).toHaveCount(0);
  await expect(page.locator('a[href="#memory"]')).toHaveCount(0);
  await expect(page.locator("#field-thailand")).toContainText("4 PEOPLE");
  await expect(page.locator("#field-china")).toContainText("+ 2 LOCAL FRIENDS IN BEIJING");
  await expect(page.locator("#from-the-archive")).toContainText("BEIJING → SHANGHAI → SUZHOU → SANYA");
  await expect(page.locator("#next-issue")).toContainText("STATUS");
  const heights = await Promise.all(["field-thailand", "field-china"].map((id) => page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().height)));
  expect(heights[0]).toBeGreaterThan(heights[1]);
});

test("Next Issue returns a previously selected itinerary to the group format", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_4");
  await page.locator("#formats").getByRole("link", { name: /Маршрут/ }).click();
  await expect(page.getByRole("radio", { name: "Нужен маршрут", exact: true })).toBeChecked();
  await page.locator("#next-issue").getByRole("link", { name: "Узнать первым" }).click();
  await expect(page).toHaveURL(/#story$/);
  await expect(page.getByRole("radio", { name: "Хочу в группу", exact: true })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Нужен маршрут", exact: true })).not.toBeChecked();
});
