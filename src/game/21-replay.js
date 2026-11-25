/* ============================== replay ============================== */
function ribbon(pts, width, color) {
  if (pts.length < 2) return null;
  const pos = [], idx = [];
  for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; const nx = -dz * width / 2, nz = dx * width / 2; pos.push(pts[i][0] + nx, 0.4, pts[i][1] + nz, pts[i][0] - nx, 0.4, pts[i][1] - nz); if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const grp = new THREE.Group(); const rib = new THREE.Mesh(g, m); rib.renderOrder = 6; grp.add(rib);
  const a = pts[pts.length - 2], b = pts[pts.length - 1]; const cone = new THREE.Mesh(new THREE.ConeGeometry(width * 1.3, width * 2.6, 14).rotateX(-Math.PI / 2), m); cone.position.set(b[0], 0.45, b[1]); cone.rotation.y = Math.atan2(-(b[0] - a[0]), -(b[1] - a[1])); cone.renderOrder = 6; grp.add(cone);
  return grp;
}
function startReplay() {
  if (!S || S.replay || !S.mistake) { endScene(); return; }
  const tEnd = S.mistake.t + 0.5, t0 = tEnd - 3.8;
  const frames = S.rec.filter(f => f.t >= t0 && f.t <= tEnd + 0.6);
  if (frames.length < 8) { endScene(); return; }
  S.replay = { frames, i: 0, t: frames[0].t, tEnd: frames[frames.length - 1].t, hold: 0 };
  const pp = frames.map(f => { const p = S.route.at(f.s); return [p.x, p.z]; });
  const r1 = ribbon(pp, 0.7, 0x2f8cff); if (r1) S.group.add(r1);
  const hz = S.mistake.ph.hazard; if (hz) { const k = S.actors.indexOf(hz); const hp = frames.filter(f => f.a[k * 2 + 1]).map(f => { const p = hz.at(f.a[k * 2]); return [p.x, p.z]; }); const r2 = ribbon(hp, 0.7, 0xff3b30); if (r2) S.group.add(r2); }
  if (!replayCar) { const ob = BUILD; BUILD = null; replayCar = makeCar(0x8c1414, 'hatch'); BUILD = ob; scene.add(replayCar); }
  replayCar.visible = true; cockpit.visible = false; P.mode = 'replay'; AU.siren(0, 0); AU.moto(0);
  ui.replay(true, S.mistake.ph);
}
function replayStep(dt) {
  const R = S.replay; R.t += dt * 0.55;
  while (R.i < R.frames.length - 1 && R.frames[R.i + 1].t <= R.t) R.i++;
  const f = R.frames[R.i]; P.s = f.s; P.v = 0;
  S.actors.forEach((a, k) => { a.s = f.a[k * 2]; a.started = !!f.a[k * 2 + 1]; a.place(dt); });
  const p = S.route.at(P.s); replayCar.position.set(p.x, 0, p.z); replayCar.rotation.y = Math.atan2(-p.dx, -p.dz);
  if (R.t >= R.tEnd) { R.hold += dt; if (R.hold > 1.6) finishReplay(); }
}
function finishReplay() { if (!S || !S.replay || S.replayDone) return; S.replayDone = true; endScene(); }

