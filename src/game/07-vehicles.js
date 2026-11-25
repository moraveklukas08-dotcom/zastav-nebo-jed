/* ============================== vehicles & people ============================== */
let BUILD = null;
function extrudeProfile(pts, depth, bevel) {
  const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 1 });
  g.translate(0, 0, -depth / 2); g.rotateY(-Math.PI / 2); g.computeVertexNormals(); return g;
}
const CAR_TYPES = {
  sedan: { L: 4.5, wb: [-1.42, 1.38], body: [[-2.25, 0.3], [-2.3, 0.6], [-2.12, 0.84], [-0.95, 0.98], [1.75, 0.98], [2.22, 0.9], [2.3, 0.62], [2.25, 0.3]], glass: [[-0.95, 0.96], [-0.3, 1.37], [0.95, 1.37], [1.7, 0.96]], roof: [[-0.36, 1.35], [0.98, 1.35], [0.95, 1.42], [-0.3, 1.42]], lampY: 0.78 },
  hatch: { L: 4.0, wb: [-1.25, 1.22], body: [[-2.0, 0.3], [-2.05, 0.6], [-1.86, 0.84], [-0.8, 0.98], [1.85, 0.98], [2.0, 0.92], [2.02, 0.6], [1.98, 0.3]], glass: [[-0.8, 0.96], [-0.15, 1.41], [1.6, 1.41], [1.94, 0.96]], roof: [[-0.2, 1.39], [1.66, 1.39], [1.62, 1.46], [-0.14, 1.46]], lampY: 0.8 },
  suv: { L: 4.6, wb: [-1.45, 1.42], body: [[-2.3, 0.38], [-2.35, 0.72], [-2.16, 1.0], [-1.0, 1.12], [2.15, 1.12], [2.3, 1.05], [2.32, 0.7], [2.28, 0.38]], glass: [[-1.0, 1.1], [-0.45, 1.6], [2.0, 1.6], [2.2, 1.1]], roof: [[-0.5, 1.58], [2.06, 1.58], [2.02, 1.67], [-0.44, 1.67]], lampY: 0.92 },
};
function lampSet(g, W, L, yF, yR, zF, zR) {
  const brake = new THREE.MeshStandardMaterial({ color: 0x4a0000, emissive: 0xff1a10, emissiveIntensity: 0.6 });
  const indL = new THREE.MeshStandardMaterial({ color: 0x553300, emissive: 0xff9a00, emissiveIntensity: 0 });
  const indR = indL.clone();
  for (const sx of [-1, 1]) {
    RB(g, 0.38, 0.13, 0.08, 0.03, M.head, sx * (W / 2 - 0.32), yF, zF, false);
    RB(g, 0.36, 0.14, 0.08, 0.03, brake, sx * (W / 2 - 0.3), yR, zR, false);
    B(g, 0.1, 0.1, 0.06, sx < 0 ? indL : indR, sx * (W / 2 - 0.05), yF, zF + 0.02, false);
    B(g, 0.1, 0.1, 0.06, sx < 0 ? indL : indR, sx * (W / 2 - 0.05), yR + 0.14, zR - 0.02, false);
  }
  if (BUILD && BUILD.night) {
    const wm = cached('spr:w', () => new THREE.SpriteMaterial({ map: glowTex(), color: 0xfff3d0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    const rm = cached('spr:r', () => new THREE.SpriteMaterial({ map: glowTex(), color: 0xff2a1a, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0.7 }));
    for (const sx of [-1, 1]) { const s = new THREE.Sprite(wm); s.scale.setScalar(1.6); s.position.set(sx * (W / 2 - 0.32), yF, zF - 0.1); g.add(s); const r = new THREE.Sprite(rm); r.scale.setScalar(0.8); r.position.set(sx * (W / 2 - 0.3), yR, zR + 0.1); g.add(r); }
  }
  g.userData.blink = null;
  g.userData.setBrake = b => { brake.emissiveIntensity = b ? 3.6 : 0.6; };
  g.userData.setBlink = m => { g.userData.blink = m; };
  const prev = g.userData.tick;
  g.userData.tick = t => { const on = Math.floor(t * 2.7) % 2 === 0, m = g.userData.blink; indL.emissiveIntensity = (m === 'left' || m === 'hazard') && on ? 3.5 : 0; indR.emissiveIntensity = (m === 'right' || m === 'hazard') && on ? 3.5 : 0; if (prev) prev(t); };
  if (BUILD) BUILD.tickers.push(g);
}
function wheelSet(g, W, zs, r, wide = 0.24) {
  const tg = cached('g:tire' + r + wide, () => new THREE.CylinderGeometry(r, r, wide, 20).rotateZ(Math.PI / 2));
  const rg = cached('g:rimw' + r + wide, () => new THREE.CylinderGeometry(r * 0.62, r * 0.62, wide + 0.02, 14).rotateZ(Math.PI / 2));
  const ws = [];
  for (const sx of [-1, 1]) for (const z of zs) { const w = new THREE.Group(); w.position.set(sx * (W / 2 - 0.12), r, z); const t = new THREE.Mesh(tg, M.tire); t.castShadow = true; w.add(t); w.add(new THREE.Mesh(rg, M.rim)); g.add(w); ws.push(w); }
  const prev = g.userData.anim; g.userData.anim = (v, dt) => { for (const w of ws) w.rotation.x -= v * dt / r; if (prev) prev(v, dt); };
  return ws;
}
function plateMat(i) {
  return cached('m:plate' + i, () => {
    const [c, g] = makeCanvas(512, 112); g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, 512, 112); g.lineWidth = 6; g.strokeStyle = '#111'; g.strokeRect(3, 3, 506, 106);
    g.fillStyle = '#1f47a8'; g.fillRect(6, 6, 58, 100); g.fillStyle = '#ffd400'; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.beginPath(); g.arc(35 + Math.cos(a) * 15, 36 + Math.sin(a) * 15, 2.6, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#fff'; g.font = '700 30px ' + FONT; g.textAlign = 'center'; g.fillText('CZ', 35, 96);
    const L = 'ABCEHJKLMPSTUZ', D = '0123456789', r = s => s[(Math.random() * s.length) | 0];
    g.fillStyle = '#111'; g.font = '700 84px ' + FONT; g.textBaseline = 'middle'; g.fillText(r(D.slice(1)) + r(L) + r(L + D) + ' ' + r(D) + r(D) + r(D) + r(D), 290, 60);
    const t = toTex(c, false); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.4 });
  });
}
function makeCar(color, type) {
  type = type || pick(['sedan', 'sedan', 'hatch', 'hatch', 'suv']);
  const T = CAR_TYPES[type], g = new THREE.Group(), W = 1.8, paint = paintMat(color);
  const body = new THREE.Mesh(cached('g:car:' + type + ':b', () => extrudeProfile(T.body, W - 0.16, 0.08)), paint); body.castShadow = body.receiveShadow = true; g.add(body);
  const gl = new THREE.Mesh(cached('g:car:' + type + ':g', () => extrudeProfile(T.glass, W - 0.3, 0.04)), M.glass); gl.castShadow = true; g.add(gl);
  g.add(new THREE.Mesh(cached('g:car:' + type + ':r', () => extrudeProfile(T.roof, W - 0.26, 0.04)), paint));
  const gy = (T.glass[0][1] + T.glass[1][1]) / 2;
  B(g, W - 0.2, T.glass[1][1] - T.glass[0][1] - 0.05, 0.1, paint, 0, gy, (T.glass[1][0] + T.glass[2][0]) / 2 + 0.25, false);
  RB(g, W + 0.02, 0.2, 0.3, 0.06, M.plastic, 0, 0.4, -T.L / 2 + 0.1, false);
  RB(g, W + 0.02, 0.2, 0.3, 0.06, M.plastic, 0, 0.4, T.L / 2 - 0.1, false);
  B(g, 0.9, 0.16, 0.05, M.black, 0, T.lampY - 0.05, -T.L / 2 - 0.04, false);
  wheelSet(g, W + 0.02, T.wb, 0.33);
  lampSet(g, W, T.L, T.lampY, T.lampY + 0.04, -T.L / 2 - 0.02, T.L / 2 + 0.02);
  const pm = plateMat((Math.random() * 10) | 0);
  for (const [z, ry] of [[-T.L / 2 - 0.045, Math.PI], [T.L / 2 + 0.045, 0]]) { const pl = new THREE.Mesh(vPlane, pm); pl.scale.set(0.52, 0.115, 1); pl.position.set(0, 0.5, z); pl.rotation.y = ry; g.add(pl); }
  for (const sx of [-1, 1]) RB(g, 0.16, 0.11, 0.13, 0.035, paint, sx * (W / 2 + 0.06), T.glass[0][1] + 0.08, T.glass[0][0] + 0.38, false);
  return g;
}
function makeVan(color, amb) {
  const g = new THREE.Group(); const L = 5.6, W = 2.0; const paint = paintMat(color);
  RB(g, W, 0.95, L, 0.12, paint, 0, 0.85, 0);
  RB(g, W, 1.3, 4.1, 0.14, paint, 0, 1.92, 0.72);
  RB(g, W * 0.96, 0.85, 1.35, 0.1, M.glass, 0, 1.72, -1.95);
  B(g, W + 0.02, 0.45, 2.6, M.glass, 0, 2.0, 0.2, false);
  wheelSet(g, W + 0.02, [-1.75, 1.75], 0.36);
  lampSet(g, W, L, 0.98, 1.15, -L / 2 - 0.02, L / 2 + 0.02);
  if (amb) {
    const green = mat('ambgreen', { color: 0x1f8a3a, roughness: 0.5 });
    for (let i = 0; i < 7; i++) B(g, W + 0.04, 0.34, 0.6, i % 2 ? paint : green, 0, 1.08, -2.5 + i * 0.8, false);
    const bl1 = new THREE.MeshStandardMaterial({ color: 0x0a1a55, emissive: 0x2060ff, emissiveIntensity: 0 }), bl2 = bl1.clone();
    RB(g, 0.6, 0.18, 0.32, 0.05, bl1, -0.38, 2.66, -1.0, false); RB(g, 0.6, 0.18, 0.32, 0.05, bl2, 0.38, 2.66, -1.0, false);
    B(g, 0.5, 0.14, 0.05, bl1, -0.5, 1.45, -2.84, false); B(g, 0.5, 0.14, 0.05, bl2, 0.5, 1.45, -2.84, false);
    const prev = g.userData.tick;
    g.userData.tick = t => { const p = Math.floor(t * 7) % 2; bl1.emissiveIntensity = p ? 6 : 0; bl2.emissiveIntensity = p ? 0 : 6; if (prev) prev(t); };
  }
  return g;
}
function makeBus() {
  const g = new THREE.Group(); const L = 12, W = 2.5;
  const paint = paintMat(0xc8352b), roof = mat('busroof', { color: 0xeeeeee, roughness: 0.6 });
  RB(g, W, 2.65, L, 0.22, paint, 0, 1.72, 0);
  RB(g, W + 0.02, 1.0, L - 1.4, 0.1, M.glass, 0, 2.16, 0.5);
  RB(g, W - 0.18, 1.5, 0.12, 0.06, M.glass, 0, 1.92, -L / 2 + 0.02);
  RB(g, W - 0.1, 0.25, L - 0.4, 0.1, roof, 0, 3.08, 0);
  const sign = new THREE.MeshStandardMaterial({ color: 0x221100, emissive: 0xffa31a, emissiveIntensity: 1.8 });
  B(g, 1.7, 0.26, 0.04, sign, 0, 2.8, -L / 2 - 0.06, false);
  const doors = [];
  for (const dz of [-4.7, 0.6]) doors.push(B(g, 0.04, 2.1, 1.25, M.glass, W / 2 + 0.02, 1.45, dz, false));
  g.userData.openDoors = () => doors.forEach(d => { d.position.x = W / 2 + 0.25; d.scale.z = 0.5; });
  wheelSet(g, W + 0.02, [-3.8, 3.6], 0.5, 0.3);
  lampSet(g, W, L, 0.75, 0.88, -L / 2 - 0.04, L / 2 + 0.04);
  return g;
}
function makeTram() {
  const g = new THREE.Group();
  const red = paintMat(0xc4161c), cream = mat('tramcream', { color: 0xf1ead8, roughness: 0.5 });
  for (let i = 0; i < 2; i++) {
    const zc = 7.6 + i * 15.6;
    RB(g, 2.5, 1.2, 15, 0.2, red, 0, 0.95, zc);
    RB(g, 2.5, 1.55, 15, 0.22, cream, 0, 2.3, zc);
    B(g, 2.53, 1.05, 13.6, M.glass, 0, 2.35, zc, false);
    RB(g, 2.2, 0.3, 14, 0.1, M.dark, 0, 3.2, zc);
  }
  RB(g, 2.4, 1.3, 0.3, 0.1, M.glass, 0, 2.3, 0.15);
  B(g, 0.06, 1.1, 0.06, M.dark, 0, 3.85, 8, false).rotation.x = 0.5;
  B(g, 1.2, 0.05, 0.1, M.dark, 0, 4.35, 7.7, false);
  for (const sx of [-1, 1]) B(g, 0.28, 0.18, 0.05, M.head, sx * 0.8, 0.9, 0.02, false);
  return g;
}
function makeTrain() {
  const g = new THREE.Group();
  const body = mat('trainbody', { color: 0xe8ecef, metalness: 0.2, roughness: 0.45 }), blue = paintMat(0x1d4f9c), yel = paintMat(0xf2c200);
  for (let i = 0; i < 3; i++) {
    const zc = 10 + i * 20.6;
    RB(g, 3.0, 3.1, 20, 0.3, body, 0, 2.2, zc);
    B(g, 3.04, 0.85, 18.6, M.glass, 0, 2.75, zc, false);
    B(g, 3.05, 0.5, 19.6, blue, 0, 1.35, zc, false);
    for (const bz of [-7, 7]) B(g, 2.4, 0.6, 2.6, M.black, 0, 0.42, zc + bz);
  }
  RB(g, 3.0, 1.6, 0.9, 0.2, yel, 0, 1.4, 0.45);
  B(g, 2.7, 1.0, 0.05, M.glass, 0, 2.8, -0.03, false);
  for (const sx of [-1, 1]) B(g, 0.32, 0.22, 0.05, M.head, sx * 1.0, 1.25, -0.03, false);
  return g;
}
function makeTractor() {
  const g = new THREE.Group(); const green = paintMat(0x2f7d32);
  RB(g, 1.2, 0.9, 2.2, 0.12, green, 0, 1.25, -0.6);
  RB(g, 1.5, 0.25, 1.6, 0.06, green, 0, 1.0, 0.7);
  RB(g, 1.35, 1.35, 1.35, 0.08, M.glass, 0, 2.15, 0.75);
  RB(g, 1.5, 0.12, 1.5, 0.05, green, 0, 2.88, 0.75);
  const tg = cached('g:trac:big', () => new THREE.CylinderGeometry(0.78, 0.78, 0.45, 20).rotateZ(Math.PI / 2)), sg = cached('g:trac:sm', () => new THREE.CylinderGeometry(0.44, 0.44, 0.3, 16).rotateZ(Math.PI / 2));
  for (const sx of [-1, 1]) { const b = new THREE.Mesh(tg, M.tire); b.position.set(sx * 0.95, 0.78, 0.8); b.castShadow = true; g.add(b); const s = new THREE.Mesh(sg, M.tire); s.position.set(sx * 0.75, 0.44, -1.2); g.add(s); }
  const bm = new THREE.MeshStandardMaterial({ color: 0x552200, emissive: 0xff8800, emissiveIntensity: 0 });
  B(g, 0.18, 0.16, 0.18, bm, 0.5, 3.02, 0.6, false);
  lampSet(g, 1.6, 3.2, 1.35, 1.2, -1.75, 1.55);
  const prev = g.userData.tick; g.userData.tick = t => { bm.emissiveIntensity = (t * 3) % 1 < 0.4 ? 6 : 0.2; if (prev) prev(t); };
  return g;
}
function makePerson(o = {}) {
  const k = o.child ? 0.62 : 1, g = new THREE.Group();
  const sc = o.shirt ?? pick(SHIRTS), shirt = o.vest ? mat('vest', { color: 0xd8ff2a, emissive: 0x9acc00, emissiveIntensity: 0.6, roughness: 0.6 }) : mat('shirt' + sc, { color: sc, roughness: 0.85 });
  const pc = o.pants ?? pick(PANTS), pants = mat('pants' + pc, { color: pc, roughness: 0.9 });
  const hc = pick([0x2b1d14, 0x5a3a22, 0xc9a36a, 0x1b1b1b, 0x8a6a4a, 0x9a9a9a]), hair = mat('hair' + hc, { color: hc, roughness: 0.9 });
  const hip = 0.88 * k;
  const cap = (parent, m, sx, sy, sz, x, y, z) => { const o2 = new THREE.Mesh(capG, m); o2.scale.set(sx, sy, sz); o2.position.set(x, y, z); o2.castShadow = true; parent.add(o2); return o2; };
  const legs = [-1, 1].map(sx => { const p = new THREE.Group(); p.position.set(sx * 0.1 * k, hip, 0); cap(p, pants, 0.15 * k, 0.43 * k, 0.16 * k, 0, -0.43 * k, 0); B(p, 0.13 * k, 0.07 * k, 0.24 * k, M.black, 0, -0.86 * k, -0.04 * k); g.add(p); return p; });
  cap(g, pants, 0.36 * k, 0.12 * k, 0.24 * k, 0, hip + 0.02 * k, 0);
  cap(g, shirt, 0.42 * k, 0.33 * k, 0.26 * k, 0, hip + 0.33 * k, 0);
  const arms = [-1, 1].map(sx => { const p = new THREE.Group(); p.position.set(sx * 0.25 * k, hip + 0.56 * k, 0); cap(p, shirt, 0.11 * k, 0.3 * k, 0.11 * k, 0, -0.27 * k, 0); const hnd = new THREE.Mesh(sphereG, M.skin); hnd.scale.setScalar(0.05 * k); hnd.position.y = -0.58 * k; p.add(hnd); g.add(p); return p; });
  const h = new THREE.Mesh(sphereG, M.skin); h.scale.set(0.105 * k, 0.12 * k, 0.11 * k); h.position.y = hip + 0.78 * k; h.castShadow = true; g.add(h);
  const hr = new THREE.Mesh(sphereG, hair); hr.scale.set(0.112 * k, 0.085 * k, 0.118 * k); hr.position.set(0, hip + 0.83 * k, 0.012); g.add(hr);
  g.userData.arms = arms;
  if (o.umbrella) { const u = new THREE.Group(); const cn = new THREE.Mesh(cached('g:umb', () => new THREE.ConeGeometry(0.55, 0.25, 10)), mat('umb' + o.umbrella, { color: o.umbrella, roughness: 0.6, side: THREE.DoubleSide })); cn.position.y = 2.05; cn.castShadow = true; u.add(cn); B(u, 0.02, 0.6, 0.02, M.dark, 0, 1.75, 0, false); u.position.x = 0.12; g.add(u); }
  if (o.cap) { const cp = new THREE.Mesh(cylG, mat('cap' + o.cap, { color: o.cap, roughness: 0.6 })); cp.scale.set(0.13, 0.08, 0.14); cp.position.y = hip + 0.9; g.add(cp); B(g, 0.2, 0.02, 0.1, mat('cap' + o.cap, { color: o.cap }), 0, hip + 0.86, -0.12, false); }
  if (o.gloves) arms.forEach(a => { a.children[1].material = mat('glove', { color: 0xffffff }); a.children[1].scale.setScalar(0.065); });
  if (o.pose === 'static') { g.userData.anim = null; return g; }
  let ph = Math.random() * 6;
  g.userData.anim = (v, dt) => { ph += v * dt * (o.child ? 5.5 : 4.2); const a = Math.sin(ph) * Math.min(0.75, v * 0.4); legs[0].rotation.x = a; legs[1].rotation.x = -a; arms[0].rotation.x = -a * 0.8; arms[1].rotation.x = a * 0.8; };
  return g;
}
function makeCyclist(o = {}) {
  const g = new THREE.Group();
  const tor = cached('g:biketire', () => new THREE.TorusGeometry(0.34, 0.035, 8, 24).rotateY(Math.PI / 2));
  const frame = mat('bikeframe' + (o.dark ? 'd' : ''), { color: o.dark ? 0x1a1a1a : 0x1f7ac4, metalness: 0.5, roughness: 0.4 });
  const w1 = new THREE.Mesh(tor, M.tire); w1.position.set(0, 0.36, -0.55); const w2 = new THREE.Mesh(tor, M.tire); w2.position.set(0, 0.36, 0.55); g.add(w1, w2);
  B(g, 0.05, 0.05, 1.05, frame, 0, 0.62, 0, false).rotation.x = 0.1; B(g, 0.05, 0.55, 0.05, frame, 0, 0.6, 0.15, false).rotation.x = -0.3; B(g, 0.05, 0.5, 0.05, frame, 0, 0.62, -0.5, false).rotation.x = 0.2;
  B(g, 0.5, 0.04, 0.04, M.dark, 0, 0.98, -0.52, false);
  const rider = makePerson({ shirt: o.dark ? 0x22252a : (o.shirt ?? 0x2e86c1), pants: o.dark ? 0x15171a : undefined });
  rider.position.set(0, 0.1, 0.12); rider.rotation.x = -0.3; g.add(rider);
  if (!o.dark) { const rl = mat('bikelamp', { color: 0x440000, emissive: 0xff2010, emissiveIntensity: 2 }); B(g, 0.08, 0.06, 0.03, rl, 0, 0.75, 0.82, false); }
  let ph = 0; g.userData.anim = (v, dt) => { ph += v * dt * 2.3; w1.rotation.x -= v * dt / 0.34; w2.rotation.x -= v * dt / 0.34; rider.children.forEach((c, i) => { if (i < 2 && c.isGroup) c.rotation.x = -0.9 + Math.sin(ph + i * Math.PI) * 0.5; }); };
  return g;
}
function makeDeer(k = 1) {
  const g = new THREE.Group(); const fur = mat('fur', { color: 0x8a5a33, roughness: 1 }), lt = mat('furlt', { color: 0xe8dcc8, roughness: 1 });
  const body = new THREE.Group(); g.add(body);
  const bo = new THREE.Mesh(capG, fur); bo.scale.set(0.46 * k, 0.6 * k, 0.5 * k); bo.rotation.x = Math.PI / 2; bo.position.y = 1.02 * k; bo.castShadow = true; body.add(bo);
  const nk = new THREE.Mesh(capG, fur); nk.scale.set(0.18 * k, 0.32 * k, 0.2 * k); nk.position.set(0, 1.4 * k, -0.62 * k); nk.rotation.x = 0.55; body.add(nk);
  const hd = new THREE.Mesh(capG, fur); hd.scale.set(0.18 * k, 0.2 * k, 0.18 * k); hd.rotation.x = Math.PI / 2 - 0.3; hd.position.set(0, 1.66 * k, -0.82 * k); body.add(hd);
  B(body, 0.14 * k, 0.16 * k, 0.06 * k, lt, 0, 1.08 * k, 0.68 * k);
  if (k > 0.9) for (const sx of [-1, 1]) { const a = B(body, 0.04, 0.42, 0.04, mat('antler', { color: 0xcbb999 }), sx * 0.1, 1.95, -0.78); a.rotation.z = sx * 0.4; }
  const legs = [[-0.13, -0.45], [0.13, -0.45], [-0.13, 0.45], [0.13, 0.45]].map(([x, z]) => { const p = new THREE.Group(); p.position.set(x * k, 0.86 * k, z * k); const l = new THREE.Mesh(capG, fur); l.scale.set(0.08 * k, 0.42 * k, 0.08 * k); l.position.y = -0.43 * k; p.add(l); g.add(p); return p; });
  let ph = 0;
  g.userData.anim = (v, dt) => { ph += v * dt * 2.2; const a = Math.sin(ph) * Math.min(0.8, v * 0.15); legs[0].rotation.x = legs[1].rotation.x = a; legs[2].rotation.x = legs[3].rotation.x = -a; body.position.y = Math.abs(Math.sin(ph)) * Math.min(0.25, v * 0.03); };
  return g;
}
function makeBall() { const g = new THREE.Group(); const b = new THREE.Mesh(sphereG, mat('ball', { color: 0xe0262c, roughness: 0.45 })); b.scale.setScalar(0.12); b.position.y = 0.12; b.castShadow = true; g.add(b); const s = new THREE.Mesh(sphereG, mat('ballw', { color: 0xffffff })); s.scale.set(1.02, 0.33, 1.02); b.add(s); g.userData.anim = (v, dt) => { b.rotation.x -= v * dt / 0.12; }; return g; }
function makeTrafficLight(yellowPole) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(postG, yellowPole ? M.yellowM : M.dark); pole.scale.set(1.7, 3.2, 1.7); pole.position.y = 1.6; pole.castShadow = true; g.add(pole);
  RB(g, 0.38, 1.05, 0.28, 0.06, M.black, 0, 3.0, 0);
  B(g, 0.62, 1.25, 0.03, yellowPole ? M.yellowM : mat('tlback', { color: 0x1a1a1a }), 0, 3.0, -0.16);
  const mk = (c, base) => new THREE.MeshStandardMaterial({ color: base, emissive: c, emissiveIntensity: 0, roughness: 0.3 });
  const L = { red: mk(0xff2010, 0x2a0505), yellow: mk(0xffb000, 0x2a1e05), green: mk(0x20ff70, 0x052a12) };
  [['red', 3.32], ['yellow', 3.0], ['green', 2.68]].forEach(([k, y]) => { const m = new THREE.Mesh(lensG, L[k]); m.scale.setScalar(0.11); m.position.set(0, y, 0.145); g.add(m); B(g, 0.3, 0.04, 0.16, M.black, 0, y + 0.13, 0.2, false); });
  g.userData.state = 'green';
  const glow = {}; for (const [k, y, c] of [['red', 3.32, 0xff2a10], ['yellow', 3.0, 0xffb000], ['green', 2.68, 0x30ff80]]) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: c, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85 })); sp.scale.setScalar(0.75); sp.position.set(0, y, 0.22); sp.visible = false; g.add(sp); glow[k] = sp; }
  g.userData.set = st => { g.userData.state = st; L.red.emissiveIntensity = st.includes('red') ? 5 : 0; L.yellow.emissiveIntensity = st.includes('yellow') ? 5 : 0; L.green.emissiveIntensity = st === 'green' ? 5 : 0; glow.red.visible = st.includes('red'); glow.yellow.visible = st.includes('yellow'); glow.green.visible = st === 'green'; };
  return g;
}
function makeRailSignal() {
  const g = new THREE.Group();
  const p = new THREE.Mesh(postG, M.pole); p.scale.set(1.8, 3.0, 1.8); p.position.y = 1.5; g.add(p);
  const cr = new THREE.Mesh(vPlane, signMat('railcross')); cr.scale.set(1.2, 1.2, 1); cr.position.set(0, 3.45, 0.07); g.add(cr);
  const crb = new THREE.Mesh(vPlane, signBack('railcross')); crb.rotation.y = Math.PI; crb.scale.set(1.2, 1.2, 1); crb.position.set(0, 3.45, 0.06); g.add(crb);
  RB(g, 1.05, 0.38, 0.14, 0.05, M.black, 0, 2.6, 0); RB(g, 0.38, 0.36, 0.14, 0.05, M.black, 0, 2.2, 0);
  const mk = (c, b) => new THREE.MeshStandardMaterial({ color: b, emissive: c, emissiveIntensity: 0, roughness: 0.3 });
  const rL = mk(0xff2010, 0x2a0505), rR = mk(0xff2010, 0x2a0505), w = mk(0xf6f6ff, 0x2a2a2a);
  const gl = [[rL, -0.3, 2.6, 0xff2a10], [rR, 0.3, 2.6, 0xff2a10], [w, 0, 2.2, 0xffffff]].map(([m, x, y, c]) => { const l = new THREE.Mesh(lensG, m); l.scale.setScalar(0.12); l.position.set(x, y, 0.075); g.add(l); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: c, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9 })); sp.scale.setScalar(0.8); sp.position.set(x, y, 0.15); g.add(sp); return [m, sp]; });
  g.userData.mode = 'off';
  g.userData.tick = t => { const md = g.userData.mode; for (const [m, sp] of gl) sp.visible = m.emissiveIntensity > 0.5; if (md === 'red') { const a = Math.floor(t * 1.8) % 2; rL.emissiveIntensity = a ? 5 : 0; rR.emissiveIntensity = a ? 0 : 5; w.emissiveIntensity = 0; } else if (md === 'white') { rL.emissiveIntensity = rR.emissiveIntensity = 0; w.emissiveIntensity = (t % 1.25) < 0.62 ? 4 : 0; } else { rL.emissiveIntensity = rR.emissiveIntensity = w.emissiveIntensity = 0; } };
  if (BUILD) BUILD.tickers.push(g);
  return g;
}

