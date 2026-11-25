/* ============================== basics ============================== */
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const chance = p => Math.random() < p;
const pick = a => a[(Math.random() * a.length) | 0];
const Z = s => -s;
const DEG = Math.PI / 180;
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let vrng = Math.random;
const vchance = p => vrng() < p;
function weighted(o) { let r = vrng() * Object.values(o).reduce((a, b) => a + b, 0); for (const k in o) { r -= o[k]; if (r <= 0) return k; } return Object.keys(o)[0]; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(pointer: coarse)').matches;
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

