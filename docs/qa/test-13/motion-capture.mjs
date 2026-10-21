import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const require = createRequire(resolve('frontend/package.json'));
const { chromium, expect } = require('@playwright/test');
const origin = process.env.TEST13_ORIGIN || 'http://localhost:3114';
const out = resolve('docs/qa/test-13/motion-final');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const results = { time: new Date().toISOString(), origin, pairs: [], effects: [], errors: [] };
const pages = '[data-magazine-book] > [data-magazine-page]';
function monitor(page) {
  page.on('pageerror', error => results.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') results.errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) results.errors.push(`${response.status()} ${response.url()}`); });
}
async function decoded(page) {
  await expect(page.locator(`${pages}[data-reveal="enter"]`)).toHaveCount(2);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll('[data-magazine-book] img')].map(img => img.decode()));
  });
}
async function snapshot(page) {
  return page.locator(pages).evaluateAll(pages => pages.flatMap(page => [page,...page.querySelectorAll('*')]).map(element => {
    const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
    return { tag: element.tagName, text: element.children.length ? null : element.textContent, href: element.getAttribute('href'), src: element.getAttribute('src'), alt: element.getAttribute('alt'), bounds:[rect.x,rect.y,rect.width,rect.height].map(n=>Math.round(n*1000)/1000), type:[style.fontFamily,style.fontSize,style.lineHeight,style.fontWeight], opacity:style.opacity, transform:style.transform, clip:style.clipPath };
  }));
}
try {
  for (const viewport of [{width:1100,height:700},{width:1280,height:768},{width:1440,height:900},{width:1920,height:1080}]) {
    const context = await browser.newContext({ viewport });
    const control = await context.newPage(), motion = await context.newPage();
    monitor(control); monitor(motion);
    await motion.addInitScript(() => {
      window.qaAnimations = new Set(); window.qaCapture = true;
      document.addEventListener('animationstart', event => {
        if (!window.qaCapture || !event.target.closest('[data-magazine-book] > [data-magazine-page]')) return;
        for (const animation of event.target.getAnimations()) { animation.pause(); window.qaAnimations.add(animation); }
      });
    });
    for (let spread=1;spread<=7;spread++) {
      await Promise.all([control.goto(`${origin}/test_12?spread=${spread}`),motion.goto(`${origin}/test_13?spread=${spread}`)]);
      await Promise.all([decoded(control),decoded(motion)]);
      const stem = `${viewport.width}x${viewport.height}-spread-${spread}`;
      await motion.evaluate(async () => { await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))); });
      await motion.evaluate(() => { for (const animation of document.querySelector('main').getAnimations({subtree:true})) { animation.pause(); window.qaAnimations.add(animation); } });
      if(viewport.width===1440) {
        for(const [name,time] of [['early',0],['mid',420]]) {
          await motion.evaluate(time=>{ for(const animation of window.qaAnimations) animation.currentTime=time; },time);
          await motion.screenshot({path:resolve(out,`${stem}-${name}.png`),style:'nextjs-portal { visibility:hidden; }'});
        }
        results.effects.push({spread, animations:await motion.evaluate(()=>[...window.qaAnimations].map(animation=>({name:animation.animationName,timing:animation.effect.getTiming()})))});
      }
      await motion.evaluate(() => { window.qaCapture=false; for(const animation of window.qaAnimations) animation.cancel(); for(const animation of document.querySelector('main').getAnimations({subtree:true})) animation.cancel(); });
      await control.evaluate(async()=>{ await Promise.all(document.querySelector('main').getAnimations({subtree:true}).map(animation=>animation.finished)); });
      const [a,b]=await Promise.all([snapshot(control),snapshot(motion)]);
      const differences=b.map((value,index)=>JSON.stringify(value)===JSON.stringify(a[index])?null:{index,control:a[index],motion:value}).filter(Boolean);
      writeFileSync(resolve(out,`${stem}-geometry.json`),JSON.stringify(differences,null,2));
      const [imageA,imageB]=await Promise.all([
        control.screenshot({path:resolve(out,`${stem}-test12.png`),style:'nextjs-portal { visibility:hidden; }'}),
        motion.screenshot({path:resolve(out,`${stem}-final.png`),style:'nextjs-portal { visibility:hidden; }'}),
      ]);
      results.pairs.push({viewport,spread,geometryEqual:differences.length===0,pngByteEqual:imageA.equals(imageB),differences:differences.length});
      console.log(`${stem}: geometry ${differences.length} differences; PNG equal=${imageA.equals(imageB)}`);
      writeFileSync(resolve(out,'results.json'),JSON.stringify(results,null,2));
    }
    await context.close();
  }
  assert.deepEqual(results.errors,[]);
  assert.ok(results.pairs.every(pair=>pair.geometryEqual));
  results.pass=true;
} finally {
  writeFileSync(resolve(out,'results.json'),JSON.stringify(results,null,2));
  await browser.close();
}
