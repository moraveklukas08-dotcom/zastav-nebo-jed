/* ============================== per-frame ============================== */
function followSpeed(dt) { const tg = speedTarget(P.s, P.v); P.v = P.v < tg ? Math.min(tg, P.v + ACC * dt) : Math.max(tg, P.v - BRK * dt); }
function playerLogic(dt) {
  const ph = S.cur;
  switch (P.mode) {
    case 'cruise': {
      if (G.mode === 'free' && P.brakeHeld && !S.pending) P.v = Math.max(0, P.v - 5 * dt); else followSpeed(dt);
      const nx = S.phases[S.pi];
      if (nx && !nx.started && nx.type === 'moving' && P.s >= nx.triggerS) startDecision(nx);
      if (S.pending) {
        const pp = S.pending;
        const hit = pp.crashCheck ? pp.crashCheck() : pp.kind === 'vulnerable' ? P.s >= pp.crashS - 7 : P.s >= pp.crashS;
        if (hit) { if (pp.kind === 'vulnerable') { if (pp.crashCheck) pp.crashS = P.s + 6.4; nearMiss(pp); } else crash(pp); }
        else if (pp.fallbackS && P.s > pp.fallbackS) violation(pp, 'Riskantní jízda');
        else if (!pp.crashCheck && P.s > pp.crashS + 15) violation(pp, 'Přestupek!');
      }
      if (S.replayAt && S.time >= S.replayAt) { S.replayAt = null; startReplay(); break; }
      if (!S.ending && P.mode === 'cruise' && !S.pending && !S.replayAt && P.s >= S.endS) endScene();
      break;
    }
    case 'decide': followSpeed(dt); // falls through
    case 'decideStand': {
      if (P.mode === 'decideStand') P.v = 0;
      S.timer -= dt;
      if (G.mode !== 'free') { const el = S.T - S.timer; if (el >= S.nextTick) { AU.tick(S.timer < 1); S.nextTick += S.timer < 1 ? 0.25 : 0.5; } }
      if (S.timer <= 0) resolve('timeout');
      break;
    }
    case 'brake': {
      P.v = Math.max(P.target, P.v - P.decel * dt);
      if (P.target === 0 && P.s + P.v * dt >= ph.stopS) { P.s = Math.max(P.s, Math.min(P.s + P.v * dt, ph.stopS)); P.v = 0; }
      if (P.v <= P.target + 1e-3) { P.v = P.target; P.mode = P.target > 0 ? 'slowed' : 'stopped'; P.stopT = 0; }
      break;
    }
    case 'stopped': case 'slowed': {
      P.stopT += dt;
      if (ph.endAfterStop && (ph.stopCorrect || ph.answer === 'slow')) { if (P.stopT > 2.4) endScene(); break; }
      if (P.stopT > 0.5 && canResume(ph)) {
        if (ph.onResume) ph.onResume();
        S.pi++; S.cur = null; const nx = S.phases[S.pi];
        if (nx && nx.type === 'standing' && P.mode === 'stopped' && ph.stopCorrect) { if (nx.onPrep) nx.onPrep(); P.mode = 'waitStand'; S.wait = 0.7; }
        else { if (nx && nx.type === 'standing') S.pi = S.phases.length; P.mode = 'cruise'; }
      }
      break;
    }
    case 'waitStand': S.wait -= dt; if (S.wait <= 0) startDecision(S.phases[S.pi]); break;
    case 'crash': P.v = Math.max(0, P.v - 28 * dt); P.crashT += dt; if (P.crashT > 1.8) startReplay(); break;
    case 'nearmiss': P.v = Math.max(0, P.v - P.decel * dt); P.crashT += dt; if (P.v === 0 && P.crashT > 1.9) startReplay(); break;
  }
  P.s += P.v * dt;
}
function update(dt) {
  if (!S) return;
  if (P.mode === 'replay') { replayStep(dt); return; }
  S.time += dt; const t = S.time;
  if (S.events.length) { const due = S.events.filter(e => t >= e.t); if (due.length) { S.events = S.events.filter(e => t < e.t); due.sort((a, b) => a.t - b.t).forEach(e => e.fn()); } }
  for (const a of S.actors) { if (a.releaseAt != null && P.s > a.releaseAt) { a.release(a.releaseV); a.releaseAt = null; } a.update(dt, t); }
  for (const o of S.tickers) o.userData.tick && o.userData.tick(t);
  if (S.update) S.update(dt, t);
  if (S.siren) { const p = S.siren.pos; const d = Math.hypot(p.x - P.wx, p.z - P.wz); AU.siren(S.siren.frozen ? 0 : Math.max(0, Math.min(1, 45 / (d + 12))), t); }
  if (S.attract) { followSpeed(dt); P.s += P.v * dt; if (P.s > S.endS) loadAttract(); return; }
  playerLogic(dt);
  if (S && P.mode !== 'replay') { const a = new Array(S.actors.length * 2); S.actors.forEach((x, k) => { a[k * 2] = x.s; a[k * 2 + 1] = x.started ? 1 : 0; }); S.rec.push({ t, s: P.s, a }); while (S.rec.length && S.rec[0].t < t - 8) S.rec.shift(); }
  if (!S) return;
  const blinkOn = S.nav && S.navS != null && P.s > S.navS - 45 && P.s < S.navS + 14;
  const bl = blinkOn && Math.floor(t * 2.7) % 2 === 0;
  if (blinkOn && bl !== S.blState) { S.blState = bl; if (G.playing) AU.blinker(bl); }
  const dir = S.nav ? (S.nav.arrow === '→' ? 'R' : 'L') : null;
  CK.indL.material.color.setHex(bl && dir === 'L' ? 0x2cff4a : 0x163a1a); CK.indR.material.color.setHex(bl && dir === 'R' ? 0x2cff4a : 0x163a1a);
  $('nav').classList.toggle('blink', !!blinkOn);
  AU.ambTick(dt);
}
const keys = { left: false, right: false };
let dragYaw = 0;
function updateCamera(dt) {
  const r = S.route;
  if (P.mode === 'replay') {
    carRig.position.set(0, 0, 0); carRig.rotation.set(0, 0, 0);
    const m = S.mistake, fx = m.dx, fz = m.dz, k = S.replay ? Math.min(1, (S.replay.t - S.replay.frames[0].t) / 3) : 0;
    camera.position.set(m.x - fx * 15 + fz * (6 - k * 6), 21 - k * 3, m.z - fz * 15 - fx * (6 - k * 6));
    camera.lookAt(m.x + fx * 4, 0, m.z + fz * 4);
    dome.position.copy(camera.position); hills.position.set(camera.position.x, 0, camera.position.z);
    sun.position.set(camera.position.x + 55, 60, camera.position.z + 38); sun.target.position.set(m.x, 0, m.z); sun.target.updateMatrixWorld();
    camera.updateMatrixWorld(true); camera.getWorldPosition(CAMW); camera.getWorldQuaternion(CAMQ);
    return;
  }
  const p = r.at(P.s), a = r.at(Math.max(0, P.s - 0.5)), b = r.at(P.s + 3);
  let dx = b.x - a.x, dz = b.z - a.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
  const heading = Math.atan2(-dx, -dz);
  const yt = THREE.MathUtils.clamp((keys.left ? 1.15 : 0) - (keys.right ? 1.15 : 0) + dragYaw, -1.3, 1.3);
  P.yaw += (yt - P.yaw) * Math.min(1, dt * 5);
  const ac = (P.v - P.lastV) / Math.max(dt, 1e-3); P.lastV = P.v; P.acc += (ac - P.acc) * Math.min(1, dt * 6);
  const pt = THREE.MathUtils.clamp(P.acc * 0.0045, -0.05, 0.02); P.pitch += (pt - P.pitch) * Math.min(1, dt * 5);
  let sx = 0, sy = 0; if (P.shake > 0) { sx = (Math.random() - 0.5) * 0.22 * P.shake; sy = (Math.random() - 0.5) * 0.18 * P.shake; P.shake = Math.max(0, P.shake - dt * 1.1); }
  const bob = Math.sin((S ? S.time : 0) * 9) * 0.004 * Math.min(1, P.v / 10);
  P.wx = p.x; P.wz = p.z;
  carRig.position.set(p.x + p.dz * 0.38 + sx, 1.24 + bob + sy, p.z - p.dx * 0.38);
  carRig.rotation.set(P.pitch, heading, sx * 0.25);
  camera.position.set(-Math.sin(P.yaw) * 0.06, 0, -Math.abs(Math.sin(P.yaw)) * 0.05);
  camera.rotation.set(-0.015 - Math.abs(P.yaw) * 0.03, P.yaw, 0);
  camera.updateMatrixWorld(true); camera.getWorldPosition(CAMW); camera.getWorldQuaternion(CAMQ);
  const d1 = r.at(P.s + 1.5), d2 = r.at(P.s + 7); const turn = Math.atan2(d1.dx * d2.dz - d1.dz * d2.dx, d1.dx * d2.dx + d1.dz * d2.dz);
  P.steer += (THREE.MathUtils.clamp(-turn * 3.2, -2.4, 2.4) - P.steer) * Math.min(1, dt * 4); CK.wheel.rotation.z = P.steer;
  CK.speed.rotation.z = (135 - Math.min(200, P.v * 3.6) / 200 * 270) * DEG - Math.PI / 2;
  CK.rpm.rotation.z = (135 - Math.min(7000, AU.rpm || 850) / 7000 * 270) * DEG - Math.PI / 2;
  mirrorCam.position.set(p.x, 1.35, p.z); mirrorCam.rotation.set(-0.03, heading + Math.PI, 0);
  if (WX.sunset) { sun.position.copy(CAMW).addScaledVector(SUN_DIR, 140); sun.target.position.set(CAMW.x + dx * 30, 0, CAMW.z + dz * 30); }
  else { sun.position.set(CAMW.x + 55, 50, CAMW.z + 38); sun.target.position.set(CAMW.x + dx * 30, 0, CAMW.z + dz * 30); }
  sun.target.updateMatrixWorld();
  dome.position.copy(CAMW); hills.position.set(CAMW.x, 0, CAMW.z);
}

