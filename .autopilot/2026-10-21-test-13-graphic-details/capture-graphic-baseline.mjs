import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(new URL('../../frontend/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const out = new URL('../../docs/qa/test-13/graphic-details/before/', import.meta.url);
await mkdir(out, {recursive:true});
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
const records=[];
for(let i=1;i<=7;i++) {
 await page.goto(`http://localhost:3113/test_13?spread=${i}`);
 await page.locator('[data-magazine-book] > [data-magazine-page]').first().waitFor();
 await page.evaluate(async()=>{await document.fonts.ready; await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
 await page.screenshot({path:new URL(`spread-${i}.png`,out).pathname.replace(/^\/(?=[A-Z]:)/,'')});
 records.push(await page.locator('[data-magazine-book] > [data-magazine-page]').evaluateAll(els=>els.map(e=>({label:e.getAttribute('aria-label'),text:e.textContent,rect:{x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height},links:[...e.querySelectorAll('a')].map(a=>({text:a.textContent,href:a.getAttribute('href')})),images:[...e.querySelectorAll('img')].map(i=>({src:i.getAttribute('src'),alt:i.alt,rect:{x:i.getBoundingClientRect().x,y:i.getBoundingClientRect().y,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height}}))}))));
}
await writeFile(new URL('baseline.json',out),JSON.stringify(records,null,2));
await browser.close();
console.log('7 baseline spreads captured');
