/* ============================== actors ============================== */
class Actor {
  constructor(obj, pts, o = {}) {
    this.obj = obj; this.seg = []; let tot = 0;
    for (let i = 0; i < pts.length - 1; i++) { const dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1], l = Math.hypot(dx, dz); if (l < 1e-6) continue; this.seg.push({ x: pts[i][0], z: pts[i][1], dx: dx / l, dz: dz / l, l, s0: tot }); tot += l; }
    this.pts = pts; this.total = tot; this.s = o.s0 || 0; this.v = o.v || 0; this.v0 = o.v || o.tv || 0; this.tv = o.tv ?? this.v;
    this.acc = o.acc || 3; this.dec = o.dec || 6; this.stopAt = o.stopAt ?? null; this.delay = o.delay || 0;
    this.conflictS = o.conflictS ?? 0; this.y = o.y || 0; this.maxV = o.maxV || 45; this.onUpdate = o.onUpdate || null;
    this.started = this.delay <= 0; this.braking = false; this.frozen = false; this.h = null; this.releaseAt = o.releaseAt ?? null; this.releaseV = o.releaseV || 9;
    this.place(0);
  }
  at(s) { s = Math.max(0, Math.min(this.total, s)); let lo = 0, hi = this.seg.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (this.seg[m].s0 <= s) lo = m; else hi = m - 1; } const q = this.seg[lo]; const u = s - q.s0; return { x: q.x + q.dx * u, z: q.z + q.dz * u, dx: q.dx, dz: q.dz }; }
  get pos() { return this.at(this.s); }
  approach(dt) { if (this.v < this.tv) { this.v = Math.min(this.tv, this.v + this.acc * dt); return false; } if (this.v > this.tv) { this.v = Math.max(this.tv, this.v - this.dec * dt); return true; } return false; }
  update(dt, t) {
    if (this.frozen) return;
    if (this.holdUntil != null) { if (P.s > this.holdUntil) this.holdUntil = null; else { this.v = 0; this.place(dt); return; } }
    if (!this.started) { if (t >= this.delay) this.started = true; else { this.place(dt); return; } }
    if (this.leader && !this.leader.frozen) { const gap = this.leader.s - this.s - 7; this.tv = gap < 14 ? Math.max(0, Math.min(this.v0 || 12, this.leader.v + (gap - 5) * 0.9)) : (this.v0 || this.tv); this.dec = Math.max(this.dec, 8); }
    let braking = false;
    if (this.stopAt != null) {
      const d = this.stopAt - this.s;
      if (d <= 0.05) { this.v = 0; braking = true; }
      else { const need = this.v * this.v / (2 * d); if (need > 2.2 || this.braking) { this.braking = braking = true; this.v = Math.max(Math.min(this.v, 0.5), this.v - need * 1.05 * dt); if (d < 0.3) this.v = Math.min(this.v, 0.3); } else this.approach(dt); }
    } else braking = this.approach(dt);
    this.s += this.v * dt;
    if (this.stopAt != null && this.s > this.stopAt) this.s = this.stopAt;
    if (this.s >= this.total) { this.s = this.total; this.v = 0; }
    if (this.onUpdate) this.onUpdate(this, dt, t);
    if (this.obj.userData.setBrake) this.obj.userData.setBrake(braking || this.v < 0.05);
    this.place(dt);
  }
  release(v) { this.stopAt = null; this.braking = false; if (v != null) this.tv = v; }
  activate(tA, v) { this.v = this.tv = v ?? this.v0; this.s = tA != null ? Math.max(0, this.conflictS - this.v * tA) : 0; this.started = true; this.delay = 0; this.place(0); }
  meet(tp) {
    this.started = true; this.delay = 0; this.stopAt = null; this.braking = false;
    const rem = this.conflictS - this.s;
    if (rem <= 0.3) return false;
    if (tp > 0.05) { const nv = rem / tp; if (nv > this.maxV) return false; this.v = this.tv = nv; this.acc = this.dec = 80; }
    return true;
  }
  place(dt) {
    const p = this.at(this.s);
    this.obj.visible = this.started;
    this.obj.position.set(p.x, this.y, p.z);
    const target = Math.atan2(-p.dx, -p.dz);
    if (this.h == null || !dt) this.h = target; else { let d = target - this.h; d = Math.atan2(Math.sin(d), Math.cos(d)); this.h += d * Math.min(1, dt * 6); }
    this.obj.rotation.y = this.h + (this.yawOff || 0);
    if (this.obj.userData.anim) this.obj.userData.anim(this.v, dt || 0);
  }
}
function sNearPts(pts, x, z) {
  let best = 1e18, bs = 0, acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, l = Math.sqrt(l2); if (l < 1e-9) continue;
    const u = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)); const px = ax + dx * u, pz = az + dz * u; const d = (px - x) ** 2 + (pz - z) ** 2;
    if (d < best) { best = d; bs = acc + u * l; } acc += l;
  }
  return bs;
}
function smoothPts(list, step = 0.5) { const c = new THREE.CatmullRomCurve3(list.map(p => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal'); const n = Math.max(2, Math.ceil(c.getLength() / step)); return c.getSpacedPoints(n).map(v => [v.x, v.z]); }

