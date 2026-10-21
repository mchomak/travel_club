import {createRequire} from "node:module";
import {writeFile} from "node:fs/promises";
import path from "node:path";
const require=createRequire(path.resolve("frontend/package.json"));
const {chromium}=require("playwright");
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1100,height:700},reducedMotion:"reduce"});
const selector='[data-magazine-book] > [data-magazine-page]';
await page.goto('http://localhost:3113/test_13?spread=1');
await page.evaluate(()=>document.fonts.ready);
const bounds=()=>page.locator(selector).evaluateAll(els=>els.map(e=>[...e.querySelectorAll('h1,h2,h3,p,a,img')].map(c=>({tag:c.tagName,text:c.textContent,box:c.getBoundingClientRect().toJSON()}))));
const current=await bounds();
const legacyStyle=await page.addStyleTag({content:'[class*="formatAction"]{border:1px solid currentColor!important;background:#172f50!important;color:#f2f0ea!important}[class*="formatAction"]::before{display:none!important}'});
const legacy=await bounds();

await legacyStyle.evaluate(e=>e.remove());
const report={legacyCtaGeometryUnchanged:JSON.stringify(current)===JSON.stringify(legacy),states:[],hover:null,keyboard:null};
await page.setViewportSize({width:1440,height:900});
await page.emulateMedia({reducedMotion:'no-preference'});
for(const spread of [1,3,4,6,7]){
 await page.goto(`http://localhost:3113/test_13?spread=${spread}`);
 await page.evaluate(()=>document.fonts.ready);
 const states=await page.locator(selector).evaluateAll(els=>{
   const visible=e=>{for(let p=e;p&&!p.hasAttribute('data-magazine-book');p=p.parentElement){if(getComputedStyle(p).opacity==='0')return false;}return true;};
   const glyphs=els.flatMap(e=>[...e.querySelectorAll('svg')]);
   const values={};
   for(const phase of ['static','pending','enter']){
     els.forEach(e=>e.setAttribute('data-reveal',phase));
     values[phase]=glyphs.map(e=>({visible:visible(e),hidden:e.getAttribute('aria-hidden'),focusable:e.getAttribute('focusable')}));
   }
   return values;
 });
  await page.evaluate(async()=>{await Promise.all(document.querySelector('main').getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})));});
 const settledEnter=await page.locator(`${selector} svg`).evaluateAll(els=>els.map(e=>{for(let p=e;p&&!p.hasAttribute('data-magazine-book');p=p.parentElement){if(getComputedStyle(p).opacity==='0')return false;}return true;}));
 report.states.push({spread,states,settledEnter});
}
await page.goto('http://localhost:3113/test_13?spread=1');
await page.waitForTimeout(2100);
const row=page.locator(`${selector} a[aria-label*="Travel Design"]`);
const action=row.locator(':scope > span').last();
const rest=await action.boundingBox();
await row.hover();await page.waitForTimeout(230);
report.hover={boundsStable:JSON.stringify(rest)===JSON.stringify(await action.boundingBox()),lineTransform:await action.evaluate(e=>getComputedStyle(e,'::before').transform),transition:await action.evaluate(e=>getComputedStyle(e,'::before').transitionDuration)};
await row.focus();await page.screenshot({path:'docs/qa/test-13/graphic-details/after/1440x900/cta-focus.png'});
await page.keyboard.press('Enter');
await page.waitForURL('**/formats');report.keyboard=page.url();
await browser.close();
await writeFile('docs/qa/test-13/graphic-details/after/interactions.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({legacyCtaGeometryUnchanged:report.legacyCtaGeometryUnchanged,hover:report.hover,keyboard:report.keyboard,states:report.states.map(({spread,states,settledEnter})=>({spread,settledEnter:settledEnter.every(Boolean),static:states.static.every(e=>e.visible),pending:states.pending.every(e=>!e.visible),decorative:states.static.every(e=>e.hidden==='true'&&e.focusable==='false')}))},null,2));
