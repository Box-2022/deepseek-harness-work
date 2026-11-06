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
        mesh.setColorAt(i, col.setHex(it.color));
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
    addBox(g, 10.24, 0.06, 7.0, MAT.white, -0.8, CEIL, -3.0, { receive: true });
    addBox(g, 10.12, 2.62, 0.08, MAT.cream, -0.8, 1.7, -6.47, { receive: true });
    addBox(g, 0.08, 2.62, 6.96, MAT.wallSide, -5.88, 1.7, -3.0, { receive: true });
    addBox(g, 0.08, 2.62, 6.96, MAT.cream, 4.28, 1.7, -3.0, { receive: true });
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
      addBox(unit, 1.1, 2.18, 0.035, MAT.coolGlow, 0, FLOOR + 1.24, -6.29);
      addBox(unit, 1.13, 0.06, 0.06, MAT.tealDark, 0, FLOOR + 2.48, -5.69);
      addBox(unit, 0.06, 2.24, 0.06, MAT.tealDark, -0.575, FLOOR + 1.24, -5.71);
      addBox(unit, 0.06, 2.24, 0.06, MAT.tealDark, 0.575, FLOOR + 1.24, -5.71);
      addBox(unit, 0.08, 2.18, 0.07, MAT.metal, 0.0, FLOOR + 1.24, -5.7);
      addPlane(unit, 1.14, 2.16, MAT.glassWarm, 0, FLOOR + 1.24, -5.685, { renderOrder: 7 });
      for (let s = 0; s < 4; s++) {
        const sy = FLOOR + 0.7 + s * 0.42;
        addBox(unit, 1.1, 0.035, 0.46, MAT.whiteBright, 0, sy, -5.93);
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
      addLight(new THREE.PointLight(0xffcc8c, 0.95, 7.5, 1.4), 5.3, 0.95)
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
      const mesh = addPlane(g, 2.0, 0.5, mat, x, 2.58, z);
      mesh.renderOrder = 5;
      addCylinder(g, 0.008, 0.008, 0.36, 4, MAT.metalDark, x - 0.75, 2.95, z);
      addCylinder(g, 0.008, 0.008, 0.36, 4, MAT.metalDark, x + 0.75, 2.95, z);
    }
    hangSign('おにぎり・お弁当', 'RICE & BENTO', '#f3ead9', '#1d5e61', '#d79545', -3.2, -2.2, true);
    hangSign('ドリンク・お酒', 'DRINKS', '#1f6668', '#fff8e7', '#e5b366', -1.0, -3.9, true);
    hangSign('ホットスナック', 'HOT SNACK', '#e9d9be', '#803d34', '#c47e3a', 2.35, -3.3, true);

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
    g.userData.steamSprites = steamSprites;
    window.__steamSprites = steamSprites;

    diorama.add(g);
    registerAssembly(g, 2.25, { duration: 1.25, drop: 1.2, scaleFrom: 0.04 });

    // product instancing group
    const productGroup = new THREE.Group();
    productGroup.position.copy(PRODUCT_CENTER);
    productBoxes.build(productGroup);
    productCans.build(productGroup);
    productBottles.build(productGroup);
    diorama.add(productGroup);
    registerAssembly(productGroup, 4.12, { duration: 1.25, drop: 0.2, scaleFrom: 0.04 });

    // interior lights
    const interiorLight = new THREE.PointLight(0xffc885, 1.15, 10, 1.2);
    interiorLight.position.set(-2.1, 2.68, -1.7);
    diorama.add(interiorLight);
    addLight(interiorLight, 5.1, 1.15);

    const interiorLight2 = new THREE.PointLight(0xffd39a, 1.0, 9, 1.2);
    interiorLight2.position.set(2.0, 2.68, -3.9);
    diorama.add(interiorLight2);
    addLight(interiorLight2, 5.2, 1.0);

    const fridgeLight = new THREE.PointLight(0xbfefff, 0.9, 7, 1.3);
    fridgeLight.position.set(-1.8, 2.2, -5.35);
    diorama.add(fridgeLight);
    addLight(fridgeLight, 4.4, 0.9);

    const canopyLight = new THREE.PointLight(0xffbb7a, 0.65, 7.5, 1.4);
    canopyLight.position.set(-1.1, 2.6, 1.65);
    diorama.add(canopyLight);
    addLight(canopyLight, 6.0, 0.65);

    return g;
  }

  buildStoreInterior();
