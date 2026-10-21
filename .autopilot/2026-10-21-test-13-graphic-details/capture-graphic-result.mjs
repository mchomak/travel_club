import { createRequire } from 'node:module';
import { mkdir,writeFile,readFile } from 'node:fs/promises';
const require=createRequire(new URL('../../frontend/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const out=new URL('../../docs/qa/test-13/graphic-details/production/',import.meta.url);
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const baseline=JSON.parse(await readFile(new URL('../../docs/qa/test-13/graphic-details/before/baseline.json',import.meta.url),'utf8'));
const report={spreads:[],links:[],errors};
for(const viewport of [{width:1440,height:900},{width:1100,height:700}]){
 await page.setViewportSize(viewport);
 for(let i=1;i<=7;i++){
  await page.goto(`http://localhost:3114/test_13?spread=${i}`);
  await page.locator('[data-magazine-book] > [data-magazine-page]').first().waitFor();
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
  const current=await page.locator('[data-magazine-book] > [data-magazine-page]').evaluateAll(els=>els.map(e=>({label:e.getAttribute('aria-label'),text:e.textContent,rect:{x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height},links:[...e.querySelectorAll('a')].map(a=>({text:a.textContent,href:a.getAttribute('href')})),images:[...e.querySelectorAll('img')].map(i=>({src:i.getAttribute('src'),alt:i.alt,rect:{x:i.getBoundingClientRect().x,y:i.getBoundingClientRect().y,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height}}))})));
  const symbols=await page.locator('[data-magazine-book] svg').evaluateAll(els=>els.map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,hidden:e.getAttribute('aria-hidden'),clipped:(()=>{const r=e.getBoundingClientRect(),p=e.closest('[data-magazine-page]').getBoundingClientRect();return r.left<p.left||r.right>p.right||r.top<p.top||r.bottom>p.bottom})()})));
  report.spreads.push({viewport,spread:i,unchanged:viewport.width===1440?JSON.stringify(current)===JSON.stringify(baseline[i-1]):null,content:current,symbols});
  await page.screenshot({path:new URL(`spread-${i}-${viewport.width}.png`,out).pathname.replace(/^\/(?=[A-Z]:)/,'')});
 }
}
await page.setViewportSize({width:1440,height:900});
for(let i=0;i<3;i++){
 await page.goto('http://localhost:3114/test_13?spread=1');
 const link=page.locator('[data-magazine-book] a').filter({hasText:'Подробнее о формате'}).nth(i);
 await link.focus();
 const style=await link.evaluate(e=>({outline:getComputedStyle(e).outlineStyle,color:getComputedStyle(e).color}));
 await page.keyboard.press('Enter');
 await page.waitForURL('**/formats');
 report.links.push({format:i+1,url:page.url(),focus:style});
}
await writeFile(new URL('report.json',out),JSON.stringify(report,null,2));
await browser.close();
console.log(JSON.stringify({screenshots:14,unchanged1440:report.spreads.filter(r=>r.unchanged===true).length,changed1440:report.spreads.filter(r=>r.unchanged===false).map(r=>r.spread),clipped:report.spreads.flatMap(r=>r.symbols.filter(s=>s.clipped)),links:report.links,errors}));
