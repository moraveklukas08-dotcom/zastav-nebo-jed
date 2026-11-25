/* ============================== sky, hills, environment ============================== */
const ENV = {
  city: { top: '#2f6fc4', mid: '#6fa3dc', hz: '#d3dee6', fog: 0xd3dee6, near: 80, far: 470, hemi: 0.35, sun: 2.7, ground: '#6b7360', clouds: true },
  village: { top: '#2a6dc9', mid: '#6aa5e2', hz: '#dbe5ec', fog: 0xdbe5ec, near: 110, far: 600, hemi: 0.35, sun: 2.8, ground: '#6f8250', clouds: true },
  forest: { top: '#4f7fb0', mid: '#86a9c8', hz: '#c6d2d7', fog: 0xc6d2d7, near: 50, far: 390, hemi: 0.32, sun: 2.2, ground: '#4a5a34', clouds: true },
  fields: { top: '#2b6cc8', mid: '#6ea8e4', hz: '#dfe8ee', fog: 0xdfe8ee, near: 150, far: 800, hemi: 0.35, sun: 2.9, ground: '#7d8a4a', clouds: true },
  hwy: { top: '#3373c6', mid: '#78abdf', hz: '#dce4e9', fog: 0xdce4e9, near: 170, far: 880, hemi: 0.35, sun: 2.8, ground: '#6f8250', clouds: true },
  night: { top: '#03060d', mid: '#070c18', hz: '#111a2a', fog: 0x0b111d, near: 25, far: 240, hemi: 0.06, sun: 0.18, sunCol: 0x9fb4ff, ground: '#07090c', stars: true, night: true },
  fog: { top: '#b6bdc1', hz: '#b6bdc1', fog: 0xb6bdc1, near: 3, far: 80, hemi: 0.45, sun: 0.5, ground: '#7b8270', fogScene: true },
  rain: { top: '#4f5861', mid: '#727b84', hz: '#959da4', fog: 0x959da4, near: 25, far: 320, hemi: 0.55, sun: 0.35, ground: '#4f554b', overcast: true, rain: true },
  snow: { top: '#8e9aa6', mid: '#b3bdc6', hz: '#d3d9de', fog: 0xd3d9de, near: 30, far: 330, hemi: 0.6, sun: 0.55, ground: '#e6ebef', overcast: true, snowfall: true },
  sunset: { top: '#2f4f8a', mid: '#b9826a', hz: '#f2b27a', fog: 0xe9b38c, near: 130, far: 720, hemi: 0.28, sun: 3.3, sunCol: 0xffad66, ground: '#6c6645', clouds: true, sunset: true },
};
const SUN_DIR = new THREE.Vector3(-0.28, 0.13, -1).normalize();
function skyTexFor(k) {
  return cached('t:sky' + k, () => {
    const e = ENV[k]; const W = 1024, H = 512; const [c, g] = makeCanvas(W, H);
    const gr = g.createLinearGradient(0, 0, 0, H / 2); gr.addColorStop(0, e.top); gr.addColorStop(0.6, e.mid || e.top); gr.addColorStop(0.93, e.hz); gr.addColorStop(1, e.hz);
    g.fillStyle = gr; g.fillRect(0, 0, W, H / 2); g.fillStyle = e.hz; g.fillRect(0, H / 2, W, H / 2);
    if (e.clouds) {
      for (let i = 0; i < 42; i++) {
        const cx = Math.random() * W, cy = rand(110, 240), sc = 0.3 + (cy - 100) / 260;
        for (let k2 = 0; k2 < 9; k2++) {
          const r = rand(14, 34) * sc, x = cx + rand(-50, 50) * sc, y = cy + rand(-8, 6) * sc * 0.6;
          for (const xx of [x, x - W, x + W]) { const rg = g.createRadialGradient(xx, y, 0, xx, y, r); rg.addColorStop(0, 'rgba(255,255,255,0.85)'); rg.addColorStop(0.55, 'rgba(244,247,252,0.45)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.beginPath(); g.ellipse(xx, y, r * 1.6, r * 0.7, 0, 0, Math.PI * 2); g.fill(); }
        }
      }
    }
    if (e.overcast) { g.fillStyle = 'rgba(0,0,0,0)'; for (let i = 0; i < 260; i++) { const x = Math.random() * W, y = rand(0, 245), r = rand(20, 60); for (const xx of [x, x - W, x + W]) { const rg = g.createRadialGradient(xx, y, 0, xx, y, r); const v = (rand(150, 215)) | 0; rg.addColorStop(0, `rgba(${v},${v + 4},${v + 8},0.55)`); rg.addColorStop(1, `rgba(${v},${v},${v},0)`); g.fillStyle = rg; g.beginPath(); g.ellipse(xx, y, r * 1.8, r * 0.8, 0, 0, Math.PI * 2); g.fill(); } } }
    if (e.sunset) { const sx = 0.75 * W, sy = 226; const sg = g.createRadialGradient(sx, sy, 0, sx, sy, 260); sg.addColorStop(0, 'rgba(255,250,230,1)'); sg.addColorStop(0.04, 'rgba(255,236,190,1)'); sg.addColorStop(0.12, 'rgba(255,190,120,0.65)'); sg.addColorStop(0.45, 'rgba(255,150,90,0.18)'); sg.addColorStop(1, 'rgba(255,140,80,0)'); g.fillStyle = sg; g.fillRect(0, 0, W, H / 2 + 20); }
    if (e.stars) { for (let i = 0; i < 520; i++) { g.fillStyle = `rgba(255,255,255,${rand(0.15, 0.7)})`; const s = Math.random() < 0.04 ? 1.4 : 0.8; g.fillRect(Math.random() * W, Math.random() * 200, s, s * 0.6); } const mg = g.createRadialGradient(300, 90, 0, 300, 90, 40); mg.addColorStop(0, 'rgba(240,244,255,1)'); mg.addColorStop(0.3, 'rgba(230,236,255,0.9)'); mg.addColorStop(0.35, 'rgba(200,210,255,0.25)'); mg.addColorStop(1, 'rgba(200,210,255,0)'); g.fillStyle = mg; g.fillRect(250, 40, 100, 100); }
    const hz = g.createLinearGradient(0, 200, 0, 256); hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(1, e.hz); g.fillStyle = hz; g.fillRect(0, 200, W, 56);
    const t = toTex(c, false); t.wrapS = THREE.RepeatWrapping; return t;
  });
}
const dome = new THREE.Mesh(new THREE.SphereGeometry(1300, 48, 24), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false }));
dome.renderOrder = -10; scene.add(dome);
function makeHills(radius, depth, hmin, hmax, color, seed) {
  const N = 180, pos = [], col = [], idx = []; const c0 = new THREE.Color(color), c1 = c0.clone().offsetHSL(0, -0.05, 0.08);
  for (let i = 0; i <= N; i++) {
    const a = i / N * Math.PI * 2;
    const h = hmin + (hmax - hmin) * Math.max(0, 0.5 + 0.35 * Math.sin(a * 3 + seed) + 0.2 * Math.sin(a * 7 + seed * 2) + 0.12 * Math.sin(a * 17 + seed * 3));
    pos.push(Math.cos(a) * radius, -6, Math.sin(a) * radius, Math.cos(a) * (radius + depth), h, Math.sin(a) * (radius + depth));
    col.push(c0.r, c0.g, c0.b, c1.r, c1.g, c1.b);
  }
  for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false, flatShading: true }));
}
const hills = new THREE.Group();
const hillNear = makeHills(700, 80, 12, 55, 0x7d9a7a, 1.3), hillFar = makeHills(1000, 120, 40, 140, 0xa3b5c4, 4.1);
hills.add(hillFar, hillNear); scene.add(hills);
function envFor(k) {
  return cached('env:' + k, () => {
    const e = ENV[k]; const sc = new THREE.Scene();
    sc.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), new THREE.MeshBasicMaterial({ map: skyTexFor(k), side: THREE.BackSide })));
    const gd = new THREE.Mesh(new THREE.CircleGeometry(95, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: e.ground })); gd.position.y = -3; sc.add(gd);
    return pmrem.fromScene(sc, 0.03, 0.1, 400).texture;
  });
}
let curEnv = null;
function applyEnv(k) {
  const e = ENV[k]; curEnv = k;
  dome.material.map = skyTexFor(k); dome.material.needsUpdate = true; dome.visible = !e.fogScene;
  hills.visible = !e.fogScene;
  hillNear.material.color.setHex(e.night ? 0x1a2330 : 0xffffff); hillFar.material.color.setHex(e.night ? 0x1c2638 : 0xffffff);
  scene.background = e.fogScene ? new THREE.Color(e.fog) : new THREE.Color(e.hz);
  scene.fog = new THREE.Fog(e.fog, e.near, e.far);
  scene.environment = envFor(k);
  hemi.intensity = e.hemi; sun.intensity = e.sun; sun.color.setHex(e.sunCol || 0xffeccc);
  headlight.intensity = e.night ? 900 : (e.fogScene || e.rain || e.snowfall) ? 250 : 0;
  WX.rain.visible = !!e.rain; WX.snow.visible = !!e.snowfall; WX.sunset = !!e.sunset;
  if (CK.wipers) { CK.wipers.forEach(w => w.visible = !!(e.rain || e.snowfall)); CK.drops.visible = !!e.rain; }
  AU.ambient(k);
}

