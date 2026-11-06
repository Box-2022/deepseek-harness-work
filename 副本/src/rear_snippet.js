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

    const rearLight = new THREE.PointLight(0xffb875, 0.55, 6.0, 1.4);
    rearLight.position.set(-2.05, 2.3, -7.35);
    diorama.add(rearLight);
    addLight(rearLight, 7.1, 0.55);

    diorama.add(g);
    registerAssembly(g, 5.6, { duration: 1.0, drop: 0.6, scaleFrom: 0.03 });
    return g;
  }

  buildRearAndSideDetails();
