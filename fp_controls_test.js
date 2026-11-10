const puppeteer = require('puppeteer-core');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

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
  await page.setViewport({ width: 900, height: 560, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', err => { errors.push(err.message); console.error('PAGEERROR', err.message); });
  await page.goto('http://127.0.0.1:8123/index.html?fp=1&t=12', { waitUntil: 'load', timeout: 180000 });
  await new Promise(r => setTimeout(r, 3500));
  await page.screenshot({ path: 'fp-controls-start.png' });

  await page.keyboard.down('w');
  await new Promise(r => setTimeout(r, 1600));
  await page.keyboard.up('w');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'fp-controls-move.png' });

  await page.mouse.move(450, 280);
  await page.mouse.down();
  await page.mouse.move(320, 245, { steps: 10 });
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'fp-controls-look.png' });

  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'fp-controls-exit.png' });

  console.log('HASHES', {
    start: hash('fp-controls-start.png'),
    move: hash('fp-controls-move.png'),
    look: hash('fp-controls-look.png'),
    exit: hash('fp-controls-exit.png')
  });
  console.log('ERRORS', JSON.stringify(errors));
  await browser.close();
})().catch(err => { console.error('FAIL', err); process.exit(1); });
