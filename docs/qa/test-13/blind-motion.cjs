const {chromium}=require('../../../frontend/node_modules/playwright');
const fs=require('node:fs');const path=require('node:path');
const origin='http://localhost:3114';
(async()=>{
 const b=await chromium.launch({headless:true});const p=await b.newPage({viewport:{width:1440,height:900}});
 await p.goto(origin+'/test_13?spread=1');await p.waitForTimeout(3300);
 await p.evaluate(()=>{window.__events=[];for(const name of ['animationstart','animationend'])document.addEventListener(name,e=>{if(!e.target.closest('[data-magazine-book] > [data-magazine-page]'))return;window.__events.push({event:name,t:performance.now(),animation:e.animationName,turning:document.querySelector('main').dataset.turning,phase:e.target.closest('[data-magazine-page]').dataset.reveal,text:e.target.textContent.slice(0,80)});},true);});
 const indicator=()=>p.locator('[data-nav-indicator]').evaluate(e=>({transform:getComputedStyle(e).transform,width:getComputedStyle(e).width,transition:getComputedStyle(e).transition}));
 const before=await indicator();await p.getByRole('button',{name:'02 О нас'}).click();
 await p.waitForFunction(()=>document.querySelector('main').dataset.turning==='false');
 const after0=await indicator();await p.waitForTimeout(120);const after120=await indicator();
 const mid=await p.locator('[data-magazine-book] > [data-magazine-page]').evaluateAll(es=>es.flatMap(e=>[...e.querySelectorAll('[data-editorial="reveal"],[data-editorial="cascade"]')].map(x=>({text:x.textContent.slice(0,80),type:x.dataset.editorial,clip:getComputedStyle(x).clipPath,opacity:getComputedStyle(x).opacity,transform:getComputedStyle(x).transform}))));
 await p.screenshot({path:path.join(__dirname,'blind-motion-mid.png')});await p.waitForTimeout(1100);const afterFinal=await indicator();
 const events=await p.evaluate(()=>window.__events);
 await p.setViewportSize({width:1100,height:700});await p.waitForTimeout(1100);await p.screenshot({path:path.join(__dirname,'blind-touch-final.png')});
 const photo=[];
 for(const route of ['test_12','test_13']){await p.goto(origin+'/'+route+'?spread=4');await p.waitForTimeout(70);photo.push({route,objects:await p.locator('[data-magazine-book] > [data-magazine-page] [data-reveal-object]').evaluateAll(es=>es.map(e=>({object:e.dataset.revealObject,clip:getComputedStyle(e).clipPath,animation:getComputedStyle(e).animationName.split('__').at(-1),duration:getComputedStyle(e).animationDuration,delay:getComputedStyle(e).animationDelay})))});}
 await p.goto(origin+'/test_13?spread=7');await p.waitForTimeout(1200);await p.addStyleTag({content:'*,*::before,*::after {animation:none!important;transition:none!important}'});const noAnimation=await p.locator('[data-editorial="reveal"],[data-editorial="cascade"]').evaluateAll(es=>es.map(e=>({text:e.textContent.slice(0,60),clip:getComputedStyle(e).clipPath,opacity:getComputedStyle(e).opacity})));
 const direct=[];for(let i=1;i<=7;i++){await p.goto(origin+'/test_13?spread='+i);await p.waitForTimeout(100);direct.push({requested:i,spread:await p.locator('main').getAttribute('data-spread'),active:await p.locator('[aria-current="page"]').innerText()});}
 const imageObjects=['thai-strip','thai-people','thai-city'];
 const photoSignaturesMatch=JSON.stringify(photo[0].objects.filter(x=>imageObjects.includes(x.object)).map(({clip,...x})=>x))===JSON.stringify(photo[1].objects.filter(x=>imageObjects.includes(x.object)).map(({clip,...x})=>x));
 fs.writeFileSync(path.join(__dirname,'blind-motion.json'),JSON.stringify({before,after0,after120,afterFinal,mid,events,photo,photoSignaturesMatch,noAnimation,direct},null,2));console.log(JSON.stringify({events:events.length,earlyStarts:events.filter(e=>e.animation.includes('editorial')&&e.event==='animationstart'&&e.turning!=='false').length,photoSignaturesMatch,direct:direct.map(x=>[x.requested,x.spread]),nav:[before,after0,after120,afterFinal]}));await b.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
