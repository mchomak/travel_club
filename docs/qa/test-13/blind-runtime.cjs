const { chromium } = require('../../../frontend/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const out = __dirname;
const origin = 'http://localhost:3114';
const result = { origin, viewport: { width:1440,height:900 }, errors:[], chapters:[], controls:[], intro:[] };
const assert = (condition, label) => { if (!condition) throw new Error(label); };
async function summary(p) {
 return p.locator('[data-magazine-book] > [data-magazine-page]').evaluateAll(es => es.map(e=>({
  text:e.innerText, label:e.getAttribute('aria-label'), reveal:e.dataset.reveal,
  titles:[...e.querySelectorAll('[data-editorial="reveal"]')].map(x=>({text:x.textContent,clip:getComputedStyle(x).clipPath,font:getComputedStyle(x).fontFamily,size:getComputedStyle(x).fontSize})),
  images:[...e.querySelectorAll('img')].map(x=>({src:x.getAttribute('src'),alt:x.alt,decoded:x.complete&&x.naturalWidth>0})),
  links:[...e.querySelectorAll('a')].map(x=>({text:x.textContent,href:x.getAttribute('href')})),
  overflow:[e.scrollWidth-e.clientWidth,e.scrollHeight-e.clientHeight],
  animations:e.getAnimations({subtree:true}).map(a=>({name:a.animationName,time:a.currentTime,state:a.playState,duration:a.effect.getTiming().duration,delay:a.effect.getTiming().delay})),
  rules:[...e.querySelectorAll('[data-draw]')].map(x=>({name:getComputedStyle(x,'::after').animationName,transform:getComputedStyle(x,'::after').transform,color:getComputedStyle(x,'::after').backgroundColor}))
 })));
}
async function instrument(p) {
 await p.evaluate(()=>{
  window.__motionTrace=[];
  const root=document.querySelector('main'),book=document.querySelector('[data-magazine-book]');
  let last='';const read=()=>{
   const pages=[...book.children].filter(e=>e.matches('[data-magazine-page]'));
   const state={t:performance.now(),turn:root.dataset.turning,spread:root.dataset.spread,phases:pages.map(e=>e.dataset.reveal),editorial:pages.flatMap(e=>e.getAnimations({subtree:true})).filter(a=>a.animationName?.startsWith('editorial')).map(a=>a.animationName),current:document.querySelector('[aria-current="page"]')?.innerText};
   const key=JSON.stringify({...state,t:0});if(key!==last){window.__motionTrace.push(state);last=key;}
  };new MutationObserver(read).observe(root,{subtree:true,attributes:true,childList:true});read();
 });
}
(async()=>{
 const b=await chromium.launch({headless:true});
 const context=await b.newContext({viewport:result.viewport});
 const p=await context.newPage();
 p.on('pageerror',e=>result.errors.push(String(e)));
 p.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});
 await p.goto(origin+'/test_13?spread=1');await p.waitForTimeout(3200);
 await instrument(p);
 for(let i=1;i<=7;i++) {
  if(i>1){await p.getByTestId('spread-next').click();await p.waitForFunction(()=>document.querySelector('main').dataset.turning==='false');}
  const early=await summary(p);
  await p.waitForTimeout(3200);
  const final=await summary(p);
  assert(final.length===2,'two pages chapter '+i);
  assert(await p.locator('[aria-current="page"]').innerText().then(x=>x.startsWith(String(i).padStart(2,'0'))),'active chapter '+i);
  await p.screenshot({path:path.join(out,'blind-chapter-'+i+'.png')});
  const control=await context.newPage();await control.goto(origin+'/test_12?spread='+i);await control.waitForTimeout(3200);
  const base=await summary(control);
  result.controls.push({chapter:i,textSame:JSON.stringify(final.map(x=>x.text))===JSON.stringify(base.map(x=>x.text)),imagesSame:JSON.stringify(final.map(x=>x.images))===JSON.stringify(base.map(x=>x.images)),linksSame:JSON.stringify(final.map(x=>x.links))===JSON.stringify(base.map(x=>x.links))});
  if(i===1)await control.screenshot({path:path.join(out,'blind-control-1.png')});
  await control.close();
  result.chapters.push({chapter:i,early,final});
 }
 result.forwardTrace=await p.evaluate(()=>window.__motionTrace);
 result.lastBoundary=await p.getByTestId('spread-next').isDisabled();
 await p.keyboard.press('ArrowLeft');await p.waitForFunction(()=>document.querySelector('main').dataset.turning==='false');await p.waitForTimeout(1200);
 result.keyboard={spread:await p.locator('main').getAttribute('data-spread')};
 await p.goBack();await p.waitForTimeout(1200);result.historyBack={url:p.url(),spread:await p.locator('main').getAttribute('data-spread'),active:await p.locator('[aria-current="page"]').innerText()};
 await p.goForward();await p.waitForTimeout(1200);result.historyForward={url:p.url(),spread:await p.locator('main').getAttribute('data-spread')};
 await p.goto(origin+'/test_13?spread=1');await p.waitForTimeout(3200);
 const row=p.locator('[data-editorial="cascade"][href="/formats"]').first();
 const rowBefore=await row.boundingBox();const svg=row.locator('svg').first();
 result.hover={before:await svg.evaluate(e=>getComputedStyle(e).transform)};
 await row.hover();await p.waitForTimeout(300);result.hover.after=await svg.evaluate(e=>getComputedStyle(e).transform);result.hover.rowStable=JSON.stringify(rowBefore)===JSON.stringify(await row.boundingBox());
 await row.focus();await p.keyboard.press('Shift+Tab');await p.keyboard.press('Tab');
 result.focus=await row.evaluate(e=>({active:e===document.activeElement,outline:getComputedStyle(e).outline,href:e.getAttribute('href')}));
 await row.press('Enter');await p.waitForURL('**/formats');result.cta=p.url();
 for(const route of ['test_12','test_13']) {
  await p.goto(origin+'/'+route);await p.waitForTimeout(1200);
  const states=[];await p.evaluate(()=>{window.__introTrace=[];const root=document.querySelector('main');new MutationObserver(()=>window.__introTrace.push({t:performance.now(),phase:root.dataset.introPhase,stage:root.dataset.stage,result:root.dataset.introResult})).observe(root,{attributes:true});});
  await p.getByRole('button',{name:'Открыть журнал',exact:true}).click();
  await p.waitForTimeout(1200);await p.screenshot({path:path.join(out,'blind-'+route+'-intro.png')});
  await p.waitForFunction(()=>document.querySelector('main').dataset.stage==='reading',{timeout:20000});
  result.intro.push({route,trace:await p.evaluate(()=>window.__introTrace),final:await p.locator('main').getAttribute('data-intro-result')});
 }
 await p.emulateMedia({reducedMotion:'reduce'});await p.goto(origin+'/test_13?spread=2');await p.waitForTimeout(500);result.reduced={pages:await summary(p)};
 await p.keyboard.press('ArrowRight');result.reduced.afterKey=await p.locator('main').getAttribute('data-spread');result.reduced.turning=await p.locator('main').getAttribute('data-turning');
 await p.emulateMedia({reducedMotion:'no-preference'});
 await p.goto(origin+'/test_13?spread=4');await p.waitForTimeout(3300);
 result.noRerunBefore=await summary(p);await p.setViewportSize({width:1400,height:900});await p.waitForTimeout(200);result.noRerunAfter=await summary(p);
 const touch=await b.newContext({viewport:{width:1100,height:700},hasTouch:true});const tp=await touch.newPage();await tp.goto(origin+'/test_13?spread=1');await tp.waitForTimeout(3200);await tp.getByRole('button',{name:'02 О нас'}).tap();await tp.waitForFunction(()=>document.querySelector('main').dataset.turning==='false');result.touch={spread:await tp.locator('main').getAttribute('data-spread')};await tp.screenshot({path:path.join(out,'blind-touch-1100.png')});await touch.close();
 const fallback=await b.newContext({viewport:result.viewport});await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(String(type).includes('webgl'))return null;return original.call(this,type,...args);};});const fp=await fallback.newPage();await fp.goto(origin+'/test_13?spread=1');await fp.waitForTimeout(3200);await fp.getByTestId('spread-next').click();await fp.waitForFunction(()=>document.querySelector('main').dataset.turning==='false');await fp.waitForTimeout(1300);result.fallback={spread:await fp.locator('main').getAttribute('data-spread'),pages:await summary(fp)};await fallback.close();
 const nojs=await b.newContext({viewport:result.viewport,javaScriptEnabled:false});const np=await nojs.newPage();await np.goto(origin+'/test_13?spread=2');result.nojs={notice:await np.locator('noscript').innerText(),pages:await summary(np)};await nojs.close();
 await p.setViewportSize({width:390,height:844});await p.goto(origin+'/test_13?spread=2');result.mobile={message:await p.locator('h1').filter({hasText:'Журнал для большого экрана.'}).isVisible(),fallback:await p.getByRole('link',{name:'Открыть обычную версию ↗'}).first().getAttribute('href')};
 fs.writeFileSync(path.join(out,'blind-runtime.json'),JSON.stringify(result,null,2));await b.close();console.log(JSON.stringify({chapters:result.chapters.length,controls:result.controls,errors:result.errors,keyboard:result.keyboard,touch:result.touch,intro:result.intro.map(x=>({route:x.route,final:x.final})),fallback:result.fallback.spread}));
})().catch(e=>{fs.writeFileSync(path.join(out,'blind-runtime-error.txt'),String(e.stack));console.error(e);process.exitCode=1;});
