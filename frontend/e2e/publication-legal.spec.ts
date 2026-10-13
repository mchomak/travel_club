import { expect, test } from "@playwright/test";

for (const width of [390, 320]) {
  for (const path of ["/privacy", "/personal-data"]) {
    test(`document title keeps complete words at ${width}: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const brokenWords = await page.getByRole("heading", { level: 1 }).evaluate(heading => {
        const broken: string[] = [];
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          for (const match of node.textContent!.matchAll(/\S+/gu)) {
            const range = document.createRange();
            range.setStart(node, match.index!);
            range.setEnd(node, match.index! + match[0].length);
            if (range.getClientRects().length > 1) broken.push(match[0]);
          }
        }
        return broken;
      });
      expect(brokenWords).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });
  }
}
