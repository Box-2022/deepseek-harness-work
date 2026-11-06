const puppeteer = require('puppeteer-core');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { pathToFileURL } = require('url');

function hash(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Users\\Lenovo\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader', '--hide-scrollbars', '--disable-dev-shm-usage',
      '--force-device-scale-factor=1']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 500, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', err => { errors.push(err.message); console.error('PAGEERROR', err.message); });
  const url = pathToFileURL(path.resolve('rainy-convenience-store.html')).href + '?t=12';
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  await new Promise(r => setTimeout(r, 5000));

  await page.screenshot({ path: 'orbit-before.png' });
  await page.mouse.move(400, 260);
  await page.mouse.down();
  await page.mouse.move(300, 240, { steps: 12 });
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: 'orbit-after-drag.png' });

  await page.mouse.move(400, 260);
  await page.mouse.wheel({ deltaY: -600 });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: 'orbit-after-zoom.png' });

  console.log('HASHES', {
    before: hash('orbit-before.png'),
    drag: hash('orbit-after-drag.png'),
    zoom: hash('orbit-after-zoom.png')
  });
  console.log('ERRORS', JSON.stringify(errors));
  await browser.close();
})().catch(err => { console.error('FAIL', err); process.exit(1); });
