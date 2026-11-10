const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Users\\Lenovo\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox','--disable-gpu-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--force-device-scale-factor=1']
  });
  const page = await browser.newPage();
  await page.setViewport({width:640,height:400,deviceScaleFactor:1});
  page.on('pageerror', e => console.error('ERR', e.message));
  await page.goto('http://127.0.0.1:8123/index.html?fp=1&debug=1', {waitUntil:'load', timeout:180000});
  await new Promise(r=>setTimeout(r,3000));
  const initial = await page.evaluate(()=>window.__fpDebug.state.pos.toArray());
  await page.evaluate(()=>{ window.__fpDebug.state.yaw = 0; });
  await page.keyboard.down('w');
  await new Promise(r=>setTimeout(r,2600));
  await page.keyboard.up('w');
  const afterForward = await page.evaluate(()=>window.__fpDebug.state.pos.toArray());
  await page.evaluate(()=>{ window.__fpDebug.state.yaw = Math.PI/2; });
  await page.keyboard.down('w');
  await new Promise(r=>setTimeout(r,2600));
  await page.keyboard.up('w');
  const afterLeft = await page.evaluate(()=>window.__fpDebug.state.pos.toArray());
  console.log(JSON.stringify({initial, afterForward, afterLeft}));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
