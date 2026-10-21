import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pages = '[data-magazine-book] > [data-magazine-page]';
test.use({ viewport: { width: 1440, height: 900 } });

test("native headings reveal once while service rows arrive as complete groups", async ({ page }) => {
  await page.goto("/test_13?spread=1");
  const title = page.getByRole("heading", { name: "С нами в путь", exact: true });
  await expect(title).toHaveAttribute("data-editorial", "reveal");
  const animation = await title.evaluate(element => element.getAnimations().map(item => ({
    duration: item.effect?.getTiming().duration,
    clips: (item.effect as KeyframeEffect).getKeyframes().map(frame => frame.clipPath),
  })));
  expect(animation).toEqual(expect.arrayContaining([expect.objectContaining({ duration: 1000 })]));
  expect(animation.some(item => item.clips.some(clip => typeof clip === "string" && clip.includes("100%")))).toBe(true);
  await expect(page.locator(`${pages} a[data-editorial="cascade"]`)).toHaveCount(4);
});

test("all seven chapters have bounded text motion and unchanged photo ancestors", async ({ page }) => {
  for (let spread = 1; spread <= 7; spread++) {
    await page.goto(`/test_13?spread=${spread}`);
    await expect(page.locator(`${pages}[data-reveal="enter"]`)).toHaveCount(2);
    const report = await page.locator(pages).evaluateAll(elements => {
      const all = elements.flatMap(element => [element, ...element.querySelectorAll("*")]);
      const headings = all.filter(element => element.getAttribute("data-editorial") === "reveal");
      const cascades = all.filter(element => element.getAttribute("data-editorial") === "cascade");
      return {
        headings: headings.length,
        cascade: cascades.length,
        photoAncestors: all.filter(element => element.hasAttribute("data-editorial") && element.querySelector("img")).length,
        durations: cascades.map(element => {
          const style = getComputedStyle(element);
          return (parseFloat(style.animationDuration) + parseFloat(style.animationDelay)) * 1000;
        }),
        finalClips: headings.map(element => getComputedStyle(element).clipPath),
      };
    });
    expect(report.headings).toBeGreaterThan(0);
    expect(report.cascade).toBeGreaterThan(2);
    expect(report.photoAncestors).toBe(0);
    expect(Math.max(...report.durations)).toBeLessThanOrEqual(2200);
    expect(Math.max(...report.durations)).toBeGreaterThanOrEqual(1500);
    await page.evaluate(async () => {
      await Promise.all(document.querySelector("main")!.getAnimations({ subtree: true }).map(animation => animation.finished));
    });
    for (const heading of await page.locator(`${pages} [data-editorial="reveal"]`).all()) {
      await expect(heading).toHaveCSS("clip-path", "none");
      await expect(heading).toHaveCSS("opacity", "1");
    }
  }
});

test("new effects wait for handoff, replay on revisit and stay finished on resize/hover", async ({ page }) => {
  await page.goto("/test_13?spread=1");
  await page.evaluate(() => {
    (window as unknown as { motionEvents: { name: string; turning: string | null }[] }).motionEvents = [];
    (window as unknown as { turnSamples: { pending: number; entering: number; chapter: string }[] }).turnSamples = [];
    new MutationObserver(() => {
      const root = document.querySelector("main")!;
      if (root.getAttribute("data-turning") !== "true") return;
      (window as unknown as { turnSamples: unknown[] }).turnSamples.push({
        pending: root.querySelectorAll('[data-magazine-book] > [data-magazine-page][data-reveal="pending"]').length,
        entering: root.querySelectorAll('[data-magazine-book] > [data-magazine-page][data-reveal="enter"]').length,
        chapter: root.querySelector('[aria-current="page"]')?.textContent ?? "",
      });
    }).observe(document.querySelector("main")!, { attributes: true, childList: true, subtree: true, attributeFilter: ["data-turning", "data-reveal", "aria-current"] });
    document.addEventListener("animationstart", event => {
      if (event.animationName.includes("editorial")) (window as unknown as { motionEvents: unknown[] }).motionEvents.push({ name: event.animationName, turning: document.querySelector("main")!.getAttribute("data-turning") });
    });
  });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-turning", "false", { timeout: 20000 });
  const turnSamples = await page.evaluate(() => (window as unknown as { turnSamples: { pending: number; entering: number; chapter: string }[] }).turnSamples);
  expect(turnSamples.some(sample => sample.pending === 1 && sample.chapter.includes("Услуги"))).toBe(true);
  expect(turnSamples.every(sample => sample.entering === 0)).toBe(true);
  expect(turnSamples.filter(sample => sample.pending === 2).every(sample => sample.chapter.includes("О нас"))).toBe(true);
  await page.waitForTimeout(2100);
  const events = () => page.evaluate(() => (window as unknown as { motionEvents: { name: string; turning: string }[] }).motionEvents);
  const first = await events();
  expect(first.some(event => event.name.includes("editorialReveal"))).toBe(true);
  expect(first.every(event => event.turning === "false")).toBe(true);
  await page.setViewportSize({ width: 1450, height: 900 });
  await page.getByRole("navigation").hover();
  await page.waitForTimeout(400);
  expect(await events()).toEqual(first);
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-turning", "false", { timeout: 20000 });
  await page.waitForTimeout(2100);
  expect((await events()).length).toBeGreaterThan(first.length);
  await expect(page.locator("canvas,[data-reading-turn]")).toHaveCount(0);
});

test("reduced preference interrupts motion and CSS disabled remains readable", async ({ page }) => {
  await page.goto("/test_13?spread=7");
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (let spread = 1; spread <= 7; spread++) {
    await page.goto(`/test_13?spread=${spread}`);
    const state = await page.locator(`${pages} [data-editorial]`).evaluateAll(elements => elements.map(element => {
      const style = getComputedStyle(element);
      return [style.animationName, style.opacity, style.transform, style.clipPath];
    }));
    expect(state.every(values => values.join() === "none,1,none,none")).toBe(true);
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addStyleTag({ content: '[data-magazine-page] *, [data-magazine-page] *::after { animation:none !important; }' });
  await expect(page.getByRole("heading", { name: /Начнём/ })).toHaveCSS("clip-path", "none");
  await expect(page.locator(`${pages} [data-editorial="cascade"]`).first()).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByTestId("magazine-experience")).toHaveAttribute("data-turning", "false");
  await expect(page.locator("canvas,[data-reading-turn]")).toHaveCount(0);
});

test("local capture/intro/turn engines and every photo rule remain source-identical", () => {
  const local = (version: number, name: string) => readFileSync(resolve(`src/components/test_${version}/${name}`), "utf8");
  for (const file of ["intro-scene.ts", "magazine-intro.tsx", "capture-page.ts", "reading-turn.tsx", "reading-turn-engine.ts", "data.ts"]) {
    expect(local(13, file)).toBe(local(12, file));
  }
  const source = local(12, "spreads.module.css"), copy = local(13, "spreads.module.css");
  const photoNames = /heroPhotoReveal|nextAperture|thaiStrips|peopleFigure|cityFigure|chinaVertical|chinaDetail|contactSheet|data-beat|@keyframes (?:photoSweep|irisEnter|lettersEnter|stripEnter|urbanEnter|contactEnter)/;
  for (const line of source.split("\n").filter(line => photoNames.test(line))) expect(copy.split("\n")).toContain(line);
});

test("one measured underline follows the shown chapter, with keyboard and focus intact", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/test_13?spread=1");
  const indicator = page.locator('[data-nav-indicator]');
  await expect(indicator).toHaveCount(1);
  const active = () => page.getByRole("navigation").locator('[aria-current="page"]');
  async function aligned() {
    const line = await indicator.boundingBox(), item = await active().boundingBox();
    expect(line && item).toBeTruthy();
    expect(Math.abs(line!.x - item!.x - 8)).toBeLessThan(1);
    expect(Math.abs(line!.width - item!.width + 16)).toBeLessThan(1);
  }
  await aligned();
  await active().focus();
  await page.keyboard.press("ArrowRight");
  await expect(active()).toContainText("О нас");
  await aligned();
  await expect(page.getByRole("navigation").getByRole("button", { name: "01 Услуги" })).toBeFocused();
});

test("unsupported sizes and touch preserve the original readable fallback and navigation", async ({ browser }) => {
  for (const viewport of [{width:1099,height:900},{width:1440,height:699},{width:390,height:844},{width:320,height:720}]) {
    const page = await browser.newPage({ viewport });
    await page.goto("/test_13?spread=1");
    await expect(page.getByRole("heading", { name:"Журнал для большого экрана." })).toBeVisible();
    await expect(page.getByRole("link", { name:"Открыть обычную версию ↗" })).toHaveAttribute("href","/test_8");
    await page.close();
  }
  const touch = await browser.newPage({ viewport:{width:1280,height:800}, hasTouch:true, reducedMotion:"reduce" });
  await touch.goto("/test_13?spread=1");
  await touch.getByRole("button", {name:"Next",exact:true}).tap();
  await expect(touch.getByTestId("magazine-experience")).toHaveAttribute("data-spread","2");
  await expect(touch.getByRole("heading", {name:"Василиса",exact:true})).toHaveCSS("clip-path","none");
  await touch.close();
  const noJS = await browser.newPage({ viewport:{width:1440,height:900}, javaScriptEnabled:false });
  await noJS.goto("/test_13");
  await expect(noJS.locator("noscript p")).toContainText("JavaScript");
  await expect(noJS.locator('noscript a')).toHaveAttribute("href","/test_8");
  await noJS.close();
});

test("CTA underline visibly moves in its reserved border without shifting the link", async ({ page }) => {
  await page.goto("/test_13?spread=1");
  const link = page.getByRole("link", {name:"Подробнее о форматах",exact:true});
  await page.waitForTimeout(2100);
  // The original print underline must be fully visible before any interaction.
  expect(await link.evaluate(element => {
    const line = getComputedStyle(element,"::before");
    return {transform:line.transform,height:line.height,color:line.backgroundColor};
  })).toEqual({transform:"matrix(1, 0, 0, 1, 0, 0)",height:"1px",color:await link.evaluate(element => getComputedStyle(element).color)});
  const box = (await link.boundingBox())!;
  const clip = {x:box.x,y:box.y+box.height-4,width:box.width,height:6};
  const before = await page.screenshot({clip});
  await link.hover();
  await page.waitForTimeout(230);
  const after = await page.screenshot({clip});
  expect(after.equals(before)).toBe(false);
  expect(await link.boundingBox()).toEqual(box);
  expect(await link.evaluate(element => getComputedStyle(element,"::before").transform)).toBe("matrix(1, 0, 0, 1, 0, -2)");
  await page.emulateMedia({reducedMotion:"reduce"});
  expect(await link.evaluate(element => getComputedStyle(element,"::before").transitionDuration)).toBe("0s");
  expect(await link.evaluate(element => getComputedStyle(element,"::before").transform)).toBe("none");
});
