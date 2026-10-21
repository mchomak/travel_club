import { expect, test, type Page } from "@playwright/test";

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, image => image.decode()));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(animation => animation.playState === "running").length), { timeout: 12000 }).toBe(0);
}

// nextMarginal is a short editorial side note; the universal text walk still enforces its 11 px floor.
const bodySelector = "[class*=heroDescription],[class*=formatsIntro] p,[class*=formatRow] p,[class*=nextLead],[class*=nextStoryBody]>p,[class*=thaiProse] p,[class*=chinaBody] p,[class*=archiveIntro]>p,[class*=archiveEntries] p,[class*=principles] p,[class*=startLead],[class*=startProcess] p";

for (const viewport of [{ width: 1280, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
  test(`all final editorial pages fit and keep text readable at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    test.setTimeout(90000);
    for (let spread = 1; spread <= 6; spread++) {
      await page.goto(`/test_11?spread=${spread}`);
      await settle(page);
      const pages = page.locator("[data-magazine-book] > [data-magazine-page]");
      await expect(pages).toHaveCount(2);
      const problems = await pages.evaluateAll(pages => pages.flatMap(page => {
        const issues: string[] = [], box = page.getBoundingClientRect();
        if (page.scrollWidth > page.clientWidth + 1 || page.scrollHeight > page.clientHeight + 1) issues.push(`${page.getAttribute("aria-label")}: page overflow`);
        const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (!node.textContent?.trim()) continue;
          const parent = node.parentElement!, style = getComputedStyle(parent);
          if (style.display === "none" || style.visibility === "hidden") continue;
          const range = document.createRange(); range.selectNodeContents(node);
          for (const rect of Array.from(range.getClientRects())) {
            if (rect.width && rect.height && (rect.left < box.left - 1 || rect.right > box.right + 1 || rect.top < box.top - 1 || rect.bottom > box.bottom + 1)) issues.push(`Clipped text: ${node.textContent.trim()}`);
          }
          if (parseFloat(style.fontSize) < 11) issues.push(`Small text: ${node.textContent.trim()}`);
        }
        return issues;
      }));
      expect(problems).toEqual([]);
      const smallBody = await pages.locator(bodySelector).evaluateAll(elements => elements.filter(element => parseFloat(getComputedStyle(element).fontSize) < 14).map(element => element.textContent?.trim()));
      expect(smallBody).toEqual([]);
      expect(await page.locator("[data-magazine-book] img").evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
      await expect(page.locator("canvas")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
      for (const link of await pages.getByRole("link").all()) await expect(link).toBeInViewport({ ratio: 1 });
      const contents = page.getByRole("navigation", { name: "Навигация журнала" }).getByRole("button", { name: /^0[1-6]/ });
      await expect(contents).toHaveCount(6);
      for (const button of await contents.all()) await expect(button).toBeInViewport({ ratio: 1 });
    }
  });
}

test("all six chapters reveal on reentry with finite motion and release the animation loop", async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    const original = window.requestAnimationFrame.bind(window);
    let frames = 0;
    window.requestAnimationFrame = callback => original(timestamp => { frames++; callback(timestamp); });
    Object.defineProperty(window, "__qaAnimationFrames", { get: () => frames });
  });
  await page.goto("/test_11?spread=1");
  await settle(page);
  const root = page.getByTestId("magazine-experience");
  const signatures = new Map<number, string>();
  for (const spread of [2, 3, 4, 5, 6, 2, 1]) {
    await page.getByRole("navigation", { name: "Навигация журнала" }).getByRole("button", { name: new RegExp(`^0${spread}`) }).click();
    await expect(root).toHaveAttribute("data-turning", "false", { timeout: 12000 });
    await expect(page.locator("[data-magazine-book] > [data-magazine-page]").first()).toHaveAttribute("data-reveal", "enter");
    const motion = await page.locator("[data-magazine-book] > [data-magazine-page]").evaluateAll(pages => pages.map(page => {
      const animations = page.getAnimations({ subtree: true });
      return {
        running: animations.filter(animation => animation.playState === "running").length,
        finite: animations.every(animation => animation.effect?.getTiming().iterations === 1),
        effects: animations.map(animation => JSON.stringify((animation.effect as KeyframeEffect).getKeyframes().map(frame => ({ transform: frame.transform, clipPath: frame.clipPath, opacity: frame.opacity })))).sort(),
      };
    }));
    expect(motion.every(page => page.running > 0 && page.finite)).toBe(true);
    const signature = JSON.stringify(motion.map(page => page.effects));
    if (signatures.has(spread)) expect(signature).toBe(signatures.get(spread));
    else signatures.set(spread, signature);
    await settle(page);
    await expect(page.locator("[data-magazine-book] > [data-magazine-page]")).toHaveCount(2);
    await expect(page.locator("[data-magazine-book] [aria-hidden=true][inert]")).toHaveCount(0);
  }
  expect(signatures.size).toBe(6);
  expect(new Set(signatures.values()).size).toBeGreaterThanOrEqual(3);
  await expect(page.locator("canvas")).toHaveCount(0);
  const before = await page.evaluate(() => (window as Window & { __qaAnimationFrames?: number }).__qaAnimationFrames);
  expect(typeof before).toBe("number");
  await page.waitForTimeout(750);
  expect(await page.evaluate(() => (window as Window & { __qaAnimationFrames?: number }).__qaAnimationFrames)).toBe(before);
});

test("reduced motion exposes final artwork and all actions without a deferred reveal", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 768 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (let spread = 1; spread <= 6; spread++) {
    await page.goto(`/test_11?spread=${spread}`);
    await settle(page);
    await expect(page.locator("[data-magazine-intro],canvas")).toHaveCount(0);
    const hiddenContent = await page.locator("[data-magazine-book] > [data-magazine-page]").evaluateAll(pages => pages.flatMap(page => Array.from(page.querySelectorAll("h1,h2,h3,p,a,figure,img")).filter(element => {
      for (let ancestor: Element | null = element; ancestor && ancestor !== page; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) return true;
      }
      return false;
    }).map(element => element.textContent?.trim() || element.getAttribute("src"))));
    expect(hiddenContent).toEqual([]);
    for (const link of await page.locator("[data-magazine-book]").getByRole("link").all()) await expect(link).toBeInViewport({ ratio: 1 });
  }
});

test("editorial calls to action reach the existing public pages through real pointer clicks", async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1280, height: 768 });
  const actions = [
    { spread: 1, name: /Обсудить поездку/, destination: "/start" },
    { spread: 1, name: /Подробнее о форматах/, destination: "/formats" },
    { spread: 2, name: /Хочу поехать с вами/, destination: "/start?format=group" },
    { spread: 3, name: /К заметкам в архиве/, destination: "/archive" },
    { spread: 4, name: /К заметкам в архиве/, destination: "/archive" },
    { spread: 5, name: /Открыть архив/, destination: "/archive" },
    { spread: 6, name: /Обсудить поездку/, destination: "/start" },
    { spread: 6, name: /Сначала сравнить форматы/, destination: "/formats" },
  ];
  for (const action of actions) {
    await page.goto(`/test_11?spread=${action.spread}`);
    await settle(page);
    const link = page.getByRole("link", { name: action.name });
    await expect(link).toHaveCount(1);
    await link.click();
    await expect(page).toHaveURL(url => url.pathname + url.search === action.destination);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("six chapters preserve real prices, provenance, travel facts and prototype caveats", async ({ page }) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const expected = [
    [/5\s*000\s*₽/, /10\s*000\s*₽/, /По согласованию/, /Бронируете и оплачиваете всё вы/, /Поставщикам платите вы напрямую/, /6–9 человек/],
    [/первое групповое путешествие Travel Club/i, /даты ещё не объявлены/, /не бронирование/],
    [/Четверо друзей/, /От островов до Бангкока/, /до запуска Travel Club/, /не опубликована/],
    [/Четверо друзей.*из Москвы/s, /В Пекине.*двое местных друзей/s, /Шанхай/, /до запуска Travel Club/, /не опубликована/],
    [/Пекин.*Шанхай.*Сучжоу.*Санья/s, /5 человек/, /Мадагаскар/, /2 человека/, /небольшая компания/i, /не оказанные услуги Travel Club/, /не опубликованы/],
    [/Люди имеют значение/, /Меньше точек.*Больше времени/s, /Вкус.*не роскошь/s, /прототип/, /не отправляются.*не сохраняются/s],
  ];
  for (let spread = 1; spread <= 6; spread++) {
    await page.goto(`/test_11?spread=${spread}`);
    await settle(page);
    const book = page.locator("[data-magazine-book]");
    for (const fact of expected[spread - 1]) await expect(book).toContainText(fact);
    expect(await book.innerText()).not.toMatch(/\?{3,}|\uFFFD/);
    if (spread <= 5) await expect(book).toContainText(/Иллюстративн/i);
    for (const link of await book.getByRole("link").all()) expect(["/start", "/start?format=group", "/formats", "/archive"]).toContain(await link.getAttribute("href"));
  }
});
