import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const require = createRequire(resolve('frontend/package.json'));
const { chromium, expect } = require('@playwright/test');
const origin = process.env.TEST13_ORIGIN || 'http://localhost:3113';
const out = resolve('docs/qa/test-13/copy-baseline');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const results = { time: new Date().toISOString(), origin, pairs: [], behavior: [], errors: [] };
const pagesSelector = '[data-magazine-book] > [data-magazine-page]';
async function settled(page, spread) {
  const root = page.getByTestId('magazine-experience');
  await expect(root).toHaveAttribute('data-stage', 'reading');
  await expect(root).toHaveAttribute('data-spread', String(spread));
  await expect(root).toHaveAttribute('data-turning', 'false', { timeout: 20000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll('[data-magazine-book] > [data-magazine-page] img')].map(img => img.decode()));
    await Promise.all(document.querySelector('main').getAnimations({ subtree: true }).map(animation => animation.finished));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}
async function snapshot(page) {
  return page.evaluate(() => {
    const selectors = '[data-magazine-book], [data-magazine-book] > [data-magazine-page] *, nav, nav *';
    const round = value => Math.round(value * 1000) / 1000;
    return [...document.querySelectorAll(selectors)].map(el => {
      const rect = el.getBoundingClientRect(), style = getComputedStyle(el);
      return {
        tag: el.tagName, text: el.childElementCount ? null : el.textContent,
        href: el.getAttribute('href'), src: el.getAttribute('src'), alt: el.getAttribute('alt'),
        label: el.getAttribute('aria-label'), current: el.getAttribute('aria-current'),
        bounds: [rect.x, rect.y, rect.width, rect.height].map(round),
        type: [style.fontFamily, style.fontSize, style.lineHeight, style.fontWeight],
        paint: [style.color, style.backgroundColor, style.opacity, style.transform, style.clipPath],
      };
    });
  });
}
function monitor(page) {
  page.on('pageerror', error => results.errors.push({ type: 'pageerror', message: error.message }));
  page.on('console', message => { if (message.type() === 'error') results.errors.push({ type: 'console', message: message.text() }); });
  page.on('response', response => { if (response.status() >= 400) results.errors.push({ type: 'http', url: response.url(), status: response.status() }); });
  page.on('requestfailed', request => { if (request.failure()?.errorText !== 'net::ERR_ABORTED') results.errors.push({ type: 'requestfailed', url: request.url(), error: request.failure()?.errorText }); });
}
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1100, height: 700 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'no-preference' });
    const control = await context.newPage(), copy = await context.newPage();
    monitor(control); monitor(copy);
    for (let spread = 1; spread <= 7; spread++) {
      await Promise.all([control.goto(`${origin}/test_12?spread=${spread}`), copy.goto(`${origin}/test_13?spread=${spread}`)]);
      await Promise.all([settled(control, spread), settled(copy, spread)]);
      const [a, b] = await Promise.all([snapshot(control), snapshot(copy)]);
      assert.deepEqual(b, a, `DOM/content/href/image/geometry parity ${viewport.width} spread ${spread}`);
      const stem = `${viewport.width}x${viewport.height}-spread-${spread}`;
      writeFileSync(resolve(out, `${stem}-dom.json`), JSON.stringify(a, null, 2));
      const [imageA, imageB] = await Promise.all([
        control.screenshot({ path: resolve(out, `${stem}-test12.png`), style: 'nextjs-portal { visibility:hidden; }' }),
        copy.screenshot({ path: resolve(out, `${stem}-test13.png`), style: 'nextjs-portal { visibility:hidden; }' }),
      ]);
      results.pairs.push({ viewport, spread, elements: a.length, domEqual: true, pngByteEqual: imageA.equals(imageB) });
      console.log(`PAIR ${stem}: DOM PASS; PNG bytes ${imageA.equals(imageB) ? 'equal' : 'differ (pixel check required)'}`);
      writeFileSync(resolve(out, 'results.json'), JSON.stringify(results, null, 2));
    }
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage(); monitor(page);
  await page.goto(`${origin}/test_13`);
  await expect(page.getByTestId('magazine-intro-scene')).toHaveAttribute('data-ready', 'true', { timeout: 30000 });
  await page.screenshot({ path: resolve(out, 'opening-cover.png'), style: 'nextjs-portal { visibility:hidden; }' });
  await page.getByRole('button', { name: 'Открыть журнал', exact: true }).focus();
  await page.keyboard.press('Enter');
  await settled(page, 1);
  await expect(page.getByTestId('magazine-experience')).toHaveAttribute('data-intro-result', 'target');
  await expect(page.locator('[data-magazine-book]')).toBeFocused();
  results.behavior.push('WebGL intro ready → Enter → target reading chapter1 + book focus');
  for (const [key, spread] of [['ArrowRight', 2], ['ArrowLeft', 1]]) {
    await page.keyboard.press(key);
    await expect(page.locator('[data-reading-turn="webgl"]')).toBeVisible({ timeout: 15000 });
    await settled(page, spread);
    await expect(page.locator('canvas,[data-reading-turn]')).toHaveCount(0);
    const endpoint = await page.getByTestId('magazine-experience').getAttribute('data-reading-endpoint');
    assert.ok(JSON.parse(endpoint).error < 1);
    results.behavior.push(`${key} → chapter${spread}: GPU turn, handoff endpoint error<1, canvas cleanup`);
  }
  await page.goBack(); await settled(page, 2);
  await page.goForward(); await settled(page, 1);
  results.behavior.push('Back→2 / Forward→1');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${origin}/test_13?spread=2&spread=3&source=copy&tag=a&tag=b`);
  await settled(page, 1);
  const url = new URL(page.url());
  assert.deepEqual(url.searchParams.getAll('spread'), ['1']);
  assert.equal(url.searchParams.get('source'), 'copy');
  assert.deepEqual(url.searchParams.getAll('tag'), ['a', 'b']);
  results.behavior.push('Repeated spread normalizes to1; unrelated query preserved');
  await page.setViewportSize({ width: 1099, height: 700 });
  await expect(page.getByRole('heading', { name: 'Журнал для большого экрана.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Открыть обычную версию ↗' })).toHaveAttribute('href', '/test_8');
  results.behavior.push('1099x700 original fallback + /test_8 link');
  await context.close();
  assert.deepEqual(results.errors, [], 'No browser console/page/HTTP/request errors');
  results.pass = true;
} catch (error) {
  results.pass = false; results.failure = error.stack; throw error;
} finally {
  writeFileSync(resolve(out, 'results.json'), JSON.stringify(results, null, 2));
  await browser.close();
}
