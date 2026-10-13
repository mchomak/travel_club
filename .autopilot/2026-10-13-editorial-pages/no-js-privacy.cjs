const { chromium } = require('../../frontend/node_modules/@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://localhost:3000/start');
  const transmissions = [];
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.searchParams.has('contact') || request.method() === 'POST') {
      transmissions.push({ method: request.method(), contactInUrl: url.searchParams.has('contact') });
      await route.abort();
    } else await route.continue();
  });
  await page.getByRole('textbox', { name: /Ваш контакт/ }).fill('privacy-check@example.test');
  const submit = page.getByRole('button', { name: 'Продолжить' });
  const disabled = await submit.isDisabled();
  if (!disabled) {
    await submit.click({ noWaitAfter: true });
    await page.waitForTimeout(500);
  }
  process.stdout.write(JSON.stringify({ disabled, transmissions }) + '\n');
  await browser.close();
})().catch(error => { process.stderr.write(error.message + '\n'); process.exit(1); });
