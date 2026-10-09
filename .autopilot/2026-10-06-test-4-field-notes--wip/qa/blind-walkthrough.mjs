import { chromium } from '../../../frontend/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const qa = path.dirname(fileURLToPath(import.meta.url));
const report = { checkedAt: new Date().toISOString(), viewports: [], crop: [], errors: [] };
const browser = await chromium.launch({ headless: true });
const expect = (yes, message) => { if (!yes) throw new Error(message); };

async function settled(page) {
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
  await page.waitForTimeout(180);
}
async function shot(page, name, locator) {
  await settled(page);
  if (locator) await locator.screenshot({ path: path.join(qa, `blind-${name}.png`) });
  else await page.screenshot({ path: path.join(qa, `blind-${name}.png`) });
}
async function screenshotAt(page, selector, name) {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await shot(page, name, el);
}
async function cropWalkthrough(context, size) {
  const page = await context.newPage();
  await page.goto('http://localhost:3000/test_4', { waitUntil: 'networkidle' });
  await settled(page);
  const slot = page.locator('[data-photo-slot="thailand-26-bangkok"]');
  await slot.scrollIntoViewIfNeeded();
  const before = await slot.boundingBox();
  const original = await slot.locator('img').getAttribute('src');
  const fixture = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 4200; c.height = 1200;
    const ctx = c.getContext('2d');
    const colors = ['#ca3a49', '#d89824', '#337d64', '#305cbd', '#a961af', '#72b7b9'];
    colors.forEach((color, i) => { ctx.fillStyle = color; ctx.fillRect(i * 700, 0, 700, 1200); });
    ctx.fillStyle = '#fff'; ctx.font = 'bold 110px sans-serif';
    colors.forEach((_, i) => ctx.fillText(String(i + 1), i * 700 + 280, 210));
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 7;
    for(let y=0;y<1200;y+=300) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(4200,y); ctx.stroke(); }
    return c.toDataURL('image/png').split(',')[1];
  });
  const imagePath = path.join(qa, 'blind-wide-fixture.png');
  await fs.writeFile(imagePath, Buffer.from(fixture, 'base64'));
  await slot.click({ button: 'right' });
  expect(await page.getByRole('menu').isVisible(), 'ПКМ did not show custom menu');
  await shot(page, `menu-${size}`);
  const filechooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('menuitem', { name: 'Заменить фото', exact: true }).click();
  const chooser = await filechooserPromise;
  await chooser.setFiles(imagePath);
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await page.waitForTimeout(200);
  const cropBox = await page.locator('.reactEasyCrop_CropArea').boundingBox();
  expect(Math.abs(cropBox.width / cropBox.height - .68) < .008, 'Crop frame ratio differs from slot');
  await page.getByRole('button', { name: 'Увеличить', exact: true }).click();
  await page.getByRole('slider').fill('1.8');
  await page.getByRole('slider').dispatchEvent('input');
  await page.waitForTimeout(100);
  const draggable = page.getByLabel('Положение фото', { exact: true });
  const box = await draggable.boundingBox();
  const transformBefore = await page.locator('.reactEasyCrop_Image').evaluate(el => el.style.transform);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 85, box.y + box.height / 2 - 35, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(180);
  const transformAfter = await page.locator('.reactEasyCrop_Image').evaluate(el => el.style.transform);
  expect(transformBefore !== transformAfter, 'Dragging did not reposition photo');
  const preview = await page.evaluate(async () => {
    const img = document.querySelector('.reactEasyCrop_Image');
    const b = img.getBoundingClientRect();
    const a = document.querySelector('.reactEasyCrop_CropArea').getBoundingClientRect();
    const x = (a.x + a.width / 2 - b.x) * img.naturalWidth / b.width;
    const y = (a.y + a.height / 2 - b.y) * img.naturalHeight / b.height;
    const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
    return { expectedRgb: [...ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data].slice(0, 3), x, y, imageBounds: { width:b.width, height:b.height }, cropBounds: { width:a.width, height:a.height } };
  });
  await shot(page, `crop-modal-${size}`);
  await page.getByRole('button', { name: 'Сохранить фото', exact: true }).click();
  await dialog.waitFor({ state:'detached' });
  await settled(page);
  expect((await slot.locator('img').getAttribute('src')).startsWith('blob:'), 'Saved photo not rendered');
  const after = await slot.boundingBox();
  expect(Math.abs(before.width - after.width) < 1 && Math.abs(before.height - after.height) < 1, 'Replacement changed frame');
  const output = await slot.locator('img').evaluate(async img => {
    await img.decode(); const canvas=document.createElement('canvas'); canvas.width=img.naturalWidth; canvas.height=img.naturalHeight;
    const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0);
    return { width:img.naturalWidth, height:img.naturalHeight, actualRgb:[...ctx.getImageData(Math.round(img.naturalWidth/2),Math.round(img.naturalHeight/2),1,1).data].slice(0,3), type:(await fetch(img.src).then(r=>r.blob())).type };
  });
  expect(output.width <= 2400 && output.height <= 2400, 'Stored cropped dimensions not bounded');
  expect(Math.abs(output.width / output.height - .68) < .006, 'Output ratio differs from crop');
  expect(output.actualRgb.every((v,i) => Math.abs(v-preview.expectedRgb[i]) < 13), 'Saved crop central pixel differs from preview');
  await shot(page, `replacement-${size}`, slot);
  await page.reload({ waitUntil:'networkidle' });
  await settled(page);
  await slot.scrollIntoViewIfNeeded();
  expect((await slot.locator('img').getAttribute('src')).startsWith('blob:'), 'Replacement lost on reload');
  const persisted = await page.evaluate(async () => {
    const databases = await indexedDB.databases();
    const db = await new Promise((resolve,reject) => { const r=indexedDB.open('travel-club-test-4-photos'); r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error); });
    const result=await new Promise((resolve,reject) => { const r=db.transaction('photos').objectStore('photos').get('thailand-26-bangkok'); r.onsuccess=()=>resolve({isBlob:r.result instanceof Blob, type:r.result?.type,size:r.result?.size}); r.onerror=()=>reject(r.error); });
    db.close(); return { databases, ...result, localStorageKeys:Object.keys(localStorage) };
  });
  expect(persisted.isBlob, 'IndexedDB does not hold image Blob');
  // A cancelled edit must leave the persisted photograph untouched.
  const srcBeforeCancel = await slot.locator('img').getAttribute('src');
  await slot.click({button:'right'});
  const cancelChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('menuitem',{name:'Заменить фото',exact:true}).click();
  await (await cancelChooserPromise).setFiles(imagePath);
  await dialog.waitFor();
  await page.getByRole('button',{name:'Отмена',exact:true}).click();
  await dialog.waitFor({state:'detached'});
  expect(await slot.locator('img').getAttribute('src') === srcBeforeCancel, 'Cancel altered saved image');
  await slot.click({ button:'right' });
  await page.getByRole('menuitem',{name:'Вернуть исходное фото',exact:true}).click();
  await settled(page);
  expect(await slot.locator('img').getAttribute('src') === original, 'Reset did not restore stock fallback');
  await page.reload({ waitUntil:'networkidle' });
  await settled(page);
  expect(await slot.locator('img').getAttribute('src') === original, 'Reset did not survive reload');
  const native = await page.locator('#thailand-heading').evaluate(el => !el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:50,clientY:50})));
  expect(native === false, 'Page text prevented normal contextmenu');
  report.crop.push({size, before, after, cropBox, transformBefore, transformAfter, preview, output, persisted, reload:'pass', reset:'pass',cancel:'pass',nativeMenuOutsidePhoto:'pass'});
  await page.close();
}

try {
  for (const viewport of [{width:1440,height:900},{width:1280,height:800},{width:390,height:844}]) {
    const size = `${viewport.width}x${viewport.height}`;
    const context = await browser.newContext({ viewport, reducedMotion:'reduce' });
    for(const route of ['test_2','test_4']) {
      const page = await context.newPage();
      page.on('pageerror', e => report.errors.push(`${size}/${route}: ${e.message}`));
      const response = await page.goto(`http://localhost:3000/${route}`, {waitUntil:'networkidle'});
      await settled(page);
      await shot(page, `${route}-${size}-living`);
      await page.locator('#start').scrollIntoViewIfNeeded();
      await shot(page, `${route}-${size}-hero`);
      const metrics = await page.evaluate(() => ({
        documentWidth:document.documentElement.scrollWidth, viewport:innerWidth, title:document.title,
        sections:[...document.querySelectorAll('main > section, main > article, main > div')].map(el=>({tag:el.tagName,id:el.id,label:el.getAttribute('aria-labelledby'),height:Math.round(el.getBoundingClientRect().height)})),
        slots:[...document.querySelectorAll('[data-photo-slot]')].map(el=>{const b=el.getBoundingClientRect(), i=el.querySelector('img'); return { id:el.dataset.photoSlot,ratio:Number(el.dataset.photoRatio),width:b.width,height:b.height,aspectError:Math.abs(b.width/b.height-Number(el.dataset.photoRatio)),fit:getComputedStyle(i).objectFit,overflow:getComputedStyle(el).overflow,decoded:i.complete&&i.naturalWidth>0 };}),
        headings:[...document.querySelectorAll('h1,h2,h3')].map(el=>el.innerText),
        typography:{headline:getComputedStyle(document.querySelector('h1')).fontFamily,headlineSize:getComputedStyle(document.querySelector('h1')).fontSize,body:getComputedStyle(document.querySelector('main')).fontFamily},
        bodyText:document.body.innerText,
        images:[...document.images].map(i=>({src:i.currentSrc,decoded:i.complete&&i.naturalWidth>0})),
        backgrounds: ['field-thailand','field-china'].map(id=>({id,color:document.getElementById(id)?getComputedStyle(document.getElementById(id)).backgroundColor:null})),
        tracePaths:document.querySelectorAll('svg path[stroke-dasharray], svg[class*="travelTrace"] path').length
      }));
      expect(metrics.documentWidth <= viewport.width+1,`${route}/${size} horizontal overflow`);
      if(route==='test_4') {
        expect(metrics.slots.length===31,`${size} expected 31 stable photo slots, found ${metrics.slots.length}`);
        expect(new Set(metrics.slots.map(s=>s.id)).size===31,'Nonunique slots');
        expect(metrics.slots.every(s=>s.aspectError<.018 && s.fit==='cover' && s.overflow==='hidden' && s.decoded),`${size} unstable or broken photo frame`);
        expect(!/Memory|The Book|MURMANSK|SAINT PETERSBURG/i.test(metrics.bodyText),'Removed/forbidden content rendered');
        for(const id of ['field-notes','field-thailand','field-china','from-the-archive','next-issue','point-of-view','club']) await screenshotAt(page,`#${id}`,`${route}-${size}-${id}`);
        await page.locator('#field-thailand').scrollIntoViewIfNeeded(); await shot(page, `${route}-${size}-thailand-viewport`);
        await page.locator('#field-china').scrollIntoViewIfNeeded(); await shot(page, `${route}-${size}-china-viewport`);
      }
      report.viewports.push({size,route,status:response.status(),...metrics});
      await page.close();
    }
    await cropWalkthrough(context,size);
    await context.close();
    console.log(`Independent static + crop walkthrough PASS ${size}`);
  }
  const context = await browser.newContext({viewport:{width:1440,height:900}});
  for(const route of ['test_2','test_4']) {
    const page=await context.newPage(); await page.goto(`http://localhost:3000/${route}`,{waitUntil:'networkidle'});
    await shot(page, `${route}-normal-opening-closed`);
    await page.mouse.wheel(0,300); await page.waitForTimeout(350);
    await shot(page, `${route}-normal-opening-open`);
    const motion=await page.locator('section').first().evaluate(el=>({open:el.style.getPropertyValue('--open'),enter:el.style.getPropertyValue('--enter'),chrome:el.style.getPropertyValue('--chrome'),transform:getComputedStyle(el.querySelector('[class*="cover"]')).transform}));
    expect(Number(motion.open)>.5,`${route} opening did not animate`);
    report.viewports.push({route,normalMotion:motion}); await page.close();
  }
  await context.close();
  report.result='PASS';
} catch(error) { report.result='FAIL'; report.failure=error.stack; process.exitCode=1; }
await fs.writeFile(path.join(qa,'blind-walkthrough-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({result:report.result,failure:report.failure,errors:report.errors,viewports:report.viewports.map(v=>({size:v.size,route:v.route,status:v.status,documentWidth:v.documentWidth,slotCount:v.slots?.length,normalMotion:v.normalMotion})),crop:report.crop.map(c=>({size:c.size,output:c.output,persisted:c.persisted,reload:c.reload,reset:c.reset,cancel:c.cancel}))},null,2));
await browser.close();
