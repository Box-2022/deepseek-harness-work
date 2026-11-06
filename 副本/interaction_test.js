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
  await page.setViewport({ width: 640, height: 400, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', err => { errors.push(err.message); console.error('PAGEERROR', err.message); });
  page.on('console', msg => { if (msg.type() === 'error') console.error('CONSOLE', msg.text()); });
  await page.goto('http://127.0.0.1:8123/index.html?skipIntro=1', { waitUntil: 'load', timeout: 180000 });
  await new Promise(r => setTimeout(r, 5000));
  const before = await page.evaluate(() => ({
    camera: window.__camera.position.toArray(),
    enabled: window.__controls.enabled,
    calls: window.__renderer.info.render.calls,
    rendered: document.body.getAttribute('data-rendered')
  }));
  await page.mouse.move(320, 220);
  await page.mouse.down();
  await page.mouse.move(230, 200, { steps: 8 });
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 1500));
  await page.mouse.wheel({ deltaY: -300 });
  await new Promise(r => setTimeout(r, 1500));
  const after = await page.evaluate(() => ({
    camera: window.__camera.position.toArray(),
    enabled: window.__controls.enabled,
    calls: window.__renderer.info.render.calls
  }));
  console.log('BEFORE', JSON.stringify(before));
  console.log('AFTER', JSON.stringify(after));
  console.log('ERRORS', errors);
  await page.screenshot({ path: path.resolve('interaction.png') });
  await browser.close();
})().catch(err => { console.error('FAIL', err); process.exit(1); });
