import { expect, test } from "@playwright/test";
const root='[data-testid="magazine-experience"]';
const leaves='[data-magazine-book] > [data-magazine-page]';
test.use({viewport:{width:1440,height:900}});
for(const activation of ['pointer','Enter','Space']) test(`whole cover: ${activation}, revisit and current spread`,async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/test_14');
 const cover=page.getByRole('button',{name:'Открыть журнал по обложке',exact:true});await expect(cover).toBeVisible();
 if(activation==='pointer'){const b=(await cover.boundingBox())!;await page.mouse.click(b.x+b.width*.22,b.y+b.height*.3);}else{await cover.focus();await page.keyboard.press(activation);}
 await expect(page.locator(root)).toHaveAttribute('data-stage','reading');
 await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.locator(root)).toHaveAttribute('data-spread','2');
 await page.getByRole('button',{name:'Обложка',exact:true}).click();await expect(cover).toBeVisible();
 await page.getByRole('button',{name:'Открыть журнал',exact:true}).click();await expect(page.locator(root)).toHaveAttribute('data-stage','reading');
 await expect(page.locator(root)).toHaveAttribute('data-spread','2');await expect(page.locator('[data-magazine-book]')).toBeFocused();
});
test('all URLs, navigation, history and invalid query',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(let n=1;n<=7;n++){await page.goto(`/test_14?spread=${n}&source=interview`);await expect(page.locator(root)).toHaveAttribute('data-spread',String(n));await expect(page.locator(leaves)).toHaveCount(2);await expect(page.locator(`${leaves} footer > span:last-child`)).toHaveText([String(n*2).padStart(2,'0'),String(n*2+1).padStart(2,'0')]);await expect.poll(()=>page.locator(`${leaves} img`).evaluateAll(imgs=>imgs.every(img=>(img as HTMLImageElement).complete&&(img as HTMLImageElement).naturalWidth>0))).toBe(true);}
 await page.goto('/test_14?spread=1&source=interview');for(let n=2;n<=7;n++){await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.locator(root)).toHaveAttribute('data-spread',String(n));}
 await page.goBack();await expect(page.locator(root)).toHaveAttribute('data-spread','6');await page.goForward();await expect(page.locator(root)).toHaveAttribute('data-spread','7');
 for(const query of ['0','8','bad','1&spread=2']){await page.goto(`/test_14?spread=${query}&source=interview`);await expect(page).toHaveURL(/spread=1&source=interview$/);}
});
test('physical cover opens and page curl lands with new artwork',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/test_14');
 await expect(page.getByTestId('magazine-intro-scene')).toHaveAttribute('data-ready','true',{timeout:20000});
 await page.getByRole('button',{name:'Открыть журнал по обложке',exact:true}).click({position:{x:45,y:60}});
 await expect(page.locator(root)).toHaveAttribute('data-stage','reading',{timeout:20000});
 await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.locator(root)).toHaveAttribute('data-turning','false',{timeout:20000});await expect(page.locator(root)).toHaveAttribute('data-spread','2');expect(errors).toEqual([]);
});
for(const size of [{width:1440,height:900},{width:1100,height:700}])test(`layout and artwork at ${size.width}`,async({page})=>{
 await page.setViewportSize(size);await page.emulateMedia({reducedMotion:'reduce'});
 for(const n of [3,5,6]){await page.goto(`/test_14?spread=${n}`);await page.evaluate(()=>document.fonts.ready);
 const failures=await page.locator(leaves).evaluateAll(elements=>elements.flatMap(el=>{const b=el.getBoundingClientRect();return [...el.querySelectorAll('h2,p,figure,footer')].filter(child=>{const c=child.getBoundingClientRect();return c.width>0&&c.height>0&&(c.left<b.left-1||c.right>b.right+1||c.top<b.top-1||c.bottom>b.bottom+1);}).map(c=>c.className);}));expect(failures).toEqual([]);
 await page.screenshot({path:`test-results/test-14/${size.width}-spread-${n}.png`});}
 await page.goto('/test_14');await page.screenshot({path:`test-results/test-14/${size.width}-cover.png`});await expect(page.locator(root)).toHaveCSS('background-color','rgb(240, 238, 229)');
});
test('unsupported small screens offer regular site',async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto('/test_14');await expect(page.getByRole('link',{name:/обычный сайт/}).first()).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);});
