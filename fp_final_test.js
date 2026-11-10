const puppeteer = require('puppeteer-core');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Users\\Lenovo\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader', '--hide-scrollbars', '--disable-dev-shm-usage',
      '--force-device-scale-factor=1']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', err => { errors.push(err.message); console.error('PAGEERROR', err.message); });
  page.on('requestfailed', req => console.error('REQFAIL', req.url(), req.failure() && req.failure().errorText));
  const file = pathToFileURL(path.resolve('rainy-convenience-store.html')).href;
  const url = file + '?fp=1&still=1';
  console.log('OPEN', url);
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => document.body.getAttribute('data-rendered') === '1', { timeout: 180000, polling: 500 });
  await new Promise(r => setTimeout(r, 700));
  console.log('ERRORS', JSON.stringify(errors));
  await page.screenshot({ path: path.resolve('first-person-preview.png'), type: 'png' });
  console.log('SAVED first-person-preview.png');
  await browser.close();
})().catch(err => { console.error('FAIL', err); process.exit(1); });
