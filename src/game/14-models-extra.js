/* ============================== new models ============================== */
function makeMoto() {
  const g = new THREE.Group(); const red = paintMat(0xb81d1d);
  const tg = cached('g:mototire', () => new THREE.TorusGeometry(0.3, 0.08, 10, 22).rotateY(Math.PI / 2));
  const w1 = new THREE.Mesh(tg, M.tire); w1.position.set(0, 0.38, -0.72); const w2 = new THREE.Mesh(tg, M.tire); w2.position.set(0, 0.38, 0.72); g.add(w1, w2);
  RB(g, 0.32, 0.36, 1.1, 0.1, red, 0, 0.72, 0); RB(g, 0.38, 0.24, 0.55, 0.08, red, 0, 0.98, -0.18); RB(g, 0.3, 0.12, 0.6, 0.05, M.black, 0, 0.98, 0.35);
  B(g, 0.62, 0.04, 0.04, M.dark, 0, 1.1, -0.5, false); B(g, 0.17, 0.13, 0.06, M.head, 0, 0.93, -0.8, false);
  B(g, 0.12, 0.08, 0.04, mat('moto-tail', { color: 0x440000, emissive: 0xff2010, emissiveIntensity: 2 }), 0, 0.95, 0.68, false);
  const rider = makePerson({ shirt: 0x161616, pants: 0x222222, pose: 'static' }); rider.position.set(0, 0.22, 0.2); rider.rotation.x = -0.32; rider.userData.arms.forEach(a => { a.rotation.x = -1.05; }); g.add(rider);
  const helm = new THREE.Mesh(sphereG, paintMat(0xf2f2f2)); helm.scale.setScalar(0.16); helm.position.set(0, 1.68, 0); rider.add(helm);
  g.userData.anim = (v, dt) => { w1.rotation.x -= v * dt / 0.38; w2.rotation.x -= v * dt / 0.38; };
  g.userData.setBrake = () => {};
  return g;
}
function makePoliceCar() {
  const g = makeCar(0xe9ecef, 'sedan'); const blue = mat('polblue', { color: 0x1d4fa8, roughness: 0.5 }), yel = mat('polyel', { color: 0xd8f000, roughness: 0.5, emissive: 0x2a3300 });
  for (const sx of [-1, 1]) { B(g, 0.03, 0.15, 3.4, blue, sx * 0.92, 0.66, 0, false); B(g, 0.03, 0.1, 3.4, yel, sx * 0.92, 0.52, 0, false); const pl = new THREE.Mesh(vPlane, textPlate('POLICIE', '#ffffff', '#1d4fa8')); pl.scale.set(1.3, 0.24, 1); pl.position.set(sx * 0.94, 0.82, 0.25); pl.rotation.y = sx * Math.PI / 2; g.add(pl); }
  const b1 = new THREE.MeshStandardMaterial({ color: 0x0a1a55, emissive: 0x2060ff, emissiveIntensity: 0 }), b2 = b1.clone();
  RB(g, 0.55, 0.14, 0.3, 0.05, b1, -0.31, 1.5, 0.3, false); RB(g, 0.55, 0.14, 0.3, 0.05, b2, 0.31, 1.5, 0.3, false);
  const prev = g.userData.tick; g.userData.tick = t => { const p = Math.floor(t * 6) % 2; b1.emissiveIntensity = p ? 7 : 0; b2.emissiveIntensity = p ? 0 : 7; if (prev) prev(t); };
  return g;
}
function beacon(g, x, y, z) { const bm = new THREE.MeshStandardMaterial({ color: 0x552200, emissive: 0xff8800, emissiveIntensity: 0 }); B(g, 0.22, 0.18, 0.22, bm, x, y, z, false); const prev = g.userData.tick; g.userData.tick = t => { bm.emissiveIntensity = (t * 2.6 + x) % 1 < 0.4 ? 7 : 0.2; if (prev) prev(t); }; if (BUILD && !BUILD.tickers.includes(g)) BUILD.tickers.push(g); }
function makeGarbageTruck() {
  const g = new THREE.Group(); const or = paintMat(0xe8731c), wh = mat('gtwhite', { color: 0xf0f0ee, roughness: 0.55 });
  RB(g, 2.5, 2.2, 2.3, 0.15, or, 0, 1.55, -3.4); RB(g, 2.36, 0.9, 1.0, 0.1, M.glass, 0, 2.05, -4.25);
  RB(g, 2.5, 2.9, 6.0, 0.15, wh, 0, 1.95, 0.9); B(g, 2.52, 0.45, 6.0, or, 0, 1.0, 0.9, false);
  RB(g, 2.3, 2.4, 0.6, 0.1, M.dark, 0, 1.7, 4.2); B(g, 2.2, 0.08, 0.5, M.steel, 0, 0.6, 4.6, false);
  wheelSet(g, 2.52, [-3.4, 0.4, 2.4], 0.5, 0.35);
  lampSet(g, 2.5, 9.0, 1.0, 1.0, -4.62, 4.52);
  beacon(g, -0.6, 2.75, -3.4); beacon(g, 0.6, 2.75, -3.4);
  return g;
}
function makePlow() {
  const g = new THREE.Group(); const or = paintMat(0xf08a12);
  RB(g, 2.5, 2.2, 2.4, 0.15, or, 0, 1.6, -2.4); RB(g, 2.36, 0.9, 1.0, 0.1, M.glass, 0, 2.1, -3.25);
  RB(g, 2.5, 1.4, 4.4, 0.12, M.dark, 0, 1.35, 1.2); B(g, 2.3, 0.9, 4.0, mat('salt', { color: 0x9a9a92 }), 0, 2.3, 1.2);
  const bl = B(g, 3.0, 0.9, 0.16, mat('blade', { color: 0xf2c200, roughness: 0.5 }), 0, 0.6, -4.0); bl.rotation.y = 0.35;
  wheelSet(g, 2.52, [-2.4, 2.2], 0.5, 0.35);
  lampSet(g, 2.5, 7.0, 1.0, 1.0, -3.62, 3.42);
  beacon(g, -0.7, 2.8, -2.4); beacon(g, 0.7, 2.8, -2.4);
  return g;
}
function makeArrowLight() {
  const g = makeTrafficLight();
  B(g, 0.32, 0.32, 0.24, M.black, 0.36, 2.68, 0);
  const t = cached('t:arrowlens', () => { const [c, x] = makeCanvas(128, 128); x.fillStyle = '#050805'; x.beginPath(); x.arc(64, 64, 62, 0, Math.PI * 2); x.fill(); x.fillStyle = '#3dff7a'; x.beginPath(); x.moveTo(28, 54); x.lineTo(70, 54); x.lineTo(70, 34); x.lineTo(104, 64); x.lineTo(70, 94); x.lineTo(70, 74); x.lineTo(28, 74); x.closePath(); x.fill(); return toTex(c, false); });
  const lens = new THREE.Mesh(lensG, new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); lens.scale.setScalar(0.12); lens.position.set(0.36, 2.68, 0.125); g.add(lens);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0x30ff80, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.6 })); sp.scale.setScalar(0.55); sp.position.set(0.36, 2.68, 0.2); g.add(sp);
  return g;
}
function makeOfficer(o = {}) {
  const p = makePerson({ vest: true, pants: 0x1d2b4a, cap: 0x1d2b4a, gloves: true, pose: 'static', ...o });
  return p;
}
function addPaddle(G, x, y, z, rotY = 0) { const g = new THREE.Group(); B(g, 0.025, 0.35, 0.025, M.dark, 0, -0.2, 0, false); const f = new THREE.Mesh(vPlane, signMat('paddle')); f.scale.set(0.3, 0.3, 1); f.position.z = 0.015; g.add(f); const b = new THREE.Mesh(vPlane, signBack('paddle')); b.scale.set(0.3, 0.3, 1); b.rotation.y = Math.PI; g.add(b); g.position.set(x, y, z); g.rotation.y = rotY; G.add(g); return g; }
function tickerObj(sc, fn) { const o = { userData: { tick: fn } }; sc.tickers.push(o); return o; }

