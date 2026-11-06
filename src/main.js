/* ============================================================
   雨夜のコンビニ — Rainy Corner
   A collectible Japanese convenience-store street corner at night.
   Three.js / cel-shaded procedural diorama.
   ============================================================ */
(function () {
  'use strict';

  const app = document.getElementById('app');
  const params = new URLSearchParams(window.location.search);
  const CUSTOM_CAM = params.get('cam');
  const FORCE_TIME = params.has('t') ? parseFloat(params.get('t')) : null;
  const SKIP_INTRO = params.has('skipIntro') || params.has('static') || !!CUSTOM_CAM;
  const STILL = params.has('still');
  const COARSE_POINTER = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

  /* ------------------------------------------------------------
     Renderer / camera / controls
     ------------------------------------------------------------ */
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, COARSE_POINTER ? 1.45 : 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.setClearColor(0x000000, 0);
  app.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a1220, 0.0092);

  const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 180);

  const HERO_POS = new THREE.Vector3(20.0, 10.8, 24.3);
  const HERO_TARGET = new THREE.Vector3(-0.25, 1.8, -0.35);
  const INTRO_POS = new THREE.Vector3(30.5, 25.5, 37.5);
  const INTRO_TARGET = new THREE.Vector3(-0.5, -0.8, -0.2);

  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  const fitScale = THREE.MathUtils.clamp(1.15 / Math.max(aspect, 0.42), 1.0, 2.75);
  HERO_POS.sub(HERO_TARGET).multiplyScalar(fitScale).add(HERO_TARGET);
  INTRO_POS.sub(INTRO_TARGET).multiplyScalar(Math.max(1.0, fitScale * 0.92)).add(INTRO_TARGET);

  camera.position.copy(SKIP_INTRO ? HERO_POS : INTRO_POS);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.copy(SKIP_INTRO ? HERO_TARGET : INTRO_TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.minDistance = 6.2;
  controls.maxDistance = 72;
  // Free, unrestricted orbit: full yaw and nearly full pitch, including underside views.
  controls.minPolarAngle = 0.012;
  controls.maxPolarAngle = Math.PI - 0.012;
  controls.rotateSpeed = 0.72;
  controls.zoomSpeed = 1.05;
  controls.enabled = SKIP_INTRO;
  controls.update();

  if (CUSTOM_CAM) {
    const vals = CUSTOM_CAM.split(',').map(Number);
    if (vals.length >= 6 && vals.every(function (v) { return isFinite(v); })) {
      controls.minDistance = 0.4;
      controls.maxDistance = 120;
      camera.position.set(vals[0], vals[1], vals[2]);
      controls.target.set(vals[3], vals[4], vals[5]);
      controls.update();
    }
  }


  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, COARSE_POINTER ? 1.45 : 1.75));
  });

  /* ------------------------------------------------------------
     Small utilities
     ------------------------------------------------------------ */
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(20261105);
  const rr = function (a, b) { return a + (b - a) * rand(); };
  const clamp = THREE.MathUtils.clamp;
  const lerp = THREE.MathUtils.lerp;

  function roundRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, h * 0.5, w * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  function drawStar(ctx, cx, cy, outer, inner, points, fill, stroke) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / points;
      const r = i % 2 === 0 ? outer : inner;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.lineWidth = Math.max(2, outer * 0.08);
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  function drawPaperNoise(ctx, w, h, count, alpha) {
    for (let i = 0; i < count; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const a = rand() * alpha;
      ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
      ctx.fillRect(x, y, 1 + rand() * 1.5, 1 + rand() * 1.5);
    }
  }

  const textureCache = new Map();
  function makeTexture(w, h, draw, opts) {
    opts = opts || {};
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    draw(ctx, w, h);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (opts.repeat) {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(opts.repeat[0], opts.repeat[1]);
    }
    t.needsUpdate = true;
    return t;
  }

  /* ------------------------------------------------------------
     Procedural textures
     ------------------------------------------------------------ */
  const asphaltTex = makeTexture(512, 512, function (ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#303746');
    g.addColorStop(0.55, '#292f3d');
    g.addColorStop(1, '#343c4d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 13000; i++) {
      const v = 40 + Math.floor(rand() * 44);
      ctx.fillStyle = 'rgba(' + v + ',' + (v + 4) + ',' + (v + 10) + ',' + (0.08 + rand() * 0.3) + ')';
      const s = 0.6 + rand() * 2.2;
      ctx.fillRect(rand() * w, rand() * h, s, s);
    }
    for (let i = 0; i < 14; i++) {
      ctx.strokeStyle = 'rgba(15,18,26,' + (0.08 + rand() * 0.1) + ')';
      ctx.lineWidth = 0.7 + rand() * 1.6;
      ctx.beginPath();
      let x = rand() * w;
      let y = rand() * h;
      ctx.moveTo(x, y);
      for (let j = 0; j < 4; j++) {
        x += rr(-40, 42);
        y += rr(-22, 26);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // faint wet tyre tracks
    ctx.fillStyle = 'rgba(135,151,172,0.035)';
    ctx.fillRect(88, 0, 78, h);
    ctx.fillRect(330, 0, 62, h);
  }, { repeat: [4, 4] });

  const walkTex = makeTexture(512, 512, function (ctx, w, h) {
    ctx.fillStyle = '#666d79';
    ctx.fillRect(0, 0, w, h);
    const cell = 64;
    for (let y = 0; y < h; y += cell) {
      for (let x = 0; x < w; x += cell) {
        const tone = 94 + Math.floor(rand() * 16);
        ctx.fillStyle = 'rgb(' + tone + ',' + (tone + 4) + ',' + (tone + 10) + ')';
        ctx.fillRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
        if (rand() > 0.8) {
          ctx.fillStyle = 'rgba(30,34,42,0.08)';
          ctx.fillRect(x + 6, y + 8, cell - 12, cell - 16);
        }
      }
    }
    ctx.strokeStyle = 'rgba(34,38,46,0.42)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= w; i += cell) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }
    drawPaperNoise(ctx, w, h, 7600, 0.07);
    ctx.fillStyle = 'rgba(28,38,47,0.18)';
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.ellipse(rand() * w, rand() * h, rr(4, 22), rr(2, 10), rand() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, { repeat: [5, 5] });

  const forecourtTex = makeTexture(512, 512, function (ctx, w, h) {
    ctx.fillStyle = '#716f69';
    ctx.fillRect(0, 0, w, h);
    const cw = 128, ch = 64;
    for (let y = 0; y < h; y += ch) {
      for (let x = 0; x < w; x += cw) {
        const offset = (Math.floor(y / ch) % 2) * 46;
        const tone = 103 + Math.floor(rand() * 13);
        ctx.fillStyle = 'rgb(' + tone + ',' + (tone - 1) + ',' + (tone - 7) + ')';
        ctx.fillRect(x + offset + 1.4, y + 1.4, cw - 2.8, ch - 2.8);
      }
    }
    ctx.strokeStyle = 'rgba(45,44,42,0.38)';
    ctx.lineWidth = 1.6;
    for (let y = 0; y <= h; y += ch) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    for (let row = 0; row < h / ch; row++) {
      const offset = (row % 2) * 46;
      for (let x = -cw; x <= w + cw; x += cw) {
        ctx.beginPath();
        ctx.moveTo(x + offset, row * ch);
        ctx.lineTo(x + offset, row * ch + ch);
        ctx.stroke();
      }
    }
    drawPaperNoise(ctx, w, h, 6400, 0.05);
    ctx.fillStyle = 'rgba(25,33,40,0.1)';
    ctx.beginPath();
    ctx.ellipse(w * 0.64, h * 0.7, 60, 18, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }, { repeat: [3, 3] });

  const interiorFloorTex = makeTexture(512, 512, function (ctx, w, h) {
    ctx.fillStyle = '#e9dcc5';
    ctx.fillRect(0, 0, w, h);
    const cell = 128;
    for (let y = 0; y < h; y += cell) {
      for (let x = 0; x < w; x += cell) {
        const tone = 235 + Math.floor(rand() * 12);
        ctx.fillStyle = 'rgb(' + tone + ',' + (tone - 7) + ',' + (tone - 26) + ')';
        ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
      }
    }
    ctx.strokeStyle = 'rgba(170,151,122,0.38)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= w; i += cell) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }
    drawPaperNoise(ctx, w, h, 3200, 0.04);
  }, { repeat: [3, 3] });

  const tactileTex = makeTexture(256, 256, function (ctx, w, h) {
    ctx.fillStyle = '#d8b244';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#b78e2b';
    for (let y = 22; y < h; y += 42) {
      for (let x = 22; x < w; x += 42) {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    drawPaperNoise(ctx, w, h, 1400, 0.06);
  }, { repeat: [1, 1] });

  const glowTex = makeTexture(256, 256, function (ctx, w, h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.16, 'rgba(255,255,255,0.78)');
    g.addColorStop(0.42, 'rgba(255,255,255,0.24)');
    g.addColorStop(0.72, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

  const shadowTex = makeTexture(256, 256, function (ctx, w, h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(0,0,0,0.86)');
    g.addColorStop(0.4, 'rgba(0,0,0,0.6)');
    g.addColorStop(0.75, 'rgba(0,0,0,0.16)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

  const streakTex = makeTexture(128, 512, function (ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.12, 'rgba(255,255,255,0.42)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.2)');
    g.addColorStop(0.9, 'rgba(255,255,255,0.04)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    for (let i = 0; i < 30; i++) {
      const x = w * 0.5 + rr(-28, 28);
      ctx.globalAlpha = rr(0.15, 0.8);
      ctx.fillRect(x, rr(0, h * 0.2), rr(1, 4), rr(h * 0.35, h * 0.85));
    }
    ctx.globalAlpha = 1;
    ctx.filter = 'blur(2px)';
    const g2 = ctx.createLinearGradient(0, 0, 0, h);
    g2.addColorStop(0, 'rgba(255,255,255,0)');
    g2.addColorStop(0.4, 'rgba(255,255,255,0.11)');
    g2.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(w * 0.3, 0, w * 0.4, h);
    ctx.filter = 'none';
  });

  /* ------------------------------------------------------------
     Sign / poster / cover artwork
     ------------------------------------------------------------ */
  function martSignTexture() {
    return makeTexture(2048, 240, function (ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#fffdf3');
      g.addColorStop(1, '#f1e6cf');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e3a34c';
      ctx.fillRect(0, 0, w, 17);
      ctx.fillStyle = '#1f6d70';
      ctx.fillRect(0, 17, w, 11);
      ctx.fillStyle = '#1f6d70';
      ctx.fillRect(0, h - 12, w, 12);
      drawStar(ctx, 143, 123, 72, 31, 5, '#efa143', '#fff8e8');
      drawStar(ctx, 143, 123, 30, 13, 5, '#fff8e8');
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#155b5e';
      ctx.font = '900 102px "Yu Gothic", "Meiryo", "Hiragino Kaku Gothic ProN", sans-serif';
      ctx.fillText('HOSHI MART', 259, 104);
      ctx.fillStyle = '#c77829';
      ctx.font = '700 42px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('ほしマート', 268, 183);
      ctx.fillStyle = 'rgba(21,91,94,0.18)';
      ctx.fillRect(1190, 48, 2, 145);
      ctx.fillStyle = '#1f6d70';
      ctx.font = '900 76px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('24', 1282, 103);
      ctx.fillStyle = '#e2943d';
      ctx.font = '900 104px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('H', 1432, 103);
      ctx.fillStyle = '#155b5e';
      ctx.font = '700 31px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('OPEN 24 HOURS', 1288, 178);
      ctx.fillStyle = '#e2943d';
      ctx.font = '700 27px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('ATM  /  COFFEE  /  PARKING', 1289, 212);
    });
  }

  function martSideSignTexture() {
    return makeTexture(1024, 512, function (ctx, w, h) {
      ctx.fillStyle = '#155f62';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#0d4b4e';
      ctx.fillRect(0, 0, w, 24);
      ctx.fillStyle = '#e49a44';
      ctx.fillRect(0, h - 20, w, 20);
      drawStar(ctx, 120, 250, 76, 33, 5, '#f4b25a', '#fff8e8');
      ctx.fillStyle = '#fff9ea';
      ctx.textBaseline = 'middle';
      ctx.font = '900 104px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('HOSHI', 235, 205);
      ctx.fillText('MART', 235, 315);
      ctx.fillStyle = '#f0bb72';
      ctx.font = '700 42px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('ほしマート  ·  星町三丁目', 242, 400);
      ctx.fillStyle = 'rgba(255,250,235,0.9)';
      ctx.font = '900 47px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('24H', 828, 85);
    });
  }

  function pylonSignTexture() {
    return makeTexture(512, 1024, function (ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#fffdf4');
      g.addColorStop(1, '#f0e7d4');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#176c6e';
      ctx.fillRect(0, 0, w, 170);
      ctx.fillStyle = '#e8a047';
      ctx.fillRect(0, 170, w, 18);
      ctx.fillStyle = '#fff9ea';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      drawStar(ctx, w / 2, 66, 42, 19, 5, '#f2b35c', '#fff9ea');
      ctx.font = '900 48px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('ほしマート', w / 2, 127);
      ctx.fillStyle = '#155b5e';
      ctx.font = '900 72px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('HOSHI', w / 2, 245);
      ctx.fillText('MART', w / 2, 320);
      ctx.fillStyle = '#e38c34';
      ctx.font = '900 150px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('24H', w / 2, 460);
      ctx.fillStyle = '#1b6d70';
      ctx.fillRect(50, 552, w - 100, 2);
      ctx.font = '700 34px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('ATM', w / 2, 612);
      ctx.fillText('COFFEE', w / 2, 660);
      ctx.fillText('PARKING', w / 2, 708);
      ctx.fillStyle = '#206f70';
      roundRect(ctx, 80, 770, w - 160, 150, 16);
      ctx.fill();
      ctx.fillStyle = '#fff9ea';
      ctx.font = '700 33px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('OPEN', w / 2, 818);
      ctx.font = '900 55px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('24 HOURS', w / 2, 878);
      ctx.fillStyle = '#e8a047';
      ctx.fillRect(0, h - 18, w, 18);
      ctx.textAlign = 'left';
    });
  }

  function vendingTexture(variant) {
    return makeTexture(512, 1024, function (ctx, w, h) {
      const base = variant === 0 ? '#c94548' : '#2d73a9';
      const glow = variant === 0 ? '#ffd6ab' : '#ccf1ff';
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f5f1e7';
      ctx.fillRect(18, 18, w - 36, h - 36);
      ctx.fillStyle = variant === 0 ? '#a92f34' : '#215c87';
      ctx.fillRect(18, 18, w - 36, 112);
      ctx.fillStyle = '#fff7e8';
      ctx.font = '900 52px "Yu Gothic", "Meiryo", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(variant === 0 ? 'あったか〜い' : 'つめた〜い', w / 2, 76);
      ctx.fillStyle = '#14202b';
      ctx.fillRect(34, 148, w - 68, 600);
      const cols = 5;
      const rows = 4;
      const cellW = (w - 102) / cols;
      const cellH = 142;
      const colors = ['#f7c453', '#6dc5dd', '#eb6b75', '#80c47b', '#e7e0c8', '#a88be8', '#f29b52', '#5d9ee6'];
      for (let r = 0; r < rows; r++) {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(38, 166 + r * cellH, w - 76, 130);
        for (let c = 0; c < cols; c++) {
          const x = 72 + c * cellW;
          const y = 174 + r * cellH;
          const col = colors[(r * cols + c + variant * 3) % colors.length];
          ctx.fillStyle = col;
          roundRect(ctx, x - 18, y + 26, 36, 75, 8);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.82)';
          ctx.fillRect(x - 16, y + 44, 32, 31);
          ctx.fillStyle = 'rgba(16,28,40,0.45)';
          ctx.fillRect(x - 11, y + 51, 22, 3);
          ctx.fillRect(x - 11, y + 58, 15, 2);
          ctx.fillStyle = '#f2c14c';
          ctx.fillRect(x - 16, y + 108, 32, 5);
          ctx.fillStyle = 'rgba(210,242,255,0.85)';
          ctx.beginPath();
          ctx.arc(x + 6, y + 18, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(30,50,60,0.65)';
          ctx.font = '700 13px "Yu Gothic", sans-serif';
          ctx.fillText('¥130', x + 6, y + 18);
        }
      }
      // lower control panel
      ctx.fillStyle = '#e8e3d8';
      ctx.fillRect(34, 778, w - 68, 206);
      ctx.fillStyle = '#c5c0b4';
      ctx.fillRect(55, 802, 182, 48);
      ctx.fillStyle = '#666c73';
      ctx.font = '700 22px "Yu Gothic", sans-serif';
      ctx.fillText('CASH  /  IC', 146, 827);
      ctx.fillStyle = '#1e2a35';
      ctx.fillRect(270, 802, 172, 48);
      ctx.fillStyle = '#85e2b4';
      ctx.font = '700 24px "monospace"';
      ctx.fillText('¥ 0', 356, 827);
      ctx.fillStyle = '#777d81';
      ctx.fillRect(56, 874, 240, 34);
      ctx.fillStyle = '#5a6067';
      ctx.fillRect(318, 874, 124, 34);
      ctx.fillStyle = '#f7e7b7';
      ctx.font = '700 18px "Yu Gothic", sans-serif';
      ctx.fillText(variant === 0 ? 'HOT' : 'COLD', 380, 891);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(150, 0);
      ctx.lineTo(70, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 4;
      ctx.strokeRect(18, 18, w - 36, h - 36);
      ctx.textAlign = 'left';
    });
  }

  function posterTexture(kind) {
    const themes = [
      { bg1: '#f0b04f', bg2: '#d75c4e', ink: '#5c221f', title: 'からあげ', sub: '揚げたて 120円', badge: '新発売' },
      { bg1: '#e7efe4', bg2: '#82b8a5', ink: '#174d4a', title: 'おにぎり', sub: '毎朝にぎりたて', badge: '100円' },
      { bg1: '#213a58', bg2: '#192438', ink: '#f9e8bc', title: 'COFFEE', sub: '一杯ずつ淹れたて', badge: 'HOT' },
      { bg1: '#f1d7de', bg2: '#c9758e', ink: '#552333', title: 'いちご', sub: '春のスイーツ', badge: 'NEW' },
      { bg1: '#dcebf1', bg2: '#6ca9bf', ink: '#173b4a', title: 'アイス', sub: '夜も、ひんやり。', badge: 'COLD' },
      { bg1: '#f2e6ca', bg2: '#d1aa6c', ink: '#4e3a21', title: 'ATM', sub: '24時間ご利用可', badge: '24H' }
    ];
    const t = themes[kind % themes.length];
    return makeTexture(512, 720, function (ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, t.bg1);
      g.addColorStop(1, t.bg2);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(w * 0.82, h * 0.18, 170, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = t.badge === '24H' ? '#1b6d70' : 'rgba(255,250,238,0.9)';
      roundRect(ctx, 28, 30, 152, 56, 28);
      ctx.fill();
      ctx.fillStyle = t.badge === '24H' ? '#fff9ea' : t.ink;
      ctx.font = '900 27px "Yu Gothic", "Meiryo", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.badge, 104, 59);
      ctx.textAlign = 'left';
      ctx.fillStyle = t.ink;
      ctx.font = '900 92px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText(t.title, 34, 300);
      ctx.font = '700 33px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText(t.sub, 38, 360);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(34, 414, w - 68, 2);
      // simple appetising icon / graphic
      const cx = w * 0.55, cy = h * 0.62;
      if (kind % 3 === 0) {
        ctx.fillStyle = 'rgba(101,42,25,0.8)';
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          const xx = cx - 120 + i * 52;
          ctx.ellipse(xx, cy + Math.sin(i * 1.7) * 22, 42, 31, rr(-0.5, 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#f7c760';
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(cx - 120 + i * 52, cy + Math.sin(i * 1.7) * 22 - 5, 21, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (kind % 3 === 1) {
        ctx.fillStyle = 'rgba(255,251,238,0.92)';
        ctx.beginPath();
        ctx.moveTo(cx - 110, cy + 70);
        ctx.quadraticCurveTo(cx, cy - 130, cx + 120, cy + 70);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1f3b33';
        ctx.fillRect(cx - 52, cy + 20, 104, 46);
        ctx.fillStyle = '#e0b28d';
        ctx.beginPath();
        ctx.arc(cx + 20, cy + 42, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.72)';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.arc(cx, cy, 80, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(cx, cy, 46, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(34,44,52,0.42)';
        ctx.beginPath();
        ctx.arc(cx + 15, cy - 12, 11, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(20,26,30,0.14)';
      ctx.fillRect(0, h - 86, w, 86);
      ctx.fillStyle = t.ink;
      ctx.font = '700 22px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('HOSHI MART  星町三丁目店', 34, h - 38);
      ctx.textAlign = 'left';
    });
  }

  function magazineTexture(kind) {
    const palettes = [
      ['#f0b64c', '#d8595f', '#fff6dd'],
      ['#7eb7c9', '#375a77', '#f5efe1'],
      ['#e2a5b9', '#8f4d74', '#fff3e8'],
      ['#94b38e', '#345d52', '#f4e8cf'],
      ['#e6cf9e', '#b06d48', '#fff9ed'],
      ['#7f87c7', '#323d6d', '#f2e8d1'],
      ['#d9d5cc', '#5c6674', '#f7e5b8'],
      ['#e2a07a', '#863f38', '#fff3df']
    ];
    const p = palettes[kind % palettes.length];
    return makeTexture(256, 352, function (ctx, w, h) {
      ctx.fillStyle = p[2];
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, w, h * 0.7);
      g.addColorStop(0, p[0]);
      g.addColorStop(1, p[1]);
      ctx.fillStyle = g;
      ctx.fillRect(10, 10, w - 20, h * 0.66);
      ctx.fillStyle = 'rgba(255,255,255,0.42)';
      ctx.beginPath();
      ctx.arc(w * 0.7, h * 0.22, 63, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(22,28,36,0.35)';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.55);
      ctx.lineTo(w * 0.3, h * 0.35);
      ctx.lineTo(w * 0.58, h * 0.55);
      ctx.lineTo(w, h * 0.4);
      ctx.lineTo(w, h * 0.68);
      ctx.lineTo(0, h * 0.68);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = p[2];
      ctx.font = '900 45px "Yu Gothic", "Meiryo", sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText(['夜の街', '夏の栞', '星を待つ', '雨あがり', '小さな旅', '群青', '喫茶', '手紙'][kind % 8], 14, h * 0.69);
      ctx.fillStyle = p[1];
      ctx.font = '700 16px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText(['特集 · 街角の灯り', 'short story', 'anime visual book', 'photo & essay', 'travel note', 'illustration', 'coffee diary', 'letter'][kind % 8], 16, h * 0.9);
      ctx.strokeStyle = 'rgba(35,38,43,0.45)';
      ctx.lineWidth = 3;
      ctx.strokeRect(6, 6, w - 12, h - 12);
    });
  }

  function roadSignTexture(type) {
    if (type === 'parking') {
      return makeTexture(256, 256, function (ctx, w, h) {
        ctx.fillStyle = '#195b91';
        roundRect(ctx, 4, 4, w - 8, h - 8, 16);
        ctx.fill();
        ctx.strokeStyle = '#eef6f8';
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '900 154px "Arial Black", "Yu Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', w / 2, h / 2 - 4);
        ctx.font = '700 28px "Yu Gothic", sans-serif';
        ctx.fillText('24H', w / 2, h - 39);
      });
    }
    if (type === 'speed') {
      return makeTexture(256, 256, function (ctx, w, h) {
        ctx.fillStyle = '#f2ede2';
        ctx.beginPath(); ctx.arc(w / 2, h / 2, 120, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#c8423e';
        ctx.lineWidth = 24;
        ctx.beginPath(); ctx.arc(w / 2, h / 2, 106, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#20354c';
        ctx.font = '900 132px "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('30', w / 2, h / 2 + 8);
      });
    }
    if (type === 'street') {
      return makeTexture(512, 128, function (ctx, w, h) {
        ctx.fillStyle = '#1b6263';
        roundRect(ctx, 2, 2, w - 4, h - 4, 9);
        ctx.fill();
        ctx.strokeStyle = '#e8eee2';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.fillStyle = '#fff9e9';
        ctx.font = '700 52px "Yu Gothic", "Meiryo", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('星町三丁目', w / 2, h / 2 + 2);
        ctx.font = '700 18px "Arial", sans-serif';
        ctx.fillText('HOSHIMACHI 3', w / 2, h - 20);
      });
    }
    if (type === 'stop') {
      return makeTexture(256, 256, function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#c94742';
        ctx.beginPath();
        ctx.moveTo(26, 35);
        ctx.lineTo(w - 26, 35);
        ctx.lineTo(w / 2, h - 20);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#f5ede1';
        ctx.lineWidth = 9;
        ctx.stroke();
        ctx.fillStyle = '#fff9eb';
        ctx.font = '900 64px "Yu Gothic", "Meiryo", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('止まれ', w / 2, 103);
      });
    }
    return null;
  }

  function noticePosterTexture(kind) {
    const themes = [
      ['#f3dfb8', '#a14f3f', '秋祭り', '星町商店会'],
      ['#d7e6df', '#365f54', '防災訓練', '10月18日'],
      ['#e3d2da', '#744960', '子育て広場', '毎週水曜'],
      ['#d8dfea', '#40516d', '資源回収', '朝8時から']
    ];
    const t = themes[kind % themes.length];
    return makeTexture(256, 328, function (ctx, w, h) {
      ctx.fillStyle = t[0];
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = t[1];
      ctx.fillRect(0, 0, w, 18);
      ctx.font = '900 40px "Yu Gothic", "Meiryo", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(t[2], w / 2, 58);
      ctx.font = '700 20px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText(t[3], w / 2, 120);
      ctx.fillStyle = 'rgba(40,48,52,0.35)';
      ctx.fillRect(26, 165, w - 52, 2);
      ctx.fillStyle = 'rgba(40,48,52,0.55)';
      ctx.font = '700 15px "Yu Gothic", sans-serif';
      ctx.fillText('HOSHIMACHI', w / 2, 268);
      drawStar(ctx, w / 2, 218, 26, 11, 5, t[1], t[0]);
      ctx.strokeStyle = 'rgba(40,40,40,0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, w - 16, h - 16);
    });
  }

  function basePlaqueTexture() {
    return makeTexture(1024, 160, function (ctx, w, h) {
      ctx.fillStyle = '#131b24';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#b18b55';
      ctx.lineWidth = 3;
      ctx.strokeRect(18, 18, w - 36, h - 36);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#d8b87d';
      ctx.font = '700 30px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('雨夜のコンビニ', w / 2, 54);
      ctx.fillStyle = 'rgba(230,214,185,0.65)';
      ctx.font = '500 22px "Arial", sans-serif';
      ctx.fillText('RAINY CORNER  ·  HOSHIMACHI 3  ·  1:150', w / 2, 98);
      ctx.fillStyle = '#9d7b4b';
      ctx.fillRect(w / 2 - 135, 126, 270, 1);
      ctx.fillStyle = 'rgba(220,200,168,0.55)';
      ctx.font = '500 16px "Yu Gothic", sans-serif';
      ctx.fillText('NIGHT COLLECTION', w / 2, 141);
    });
  }

  /* ------------------------------------------------------------
     Materials
     ------------------------------------------------------------ */
  const gradientData = new Uint8Array([26, 80, 142, 206, 250]);
  const gradientMap = new THREE.DataTexture(gradientData, 5, 1, THREE.LuminanceFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.generateMipmaps = false;
  gradientMap.needsUpdate = true;

  function toon(color, opts) {
    const o = Object.assign({
      color: color,
      gradientMap: gradientMap
    }, opts || {});
    return new THREE.MeshToonMaterial(o);
  }
  function basic(color, opts) {
    return new THREE.MeshBasicMaterial(Object.assign({ color: color }, opts || {}));
  }
  function emissive(color, strength) {
    return new THREE.MeshBasicMaterial({ color: color, toneMapped: false });
  }

  const MAT = {
    asphalt: new THREE.MeshPhongMaterial({
      color: 0x737f93, map: asphaltTex, shininess: 96, specular: 0x7f9ab2
    }),
    walk: new THREE.MeshPhongMaterial({
      color: 0xa5adb9, map: walkTex, shininess: 52, specular: 0x7d8f9c
    }),
    forecourt: new THREE.MeshPhongMaterial({
      color: 0xb0aca2, map: forecourtTex, shininess: 84, specular: 0x9aa29d
    }),
    interiorFloor: toon(0xfff3dc, { map: interiorFloorTex }),
    tactile: toon(0xffffff, { map: tactileTex }),
    paint: toon(0xe8ede7),
    paintDim: toon(0xbcc5c5),
    base: toon(0x121924),
    baseSide: toon(0x0d131c),
    baseTrim: toon(0x2c3543),
    concrete: toon(0x6d7480),
    concreteDark: toon(0x4b515d),
    curb: toon(0x8a8f96),
    metal: toon(0x59626e),
    metalDark: toon(0x252d37),
    black: toon(0x121820),
    cream: toon(0xe0d0b3),
    creamDark: toon(0xc4b397),
    wall: toon(0xd5c3a6),
    wallSide: toon(0xc4b397),
    interiorWall: toon(0xe3c89d),
    interiorCeil: toon(0xd6c4a8),
    interiorAccent: toon(0xcf8742),
    teal: toon(0x1e6b6d),
    tealDark: toon(0x124a4e),
    tealLight: toon(0x4d9b96),
    orange: toon(0xe29241),
    orangeLight: toon(0xf2b25e),
    pink: toon(0xd7738c),
    glass: new THREE.MeshPhongMaterial({
      color: 0x8fbacb,
      transparent: true,
      opacity: 0.055,
      shininess: 120,
      specular: 0xdff2ff,
      side: THREE.DoubleSide,
      depthWrite: false
    }),
    glassWarm: new THREE.MeshPhongMaterial({
      color: 0xc4dde0,
      transparent: true,
      opacity: 0.07,
      shininess: 100,
      specular: 0xfff3d5,
      side: THREE.DoubleSide,
      depthWrite: false
    }),
    glassDark: new THREE.MeshPhongMaterial({
      color: 0x35515e,
      transparent: true,
      opacity: 0.32,
      shininess: 90,
      specular: 0xaaccdd,
      side: THREE.DoubleSide,
      depthWrite: false
    }),
    white: toon(0xe7dfd0),
    whiteBright: toon(0xf2eadc),
    warmGlow: emissive(0xffdca0),
    coolGlow: emissive(0xbcefff),
    signCream: toon(0xf7eedb),
    houseWall: toon(0x48515e),
    houseWall2: toon(0x3b4653),
    roof: toon(0x273b47),
    roofTile: toon(0x1e303c),
    green: toon(0x3e6154),
    greenLight: toon(0x63866d),
    foliage: toon(0x24443d),
    foliageLight: toon(0x34584c),
    wood: toon(0x80604a),
    woodDark: toon(0x4c382e),
    brick: toon(0x8c5f51),
    roadWhite: new THREE.MeshPhongMaterial({
      color: 0xd7e0db, shininess: 88, specular: 0xaed2e4
    }),
    rainBlue: new THREE.Color(0xa9cbe8)
  };

  const outlineCache = new Map();
  function outlineMaterial(thickness) {
    if (outlineCache.has(thickness)) return outlineCache.get(thickness);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x0a1018) },
        uThickness: { value: thickness }
      },
      vertexShader: [
        'uniform float uThickness;',
        'void main() {',
        '  vec3 p = position + normal * uThickness;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uColor;',
        'void main() { gl_FragColor = vec4(uColor, 1.0); }'
      ].join('\n'),
      side: THREE.BackSide,
      depthWrite: true
    });
    outlineCache.set(thickness, mat);
    return mat;
  }

  function addOutline(mesh, thickness) {
    const t = thickness || 0.012;
    const outline = new THREE.Mesh(mesh.geometry, outlineMaterial(t));
    outline.renderOrder = -1;
    outline.castShadow = false;
    outline.receiveShadow = false;
    mesh.add(outline);
    return outline;
  }

  /* ------------------------------------------------------------
     Geometry helpers
     ------------------------------------------------------------ */
  const boxGeoCache = new Map();
  function boxGeometry(w, h, d) {
    const key = w.toFixed(3) + '|' + h.toFixed(3) + '|' + d.toFixed(3);
    if (!boxGeoCache.has(key)) boxGeoCache.set(key, new THREE.BoxGeometry(w, h, d));
    return boxGeoCache.get(key);
  }

  function addBox(parent, w, h, d, mat, x, y, z, opts) {
    opts = opts || {};
    const mesh = new THREE.Mesh(boxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    if (opts.rot) mesh.rotation.set(opts.rot[0] || 0, opts.rot[1] || 0, opts.rot[2] || 0);
    if (opts.rotY) mesh.rotation.y = opts.rotY;
    mesh.castShadow = !!opts.cast;
    mesh.receiveShadow = opts.receive !== false;
    parent.add(mesh);
    if (opts.outline) addOutline(mesh, typeof opts.outline === 'number' ? opts.outline : 0.012);
    return mesh;
  }

  function addPlane(parent, w, h, mat, x, y, z, opts) {
    opts = opts || {};
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(x, y, z);
    if (opts.rot) mesh.rotation.set(opts.rot[0] || 0, opts.rot[1] || 0, opts.rot[2] || 0);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    if (opts.renderOrder !== undefined) mesh.renderOrder = opts.renderOrder;
    parent.add(mesh);
    return mesh;
  }

  function addCylinder(parent, rt, rb, h, seg, mat, x, y, z, opts) {
    opts = opts || {};
    const geo = new THREE.CylinderGeometry(rt, rb, h, seg, 1, !!opts.open);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (opts.rot) mesh.rotation.set(opts.rot[0] || 0, opts.rot[1] || 0, opts.rot[2] || 0);
    mesh.castShadow = !!opts.cast;
    mesh.receiveShadow = opts.receive !== false;
    parent.add(mesh);
    if (opts.outline) addOutline(mesh, typeof opts.outline === 'number' ? opts.outline : 0.01);
    return mesh;
  }

  function addSphere(parent, r, mat, x, y, z, opts) {
    opts = opts || {};
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(r, opts.detail === undefined ? 1 : opts.detail), mat);
    mesh.position.set(x, y, z);
    if (opts.scale) mesh.scale.set(opts.scale[0], opts.scale[1], opts.scale[2]);
    if (opts.rot) mesh.rotation.set(opts.rot[0] || 0, opts.rot[1] || 0, opts.rot[2] || 0);
    mesh.castShadow = !!opts.cast;
    mesh.receiveShadow = opts.receive !== false;
    parent.add(mesh);
    if (opts.outline) addOutline(mesh, typeof opts.outline === 'number' ? opts.outline : 0.012);
    return mesh;
  }

  function addTextSign(parent, w, h, texture, x, y, z, opts) {
    opts = opts || {};
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: !!opts.transparent,
      side: opts.side || THREE.FrontSide,
      toneMapped: false
    });
    const mesh = addPlane(parent, w, h, mat, x, y, z, opts);
    if (opts.back) {
      const back = addPlane(parent, w, h, mat, x, y, z - 0.002, {
        rot: [opts.rot ? (opts.rot[0] || 0) : 0, opts.rot ? (opts.rot[1] || 0) + Math.PI : Math.PI, 0],
        renderOrder: opts.renderOrder
      });
      back.material = mat;
    }
    return mesh;
  }

  const glowSprites = [];
  function addGlow(parent, color, size, x, y, z, opacity, opts) {
    opts = opts || {};
    const mat = new THREE.SpriteMaterial({
      map: glowTex,
      color: color,
      transparent: true,
      opacity: opacity === undefined ? 0.55 : opacity,
      depthWrite: false,
      depthTest: opts.depthTest !== false,
      blending: opts.blending === undefined ? THREE.AdditiveBlending : opts.blending,
      toneMapped: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y, z);
    sprite.scale.set(size * (opts.sx || 1), size * (opts.sy || 1), 1);
    parent.add(sprite);
    glowSprites.push({ sprite: sprite, baseOpacity: mat.opacity, delay: opts.delay === undefined ? 8.0 : opts.delay });
    return sprite;
  }

  function addContactShadow(parent, w, h, x, z, opacity, y) {
    const mat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: opacity === undefined ? 0.34 : opacity,
      depthWrite: false,
      toneMapped: false
    });
    const mesh = addPlane(parent, w, h, mat, x, y === undefined ? 0.205 : y, z, {
      rot: [-Math.PI / 2, 0, 0],
      renderOrder: 1
    });
    mesh.renderOrder = 1;
    return mesh;
  }

  function addGroundGlow(parent, color, w, d, x, z, opacity, y) {
    const mat = new THREE.MeshBasicMaterial({
      map: glowTex,
      color: color,
      transparent: true,
      opacity: opacity === undefined ? 0.28 : opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    const mesh = addPlane(parent, w, d, mat, x, y === undefined ? 0.22 : y, z, {
      rot: [-Math.PI / 2, 0, 0],
      renderOrder: 2
    });
    mesh.renderOrder = 2;
    return mesh;
  }

  function addReflectionStreak(parent, color, w, len, x, z, opacity, rotY, y) {
    const mat = new THREE.MeshBasicMaterial({
      map: streakTex,
      color: color,
      transparent: true,
      opacity: opacity === undefined ? 0.26 : opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    const mesh = addPlane(parent, w, len, mat, x, y === undefined ? 0.21 : y, z, {
      rot: [-Math.PI / 2, rotY || 0, 0],
      renderOrder: 3
    });
    mesh.renderOrder = 3;
    return mesh;
  }

  /* ------------------------------------------------------------
     Assembly animation system
     ------------------------------------------------------------ */
  const assemblyItems = [];
  let steamSpritesRef = null;
  const lightItems = [];
  const intro = {
    elapsed: SKIP_INTRO ? 999 : 0,
    duration: 10.8,
    cameraEnd: 9.4,
    rainStart: 8.8,
    cameraDone: false
  };

  function registerAssembly(node, delay, opts) {
    opts = opts || {};
    assemblyItems.push({
      node: node,
      delay: delay,
      duration: opts.duration || 0.92,
      drop: opts.drop === undefined ? 0.9 : opts.drop,
      scaleFrom: opts.scaleFrom === undefined ? 0.01 : opts.scaleFrom,
      spin: opts.spin || 0,
      homePos: node.position.clone(),
      homeRot: node.rotation.clone(),
      homeScale: node.scale.clone(),
      landed: false
    });
    node.visible = false;
    return node;
  }

  const easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
  const easeInOutCubic = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const easeOutBack = function (t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };

  function addLight(light, delay, baseIntensity) {
    light.intensity = 0;
    light.userData.baseIntensity = baseIntensity === undefined ? light.intensity || 1 : baseIntensity;
    light.userData.asmDelay = delay;
    lightItems.push(light);
    return light;
  }

  /* ------------------------------------------------------------
     Scene roots
     ------------------------------------------------------------ */
  const diorama = new THREE.Group();
  diorama.rotation.y = 0;
  scene.add(diorama);

  /* ------------------------------------------------------------
     Base
     ------------------------------------------------------------ */
  function buildBase() {
    const g = new THREE.Group();
    g.name = 'base';

    addBox(g, 22.35, 0.16, 22.35, MAT.baseTrim, 0, -0.08, 0, { cast: true, receive: true });
    addBox(g, 22.0, 1.02, 22.0, MAT.baseSide, 0, -0.62, 0, { cast: true, receive: true, outline: 0.018 });
    addBox(g, 21.72, 0.18, 21.72, MAT.base, 0, -1.18, 0, { cast: true, receive: true });
    addBox(g, 22.08, 0.12, 22.08, MAT.baseTrim, 0, -0.16, 0);

    // fine brass/cream rim line around the plinth
    const rimMat = toon(0x5c6b7b);
    addBox(g, 22.24, 0.035, 0.08, rimMat, 0, -0.11, 11.16);
    addBox(g, 22.24, 0.035, 0.08, rimMat, 0, -0.11, -11.16);
    addBox(g, 0.08, 0.035, 22.24, rimMat, 11.16, -0.11, 0);
    addBox(g, 0.08, 0.035, 22.24, rimMat, -11.16, -0.11, 0);

    // collector's plaque
    const plaqueTex = basePlaqueTexture();
    const plaque = addTextSign(g, 4.5, 0.7, plaqueTex, 0, -0.67, 11.03, { transparent: false });
    plaque.material.toneMapped = false;

    // soft halo beneath the model
    const haloMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      color: 0x3d6d95,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    const halo = addPlane(g, 31, 31, haloMat, 0, -1.42, 0, { rot: [-Math.PI / 2, 0, 0] });
    halo.renderOrder = -2;

    diorama.add(g);
    registerAssembly(g, 0.05, { duration: 1.35, drop: 3.2 });
    return g;
  }

  /* ------------------------------------------------------------
     Streets and pavement
     ------------------------------------------------------------ */
  function buildStreets() {
    const g = new THREE.Group();
    g.name = 'streets';

    const ROAD_TOP = 0.035;
    const WALK_TOP = 0.17;

    // road surfaces
    addBox(g, 22.1, 0.07, 4.4, MAT.asphalt, 0, ROAD_TOP - 0.035, 8.8, { receive: true });
    addBox(g, 4.4, 0.07, 17.6, MAT.asphalt, 8.8, ROAD_TOP - 0.035, -2.2, { receive: true });

    // main raised pavement
    addBox(g, 17.6, 0.17, 17.6, MAT.walk, -2.2, 0.085, -2.2, { receive: true });
    addBox(g, 17.62, 0.06, 0.16, MAT.curb, -2.2, 0.2, 6.61, { receive: true });
    addBox(g, 0.16, 0.06, 17.62, MAT.curb, 6.61, 0.2, -2.2, { receive: true });
    // chamfered corner curb
    addBox(g, 1.18, 0.06, 0.18, MAT.curb, 6.21, 0.2, 6.21, { rotY: Math.PI / 4, receive: true });

    // store forecourt paving strip, slightly lighter than the public pavement
    addBox(g, 11.2, 0.025, 5.55, MAT.forecourt, -0.8, 0.182, 3.38, { receive: true });
    // service strip along the right wall
    addBox(g, 2.15, 0.022, 7.1, MAT.forecourt, 5.45, 0.184, -2.75, { receive: true });
    // rear alley concrete
    addBox(g, 11.0, 0.022, 2.8, MAT.concreteDark, -0.8, 0.184, -8.15, { receive: true });

    // tactile guide strips
    function tactile(w, d, x, z, rotY) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({
        map: tactileTex, transparent: false, toneMapped: false
      }));
      m.material.map = tactileTex.clone();
      m.material.map.needsUpdate = true;
      m.material.map.wrapS = THREE.RepeatWrapping;
      m.material.map.wrapT = THREE.RepeatWrapping;
      m.material.map.repeat.set(Math.max(1, w / 0.55), Math.max(1, d / 0.55));
      m.rotation.set(-Math.PI / 2, 0, rotY || 0);
      m.position.set(x, 0.195, z);
      g.add(m);
      return m;
    }
    tactile(10.6, 0.48, -4.4, 6.16, 0);
    tactile(0.48, 10.8, 6.16, -1.5, 0);
    tactile(0.9, 0.9, 2.1, 6.05, 0);
    tactile(0.9, 0.9, 5.9, 2.2, 0);

    // lane markings
    for (let x = -9.8; x <= 9.8; x += 2.35) {
      addBox(g, 1.2, 0.012, 0.14, MAT.roadWhite, x, 0.049, 8.8, { receive: false });
    }
    for (let z = -9.6; z <= 5.3; z += 2.35) {
      addBox(g, 0.14, 0.012, 1.2, MAT.roadWhite, 8.8, 0.049, z, { receive: false });
    }
    addBox(g, 17.3, 0.012, 0.09, MAT.paintDim, -2.35, 0.048, 6.98);
    addBox(g, 0.09, 0.012, 17.1, MAT.paintDim, 6.98, 0.048, -2.25);

    // crosswalk: foreground / front road
    for (let i = 0; i < 7; i++) {
      addBox(g, 0.34, 0.012, 3.35, MAT.roadWhite, 2.45 + i * 0.57, 0.049, 8.7, { receive: false });
    }
    // crosswalk: side road
    for (let i = 0; i < 6; i++) {
      addBox(g, 3.3, 0.012, 0.34, MAT.roadWhite, 8.74, 0.049, 2.25 + i * 0.58, { receive: false });
    }
    // stop lines
    addBox(g, 4.05, 0.012, 0.28, MAT.roadWhite, 8.75, 0.049, 5.68, { receive: false });
    // parking bay markings
    const bayY = 0.198;
    const bayX = [1.45, 3.62, 5.79];
    for (let i = 0; i < 3; i++) {
      addBox(g, 0.07, 0.012, 3.35, MAT.paint, bayX[i], bayY, 4.1, { receive: false });
    }
    addBox(g, 4.4, 0.012, 0.07, MAT.paint, 3.62, bayY, 5.77, { receive: false });
    // wheel stops
    addBox(g, 1.55, 0.16, 0.18, MAT.concreteDark, 2.53, 0.24, 2.82, { receive: true, cast: true });
    addBox(g, 1.55, 0.16, 0.18, MAT.concreteDark, 4.7, 0.24, 2.82, { receive: true, cast: true });

    // painted parking P near the bay entrance
    const pMat = new THREE.MeshBasicMaterial({ map: (function () {
      return makeTexture(256, 256, function (ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(236,242,238,0.86)';
        ctx.font = '900 210px "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', w / 2, h / 2 + 6);
      });
    })(), transparent: true, toneMapped: false });
    addPlane(g, 0.9, 0.9, pMat, 2.95, 0.202, 3.7, { rot: [-Math.PI / 2, 0, 0] });

    // drain grates along the curb
    function grate(w, d, x, z, rotY) {
      const holder = new THREE.Group();
      holder.position.set(x, 0.21, z);
      holder.rotation.y = rotY || 0;
      addBox(holder, w, 0.03, d, MAT.metalDark, 0, 0, 0);
      for (let i = 0; i < Math.floor(w / 0.12); i++) {
        addBox(holder, w / Math.floor(w / 0.12) * 0.62, 0.022, d - 0.03, MAT.metal, -w / 2 + 0.06 + i * 0.12, 0.018, 0);
      }
      g.add(holder);
    }
    grate(3.6, 0.28, -1.7, 6.42, 0);
    grate(2.4, 0.26, 4.9, 6.42, 0);
    grate(2.2, 0.28, 6.42, -3.8, Math.PI / 2);

    // manhole covers
    function manhole(x, z) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.03, 20), MAT.metalDark);
      m.position.set(x, 0.057, z);
      m.receiveShadow = true;
      g.add(m);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 4, 22), MAT.metal);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0.075, z);
      g.add(ring);
      for (let i = 0; i < 5; i++) {
        addBox(g, 0.05, 0.012, 0.5, MAT.metalDark, x, 0.077, z, { rotY: i * 0.32 });
      }
    }
    manhole(-3.6, 8.25);
    manhole(8.2, -0.9);

    // "止まれ" road paint
    const stopPaint = makeTexture(512, 256, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(235,240,235,0.82)';
      ctx.font = '900 118px "Yu Gothic", "Meiryo", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('止まれ', w / 2, h / 2);
    });
    const stopMat = new THREE.MeshBasicMaterial({ map: stopPaint, transparent: true, toneMapped: false });
    addPlane(g, 2.2, 1.1, stopMat, 9.0, 0.055, 6.28, { rot: [-Math.PI / 2, 0, Math.PI / 2] });

    // puddles
    buildPuddles(g);

    diorama.add(g);
    registerAssembly(g, 0.9, { duration: 1.1, drop: 1.6 });
    return g;
  }

  function puddleShape(radius, squash, seedShift) {
    const shape = new THREE.Shape();
    const pts = 11;
    for (let i = 0; i < pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const r = radius * (0.72 + rand() * 0.36);
      const x = Math.cos(a) * r * 1.25;
      const y = Math.sin(a) * r * squash;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }

  function buildPuddles(parent) {
    const puddleMat = new THREE.MeshPhongMaterial({
      color: 0x1a2b40,
      transparent: true,
      opacity: 0.58,
      shininess: 160,
      specular: 0x8fb7cf,
      depthWrite: false
    });
    const rims = [
      [-1.2, 7.75, 1.1, 0.55, 0.18],
      [4.9, 9.4, 0.8, 0.45, -0.2],
      [7.9, 3.2, 0.9, 0.4, 0.1],
      [-7.7, 5.15, 0.65, 0.32, 0],
      [4.4, 5.35, 0.6, 0.28, 0.4],
      [-5.1, 3.2, 0.55, 0.26, 0]
    ];
    rims.forEach(function (p, i) {
      const shape = puddleShape(p[2], p[3], i);
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape, 12), puddleMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(p[0], i < 4 ? 0.214 : 0.215, p[1]);
      mesh.rotation.z = p[4];
      mesh.renderOrder = 2;
      parent.add(mesh);
      // thin rim to catch the light
      const edge = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(shape.getPoints(20).map(function (v) { return new THREE.Vector3(v.x, 0, -v.y); })),
        new THREE.LineBasicMaterial({ color: 0x7396ad, transparent: true, opacity: 0.22 })
      );
      edge.position.set(p[0], 0.218, p[1]);
      edge.rotation.y = p[4];
      parent.add(edge);
    });
  }

  /* ------------------------------------------------------------
     Store exterior
     ------------------------------------------------------------ */
  const STORE = {
    x0: -6.0,
    x1: 4.4,
    z0: -6.6,
    z1: 0.6,
    floor: 0.36,
    ceiling: 3.04,
    top: 4.26
  };

  function windowGlareTexture() {
    return makeTexture(512, 512, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.42, 'rgba(255,255,255,0.01)');
      g.addColorStop(0.5, 'rgba(220,245,255,0.08)');
      g.addColorStop(0.58, 'rgba(255,255,255,0.02)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w * 0.5, h * 0.5);
      ctx.rotate(-0.62);
      const g2 = ctx.createLinearGradient(-w * 0.5, 0, w * 0.5, 0);
      g2.addColorStop(0, 'rgba(255,255,255,0)');
      g2.addColorStop(0.5, 'rgba(220,245,255,0.3)');
      g2.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g2;
      ctx.fillRect(-w * 0.6, -w * 0.045, w * 1.2, w * 0.07);
      ctx.fillRect(-w * 0.35, -w * 0.14, w * 0.75, w * 0.025);
      ctx.restore();
    });
  }

  function windowStickerTexture() {
    return makeTexture(1024, 128, function (ctx, w, h) {
      ctx.fillStyle = '#1b696b';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f6efdd';
      ctx.font = '700 54px "Yu Gothic", "Meiryo", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('24時間営業  ·  ほしマート', w / 2, h / 2 + 2);
      ctx.fillStyle = '#e7a448';
      ctx.fillRect(12, 12, 10, h - 24);
      ctx.fillRect(w - 22, 12, 10, h - 24);
    });
  }

  function doorMatTexture() {
    return makeTexture(768, 384, function (ctx, w, h) {
      ctx.fillStyle = '#173f42';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#d8cba9';
      ctx.lineWidth = 6;
      ctx.strokeRect(22, 22, w - 44, h - 44);
      drawStar(ctx, w * 0.2, h * 0.5, 46, 20, 5, '#dfa04c', '#f6e9cd');
      ctx.fillStyle = '#f6e9cd';
      ctx.font = '900 64px "Yu Gothic", "Meiryo", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('HOSHI MART', 190, 160);
      ctx.fillStyle = '#cfa56b';
      ctx.font = '600 32px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('ようこそ  星町三丁目店', 192, 235);
      ctx.fillStyle = 'rgba(240,225,195,0.55)';
      ctx.font = '500 22px "Arial", sans-serif';
      ctx.fillText('WELCOME  ·  OPEN 24 HOURS', 192, 285);
    });
  }

  function atmPanelTexture() {
    return makeTexture(512, 256, function (ctx, w, h) {
      ctx.fillStyle = '#f1ead9';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1c6c6d';
      ctx.fillRect(0, 0, w, 92);
      ctx.fillStyle = '#fff8e7';
      ctx.font = '900 48px "Arial Black", "Yu Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ATM', w / 2, 50);
      ctx.fillStyle = '#1c5860';
      ctx.font = '700 30px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('24時間 ご利用いただけます', w / 2, 142);
      ctx.fillStyle = '#d7903f';
      ctx.fillRect(56, 190, w - 112, 4);
      ctx.fillStyle = '#845b2f';
      ctx.font = '600 22px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('BANK  ·  CASH  ·  IC', w / 2, 222);
    });
  }

  function buildStoreExterior() {
    const g = new THREE.Group();
    g.name = 'store-exterior';

    // foundation
    addBox(g, 10.9, 0.24, 7.7, MAT.concreteDark, -0.8, 0.25, -3.0, { cast: true, receive: true, outline: 0.01 });
    addBox(g, 10.88, 0.07, 7.68, MAT.concrete, -0.8, 0.4, -3.0, { receive: true });
    // main wall masses
    addBox(g, 0.24, 3.9, 7.2, MAT.wall, -6.0, 2.3, -3.0, { cast: true, outline: 0.014 });
    addBox(g, 10.4, 3.9, 0.24, MAT.wall, -0.8, 2.3, -6.6, { cast: true, outline: 0.014 });

    // right wall: solid back, glazed front section
    addBox(g, 0.24, 3.9, 3.2, MAT.wallSide, 4.4, 2.3, -5.0, { cast: true, outline: 0.014 });
    addBox(g, 0.24, 3.9, 1.0, MAT.wallSide, 4.4, 2.3, 0.1, { cast: true, outline: 0.014 });
    addBox(g, 0.24, 1.0, 3.2, MAT.wallSide, 4.4, 0.78, -1.8, { cast: true });
    addBox(g, 0.24, 1.22, 3.2, MAT.wallSide, 4.4, 3.29, -1.8, { cast: true });
    addBox(g, 0.26, 0.14, 3.2, MAT.teal, 4.4, 1.28, -1.8);
    addBox(g, 0.26, 0.14, 3.2, MAT.teal, 4.4, 2.72, -1.8);

    // painted wainscot around visible base of building
    addBox(g, 10.42, 0.42, 0.06, MAT.teal, -0.8, 0.58, 0.7, { receive: true });
    addBox(g, 0.06, 0.42, 7.2, MAT.teal, 4.52, 0.58, -3.0, { receive: true });
    addBox(g, 0.06, 0.42, 7.2, MAT.teal, -6.12, 0.58, -3.0, { receive: true });
    addBox(g, 0.06, 0.1, 7.2, MAT.tealDark, 4.53, 2.73, -3.0);
    addBox(g, 0.06, 0.1, 7.2, MAT.tealDark, -6.13, 2.73, -3.0);
    addBox(g, 10.5, 0.1, 0.06, MAT.tealDark, -0.8, 2.73, 0.72);

    // facade framing: sill band, header, columns
    addBox(g, 10.42, 0.38, 0.22, MAT.creamDark, -0.8, 0.55, 0.62, { cast: true });
    addBox(g, 10.42, 0.5, 0.22, MAT.cream, -0.8, 2.98, 0.62, { cast: true });
    addBox(g, 10.42, 1.0, 0.22, MAT.cream, -0.8, 3.73, 0.62, { cast: true });
    const columnXs = [-5.98, -1.77, 2.12, 4.38];
    columnXs.forEach(function (x) {
      addBox(g, 0.2, 2.8, 0.23, MAT.cream, x, 1.75, 0.63, { cast: true, outline: 0.009 });
      addBox(g, 0.26, 0.18, 0.27, MAT.teal, x, 0.58, 0.64);
      addBox(g, 0.26, 0.14, 0.27, MAT.teal, x, 2.68, 0.64);
    });
    // glass window A
    const glassA = addPlane(g, 3.98, 2.02, MAT.glass, -3.86, 1.73, 0.655, { renderOrder: 8 });
    glassA.material.opacity = 0.12;
    // glass window B
    const glassB = addPlane(g, 3.66, 2.02, MAT.glass, 0.19, 1.73, 0.655, { renderOrder: 8 });
    glassB.material.opacity = 0.12;
    // right side window
    const glassSide = addPlane(g, 2.9, 1.96, MAT.glass, 4.525, 1.73, -1.8, {
      rot: [0, Math.PI / 2, 0], renderOrder: 8
    });
    glassSide.material.opacity = 0.1;

    // window frames and mullions
    const frameMat = MAT.tealDark;
    addBox(g, 4.2, 0.07, 0.16, frameMat, -3.86, 0.74, 0.68);
    addBox(g, 4.2, 0.07, 0.16, frameMat, -3.86, 2.72, 0.68);
    addBox(g, 0.07, 2.05, 0.16, frameMat, -5.88, 1.73, 0.68);
    addBox(g, 0.07, 2.05, 0.16, frameMat, -1.84, 1.73, 0.68);
    addBox(g, 0.055, 2.0, 0.15, frameMat, -3.86, 1.73, 0.69);
    addBox(g, 3.85, 0.07, 0.16, frameMat, 0.19, 0.74, 0.68);
    addBox(g, 3.85, 0.07, 0.16, frameMat, 0.19, 2.72, 0.68);
    addBox(g, 0.07, 2.05, 0.16, frameMat, -1.67, 1.73, 0.68);
    addBox(g, 0.07, 2.05, 0.16, frameMat, 2.05, 1.73, 0.68);
    addBox(g, 0.055, 2.0, 0.15, frameMat, 0.19, 1.73, 0.69);
    addBox(g, 0.07, 1.98, 0.16, frameMat, 4.51, 1.73, -3.24);
    addBox(g, 0.07, 1.98, 0.16, frameMat, 4.51, 1.73, -0.36);
    addBox(g, 0.07, 0.06, 2.95, frameMat, 4.51, 0.75, -1.8);
    addBox(g, 0.07, 0.06, 2.95, frameMat, 4.51, 2.72, -1.8);

    // window decals and reflections
    addTextSign(g, 2.65, 0.2, windowStickerTexture(), -3.78, 0.87, 0.675, { transparent: false });
    const glareMatA = new THREE.MeshBasicMaterial({
      map: windowGlareTexture(), transparent: true, opacity: 0.34,
      depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false
    });
    addPlane(g, 4.1, 2.3, glareMatA, -3.86, 1.73, 0.71, { renderOrder: 9 });
    const glareMatB = glareMatA.clone();
    glareMatB.map = glareMatA.map;
    glareMatB.opacity = 0.26;
    addPlane(g, 3.8, 2.3, glareMatB, 0.2, 1.73, 0.71, { renderOrder: 9 });
    const glareMatSide = glareMatA.clone();
    glareMatSide.opacity = 0.18;
    addPlane(g, 2.0, 2.2, glareMatSide, 4.54, 1.73, -1.8, {
      rot: [0, Math.PI / 2, 0], renderOrder: 9
    });
    // automatic sliding doors
    const doorX = 3.2;
    addBox(g, 2.2, 0.14, 0.26, MAT.metalDark, doorX, 2.68, 0.66);
    addBox(g, 2.2, 0.1, 0.26, MAT.metalDark, doorX, 0.42, 0.66);
    addBox(g, 0.1, 2.35, 0.26, MAT.metalDark, 2.2, 1.54, 0.66);
    addBox(g, 0.1, 2.35, 0.26, MAT.metalDark, 4.23, 1.54, 0.66);
    // two glass leaves
    addPlane(g, 0.99, 2.12, MAT.glass, 2.71, 1.52, 0.685, { renderOrder: 8 });
    addPlane(g, 0.99, 2.12, MAT.glass, 3.71, 1.52, 0.685, { renderOrder: 8 });
    addBox(g, 0.045, 2.15, 0.09, MAT.metal, 3.2, 1.52, 0.69);
    addBox(g, 0.055, 1.0, 0.08, MAT.metal, 2.66, 1.28, 0.73);
    addBox(g, 0.055, 1.0, 0.08, MAT.metal, 3.75, 1.28, 0.73);
    addBox(g, 0.15, 0.28, 0.1, MAT.metalDark, 2.3, 2.45, 0.7);
    addBox(g, 0.045, 0.045, 0.02, MAT.orange, 2.36, 2.49, 0.77);
    // door bottom decals
    addBox(g, 0.9, 0.2, 0.012, MAT.teal, 2.7, 0.67, 0.705);
    addBox(g, 0.9, 0.2, 0.012, MAT.teal, 3.7, 0.67, 0.705);

    // entrance mat and step
    addBox(g, 2.4, 0.035, 1.08, MAT.metalDark, 3.2, 0.205, 1.2, { receive: true });
    addTextSign(g, 2.2, 0.94, doorMatTexture(), 3.2, 0.228, 1.21, {
      rot: [-Math.PI / 2, 0, 0]
    });

    // canopy
    addBox(g, 10.95, 0.18, 1.64, MAT.tealDark, -0.78, 3.07, 1.37, { cast: true, outline: 0.01 });
    addBox(g, 10.75, 0.035, 1.5, MAT.cream, -0.78, 2.975, 1.35);
    addBox(g, 10.95, 0.24, 0.1, MAT.teal, -0.78, 3.06, 2.18);
    addBox(g, 0.1, 0.22, 1.6, MAT.teal, -6.22, 3.06, 1.38);
    addBox(g, 0.1, 0.22, 1.6, MAT.teal, 4.52, 3.06, 1.38);
    // canopy downlights
    [-4.15, -1.55, 1.0, 3.55].forEach(function (x) {
      addCylinder(g, 0.085, 0.085, 0.035, 14, MAT.warmGlow, x, 2.925, 1.36);
      addGlow(g, 0xffd89f, 0.52, x, 2.9, 1.38, 0.28, { delay: 5.95 });
    });
    addGroundGlow(g, 0xffd79d, 6.2, 3.0, -1.1, 1.55, 0.14, 0.24);
    // main illuminated sign
    addBox(g, 10.86, 1.34, 0.16, MAT.tealDark, -0.8, 3.73, 0.69);
    addTextSign(g, 10.62, 1.12, martSignTexture(), -0.8, 3.73, 0.78);
    addGlow(g, 0x79e2dc, 3.5, -5.9, 3.7, 0.84, 0.19, { delay: 6.1 });
    addGlow(g, 0xf5ae63, 4.4, 1.8, 3.7, 0.84, 0.14, { delay: 6.1 });
    addGlow(g, 0x7fe8dd, 3.2, -4.8, 3.15, 1.55, 0.08, { delay: 6.2 });
    addGlow(g, 0xffb36e, 3.6, 2.6, 2.7, 1.5, 0.1, { delay: 6.2 });

    const signSpill = new THREE.PointLight(0x55d8ce, 0.65, 8, 1.7);
    signSpill.position.set(-4.3, 2.95, 1.8);
    diorama.add(signSpill);
    addLight(signSpill, 6.25, 0.65);

    const warmSpill = new THREE.PointLight(0xff9a4f, 0.55, 7.5, 1.7);
    warmSpill.position.set(2.0, 2.5, 1.8);
    diorama.add(warmSpill);
    addLight(warmSpill, 6.35, 0.55);

    // side sign
    addBox(g, 0.14, 1.58, 3.18, MAT.tealDark, 4.49, 3.65, -1.85);
    addTextSign(g, 3.02, 1.45, martSideSignTexture(), 4.57, 3.65, -1.85, {
      rot: [0, Math.PI / 2, 0]
    });

    // small ATM sign near side window
    addBox(g, 0.06, 0.48, 1.2, MAT.tealDark, 4.54, 2.48, -0.8);
    addTextSign(g, 1.1, 0.4, makeTexture(512, 192, function (ctx, w, h) {
      ctx.fillStyle = '#195e62';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f8e8b5';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 82px "Arial Black", sans-serif';
      ctx.fillText('ATM', w / 2, h / 2 + 3);
      ctx.strokeStyle = 'rgba(255,240,200,0.65)';
      ctx.lineWidth = 5;
      ctx.strokeRect(9, 9, w - 18, h - 18);
    }), 4.58, 2.48, -0.8, { rot: [0, Math.PI / 2, 0] });

    // vertical facade trims and drainpipes
    [-5.93, 4.33].forEach(function (x) {
      addCylinder(g, 0.055, 0.055, 3.7, 10, MAT.metalDark, x, 2.35, 0.72, { cast: true });
      addCylinder(g, 0.1, 0.1, 0.08, 10, MAT.metalDark, x, 0.61, 0.72);
    });
    addBox(g, 10.3, 0.045, 0.045, MAT.metalDark, -0.8, 2.62, 0.71);

    // security camera under canopy
    addBox(g, 0.22, 0.16, 0.42, MAT.white, 4.0, 2.82, 1.85);
    addCylinder(g, 0.055, 0.07, 0.18, 8, MAT.black, 3.93, 2.82, 2.05, { rot: [Math.PI / 2, 0, 0] });
    addGlow(g, 0xff6655, 0.14, 3.93, 2.77, 2.1, 0.5, { delay: 6.5 });
    // rooftop plant
    addBox(g, 10.72, 0.14, 7.42, MAT.roof, -0.8, 4.34, -3.0, { cast: true, outline: 0.013 });
    addBox(g, 10.86, 0.2, 0.16, MAT.tealDark, -0.8, 4.48, 0.62);
    addBox(g, 10.86, 0.2, 0.16, MAT.tealDark, -0.8, 4.48, -6.62);
    addBox(g, 0.16, 0.2, 7.3, MAT.tealDark, -6.2, 4.48, -3.0);
    addBox(g, 0.16, 0.2, 7.3, MAT.tealDark, 4.52, 4.48, -3.0);
    // roof AC units
    function roofAC(x, z, rot) {
      addBox(g, 1.0, 0.65, 0.8, MAT.creamDark, x, 4.74, z, { rotY: rot, cast: true, outline: 0.008 });
      addBox(g, 0.86, 0.46, 0.04, MAT.metalDark, x, 4.73, z + 0.42, { rotY: rot });
      const fan = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 4, 16), MAT.metal);
      fan.position.set(x, 4.73, z + 0.45);
      fan.rotation.y = rot;
      g.add(fan);
      addBox(g, 0.9, 0.04, 0.06, MAT.metal, x, 4.44, z + 0.4);
    }
    roofAC(-4.0, -4.1, 0);
    roofAC(1.4, -4.9, Math.PI);
    addCylinder(g, 0.07, 0.07, 1.0, 8, MAT.metal, 2.8, 4.9, -5.9, { cast: true });
    addCylinder(g, 0.2, 0.2, 0.12, 10, MAT.metalDark, 2.8, 5.38, -5.9);
    // vent pipe
    addCylinder(g, 0.11, 0.11, 1.2, 8, MAT.metal, -5.3, 4.94, -5.8, { cast: true });
    addCylinder(g, 0.17, 0.17, 0.09, 10, MAT.metalDark, -5.3, 5.54, -5.8);

    // side awning over vending machines
    addBox(g, 1.45, 0.13, 2.65, MAT.tealDark, 5.18, 2.7, -3.85, { cast: true, outline: 0.008 });
    addBox(g, 1.36, 0.03, 2.5, MAT.cream, 5.18, 2.61, -3.85);
    addBox(g, 0.08, 0.18, 2.65, MAT.teal, 5.87, 2.7, -3.85);
    addGlow(g, 0xffd39d, 1.4, 5.4, 2.54, -3.9, 0.15, { delay: 6.2 });

    // small floodlight over the rear service door
    addBox(g, 0.18, 0.1, 0.28, MAT.metalDark, 4.5, 3.35, -5.7);
    addCylinder(g, 0.07, 0.07, 0.05, 8, MAT.warmGlow, 4.62, 3.3, -5.7, { rot: [0, 0, Math.PI / 2] });
    addGlow(g, 0xffce87, 0.55, 4.72, 3.3, -5.7, 0.2, { delay: 6.9 });

    // split the facade into separate build stages so the shop assembles piece by piece
    const lowerGroup = new THREE.Group();
    const roofGroup = new THREE.Group();
    const topGroup = new THREE.Group();
    const children = g.children.slice();
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const y = child.position ? child.position.y : 0;
      if (y >= 4.05) roofGroup.add(child);
      else if (y >= 2.78) topGroup.add(child);
      else lowerGroup.add(child);
    }
    diorama.add(lowerGroup);
    diorama.add(roofGroup);
    diorama.add(topGroup);
    registerAssembly(lowerGroup, 1.62, { duration: 1.15, drop: 1.8, scaleFrom: 0.03 });
    registerAssembly(roofGroup, 4.48, { duration: 0.85, drop: 1.0, scaleFrom: 0.04 });
    registerAssembly(topGroup, 5.12, { duration: 0.95, drop: 0.8, scaleFrom: 0.04 });
    return g;
  }

  /* ------------------------------------------------------------
     Store interior
     ------------------------------------------------------------ */
  const PRODUCT_CENTER = new THREE.Vector3(-0.8, 1.15, -3.0);
  const productPalette = [
    0xf1c45e, 0xea7f7f, 0x64bfd6, 0x7ec47d, 0xe7d5b1,
    0xef9fbb, 0xa78bdc, 0x59c7b2, 0xee8c4b, 0x79a8e0,
    0xf6dc8d, 0xc7a06d
  ];

  class InstBatch {
    constructor(geometry, material) {
      this.geometry = geometry;
      this.material = material;
      this.items = [];
    }
    add(x, y, z, sx, sy, sz, color, ry) {
      this.items.push({
        p: new THREE.Vector3(x - PRODUCT_CENTER.x, y - PRODUCT_CENTER.y, z - PRODUCT_CENTER.z),
        s: new THREE.Vector3(sx, sy, sz),
        color: color,
        ry: ry || 0
      });
    }
    build(parent) {
      if (!this.items.length) return null;
      const mesh = new THREE.InstancedMesh(this.geometry, this.material, this.items.length);
      const dummy = new THREE.Object3D();
      const col = new THREE.Color();
      for (let i = 0; i < this.items.length; i++) {
        const it = this.items[i];
        dummy.position.copy(it.p);
        dummy.rotation.set(0, it.ry, 0);
        dummy.scale.copy(it.s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, col.setHex(it.color).convertSRGBToLinear());
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.frustumCulled = false;
      parent.add(mesh);
      return mesh;
    }
  }

  const productBoxes = new InstBatch(new THREE.BoxGeometry(1, 1, 1), toon(0xffffff));
  const productCans = new InstBatch(new THREE.CylinderGeometry(0.5, 0.5, 1, 8), toon(0xffffff));
  const productBottles = new InstBatch(new THREE.CylinderGeometry(0.5, 0.54, 1, 7), toon(0xffffff));

  function priceStripTexture() {
    return makeTexture(1024, 96, function (ctx, w, h) {
      ctx.fillStyle = '#f5f0e3';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#d7d0c0';
      ctx.fillRect(0, 0, w, 4);
      let x = 8;
      const colors = ['#d7a43a', '#bb4f4e', '#3f7f84', '#c27a42', '#4f7e52'];
      let i = 0;
      while (x < w) {
        const cw = 72 + Math.floor(rand() * 28);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(x, 20, cw, 46);
        ctx.fillStyle = '#fffdf3';
        ctx.font = '700 23px "Arial", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const prices = ['¥128', '¥150', '¥98', '¥198', '¥120', '¥168'];
        ctx.fillText(prices[i % prices.length], x + cw / 2, 43);
        ctx.fillStyle = 'rgba(70,62,48,0.45)';
        ctx.fillRect(x, 72, cw - 4, 2);
        x += cw + 8;
        i++;
      }
      ctx.textAlign = 'left';
    });
  }

  function fridgeHeaderTexture(label, color) {
    return makeTexture(512, 128, function (ctx, w, h) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(0, h - 8, w, 8);
      ctx.fillStyle = '#fffaf0';
      ctx.font = '900 52px "Yu Gothic", "Meiryo", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, w / 2, h / 2 + 1);
      drawStar(ctx, 28, h / 2, 15, 7, 5, '#f1c977');
      ctx.textAlign = 'left';
    });
  }

  function hangingSignTexture(title, sub, bg, ink, accent, arrow) {
    return makeTexture(1024, 256, function (ctx, w, h) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, w, 18);
      ctx.fillRect(0, h - 18, w, 18);
      ctx.fillStyle = ink;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = '900 74px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText(title, 54, 116);
      ctx.font = '600 28px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillStyle = accent;
      ctx.fillText(sub, 58, 188);
      if (arrow) {
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.moveTo(w - 120, 86);
        ctx.lineTo(w - 40, 128);
        ctx.lineTo(w - 120, 170);
        ctx.lineTo(w - 120, 146);
        ctx.lineTo(w - 174, 146);
        ctx.lineTo(w - 174, 110);
        ctx.lineTo(w - 120, 110);
        ctx.closePath();
        ctx.fill();
      }
    });
  }

  function registerScreenTexture() {
    return makeTexture(512, 384, function (ctx, w, h) {
      ctx.fillStyle = '#d8efe5';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1d4b48';
      ctx.fillRect(0, 0, w, 58);
      ctx.fillStyle = '#f7f3e5';
      ctx.font = '700 28px "Yu Gothic", "Meiryo", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('HOSHI MART  POS', 20, 29);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, 82, w - 40, 240);
      ctx.fillStyle = '#556b61';
      ctx.font = '600 22px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('からあげ', 38, 122);
      ctx.fillText('コーヒー M', 38, 166);
      ctx.fillText('おにぎり 2', 38, 210);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#2d3a33';
      ctx.fillText('¥240', w - 40, 122);
      ctx.fillText('¥150', w - 40, 166);
      ctx.fillText('¥260', w - 40, 210);
      ctx.fillStyle = '#2e7d63';
      ctx.fillRect(20, 282, w - 40, 24);
      ctx.fillStyle = '#f8f5e8';
      ctx.textAlign = 'left';
      ctx.font = '700 20px "Yu Gothic", sans-serif';
      ctx.fillText('合計  ¥650', 38, 294);
      ctx.fillStyle = '#7bb79c';
      ctx.fillRect(20, 342, 220, 26);
      ctx.fillStyle = '#1c483d';
      ctx.font = '700 20px "Yu Gothic", sans-serif';
      ctx.fillText('現金  ·  IC', 42, 355);
    });
  }

  function coffeeScreenTexture() {
    return makeTexture(256, 384, function (ctx, w, h) {
      ctx.fillStyle = '#1b252c';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#73d1cc';
      ctx.font = '700 27px "Arial", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('COFFEE', w / 2, 48);
      const g = ctx.createLinearGradient(0, 100, 0, 300);
      g.addColorStop(0, '#5c351e');
      g.addColorStop(1, '#1d120c');
      ctx.fillStyle = g;
      roundRect(ctx, 40, 90, w - 80, 150, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(250,243,226,0.75)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(w / 2, 155, 38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#f1dfb6';
      ctx.font = '700 24px "Yu Gothic", sans-serif';
      ctx.fillText('HOT', w / 2, 214);
      ctx.fillStyle = '#efb35b';
      ctx.fillRect(44, 292, w - 88, 44);
      ctx.fillStyle = '#30221a';
      ctx.font = '700 22px "Yu Gothic", sans-serif';
      ctx.fillText('いれたて', w / 2, 315);
    });
  }

  function wallClockTexture() {
    return makeTexture(256, 256, function (ctx, w, h) {
      ctx.fillStyle = '#f5f0e2';
      ctx.beginPath(); ctx.arc(w / 2, h / 2, 118, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#285c5e';
      ctx.lineWidth = 10;
      ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.strokeStyle = i % 3 === 0 ? '#285c5e' : '#9aa49b';
        ctx.lineWidth = i % 3 === 0 ? 5 : 3;
        ctx.beginPath();
        ctx.moveTo(w / 2 + Math.cos(a) * 88, h / 2 + Math.sin(a) * 88);
        ctx.lineTo(w / 2 + Math.cos(a) * 103, h / 2 + Math.sin(a) * 103);
        ctx.stroke();
      }
      ctx.strokeStyle = '#20343b';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2);
      ctx.lineTo(w / 2 - 36, h / 2 - 34);
      ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2);
      ctx.lineTo(w / 2 + 44, h / 2 - 12);
      ctx.stroke();
      ctx.fillStyle = '#d78f41';
      ctx.beginPath(); ctx.arc(w / 2, h / 2, 8, 0, Math.PI * 2); ctx.fill();
    });
  }

  function addPriceStrip(parent, width, x, y, z, ry) {
    const mat = parent.userData.priceMat || (parent.userData.priceMat = new THREE.MeshBasicMaterial({
      map: priceStripTexture(), toneMapped: false
    }));
    const mesh = addPlane(parent, width, 0.08, mat, x, y, z, {
      rot: [0, ry || 0, 0]
    });
    return mesh;
  }

  function buildStoreInterior() {
    const g = new THREE.Group();
    g.name = 'store-interior';

    const FLOOR = STORE.floor;
    const CEIL = STORE.ceiling;

    // floor / ceiling / inner surfaces
    addBox(g, 10.24, 0.06, 7.0, MAT.interiorFloor, -0.8, FLOOR + 0.03, -3.0, { receive: true });
    addBox(g, 10.24, 0.06, 7.0, MAT.interiorCeil, -0.8, CEIL, -3.0, { receive: true });
    addBox(g, 10.12, 2.62, 0.08, MAT.interiorWall, -0.8, 1.7, -6.47, { receive: true });
    addBox(g, 0.08, 2.62, 6.96, MAT.interiorWall, -5.88, 1.7, -3.0, { receive: true });
    addBox(g, 0.08, 2.62, 6.96, MAT.interiorWall, 4.28, 1.7, -3.0, { receive: true });
    addBox(g, 10.1, 0.32, 0.06, MAT.interiorAccent, -0.8, 2.9, -6.42);
    addBox(g, 10.1, 0.16, 0.06, MAT.teal, -0.8, 2.69, -6.41);
    addBox(g, 10.16, 0.14, 0.1, MAT.tealDark, -0.8, 0.42, -6.42);
    addBox(g, 0.1, 0.14, 6.9, MAT.tealDark, -5.84, 0.42, -3.0);
    addBox(g, 0.1, 0.14, 6.9, MAT.tealDark, 4.24, 0.42, -3.0);

    // entry floor stripe and threshold
    addBox(g, 1.9, 0.018, 0.95, MAT.teal, 3.2, FLOOR + 0.038, 0.03, { receive: false });
    addBox(g, 2.15, 0.06, 0.18, MAT.metal, 3.2, FLOOR + 0.02, 0.58);
    addBox(g, 10.1, 0.018, 0.5, toon(0xe5c48f), -0.8, FLOOR + 0.04, -6.06);

    // ceiling light troughs
    const lightRowX = [-3.4, 0.0, 2.6];
    const lightRowZ = [-5.0, -2.9, -0.8];
    lightRowZ.forEach(function (z) {
      lightRowX.forEach(function (x) {
        addBox(g, 2.15, 0.1, 0.28, MAT.metalDark, x, CEIL - 0.075, z, { receive: true });
        addBox(g, 2.03, 0.04, 0.2, MAT.warmGlow, x, CEIL - 0.13, z);
        addGlow(g, 0xffddac, 0.8, x, CEIL - 0.2, z, 0.08, { delay: 5.1 });
      });
    });
    // ceiling vents and speakers
    addBox(g, 0.7, 0.035, 0.36, MAT.metal, 3.4, CEIL - 0.06, -5.9);
    addBox(g, 0.4, 0.035, 0.4, MAT.metalDark, -4.7, CEIL - 0.06, -0.9);
    addCylinder(g, 0.13, 0.13, 0.06, 8, MAT.white, 1.6, CEIL - 0.08, -5.6);

    // back-wall refrigerators
    const fridgeTextures = [
      ['DRINKS', '#216d70'],
      ['お茶・水', '#3e7b58'],
      ['乳製品', '#708ba3'],
      ['お酒', '#865c48'],
      ['デザート', '#a35f72']
    ];
    const fridgeCenters = [-5.03, -3.76, -2.49, -1.22, 0.05];
    fridgeCenters.forEach(function (cx, idx) {
      const unit = new THREE.Group();
      unit.position.set(cx, 0, 0);
      const bodyMat = idx % 2 === 0 ? MAT.cream : toon(0xf4efe3);
      addBox(unit, 1.19, 2.48, 0.62, bodyMat, 0, FLOOR + 1.25, -6.01, { cast: false, receive: true });
      addBox(unit, 1.1, 2.18, 0.035, new THREE.MeshBasicMaterial({ color: 0x8bb8c1 }), 0, FLOOR + 1.24, -6.29);
      addBox(unit, 1.13, 0.06, 0.06, MAT.tealDark, 0, FLOOR + 2.48, -5.69);
      addBox(unit, 0.06, 2.24, 0.06, MAT.tealDark, -0.575, FLOOR + 1.24, -5.71);
      addBox(unit, 0.06, 2.24, 0.06, MAT.tealDark, 0.575, FLOOR + 1.24, -5.71);
      addBox(unit, 0.08, 2.18, 0.07, MAT.metal, 0.0, FLOOR + 1.24, -5.7);
      addPlane(unit, 1.14, 2.16, MAT.glassWarm, 0, FLOOR + 1.24, -5.685, { renderOrder: 7 });
      for (let s = 0; s < 4; s++) {
        const sy = FLOOR + 0.7 + s * 0.42;
        addBox(unit, 1.1, 0.035, 0.46, MAT.whiteBright, 0, sy, -5.93);
        addBox(unit, 1.04, 0.012, 0.025, MAT.coolGlow, 0, sy - 0.012, -5.71);
        addPriceStrip(unit, 1.06, 0, sy + 0.055, -5.695, 0);
        for (let j = 0; j < 7; j++) {
          const px = cx - 0.45 + j * 0.15 + rr(-0.008, 0.008);
          const col = productPalette[(idx * 3 + s * 2 + j) % productPalette.length];
          if (s === 0 && j % 3 === 0) {
            productCans.add(px, sy + 0.12, -5.82, 0.095, 0.17, 0.095, col, rr(-0.2, 0.2));
          } else {
            productBottles.add(px, sy + 0.14, -5.82, 0.075, 0.19, 0.075, col, rr(-0.2, 0.2));
          }
        }
      }
      // header
      addBox(unit, 1.16, 0.29, 0.06, MAT.teal, 0, FLOOR + 2.62, -5.95);
      addTextSign(unit, 1.03, 0.22, fridgeHeaderTexture(fridgeTextures[idx][0], fridgeTextures[idx][1]),
        0, FLOOR + 2.62, -5.914);
      // small handle
      addBox(unit, 0.035, 0.52, 0.05, MAT.metal, 0.47, FLOOR + 1.3, -5.62);
      addBox(unit, 0.035, 0.52, 0.05, MAT.metal, -0.47, FLOOR + 1.3, -5.62);
      addGlow(unit, 0x9fe9ff, 0.95, 0, FLOOR + 1.2, -5.64, 0.075, { delay: 4.3 + idx * 0.09 });
      g.add(unit);
      registerAssembly(unit, 2.95 + idx * 0.1, { duration: 0.85, drop: 0.8, scaleFrom: 0.05 });
    });

    // central double-sided gondola
    (function gondola() {
      const unit = new THREE.Group();
      unit.position.set(-2.15, 0, -3.12);
      addBox(unit, 5.3, 0.2, 0.9, MAT.tealDark, 0, FLOOR + 0.11, 0, { receive: true });
      addBox(unit, 5.2, 0.13, 0.8, MAT.cream, 0, FLOOR + 1.48, 0, { receive: true });
      addBox(unit, 5.05, 0.24, 0.08, MAT.teal, 0, FLOOR + 1.58, 0.37);
      const shelfHeights = [0.56, 0.91, 1.25];
      shelfHeights.forEach(function (h, si) {
        addBox(unit, 5.15, 0.04, 0.76, MAT.whiteBright, 0, FLOOR + h, 0, { receive: true });
        for (let side = 0; side < 2; side++) {
          const zoff = side === 0 ? 0.39 : -0.39;
          addPriceStrip(unit, 5.05, 0, FLOOR + h + 0.062, zoff + (side === 0 ? 0.01 : -0.01), side === 0 ? 0 : Math.PI);
        }
      });
      // side panels
      addBox(unit, 0.1, 1.38, 0.86, MAT.teal, -2.62, FLOOR + 0.79, 0);
      addBox(unit, 0.1, 1.38, 0.86, MAT.teal, 2.62, FLOOR + 0.79, 0);
      // products on both sides
      for (let si = 0; si < 3; si++) {
        const sy = FLOOR + shelfHeights[si] + 0.055;
        for (let side = -1; side <= 1; side += 2) {
          const z = -3.12 + side * 0.24;
          for (let j = 0; j < 24; j++) {
            const x = -4.65 + j * 0.215 + rr(-0.012, 0.012);
            const col = productPalette[(si * 5 + j + (side > 0 ? 3 : 0)) % productPalette.length];
            if (j % 4 === 0) {
              productBoxes.add(x, sy + 0.11, z, 0.14, 0.17, 0.12, col, rr(-0.08, 0.08));
            } else if (j % 3 === 0) {
              productCans.add(x, sy + 0.08, z, 0.105, 0.14, 0.105, col, 0);
            } else {
              productBoxes.add(x, sy + 0.1, z, 0.17, 0.13, 0.11, col, rr(-0.08, 0.08));
            }
          }
        }
      }
      // hanging aisle marker
      addBox(unit, 1.5, 0.38, 0.06, MAT.teal, 0, FLOOR + 2.15, 0.44);
      addTextSign(unit, 1.4, 0.3, makeTexture(512, 128, function (ctx, w, h) {
        ctx.fillStyle = '#1b6668';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff4dc';
        ctx.font = '900 48px "Yu Gothic", "Meiryo", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('お菓子・食品', w / 2, h / 2 + 2);
      }), 0, FLOOR + 2.15, 0.475);
      g.add(unit);
      registerAssembly(unit, 3.55, { duration: 0.95, drop: 0.7, scaleFrom: 0.04 });
    })();

    // left-wall shelving, facing into the store
    (function sideShelf() {
      const unit = new THREE.Group();
      unit.position.set(-5.52, 0, -3.55);
      addBox(unit, 0.48, 1.68, 2.3, MAT.cream, 0, FLOOR + 0.84, 0, { receive: true });
      addBox(unit, 0.54, 0.24, 2.34, MAT.teal, 0, FLOOR + 1.7, 0);
      for (let s = 0; s < 4; s++) {
        const sy = FLOOR + 0.55 + s * 0.35;
        addBox(unit, 0.5, 0.035, 2.24, MAT.whiteBright, 0, sy, 0);
        addPlane(unit, 2.16, 0.075, new THREE.MeshBasicMaterial({
          map: priceStripTexture(), toneMapped: false
        }), 0.262, sy + 0.06, 0, { rot: [0, Math.PI / 2, 0] });
        for (let j = 0; j < 11; j++) {
          const z = -3.55 - 1.02 + j * 0.2;
          const col = productPalette[(s * 3 + j + 2) % productPalette.length];
          productBoxes.add(-5.52 + 0.29, sy + 0.11, z, 0.18, 0.16, 0.14, col, 0);
        }
      }
      g.add(unit);
      registerAssembly(unit, 3.72, { duration: 0.9, drop: 0.65, scaleFrom: 0.04 });
    })();

    // magazine rack by the front-left window
    (function magazineRack() {
      const unit = new THREE.Group();
      unit.position.set(-4.78, 0, -1.18);
      addBox(unit, 2.48, 0.72, 0.54, MAT.woodDark, 0, FLOOR + 0.37, 0, { receive: true });
      addBox(unit, 2.55, 0.07, 0.62, MAT.wood, 0, FLOOR + 0.76, 0);
      const mats = [];
      for (let i = 0; i < 8; i++) {
        mats.push(new THREE.MeshBasicMaterial({ map: magazineTexture(i), toneMapped: false }));
      }
      const tiers = [0.82, 1.09, 1.36];
      tiers.forEach(function (ty, ti) {
        addBox(unit, 2.44, 0.045, 0.08, MAT.tealDark, 0, FLOOR + ty - 0.17, 0.25);
        for (let j = 0; j < 6; j++) {
          const mx = -1.05 + j * 0.42;
          const cover = addPlane(unit, 0.36, 0.48, mats[(ti * 6 + j) % mats.length],
            mx, FLOOR + ty, 0.24, { rot: [-0.18, 0, 0] });
          cover.renderOrder = 4;
        }
      });
      addBox(unit, 2.5, 0.08, 0.06, MAT.teal, 0, FLOOR + 1.53, 0.3);
      g.add(unit);
      registerAssembly(unit, 3.95, { duration: 0.9, drop: 0.6, scaleFrom: 0.04 });
    })();

    // ice-cream chest freezer near window B
    (function freezer() {
      const unit = new THREE.Group();
      unit.position.set(-1.05, 0, -1.15);
      addBox(unit, 2.15, 0.78, 0.98, MAT.whiteBright, 0, FLOOR + 0.39, 0, { cast: true, receive: true });
      addBox(unit, 2.06, 0.08, 0.9, MAT.teal, 0, FLOOR + 0.8, 0);
      addBox(unit, 1.9, 0.04, 0.74, MAT.coolGlow, 0, FLOOR + 0.875, 0);
      addPlane(unit, 1.92, 0.72, MAT.glass, 0, FLOOR + 0.9, 0.04, { rot: [-Math.PI / 2, 0, 0], renderOrder: 8 });
      for (let i = 0; i < 14; i++) {
        productBoxes.add(-1.05 - 0.8 + (i % 7) * 0.26, FLOOR + 0.82, -1.15 - 0.24 + Math.floor(i / 7) * 0.42,
          0.18, 0.13, 0.15, productPalette[(i + 3) % productPalette.length], 0);
      }
      addTextSign(unit, 1.7, 0.32, makeTexture(512, 96, function (ctx, w, h) {
        ctx.fillStyle = '#f7f0df';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1d6a6c';
        ctx.font = '900 43px "Yu Gothic", "Meiryo", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('アイスクリーム', w / 2, h / 2 + 2);
      }), 0, FLOOR + 0.55, 0.501);
      addGlow(unit, 0xa9eaff, 1.5, 0, FLOOR + 0.7, 0, 0.06, { delay: 4.8 });
      g.add(unit);
      registerAssembly(unit, 4.0, { duration: 0.9, drop: 0.65, scaleFrom: 0.04 });
    })();

    // cash counter + equipment
    (function counter() {
      const unit = new THREE.Group();
      // main run
      addBox(unit, 2.9, 0.96, 0.7, MAT.cream, 2.32, FLOOR + 0.48, -4.62, { cast: true, receive: true });
      addBox(unit, 2.8, 0.22, 0.03, MAT.teal, 2.32, FLOOR + 0.23, -4.265);
      addBox(unit, 3.02, 0.08, 0.82, MAT.wood, 2.32, FLOOR + 1.0, -4.62, { cast: true });
      addBox(unit, 2.86, 0.07, 0.74, MAT.woodDark, 2.32, FLOOR + 0.92, -4.62);
      // return
      addBox(unit, 0.65, 0.96, 2.2, MAT.cream, 3.63, FLOOR + 0.48, -3.55, { cast: true, receive: true });
      addBox(unit, 0.77, 0.08, 2.34, MAT.wood, 3.63, FLOOR + 1.0, -3.55, { cast: true });
      addBox(unit, 0.03, 0.22, 2.14, MAT.teal, 3.955, FLOOR + 0.23, -3.55);
      addBox(unit, 0.58, 0.55, 1.95, MAT.teal, 3.6, FLOOR + 0.36, -3.55);
      // counter logo
      addTextSign(unit, 1.0, 0.35, makeTexture(512, 192, function (ctx, w, h) {
        ctx.fillStyle = '#1d6a6c';
        ctx.fillRect(0, 0, w, h);
        drawStar(ctx, 78, 96, 43, 18, 5, '#eab160', '#fdf3dd');
        ctx.fillStyle = '#fff4df';
        ctx.font = '900 54px "Yu Gothic", "Meiryo", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('HOSHI', 137, 78);
        ctx.fillText('MART', 137, 132);
      }), 2.32, FLOOR + 0.62, -4.265);

      // register
      addBox(unit, 0.46, 0.25, 0.34, MAT.metalDark, 2.75, FLOOR + 1.18, -4.6, { cast: true });
      addBox(unit, 0.5, 0.42, 0.08, MAT.metalDark, 2.75, FLOOR + 1.45, -4.45, { rot: [-0.16, 0, 0] });
      addTextSign(unit, 0.39, 0.29, registerScreenTexture(), 2.75, FLOOR + 1.46, -4.401, { rot: [-0.16, 0, 0] });
      addBox(unit, 0.24, 0.05, 0.17, MAT.metal, 3.12, FLOOR + 1.08, -4.6);
      addBox(unit, 0.15, 0.22, 0.08, MAT.white, 2.32, FLOOR + 1.1, -4.56);

      // hot snack warmer
      addBox(unit, 0.68, 0.1, 0.48, MAT.metalDark, 1.43, FLOOR + 1.1, -4.6);
      addBox(unit, 0.62, 0.05, 0.4, MAT.warmGlow, 1.43, FLOOR + 1.17, -4.6);
      addPlane(unit, 0.6, 0.42, MAT.glassWarm, 1.43, FLOOR + 1.4, -4.6, { rot: [0, 0, 0], renderOrder: 7 });
      addBox(unit, 0.64, 0.035, 0.42, MAT.metal, 1.43, FLOOR + 1.62, -4.6);
      for (let i = 0; i < 7; i++) {
        addSphere(unit, 0.075, MAT.orangeLight, 1.2 + (i % 4) * 0.12, FLOOR + 1.26, -4.7 + Math.floor(i / 4) * 0.16,
          { scale: [1, 0.72, 1], detail: 1 });
      }
      addGlow(unit, 0xffb15e, 0.7, 1.43, FLOOR + 1.35, -4.58, 0.16, { delay: 5.1 });
      addTextSign(unit, 0.55, 0.12, makeTexture(512, 96, function (ctx, w, h) {
        ctx.fillStyle = '#d58a3b';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff3dc';
        ctx.font = '900 38px "Yu Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HOT SNACK', w / 2, h / 2 + 2);
      }), 1.43, FLOOR + 1.53, -4.382);

      // coffee machine
      addBox(unit, 0.56, 0.78, 0.42, MAT.metalDark, 3.33, FLOOR + 1.42, -4.58, { cast: true });
      addBox(unit, 0.48, 0.12, 0.08, MAT.metal, 3.33, FLOOR + 1.72, -4.34);
      addTextSign(unit, 0.35, 0.48, coffeeScreenTexture(), 3.33, FLOOR + 1.43, -4.365);
      addBox(unit, 0.1, 0.18, 0.08, MAT.metal, 3.33, FLOOR + 1.2, -4.35);
      addCylinder(unit, 0.065, 0.05, 0.12, 10, MAT.white, 3.33, FLOOR + 1.11, -4.39);
      addGlow(unit, 0x7ce6de, 0.5, 3.33, FLOOR + 1.4, -4.35, 0.11, { delay: 5.15 });

      // customer-side small display
      addBox(unit, 0.28, 0.14, 0.07, MAT.metalDark, 2.35, FLOOR + 1.15, -4.25);
      addBox(unit, 0.23, 0.09, 0.01, MAT.coolGlow, 2.35, FLOOR + 1.15, -4.21);

      g.add(unit);
      registerAssembly(unit, 4.32, { duration: 1.0, drop: 0.75, scaleFrom: 0.04 });
      addLight(new THREE.PointLight(0xffcc8c, 0.62, 7.5, 1.4), 5.3, 0.62)
        .position.set(2.0, 2.45, -4.25);
      diorama.add(lightItems[lightItems.length - 1]);
    })();

    // cigarette / service cabinet behind counter
    (function cigaretteCabinet() {
      const unit = new THREE.Group();
      unit.position.set(0, 0, 0);
      addBox(unit, 2.85, 1.55, 0.18, MAT.creamDark, 2.28, FLOOR + 1.8, -6.38, { receive: true });
      addBox(unit, 2.72, 1.42, 0.06, MAT.metalDark, 2.28, FLOOR + 1.8, -6.28);
      const packColors = [0xd2b477, 0xe8e2cf, 0x8aafc6, 0xd47f6f, 0x6f8f7e, 0xe1c4c0, 0x8998b0];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 12; c++) {
          const x = 1.1 + c * 0.205;
          const y = FLOOR + 1.32 + r * 0.21;
          productBoxes.add(x, y, -6.23, 0.115, 0.15, 0.025, packColors[(r + c) % packColors.length], 0);
        }
      }
      addBox(unit, 2.7, 0.2, 0.05, MAT.teal, 2.28, FLOOR + 2.67, -6.22);
      addTextSign(unit, 2.55, 0.16, makeTexture(1024, 96, function (ctx, w, h) {
        ctx.fillStyle = '#1a6668';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff4dc';
        ctx.font = '900 43px "Yu Gothic", "Meiryo", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('たばこ  ·  SERVICE COUNTER', w / 2, h / 2 + 2);
      }), 2.28, FLOOR + 2.67, -6.19);
      g.add(unit);
      registerAssembly(unit, 4.1, { duration: 0.9, drop: 0.6, scaleFrom: 0.04 });
    })();

    // ATM near the side window
    (function atm() {
      const unit = new THREE.Group();
      unit.position.set(4.0, 0, -1.3);
      addBox(unit, 0.7, 1.7, 0.72, MAT.creamDark, 0, FLOOR + 0.85, 0, { cast: true, receive: true });
      addBox(unit, 0.74, 0.16, 0.76, MAT.teal, 0, FLOOR + 1.65, 0);
      addBox(unit, 0.54, 0.42, 0.05, MAT.metalDark, -0.35, FLOOR + 1.22, 0.02, { rot: [0, -Math.PI / 2, 0] });
      addTextSign(unit, 0.47, 0.36, makeTexture(512, 384, function (ctx, w, h) {
        ctx.fillStyle = '#d2eee0';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#195f63';
        ctx.fillRect(0, 0, w, 64);
        ctx.fillStyle = '#fff7e6';
        ctx.font = '900 38px "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ATM', w / 2, 33);
        ctx.fillStyle = '#32675e';
        ctx.font = '700 25px "Yu Gothic", sans-serif';
        ctx.fillText('お引き出し', w / 2, 120);
        ctx.fillStyle = '#e2c477';
        ctx.fillRect(60, 166, w - 120, 44);
        ctx.fillStyle = '#4d4534';
        ctx.font = '700 23px "Yu Gothic", sans-serif';
        ctx.fillText('¥ 10,000', w / 2, 188);
        ctx.fillStyle = '#567c6a';
        ctx.fillRect(60, 250, w - 120, 38);
        ctx.fillStyle = '#eef7ec';
        ctx.font = '700 21px "Yu Gothic", sans-serif';
        ctx.fillText('確認', w / 2, 269);
      }), -0.41, FLOOR + 1.22, 0.02, { rot: [0, -Math.PI / 2, 0] });
      addBox(unit, 0.18, 0.07, 0.34, MAT.metal, -0.36, FLOOR + 1.0, 0.02);
      addGlow(unit, 0xb7f4e5, 0.7, -0.36, FLOOR + 1.2, 0.1, 0.1, { delay: 5.4 });
      addTextSign(unit, 0.62, 0.18, makeTexture(512, 128, function (ctx, w, h) {
        ctx.fillStyle = '#d9a74f';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#2d3d38';
        ctx.font = '900 58px "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ATM', w / 2, h / 2 + 3);
      }), 0, FLOOR + 1.93, 0.0);
      g.add(unit);
      registerAssembly(unit, 4.55, { duration: 0.9, drop: 0.6, scaleFrom: 0.04 });
    })();

    // basket stack by door
    (function baskets() {
      const unit = new THREE.Group();
      unit.position.set(4.0, 0, -0.22);
      for (let i = 0; i < 5; i++) {
        addBox(unit, 0.52, 0.09, 0.38, i % 2 ? MAT.teal : MAT.orange,
          0, FLOOR + 0.05 + i * 0.085, 0, { receive: true });
        addBox(unit, 0.4, 0.018, 0.3, MAT.black, 0, FLOOR + 0.09 + i * 0.085, 0);
      }
      g.add(unit);
      registerAssembly(unit, 4.85, { duration: 0.7, drop: 0.4, scaleFrom: 0.05 });
    })();

    // freestanding promo board near the entrance
    (function promo() {
      const unit = new THREE.Group();
      unit.position.set(1.55, 0, -0.55);
      addBox(unit, 0.08, 1.5, 0.08, MAT.metalDark, -0.28, FLOOR + 0.75, 0);
      addBox(unit, 0.08, 1.5, 0.08, MAT.metalDark, 0.28, FLOOR + 0.75, 0);
      addTextSign(unit, 0.68, 0.98, posterTexture(2), 0, FLOOR + 1.12, 0.05);
      addBox(unit, 0.74, 0.04, 0.1, MAT.teal, 0, FLOOR + 1.62, 0.0);
      g.add(unit);
      registerAssembly(unit, 4.95, { duration: 0.8, drop: 0.5, scaleFrom: 0.04 });
    })();

    // interior posters and clock
    addTextSign(g, 0.68, 0.95, posterTexture(0), -5.82, 1.85, -4.3, { rot: [0, Math.PI / 2, 0] });
    addTextSign(g, 0.65, 0.9, posterTexture(4), -5.82, 1.8, -5.2, { rot: [0, Math.PI / 2, 0] });
    addTextSign(g, 0.72, 1.0, posterTexture(3), 4.215, 1.85, -4.75, { rot: [0, -Math.PI / 2, 0] });
    const clock = addPlane(g, 0.65, 0.65, new THREE.MeshBasicMaterial({
      map: wallClockTexture(), transparent: true, toneMapped: false
    }), 0.9, 2.83, -6.43);
    clock.renderOrder = 4;

    // hanging aisle signs
    function hangSign(title, sub, bg, ink, accent, x, z, arrow) {
      const mat = new THREE.MeshBasicMaterial({
        map: hangingSignTexture(title, sub, bg, ink, accent, arrow),
        side: THREE.DoubleSide,
        toneMapped: false
      });
      const mesh = addPlane(g, 2.0, 0.5, mat, x, 2.36, z);
      mesh.renderOrder = 5;
      addCylinder(g, 0.008, 0.008, 0.4, 4, MAT.metalDark, x - 0.75, 2.82, z);
      addCylinder(g, 0.008, 0.008, 0.4, 4, MAT.metalDark, x + 0.75, 2.82, z);
    }
    hangSign('おにぎり・お弁当', 'RICE & BENTO', '#f3ead9', '#1d5e61', '#d79545', -3.2, -1.65, true);
    hangSign('ドリンク・お酒', 'DRINKS', '#1f6668', '#fff8e7', '#e5b366', -1.15, -1.9, true);
    hangSign('ホットスナック', 'HOT SNACK', '#e9d9be', '#803d34', '#c47e3a', 2.7, -2.25, true);

    // warm pendant lamps near the glass
    function pendant(x, z) {
      addCylinder(g, 0.008, 0.008, 0.38, 4, MAT.metalDark, x, 2.82, z);
      addCylinder(g, 0.17, 0.4, 0.22, 10, MAT.tealDark, x, 2.6, z);
      addCylinder(g, 0.05, 0.05, 0.03, 8, MAT.warmGlow, x, 2.48, z);
      addGlow(g, 0xffbe72, 0.95, x, 2.42, z, 0.2, { delay: 5.6 });
    }
    pendant(-3.0, -0.85);
    pendant(0.85, -0.7);

    // small endcap display just inside window B
    (function endcap() {
      const unit = new THREE.Group();
      unit.position.set(1.05, 0, -1.05);
      addBox(unit, 1.45, 0.12, 0.48, MAT.tealDark, 0, FLOOR + 0.06, 0, { receive: true });
      addBox(unit, 0.1, 1.12, 0.5, MAT.teal, -0.7, FLOOR + 0.62, 0);
      addBox(unit, 0.1, 1.12, 0.5, MAT.orange, 0.7, FLOOR + 0.62, 0);
      addBox(unit, 1.35, 0.07, 0.48, MAT.cream, 0, FLOOR + 1.18, 0);
      for (let s = 0; s < 3; s++) {
        const sy = FLOOR + 0.38 + s * 0.28;
        addBox(unit, 1.3, 0.035, 0.4, MAT.whiteBright, 0, sy, 0);
        for (let j = 0; j < 6; j++) {
          const px = 0.43 + j * 0.2;
          const col = productPalette[(s * 4 + j + 5) % productPalette.length];
          productBoxes.add(px, sy + 0.1, -1.05, 0.155, 0.17, 0.12, col, rr(-0.08, 0.08));
        }
      }
      addTextSign(unit, 0.9, 0.22, makeTexture(512, 112, function (ctx, w, h) {
        ctx.fillStyle = '#e2954a';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#2c2018';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '900 50px "Yu Gothic", sans-serif';
        ctx.fillText('NEW ITEMS', w / 2, h / 2 + 2);
      }), 0, FLOOR + 1.33, 0.12);
      g.add(unit);
      registerAssembly(unit, 4.25, { duration: 0.75, drop: 0.45, scaleFrom: 0.04 });
    })();

    // illuminated hot-food menu hanging above the counter area
    (function hotMenu() {
      const unit = new THREE.Group();
      unit.position.set(2.25, 0, -3.38);
      addCylinder(unit, 0.008, 0.008, 0.32, 4, MAT.metalDark, -0.7, 2.79, 0);
      addCylinder(unit, 0.008, 0.008, 0.32, 4, MAT.metalDark, 0.7, 2.79, 0);
      addBox(unit, 1.7, 0.62, 0.06, MAT.metalDark, 0, 2.42, 0);
      addTextSign(unit, 1.6, 0.53, makeTexture(1024, 384, function (ctx, w, h) {
        ctx.fillStyle = '#e39b4b';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff6e1';
        ctx.fillRect(10, 10, w - 20, h - 20);
        ctx.fillStyle = '#b55236';
        ctx.font = '900 58px "Yu Gothic", "Meiryo", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ほかほか ホットスナック', w / 2, 72);
        ctx.fillStyle = '#c98539';
        ctx.font = '700 30px "Yu Gothic", "Meiryo", sans-serif';
        ctx.fillText('からあげ  ·  肉まん  ·  コーヒー', w / 2, 132);
        ctx.fillStyle = '#7a4c2c';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(300 + i * 210, 230, 58, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = i === 1 ? '#e0a64e' : '#9a532c';
          ctx.beginPath();
          ctx.arc(300 + i * 210, 220, 42, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#7a4c2c';
        }
        ctx.fillStyle = '#2e655f';
        ctx.font = '700 26px "Yu Gothic", sans-serif';
        ctx.fillText('HOSHI MART  KITCHEN', w / 2, h - 42);
      }), 0, 2.42, 0.04);
      addGlow(unit, 0xffb35e, 1.4, 0, 2.4, 0.1, 0.13, { delay: 5.7 });
      g.add(unit);
      registerAssembly(unit, 4.7, { duration: 0.75, drop: 0.4, scaleFrom: 0.04 });
    })();

    // small promo cards clipped to the fridge glass
    for (let i = 0; i < 5; i++) {
      addTextSign(g, 0.27, 0.36, makeTexture(256, 340, function (ctx, w, h) {
        const col = i % 2 ? '#d96f4d' : '#e7b34c';
        ctx.fillStyle = col;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff7e4';
        ctx.fillRect(8, 8, w - 16, h - 16);
        ctx.fillStyle = col;
        ctx.fillRect(14, 14, w - 28, 68);
        ctx.fillStyle = '#fff8e9';
        ctx.font = '900 38px "Yu Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i % 2 ? 'SALE' : '新発売', w / 2, 49);
        ctx.fillStyle = '#5b4933';
        ctx.font = '700 34px "Arial Black", sans-serif';
        ctx.fillText(i === 2 ? '¥98' : '¥128', w / 2, 150);
        ctx.fillStyle = '#7f6c51';
        ctx.font = '600 16px "Yu Gothic", sans-serif';
        ctx.fillText('HOSHI MART', w / 2, 205);
      }), -5.0 + i * 1.25, 1.98, -5.655, { transparent: false });
    }

    // small potted plant on the counter return
    addCylinder(g, 0.09, 0.07, 0.16, 8, MAT.wood, 3.63, FLOOR + 1.12, -2.75);
    addSphere(g, 0.16, MAT.foliage, 3.63, FLOOR + 1.3, -2.75, { scale: [1.05, 0.8, 1.05], detail: 1 });
    addSphere(g, 0.11, MAT.foliageLight, 3.72, FLOOR + 1.36, -2.7, { detail: 1 });

    // baskets / small stand on the floor near the fridge
    addBox(g, 0.4, 0.3, 0.34, MAT.orange, -0.5, FLOOR + 0.15, -5.4, { receive: true });
    addBox(g, 0.36, 0.18, 0.3, MAT.cream, -0.5, FLOOR + 0.39, -5.4);

    // ceiling-mounted security camera
    addBox(g, 0.18, 0.12, 0.3, MAT.white, 2.0, CEIL - 0.25, -5.4);
    addSphere(g, 0.055, MAT.black, 1.95, CEIL - 0.26, -5.52, { detail: 1 });
    addGlow(g, 0xff5f55, 0.08, 1.95, CEIL - 0.27, -5.54, 0.8, { delay: 5.7 });

    // steam near the hot warmer
    const steamGroup = new THREE.Group();
    steamGroup.position.set(1.43, FLOOR + 1.7, -4.55);
    scene.add(steamGroup);
    const steamSprites = [];
    for (let i = 0; i < 11; i++) {
      const mat = new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xffe9cf,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        blending: THREE.NormalBlending,
        toneMapped: false
      });
      const s = new THREE.Sprite(mat);
      s.scale.set(0.28, 0.2, 1);
      s.position.set(rr(-0.22, 0.22), rr(-0.1, 0.2), rr(-0.1, 0.1));
      steamGroup.add(s);
      steamSprites.push({ sprite: s, phase: rand() * Math.PI * 2, speed: rr(0.22, 0.5), x0: s.position.x, y0: s.position.y });
    }
    steamSpritesRef = steamSprites;
    diorama.add(g);
    registerAssembly(g, 2.25, { duration: 1.25, drop: 1.2, scaleFrom: 0.04 });

    // product instancing group
    const productGroup = new THREE.Group();
    productGroup.position.copy(PRODUCT_CENTER);
    productBoxes.build(productGroup);
    productCans.build(productGroup);
    productBottles.build(productGroup);
    diorama.add(productGroup);
    registerAssembly(productGroup, 4.52, { duration: 1.25, drop: 0.2, scaleFrom: 0.04 });

    // interior lights
    const interiorLight = new THREE.PointLight(0xff8a38, 1.15, 13, 1.25);
    interiorLight.position.set(-2.1, 2.66, -1.7);
    diorama.add(interiorLight);
    addLight(interiorLight, 5.1, 1.15);

    const interiorLight2 = new THREE.PointLight(0xff9a4b, 0.95, 12, 1.25);
    interiorLight2.position.set(2.0, 2.66, -3.9);
    diorama.add(interiorLight2);
    addLight(interiorLight2, 5.2, 0.95);

    const interiorLight3 = new THREE.PointLight(0xffb469, 0.7, 9, 1.3);
    interiorLight3.position.set(3.1, 2.4, -0.7);
    diorama.add(interiorLight3);
    addLight(interiorLight3, 5.3, 0.7);

    const fridgeLight = new THREE.PointLight(0xc7f1ff, 0.72, 8, 1.3);
    fridgeLight.position.set(-1.8, 2.2, -5.35);
    diorama.add(fridgeLight);
    addLight(fridgeLight, 4.4, 0.72);

    const canopyLight = new THREE.PointLight(0xffae63, 0.9, 9, 1.4);
    canopyLight.position.set(-1.1, 2.55, 1.45);
    diorama.add(canopyLight);
    addLight(canopyLight, 6.0, 0.9);

    // warm pools of light on the shop floor
    addGroundGlow(diorama, 0xffa75f, 4.8, 3.2, -2.6, -1.8, 0.24, FLOOR + 0.05).renderOrder = 4;
    addGroundGlow(diorama, 0xffb872, 4.0, 2.8, 1.9, -4.1, 0.19, FLOOR + 0.05).renderOrder = 4;
    addGroundGlow(diorama, 0xffc884, 2.4, 2.0, 3.0, -0.6, 0.16, FLOOR + 0.05).renderOrder = 4;
    addGlow(diorama, 0xffa45c, 5.0, -3.6, 1.85, 0.95, 0.09, { delay: 5.5 });
    addGlow(diorama, 0xffb86f, 4.4, 0.5, 1.75, 0.95, 0.08, { delay: 5.6 });
    addGlow(diorama, 0xffcc8b, 3.0, 3.3, 1.7, 0.9, 0.07, { delay: 5.6 });
    return g;
  }

  function linearizeSceneColors() {
    const seen = new Set();
    function convertColor(c) {
      if (c && c.isColor) c.convertSRGBToLinear();
    }
    if (scene.fog && scene.fog.color) scene.fog.color.convertSRGBToLinear();
    scene.traverse(function (obj) {
      if (obj.isLight) {
        convertColor(obj.color);
        return;
      }
      const mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
      for (let i = 0; i < mats.length; i++) {
        const m = mats[i];
        if (!m || seen.has(m.uuid)) continue;
        seen.add(m.uuid);
        convertColor(m.color);
        convertColor(m.emissive);
        convertColor(m.specular);
      }
    });
  }
  /* ------------------------------------------------------------
     Street props
     ------------------------------------------------------------ */
  const WALK_Y = 0.17;

  function addTubeBetween(parent, a, b, radius, mat, seg) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    if (len < 0.0001) return null;
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, seg || 6), mat);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addWire(parent, a, b, sag, radius) {
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    mid.y -= sag;
    const mid2 = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    mid2.y -= sag * 0.7;
    const curve = new THREE.CatmullRomCurve3([a, mid, mid2, b]);
    const geo = new THREE.TubeGeometry(curve, 32, radius || 0.025, 4, false);
    const mesh = new THREE.Mesh(geo, toon(0x1c2734));
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function buildVendingMachines() {
    const g = new THREE.Group();
    g.name = 'vending-machines';
    const bodyColors = [0xb84148, 0x2f6f9f];
    const glowColors = [0xff8269, 0x7ee4ff];

    [-4.1, -3.02].forEach(function (z, i) {
      const unit = new THREE.Group();
      unit.position.set(4.9, 0, z);
      addBox(unit, 0.86, 1.88, 0.88, toon(bodyColors[i]), 0, WALK_Y + 0.94, 0, { cast: true, receive: true, outline: 0.01 });
      addBox(unit, 0.8, 0.14, 0.82, MAT.metalDark, 0, WALK_Y + 1.91, 0);
      addBox(unit, 0.86, 0.16, 0.88, MAT.metalDark, 0, WALK_Y + 0.09, 0);
      addBox(unit, 0.06, 1.74, 0.8, MAT.metalDark, 0.44, WALK_Y + 0.97, 0);
      addTextSign(unit, 0.8, 1.68, vendingTexture(i), 0.475, WALK_Y + 0.97, 0, {
        rot: [0, Math.PI / 2, 0]
      });
      addBox(unit, 0.025, 1.68, 0.8, MAT.glass, 0.497, WALK_Y + 0.97, 0, {
        rot: [0, Math.PI / 2, 0], renderOrder: 8
      });
      addBox(unit, 0.08, 0.18, 0.82, MAT.metalDark, 0.47, WALK_Y + 1.74, 0);
      addBox(unit, 0.09, 0.08, 0.17, MAT.metal, 0.52, WALK_Y + 0.95, 0.26);
      addGlow(unit, glowColors[i], 2.1, 0.72, WALK_Y + 1.0, 0, 0.22, { delay: 6.2 + i * 0.1 });
      addGroundGlow(unit, glowColors[i], 2.8, 2.8, 1.35, 0, 0.2, WALK_Y + 0.02);
      addContactShadow(unit, 1.35, 1.25, 0.04, 0, 0.35, WALK_Y + 0.012);
      g.add(unit);
      registerAssembly(unit, 5.82 + i * 0.08, { duration: 0.85, drop: 0.8, scaleFrom: 0.04 });
    });

    const vendLight = new THREE.PointLight(0xff987c, 1.25, 6.0, 1.6);
    vendLight.position.set(5.7, 1.45, -3.55);
    diorama.add(vendLight);
    addLight(vendLight, 6.45, 1.25);

    // recycling bin beside the machines
    const bin = new THREE.Group();
    bin.position.set(5.05, 0, -2.35);
    addCylinder(bin, 0.27, 0.24, 0.8, 12, MAT.teal, 0, WALK_Y + 0.4, 0, { cast: true });
    addCylinder(bin, 0.28, 0.28, 0.08, 12, MAT.metalDark, 0, WALK_Y + 0.83, 0);
    addBox(bin, 0.28, 0.16, 0.02, MAT.metal, 0, WALK_Y + 0.52, 0.245);
    addContactShadow(bin, 0.7, 0.7, 0, 0, 0.32, WALK_Y + 0.012);
    g.add(bin);
    registerAssembly(bin, 7.1, { duration: 0.7, drop: 0.45, scaleFrom: 0.05 });

    diorama.add(g);
    return g;
  }

  function buildPylonSign() {
    const g = new THREE.Group();
    g.name = 'pylon-sign';
    g.position.set(5.82, 0, 5.06);
    addBox(g, 0.92, 0.24, 0.92, MAT.concreteDark, 0, WALK_Y + 0.12, 0, { cast: true });
    addBox(g, 0.8, 0.07, 0.8, MAT.concrete, 0, WALK_Y + 0.27, 0);
    addCylinder(g, 0.11, 0.12, 2.5, 10, MAT.metalDark, 0, WALK_Y + 1.5, 0, { cast: true });
    addBox(g, 1.78, 3.62, 0.25, MAT.tealDark, 0, WALK_Y + 4.05, 0, { cast: true, outline: 0.011 });
    addTextSign(g, 1.66, 3.5, pylonSignTexture(), 0, WALK_Y + 4.05, 0.135);
    addTextSign(g, 1.66, 3.5, pylonSignTexture(), 0, WALK_Y + 4.05, -0.135, { rot: [0, Math.PI, 0] });
    addBox(g, 1.9, 0.12, 0.34, MAT.metalDark, 0, WALK_Y + 5.92, 0);
    addBox(g, 1.9, 0.1, 0.34, MAT.metalDark, 0, WALK_Y + 2.2, 0);
    addGlow(g, 0x8fe8e0, 2.4, 0.25, WALK_Y + 4.0, 0.3, 0.14, { delay: 6.8 });
    addGlow(g, 0xffb46f, 1.7, 0.0, WALK_Y + 2.7, 0.3, 0.08, { delay: 6.8 });
    addGroundGlow(g, 0x6fd8d2, 2.8, 3.2, 0, 0.8, 0.1, WALK_Y + 0.02);
    addContactShadow(g, 1.35, 1.35, 0, 0, 0.36, WALK_Y + 0.012);
    const pl = new THREE.PointLight(0x7fd9d3, 0.5, 5.5, 1.5);
    pl.position.set(5.82, 3.9, 5.5);
    diorama.add(pl);
    addLight(pl, 6.9, 0.5);
    diorama.add(g);
    registerAssembly(g, 5.95, { duration: 1.0, drop: 1.2, scaleFrom: 0.035 });
    return g;
  }

  function buildStreetLamp() {
    const g = new THREE.Group();
    g.name = 'street-lamp';
    g.position.set(-6.55, 0, 6.15);
    addCylinder(g, 0.23, 0.28, 0.18, 12, MAT.concreteDark, 0, WALK_Y + 0.09, 0, { cast: true });
    addCylinder(g, 0.09, 0.13, 5.75, 12, MAT.metal, 0, WALK_Y + 2.88, 0, { cast: true, outline: 0.007 });
    addCylinder(g, 0.14, 0.14, 0.18, 12, MAT.metalDark, 0, WALK_Y + 0.88, 0);
    // curved arm
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 5.42, 0),
      new THREE.Vector3(0, 5.95, 0.25),
      new THREE.Vector3(0, 6.08, 0.95),
      new THREE.Vector3(0, 6.02, 1.35)
    ]);
    const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.065, 6, false), MAT.metal);
    g.add(arm);
    addBox(g, 0.5, 0.16, 0.32, MAT.metalDark, 0, 5.96, 1.4, { cast: true });
    addBox(g, 0.38, 0.035, 0.24, MAT.warmGlow, 0, 5.87, 1.4);
    addGlow(g, 0xffcb8b, 4.0, 0, 5.85, 1.42, 0.4, { delay: 6.4 });
    addGlow(g, 0xffc27b, 8.0, 0, 5.7, 1.45, 0.12, { delay: 6.45 });
    addGroundGlow(g, 0xffb875, 8.4, 7.2, 0, 1.5, 0.28, WALK_Y + 0.015);
    addContactShadow(g, 1.2, 1.2, 0, 0, 0.35, WALK_Y + 0.012);
    // small banner plate
    addBox(g, 0.24, 0.66, 0.04, MAT.teal, 0.17, 3.3, 0.0);
    addTextSign(g, 0.2, 0.58, makeTexture(128, 384, function (ctx, w, h) {
      ctx.fillStyle = '#1f6668';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f8edda';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 30px "Yu Gothic", sans-serif';
      ctx.fillText('星', w / 2, 90);
      ctx.fillText('町', w / 2, 145);
      ctx.fillText('三', w / 2, 200);
      ctx.fillText('丁', w / 2, 255);
      ctx.fillText('目', w / 2, 310);
    }), 0.29, 3.3, 0.03);

    const lampLight = new THREE.PointLight(0xffc587, 2.6, 16, 1.3);
    lampLight.position.set(-6.55, 6.0, 7.55);
    diorama.add(lampLight);
    addLight(lampLight, 6.7, 1.8);
    diorama.add(g);
    registerAssembly(g, 6.2, { duration: 1.1, drop: 1.2, scaleFrom: 0.03 });
    return g;
  }

  function buildUtilityPoles() {
    const g = new THREE.Group();
    g.name = 'utility-poles';

    // main pole, left foreground
    const p1 = new THREE.Group();
    p1.position.set(-8.55, 0, 5.9);
    addCylinder(p1, 0.14, 0.2, 9.0, 12, MAT.concrete, 0, WALK_Y + 4.5, 0, { cast: true, outline: 0.008 });
    addCylinder(p1, 0.2, 0.2, 0.18, 12, MAT.concreteDark, 0, WALK_Y + 0.09, 0);
    for (let i = 0; i < 8; i++) {
      addBox(p1, 0.34, 0.025, 0.03, MAT.metalDark, 0, WALK_Y + 0.9 + i * 0.55, 0.15);
    }
    addBox(p1, 1.7, 0.11, 0.12, MAT.metalDark, 0, WALK_Y + 7.05, 0);
    addBox(p1, 1.55, 0.1, 0.12, MAT.metalDark, 0, WALK_Y + 7.75, 0);
    for (let i = 0; i < 3; i++) {
      addCylinder(p1, 0.045, 0.045, 0.16, 6, MAT.white, -0.63 + i * 0.63, WALK_Y + 7.16, 0);
      addCylinder(p1, 0.045, 0.045, 0.16, 6, MAT.white, -0.57 + i * 0.57, WALK_Y + 7.86, 0);
    }
    addCylinder(p1, 0.36, 0.36, 0.78, 12, MAT.metalDark, 0.02, WALK_Y + 6.3, 0.02, { cast: true });
    addCylinder(p1, 0.28, 0.28, 0.12, 12, MAT.metal, 0.02, WALK_Y + 6.74, 0.02);
    addBox(p1, 0.38, 0.5, 0.1, MAT.metal, 0, WALK_Y + 4.6, 0.18);
    addBox(p1, 0.28, 0.3, 0.025, MAT.white, 0, WALK_Y + 4.6, 0.24);
    addBox(p1, 0.4, 0.1, 0.03, MAT.orange, 0, WALK_Y + 1.85, 0.18);
    addBox(p1, 0.4, 0.1, 0.03, MAT.orange, 0, WALK_Y + 2.75, 0.18);
    addBox(p1, 0.36, 0.35, 0.025, MAT.white, 0, WALK_Y + 2.3, 0.19);
    addGroundGlow(p1, 0xffc27e, 2.4, 2.4, 0, 0, 0.09, WALK_Y + 0.015);
    addContactShadow(p1, 1.4, 1.4, 0, 0, 0.3, WALK_Y + 0.012);
    g.add(p1);
    registerAssembly(p1, 6.25, { duration: 1.2, drop: 1.4, scaleFrom: 0.03 });

    // second pole in the rear service strip
    const p2 = new THREE.Group();
    p2.position.set(6.2, 0, -9.6);
    addCylinder(p2, 0.12, 0.17, 8.4, 10, MAT.concrete, 0, WALK_Y + 4.2, 0, { cast: true });
    addCylinder(p2, 0.18, 0.18, 0.16, 10, MAT.concreteDark, 0, WALK_Y + 0.08, 0);
    addBox(p2, 1.4, 0.1, 0.1, MAT.metalDark, 0, WALK_Y + 7.0, 0);
    addBox(p2, 1.2, 0.1, 0.1, MAT.metalDark, 0, WALK_Y + 7.55, 0);
    for (let i = 0; i < 3; i++) {
      addCylinder(p2, 0.04, 0.04, 0.14, 6, MAT.white, -0.52 + i * 0.52, WALK_Y + 7.1, 0);
    }
    addCylinder(p2, 0.26, 0.26, 0.62, 10, MAT.metalDark, 0.05, WALK_Y + 6.15, 0.03);
    g.add(p2);
    registerAssembly(p2, 6.35, { duration: 1.1, drop: 1.4, scaleFrom: 0.03 });

    // wires, as a separate late assembly group
    const wires = new THREE.Group();
    const topsA = [
      new THREE.Vector3(-8.55, 8.15, 5.9),
      new THREE.Vector3(-8.55, 8.35, 5.9),
      new THREE.Vector3(-8.55, 8.55, 5.9),
      new THREE.Vector3(-8.55, 8.75, 5.9)
    ];
    const topsB = [
      new THREE.Vector3(6.2, 7.65, -9.6),
      new THREE.Vector3(6.2, 7.82, -9.6),
      new THREE.Vector3(6.2, 7.99, -9.6),
      new THREE.Vector3(6.2, 8.16, -9.6)
    ];
    for (let i = 0; i < 4; i++) {
      addWire(wires, topsA[i], topsB[i], 1.05 + i * 0.12, 0.023);
    }
    addWire(wires, new THREE.Vector3(-8.55, 7.95, 5.9), new THREE.Vector3(-7.05, 5.9, -2.3), 0.55, 0.018);
    addWire(wires, new THREE.Vector3(-8.55, 8.55, 5.9), new THREE.Vector3(-7.05, 6.35, -2.3), 0.48, 0.018);
    addWire(wires, new THREE.Vector3(6.2, 7.8, -9.6), new THREE.Vector3(4.35, 4.62, -4.5), 0.62, 0.016);
    addWire(wires, new THREE.Vector3(-8.55, 7.7, 5.9), new THREE.Vector3(-6.25, 4.34, 0.72), 0.9, 0.016);
    diorama.add(wires);
    registerAssembly(wires, 7.05, { duration: 1.1, drop: 1.0, scaleFrom: 0.01 });

    diorama.add(g);
    return g;
  }

  function buildNeighborHouse() {
    const g = new THREE.Group();
    g.name = 'neighbor-house';

    const cx = -8.9;
    const cz = -5.78;
    addBox(g, 3.7, 0.24, 7.7, MAT.concreteDark, cx, 0.28, cz, { cast: true, receive: true });
    addBox(g, 3.4, 5.35, 7.1, MAT.houseWall, cx, 2.9, cz, { cast: true, outline: 0.014 });
    addBox(g, 3.44, 0.95, 7.14, MAT.houseWall2, cx, 0.66, cz);
    addBox(g, 3.46, 0.12, 7.16, MAT.woodDark, cx, 1.16, cz);
    addBox(g, 3.46, 0.1, 7.16, MAT.woodDark, cx, 3.95, cz);

    // shallow hipped roof
    const roofGeo = new THREE.ConeGeometry(2.94, 1.22, 4, 1, false);
    const roof = new THREE.Mesh(roofGeo, MAT.roofTile);
    roof.position.set(cx, 6.24, cz);
    roof.rotation.y = Math.PI / 4;
    roof.scale.z = 1.72;
    roof.castShadow = true;
    roof.receiveShadow = true;
    g.add(roof);
    addOutline(roof, 0.014);
    addBox(g, 4.12, 0.12, 7.28, MAT.woodDark, cx, 5.6, cz, { cast: true });
    addCylinder(g, 0.05, 0.05, 0.34, 6, MAT.metalDark, cx, 6.92, cz);
    addBox(g, 0.28, 0.04, 0.04, MAT.metal, cx, 7.0, cz);
    addBox(g, 0.04, 0.04, 0.28, MAT.metal, cx, 7.06, cz);

    // front facade details
    const facadeZ = -2.18;
    // second floor sliding window, warm
    addBox(g, 2.0, 1.1, 0.08, MAT.metalDark, -8.9, 4.55, facadeZ - 0.02);
    addPlane(g, 1.84, 0.94, new THREE.MeshBasicMaterial({ color: 0xffb05a, toneMapped: false }),
      -8.9, 4.55, facadeZ - 0.07);
    addGlow(g, 0xffad5b, 1.8, -8.9, 4.55, facadeZ - 0.15, 0.28, { delay: 7.1 });
    addBox(g, 0.05, 1.0, 0.06, MAT.metalDark, -8.9, 4.55, facadeZ - 0.1);
    addBox(g, 2.05, 0.06, 0.12, MAT.metalDark, -8.9, 5.12, facadeZ - 0.02);
    addBox(g, 2.05, 0.06, 0.12, MAT.metalDark, -8.9, 3.98, facadeZ - 0.02);
    addPlane(g, 0.7, 0.9, new THREE.MeshBasicMaterial({ color: 0xb07e58, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
      -9.25, 4.53, facadeZ - 0.11);
    // small balcony
    addBox(g, 2.35, 0.12, 0.8, MAT.concreteDark, -8.9, 3.7, facadeZ - 0.32, { cast: true });
    for (let i = 0; i < 7; i++) {
      addCylinder(g, 0.02, 0.02, 0.62, 5, MAT.metal, -9.95 + i * 0.35, 4.02, facadeZ - 0.65);
    }
    addBox(g, 2.35, 0.05, 0.05, MAT.metal, -8.9, 4.34, facadeZ - 0.65);
    addBox(g, 2.35, 0.05, 0.05, MAT.metal, -8.9, 4.06, facadeZ - 0.65);
    // ground floor window
    addBox(g, 1.55, 1.06, 0.08, MAT.metalDark, -8.35, 2.23, facadeZ - 0.02);
    addPlane(g, 1.4, 0.9, new THREE.MeshBasicMaterial({ color: 0xffc678, toneMapped: false }),
      -8.35, 2.23, facadeZ - 0.07);
    addGlow(g, 0xffbc6f, 1.3, -8.35, 2.23, facadeZ - 0.15, 0.2, { delay: 7.15 });
    addBox(g, 0.05, 0.96, 0.06, MAT.metalDark, -8.35, 2.23, facadeZ - 0.1);
    addPlane(g, 0.4, 0.84, new THREE.MeshBasicMaterial({ color: 0x8e6a51, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
      -8.7, 2.2, facadeZ - 0.12);
    // door
    addBox(g, 0.82, 1.95, 0.1, MAT.woodDark, -9.85, 1.3, facadeZ - 0.03, { cast: true });
    addBox(g, 0.52, 0.06, 0.07, MAT.metal, -9.85, 1.55, facadeZ - 0.1);
    addBox(g, 0.06, 0.06, 0.03, MAT.orange, -9.58, 1.2, facadeZ - 0.1);
    addBox(g, 0.95, 0.07, 0.55, MAT.metalDark, -9.85, 2.35, facadeZ - 0.22);
    addBox(g, 1.15, 0.1, 0.7, MAT.tealDark, -9.85, 2.42, facadeZ - 0.25);
    addCylinder(g, 0.05, 0.06, 0.6, 8, MAT.tealDark, -9.85, 2.7, facadeZ - 0.22);
    addCylinder(g, 0.11, 0.11, 0.12, 8, MAT.warmGlow, -9.85, 2.98, facadeZ - 0.22);
    addGlow(g, 0xffc17a, 0.75, -9.85, 2.95, facadeZ - 0.18, 0.25, { delay: 7.2 });

    // house name plate and small plants
    addBox(g, 0.34, 0.15, 0.04, MAT.wood, -9.52, 2.55, facadeZ - 0.15);
    addCylinder(g, 0.17, 0.14, 0.3, 8, MAT.wood, -8.0, 2.0, facadeZ - 0.2);
    addSphere(g, 0.21, MAT.foliage, -8.0, 2.21, facadeZ - 0.2, { scale: [1, 0.8, 1], detail: 1 });

    // side facing alley: pipes, AC, small window
    addBox(g, 1.0, 0.82, 0.12, MAT.metalDark, -7.2, 2.15, -4.4, { rotY: Math.PI / 2 });
    addPlane(g, 0.82, 0.65, new THREE.MeshBasicMaterial({ color: 0xcfa46d, toneMapped: true }),
      -7.13, 2.15, -4.4, { rot: [0, Math.PI / 2, 0] });
    addBox(g, 0.06, 0.08, 0.06, MAT.metalDark, -7.18, 3.2, -6.3);
    addCylinder(g, 0.045, 0.045, 4.2, 8, MAT.metal, -7.21, 2.6, -6.95);
    addCylinder(g, 0.045, 0.045, 2.6, 8, MAT.metal, -7.21, 1.8, -1.55);

    // roof antenna
    addCylinder(g, 0.025, 0.025, 2.0, 4, MAT.metal, -8.35, 7.35, -7.1);
    addBox(g, 1.3, 0.025, 0.025, MAT.metal, -8.35, 8.15, -7.1);
    for (let i = 0; i < 4; i++) {
      addBox(g, 0.02, 0.55, 0.02, MAT.metal, -8.93 + i * 0.39, 8.3, -7.1);
    }

    addContactShadow(g, 5.0, 8.6, cx, cz, 0.4, 0.19);
    diorama.add(g);
    registerAssembly(g, 2.35, { duration: 1.25, drop: 1.5, scaleFrom: 0.04 });
    return g;
  }

  function buildAlley() {
    const g = new THREE.Group();
    g.name = 'alley';

    addBox(g, 1.05, 0.025, 8.1, MAT.concreteDark, -6.6, 0.187, -2.35, { receive: true });
    addBox(g, 0.1, 0.04, 8.0, MAT.metalDark, -6.63, 0.198, -2.35);
    // puddle in the alley
    const ap = new THREE.Mesh(new THREE.CircleGeometry(0.38, 16), new THREE.MeshPhongMaterial({
      color: 0x233a4d, transparent: true, opacity: 0.6, shininess: 120, specular: 0x8fb7cf, depthWrite: false
    }));
    ap.rotation.x = -Math.PI / 2;
    ap.position.set(-6.56, 0.205, 0.2);
    ap.renderOrder = 2;
    g.add(ap);

    // ground AC units in the alley
    function alleyAC(x, y, z) {
      addBox(g, 0.52, 0.55, 0.45, MAT.creamDark, x, y, z, { cast: true, outline: 0.006 });
      addBox(g, 0.44, 0.43, 0.04, MAT.metalDark, x + 0.27, y, z, { rotY: Math.PI / 2 });
      const fan = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 4, 14), MAT.metal);
      fan.position.set(x + 0.295, y, z);
      fan.rotation.y = Math.PI / 2;
      g.add(fan);
      addTubeBetween(g, new THREE.Vector3(x + 0.2, y + 0.2, z - 0.2),
        new THREE.Vector3(x + 0.2, y + 0.9, z - 0.4), 0.026, MAT.metal);
    }
    alleyAC(-6.82, 0.55, -3.6);
    alleyAC(-6.82, 1.18, -3.6);
    // crates
    for (let i = 0; i < 3; i++) {
      addBox(g, 0.5, 0.3, 0.42, i === 1 ? MAT.orange : MAT.woodDark, -6.72, 0.33 + i * 0.31, -5.6, {
        rotY: 0.04 * i, cast: true
      });
    }
    // stacked empty bottles crate
    addBox(g, 0.42, 0.22, 0.32, MAT.teal, -6.67, 0.28, 0.9);
    // pipes on the store wall
    addCylinder(g, 0.04, 0.04, 3.2, 8, MAT.metal, -6.09, 1.95, -4.8);
    addCylinder(g, 0.04, 0.04, 2.2, 8, MAT.metal, -6.09, 1.4, -1.5);
    // wall light
    addBox(g, 0.25, 0.12, 0.18, MAT.metalDark, -6.12, 2.35, -0.85);
    addCylinder(g, 0.09, 0.09, 0.05, 8, MAT.warmGlow, -6.0, 2.29, -0.85, { rot: [0, 0, Math.PI / 2] });
    addGlow(g, 0xffc47f, 1.45, -5.95, 2.22, -0.82, 0.25, { delay: 7.0 });
    addGroundGlow(g, 0xffb06b, 2.6, 2.0, -6.35, -0.8, 0.12, 0.195);
    // no-entry sign
    addBox(g, 0.26, 0.36, 0.03, MAT.white, -6.11, 1.65, -2.0, { rot: [0, Math.PI / 2, 0] });
    addBox(g, 0.18, 0.04, 0.04, MAT.orange, -6.09, 1.7, -2.0, { rot: [0, Math.PI / 2, 0] });
    addBox(g, 0.18, 0.04, 0.04, MAT.orange, -6.09, 1.6, -2.0, { rot: [0, Math.PI / 2, 0] });

    // warm chochin at the mouth of the alley
    addBox(g, 0.04, 0.04, 0.45, MAT.metalDark, -7.05, 2.75, 1.0);
    addCylinder(g, 0.14, 0.14, 0.04, 10, MAT.black, -6.8, 2.7, 1.0);
    const chochin = addCylinder(g, 0.14, 0.11, 0.44, 12, new THREE.MeshBasicMaterial({ color: 0xff8b47, toneMapped: false }),
      -6.8, 2.46, 1.0);
    addCylinder(g, 0.13, 0.13, 0.035, 10, MAT.black, -6.8, 2.23, 1.0);
    addCylinder(g, 0.13, 0.13, 0.035, 10, MAT.black, -6.8, 2.69, 1.0);
    addTextSign(g, 0.17, 0.34, makeTexture(128, 256, function (ctx, w, h) {
      ctx.fillStyle = '#f0b05b';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#812c22';
      ctx.font = '900 56px "Yu Gothic", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('路', w / 2, 86);
      ctx.fillText('地', w / 2, 158);
    }), -6.65, 2.46, 1.0, { rot: [0, Math.PI / 2, 0] });
    addGlow(g, 0xff9d55, 1.7, -6.75, 2.45, 1.0, 0.28, { delay: 7.1 });

    diorama.add(g);
    registerAssembly(g, 3.85, { duration: 0.95, drop: 0.8, scaleFrom: 0.04 });
    return g;
  }

  function buildNoticeBoard() {
    const g = new THREE.Group();
    g.name = 'notice-board';
    g.position.set(-7.72, 0, 2.2);
    g.rotation.y = 0.14;
    addBox(g, 0.1, 2.05, 0.1, MAT.woodDark, -0.75, WALK_Y + 1.02, 0, { cast: true });
    addBox(g, 0.1, 2.05, 0.1, MAT.woodDark, 0.75, WALK_Y + 1.02, 0, { cast: true });
    addBox(g, 1.8, 1.18, 0.08, MAT.wood, 0, WALK_Y + 1.3, 0, { cast: true, outline: 0.006 });
    addBox(g, 1.58, 0.94, 0.02, toon(0xb68e62), 0, WALK_Y + 1.29, 0.05);
    addBox(g, 2.0, 0.1, 0.5, MAT.roofTile, 0, WALK_Y + 2.06, 0.03, { rot: [0.06, 0, 0] });
    addBox(g, 1.7, 0.18, 0.04, MAT.teal, 0, WALK_Y + 1.98, 0.02);
    addTextSign(g, 1.52, 0.16, makeTexture(768, 96, function (ctx, w, h) {
      ctx.fillStyle = '#1d686a';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f5ead6';
      ctx.font = '700 35px "Yu Gothic", "Meiryo", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('星町 掲示板', w / 2, h / 2 + 1);
    }), 0, WALK_Y + 1.98, 0.045);
    for (let i = 0; i < 4; i++) {
      const px = -0.55 + (i % 2) * 1.1;
      const py = 1.58 - Math.floor(i / 2) * 0.47;
      addTextSign(g, 0.4, 0.52, noticePosterTexture(i), px, WALK_Y + py, 0.065, {
        rot: [0, 0, i % 2 ? -0.02 : 0.02]
      });
    }
    addBox(g, 0.18, 0.12, 0.18, MAT.metalDark, 0.0, WALK_Y + 2.3, 0.12);
    addCylinder(g, 0.055, 0.055, 0.12, 8, MAT.warmGlow, 0, WALK_Y + 2.22, 0.16);
    addGlow(g, 0xffd18d, 0.7, 0, WALK_Y + 2.18, 0.18, 0.18, { delay: 7.0 });
    // potted flowers at base
    addCylinder(g, 0.13, 0.1, 0.2, 8, MAT.brick, -0.8, WALK_Y + 0.1, 0.2);
    addSphere(g, 0.15, MAT.foliageLight, -0.8, WALK_Y + 0.26, 0.2, { scale: [1.1, 0.9, 1] });
    addContactShadow(g, 2.1, 0.8, 0, 0.05, 0.32, WALK_Y + 0.012);
    diorama.add(g);
    registerAssembly(g, 6.05, { duration: 0.9, drop: 0.6, scaleFrom: 0.04 });
    return g;
  }

  function buildBicycle(x, z, rotY, color, delay) {
    const g = new THREE.Group();
    g.name = 'bicycle';
    g.position.set(x, WALK_Y, z);
    g.rotation.y = rotY;
    const frameMat = toon(color);
    const tyreMat = MAT.metalDark;
    const metalMat = MAT.metal;
    const wheelZ = [-0.53, 0.54];
    wheelZ.forEach(function (wz) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.335, 0.028, 6, 20), tyreMat);
      wheel.position.set(0, 0.35, wz);
      wheel.rotation.y = Math.PI / 2;
      g.add(wheel);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.009, 4, 18), metalMat);
      rim.position.set(0, 0.35, wz);
      rim.rotation.y = Math.PI / 2;
      g.add(rim);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        addTubeBetween(g,
          new THREE.Vector3(0, 0.35, wz),
          new THREE.Vector3(0, 0.35 + Math.sin(a) * 0.29, wz + Math.cos(a) * 0.29),
          0.0045, metalMat, 4);
      }
      addCylinder(g, 0.035, 0.035, 0.09, 8, metalMat, 0, 0.35, wz, { rot: [0, 0, Math.PI / 2] });
    });
    // frame
    const rear = new THREE.Vector3(0, 0.35, -0.53);
    const crank = new THREE.Vector3(0, 0.38, 0.02);
    const seatTop = new THREE.Vector3(0, 0.84, -0.16);
    const headTop = new THREE.Vector3(0, 0.9, 0.42);
    const front = new THREE.Vector3(0, 0.35, 0.54);
    addTubeBetween(g, rear, seatTop, 0.024, frameMat);
    addTubeBetween(g, seatTop, crank, 0.026, frameMat);
    addTubeBetween(g, crank, headTop, 0.026, frameMat);
    addTubeBetween(g, headTop, front, 0.021, frameMat);
    addTubeBetween(g, seatTop, headTop, 0.023, frameMat);
    addTubeBetween(g, rear, crank, 0.017, frameMat);
    // fork
    addTubeBetween(g, new THREE.Vector3(0, 0.9, 0.42), new THREE.Vector3(0, 0.54, 0.54), 0.018, metalMat);
    // seat
    addBox(g, 0.1, 0.05, 0.28, MAT.black, 0, 0.9, -0.18);
    addCylinder(g, 0.02, 0.02, 0.2, 6, metalMat, 0, 0.8, -0.17);
    // handlebars
    addCylinder(g, 0.018, 0.018, 0.44, 6, metalMat, 0, 1.0, 0.43, { rot: [0, 0, Math.PI / 2] });
    addCylinder(g, 0.02, 0.02, 0.15, 6, metalMat, 0, 0.95, 0.43);
    // fenders (partial arcs)
    wheelZ.forEach(function (wz, i) {
      const fender = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.014, 4, 14, Math.PI * 0.8), frameMat);
      fender.position.set(0, 0.36, wz);
      fender.rotation.set(Math.PI / 2, 0, i === 0 ? 2.9 : 2.9);
      g.add(fender);
    });
    // front basket
    addBox(g, 0.36, 0.24, 0.3, MAT.metal, 0, 0.92, 0.54);
    addBox(g, 0.3, 0.2, 0.24, MAT.black, 0, 0.94, 0.54);
    addBox(g, 0.34, 0.03, 0.28, MAT.metal, 0, 1.02, 0.54);
    // rear rack
    addBox(g, 0.28, 0.03, 0.42, MAT.metal, 0, 0.73, -0.55);
    // kickstand
    addTubeBetween(g, new THREE.Vector3(0.02, 0.36, 0.04), new THREE.Vector3(0.18, 0.02, 0.1), 0.014, metalMat);
    addBox(g, 0.36, 0.04, 0.05, MAT.white, 0, 0.96, 0.53);
    addBox(g, 0.16, 0.08, 0.03, MAT.orange, 0, 0.9, -0.56);
    addContactShadow(g, 1.0, 1.5, 0, 0, 0.28, 0.012);
    diorama.add(g);
    registerAssembly(g, delay, { duration: 0.85, drop: 0.5, scaleFrom: 0.03 });
    return g;
  }

  function buildUmbrellaStand() {
    const g = new THREE.Group();
    g.name = 'umbrella-stand';
    g.position.set(2.18, 0, 1.35);
    addCylinder(g, 0.24, 0.27, 0.6, 12, MAT.teal, 0, WALK_Y + 0.3, 0, { cast: true });
    addCylinder(g, 0.25, 0.25, 0.04, 12, MAT.metalDark, 0, WALK_Y + 0.62, 0);
    addCylinder(g, 0.08, 0.08, 0.12, 10, MAT.warmGlow, 0, WALK_Y + 0.52, 0);
    const tilt = [-0.18, 0.12, 0.02];
    const umbCols = [0x7ed4e5, 0xf0b76b, 0xc6a9e2, 0x8fd5c5];
    tilt.forEach(function (off, i) {
      const um = new THREE.Group();
      um.position.set(-0.1 + i * 0.1, WALK_Y + 0.6, 0.02 + (i - 1) * 0.06);
      um.rotation.z = off;
      um.rotation.x = off * 0.6;
      addCylinder(um, 0.012, 0.012, 1.05, 6, MAT.metal, 0, 0.44, 0);
      const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.085, 0.82, 8, 1, true), new THREE.MeshPhongMaterial({
        color: umbCols[i % umbCols.length], transparent: true, opacity: 0.58, side: THREE.DoubleSide,
        depthWrite: false, shininess: 110, specular: 0xffffff
      }));
      canopy.position.set(0, 0.49, 0);
      um.add(canopy);
      addCylinder(um, 0.005, 0.005, 0.12, 4, MAT.metal, 0, 1.03, 0);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 4, 10, Math.PI * 1.2), MAT.woodDark);
      handle.position.set(0.06, -0.04, 0);
      handle.rotation.z = 0.1;
      um.add(handle);
      g.add(um);
    });
    addBox(g, 0.3, 0.08, 0.03, MAT.white, 0, WALK_Y + 0.38, 0.25);
    addTextSign(g, 0.34, 0.13, makeTexture(512, 192, function (ctx, w, h) {
      ctx.fillStyle = '#f4ead8';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1d686a';
      ctx.font = '900 56px "Yu Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('かさ', w / 2, h / 2 + 3);
    }), 0, WALK_Y + 0.38, 0.27);
    addContactShadow(g, 0.8, 0.8, 0, 0, 0.3, WALK_Y + 0.012);
    diorama.add(g);
    registerAssembly(g, 5.95, { duration: 0.75, drop: 0.45, scaleFrom: 0.04 });
    return g;
  }

  function buildTrashStation() {
    const g = new THREE.Group();
    g.name = 'trash-station';
    g.position.set(5.15, 0, 1.95);
    const binData = [
      [0, 0xc06c4e, 'かん'],
      [0.52, 0x547f94, 'PET'],
      [1.04, 0x60836b, 'もえる']
    ];
    binData.forEach(function (b, i) {
      const x = b[0] - 0.52;
      addCylinder(g, 0.22, 0.2, 0.76, 12, toon(b[1]), x, WALK_Y + 0.38, 0, { cast: true });
      addCylinder(g, 0.23, 0.23, 0.08, 12, MAT.metalDark, x, WALK_Y + 0.79, 0);
      addBox(g, 0.22, 0.08, 0.02, MAT.white, x, WALK_Y + 0.56, 0.21);
      addBox(g, 0.18, 0.03, 0.03, MAT.black, x, WALK_Y + 0.56, 0.225);
      addCylinder(g, 0.035, 0.035, 0.05, 6, MAT.metal, x, WALK_Y + 0.84, 0);
    });
    addBox(g, 1.45, 0.06, 0.6, MAT.metalDark, 0, WALK_Y + 0.03, 0);
    addBox(g, 1.2, 0.22, 0.04, MAT.teal, 0, WALK_Y + 1.25, -0.06);
    addTextSign(g, 1.1, 0.16, makeTexture(768, 96, function (ctx, w, h) {
      ctx.fillStyle = '#1d686a';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f8eedb';
      ctx.font = '700 34px "Yu Gothic", "Meiryo", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ごみ分別にご協力ください', w / 2, h / 2 + 1);
    }), 0, WALK_Y + 1.25, -0.03);
    addCylinder(g, 0.05, 0.05, 1.0, 6, MAT.metal, -0.62, WALK_Y + 0.5, -0.06);
    addCylinder(g, 0.05, 0.05, 1.0, 6, MAT.metal, 0.62, WALK_Y + 0.5, -0.06);
    addContactShadow(g, 1.9, 0.9, 0, 0, 0.32, WALK_Y + 0.012);
    diorama.add(g);
    registerAssembly(g, 6.25, { duration: 0.85, drop: 0.5, scaleFrom: 0.04 });
    return g;
  }

  function buildGuardrail() {
    const g = new THREE.Group();
    g.name = 'guardrail';
    const railMat = toon(0xb9bcb1);
    const greenMat = toon(0x3f7564);
    function segment(x1, z1, x2, z2, postCount) {
      for (let p = 0; p <= postCount; p++) {
        const t = p / postCount;
        const x = lerp(x1, x2, t);
        const z = lerp(z1, z2, t);
        addCylinder(g, 0.035, 0.045, 0.9, 6, railMat, x, WALK_Y + 0.45, z, { cast: true });
        addBox(g, 0.1, 0.12, 0.02, greenMat, x, WALK_Y + 0.72, z + 0.02);
      }
      const dx = x2 - x1, dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dz * dz);
      const rot = Math.atan2(dx, dz);
      addBox(g, 0.055, 0.055, len, railMat, (x1 + x2) / 2, WALK_Y + 0.43, (z1 + z2) / 2, { rotY: rot });
      addBox(g, 0.055, 0.055, len, railMat, (x1 + x2) / 2, WALK_Y + 0.8, (z1 + z2) / 2, { rotY: rot });
      addBox(g, 0.04, 0.03, len, greenMat, (x1 + x2) / 2, WALK_Y + 0.56, (z1 + z2) / 2, { rotY: rot });
    }
    segment(-9.8, 6.32, 1.55, 6.32, 7);
    segment(6.32, 5.75, 6.32, 2.35, 3);
    segment(6.32, 5.75, 5.72, 6.32, 1);
    addContactShadow(g, 12.0, 0.7, -4.1, 6.32, 0.2, 0.198);
    diorama.add(g);
    registerAssembly(g, 6.15, { duration: 1.0, drop: 0.7, scaleFrom: 0.02 });
    return g;
  }

  function buildStreetSigns() {
    const g = new THREE.Group();
    g.name = 'street-signs';

    // parking sign
    const park = new THREE.Group();
    park.position.set(1.08, 0, 6.16);
    addCylinder(park, 0.035, 0.045, 2.3, 8, MAT.metal, 0, WALK_Y + 1.15, 0);
    addBox(park, 0.68, 0.68, 0.04, MAT.metalDark, 0, WALK_Y + 2.15, 0.02, { rot: [0, 0.12, 0] });
    const parkTex = roadSignTexture('parking');
    addTextSign(park, 0.62, 0.62, parkTex, 0.01, WALK_Y + 2.15, 0.05, { rot: [0, 0.12, 0] });
    addGlow(park, 0xd8f0ff, 0.7, 0, WALK_Y + 2.15, 0.1, 0.04, { delay: 7.2 });
    addContactShadow(park, 0.6, 0.6, 0, 0, 0.25, WALK_Y + 0.012);
    g.add(park);
    registerAssembly(park, 6.5, { duration: 0.75, drop: 0.5, scaleFrom: 0.04 });

    // street name + speed sign
    const street = new THREE.Group();
    street.position.set(5.88, 0, 3.0);
    addCylinder(street, 0.035, 0.045, 2.6, 8, MAT.metal, 0, WALK_Y + 1.3, 0);
    addTextSign(street, 1.25, 0.31, roadSignTexture('street'), 0, WALK_Y + 2.42, 0.035, { rot: [0, -0.3, 0] });
    addBox(street, 1.31, 0.36, 0.035, MAT.metalDark, 0, WALK_Y + 2.42, 0.0, { rot: [0, -0.3, 0] });
    const speedTex = roadSignTexture('speed');
    addTextSign(street, 0.46, 0.46, speedTex, 0.0, WALK_Y + 1.85, 0.035, { rot: [0, -0.3, 0] });
    addBox(street, 0.5, 0.5, 0.03, MAT.metalDark, 0, WALK_Y + 1.85, 0.0, { rot: [0, -0.3, 0] });
    addContactShadow(street, 0.6, 0.6, 0, 0, 0.24, WALK_Y + 0.012);
    g.add(street);
    registerAssembly(street, 6.6, { duration: 0.8, drop: 0.5, scaleFrom: 0.04 });

    // convex traffic mirror at the corner
    const mirror = new THREE.Group();
    mirror.position.set(5.9, 0, 5.45);
    addCylinder(mirror, 0.04, 0.05, 2.8, 8, MAT.metal, 0, WALK_Y + 1.4, 0);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 24), MAT.orange);
    disc.rotation.set(Math.PI / 2, 0, 0);
    disc.position.set(0, WALK_Y + 2.62, 0.06);
    mirror.add(disc);
    const glassDisc = new THREE.Mesh(new THREE.CircleGeometry(0.28, 24), new THREE.MeshPhongMaterial({
      color: 0x9fb7c7, shininess: 160, specular: 0xffffff
    }));
    glassDisc.position.set(0, WALK_Y + 2.62, 0.1);
    glassDisc.rotation.y = 0.2;
    mirror.add(glassDisc);
    addGlow(mirror, 0xe5f4ff, 0.4, 0, WALK_Y + 2.62, 0.18, 0.05, { delay: 7.3 });
    addContactShadow(mirror, 0.6, 0.6, 0, 0, 0.24, WALK_Y + 0.012);
    g.add(mirror);
    registerAssembly(mirror, 6.75, { duration: 0.8, drop: 0.5, scaleFrom: 0.04 });

    // small A-frame menu outside
    const aframe = new THREE.Group();
    aframe.position.set(1.55, 0, 1.45);
    aframe.rotation.y = 0.1;
    addBox(aframe, 0.58, 0.8, 0.05, MAT.woodDark, 0, WALK_Y + 0.55, 0.12, { rot: [-0.18, 0, 0], cast: true });
    addBox(aframe, 0.58, 0.8, 0.05, MAT.woodDark, 0, WALK_Y + 0.55, -0.12, { rot: [0.18, 0, 0], cast: true });
    addTextSign(aframe, 0.48, 0.68, makeTexture(512, 720, function (ctx, w, h) {
      ctx.fillStyle = '#efe5cf';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#bb5d3b';
      ctx.fillRect(0, 0, w, 130);
      ctx.fillStyle = '#fff4df';
      ctx.font = '900 56px "Yu Gothic", "Meiryo", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('からあげ', w / 2, 66);
      ctx.fillStyle = '#7d4c2e';
      ctx.font = '700 33px "Yu Gothic", sans-serif';
      ctx.fillText('揚げたて', w / 2, 210);
      ctx.fillStyle = '#c27e38';
      ctx.font = '900 72px "Arial Black", sans-serif';
      ctx.fillText('¥120', w / 2, 330);
      ctx.fillStyle = '#3c665b';
      ctx.font = '700 27px "Yu Gothic", sans-serif';
      ctx.fillText('HOT SNACK', w / 2, 440);
      ctx.fillStyle = 'rgba(80,65,48,0.35)';
      ctx.fillRect(54, 500, w - 108, 2);
      ctx.fillStyle = '#997747';
      ctx.font = '600 23px "Yu Gothic", sans-serif';
      ctx.fillText('HOSHI MART', w / 2, 550);
    }), 0, WALK_Y + 0.57, 0.155, { rot: [-0.18, 0, 0] });
    addBox(aframe, 0.6, 0.05, 0.4, MAT.wood, 0, WALK_Y + 0.03, 0);
    addContactShadow(aframe, 0.8, 0.8, 0, 0, 0.26, WALK_Y + 0.012);
    g.add(aframe);
    registerAssembly(aframe, 6.85, { duration: 0.7, drop: 0.45, scaleFrom: 0.04 });

    diorama.add(g);
    return g;
  }

  function buildTreeAndGreenery() {
    const g = new THREE.Group();
    g.name = 'street-tree';
    g.position.set(-9.25, 0, 3.5);
    addBox(g, 0.92, 0.36, 0.92, MAT.concreteDark, 0, WALK_Y + 0.18, 0, { cast: true });
    addBox(g, 0.72, 0.04, 0.72, toon(0x3d352e), 0, WALK_Y + 0.37, 0);
    addCylinder(g, 0.11, 0.19, 2.8, 9, MAT.woodDark, 0, WALK_Y + 1.72, 0, { cast: true, outline: 0.008 });
    addTubeBetween(g, new THREE.Vector3(0, WALK_Y + 2.35, 0), new THREE.Vector3(-0.5, WALK_Y + 3.4, 0.15), 0.055, MAT.woodDark);
    addTubeBetween(g, new THREE.Vector3(0.02, WALK_Y + 2.55, 0), new THREE.Vector3(0.65, WALK_Y + 3.55, -0.12), 0.05, MAT.woodDark);
    addTubeBetween(g, new THREE.Vector3(0, WALK_Y + 2.8, 0), new THREE.Vector3(0.1, WALK_Y + 4.05, 0.25), 0.045, MAT.woodDark);
    const clusters = [
      [-0.55, 3.55, 0.2, 0.9], [0.55, 3.65, -0.1, 0.85], [0.05, 4.15, 0.18, 1.0],
      [-0.2, 3.45, -0.45, 0.72], [0.2, 3.9, -0.5, 0.7], [-0.75, 4.0, -0.2, 0.65]
    ];
    clusters.forEach(function (c, i) {
      addSphere(g, c[3], i % 2 ? MAT.foliage : MAT.foliageLight, c[0], WALK_Y + c[1], c[2], {
        scale: [1.15, 0.9, 1.05], detail: 1, cast: true, outline: 0.009
      });
    });
    addContactShadow(g, 3.0, 3.0, 0, 0, 0.38, WALK_Y + 0.012);
    addGroundGlow(g, 0x3f8c79, 2.6, 2.6, 0, 0, 0.05, WALK_Y + 0.02);
    diorama.add(g);
    registerAssembly(g, 5.8, { duration: 1.0, drop: 1.0, scaleFrom: 0.04 });
    return g;
  }

  function buildSmallStreetDetails() {
    const g = new THREE.Group();
    g.name = 'street-details';

    // red fire hydrant
    const hyd = new THREE.Group();
    hyd.position.set(-6.85, 0, 4.85);
    addCylinder(hyd, 0.18, 0.22, 0.06, 10, MAT.concreteDark, 0, WALK_Y + 0.03, 0);
    addCylinder(hyd, 0.13, 0.16, 0.52, 10, toon(0xb74a41), 0, WALK_Y + 0.3, 0, { cast: true });
    addCylinder(hyd, 0.09, 0.09, 0.16, 8, toon(0xa83d37), 0, WALK_Y + 0.64, 0);
    addCylinder(hyd, 0.07, 0.07, 0.2, 8, MAT.metal, 0, WALK_Y + 0.56, 0.16, { rot: [Math.PI / 2, 0, 0] });
    addCylinder(hyd, 0.07, 0.07, 0.2, 8, MAT.metal, 0, WALK_Y + 0.56, -0.16, { rot: [Math.PI / 2, 0, 0] });
    addContactShadow(hyd, 0.6, 0.6, 0, 0, 0.28, WALK_Y + 0.012);
    g.add(hyd);
    registerAssembly(hyd, 7.25, { duration: 0.65, drop: 0.4, scaleFrom: 0.05 });

    // small grey utility box on the right side
    addBox(g, 0.62, 0.9, 0.38, MAT.concreteDark, 6.02, WALK_Y + 0.45, -8.0, { cast: true, outline: 0.007 });
    addBox(g, 0.52, 0.06, 0.42, MAT.metal, 6.02, WALK_Y + 0.93, -8.0);
    addBox(g, 0.34, 0.22, 0.02, MAT.white, 6.02, WALK_Y + 0.66, -7.8);
    addCylinder(g, 0.035, 0.035, 0.12, 6, MAT.metalDark, 5.82, WALK_Y + 0.25, -7.8);

    // pavement bollards near the corner
    for (let i = 0; i < 3; i++) {
      addCylinder(g, 0.055, 0.07, 0.7, 8, MAT.metal, 5.4 + i * 0.44, WALK_Y + 0.35, 6.02);
      addCylinder(g, 0.065, 0.065, 0.04, 8, MAT.orange, 5.4 + i * 0.44, WALK_Y + 0.67, 6.02);
    }

    // fallen leaves / scraps near curb
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(rr(0.018, 0.045), 5), toon(i % 3 ? 0x9d7d4f : 0x6d8a58));
      m.rotation.x = -Math.PI / 2;
      m.position.set(rr(-7, 5), 0.208, rr(0.2, 6.2));
      g.add(m);
    }

    diorama.add(g);
    registerAssembly(g, 7.1, { duration: 0.85, drop: 0.4, scaleFrom: 0.04 });
    return g;
  }

  function buildStreetProps() {
    buildVendingMachines();
    buildStreetLamp();
    buildUtilityPoles();
    buildNeighborHouse();
    buildAlley();
    buildNoticeBoard();
    buildBicycle(-5.28, 2.16, 0.32, 0x5a9d85, 5.72);
    buildBicycle(5.82, 0.28, -1.12, 0xcaa869, 6.3);
    buildUmbrellaStand();
    buildTrashStation();
    buildGuardrail();
    buildStreetSigns();
    buildTreeAndGreenery();
    buildSmallStreetDetails();
  }

  /* ------------------------------------------------------------
     Rain, wet reflections, ripples
     ------------------------------------------------------------ */
  let rainState = null;
  const rippleStates = [];

  function buildRainAndReflections() {
    const wet = new THREE.Group();
    wet.name = 'wet-reflections';
    diorama.add(wet);
    // neon / interior light smeared across the wet pavement
    addReflectionStreak(wet, 0xffa65b, 2.3, 5.4, -3.55, 3.6, 0.7, 0.03, 0.222);
    addReflectionStreak(wet, 0xffc078, 1.8, 4.6, -1.3, 3.8, 0.56, -0.04, 0.222);
    addReflectionStreak(wet, 0x63e0d5, 1.9, 5.0, -5.55, 3.8, 0.42, 0.05, 0.222);
    addReflectionStreak(wet, 0xff9a4f, 1.7, 4.4, 2.55, 3.7, 0.55, 0.02, 0.222);
    addReflectionStreak(wet, 0xff816a, 1.9, 5.2, 5.55, -2.0, 0.45, -0.02, 0.222);
    addReflectionStreak(wet, 0x5fe5ff, 1.6, 4.2, 6.0, -4.3, 0.36, 0.02, 0.222);
    addReflectionStreak(wet, 0xffc17b, 1.55, 5.7, -6.55, 8.4, 0.4, 0, 0.064);
    addReflectionStreak(wet, 0x9ae8df, 1.1, 4.3, -6.2, 8.3, 0.16, 0.05, 0.064);
    addReflectionStreak(wet, 0x86a4c1, 0.34, 7.0, -3.8, 8.8, 0.1, 0.02, 0.064);
    addReflectionStreak(wet, 0x86a4c1, 0.3, 5.0, 8.8, -1.8, 0.09, Math.PI / 2, 0.064);
    addReflectionStreak(wet, 0xd9e8e5, 2.4, 2.2, 3.8, 8.6, 0.07, 0, 0.064);
    addReflectionStreak(wet, 0xcce6f4, 0.28, 3.6, 2.9, 8.65, 0.18, 0, 0.068);
    addReflectionStreak(wet, 0xb9d9ea, 0.18, 3.2, 4.6, 8.7, 0.14, 0, 0.068);
    addGroundGlow(wet, 0xbcd9e9, 6.8, 2.2, 3.9, 8.8, 0.08, 0.071);

    addGroundGlow(wet, 0xffa962, 6.6, 4.6, -2.3, 2.9, 0.34, 0.224);
    addGroundGlow(wet, 0xffbd7d, 11.0, 5.2, -1.0, 2.5, 0.25, 0.224);
    addGroundGlow(wet, 0xff9d57, 5.8, 4.2, 2.6, 2.3, 0.3, 0.224);
    addGroundGlow(wet, 0x66d9cf, 3.6, 3.4, -5.2, 3.1, 0.2, 0.224);
    addGroundGlow(wet, 0xffb978, 6.4, 6.2, -6.55, 7.35, 0.18, 0.065);

    // puddle glints
    function puddleGlint(x, z, color, w, d, opacity, y) {
      addGroundGlow(wet, color, w, d, x, z, opacity, y || 0.224);
    }
    puddleGlint(-1.2, 7.75, 0xa9d8ef, 2.2, 1.3, 0.2, 0.068);
    puddleGlint(4.9, 9.4, 0xffbf7d, 1.9, 1.0, 0.16, 0.068);
    puddleGlint(7.9, 3.2, 0x6bd7e5, 1.7, 0.95, 0.16, 0.068);
    puddleGlint(-7.7, 5.15, 0xa9d8ef, 1.3, 0.7, 0.14, 0.224);
    puddleGlint(4.4, 5.35, 0xffb477, 1.4, 0.75, 0.22, 0.224);

    // long wet glints along the curb
    addReflectionStreak(wet, 0xc7e4f3, 0.16, 6.8, -0.4, 6.42, 0.1, 0, 0.202);
    addReflectionStreak(wet, 0xc7e4f3, 0.14, 4.8, 6.42, -0.8, 0.08, Math.PI / 2, 0.202);

    // rain streaks
    const count = COARSE_POINTER ? 980 : 1450;
    const positions = new Float32Array(count * 6);
    const drops = [];
    for (let i = 0; i < count; i++) {
      const d = {
        x: rr(-12.5, 12.5),
        y: rr(0.4, 17),
        z: rr(-12.5, 12.5),
        len: rr(0.14, 0.38),
        speed: rr(9.5, 16.0),
        wind: rr(-0.24, -0.08),
        off: rr(0.03, 0.11)
      };
      drops.push(d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0x9fc2dd,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.NormalBlending,
      toneMapped: false
    });
    const lines = new THREE.LineSegments(geo, mat);
    lines.frustumCulled = false;
    lines.renderOrder = 12;
    scene.add(lines);
    rainState = {
      lines: lines,
      mat: mat,
      positions: positions,
      drops: drops,
      count: count
    };

    // ripple rings on wet ground
    const ringGeo = new THREE.RingGeometry(0.82, 1.0, 18);
    const zones = [
      [-1.2, 7.75, 1.4], [4.9, 9.4, 1.0], [7.9, 3.2, 1.1], [-7.7, 5.15, 0.8],
      [4.4, 5.35, 0.8], [-5.1, 3.2, 0.7], [1.0, 3.0, 2.2], [-3.5, 4.1, 1.7],
      [8.8, 6.2, 1.0], [-6.5, 0.15, 0.35], [5.7, -2.4, 0.8], [1.8, 6.2, 1.7]
    ];
    const rippleCount = COARSE_POINTER ? 18 : 26;
    for (let i = 0; i < rippleCount; i++) {
      const zone = zones[i % zones.length];
      const matR = new THREE.MeshBasicMaterial({
        color: i % 4 === 0 ? 0xd5ecf7 : 0x9ecde6,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false
      });
      const mesh = new THREE.Mesh(ringGeo, matR);
      mesh.rotation.x = -Math.PI / 2;
      mesh.renderOrder = 5;
      scene.add(mesh);
      const st = {
        mesh: mesh,
        mat: matR,
        phase: rand(),
        speed: rr(0.55, 1.1),
        x: zone[0], z: zone[1], rad: zone[2],
        last: 0
      };
      setRipplePosition(st);
      rippleStates.push(st);
    }

    // faint low mist sheets on the street
    const mistMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      color: 0x83b4cf,
      transparent: true,
      opacity: 0.035,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    const mist = addPlane(wet, 18, 5.4, mistMat, -1, 0.55, 8.8, {
      rot: [-Math.PI / 2, 0, 0]
    });
    mist.renderOrder = 6;

    registerAssembly(wet, 7.0, { duration: 1.0, drop: 0.35, scaleFrom: 0.08 });
  }

  function setRipplePosition(st) {
    const v = rand();
    let x, z;
    if (v < 0.52) {
      x = rr(-7.8, 5.6);
      z = rr(7.0, 10.2);
    } else if (v < 0.8) {
      x = rr(7.0, 10.2);
      z = rr(-8.4, 5.2);
    } else {
      const puddles = [[-1.2, 7.75], [4.9, 9.4], [7.9, 3.2], [4.4, 5.35], [-7.7, 5.15], [-5.1, 3.2]];
      const p = puddles[Math.floor(rand() * puddles.length)];
      x = p[0] + rr(-0.4, 0.4);
      z = p[1] + rr(-0.3, 0.3);
    }
    st.x = x;
    st.z = z;
    st.y = (x > 6.6 || z > 6.6) ? 0.063 : 0.224;
    st.mesh.position.set(x, st.y, z);
  }

  function updateRainAndRipples(dt, time) {
    if (!rainState) return;
    const rainStrength = SKIP_INTRO ? 1 : clamp((intro.elapsed - intro.rainStart) / 1.8, 0, 1);
    rainState.mat.opacity = 0.34 * rainStrength;
    if (rainStrength <= 0.01) {
      rainState.lines.visible = false;
      rippleStates.forEach(function (r) { r.mesh.visible = false; });
      return;
    }
    rainState.lines.visible = true;

    const arr = rainState.positions;
    const drops = rainState.drops;
    for (let i = 0; i < rainState.count; i++) {
      const d = drops[i];
      d.y -= d.speed * dt;
      d.x += d.wind * dt;
      d.z += d.off * dt;
      if (d.y < 0.05) {
        d.y = rr(11.5, 17.0);
        d.x = rr(-12.5, 12.5);
        d.z = rr(-12.5, 12.5);
        // keep drops from continuing into the covered shop
        if (d.x > -6.2 && d.x < 4.6 && d.z > -6.8 && d.z < 1.0) {
          d.z = rr(1.2, 11.5);
        }
      }
      if (d.x > -6.15 && d.x < 4.55 && d.z > -6.75 && d.z < 0.9 && d.y < 4.7) {
        d.z = rr(1.1, 11.0);
      }
      const idx = i * 6;
      arr[idx] = d.x;
      arr[idx + 1] = d.y;
      arr[idx + 2] = d.z;
      arr[idx + 3] = d.x + d.wind * 0.055;
      arr[idx + 4] = d.y - d.len;
      arr[idx + 5] = d.z + d.off * 0.055;
    }
    rainState.lines.geometry.attributes.position.needsUpdate = true;

    for (let i = 0; i < rippleStates.length; i++) {
      const r = rippleStates[i];
      const t = (time * r.speed + r.phase) % 1;
      if (t < r.last) setRipplePosition(r);
      r.last = t;
      const size = 0.04 + t * 0.15;
      r.mesh.scale.set(size, size * 0.74, size);
      r.mat.opacity = 0.1 * Math.sin(Math.PI * Math.min(1, t)) * rainStrength;
      r.mesh.visible = true;
    }
  }

  function buildRearAndSideDetails() {
    const g = new THREE.Group();
    g.name = 'rear-side-details';

    // right-hand service door and wall dressing
    addBox(g, 0.07, 1.85, 0.82, MAT.metalDark, 4.52, 1.31, -5.35, { cast: true });
    addBox(g, 0.09, 0.08, 0.94, MAT.teal, 4.54, 2.26, -5.35);
    addBox(g, 0.09, 0.08, 0.94, MAT.teal, 4.54, 0.36, -5.35);
    addBox(g, 0.09, 1.95, 0.06, MAT.teal, 4.54, 1.31, -5.8);
    addBox(g, 0.09, 1.95, 0.06, MAT.teal, 4.54, 1.31, -4.9);
    addBox(g, 0.04, 0.1, 0.05, MAT.metal, 4.55, 1.3, -5.6);
    addBox(g, 0.3, 0.1, 0.12, MAT.metalDark, 4.57, 2.43, -5.35);
    addCylinder(g, 0.06, 0.06, 0.06, 8, MAT.warmGlow, 4.63, 2.39, -5.35, { rot: [0, 0, Math.PI / 2] });
    addGlow(g, 0xffcb89, 0.7, 4.67, 2.36, -5.35, 0.2, { delay: 7.1 });
    addTextSign(g, 0.6, 0.16, makeTexture(512, 128, function (ctx, w, h) {
      ctx.fillStyle = '#174f52';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f4e7ce';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 34px "Yu Gothic", sans-serif';
      ctx.fillText('STAFF ONLY', w / 2, h / 2 + 2);
    }), 4.58, 2.14, -5.35, { rot: [0, Math.PI / 2, 0] });

    // rear wall base trim, panel seams and service window
    addBox(g, 10.42, 0.42, 0.06, MAT.teal, -0.8, 0.58, -6.75);
    addBox(g, 10.42, 0.1, 0.05, MAT.tealDark, -0.8, 2.73, -6.75);
    [-5.55, -4.35, -3.15, 0.2, 1.55, 3.2].forEach(function (x) {
      addBox(g, 0.035, 3.85, 0.03, toon(0xbaad98), x, 2.3, -6.745);
    });
    addBox(g, 0.8, 0.58, 0.1, MAT.metalDark, 1.55, 2.02, -6.73);
    addPlane(g, 0.66, 0.44, new THREE.MeshBasicMaterial({ color: 0xffc27a, toneMapped: false }),
      1.55, 2.02, -6.79, { rot: [0, Math.PI, 0] });
    addBox(g, 0.04, 0.58, 0.04, MAT.metal, 1.38, 2.02, -6.8);
    addBox(g, 0.04, 0.58, 0.04, MAT.metal, 1.72, 2.02, -6.8);
    addGlow(g, 0xffb568, 0.8, 1.55, 2.0, -6.82, 0.16, { delay: 7.15 });
    addBox(g, 0.82, 0.42, 0.07, MAT.metalDark, 3.15, 2.6, -6.73);
    for (let i = 0; i < 5; i++) {
      addBox(g, 0.72, 0.035, 0.04, MAT.metal, 3.15, 2.46 + i * 0.07, -6.78);
    }
    // utility meter and conduit
    addBox(g, 0.42, 0.55, 0.12, MAT.metal, -4.65, 1.55, -6.74);
    addBox(g, 0.28, 0.32, 0.02, MAT.white, -4.65, 1.58, -6.81);
    addCylinder(g, 0.03, 0.03, 3.1, 6, MAT.metalDark, -4.95, 1.7, -6.77);
    addCylinder(g, 0.03, 0.03, 2.3, 6, MAT.metalDark, 4.12, 1.5, -6.77);
    // shallow canopy over the back door
    addBox(g, 1.2, 0.09, 0.55, MAT.tealDark, -2.05, 2.58, -7.0, { cast: true });
    addBox(g, 1.05, 0.02, 0.45, MAT.cream, -2.05, 2.53, -7.0);
    // small back-of-house sign
    addBox(g, 1.72, 0.46, 0.09, MAT.tealDark, 3.05, 3.28, -6.74);
    addTextSign(g, 1.58, 0.35, makeTexture(768, 192, function (ctx, w, h) {
      ctx.fillStyle = '#1b6263';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f7edd8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 47px "Yu Gothic", "Meiryo", sans-serif';
      ctx.fillText('納品口  ·  DELIVERY', w / 2, h / 2 + 2);
    }), 3.05, 3.28, -6.8, { rot: [0, Math.PI, 0] });
    // rear security camera
    addBox(g, 0.2, 0.13, 0.28, MAT.white, 0.1, 3.2, -6.85);
    addSphere(g, 0.055, MAT.black, 0.1, 3.19, -7.0, { detail: 1 });
    addGlow(g, 0xff6555, 0.1, 0.1, 3.16, -7.02, 0.5, { delay: 7.2 });

    // side-wall poster and vent
    addBox(g, 0.08, 1.05, 0.76, MAT.metalDark, 4.53, 2.02, -4.3);
    addTextSign(g, 0.62, 0.9, posterTexture(5), 4.58, 2.02, -4.3, { rot: [0, Math.PI / 2, 0] });
    addBox(g, 0.28, 0.42, 0.32, MAT.metal, 4.56, 3.42, -4.7, { cast: true });
    for (let i = 0; i < 4; i++) {
      addBox(g, 0.02, 0.03, 0.28, MAT.metalDark, 4.71, 3.3 + i * 0.085, -4.7);
    }
    addCylinder(g, 0.05, 0.05, 3.4, 8, MAT.metalDark, 4.57, 2.0, -6.42);
    addCylinder(g, 0.12, 0.12, 0.08, 8, MAT.metal, 4.57, 3.62, -6.42);

    // rear service door
    addBox(g, 0.9, 1.9, 0.08, MAT.metalDark, -2.05, 1.32, -6.7, { cast: true });
    addBox(g, 1.02, 0.09, 0.1, MAT.teal, -2.05, 2.28, -6.71);
    addBox(g, 1.02, 0.09, 0.1, MAT.teal, -2.05, 0.36, -6.71);
    addBox(g, 0.08, 1.95, 0.1, MAT.teal, -2.55, 1.32, -6.71);
    addBox(g, 0.08, 1.95, 0.1, MAT.teal, -1.55, 1.32, -6.71);
    addBox(g, 0.22, 0.05, 0.05, MAT.metal, -2.35, 1.25, -6.76);
    addBox(g, 0.7, 0.15, 0.45, MAT.concrete, -2.05, 0.245, -6.95);
    addBox(g, 0.4, 0.1, 0.12, MAT.metalDark, -2.05, 2.4, -6.75);
    addCylinder(g, 0.07, 0.07, 0.06, 8, MAT.warmGlow, -2.05, 2.36, -6.82, { rot: [Math.PI / 2, 0, 0] });
    addGlow(g, 0xffc887, 0.5, -2.05, 2.3, -6.9, 0.12, { delay: 7.2 });
    addTextSign(g, 0.62, 0.18, makeTexture(512, 128, function (ctx, w, h) {
      ctx.fillStyle = '#174f52';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f4e7ce';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 34px "Yu Gothic", sans-serif';
      ctx.fillText('STAFF ONLY', w / 2, h / 2 + 2);
    }), -2.05, 2.12, -6.76, { rot: [0, Math.PI, 0] });

    // crates and a compact dumpster behind the shop
    for (let i = 0; i < 3; i++) {
      addBox(g, 0.62, 0.3, 0.46, i === 2 ? MAT.orange : MAT.woodDark, -3.4, 0.33 + i * 0.31, -7.2, {
        rotY: 0.06 * i, cast: true
      });
    }
    addBox(g, 1.05, 0.82, 0.66, toon(0x315a53), 1.35, 0.63, -7.25, { cast: true, outline: 0.008 });
    addBox(g, 1.09, 0.09, 0.7, MAT.metalDark, 1.35, 1.08, -7.25);
    addBox(g, 0.08, 0.06, 0.9, MAT.metal, 1.35, 1.12, -7.25);
    addCylinder(g, 0.07, 0.07, 0.08, 8, MAT.black, 0.95, 0.14, -7.2);
    addCylinder(g, 0.07, 0.07, 0.08, 8, MAT.black, 1.75, 0.14, -7.2);
    addContactShadow(g, 1.3, 0.9, 1.35, -7.25, 0.34, 0.198);

    // low rear boundary wall with a hedge
    addBox(g, 16.4, 1.05, 0.22, MAT.concreteDark, 2.0, 0.65, -10.35, { cast: true, receive: true, outline: 0.008 });
    addBox(g, 16.5, 0.1, 0.3, MAT.concrete, 2.0, 1.22, -10.35);
    for (let i = 0; i < 15; i++) {
      addSphere(g, 0.36, i % 2 ? MAT.foliage : MAT.foliageLight, -5.6 + i * 1.05, 1.42, -10.18, {
        scale: [1.05, 0.72, 0.88], detail: 1, outline: 0.006
      });
    }
    addBox(g, 0.18, 0.3, 0.04, MAT.white, -6.0, 0.65, -10.22);
    addBox(g, 0.18, 0.3, 0.04, MAT.white, 10.0, 0.65, -10.22);

    // subtle cold spill on the service strip
    addGroundGlow(g, 0x507f8d, 5.0, 2.0, -1.6, -7.3, 0.08, 0.198);
    addGroundGlow(g, 0xffb66f, 2.2, 1.6, -2.05, -6.8, 0.12, 0.2);

    const rearLight = new THREE.PointLight(0xffb875, 0.22, 3.6, 1.5);
    rearLight.position.set(-2.05, 2.22, -6.98);
    diorama.add(rearLight);
    addLight(rearLight, 7.1, 0.22);

    diorama.add(g);
    registerAssembly(g, 5.6, { duration: 1.0, drop: 0.6, scaleFrom: 0.03 });
    return g;
  }
  buildBase();
  buildStreets();
  buildStoreExterior();
  buildStoreInterior();
  buildStreetProps();
  buildRearAndSideDetails();
  buildRainAndReflections();
  linearizeSceneColors();

  /* Lights that make the whole model readable */
  const hemi = new THREE.HemisphereLight(0x688bb6, 0x070b13, 0.22);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0x93b4dd, 0.35);
  moon.position.set(12, 20, 11);
  moon.castShadow = true;
  moon.shadow.mapSize.set(COARSE_POINTER ? 1024 : 2048, COARSE_POINTER ? 1024 : 2048);
  moon.shadow.camera.left = -18;
  moon.shadow.camera.right = 18;
  moon.shadow.camera.top = 18;
  moon.shadow.camera.bottom = -18;
  moon.shadow.camera.near = 1;
  moon.shadow.camera.far = 55;
  moon.shadow.bias = -0.00045;
  scene.add(moon);

  const fill = new THREE.DirectionalLight(0x3a5b86, 0.12);
  fill.position.set(-14, 7, -12);
  scene.add(fill);

  /* ------------------------------------------------------------
     Render loop (temporary, extended later)
     ------------------------------------------------------------ */
  const clock = new THREE.Clock();
  let totalTime = SKIP_INTRO ? 30 : 0;

  function updateAssembly(dt) {
    if (SKIP_INTRO) {
      for (let i = 0; i < assemblyItems.length; i++) {
        const it = assemblyItems[i];
        it.node.visible = true;
        it.node.position.copy(it.homePos);
        it.node.rotation.copy(it.homeRot);
        it.node.scale.copy(it.homeScale);
      }
      for (let i = 0; i < lightItems.length; i++) {
        lightItems[i].intensity = lightItems[i].userData.baseIntensity;
      }
      for (let i = 0; i < glowSprites.length; i++) glowSprites[i].sprite.material.opacity = glowSprites[i].baseOpacity;
      return;
    }

    const e = intro.elapsed;
    for (let i = 0; i < assemblyItems.length; i++) {
      const it = assemblyItems[i];
      const t = clamp((e - it.delay) / it.duration, 0, 1);
      if (t <= 0) {
        it.node.visible = false;
        continue;
      }
      it.node.visible = true;
      const posEase = easeOutCubic(t);
      const pop = easeOutBack(t);
      it.node.position.set(
        it.homePos.x,
        it.homePos.y - it.drop * (1 - posEase),
        it.homePos.z
      );
      it.node.rotation.set(it.homeRot.x, it.homeRot.y + it.spin * (1 - posEase), it.homeRot.z);
      const s = it.scaleFrom + (1 - it.scaleFrom) * pop;
      it.node.scale.set(it.homeScale.x * s, it.homeScale.y * s, it.homeScale.z * s);
      if (t >= 1) {
        it.node.position.copy(it.homePos);
        it.node.rotation.copy(it.homeRot);
        it.node.scale.copy(it.homeScale);
      }
    }

    for (let i = 0; i < lightItems.length; i++) {
      const l = lightItems[i];
      const t = clamp((e - l.userData.asmDelay) / 0.55, 0, 1);
      let flicker = 1;
      if (t > 0 && t < 1) {
        flicker = 0.55 + 0.45 * Math.abs(Math.sin(e * 41 + i * 2.1));
      }
      l.intensity = l.userData.baseIntensity * easeOutCubic(t) * flicker;
    }

    for (let i = 0; i < glowSprites.length; i++) {
      const gs = glowSprites[i];
      const t = clamp((e - gs.delay) / 0.7, 0, 1);
      gs.sprite.material.opacity = gs.baseOpacity * easeOutCubic(t);
    }
  }

  function finishCameraIntro() {
    if (SKIP_INTRO || intro.cameraDone) return;
    intro.cameraDone = true;
    controls.target.copy(HERO_TARGET);
    controls.enabled = true;
    controls.update();
  }

  // A drag or wheel gesture during the opening shot immediately hands control to the viewer.
  renderer.domElement.addEventListener('pointerdown', finishCameraIntro, { capture: true });
  renderer.domElement.addEventListener('wheel', finishCameraIntro, { capture: true, passive: true });
  renderer.domElement.addEventListener('touchstart', finishCameraIntro, { capture: true, passive: true });

  function updateCameraIntro() {
    if (SKIP_INTRO || intro.cameraDone) return;
    const t = clamp(intro.elapsed / intro.cameraEnd, 0, 1);
    const k = easeInOutCubic(t);
    camera.position.lerpVectors(INTRO_POS, HERO_POS, k);
    controls.target.lerpVectors(INTRO_TARGET, HERO_TARGET, k);
    camera.lookAt(controls.target);
    if (t >= 1) {
      intro.cameraDone = true;
      controls.enabled = true;
      camera.position.copy(HERO_POS);
      controls.target.copy(HERO_TARGET);
      controls.update();
    }
  }

  window.addEventListener('keydown', function (e) {
    if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey && !CUSTOM_CAM) {
      intro.elapsed = 0;
      intro.cameraDone = false;
      totalTime = 0;
      controls.enabled = false;
      camera.position.copy(INTRO_POS);
      controls.target.copy(INTRO_TARGET);
      controls.update();
      for (let i = 0; i < lightItems.length; i++) lightItems[i].intensity = 0;
      for (let i = 0; i < glowSprites.length; i++) glowSprites[i].sprite.material.opacity = 0;
      if (rainState) rainState.mat.opacity = 0;
      document.body.removeAttribute('data-rendered');
    }
  });

  let stillFrames = 0;
  function animate() {
    if (!STILL || stillFrames < 3) requestAnimationFrame(animate);
    const dt = Math.min(0.05, clock.getDelta());
    totalTime += dt;
    if (FORCE_TIME !== null && isFinite(FORCE_TIME)) {
      intro.elapsed = FORCE_TIME;
      totalTime = 12 + FORCE_TIME;
    } else if (!SKIP_INTRO) {
      intro.elapsed += dt;
    } else {
      intro.elapsed = 999;
    }
    updateAssembly(dt);
    updateCameraIntro();
    updateRainAndRipples(dt, totalTime);
    if (steamSpritesRef) {
      const steamOn = SKIP_INTRO ? 1 : clamp((intro.elapsed - 5.0) / 1.4, 0, 1);
      for (let i = 0; i < steamSpritesRef.length; i++) {
        const s = steamSpritesRef[i];
        const t = (totalTime * s.speed + s.phase) % 1;
        s.sprite.position.y = s.y0 + t * 0.95;
        s.sprite.position.x = s.x0 + Math.sin(t * 7 + s.phase) * 0.1;
        s.sprite.scale.set(0.16 + t * 0.24, 0.13 + t * 0.2, 1);
        s.sprite.material.opacity = 0.13 * (1 - t) * steamOn;
      }
    }
    if (controls.enabled) controls.update();
    renderer.render(scene, camera);
    stillFrames++;
    if (STILL && stillFrames >= 3) document.body.setAttribute('data-rendered', '1');
  }
  animate();
})();
