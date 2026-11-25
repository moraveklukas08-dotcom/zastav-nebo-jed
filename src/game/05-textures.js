/* ============================== textures ============================== */
const ROADSPEC = {
  city: { w: 7, lines: [{ x: 3.5, w: 0.12, dash: [3, 3] }] },
  rural: { w: 7, lines: [{ x: 0.25, w: 0.15 }, { x: 6.75, w: 0.15 }, { x: 3.5, w: 0.12, dash: [4, 8] }] },
  hwy: { w: 10, lines: [{ x: 0.5, w: 0.25 }, { x: 4.0, w: 0.15, dash: [6, 6] }, { x: 7.5, w: 0.25 }] },
  plain: { w: 7, lines: [] },
};
function roadTex(kind) {
  return cached('t:road:' + kind, () => {
    const spec = ROADSPEC[kind], W = 512, H = 1024, px = W / spec.w, py = H / 12;
    const [c, g] = makeCanvas(W, H);
    g.fillStyle = '#4a4d51'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(30,32,35,0.16)' : 'rgba(120,122,125,0.10)'; g.fillRect(Math.random() * W, Math.random() * H, rand(30, 140), rand(30, 200)); }
    speckle(g, W, H, (W * H) / 9, ['#3c3f43', '#55595e', '#5f6368', '#36383b', '#4c4f53', '#6a6d71'], 2);
    if (kind !== 'hwy') for (const lx of [0.25, 0.75]) for (const o of [-0.62, 0.62]) { const x = (spec.w * lx + o) * px; const gr = g.createLinearGradient(x - 22, 0, x + 22, 0); gr.addColorStop(0, 'rgba(18,19,21,0)'); gr.addColorStop(0.5, 'rgba(18,19,21,0.22)'); gr.addColorStop(1, 'rgba(18,19,21,0)'); g.fillStyle = gr; g.fillRect(x - 22, 0, 44, H); }
    g.strokeStyle = 'rgba(20,20,22,0.55)'; g.lineWidth = 1.3;
    for (let i = 0; i < 7; i++) { let x = Math.random() * W, y = Math.random() * H; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 9; k++) { x += rand(-14, 14); y += rand(4, 26); g.lineTo(x, y); } g.stroke(); }
    for (const l of spec.lines) {
      const lw = Math.max(4, l.w * px), x = l.x * px - lw / 2;
      const seg = (y0, y1) => { g.fillStyle = '#ecece6'; g.fillRect(x, y0, lw, y1 - y0); g.fillStyle = 'rgba(70,72,75,0.35)'; for (let k = 0; k < (y1 - y0) / 6; k++) g.fillRect(x + Math.random() * lw, y0 + Math.random() * (y1 - y0), 2, 2); };
      if (l.dash) { const on = l.dash[0] * py, per = (l.dash[0] + l.dash[1]) * py; for (let y = 0; y < H; y += per) seg(y, y + on); }
      else seg(0, H);
    }
    return toTex(c);
  });
}
function roadMat(kind, n = 0) { const wx = BUILD && BUILD.snow ? 's' : BUILD && BUILD.wet ? 'w' : ''; return cached('m:road:' + kind + n + wx, () => new THREE.MeshStandardMaterial({ map: roadTex(kind), normalMap: asphaltNormal(), normalScale: new THREE.Vector2(0.55, 0.55), roughness: wx === 'w' ? 0.22 : 0.86, color: wx === 'w' ? 0x8c9196 : wx === 's' ? 0xd2d6da : 0xffffff, ...layer(n) })); }
function groundTex(kind) {
  return cached('t:ground' + kind, () => {
    const S = 512; const [c, g] = makeCanvas(S, S);
    const P = { snow: ['#e9eef2', ['#dfe6ec', '#f6f8fa', '#cfd8e0', '#e2e8ee', '#c3ccd4']], grass: ['#5a7a36', ['#6b8c40', '#4c6a2b', '#77964a', '#567536', '#86a352']], forest: ['#46572c', ['#3b4a24', '#55673a', '#5c4a2e', '#425a2b', '#6d5a3a']], city: ['#5f7a3a', ['#6b8a42', '#4f6a2e', '#728f4a', '#58733a']] }[kind];
    g.fillStyle = P[0]; g.fillRect(0, 0, S, S);
    speckle(g, S, S, 16000, P[1], 2);
    g.lineWidth = 1;
    for (let i = 0; i < 2600; i++) { const x = Math.random() * S, y = Math.random() * S; g.strokeStyle = P[1][(Math.random() * P[1].length) | 0]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(-2, 2), y - rand(3, 7)); g.stroke(); }
    const t = toTex(c); return t;
  });
}
function groundMat(kind) { return cached('m:ground' + kind, () => new THREE.MeshStandardMaterial({ map: groundTex(kind), vertexColors: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: 3, polygonOffsetUnits: 12 })); }
function groundGeo() {
  return cached('g:ground', () => {
    const g = new THREE.PlaneGeometry(3200, 3200, 80, 80); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, uv = g.attributes.uv, col = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const n = 0.5 + 0.25 * Math.sin(x * 0.013 + z * 0.007) + 0.15 * Math.sin(x * 0.041 - z * 0.033) + 0.1 * Math.sin(z * 0.09 + x * 0.02);
      col.push(0.82 + n * 0.3, 0.86 + n * 0.22, 0.78 + n * 0.18);
      uv.setXY(i, uv.getX(i) * 3200 / 7, uv.getY(i) * 3200 / 7);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g;
  });
}
function pavingMat() {
  return cached('m:paving', () => {
    const S = 256, P = pbr(S, S);
    P.rect(0, 0, S, S, '#6a6964', 0.25, 1);
    const st = 8;
    for (let y = 0; y < S; y += st) for (let x = 0; x < S; x += st) {
      const v = 135 + (Math.random() * 45) | 0; const tint = (Math.floor(x / 64) + Math.floor(y / 64)) % 2 === 0 && (x + y) % 96 < 48 ? -22 : 0;
      P.rect(x + 1 + Math.random(), y + 1 + Math.random(), st - 2, st - 2, `rgb(${v + tint},${v + tint},${v - 4 + tint})`, 0.7 + Math.random() * 0.15, 0.82);
    }
    return P.material(5);
  });
}
function asphaltNormal() { return cached('t:asphn', () => { const S = 256; const [c, g] = makeCanvas(S, S); g.fillStyle = 'rgb(128,128,128)'; g.fillRect(0, 0, S, S); for (let i = 0; i < 12000; i++) { const v = (128 + (Math.random() - 0.5) * 170) | 0; g.fillStyle = `rgb(${v},${v},${v})`; const s2 = 1 + Math.random() * 2; g.fillRect(Math.random() * S, Math.random() * S, s2, s2); } const t = normalFromHeight(c, 2.2); t.repeat.set(5, 9); return t; }); }
const FACADE_COLS = ['#dccaa0', '#e8ddcb', '#c9b79c', '#b9c4c9', '#dab4a0', '#c7cfb5', '#e6d3a8', '#bfb3a8', '#d2c4d6', '#f0e6d2', '#c9a98a'];
const PANEL_COLS = ['#c9c6bd', '#d7d2c4', '#bfc4c4', '#d6cfc0'];
const PANEL_ACC = ['#d9822b', '#3f8f8a', '#c9b037', '#b24a3a', '#5a7fb5'];
function linTex(c, repeat = true) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t; }
function normalFromHeight(hc, strength) {
  const w = hc.width, h = hc.height, src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  const [c, g] = makeCanvas(w, h); const out = g.createImageData(w, h), d = out.data;
  const H = (x, y) => src[((((y % h) + h) % h) * w + (((x % w) + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const nx = -(H(x + 1, y) - H(x - 1, y)) * strength, ny = (H(x, y + 1) - H(x, y - 1)) * strength, l = Math.hypot(nx, ny, 1), i = (y * w + x) * 4;
    d[i] = (nx / l * 0.5 + 0.5) * 255; d[i + 1] = (ny / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  g.putImageData(out, 0, 0); return linTex(c);
}
function pbr(W, H) {
  const [c, g] = makeCanvas(W, H), [hc, h] = makeCanvas(W, H), [rc, r] = makeCanvas(W, H);
  h.fillStyle = 'rgb(180,180,180)'; h.fillRect(0, 0, W, H); r.fillStyle = 'rgb(0,230,0)'; r.fillRect(0, 0, W, H);
  return { c, g, hc, h, rc, r, W, H,
    rect(x, y, w, hh, col, ht, ro, me = 0) { if (col) { g.fillStyle = col; g.fillRect(x, y, w, hh); } if (ht != null) { const v = Math.round(ht * 255); h.fillStyle = `rgb(${v},${v},${v})`; h.fillRect(x, y, w, hh); } if (ro != null) { r.fillStyle = `rgb(0,${Math.round(ro * 255)},${Math.round(me * 255)})`; r.fillRect(x, y, w, hh); } },
    bump(n, amp) { for (let i = 0; i < n; i++) { const v = (180 + (Math.random() - 0.5) * amp) | 0; h.fillStyle = `rgb(${v},${v},${v})`; h.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1 + Math.random() * 2); } },
    material(strength = 3, extra = {}) { return new THREE.MeshStandardMaterial({ map: toTex(c), normalMap: normalFromHeight(hc, strength), roughnessMap: linTex(rc), metalnessMap: linTex(rc), roughness: 1, metalness: 1, ...extra }); }
  };
}
function windowDraw(P, x, y, w, h, frame) {
  const g = P.g;
  P.rect(x - 9, y + h + 5, w + 18, 9, '#e9e4d8', 0.97, 0.6);
  P.rect(x - 9, y + h + 14, w + 18, 4, 'rgba(0,0,0,0.25)', 0.55, null);
  P.rect(x - 6, y - 6, w + 12, h + 12, frame, 0.42, 0.45);
  const gr = g.createLinearGradient(x, y, x + w * 0.5, y + h); gr.addColorStop(0, '#56697a'); gr.addColorStop(0.45, '#26333f'); gr.addColorStop(1, '#10161c');
  g.fillStyle = gr; g.fillRect(x, y, w, h); P.rect(x, y, w, h, null, 0.12, 0.04, 0);
  if (Math.random() < 0.35) { g.fillStyle = 'rgba(255,214,150,0.18)'; g.fillRect(x, y + h * 0.4, w, h * 0.6); }
  if (Math.random() < 0.6) { const cc = pick(['rgba(240,235,220,0.8)', 'rgba(205,195,175,0.75)', 'rgba(232,226,240,0.75)']); P.rect(x + 3, y + 3, w * 0.22, h - 6, cc, 0.16, 0.9); P.rect(x + w - 3 - w * 0.22, y + 3, w * 0.22, h - 6, cc, 0.16, 0.9); }
  P.rect(x + w / 2 - 3, y, 6, h, frame, 0.4, 0.45); P.rect(x, y + h * 0.32, w, 5, frame, 0.4, 0.45);
}
function facadeMat(style, ci) {
  return cached('m:fac' + style + ci, () => {
    const S = 256, P = pbr(S, S), g = P.g;
    const col = style === 'panel' ? PANEL_COLS[ci % PANEL_COLS.length] : FACADE_COLS[ci % FACADE_COLS.length];
    P.rect(0, 0, S, S, col); P.bump(5000, 50);
    speckle(g, S, S, 3000, ['rgba(0,0,0,0.05)', 'rgba(255,255,255,0.07)', 'rgba(60,50,40,0.05)'], 2);
    const gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(1, 'rgba(40,30,20,0.14)'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
    if (style === 'panel') {
      P.rect(0, S - 3, S, 3, 'rgba(0,0,0,0.22)', 0.3); P.rect(S - 3, 0, 3, S, 'rgba(0,0,0,0.22)', 0.3);
      windowDraw(P, 34, 54, 188, 104, '#ebe8e0');
      P.rect(0, 186, S, 48, PANEL_ACC[ci % PANEL_ACC.length], 0.95, 0.7); P.rect(0, 232, S, 4, 'rgba(0,0,0,0.25)', 0.5);
    } else if (style === 'house') {
      windowDraw(P, 88, 70, 80, 98, '#f6f3ec');
      for (const sx of [70, 172]) P.rect(sx, 64, 14, 110, pick(['#5b7a4a', '#7a4a32', '#4a5f7a']), 0.85, 0.7);
      P.rect(0, 236, S, 20, 'rgba(0,0,0,0.12)', 0.9);
    } else {
      const fr = style === 'classic' ? '#f6f2e8' : '#ebe6da';
      windowDraw(P, 84, 56, 88, 132, fr);
      if (style === 'classic') {
        g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.moveTo(70, 46); g.lineTo(186, 46); g.lineTo(128, 20); g.closePath(); g.fill();
        P.h.fillStyle = 'rgb(240,240,240)'; P.h.beginPath(); P.h.moveTo(70, 46); P.h.lineTo(186, 46); P.h.lineTo(128, 20); P.h.closePath(); P.h.fill();
        P.rect(70, 44, 116, 4, 'rgba(0,0,0,0.15)', 0.6);
        P.rect(0, 238, S, 6, 'rgba(255,255,255,0.25)', 0.98); P.rect(0, 244, S, 12, 'rgba(0,0,0,0.10)', 0.88);
      } else { P.rect(0, 244, S, 12, 'rgba(0,0,0,0.08)', 0.86); }
    }
    return P.material(3.2);
  });
}
function shopMat(i) {
  return cached('m:shop' + i, () => {
    const S = 256, P = pbr(S, S), g = P.g;
    const frames = ['#2e4636', '#5b3a26', '#2a2d33', '#7a1f1f'];
    P.rect(0, 0, S, S, '#d8d2c4'); P.bump(4000, 50); speckle(g, S, S, 1500, ['rgba(0,0,0,0.06)', 'rgba(255,255,255,0.06)']);
    P.rect(0, 224, S, 32, '#6f6a62', 0.9, 0.8);
    P.rect(16, 52, 224, 174, frames[i % 4], 0.5, 0.35, 0.2);
    const gr = g.createLinearGradient(0, 62, 0, 220); gr.addColorStop(0, '#4f6575'); gr.addColorStop(1, '#0e151c');
    g.fillStyle = gr; g.fillRect(28, 62, 200, 158); P.rect(28, 62, 200, 158, null, 0.1, 0.03, 0);
    g.fillStyle = 'rgba(255,220,160,0.22)'; g.fillRect(36, 140, 184, 76);
    for (let k = 0; k < 7; k++) { g.fillStyle = `hsla(${rand(0, 360)},40%,55%,0.35)`; g.fillRect(rand(40, 200), rand(150, 200), rand(8, 20), rand(10, 22)); }
    P.rect(124, 62, 6, 158, frames[i % 4], 0.5, 0.35, 0.2);
    return P.material(3);
  });
}
function roofTileMat(col) {
  if (BUILD && BUILD.snow) col = 0xe6ecf0;
  return cached('m:tile' + col, () => {
    const S = 256, P = pbr(S, S), g = P.g, base = new THREE.Color(col);
    P.rect(0, 0, S, S, '#' + base.clone().offsetHSL(0, 0, -0.12).getHexString(), 0.3, 0.75);
    for (let r = 0; r < 8; r++) for (let k = 0; k < 9; k++) {
      const x = k * 32 + (r % 2) * 16, y = r * 32; const cc = base.clone().offsetHSL(rand(-0.01, 0.01), 0, rand(-0.12, 0.08));
      g.fillStyle = '#' + cc.getHexString(); g.beginPath(); g.roundRect(x - 15, y + 2, 30, 28, [0, 0, 12, 12]); g.fill();
      const hg = P.h.createLinearGradient(0, y + 2, 0, y + 30); hg.addColorStop(0, 'rgb(70,70,70)'); hg.addColorStop(1, 'rgb(230,230,230)'); P.h.fillStyle = hg; P.h.beginPath(); P.h.roundRect(x - 15, y + 2, 30, 28, [0, 0, 12, 12]); P.h.fill();
      const sg = g.createLinearGradient(x - 15, 0, x + 15, 0); sg.addColorStop(0, 'rgba(0,0,0,0.18)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.06)'); sg.addColorStop(1, 'rgba(0,0,0,0.18)'); g.fillStyle = sg; g.fillRect(x - 15, y + 2, 30, 28);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x - 15, y + 28, 30, 4);
    }
    speckle(g, S, S, 1200, ['rgba(40,60,30,0.12)', 'rgba(0,0,0,0.1)']);
    return P.material(4);
  });
}
function fenceMat() {
  return cached('m:fence', () => {
    const [c, g] = makeCanvas(256, 128);
    g.clearRect(0, 0, 256, 128);
    for (let i = 0; i < 8; i++) { const x = i * 32 + 6; g.fillStyle = i % 2 ? '#8a6a46' : '#7d5f3e'; g.beginPath(); g.moveTo(x, 128); g.lineTo(x, 22); g.lineTo(x + 10, 8); g.lineTo(x + 20, 22); g.lineTo(x + 20, 128); g.fill(); }
    g.fillStyle = '#6a4e32'; g.fillRect(0, 40, 256, 12); g.fillRect(0, 96, 256, 12);
    const t = toTex(c); return new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 });
  });
}
function cropMat(kind) {
  return cached('m:crop' + kind, () => {
    const S = 256; const [c, g] = makeCanvas(S, S);
    const P = { rape: ['#d9c52e', ['#e8d64a', '#c4b023', '#a9a43a']], wheat: ['#7f9a3e', ['#8aa84a', '#6f8a36', '#97b055']], plow: ['#6f5a3f', ['#7d6749', '#5e4b33', '#86704f']], meadow: ['#6a8c42', ['#7a9c4f', '#5c7c38', '#8aa75a', '#b8b860']] }[kind];
    g.fillStyle = P[0]; g.fillRect(0, 0, S, S); speckle(g, S, S, 9000, P[1], 2);
    g.fillStyle = 'rgba(40,30,10,0.16)'; for (let x = 0; x < S; x += 16) g.fillRect(x, 0, 4, S);
    return new THREE.MeshStandardMaterial({ map: toTex(c), roughness: 1, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 8 });
  });
}
function glowTex() { return cached('t:glow', () => { const [c, g] = makeCanvas(64, 64); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return toTex(c, false); }); }

/* ---------- road signs ---------- */
function signTexture(type, arg) {
  return cached('t:sign:' + type + ':' + (arg || ''), () => {
    const wide = type === 'town' || type === 'hwy';
    const W = wide ? 512 : 256, H = 256;
    const [c, g] = makeCanvas(W, H);
    g.lineJoin = 'round'; g.lineCap = 'round';
    const poly = pts => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); };
    const warn = () => { poly([[128, 14], [244, 222], [12, 222]]); g.fillStyle = '#d42a20'; g.fill(); g.lineWidth = 12; g.strokeStyle = '#d42a20'; g.stroke(); poly([[128, 56], [208, 200], [48, 200]]); g.fillStyle = '#fff'; g.fill(); g.fillStyle = '#111'; g.strokeStyle = '#111'; };
    switch (type) {
      case 'main':
        g.save(); g.translate(128, 128); g.rotate(Math.PI / 4);
        g.fillStyle = '#fff'; g.fillRect(-86, -86, 172, 172); g.lineWidth = 3; g.strokeStyle = '#333'; g.strokeRect(-86, -86, 172, 172);
        g.fillStyle = '#f5c400'; g.fillRect(-60, -60, 120, 120); g.restore(); break;
      case 'yield':
        poly([[16, 34], [240, 34], [128, 232]]); g.fillStyle = '#d42a20'; g.fill(); g.lineWidth = 14; g.strokeStyle = '#d42a20'; g.stroke();
        poly([[56, 56], [200, 56], [128, 186]]); g.fillStyle = '#fff'; g.fill(); break;
      case 'stop': {
        const oct = r => { const p = []; for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; p.push([128 + Math.cos(a) * r, 128 + Math.sin(a) * r]); } return p; };
        poly(oct(124)); g.fillStyle = '#fff'; g.fill(); poly(oct(114)); g.fillStyle = '#d42a20'; g.fill();
        g.fillStyle = '#fff'; g.font = '800 78px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('STOP', 128, 134); break;
      }
      case 'limit':
        g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
        g.beginPath(); g.arc(128, 128, 108, 0, Math.PI * 2); g.lineWidth = 28; g.strokeStyle = '#d42a20'; g.stroke();
        g.fillStyle = '#111'; g.font = '800 ' + (String(arg).length > 2 ? 92 : 116) + 'px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(arg, 128, 134); break;
      case 'paddle':
        g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); g.beginPath(); g.arc(128, 128, 104, 0, Math.PI * 2); g.fillStyle = '#d42a20'; g.fill();
        g.fillStyle = '#fff'; g.font = '800 70px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('STOP', 128, 134); break;
      case 'roundabout':
        g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fillStyle = '#1b5bb8'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#fff'; g.stroke();
        g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 20; g.lineCap = 'butt';
        for (let k = 0; k < 3; k++) { const a0 = k * 2 * Math.PI / 3 + 0.35, a1 = a0 + 1.35; g.beginPath(); g.arc(128, 128, 62, -a0, -a1, true); g.stroke(); const ax = 128 + Math.cos(-a1) * 62, ay = 128 + Math.sin(-a1) * 62, tx = Math.sin(-a1), ty = -Math.cos(-a1); poly([[ax + tx * 22, ay + ty * 22], [ax + Math.cos(-a1) * 24, ay + Math.sin(-a1) * 24], [ax - Math.cos(-a1) * 24, ay - Math.sin(-a1) * 24]]); g.fill(); }
        break;
      case 'crosswalk':
        g.fillStyle = '#1b5bb8'; g.beginPath(); g.roundRect(8, 8, 240, 240, 18); g.fill();
        poly([[128, 30], [232, 214], [24, 214]]); g.fillStyle = '#fff'; g.fill();
        g.fillStyle = '#111'; for (let i = 0; i < 5; i++) g.fillRect(66 + i * 26, 190, 14, 16);
        g.strokeStyle = '#111'; g.lineWidth = 10;
        g.beginPath(); g.arc(132, 92, 12, 0, Math.PI * 2); g.fillStyle = '#111'; g.fill();
        g.beginPath(); g.moveTo(130, 108); g.lineTo(124, 148); g.lineTo(106, 180); g.moveTo(124, 148); g.lineTo(144, 180); g.moveTo(128, 118); g.lineTo(108, 136); g.moveTo(128, 118); g.lineTo(150, 132); g.stroke(); break;
      case 'children':
        warn(); g.lineWidth = 9;
        for (const [x, k] of [[108, 1], [150, 0.8]]) { g.beginPath(); g.arc(x, 112 + (1 - k) * 30, 10 * k, 0, Math.PI * 2); g.fill(); g.beginPath(); const y0 = 124 + (1 - k) * 30; g.moveTo(x, y0); g.lineTo(x - 2, y0 + 34 * k); g.lineTo(x - 14 * k, y0 + 62 * k); g.moveTo(x - 2, y0 + 34 * k); g.lineTo(x + 14 * k, y0 + 60 * k); g.moveTo(x, y0 + 8); g.lineTo(x - 16 * k, y0 + 26 * k); g.moveTo(x, y0 + 8); g.lineTo(x + 16 * k, y0 + 22 * k); g.stroke(); }
        break;
      case 'works':
        warn(); g.lineWidth = 9;
        g.beginPath(); g.arc(112, 104, 11, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.moveTo(110, 118); g.lineTo(118, 152); g.lineTo(104, 186); g.moveTo(118, 152); g.lineTo(134, 184); g.moveTo(112, 128); g.lineTo(140, 140); g.moveTo(140, 140); g.lineTo(164, 176); g.stroke();
        poly([[150, 192], [196, 192], [176, 166]]); g.fill(); break;
      case 'deer':
        warn(); g.lineWidth = 7;
        g.beginPath(); g.ellipse(124, 158, 36, 15, -0.25, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.moveTo(152, 146); g.lineTo(170, 116); g.stroke();
        g.beginPath(); g.ellipse(176, 110, 11, 7, -0.4, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.moveTo(170, 104); g.lineTo(160, 82); g.moveTo(164, 92); g.lineTo(152, 88); g.moveTo(176, 102); g.lineTo(184, 80); g.moveTo(182, 88); g.lineTo(194, 86);
        g.moveTo(100, 162); g.lineTo(84, 192); g.moveTo(112, 168); g.lineTo(106, 196); g.moveTo(140, 160); g.lineTo(156, 190); g.moveTo(148, 154); g.lineTo(170, 178); g.stroke(); break;
      case 'tram':
        warn(); g.beginPath(); g.roundRect(84, 110, 88, 66, 8); g.fill(); g.fillStyle = '#fff'; g.fillRect(94, 120, 30, 22); g.fillRect(132, 120, 30, 22); g.fillStyle = '#111';
        g.lineWidth = 5; g.beginPath(); g.moveTo(128, 110); g.lineTo(116, 90); g.lineTo(140, 80); g.stroke(); g.fillRect(84, 182, 88, 6); break;
      case 'railcross':
        for (const a of [0.62, -0.62]) { g.save(); g.translate(128, 128); g.rotate(a); g.fillStyle = '#d42a20'; g.fillRect(-122, -21, 244, 42); g.fillStyle = '#fff'; g.fillRect(-114, -13, 228, 26); g.restore(); }
        break;
      case 'warnTri':
        poly([[128, 20], [240, 220], [16, 220]]); g.lineWidth = 26; g.strokeStyle = '#e0261c'; g.stroke(); break;
      case 'bus':
        g.fillStyle = '#fff'; g.beginPath(); g.roundRect(10, 10, 236, 236, 16); g.fill(); g.lineWidth = 8; g.strokeStyle = '#1b5bb8'; g.stroke();
        g.fillStyle = '#1b5bb8'; g.beginPath(); g.roundRect(54, 58, 148, 104, 12); g.fill();
        g.fillStyle = '#fff'; g.fillRect(66, 70, 124, 40); g.beginPath(); g.arc(84, 168, 14, 0, Math.PI * 2); g.arc(172, 168, 14, 0, Math.PI * 2); g.fillStyle = '#1b5bb8'; g.fill();
        g.fillStyle = '#111'; g.font = '800 40px ' + FONT; g.textAlign = 'center'; g.fillText('ZASTÁVKA', 128, 224); break;
      case 'town':
        g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.lineWidth = 14; g.strokeStyle = '#111'; g.strokeRect(14, 14, W - 28, H - 28);
        g.fillStyle = '#111'; g.font = '800 ' + (arg.length > 12 ? 70 : 88) + 'px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(arg.toUpperCase(), W / 2, H / 2 + 4); break;
      case 'hwy':
        g.fillStyle = '#0b6e3f'; g.fillRect(0, 0, W, H); g.lineWidth = 10; g.strokeStyle = '#fff'; g.strokeRect(12, 12, W - 24, H - 24);
        g.fillStyle = '#fff'; g.font = '700 70px ' + FONT; g.textBaseline = 'middle';
        String(arg).split(';').forEach((row, i) => { const [a, b] = row.split('|'); g.textAlign = 'left'; g.fillText(a, 40, 80 + i * 96); g.textAlign = 'right'; g.fillText(b, W - 40, 80 + i * 96); });
        break;
    }
    return toTex(c, false);
  });
}
function signMat(type, arg) { return cached('m:sign:' + type + ':' + (arg || ''), () => { const t = signTexture(type, arg); return new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, roughness: 0.5, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.14 }); }); }
function signBack(type, arg) { return cached('m:signb:' + type + ':' + (arg || ''), () => new THREE.MeshStandardMaterial({ map: signTexture(type, arg), color: 0x000000, emissive: 0x5f646b, alphaTest: 0.5, roughness: 0.8 })); }
function addSign(parent, type, x, s, o = {}) {
  const wide = type === 'town' || type === 'hwy';
  const size = o.size || 0.8, w = wide ? size * 2 : size, h = size, base = o.h ?? 2.0;
  const grp = new THREE.Group();
  if (!o.noPost) { const ph = o.postH ?? base + h * 0.5; const p = new THREE.Mesh(postG, M.pole); p.scale.set(1, ph, 1); p.position.y = ph / 2; p.castShadow = true; grp.add(p); }
  const f = new THREE.Mesh(vPlane, signMat(type, o.arg)); f.scale.set(w, h, 1); f.position.set(0, base + h / 2, 0.05); grp.add(f);
  const b = new THREE.Mesh(vPlane, signBack(type, o.arg)); b.rotation.y = Math.PI; b.scale.set(w, h, 1); b.position.set(0, base + h / 2, 0.04); grp.add(b);
  grp.position.set(x, 0, Z(s)); grp.rotation.y = o.rot || 0; parent.add(grp); return grp;
}
function textPlate(text, bg, fg) {
  return cached('m:plate' + text + bg, () => {
    const [c, g] = makeCanvas(512, 96); g.fillStyle = bg; g.fillRect(0, 0, 512, 96); g.fillStyle = fg; g.font = '700 60px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 52);
    const t = toTex(c, false); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.08 });
  });
}

