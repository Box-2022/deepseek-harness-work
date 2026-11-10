const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Users\\Lenovo\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox','--disable-gpu-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--force-device-scale-factor=1']
  });
  const page = await browser.newPage();
  await page.setViewport({width:800,height:500,deviceScaleFactor:1});
  page.on('pageerror', e => console.error('ERR', e.message));
  await page.goto('http://127.0.0.1:8123/index.html?fp=1&debug=1&still=1', {waitUntil:'load', timeout:180000});
  await page.waitForFunction(() => document.body.getAttribute('data-rendered') === '1', {timeout:180000, polling:500});
  const data = await page.evaluate(() => {
    const d = window.__fpDebug;
    const grid = [];
    for (let z = -5.0; z <= 0.4; z += 0.25) {
      let row = '';
      for (let x = -5.5; x <= 4.1; x += 0.25) {
        let ch = d.collides(x,z) ? '#' : '.';
        if (Math.abs(x-d.state.pos.x)<0.125 && Math.abs(z-d.state.pos.z)<0.125) ch = 'S';
        row += ch;
      }
      grid.push(z.toFixed(2).padStart(5,' ') + ' ' + row);
    }
    const back = [];
    for (let z=-1.1; z>=-4.5; z-=0.1) back.push([+z.toFixed(2), d.collides(2.82,z)]);
    const cross = [];
    for (let x=0.5; x<=3.2; x+=0.1) cross.push([+x.toFixed(2), d.collides(x,-3.0)]);
    return {pos:d.state.pos.toArray(), yaw:d.state.yaw, grid, back, cross};
  });
  console.log('POS', data.pos, 'YAW', data.yaw);
  console.log(data.grid.join('\n'));
  console.log('BACK', JSON.stringify(data.back));
  console.log('CROSS', JSON.stringify(data.cross));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
