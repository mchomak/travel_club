import { expect, test } from "@playwright/test";

test("destination aperture is masked before the turn exposes it and opens continuously", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/test_11?spread=1");
  await expect(page.locator('[data-magazine-book] > [data-magazine-page]').first()).toHaveAttribute("data-reveal", "enter");
  await page.evaluate(() => {
    const samples: { time: number; clip: string; phase: string | null }[] = [];
    Object.assign(window, { revealSamples: samples });
    const start = performance.now();
    function sample() {
      const aperture = document.querySelector('[data-magazine-book] [data-reveal-object="next-aperture"]');
      if (aperture) samples.push({ time: performance.now() - start, clip: getComputedStyle(aperture).clipPath, phase: aperture.closest("[data-magazine-page]")!.getAttribute("data-reveal") });
      if (performance.now() - start < 6500) requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-magazine-book] > [data-magazine-page]').first()).toHaveAttribute("data-reveal", "enter");
  await page.waitForTimeout(3300);
  const samples = await page.evaluate(() => (window as unknown as { revealSamples: { time: number; clip: string; phase: string | null }[] }).revealSamples);
  expect(samples.length).toBeGreaterThan(15);
  const radius = (clip: string) => Number(clip.match(/circle\(([\d.]+)%/)?.[1] ?? 100);
  // The old turn printed circle(50%) first, then reset it to circle(0%).
  expect(radius(samples[0].clip)).toBeLessThan(.1);
  const values = samples.map(sample => radius(sample.clip));
  expect(values.some(value => value > 1 && value < 49)).toBe(true);
  expect(values.at(-1)).toBeCloseTo(50, 0);
  expect(values.every((value, index) => index === 0 || value >= values[index - 1] - .1)).toBe(true);
});

test("print, pending, finite entry and reduced motion preserve their visual contract", async ({ page }) => {
  test.setTimeout(45000);
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const spread of [1, 2, 3, 4, 5, 6]) {
    await page.goto(`/test_11?spread=${spread}`);
    const pages = page.locator('[data-magazine-book] > [data-magazine-page]');
    await expect(pages.first()).toHaveAttribute("data-reveal", "enter");
    const setPhase = async (phase: string) => pages.evaluateAll((elements, value) => elements.forEach(element => element.setAttribute("data-reveal", value)), phase);
    const states = () => pages.locator("[data-reveal-object]").evaluateAll(elements => elements.map(element => {
      const style = getComputedStyle(element), clip = style.clipPath;
      return { name: element.getAttribute("data-reveal-object"), opacity: style.opacity,
        clip: /^inset\(0(?:px|%)?\)$/.test(clip) ? "none" : clip, transform: style.transform };
    }));
    await setPhase("static");
    const printed = await states();
    expect(printed.length).toBeGreaterThan(1);
    expect(printed.every(value => Number(value.opacity) > 0)).toBe(true);
    await setPhase("pending");
    const pending = await states();
    expect(pending.some(value => value.opacity === "0" || /100%|circle\(0%/.test(value.clip))).toBe(true);
    expect(await pages.locator("h1,h2,h3").evaluateAll(headings => headings.every(heading => getComputedStyle(heading).opacity === "1"))).toBe(true);
    await setPhase("enter");
    const animations = await pages.evaluateAll(elements => elements.flatMap(element => element.getAnimations({ subtree: true }).map(animation => animation.effect!.getTiming())));
    expect(animations.length).toBeGreaterThan(0);
    expect(animations.every(timing => Number.isFinite(timing.iterations) && (timing.iterations ?? 0) > 0 && Number(timing.duration) > 0)).toBe(true);
    expect(Math.max(...animations.map(timing => Number(timing.delay) + Number(timing.duration)))).toBeGreaterThanOrEqual(2400);
    expect(Math.max(...animations.map(timing => Number(timing.delay) + Number(timing.duration)))).toBeLessThanOrEqual(3200);
    // Zero-time entry is exactly the printed pending pose, including every
    // deferred photo and text group. Re-entering must restart that same pose.
    const freezeAtStart = async () => pages.evaluateAll(elements => elements.forEach(element => element.getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = 0; })));
    await freezeAtStart();
    expect(await states()).toEqual(pending);
    await setPhase("static");
    await setPhase("enter");
    await freezeAtStart();
    expect(await states()).toEqual(pending);
    await pages.evaluateAll(elements => elements.forEach(element => element.getAnimations({ subtree: true }).forEach(animation => animation.play())));
    await page.waitForTimeout(3250);
    expect(await pages.evaluateAll(elements => elements.every(element => element.getAnimations({ subtree: true }).every(animation => animation.playState !== "running")))).toBe(true);
    await setPhase("pending");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect.poll(states).toEqual(printed);
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
});

test("all twelve finished pages fit supported desktops with readable body and exact actions", async ({ page }, testInfo) => {
  for (const viewport of [{ width: 1280, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    for (const spread of [1, 2, 3, 4, 5, 6]) {
      await page.goto(`/test_11?spread=${spread}`);
      const pages = page.locator('[data-magazine-book] > [data-magazine-page]');
      await expect(pages.first()).toHaveAttribute("data-reveal", "enter");
      await pages.evaluateAll(elements => elements.forEach(element => element.setAttribute("data-reveal", "static")));
      await pages.locator("img").evaluateAll(images => Promise.all(images.map(image => (image as HTMLImageElement).decode())));
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      const problems = await pages.evaluateAll(elements => elements.flatMap(element => {
        const page = element.getBoundingClientRect();
        return Array.from(element.querySelectorAll("h1,h2,h3,p,figcaption,a,[class*=runningHead],[class*=folio]"))
          .flatMap(text => {
            const range = document.createRange(); range.selectNodeContents(text);
            const box = range.getBoundingClientRect(), style = getComputedStyle(text);
            const outside = box.left < page.left - 2 || box.right > page.right + 2 || box.top < page.top - 2 || box.bottom > page.bottom + 2;
            return outside || Number.parseFloat(style.fontSize) < 11 ? [text.textContent] : [];
          });
      }));
      expect(problems, `${viewport.width}x${viewport.height} spread ${spread}`).toEqual([]);
      expect(await pages.locator('[class*="heroDescription"],[data-reveal-object="format-details"],[data-reveal-object="next-story"] > p,[data-reveal-object="thai-prose"] > p,[class*="chinaBody"] p,[class*="archiveIntro"]>p,[class*="archiveEntries"] p,[class*="principles"] p,[class*="startLead"],[class*="startProcess"] p').evaluateAll(elements => elements.every(element => Number.parseFloat(getComputedStyle(element).fontSize) >= 14))).toBe(true);
      if (spread === 1) {
        await expect(pages.getByRole("link", { name: /Маршрут — 5 000 ₽/ })).toHaveAttribute("href", "/formats");
        await expect(pages.getByRole("link", { name: /Под ключ — 10 000 ₽/ })).toHaveAttribute("href", "/formats");
      } else if (spread === 2) {
        await expect(pages.getByRole("link", { name: /Хочу поехать с вами/ })).toHaveAttribute("href", "/start?format=group");
        await expect(pages.getByText("Расскажите о своём интересе. Это не бронирование.")).toBeVisible();
      } else if (spread === 3 || spread === 4) {
        await expect(pages.getByRole("link", { name: /К заметкам в архиве/ })).toHaveAttribute("href", "/archive");
        if (spread === 4) await expect(pages.getByText(/Четверо друзей прилетели из Москвы/)).toBeVisible();
      } else if (spread === 5) {
        await expect(pages.getByText("Пекин → Шанхай → Сучжоу → Санья")).toBeVisible();
        await expect(pages.getByRole("link", { name: /Открыть архив/ })).toHaveAttribute("href", "/archive");
      } else {
        await expect(pages.getByRole("link", { name: /Обсудить поездку/ })).toHaveAttribute("href", "/start");
        await expect(pages.getByRole("link", { name: /Сначала сравнить форматы/ })).toHaveAttribute("href", "/formats");
      }
      await page.screenshot({ path: testInfo.outputPath(`${viewport.width}-spread-${spread}.png`) });
    }
  }
});
