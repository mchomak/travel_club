const {chromium}=require('../../../frontend/node_modules/playwright');
const fs=require('node:fs');const path=require('node:path');
(async()=>{
 const b=await chromium.launch({headless:true});const p=await b.newPage({viewport:{width:1440,height:900}});const results=[];
 const line=e=>{const s=getComputedStyle(e,'::before'),m=new DOMMatrixReadOnly(s.transform);return {text:e.textContent,transform:s.transform,xScale:m.a,yOffset:m.f,height:s.height,color:s.backgroundColor,content:s.content};};
 for(const i of [1,3,4,5,6,7]){
  await p.goto('http://localhost:3114/test_13?spread='+i);await p.waitForTimeout(1300);
  const links=p.locator('[data-magazine-book] > [data-magazine-page] a[class*="__link"]');
  if(!await links.count())throw Error('No editorial link chapter '+i);
  for(const a of await links.all()){
   await p.mouse.move(0,0);await p.waitForTimeout(220);const rest=await a.evaluate(line);const box=await a.boundingBox();
   await a.hover();await p.waitForTimeout(220);const hover=await a.evaluate(line);
   await a.focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');const focus=await a.evaluate(e=>({active:e===document.activeElement,outline:getComputedStyle(e).outline}));
   const stable=JSON.stringify(box)===JSON.stringify(await a.boundingBox());results.push({chapter:i,rest,hover,focus,stable});
   if(rest.xScale!==1||hover.yOffset!==-2||!focus.active||!stable)throw Error('Rest/hover/focus failed chapter '+i);
  }
 }
 await p.emulateMedia({reducedMotion:'reduce'});await p.goto('http://localhost:3114/test_13?spread=1');await p.waitForTimeout(300);
 const reducedLink=p.locator('[data-magazine-book] > [data-magazine-page] a[class*="__link"]').first();
 await p.mouse.move(0,0);const reducedRest=await reducedLink.evaluate(line);await reducedLink.hover();await p.waitForTimeout(220);const reducedHover=await reducedLink.evaluate(line);
 if(reducedRest.xScale!==1||reducedHover.xScale!==1||reducedRest.yOffset!==0||reducedHover.yOffset!==0)throw Error('Reduced motion underline failed');
 await p.screenshot({path:path.join(__dirname,'blind-cta-final.png')});
 fs.writeFileSync(path.join(__dirname,'blind-rest-check.json'),JSON.stringify({results,reducedRest,reducedHover},null,2));console.log(JSON.stringify({links:results.length,chapters:results.map(x=>x.chapter),reducedStatic:true,passed:true}));await b.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
