/* ============================== world builders ============================== */
function segs(a, b, gaps) { let out = [[a, b]]; for (const [g0, g1] of gaps) { const n = []; for (const [x, y] of out) { if (g1 <= x || g0 >= y) { n.push([x, y]); continue; } if (g0 > x) n.push([x, g0]); if (g1 < y) n.push([g1, y]); } out = n; } return out.filter(([x, y]) => y - x > 0.5); }
function ground(G, kind) { if (BUILD && BUILD.snow) kind = 'snow'; const o = new THREE.Mesh(groundGeo(), groundMat(kind)); o.position.set(0, -0.05, Z(600)); o.receiveShadow = true; G.add(o); }
function road(G, kind, xc, s0, s1, n = 0) { const L = s1 - s0, w = ROADSPEC[kind].w; FL(G, w, L, roadMat(kind, n), xc, 0, Z((s0 + s1) / 2), w, 12); }
function crossRoad(G, kind, s, x0, x1) { const L = x1 - x0; const o = FL(G, 7, L, roadMat(kind, 1), (x0 + x1) / 2, 0.004, Z(s), 7, 12); o.rotation.y = Math.PI / 2; }
function patch(G, x, s, w, l) { FL(G, w, l, roadMat('plain', 2), x, 0.008, Z(s), 7, 12); }
function sidewalk(G, x0, x1, s0, s1, curbSide) {
  const w = x1 - x0, l = s1 - s0, xc = (x0 + x1) / 2, zc = Z((s0 + s1) / 2);
  B(G, w, 0.14, l, M.walkSide, xc, 0.07, zc, false);
  FL(G, w, l, pavingMat(), xc, 0.15, zc, 1.5, 1.5);
  if (curbSide === 'x') { const cx = Math.abs(x0) < Math.abs(x1) ? x0 : x1; B(G, 0.2, 0.17, l, M.curb, cx + (cx === x0 ? 0.1 : -0.1), 0.085, zc, false); }
}
function line(G, x, s, w, l) { FL(G, w, l, M.white, x, 0.014, Z(s)); }
function zebra(G, cx, cs, alongX, w = 7, len = 4) { const n = Math.round(w); for (let i = 0; i < n; i++) { const o = -w / 2 + 0.5 + i; if (alongX) line(G, cx + 0, cs + o, len, 0.5); else line(G, cx + o, cs, 0.5, len); } }
const SHOP_NAMES = ['POTRAVINY', 'PEKAŘSTVÍ', 'KAVÁRNA', 'LÉKÁRNA', 'TRAFIKA', 'HOSPODA', 'KADEŘNICTVÍ', 'ŘEZNICTVÍ', 'VINOTÉKA', 'KNIHKUPECTVÍ', 'PIVNICE', 'ELEKTRO', 'CUKRÁRNA', 'DROGERIE', 'ZELENINA', 'OPTIKA'];
const SIGN_COLS = [['#1f4e79', '#ffffff'], ['#7a1f1f', '#f8e7c0'], ['#20462f', '#f3f0e0'], ['#f2c200', '#1a1a1a'], ['#ffffff', '#222222'], ['#3b2a5a', '#ffffff']];
function bgeo(xw, h, zd, tw = 3, th = 3) {
  const g = new THREE.BoxGeometry(xw, h, zd); const uv = g.attributes.uv;
  const dims = [[zd, h], [zd, h], [xw, zd], [xw, zd], [xw, h], [xw, h]];
  for (let f = 0; f < 6; f++) { const [a, b] = dims[f]; for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * Math.max(1, Math.round(a / tw)), uv.getY(k) * (f === 2 || f === 3 ? 1 : b / th)); } }
  return g;
}
function gable(G, w, d, rh, roofM, x, y, z, rotY, wallM) {
  const g = new THREE.Group(); const half = w / 2 + 0.45, sl = Math.hypot(half, rh), ang = Math.atan2(rh, half);
  for (const sx of [-1, 1]) { const m = new THREE.Mesh(bgeo(sl, 0.16, d + 0.7, 1.5, 1.5), roofM); m.position.set(sx * half / 2, rh / 2, 0); m.rotation.z = -sx * ang; m.castShadow = m.receiveShadow = true; g.add(m); }
  if (wallM) { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, rh - 0.12); sh.closePath(); const tg = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); tg.translate(0, 0, -d / 2); const t = new THREE.Mesh(tg, wallM); t.castShadow = true; g.add(t); }
  g.position.set(x, y, z); g.rotation.y = rotY; G.add(g); return g;
}
function building(G, xc, sc, xw, zd, h, face, style) {
  const ci = (Math.random() * 20) | 0, z = Z(sc);
  if (style === 'panel') {
    const fm = facadeMat('panel', ci); const m = new THREE.Mesh(bgeo(xw, h, zd, 3, 3), [fm, fm, M.roofFlat, M.roofFlat, fm, fm]); m.position.set(xc, h / 2, z); m.castShadow = m.receiveShadow = true; G.add(m);
    B(G, xw + 0.2, 0.5, zd + 0.2, M.concrete, xc, h + 0.25, z); return;
  }
  const gf = 4.2, up = h - gf, sm = shopMat(ci);
  const g1 = new THREE.Mesh(bgeo(xw, gf, zd, 3, gf), [sm, sm, M.roofFlat, M.roofFlat, sm, sm]); g1.position.set(xc, gf / 2, z); g1.castShadow = g1.receiveShadow = true; G.add(g1);
  const fm = facadeMat(style, ci % FACADE_COLS.length);
  const g2 = new THREE.Mesh(bgeo(xw, up, zd, 3, 3), [fm, fm, M.roofFlat, M.roofFlat, fm, fm]); g2.position.set(xc, gf + up / 2, z); g2.castShadow = g2.receiveShadow = true; G.add(g2);
  B(G, xw + 0.3, 0.3, zd + 0.3, M.concrete, xc, gf + 0.05, z, false);
  B(G, xw + 0.5, 0.4, zd + 0.5, M.concrete, xc, h + 0.18, z);
  if (chance(0.6)) { const along = xw >= zd; const rc = pick([0xa3492b, 0x8f3b22, 0x6b6e72, 0xa85a35]); gable(G, along ? zd : xw, along ? xw : zd, rand(3, 4.4), roofTileMat(rc), xc, h + 0.36, z, along ? Math.PI / 2 : 0, null); }
  if (face && style === 'classic' && chance(0.45)) {
    const fl = Math.floor(up / 3), along = face[0] === 'x' ? zd : xw, bm = mat('balcony', { color: 0xe9e4d8, roughness: 0.8 }), rm = mat('railing', { color: 0x2b2e31, metalness: 0.6, roughness: 0.4 });
    const nb = along > 13 ? 2 : 1;
    for (let f = 1; f < fl; f++) for (let k = 0; k < nb; k++) {
      const off = nb === 1 ? 0 : (k ? 1 : -1) * along * 0.25, y = gf + f * 3 - 0.05;
      if (face === 'x-' || face === 'x+') { const sx = face === 'x-' ? -1 : 1, fx = xc + sx * (xw / 2 + 0.55); B(G, 1.1, 0.16, 2.4, bm, fx, y, z + off); B(G, 0.05, 0.95, 2.4, rm, fx + sx * 0.53, y + 0.55, z + off, false); }
      else { const sz = face === 'z+' ? 1 : -1, fz = z + sz * (zd / 2 + 0.55); B(G, 2.4, 0.16, 1.1, bm, xc + off, y, fz); B(G, 2.4, 0.95, 0.05, rm, xc + off, y + 0.55, fz + sz * 0.53, false); }
    }
  }
  if (face && chance(0.5)) {
    const name = pick(SHOP_NAMES), [bg, fg] = pick(SIGN_COLS), pw = Math.min(4.2, (face[0] === 'x' ? zd : xw) - 1.2);
    const p = new THREE.Mesh(vPlane, textPlate(name, bg, fg)); p.scale.set(pw, pw * 0.1875, 1);
    if (face === 'x-') { p.position.set(xc - xw / 2 - 0.04, 3.7, z); p.rotation.y = -Math.PI / 2; }
    else if (face === 'x+') { p.position.set(xc + xw / 2 + 0.04, 3.7, z); p.rotation.y = Math.PI / 2; }
    else if (face === 'z+') { p.position.set(xc, 3.7, z + zd / 2 + 0.04); }
    else { p.position.set(xc, 3.7, z - zd / 2 - 0.04); p.rotation.y = Math.PI; }
    G.add(p);
  }
}
function rowZ(G, side, xFront, s0, s1, panel = 0.15) { let s = s0; while (s < s1 - 4) { const w = Math.min(rand(10, 17), s1 - s), d = rand(10, 14); const style = chance(panel) ? 'panel' : pick(['classic', 'plain']); const h = style === 'panel' ? Math.round(rand(8, 12)) * 3 : 4.2 + Math.round(rand(2, 5)) * 3; building(G, side * (xFront + d / 2), s + w / 2, d, w, h, side > 0 ? 'x-' : 'x+', style); s += w; } }
function rowX(G, sideS, sFront, xDir, x0, x1, panel = 0.15) { let x = x0; while (x < x1 - 4) { const w = Math.min(rand(10, 17), x1 - x), d = rand(10, 14); const style = chance(panel) ? 'panel' : pick(['classic', 'plain']); const h = style === 'panel' ? Math.round(rand(8, 12)) * 3 : 4.2 + Math.round(rand(2, 5)) * 3; building(G, xDir * (x + w / 2), sFront + sideS * d / 2, w, d, h, sideS > 0 ? 'z+' : 'z-', style); x += w; } }
function streetLamp(G, x, s, side) {
  const p = new THREE.Mesh(cached('g:lamppole', () => new THREE.CylinderGeometry(0.07, 0.11, 6.4, 10)), M.dark); p.position.set(x, 3.2, Z(s)); p.castShadow = true; G.add(p);
  B(G, 1.4, 0.08, 0.08, M.dark, x - side * 0.7, 6.3, Z(s), false);
  RB(G, 0.6, 0.16, 0.3, 0.06, M.plastic, x - side * 1.4, 6.22, Z(s), false);
  B(G, 0.45, 0.03, 0.2, mat('lampglass', { color: 0xfff6dd, emissive: 0xfff0c8, emissiveIntensity: 0.3 }), x - side * 1.4, 6.13, Z(s), false);
}
function bench(G, x, s, rot) { const g = new THREE.Group(); B(g, 1.6, 0.06, 0.45, M.wood, 0, 0.45, 0); B(g, 1.6, 0.4, 0.06, M.wood, 0, 0.72, 0.2); for (const sx of [-0.7, 0.7]) B(g, 0.06, 0.45, 0.45, M.dark, sx, 0.22, 0); g.position.set(x, 0.15, Z(s)); g.rotation.y = rot; G.add(g); }
function bin(G, x, s) { const o = new THREE.Mesh(cylG, mat('bin', { color: 0x2e5a3a, roughness: 0.6 })); o.scale.set(0.25, 0.9, 0.25); o.position.set(x, 0.6, Z(s)); o.castShadow = true; G.add(o); }
function instBoxes(G, list, w, h, d, m) { if (!list.length) return; const im = new THREE.InstancedMesh(unitBox, m, list.length); const mx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(w, h, d), p = new THREE.Vector3(); list.forEach(([x, y, z], i) => { p.set(x, y, z); mx.compose(p, q, sc); im.setMatrixAt(i, mx); }); im.castShadow = true; im.receiveShadow = true; G.add(im); return im; }
function blobGeo() { return cached('g:blob', () => { const g = new THREE.IcosahedronGeometry(1, 2); const p = g.attributes.position; const map = new Map(); for (let i = 0; i < p.count; i++) { const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`; if (!map.has(key)) map.set(key, 0.82 + Math.random() * 0.3); const k = map.get(key); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } g.computeVertexNormals(); return g; }); }
function leafTex() { return cached('t:leaf', () => { const S = 256; const [c, g] = makeCanvas(S, S); for (let i = 0; i < 520; i++) { const x = rand(8, S - 8), y = rand(8, S - 8); if (Math.hypot(x - S / 2, y - S / 2) > S * 0.47 && Math.random() < 0.75) continue; g.save(); g.translate(x, y); g.rotate(Math.random() * Math.PI); g.fillStyle = `hsl(${rand(78, 112)},${rand(35, 58)}%,${rand(32, 58)}%)`; g.beginPath(); g.ellipse(0, 0, rand(5, 9), rand(2.6, 4.6), 0, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(-rand(4, 8), -0.4, rand(8, 14), 0.8); g.restore(); } return toTex(c, false); }); }
function leafCrownGeo() {
  return cached('g:leafcrown', () => {
    const pos = [], nor = [], uv = [], idx = []; const v = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler();
    const corners = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
    for (let i = 0; i < 38; i++) {
      const c = new THREE.Vector3().randomDirection().multiplyScalar(Math.cbrt(Math.random()) * 0.72); e.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); q.setFromEuler(e); const sz = rand(0.7, 1.05), base = pos.length / 3;
      for (const [cx, cy] of corners) { v.set(cx * sz, cy * sz, 0).applyQuaternion(q).add(c); pos.push(v.x, v.y, v.z); const n = v.clone().normalize(); nor.push(n.x, n.y + 0.25, n.z); uv.push(cx + 0.5, cy + 0.5); }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere(); return g;
  });
}
const leafMat = () => mat('leafcards', { map: leafTex(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.82 });
function pineTex() { return cached('t:pine', () => { const [c, g] = makeCanvas(128, 128); g.fillStyle = '#556b4a'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 1600; i++) { g.strokeStyle = `hsl(${rand(95, 130)},${rand(20, 40)}%,${rand(22, 48)}%)`; g.lineWidth = 1; const x = Math.random() * 128, y = Math.random() * 128; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(-4, 4), y + rand(3, 7)); g.stroke(); } return toTex(c); }); }
function trees(G, list, type) {
  if (!list.length) return;
  const n = list.length;
  const trunk = new THREE.InstancedMesh(cached('g:trunk', () => new THREE.CylinderGeometry(0.12, 0.22, 1, 7).translate(0, 0.5, 0)), mat('bark', { color: 0x5d4a3a, roughness: 1 }), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color(), e = new THREE.Euler();
  if (type === 'pine') {
    const crown = new THREE.InstancedMesh(cached('g:cone', () => new THREE.ConeGeometry(1, 1, 10, 3).translate(0, 0.5, 0)), mat('pinecrown', { map: pineTex(), roughness: 0.95 }), n * 4);
    list.forEach(([x, s, k], i) => {
      const z = Z(s); p.set(x, 0, z); sc.set(k, 2.4 * k, k); m4.compose(p, q, sc); trunk.setMatrixAt(i, m4);
      const base = rand(0.29, 0.36);
      [[1.1, 2.2, 3.6], [2.6, 1.8, 3.2], [4.0, 1.35, 2.8], [5.3, 0.85, 2.3]].forEach(([y, r, h], j) => { e.set(0, Math.random() * 6, 0); q.setFromEuler(e); p.set(x, y * k, z); sc.set(r * k * rand(0.9, 1.1), h * k, r * k * rand(0.9, 1.1)); m4.compose(p, q, sc); crown.setMatrixAt(i * 4 + j, m4); col.setHSL(base, BUILD && BUILD.snow ? 0.12 : 0.32, (BUILD && BUILD.snow ? 0.62 : 0.3) + j * 0.04 + rand(-0.05, 0.05)); crown.setColorAt(i * 4 + j, col); });
      q.identity();
    });
    trunk.castShadow = crown.castShadow = true; crown.receiveShadow = true; G.add(trunk, crown); return;
  }
  const core = new THREE.InstancedMesh(blobGeo(), mat('treecore', { color: 0x2f4a22, roughness: 1 }), n);
  const leaves = new THREE.InstancedMesh(leafCrownGeo(), leafMat(), n * 4);
  list.forEach(([x, s, k], i) => {
    const z = Z(s); p.set(x, 0, z); sc.set(1.1 * k, 3.0 * k, 1.1 * k); m4.compose(p, q, sc); trunk.setMatrixAt(i, m4);
    p.set(x, 3.8 * k, z); sc.set(1.7 * k, 1.4 * k, 1.7 * k); m4.compose(p, q, sc); core.setMatrixAt(i, m4);
    const hue = 0.24 + rand(-0.035, 0.045), lit = rand(0.36, 0.5);
    [[0, 3.9, 0, 2.7], [rand(-1.3, 1.3), rand(3.1, 3.6), rand(-1.3, 1.3), 2.0], [rand(-1.2, 1.2), rand(4.3, 5.0), rand(-1.2, 1.2), 1.8], [rand(-1.4, 1.4), rand(3.4, 4.4), rand(-1.4, 1.4), 1.9]].forEach(([dx, y, dz, r], j) => { e.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); q.setFromEuler(e); p.set(x + dx * k, y * k, z + dz * k); sc.set(r * k, r * 0.88 * k, r * k); m4.compose(p, q, sc); leaves.setMatrixAt(i * 4 + j, m4); col.setHSL(hue, BUILD && BUILD.snow ? 0.15 : 0.5, (BUILD && BUILD.snow ? 0.75 : lit) + j * 0.03 + rand(-0.04, 0.04)); leaves.setColorAt(i * 4 + j, col); });
    q.identity();
  });
  trunk.castShadow = leaves.castShadow = core.castShadow = true; leaves.receiveShadow = core.receiveShadow = true; G.add(trunk, core, leaves);
}
function bushes(G, list) {
  if (!list.length) return;
  const im = new THREE.InstancedMesh(leafCrownGeo(), leafMat(), list.length), cr = new THREE.InstancedMesh(blobGeo(), mat('bushcore', { color: 0x2c4320, roughness: 1 }), list.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color(), e = new THREE.Euler();
  list.forEach(([x, s, k], i) => { e.set(0, Math.random() * 6, 0); q.setFromEuler(e); p.set(x, 0.42 * k, Z(s)); sc.set(1.25 * k, 0.95 * k, 1.25 * k); m4.compose(p, q, sc); im.setMatrixAt(i, m4); sc.multiplyScalar(0.62); m4.compose(p, q, sc); cr.setMatrixAt(i, m4); col.setHSL(0.26 + rand(-0.04, 0.04), 0.45, rand(0.34, 0.46)); im.setColorAt(i, col); });
  im.castShadow = cr.castShadow = true; im.receiveShadow = true; G.add(cr, im);
}
function grassTex() { return cached('t:grassTuft', () => { const W = 128, H = 64; const [c, g] = makeCanvas(W, H); for (let i = 0; i < 80; i++) { const x = rand(4, W - 4), h = rand(H * 0.35, H * 0.98), lean = rand(-12, 12), w = rand(1.4, 3); g.fillStyle = `hsl(${rand(68, 105)},${rand(30, 55)}%,${rand(26, 50)}%)`; g.beginPath(); g.moveTo(x - w, H); g.quadraticCurveTo(x + lean * 0.3, H - h * 0.55, x + lean, H - h); g.lineTo(x + w, H); g.fill(); } return toTex(c, false); }); }
function grassGeo() { return cached('g:grassTuft', () => { const pos = [], nor = [], uv = [], idx = []; for (const a of [0, Math.PI / 2]) { const cx = Math.cos(a) * 0.5, cz = Math.sin(a) * 0.5, b = pos.length / 3; pos.push(-cx, 0, -cz, cx, 0, cz, cx, 0.5, cz, -cx, 0.5, -cz); for (let k = 0; k < 4; k++) nor.push(0, 1, 0); uv.push(0, 0, 1, 0, 1, 1, 0, 1); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g; }); }
function grassTufts(G, list) {
  if (Q.grass < 1) list = list.filter(() => Math.random() < Q.grass);
  if (BUILD && BUILD.snow) list = list.filter(() => Math.random() < 0.15);
  if (!list.length) return;
  const im = new THREE.InstancedMesh(grassGeo(), mat('grassTuft', { map: grassTex(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 1 }), list.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color(), e = new THREE.Euler();
  list.forEach(([x, s, k], i) => { e.set(0, Math.random() * 6, 0); q.setFromEuler(e); p.set(x, 0, Z(s)); sc.set(k * rand(0.8, 1.3), k * rand(0.7, 1.4), k * rand(0.8, 1.3)); m4.compose(p, q, sc); im.setMatrixAt(i, m4); col.setHSL(0.22 + rand(-0.04, 0.04), 0.5, rand(0.4, 0.62)); im.setColorAt(i, col); });
  im.receiveShadow = true; G.add(im);
}
function verge(G, s0, s1, xMin, xMax, step = 1) { const l = []; for (let s = s0; s < s1; s += step) for (const sd of [-1, 1]) l.push([sd * rand(xMin, xMax), s + rand(-0.5, 0.5), rand(0.7, 1.2)]); grassTufts(G, l); }
function fence(G, x, s0, s1, alongX = false) { const L = s1 - s0; if (L < 1) return; const geo = new THREE.PlaneGeometry(L, 1.0); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * L / 2); const m = new THREE.Mesh(geo, fenceMat()); if (alongX) { m.position.set((s0 + s1) / 2, 0.5, Z(x)); } else { m.position.set(x, 0.5, Z((s0 + s1) / 2)); m.rotation.y = Math.PI / 2; } m.castShadow = true; G.add(m); }
function powerLine(G, x, s0, s1) { const poles = [], wires = []; for (let s = s0; s < s1; s += 45) { poles.push([x, 4.3, Z(s)]); } instBoxes(G, poles, 0.24, 8.6, 0.24, mat('polewood', { color: 0x5b4632, roughness: 1 })); instBoxes(G, poles.map(p => [p[0], 8.2, p[2]]), 2.0, 0.12, 0.12, mat('polewood', { color: 0x5b4632 })); for (const dx of [-0.8, 0, 0.8]) for (let s = s0; s < s1 - 45; s += 45) wires.push([x + dx, 8.32, Z(s + 22.5)]); const im = instBoxes(G, wires, 0.025, 0.025, 45, M.black); if (im) im.castShadow = false; }
function oncoming(sc, x, meetS, v) { const pts = [[x, Z(meetS + 1400)], [x, Z(-300)]]; const tm = meetS / sc.v; return spawn(sc, makeCar(pick(CAR_COLORS)), pts, { v, conflictS: 1400, tA: tm }); }

function buildCity(sc, o) {
  const G = sc.group, len = o.len, X = o.crossS;
  ground(G, 'city'); road(G, 'city', 0, -40, len);
  const gaps = X != null ? [[X - 3.5, X + 3.5]] : [];
  for (const [a, b] of segs(-40, len, gaps)) { sidewalk(G, 3.5, 6.5, a, b, 'x'); sidewalk(G, -6.5, -3.5, a, b, 'x'); }
  if (o.cycleRight) { for (const [a, b] of segs(-40, len, gaps)) FL(G, 1.4, b - a, mat('cycle', { color: 0x9a4a3c, roughness: 0.9, ...layer(1) }), 5.6, 0.152, Z((a + b) / 2)); if (X != null) { FL(G, 1.4, 7, mat('cyclex', { color: 0x9a4a3c, roughness: 0.9, ...layer(3) }), 5.6, 0.012, Z(X)); for (let s = X - 3.3; s < X + 3.5; s += 0.9) { line(G, 4.95, s, 0.3, 0.45); line(G, 6.25, s, 0.3, 0.45); } } }
  const bgap = X != null ? [[X - 26, X + 26]] : [];
  const pan = o.panel ?? 0.15;
  for (const [a, b] of segs(-40, len, bgap)) { rowZ(G, 1, 7.5, a, b, pan); rowZ(G, -1, 7.5, a, b, pan); }
  if (X != null) {
    crossRoad(G, 'city', X, -240, 240); patch(G, 0, X, 7, 7);
    for (const xs of [-1, 1]) for (const sd of [-1, 1]) {
      sidewalk(G, xs > 0 ? 6.5 : -240, xs > 0 ? 240 : -6.5, sd > 0 ? X + 3.5 : X - 6.5, sd > 0 ? X + 6.5 : X - 3.5);
      B(G, 233.5, 0.17, 0.2, M.curb, xs * (6.5 + 233.5 / 2), 0.085, Z(X + sd * 3.6), false);
      rowX(G, sd, sd > 0 ? X + 7.5 : X - 7.5, xs, 26, 200, pan);
    }
    const tl = [], bl = [];
    for (const xs of [-1, 1]) for (const sd of [-1, 1]) { tl.push([xs * rand(14, 22), X + sd * rand(15, 22), rand(0.85, 1.1)]); for (let k = 0; k < 6; k++) bl.push([xs * rand(9, 24), X + sd * rand(9, 24), rand(0.5, 0.9)]); bench(G, xs * 16, X + sd * 10.5, 0); }
    trees(G, tl, 'leaf'); bushes(G, bl);
    const gl = []; for (const xs of [-1, 1]) for (const sd of [-1, 1]) for (let k = 0; k < 90; k++) gl.push([xs * rand(7.5, 25), X + sd * rand(7.5, 25), rand(0.6, 1)]); grassTufts(G, gl);
  }
  if (o.alley !== false) { const tl = []; for (let s = 12; s < len - 20; s += 15) for (const sd of [-1, 1]) { if (X != null && Math.abs(s - X) < 30) continue; if (o.noTreeAt && o.noTreeAt.some(q => Math.abs(q - s) < 12)) continue; if (chance(0.75)) tl.push([sd * 6.05, s, rand(0.65, 0.8)]); } trees(G, tl, 'leaf'); }
  const mh = cached('g:manhole', () => new THREE.CircleGeometry(0.34, 20).rotateX(-Math.PI / 2)), mhm = mat('manhole', { color: 0x2f3235, metalness: 0.6, roughness: 0.55, ...layer(3) });
  for (let s = 20; s < len; s += rand(35, 60)) { const o = new THREE.Mesh(mh, mhm); o.position.set(pick([-1.75, 1.75]) + rand(-0.4, 0.4), 0.012, Z(s)); o.receiveShadow = true; G.add(o); }
  for (let s = 6; s < len; s += 32) { if (X != null && Math.abs(s - X) < 10) continue; const side = (Math.round(s / 32) % 2) ? 1 : -1; streetLamp(G, side * 6.0, s + 7, side); if (chance(0.35)) bin(G, side * 6.1, s + 9); }
}
function cityPeds(sc, X, len, rightMin = 4.2, rightMax = 5.6) {
  const ranges = X != null ? [[8, X - 12], [X + 12, Math.min(len, X + 140)]] : [[8, len]];
  for (let i = 0; i < 7; i++) {
    const [a, b] = pick(ranges); if (b - a < 15) continue; const side = chance(0.5) ? 1 : -1; const x = side > 0 ? rand(rightMin, rightMax) : -rand(4.2, 5.6); const fwd = chance(0.5);
    const pts = fwd ? [[x, Z(a)], [x, Z(b)]] : [[x, Z(b)], [x, Z(a)]];
    const a2 = spawn(sc, makePerson(), pts, { s0: rand(0, (b - a) * 0.8), v: rand(1.1, 1.5) }); a2.y = 0.15;
  }
}
function house(G, x, s, rot) {
  const g = new THREE.Group(); const w = rand(8, 10), d = rand(7, 9), h = 3.1;
  const ci = (Math.random() * FACADE_COLS.length) | 0, wm = facadeMat('house', ci);
  const walls = new THREE.Mesh(bgeo(w, h, d), [wm, wm, M.roofFlat, M.roofFlat, wm, wm]); walls.position.y = h / 2; walls.castShadow = walls.receiveShadow = true; g.add(walls);
  B(g, w + 0.1, 0.4, d + 0.1, mat('plinth', { color: 0x8c857a }), 0, 0.2, 0, false);
  const plain = mat('wallplain' + ci, { color: FACADE_COLS[ci], roughness: 0.9 });
  gable(g, w, d, rand(2.8, 3.6), roofTileMat(pick([0xa3492b, 0x8f3b22, 0x5d6066, 0xb0532e])), 0, h, 0, 0, plain);
  B(g, 0.6, 1.4, 0.6, mat('chimney', { color: 0x8c6a5a }), w * 0.2, h + 2.4, d * 0.15);
  g.position.set(x, 0, Z(s)); g.rotation.y = rot; G.add(g);
}
function buildVillage(sc, o) {
  const G = sc.group, len = o.len, X = o.crossS, bay = o.bay;
  ground(G, 'grass'); road(G, 'city', 0, -40, len);
  const gaps = X != null ? [[X - 3.5, X + 3.5]] : [];
  for (const [a, b] of segs(-40, len, gaps.concat(bay ? [bay] : []))) sidewalk(G, 3.5, 5.3, a, b, 'x');
  for (const [a, b] of segs(-40, len, gaps)) sidewalk(G, -5.3, -3.5, a, b, 'x');
  if (bay) { FL(G, 3.4, bay[1] - bay[0], roadMat('plain', 1), 5.2, 0.003, Z((bay[0] + bay[1]) / 2), 7, 12); sidewalk(G, 6.9, 8.9, bay[0], bay[1], 'x'); }
  if (X != null) { crossRoad(G, 'city', X, -240, 240); patch(G, 0, X, 7, 7); for (const xs of [-1, 1]) for (const sd of [-1, 1]) sidewalk(G, xs > 0 ? 5.3 : -240, xs > 0 ? 240 : -5.3, sd > 0 ? X + 3.5 : X - 5.3, sd > 0 ? X + 5.3 : X - 3.5); }
  const tl = [], bl = [];
  for (const side of [-1, 1]) {
    let s = -30;
    while (s < len) {
      if (X != null && Math.abs(s - X) < 24) { s = X + 24.5; continue; }
      if (bay && side > 0 && s > bay[0] - 10 && s < bay[1] + 8) { s = bay[1] + 8; continue; }
      house(G, side * rand(14.5, 17), s, chance(0.5) ? 0 : Math.PI / 2);
      tl.push([side * rand(22, 30), s + rand(-6, 6), rand(0.8, 1.2)]);
      if (chance(0.6)) tl.push([side * rand(9.5, 11), s + rand(-7, 7), rand(0.55, 0.8)]);
      for (let k = 0; k < 3; k++) bl.push([side * rand(8.8, 10), s + rand(-8, 8), rand(0.5, 0.8)]);
      s += rand(18, 24);
    }
    const fg = gaps.map(([a, b]) => [a - 6, b + 6]);
    if (o.walls && X != null) fg.push([X - 26, X]);
    if (bay && side > 0) fg.push([bay[0] - 2, bay[1] + 2]);
    for (const [a, b] of segs(-40, len, fg)) fence(G, side * 8.2, a, b);
  }
  if (X != null) {
    for (const xs of [-1, 1]) for (const sd of [-1, 1]) { for (let x = 26; x < 190; x += rand(18, 24)) house(G, xs * x, X + sd * rand(14.5, 17), chance(0.5) ? 0 : Math.PI / 2); }
    if (o.walls) for (const xs of [-1, 1]) { B(G, 0.5, 2.4, 20, M.wall, xs * 6.0, 1.2, Z(X - 16)); B(G, 20, 2.4, 0.5, M.wall, xs * 16, 1.2, Z(X - 6.0)); tl.push([xs * 12, X - 13, 1.2], [xs * 18, X - 18, 1.1]); }
  }
  trees(G, tl, 'leaf'); bushes(G, bl); verge(G, -20, Math.min(len, 500), 5.5, 7.9, 1.4);
  const church = new THREE.Group(); const cw = mat('churchwall', { color: 0xf1ece2, roughness: 0.9 });
  B(church, 5, 18, 5, cw, 0, 9, 0); B(church, 9, 8, 18, cw, 0, 4, 11); gable(church, 9, 18, 4.5, roofTileMat(0x8f3b22), 0, 8, 11, 0, cw);
  const sp = new THREE.Mesh(cached('g:spire', () => new THREE.ConeGeometry(3.4, 9, 8)), mat('copper', { color: 0x4f7f6a, roughness: 0.7 })); sp.position.y = 22.5; sp.castShadow = true; church.add(sp);
  church.position.set(-32, 0, Z(Math.min(len - 40, (o.churchS ?? len * 0.7)))); G.add(church);
  for (let s = 20; s < len; s += 40) { if (X != null && Math.abs(s - X) < 12) continue; streetLamp(G, -5.0, s, -1); }
  if (o.name) addSign(G, 'town', 4.5, 10, { arg: o.name, size: 0.7, h: 1.6 });
}
function fields(G, len) {
  const kinds = ['rape', 'wheat', 'plow', 'meadow', 'wheat', 'rape'];
  for (const side of [-1, 1]) { let s = -60; while (s < len + 300) { const L = rand(90, 200), w = rand(120, 260); FL(G, w, L, BUILD && BUILD.snow ? groundMat('snow') : cropMat(pick(kinds)), side * (11 + w / 2), -0.03, Z(s + L / 2), 8, 8); s += L + rand(2, 6); } }
}
function buildRural(sc, o) {
  const G = sc.group, len = o.len;
  ground(G, o.forest ? 'forest' : 'grass'); road(G, 'rural', 0, -40, len);
  if (!o.forest) fields(G, len);
  for (const sx of [-1, 1]) FL(G, 1.2, len + 40, M.gravel, sx * 4.1, -0.01, Z((len - 40) / 2));
  const posts = [], bands = [], refl = [];
  for (let s = 0; s < len; s += 50) for (const sx of [-1, 1]) { if (o.rail != null && Math.abs(s - o.rail) < 12) continue; posts.push([sx * 4.6, 0.5, Z(s)]); bands.push([sx * 4.6, 0.82, Z(s)]); refl.push([sx * 4.6, 0.82, Z(s) + 0.065]); }
  instBoxes(G, posts, 0.12, 1.0, 0.12, mat('postwhite', { color: 0xf0f0ea })); instBoxes(G, bands, 0.125, 0.18, 0.125, M.black); instBoxes(G, refl, 0.06, 0.1, 0.01, M.reflector);
  const tl = [];
  if (o.forest) {
    for (let s = -40; s < len + 200; s += 2.6) for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) {
      const x = sx * (7.5 + Math.pow(Math.random(), 1.4) * 70);
      if (o.clearing && sx < 0 && s > o.clearing[0] && s < o.clearing[1] && x < -10) continue;
      tl.push([x, s + rand(-1, 1), rand(0.75, 1.25)]);
    }
    trees(G, tl, 'pine'); verge(G, -20, Math.min(len, 650), 4.9, 8.5, 1.1);
    const bl = []; for (let s = -40; s < len; s += 6) for (const sx of [-1, 1]) bl.push([sx * rand(6.5, 9), s, rand(0.5, 0.9)]); bushes(G, bl);
  } else {
    for (let s = 20; s < len; s += 15) for (const sx of [-1, 1]) { if (o.rail != null && Math.abs(s - o.rail) < 70) continue; if (o.noAlley) continue; tl.push([sx * 6.8, s, rand(0.85, 1.1)]); }
    for (let i = 0; i < 50; i++) tl.push([pick([-1, 1]) * rand(40, 220), rand(0, len + 300), rand(0.9, 1.4)]);
    trees(G, tl, 'leaf'); verge(G, -20, Math.min(len, 700), 4.9, 10.5, 0.8);
    powerLine(G, -13, -40, len + 200);
    for (let i = 0; i < 5; i++) house(G, pick([-1, 1]) * rand(150, 300), rand(100, len + 200), rand(0, 3));
  }
}
function addRail(sc, R) {
  const G = sc.group;
  B(G, 1400, 0.24, 3.4, mat('ballast', { color: 0x7d766b, roughness: 1 }), 0, 0.0, Z(R), false);
  B(G, 9, 0.25, 3.8, M.concrete, 0, 0.0, Z(R), false);
  const sl = []; for (let x = -700; x < 700; x += 0.65) { if (Math.abs(x) < 4.6) continue; sl.push([x, 0.15, Z(R)]); }
  instBoxes(G, sl, 0.24, 0.1, 2.6, mat('sleeper', { color: 0x6a5a4a }));
  for (const dz of [-0.72, 0.72]) B(G, 1400, 0.14, 0.08, M.steel, 0, 0.2, Z(R) + dz, false);
  const poles = []; for (let x = -600; x < 600; x += 60) poles.push([x, 3.6, Z(R + 3.2)]);
  instBoxes(G, poles, 0.25, 7.2, 0.25, M.dark);
  B(G, 1400, 0.03, 0.03, M.dark, 0, 6.5, Z(R), false);
}
function buildHighway(sc, o) {
  const G = sc.group, len = o.len;
  ground(G, 'grass');
  road(G, 'hwy', 1.0, -60, len);
  const opp = FL(G, 10, len + 60, roadMat('hwy'), -10.0, 0, Z((len - 60) / 2), 10, 12); opp.rotation.y = Math.PI;
  B(G, 0.45, 0.85, len + 60, M.concrete, -4.5, 0.42, Z((len - 60) / 2));
  const ramp = o.ramp;
  const railGaps = ramp ? [[ramp[0] - 30, ramp[1] + 10]] : [];
  const posts = [];
  for (const [a, b] of segs(-60, len, railGaps)) { B(G, 0.1, 0.32, b - a, M.steel, 6.7, 0.62, Z((a + b) / 2)); for (let s = a; s < b; s += 4) posts.push([6.75, 0.35, Z(s)]); }
  B(G, 0.1, 0.32, len + 60, M.steel, -15.4, 0.62, Z((len - 60) / 2)); for (let s = -60; s < len; s += 4) posts.push([-15.45, 0.35, Z(s)]);
  if (ramp) {
    const [r0, r1] = ramp; const L = r1 - r0;
    FL(G, 4.2, L, roadMat('plain', 1), 7.9, 0.002, Z((r0 + r1) / 2), 7, 12);
    for (let s = r0; s < r1 - 3; s += 6) line(G, 3.5, s + 1.5, 0.45, 3);
    line(G, 9.9, (r0 + r1) / 2, 0.2, L);
    B(G, 0.1, 0.32, L + 40, M.steel, 10.6, 0.62, Z((r0 + r1) / 2 - 20)); for (let s = r0 - 40; s < r1; s += 4) posts.push([10.65, 0.35, Z(s)]);
    const dx = 32, dl = 160, ang = Math.atan2(dx, dl), rl = Math.hypot(dx, dl);
    const ra = FL(G, 4.2, rl, roadMat('plain', 1), 7.9 + dx / 2, 0.001, Z(r0 - dl / 2), 7, 12); ra.rotation.y = -ang;
  }
  instBoxes(G, posts, 0.12, 0.7, 0.12, M.steel);
  const tl = [];
  for (let s = -40; s < len + 300; s += rand(8, 18)) { tl.push([rand(18, 28), s, rand(0.9, 1.3)]); tl.push([-rand(24, 34), s + rand(0, 6), rand(0.9, 1.3)]); if (chance(0.5)) tl.push([rand(30, 70), s, rand(1, 1.5)]); }
  trees(G, tl, chance(0.5) ? 'leaf' : 'pine'); verge(G, -40, Math.min(len, 800), 7.2, 14, 1.4);
  fields(G, len);
  if (o.gantryS) {
    const gS = o.gantryS;
    B(G, 0.4, 7.2, 0.4, M.steel, -4.5, 3.6, Z(gS)); B(G, 0.4, 7.2, 0.4, M.steel, 7.1, 3.6, Z(gS)); B(G, 11.8, 0.45, 0.45, M.steel, 1.3, 7.0, Z(gS));
    addSign(G, 'hwy', 1.6, gS, { arg: o.gantryText || 'Brno|98;Jihlava|12', size: 2.6, h: 4.6, noPost: true });
  }
  for (const [x, lv] of [[-7.25, 30], [-10.75, 36]]) { let s0 = rand(150, 300); for (let i = 0; i < 5; i++) { spawn(sc, makeCar(pick(CAR_COLORS)), [[x, Z(2400)], [x, Z(-6000)]], { s0, v: lv }); s0 += rand(90, 260); } }
}

