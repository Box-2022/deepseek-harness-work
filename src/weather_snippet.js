  /* ------------------------------------------------------------
     Rain, wet reflections, ripples
     ------------------------------------------------------------ */
  let rainState = null;
  const rippleStates = [];

  function buildRainAndReflections() {
    // neon / interior light smeared across the wet pavement
    addReflectionStreak(diorama, 0xffad66, 1.75, 4.6, -3.55, 3.05, 0.16, 0.03, 0.222);
    addReflectionStreak(diorama, 0xffbf78, 1.35, 3.8, -1.3, 3.3, 0.12, -0.04, 0.222);
    addReflectionStreak(diorama, 0x65ddd4, 1.55, 4.1, -5.6, 3.35, 0.1, 0.05, 0.222);
    addReflectionStreak(diorama, 0xff9f58, 1.2, 3.4, 2.5, 3.1, 0.13, 0.02, 0.222);
    addReflectionStreak(diorama, 0xff8d77, 1.55, 4.5, 5.55, -2.15, 0.16, -0.02, 0.222);
    addReflectionStreak(diorama, 0x66e3ff, 1.15, 3.5, 6.0, -4.35, 0.13, 0.02, 0.222);
    addReflectionStreak(diorama, 0xffc17b, 1.55, 5.7, 6.3, 8.4, 0.17, 0, 0.064);
    addReflectionStreak(diorama, 0x9ae8df, 1.1, 4.3, 5.6, 8.3, 0.065, 0.05, 0.064);
    addReflectionStreak(diorama, 0x86a4c1, 0.34, 7.0, -3.8, 8.8, 0.05, 0.02, 0.064);
    addReflectionStreak(diorama, 0x86a4c1, 0.3, 5.0, 8.8, -1.8, 0.045, Math.PI / 2, 0.064);
    addReflectionStreak(diorama, 0xd9e8e5, 2.4, 2.2, 3.8, 8.6, 0.035, 0, 0.064);

    addGroundGlow(diorama, 0xffa962, 4.8, 3.7, -2.3, 2.9, 0.11, 0.224);
    addGroundGlow(diorama, 0x66d9cf, 3.0, 2.8, -5.2, 3.1, 0.07, 0.224);
    addGroundGlow(diorama, 0xffb978, 4.5, 4.8, 6.3, 7.3, 0.09, 0.065);

    // puddle glints
    function puddleGlint(x, z, color, w, d, opacity, y) {
      addGroundGlow(diorama, color, w, d, x, z, opacity, y || 0.224);
    }
    puddleGlint(-1.2, 7.75, 0xa9d8ef, 2.0, 1.15, 0.13, 0.068);
    puddleGlint(4.9, 9.4, 0xffbf7d, 1.6, 0.9, 0.09, 0.068);
    puddleGlint(7.9, 3.2, 0x6bd7e5, 1.5, 0.8, 0.1, 0.068);
    puddleGlint(-7.7, 5.15, 0xa9d8ef, 1.1, 0.6, 0.08, 0.224);
    puddleGlint(4.4, 5.35, 0xffb477, 1.2, 0.6, 0.1, 0.224);

    // long wet glints along the curb
    addReflectionStreak(diorama, 0xc7e4f3, 0.16, 6.8, -0.4, 6.42, 0.1, 0, 0.202);
    addReflectionStreak(diorama, 0xc7e4f3, 0.14, 4.8, 6.42, -0.8, 0.08, Math.PI / 2, 0.202);

    // rain streaks
    const count = 1450;
    const positions = new Float32Array(count * 6);
    const drops = [];
    for (let i = 0; i < count; i++) {
      const d = {
        x: rr(-12.5, 12.5),
        y: rr(0.4, 17),
        z: rr(-12.5, 12.5),
        len: rr(0.22, 0.55),
        speed: rr(8.8, 15.5),
        wind: rr(-0.24, -0.08),
        off: rr(0.03, 0.11)
      };
      drops.push(d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xb9d8ed,
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
    for (let i = 0; i < 38; i++) {
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
    const mist = addPlane(diorama, 18, 5.4, mistMat, -1, 0.55, 8.8, {
      rot: [-Math.PI / 2, 0, 0]
    });
    mist.renderOrder = 6;
  }

  function setRipplePosition(st) {
    const v = rand();
    let x, z, rad;
    if (v < 0.45) {
      x = rr(-4.0, 5.8);
      z = rr(6.95, 10.3);
      rad = rr(0.5, 1.1);
    } else if (v < 0.68) {
      x = rr(-6.0, 5.6);
      z = rr(1.0, 5.9);
      rad = rr(0.4, 1.0);
    } else if (v < 0.84) {
      x = rr(6.95, 10.2);
      z = rr(-8.5, 5.0);
      rad = rr(0.4, 1.0);
    } else {
      x = rr(-8.0, 5.8);
      z = rr(-9.6, 0.5);
      rad = rr(0.4, 0.9);
    }
    // avoid landing inside the shop footprint
    if (x > -6.0 && x < 4.4 && z > -6.6 && z < 0.6) {
      x = 1.0 + rand() * 4.0;
      z = 3.0 + rand() * 3.0;
    }
    st.x = x;
    st.z = z;
    st.rad = rad;
    st.y = (x > 6.6 || z > 6.6) ? 0.061 : 0.218;
    st.mesh.position.set(x, st.y, z);
  }

  function updateRainAndRipples(dt, time) {
    if (!rainState) return;
    const rainStrength = SKIP_INTRO ? 1 : clamp((intro.elapsed - intro.rainStart) / 1.8, 0, 1);
    rainState.mat.opacity = 0.46 * rainStrength;
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
      const size = 0.12 + t * 0.46;
      r.mesh.scale.set(size, size, size);
      r.mat.opacity = 0.3 * Math.sin(Math.PI * Math.min(1, t)) * rainStrength;
      r.mesh.visible = true;
    }
  }
