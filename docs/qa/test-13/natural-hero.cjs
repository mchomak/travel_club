const {createRequire}=require('node:module'); const {resolve}=require('node:path'); const {writeFileSync}=require('node:fs');
const {chromium}=createRequire(resolve('frontend/package.json'))('@playwright/test');
(async()=>{const browser=await chromium.launch();const results=[];
for(const viewport of [{width:1100,height:700},{width:1280,height:768},{width:1440,height:900},{width:1920,height:1080}]){
 const ctx=await browser.newContext({viewport});
 const pages=await Promise.all([ctx.newPage(),ctx.newPage()]);
 await Promise.all(pages.map(async(p,i)=>{await p.goto(`http://localhost:3114/test_${12+i}?spread=1`);await p.waitForSelector('[data-magazine-page][data-reveal="enter"]');await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('[data-magazine-book] img')].map(img=>img.decode()));await Promise.all(document.querySelector('main').getAnimations({subtree:true}).map(a=>a.finished));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await p.screenshot({path:`docs/qa/test-13/motion-final/${viewport.width}x${viewport.height}-spread-1-natural-test${12+i}.png`});}));
 results.push({viewport,complete:true});await ctx.close();}
writeFileSync('docs/qa/test-13/motion-final/natural-hero.json',JSON.stringify(results,null,2));await browser.close();})();
