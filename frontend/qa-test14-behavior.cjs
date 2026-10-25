const fs=require('fs'),path=require('path'),{chromium}=require('playwright');
const base=process.cwd(),out=path.join(base,'test-results/test14-behavior'),failures=[],checks=[];
const mime={'.js':'text/javascript','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png'};
(async()=>{const browser=await chromium.launch({headless:true,args:['--log-file='+path.join(out,'chrome.log')]});const context=await browser.newContext({viewport:{width:1440,height:900}});await context.route('**/*',async route=>{
 const url=new URL(route.request().url());const local=url.pathname;
 if(local==='/test_14'){return route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><style>html,body{margin:0}*{box-sizing:border-box}</style></head><body><div id="app"></div><script src="/client.js"></script></body></html>'});}
 const file=local==='/client.js'||/^\/\d+\.js$/.test(local)||local.endsWith('.js')?path.join(out,path.basename(local)):path.join(base,'public',local);
 if(fs.existsSync(file))return route.fulfill({path:file,contentType:mime[path.extname(file)]||'application/octet-stream'});
 failures.push(`missing local asset: ${local}`);return route.fulfill({status:404,body:'missing local asset'});
 });const page=await context.newPage();page.on('pageerror',e=>failures.push(e.message));
 const root='[data-testid="magazine-experience"]',cover='[data-testid="cover-open"]';
 const ready=async()=>{await page.waitForFunction(()=>document.querySelector('[data-testid="magazine-experience"]')?.getAttribute('data-stage')==='reading',{timeout:20000});};
 const direct=async(n)=>{await page.goto(`https://test14.local/test_14?spread=${n}`);await ready();};
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const key of ['Enter','Space']){await page.goto('https://test14.local/test_14');await page.locator(cover).focus();await page.keyboard.press(key);await ready();checks.push('cover '+key);}
 for(const position of [{x:.15,y:.15},{x:.5,y:.5},{x:.85,y:.85}]){await page.goto('https://test14.local/test_14');const b=await page.locator(cover).boundingBox();await page.mouse.click(15,15);if(await page.locator(root).getAttribute('data-stage')!=='opening')throw Error('outside click opened');await page.mouse.click(b.x+b.width*position.x,b.y+b.height*position.y);await ready();checks.push('pointer '+JSON.stringify(position));}
 await direct(6);await page.getByRole('button',{name:'Обложка',exact:true}).click();await page.locator(cover).click();await ready();if(await page.locator(root).getAttribute('data-spread')!=='6')throw Error('revisit lost chapter');if(!await page.locator('[data-magazine-book]').evaluate(el=>el===document.activeElement))throw Error('cover focus handoff failed');checks.push('revisit via whole cover/focus');
 await direct(1);for(let n=2;n<=7;n++){await page.getByRole('button',{name:'Next',exact:true}).click();await page.waitForFunction(n=>document.querySelector('[data-testid="magazine-experience"]')?.getAttribute('data-spread')===String(n),n);}await page.goBack();await page.waitForFunction(()=>document.querySelector('[data-testid="magazine-experience"]')?.getAttribute('data-spread')==='6');await page.goForward();await page.waitForFunction(()=>document.querySelector('[data-testid="magazine-experience"]')?.getAttribute('data-spread')==='7');checks.push('seven chapters/history');
 for(let n=1;n<=7;n++){await direct(n);if(await page.locator('[data-magazine-book] > [data-magazine-page]').count()!==2)throw Error('direct URL leaves');}checks.push('direct URLs');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('https://test14.local/test_14');await page.locator('[data-testid="magazine-intro-scene"][data-ready=true]').waitFor({timeout:30000});await page.screenshot({path:path.join(out,'live-closed.png')});
 const polygon=await page.locator(cover).evaluate(el=>({bounds:el.getBoundingClientRect().toJSON(),matrix:getComputedStyle(el).transform}));checks.push({projectedCover:polygon});await page.locator(cover).dblclick();await ready();checks.push('WebGL cover/double activation');
 await page.getByRole('button',{name:'Next',exact:true}).click();
 const turnMode=await page.waitForFunction(()=>{const el=document.querySelector('[data-reading-turn]');const mode=el?.getAttribute('data-reading-turn');return (mode==='webgl'||mode==='fallback')&&document.querySelector('[data-testid="magazine-experience"]')?.getAttribute('data-turning')==='true'?mode:null;},null,{timeout:15000});
 const observedMode=await turnMode.jsonValue();if(observedMode!=='webgl'&&observedMode!=='fallback')throw Error('No active reading renderer observed');checks.push({activeReadingRenderer:observedMode});
 await page.screenshot({path:path.join(out,'live-active-turn.png')});
 await page.waitForFunction(()=>document.querySelector('[data-testid="magazine-experience"]')?.getAttribute('data-turning')==='false',null,{timeout:30000});if(await page.locator(root).getAttribute('data-spread')!=='2')throw Error('curl failed');checks.push(observedMode==='webgl'?'WebGL reading curl observed and landed':'CSS reading fallback observed and landed');
 await page.screenshot({path:path.join(out,'live-after-curl.png')});
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,failures},null,2));console.log(JSON.stringify({checks,failures},null,2));await browser.close();if(failures.length)process.exitCode=1;
})().catch(error=>{fs.writeFileSync(path.join(out,'error.txt'),String(error.stack));console.error(error);process.exitCode=1;});
