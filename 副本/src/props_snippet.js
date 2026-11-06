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
      addGlow(unit, glowColors[i], 1.35, 0.65, WALK_Y + 1.0, 0, 0.13, { delay: 6.2 + i * 0.1 });
      addGroundGlow(unit, glowColors[i], 2.2, 2.4, 1.1, 0, 0.13, WALK_Y + 0.02);
      addContactShadow(unit, 1.35, 1.25, 0.04, 0, 0.35, WALK_Y + 0.012);
      g.add(unit);
      registerAssembly(unit, 5.82 + i * 0.08, { duration: 0.85, drop: 0.8, scaleFrom: 0.04 });
    });

    const vendLight = new THREE.PointLight(0xff987c, 0.85, 5.5, 1.6);
    vendLight.position.set(5.7, 1.45, -3.55);
    diorama.add(vendLight);
    addLight(vendLight, 6.45, 0.85);

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
    g.position.set(6.24, 0, 6.15);
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
    addGlow(g, 0xffcb8b, 2.2, 0, 5.85, 1.42, 0.28, { delay: 6.4 });
    // soft light cone
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(3.3, 5.5, 20, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffb86f, transparent: true, opacity: 0.045,
        depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false
      })
    );
    cone.position.set(0, 3.05, 1.4);
    g.add(cone);
    addGroundGlow(g, 0xffb875, 7.2, 6.5, 0, 1.5, 0.15, WALK_Y + 0.015);
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

    const lampLight = new THREE.PointLight(0xffc587, 1.8, 16, 1.3);
    lampLight.position.set(6.24, 6.0, 7.55);
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

    // gable roof
    const roofMat = MAT.roofTile;
    const roofL = addBox(g, 2.35, 0.16, 7.8, roofMat, cx - 1.02, 6.06, cz, {
      rot: [0, 0, -0.48], cast: true, outline: 0.012
    });
    const roofR = addBox(g, 2.35, 0.16, 7.8, roofMat, cx + 1.02, 6.06, cz, {
      rot: [0, 0, 0.48], cast: true, outline: 0.012
    });
    addBox(g, 0.18, 0.18, 7.9, MAT.tealDark, cx, 6.62, cz);
    addBox(g, 3.8, 0.12, 0.16, MAT.woodDark, cx, 5.48, cz - 3.72);
    addBox(g, 3.8, 0.12, 0.16, MAT.woodDark, cx, 5.48, cz + 3.72);

    // front gable triangle
    const shape = new THREE.Shape();
    shape.moveTo(-1.68, 0);
    shape.lineTo(1.68, 0);
    shape.lineTo(0, 1.13);
    shape.closePath();
    const gableMat = toon(0x656e7d);
    const gable = new THREE.Mesh(new THREE.ShapeGeometry(shape), gableMat);
    gable.position.set(cx, 5.4, -2.18);
    g.add(gable);
    const gable2 = gable.clone();
    gable2.position.z = -9.38;
    gable2.rotation.y = Math.PI;
    g.add(gable2);

    // front facade details
    const facadeZ = -2.18;
    // second floor sliding window, warm
    addBox(g, 2.0, 1.1, 0.08, MAT.metalDark, -8.9, 4.55, facadeZ - 0.02);
    addPlane(g, 1.84, 0.94, new THREE.MeshBasicMaterial({ color: 0xd8a662, toneMapped: true }),
      -8.9, 4.55, facadeZ - 0.07);
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
    addPlane(g, 1.4, 0.9, new THREE.MeshBasicMaterial({ color: 0xf0c178, toneMapped: true }),
      -8.35, 2.23, facadeZ - 0.07);
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
    tilt.forEach(function (off, i) {
      const um = new THREE.Group();
      um.position.set(-0.1 + i * 0.1, WALK_Y + 0.6, 0.02 + (i - 1) * 0.06);
      um.rotation.z = off;
      um.rotation.x = off * 0.6;
      addCylinder(um, 0.012, 0.012, 1.0, 6, MAT.metal, 0, 0.45, 0);
      const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.075, 0.78, 8, 1, true), new THREE.MeshPhongMaterial({
        color: 0xd7eef3, transparent: true, opacity: 0.42, side: THREE.DoubleSide,
        depthWrite: false, shininess: 110, specular: 0xffffff
      }));
      canopy.position.set(0, 0.5, 0);
      um.add(canopy);
      addCylinder(um, 0.005, 0.005, 0.1, 4, MAT.metal, 0, 1.0, 0);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 4, 10, Math.PI * 1.2), MAT.woodDark);
      handle.position.set(0.06, -0.03, 0);
      handle.rotation.z = 0.1;
      um.add(handle);
      g.add(um);
    });
    addBox(g, 0.3, 0.08, 0.03, MAT.white, 0, WALK_Y + 0.38, 0.25);
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
    const railMat = toon(0xe3e3d6);
    const greenMat = toon(0x4b8a76);
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
    segment(6.32, 5.75, 6.32, -8.2, 9);
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
    return g;
  }

  function buildStreetProps() {
    buildVendingMachines();
    buildPylonSign();
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
