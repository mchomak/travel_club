import { chromium } from '../../frontend/node_modules/playwright/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const output = resolve('docs/qa/test-11-comments');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const viewport of [{width:1100,height:700},{width:1280,height:768},{width:1314,height:1244},{width:1440,height:900},{width:1920,height:1080}]) {
    const page = await browser.newPage({viewport, reducedMotion:'reduce'});
    for (const spread of [1,3,6]) {
      await page.goto(`${origin}/test_11?spread=${spread}`);
      await page.locator('[data-stage="reading"]').waitFor();
      await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
      const metrics = await page.evaluate(()=>{
        const pages = [...document.querySelectorAll('[data-magazine-book] > [data-magazine-page]')];
        return {
          pages: pages.map(page=>{
            const bounds=page.getBoundingClientRect();
            const clipped=[];
            const walker=document.createTreeWalker(page,NodeFilter.SHOW_TEXT);
            while(walker.nextNode()){
              const node=walker.currentNode;
              if(!node.textContent.trim())continue;
              const style=getComputedStyle(node.parentElement);
              if(style.display==='none'||style.visibility==='hidden')continue;
              const r=document.createRange();r.selectNodeContents(node);
              if([...r.getClientRects()].some(b=>b.width&&b.height&&(b.left<bounds.left-1||b.right>bounds.right+1||b.top<bounds.top-1||b.bottom>bounds.bottom+1)))clipped.push(node.textContent.trim());
            }
            return {name:page.getAttribute('aria-label'),overflowX:page.scrollWidth-page.clientWidth,overflowY:page.scrollHeight-page.clientHeight,clipped};
          }),
          broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),
          overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,
          canvases:document.querySelectorAll('canvas').length
        };
      });
      if(viewport.width===1314||viewport.width===1280) await page.screenshot({path:resolve(output,`spread-${spread}-${viewport.width}.png`)});
      results.push({viewport,spread,...metrics});
    }
    await page.close();
  }
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto(`${origin}/test_11?spread=1`);
  results.push({viewport:{width:390,height:844},compact:true,link:await page.getByRole('link').filter({hasText:/верси|сайт|Открыть/}).first().getAttribute('href').catch(()=>null),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
  await page.screenshot({path:resolve(output,'compact-390.png')});
  await writeFile(resolve(output,'acceptance.json'),JSON.stringify({origin,checkedAt:new Date().toISOString(),results},null,2));
  const failures=results.filter(r=>r.overflow||r.broken?.length||r.pages?.some(p=>p.overflowX>1||p.overflowY>1||p.clipped.length));
  console.log(JSON.stringify({checks:results.length,failures},null,2));
  if(failures.length)process.exitCode=1;
} finally {await browser.close();}
