const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Users\\Lenovo\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader', '--hide-scrollbars', '--disable-dev-shm-usage',
      '--force-device-scale-factor=1']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 560, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', err => { errors.push(err.message); console.error('PAGEERROR', err.message); });
  await page.goto('http://127.0.0.1:8123/index.html?t=12', { waitUntil: 'load', timeout: 180000 });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.resolve('walk-0.png') });
  await page.keyboard.press('f');
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({ path: path.resolve('walk-1.png') });
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({ path: path.resolve('walk-2.png') });
  await new Promise(r => setTimeout(r, 2600));
  await page.screenshot({ path: path.resolve('walk-3.png') });
  console.log('ERRORS', JSON.stringify(errors));
  await browser.close();
})().catch(err => { console.error('FAIL', err); process.exit(1); });
