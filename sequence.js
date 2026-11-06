const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const times = process.argv.slice(2).map(Number).filter(n => isFinite(n));
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Users\\Lenovo\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader', '--hide-scrollbars', '--disable-dev-shm-usage',
      '--force-device-scale-factor=1']
  });
  for (const t of times) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 750, deviceScaleFactor: 1 });
    page.on('pageerror', err => console.error('PAGEERROR', t, err.message));
    const url = `http://127.0.0.1:8123/index.html?t=${t}&still=1`;
    console.log('OPEN', t);
    await page.goto(url, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => document.body.getAttribute('data-rendered') === '1', { timeout: 180000, polling: 500 });
    await new Promise(r => setTimeout(r, 500));
    const out = path.resolve(`assembly-${String(t).replace('.', '_')}.png`);
    await page.screenshot({ path: out, type: 'png' });
    console.log('SAVED', out);
    await page.close();
  }
  await browser.close();
})().catch(err => { console.error('FAIL', err); process.exit(1); });
