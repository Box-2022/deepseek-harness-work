const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const out = process.argv[2] || 'shot.png';
  const width = parseInt(process.argv[3] || '1440', 10);
  const height = parseInt(process.argv[4] || '900', 10);
  const query = process.argv[5] || 'skipIntro=1&still=1';
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Users\\Lenovo\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-gpu-sandbox',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--hide-scrollbars',
      '--disable-dev-shm-usage',
      '--force-device-scale-factor=1'
    ]
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  page.on('console', msg => console.log('PAGE', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('PAGEERROR', err.message));
  page.on('requestfailed', req => console.error('REQFAIL', req.url(), req.failure() && req.failure().errorText));
  const url = 'http://127.0.0.1:8123/index.html?' + query;
  console.log('OPEN', url);
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => document.body.getAttribute('data-rendered') === '1', { timeout: 180000, polling: 500 });
  await new Promise(r => setTimeout(r, 900));
  const stats = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return {
      title: document.title,
      canvas: c ? [c.width, c.height, c.style.width, c.style.height] : null,
      debug: document.getElementById('debug').textContent,
      rendered: document.body.getAttribute('data-rendered')
    };
  });
  console.log('STATS', JSON.stringify(stats, null, 2));
  await page.screenshot({ path: path.resolve(out), type: 'png' });
  console.log('SAVED', path.resolve(out));
  await browser.close();
})().catch(err => {
  console.error('FAIL', err);
  process.exit(1);
});
