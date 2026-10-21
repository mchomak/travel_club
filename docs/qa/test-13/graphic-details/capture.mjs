import { createRequire } from "node:module";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const require = createRequire(path.resolve("frontend/package.json"));
const { chromium } = require("playwright");
const root = path.resolve("docs/qa/test-13/graphic-details");
const browser = await chromium.launch({headless:true});
const reports = [];
const selector = '[data-magazine-book] > [data-magazine-page]';
for (const [width,height] of [[1440,900],[1100,700]]) {
  const page = await browser.newPage({viewport:{width,height},reducedMotion:"reduce"});
  const captures = [];
  const dir = path.join(root,"after",`${width}x${height}`);
  await mkdir(dir,{recursive:true});
  for (let spread=1;spread<=7;spread++) {
    await page.goto(`http://localhost:3113/test_13?spread=${spread}`);
    await page.locator(selector).first().waitFor();
    await page.evaluate(async()=>{await document.fonts.ready; await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
    await page.screenshot({path:path.join(dir,`spread-${spread}.png`)});
    captures.push(await page.locator(selector).evaluateAll(pages=>pages.map(element=>{
      const box=e=>{const {x,y,width,height}=e.getBoundingClientRect();return{x,y,width,height};};
      return{label:element.getAttribute("aria-label"),text:element.textContent,rect:box(element),links:[...element.querySelectorAll("a")].map(a=>({text:a.textContent,href:a.getAttribute("href")})),images:[...element.querySelectorAll("img")].map(i=>({src:i.getAttribute("src"),alt:i.getAttribute("alt"),rect:box(i)})),headings:[...element.querySelectorAll("h1,h2,h3")].map(h=>({text:h.textContent,rect:box(h)})),blocks:[...element.children].filter(c=>!c.querySelector('svg')||c.matches('div,section')).map(c=>({tag:c.tagName,rect:box(c)}))};
    })));
  }
  await writeFile(path.join(dir,"capture.json"),JSON.stringify(captures,null,2));
  if(width===1440){
    const before=JSON.parse(await readFile(path.join(root,"before/baseline.json"),"utf8"));
    const differences=[];
    before.forEach((spread,i)=>spread.forEach((old,j)=>{
      const current=captures[i][j];
      for(const key of ["label","text","rect","links","images"]){if(JSON.stringify(old[key])!==JSON.stringify(current[key]))differences.push({spread:i+1,side:j,key,before:old[key],after:current[key]});}
    }));
    reports.push({viewport:[width,height],differences});
  }
  await page.goto('http://localhost:3113/test_13?spread=1');
  const row=page.locator(`${selector} a[aria-label*="Travel Design"]`);
  const action=row.locator(':scope > span').last();
  const rest=await action.evaluate(e=>({box:e.getBoundingClientRect().toJSON(),color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor,line:getComputedStyle(e,"::before").height}));
  await row.focus();
  const focus=await row.evaluate(e=>({focusVisible:e.matches(':focus-visible'),outline:getComputedStyle(e).outlineWidth,href:e.getAttribute('href')}));
  const afterFocus=await action.evaluate(e=>e.getBoundingClientRect().toJSON());
  reports.push({viewport:[width,height],cta:{rest,focus,boundsStable:JSON.stringify(rest.box)===JSON.stringify(afterFocus)}});
  await page.close();
}
await writeFile(path.join(root,"after/report.json"),JSON.stringify(reports,null,2));
await browser.close();
console.log(JSON.stringify(reports.map(r=>r.differences?{viewport:r.viewport,differences:r.differences.map(d=>({spread:d.spread,side:d.side,key:d.key}))}:r),null,2));
