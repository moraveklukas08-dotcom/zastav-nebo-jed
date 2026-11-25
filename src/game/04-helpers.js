/* ============================== caches & helpers ============================== */
const CACHE = {};
function cached(k, fn) { if (!(k in CACHE)) { const v = fn(); if (v && v.userData) v.userData.shared = true; CACHE[k] = v; } return CACHE[k]; }
function mat(key, p) { return cached('m:' + key, () => new THREE.MeshStandardMaterial(p)); }
function paintMat(color) { return cached('paint' + color, () => new THREE.MeshPhysicalMaterial({ color, metalness: 0.35, roughness: 0.38, clearcoat: 0.9, clearcoatRoughness: 0.18 })); }
const unitBox = cached('g:box', () => new THREE.BoxGeometry(1, 1, 1));
const vPlane = cached('g:vplane', () => new THREE.PlaneGeometry(1, 1));
const sphereG = cached('g:sph', () => new THREE.SphereGeometry(1, 16, 12));
const lensG = cached('g:lens', () => new THREE.CircleGeometry(1, 20));
const capG = cached('g:cap', () => new THREE.CapsuleGeometry(0.5, 1, 4, 10));
const postG = cached('g:post', () => new THREE.CylinderGeometry(0.035, 0.035, 1, 8));
const cylG = cached('g:cyl', () => new THREE.CylinderGeometry(1, 1, 1, 16));
function rbox(w, h, d, r = 0.08, seg = 2) { const k = `g:rb${w}|${h}|${d}|${r}`; return cached(k, () => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001))); }
function RB(parent, w, h, d, r, m, x, y, z, cast = true) { const o = new THREE.Mesh(rbox(w, h, d, r), m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; parent.add(o); return o; }
function B(parent, w, h, d, m, x, y, z, cast = true) { const o = new THREE.Mesh(unitBox, m); o.scale.set(w, h, d); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; parent.add(o); return o; }
function flatGeo(w, l, tw, tl) { const g = new THREE.PlaneGeometry(w, l); g.rotateX(-Math.PI / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tw, uv.getY(i) * l / tl); return g; }
function FL(parent, w, l, m, x, y, z, tw = w, tl = l) { const o = new THREE.Mesh(flatGeo(w, l, tw, tl), m); o.position.set(x, y, z); o.receiveShadow = true; parent.add(o); return o; }
function planarUV(g, tw, tl) { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / tw, -p.getZ(i) / tl); return g; }
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function toTex(c, repeat = true) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t; }
function speckle(g, w, h, n, cols, sz = 2) { for (let i = 0; i < n; i++) { g.fillStyle = cols[(Math.random() * cols.length) | 0]; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * sz, 1 + Math.random() * sz); } }
const layer = n => n ? { polygonOffset: true, polygonOffsetFactor: -n, polygonOffsetUnits: -4 * n } : {};

const FONT = '"Barlow Condensed","Arial Narrow",sans-serif';
const M = {
  white: mat('white', { color: 0xf2f2ec, roughness: 0.75, ...layer(4) }),
  black: mat('black', { color: 0x141516, roughness: 0.7 }),
  tire: mat('tire', { color: 0x1a1a1b, roughness: 0.9 }),
  rim: mat('rim', { color: 0xc9cdd2, metalness: 0.9, roughness: 0.3 }),
  glass: mat('glass', { color: 0x0c1218, metalness: 0.0, roughness: 0.04 }),
  pole: mat('pole', { color: 0x8a9096, metalness: 0.6, roughness: 0.4 }),
  dark: mat('darkm', { color: 0x2b2f33, metalness: 0.4, roughness: 0.55 }),
  curb: mat('curb', { color: 0xc3c2bb, roughness: 0.85 }),
  walkSide: mat('walkside', { color: 0x9c9b94, roughness: 0.95 }),
  concrete: mat('concrete', { color: 0xbab9b1, roughness: 0.9 }),
  steel: mat('steel', { color: 0xb5bcc2, metalness: 0.75, roughness: 0.32 }),
  wood: mat('wood', { color: 0x6f4f33, roughness: 0.9 }),
  gravel: mat('gravel', { color: 0x8f897d, roughness: 1, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 4 }),
  roofFlat: mat('roofflat', { color: 0x55585b, roughness: 1 }),
  trunk: mat('trunk', { color: 0x5a4330, roughness: 1 }),
  skin: mat('skin', { color: 0xe2b896, roughness: 0.75 }),
  head: mat('headlamp', { color: 0xffffff, emissive: 0xfff4d8, emissiveIntensity: 1.2 }),
  wall: mat('stonewall', { color: 0xb3a68c, roughness: 1 }),
  plastic: mat('plastic', { color: 0x222426, roughness: 0.6 }),
  yellowM: mat('yellowm', { color: 0xf2b705, roughness: 0.5 }),
  orange: mat('orange', { color: 0xff6a00, roughness: 0.6, emissive: 0x401800 }),
  reflector: mat('reflector', { color: 0xffb347, emissive: 0xff9a2a, emissiveIntensity: 0.7 }),
};
const CAR_COLORS = [0xc3c5c9, 0x1d2633, 0xf2f2f2, 0x9b1c1c, 0x2f5d8a, 0x3d4a3a, 0x8f969d, 0x5a2d6e, 0xc7a24a, 0x22503c, 0xd65a1f, 0x6b7a8a, 0x111111, 0x7b0f22];
const SHIRTS = [0xc0392b, 0x2e86c1, 0x27ae60, 0xf1c40f, 0x8e44ad, 0xe67e22, 0x34495e, 0xecf0f1, 0x16a085, 0x9b5f3a];
const PANTS = [0x1f2a44, 0x2d2d2d, 0x4a5a6a, 0x6b4f3a, 0x23395b, 0x3b3b3b];

