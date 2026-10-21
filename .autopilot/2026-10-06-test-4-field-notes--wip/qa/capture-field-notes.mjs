import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';
const require=createRequire(resolve('package.json'));const {chromium}=require('@playwright/test');
const out=resolve('../.autopilot/2026-10-06-test-4-field-notes--wip/qa');
const pass=process.argv[2]??'final';
const browser=await chromium.launch();let results=[];
for(const viewport of [{width:1440,height:900},{width:1280,height:800},{width:390,height:844}]){
 const context=await browser.newContext({viewport,reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:3001/test_4');
 await page.evaluate(async()=>{await Promise.race([document.fonts.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Fonts timeout')),10000))]);for(const img of document.images)img.loading='eager';await Promise.race([Promise.all([...document.images].map(img=>img.decode())),new Promise((_,reject)=>setTimeout(()=>reject(Error('Images timeout')),15000))]);});
 await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
 await page.screenshot({path:resolve(out,`field-${pass}-${viewport.width}-full.png`),fullPage:true,animations:'disabled'});
 await page.screenshot({path:resolve(out,`field-${pass}-${viewport.width}-living.png`),animations:'disabled'});
 const metrics=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,textCorrupt:document.body.innerText.includes('??'),missingAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.getAttribute('href').slice(1))).map(a=>a.getAttribute('href')),images:[...document.querySelectorAll('[data-photo-slot]')].map(e=>({id:e.dataset.photoSlot,ratio:e.dataset.photoRatio,w:e.offsetWidth,h:e.offsetHeight})),sections:['field-notes','field-thailand','field-china','from-the-archive'].map(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return{id,y:r.top+scrollY,h:r.height}})}));
 for(const id of ['field-thailand','field-china','from-the-archive']){await page.locator(`#${id}`).scrollIntoViewIfNeeded();await page.evaluate(id=>scrollTo(0,document.getElementById(id).getBoundingClientRect().top+scrollY),id);await page.screenshot({path:resolve(out,`field-${pass}-${viewport.width}-${id}.png`),animations:'disabled'});await page.locator(`#${id}`).screenshot({path:resolve(out,`field-${pass}-${viewport.width}-${id}-section.png`),animations:'disabled'});}
 results.push({viewport,metrics,errors});console.log(JSON.stringify({viewport,overflow:metrics.scrollWidth-metrics.width,slots:metrics.images.length,errors,sections:metrics.sections}));await context.close();
}
await writeFile(resolve(out,`field-${pass}-metrics.json`),JSON.stringify(results,null,2));
const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});const page=await context.newPage();await page.goto('http://127.0.0.1:3001/test_4');await page.evaluate(()=>document.fonts.ready);const cover=page.getByRole('region',{name:'TRAVEL CLUB',exact:true}).getByRole('article');const initial=await cover.evaluate(e=>getComputedStyle(e).transform);await page.evaluate(()=>scrollTo(0,innerHeight*.38));await page.waitForTimeout(200);const opened=await cover.evaluate(e=>getComputedStyle(e).transform);if(initial===opened)throw Error('Opening did not react to scroll');await page.addStyleTag({content:'nextjs-portal{display:none!important}'});await page.screenshot({path:resolve(out,`field-${pass}-1440-normal-opening.png`),animations:'disabled'});await page.getByRole('link',{name:'К сайту',exact:false}).click();await page.waitForURL(/#start$/);await page.getByRole('banner').getByRole('link',{name:'Начать историю'}).click();await page.waitForURL(/#story$/);await context.close();
await browser.close();await writeFile(resolve(out,`field-${pass}-metrics.json`),JSON.stringify(results,null,2));
