/* ============================== player route ============================== */
class Route {
  constructor(x, z) { this.pts = [[x, z]]; this.dx = 0; this.dz = -1; this.len = 0; this.lim = []; }
  get last() { return this.pts[this.pts.length - 1]; }
  push(x, z) { const [px, pz] = this.last; this.len += Math.hypot(x - px, z - pz); this.pts.push([x, z]); }
  line(L) { const [x, z] = this.last; const n = Math.max(1, Math.ceil(L / 2)); for (let i = 1; i <= n; i++) this.push(x + this.dx * L * i / n, z + this.dz * L * i / n); return this; }
  arc(r, a) {
    const [x, z] = this.last; const nx = a > 0 ? this.dz : -this.dz, nz = a > 0 ? -this.dx : this.dx; const cx = x + nx * r, cz = z + nz * r, vx = x - cx, vz = z - cz;
    const n = Math.max(6, Math.ceil(Math.abs(a) * r / 0.4));
    for (let i = 1; i <= n; i++) { const t = a * i / n, c = Math.cos(t), s = Math.sin(t); this.push(cx + vx * c + vz * s, cz - vx * s + vz * c); }
    const c = Math.cos(a), s = Math.sin(a); [this.dx, this.dz] = [this.dx * c + this.dz * s, -this.dx * s + this.dz * c]; return this;
  }
  shift(lat, long) { const h = 2 * Math.atan(Math.abs(lat) / long), r = long / (2 * Math.sin(h)), sg = lat > 0 ? 1 : -1; return this.arc(r, sg * h).arc(r, -sg * h); }
  curve(list) { const sp = smoothPts([this.last, ...list], 0.4); for (let i = 1; i < sp.length; i++) this.push(sp[i][0], sp[i][1]); const a = sp[sp.length - 2], b = sp[sp.length - 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); this.dx = (b[0] - a[0]) / l; this.dz = (b[1] - a[1]) / l; return this; }
  limit(s0, s1, v) { this.lim.push([s0, s1, v]); return this; }
  done() { this.cum = [0]; for (let i = 1; i < this.pts.length; i++) this.cum.push(this.cum[i - 1] + Math.hypot(this.pts[i][0] - this.pts[i - 1][0], this.pts[i][1] - this.pts[i - 1][1])); this.total = this.cum[this.cum.length - 1]; return this; }
  at(s) { s = Math.max(0, Math.min(this.total - 0.001, s)); let lo = 0, hi = this.cum.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (this.cum[m] <= s) lo = m; else hi = m; } const a = this.pts[lo], b = this.pts[lo + 1], l = (this.cum[lo + 1] - this.cum[lo]) || 1e-6, u = (s - this.cum[lo]) / l; return { x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u, dx: (b[0] - a[0]) / l, dz: (b[1] - a[1]) / l }; }
  vlim(s) { let v = Infinity; for (const [a, b, lv] of this.lim) if (s >= a && s <= b) v = Math.min(v, lv); return v; }
  sNear(x, z) { return sNearPts(this.pts, x, z); }
  sWhere(fn, from = 0) { for (let s = from; s < this.total; s += 0.2) if (fn(s)) return s; return this.total; }
}
const straightRoute = () => new Route(1.75, 0).line(4000).done();

