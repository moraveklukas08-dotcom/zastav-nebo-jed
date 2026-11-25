/* ============================== game state ============================== */
const P = { s: 0, v: 0, cruise: 0, mode: 'idle', stopT: 0, target: 0, decel: 0, yaw: 0, shake: 0, pitch: 0, lastV: 0, acc: 0, crashT: 0, wx: 1.75, wz: 0, steer: 0, brakeHeld: false };
const G = { paused: false, list: [], idx: 0, score: 0, lives: 3, streak: 0, log: [], T: 3.0, playing: false, mode: lsGet('zastav-mode') || 'classic', seed: 0 };
const MODE_NAMES = { classic: 'Klasika', endless: 'Nekonečná jízda', daily: 'Denní výzva', free: 'Volná jízda', train: 'Trénink slabin' };
let S = null, replayCar = null, frameNo = 0;
function todayKey() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function dateSeed() { const k = todayKey(); let h = 2166136261; for (const ch of k) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function bestKey(mode) { return mode === 'daily' ? 'zastav-daily-' + todayKey() : 'zastav-best-' + mode; }
const endlessLike = () => G.mode === 'endless' || G.mode === 'free';

function clearScene() {
  if (!S) return;
  scene.remove(S.group);
  S.group.traverse(o => {
    if (o.isInstancedMesh) o.dispose();
    if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of ms) if (!m.userData.shared) { if (m.map && !m.map.userData.shared) m.map.dispose(); m.dispose(); }
  });
  S = null; AU.siren(0, 0); AU.moto(0);
}
function install(sc) {
  BUILD = null; S = sc; scene.add(sc.group);
  if (!sc.route) sc.route = straightRoute();
  S.T = G.T + (G.mode === 'free' ? 0.5 : 0); S.rec = []; P.s = 0; P.v = P.cruise = sc.v; P.lastV = P.v; P.acc = 0; P.mode = 'cruise'; P.shake = 0; P.stopT = 0; P.steer = 0;
  cockpit.visible = true; if (replayCar) replayCar.visible = false; ui.replay(false); ui.decide(false);
  applyEnv(sc.fog);
  renderer.shadowMap.needsUpdate = true;
  ui.place(sc);
}
function loadScene(i) {
  clearScene();
  vrng = G.mode === 'daily' ? mulberry32(G.seed + i * 7919) : Math.random;
  const sc = G.list[i](G.T); vrng = Math.random;
  install(sc); ui.banner(sc, i); ui.stats();
}
function loadAttract() { clearScene(); const sc = pick([scRight, scChild, scRound, scLeft, scTram, scLight, scSnow, scRain])(3); sc.attract = true; install(sc); P.cruise = Math.min(sc.v, 9); P.v = P.cruise; }

function startDecision(ph) {
  S.cur = ph; ph.started = true; ph.t0 = S.time; if (ph.onStart) ph.onStart();
  P.mode = ph.type === 'moving' ? 'decide' : 'decideStand';
  S.timer = S.T; S.nextTick = 0;
  if (G.mode !== 'free') ui.decide(true, S.q || 'Zastavit, nebo jet?');
}
function resolve(choice) {
  const ph = S && S.cur; if (!ph || ph.resolved) return; ph.resolved = true;
  ui.decide(false);
  const timeout = choice === 'timeout', rt = S.time - ph.t0;
  let eff = timeout ? (ph.type === 'moving' ? 'go' : 'stop') : choice;
  if (ph.type === 'standing' && eff === 'slow') eff = 'stop';
  const ans = ph.answer, acc = ph.accept || [];
  let grade;
  if (eff === ans || acc.includes(eff)) grade = 'ok';
  else if (eff === 'slow' && ans === 'go') grade = 'cautious';
  else if (eff === 'stop' && ans === 'slow') grade = 'harsh';
  else if (eff === 'stop') grade = 'wrongStop';
  else grade = 'wrongGo';
  const correct = grade === 'ok' || grade === 'cautious';
  const entry = { title: S.title, place: S.place, cat: S.cat, step: ph !== S.phases[0] ? 'pokračování' : '', answer: ans, choice: timeout ? 'nic' : choice, correct, rt: timeout ? null : rt, note: correct ? ph.ok : ph.bad, pts: 0, timeout, grade };
  if (correct && !timeout) {
    G.streak = grade === 'ok' ? G.streak + 1 : 0;
    const base = (100 + 100 * Math.max(0, 1 - rt / S.T)) * (1 + Math.min(Math.max(G.streak - 1, 0), 10) * 0.1);
    entry.pts = Math.round(grade === 'ok' ? base : base * 0.5); G.score += entry.pts;
    if (grade === 'ok') { ui.toast('Správně', ph.ok, 'good', entry.pts); AU.good(); }
    else { ui.toast('Opatrně', 'Zpomalit nebylo nutné, ale neuškodilo. ' + ph.ok, 'warn', entry.pts); AU.meh(); }
  } else if (correct) { G.streak = 0; ui.toast('Na poslední chvíli', ph.ok + ' Rozhoduj se rychleji, váhání stojí body.', 'warn'); AU.bad(); }
  else {
    G.streak = 0;
    if (grade === 'wrongStop') { ui.toast('Zbytečně', ph.bad, 'warn'); AU.bad(); }
    if (grade === 'harsh') { ui.toast('Moc prudce', 'Stačilo zpomalit. ' + ph.ok, 'warn'); AU.bad(); }
  }
  G.log.push(entry); ui.stats();
  if (!S.attract) recordStat(S.cat, correct, timeout ? null : rt);
  const slowV = ph.slowTo ? ph.slowTo / 3.6 : Math.max(3, P.v * 0.45);
  if (grade === 'ok' || grade === 'cautious' || grade === 'wrongStop' || grade === 'harsh') {
    if (eff === 'go') { S.pi++; S.cur = null; P.mode = 'cruise'; return; }
    ph.stopCorrect = grade === 'ok';
    if (ph.type === 'moving') beginBrake(ph, eff === 'slow' || (eff === 'stop' && ph.slowTo && ans !== 'stop' && !ph.endAfterStop) ? slowV : 0);
    else { P.mode = 'stopped'; P.stopT = 0; }
    return;
  }
  if (eff === 'slow') P.cruise = slowV;
  if (ph.hazard || ph.crashCheck) {
    const ok = retime(ph);
    if (ok) { S.pending = ph; S.cur = null; P.mode = 'cruise'; }
    else violation(ph, 'Přestupek!');
  } else violation(ph, 'Přestupek!');
}
function speedTarget(s, v) { const r = S.route; let t = P.cruise; const look = v * v / (2 * BRK) + 3; for (let k = 0; k <= 5; k++) t = Math.min(t, r.vlim(s + look * k / 5)); return t; }
function predictT(sT) { let s = P.s, v = P.v, t = 0; const dt = 0.05; while (s < sT && t < 25) { const tg = speedTarget(s, v); v = v < tg ? Math.min(tg, v + ACC * dt) : Math.max(tg, v - BRK * dt); s += Math.max(v, 0.3) * dt; t += dt; } return t; }
function retime(ph) {
  const a = ph.hazard; if (!a || ph.static) return true;
  return a.meet(predictT(ph.crashS - (ph.kind === 'vulnerable' ? 4 : 0)));
}
function beginBrake(ph, target) {
  P.mode = 'brake'; P.target = target;
  if (target > 0) P.decel = 5.5;
  else { const d = Math.max(0.8, ph.stopS - P.s); P.decel = Math.min(14 * (S.mu || 1), P.v * P.v / (2 * d)); }
  if (P.decel > 6.5) AU.screech();
}
function canResume(ph) {
  if (!ph.stopCorrect) return P.stopT > 1.1;
  if (ph.canResume) return ph.canResume();
  if (ph.hazard) return ph.hazard.s > ph.hazard.conflictS + (ph.clear || 7);
  return P.stopT > 1.0;
}
function loseLife() { G.lives = Math.max(0, G.lives - 1); ui.stats(); if (navigator.vibrate) try { navigator.vibrate(180); } catch (e) {} }
function markMistake(ph) { const r = S.route.at(P.s); S.mistake = { ph, t: S.time, x: r.x, z: r.z, dx: r.dx, dz: r.dz }; }
function crash(ph) {
  S.pending = null; P.mode = 'crash'; P.crashT = 0; P.shake = reduceMotion ? 0.2 : 1; markMistake(ph);
  ui.flash('on'); AU.crash();
  if (ph.hazard) { const a = ph.hazard; a.frozen = true; a.obj.rotation.y += (Math.random() < 0.5 ? -1 : 1) * 0.28; }
  loseLife(); ui.toast(ph.crashTitle || 'Nehoda!', ph.bad, 'bad'); AU.siren(0, 0); AU.moto(0);
  if (G.log.length) G.log[G.log.length - 1].crash = true;
}
function nearMiss(ph) {
  S.pending = null; P.mode = 'nearmiss'; P.crashT = 0; markMistake(ph);
  const d = Math.max(1, (ph.crashS - 0.4) - P.s); P.decel = P.v * P.v / (2 * d);
  AU.screech(); P.shake = reduceMotion ? 0.1 : 0.35; ui.flash('warn');
  if (ph.hazard) { ph.hazard.v = ph.hazard.tv = Math.max(ph.hazard.v, 1.2); }
  loseLife(); ui.toast('O vlas!', ph.bad, 'bad');
}
function violation(ph, title) { if (ph.hazard && !ph.static && !ph.hazard.frozen) { const h = ph.hazard; if (h.s < h.conflictS) h.holdUntil = (ph.crashS || P.s) + 14; } S.pending = null; markMistake(ph); S.replayAt = S.time + 1.6; loseLife(); ui.toast(title, ph.bad, 'bad'); AU.bad(); S.pi = S.phases.length; S.cur = null; P.mode = 'cruise'; }
function nextScenario() { const recent = G.list.slice(-5); let f, n = 0; do { f = pick(SCENARIOS); n++; } while (recent.includes(f) && n < 50); return f; }
function endScene() {
  if (!S || S.ending) return; S.ending = true; ui.decide(false); ui.replay(false);
  ui.fade(true, () => {
    G.idx++;
    if (endlessLike()) { G.T = Math.max(G.mode === 'free' ? 2.2 : 1.4, 3.1 - 0.08 * G.idx); if (G.lives > 0 && G.idx >= G.list.length) G.list.push(nextScenario()); }
    else G.T = Math.max(1.7, 3.1 - 0.12 * G.idx);
    if (G.lives <= 0 || G.idx >= G.list.length) gameOver(); else loadScene(G.idx);
    ui.fade(false);
  });
}
function startGame(mode) {
  AU.init();
  G.mode = mode || G.mode; lsSet('zastav-mode', G.mode);
  G.seed = dateSeed();
  if (G.mode === 'daily') { const r = mulberry32(G.seed); const a = SCENARIOS.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } G.list = a.slice(0, 10); }
  else if (G.mode === 'train') G.list = trainList();
  else if (endlessLike()) G.list = [nextScenario()];
  else G.list = shuffle(SCENARIOS.slice()).slice(0, 12);
  G.idx = 0; G.score = 0; G.lives = 3; G.streak = 0; G.log = []; G.T = G.mode === 'free' ? 3.1 : 3.0; G.playing = true;
  for (const id of ['menu', 'over', 'statsScreen']) $(id).hidden = true; $('hud').hidden = false; $('toast').hidden = true;
  $('pedals').hidden = G.mode !== 'free';
  ui.fade(true, () => { loadScene(0); ui.fade(false); });
}
function gameOver() {
  G.playing = false; $('hud').hidden = true; P.brakeHeld = false;
  const total = G.log.length, ok = G.log.filter(e => e.correct).length;
  const rts = G.log.filter(e => e.correct && e.rt != null).map(e => e.rt);
  const acc = total ? ok / total : 0;
  $('ovEyebrow').textContent = MODE_NAMES[G.mode] + ' · ' + (G.lives <= 0 ? (endlessLike() ? 'ujeto ' + G.idx + ' situací' : 'došly životy') : 'všech ' + G.list.length + ' situací');
  $('ovTitle').textContent = endlessLike() ? (G.idx >= 25 ? 'Legenda silnic' : G.idx >= 15 ? 'Ostřílený řidič' : G.idx >= 8 ? 'Dobrý řidič' : 'Ještě trénuj') : G.lives <= 0 ? 'Zpátky do autoškoly' : acc >= 0.9 ? 'Rozený řidič' : acc >= 0.7 ? 'Dobrý řidič' : acc >= 0.5 ? 'Ještě trénuj' : 'Zpátky do autoškoly';
  $('ovScore').textContent = G.score;
  $('ovAcc').textContent = ok + '/' + total;
  $('ovRt').textContent = rts.length ? (rts.reduce((a, b) => a + b, 0) / rts.length).toFixed(2).replace('.', ',') + ' s' : '–';
  const bad = {}; for (const e of G.log) if (!e.correct) bad[e.cat] = (bad[e.cat] || 0) + 1;
  const worst = Object.entries(bad).sort((a, b) => b[1] - a[1])[0];
  $('ovWeak').textContent = worst ? 'Nejvíc chyb: ' + worst[0] + ' (' + worst[1] + '×). Zkus Trénink slabin.' : 'Bez jediné chyby. Výborně!';
  const L = $('log'); L.innerHTML = '';
  const word = c => c === 'stop' ? 'stop' : c === 'go' ? 'jeď' : c === 'slow' ? 'zpomal' : 'nic';
  for (const e of G.log) {
    const li = document.createElement('li');
    const ic = document.createElement('div'); ic.className = 'ic' + (e.correct ? (e.timeout || e.grade === 'cautious' ? ' w' : '') : (e.grade === 'wrongStop' || e.grade === 'harsh' ? ' w' : ' x')); ic.textContent = e.correct ? '✓' : '✕';
    const mid = document.createElement('div');
    const h = document.createElement('h3'); h.textContent = e.title + (e.step ? ' · ' + e.step : '') + ' – ' + e.place;
    const p = document.createElement('p'); p.textContent = 'Tvoje volba: ' + word(e.choice) + ', správně: ' + word(e.answer) + '. ' + e.note;
    mid.append(h, p);
    const rt = document.createElement('div'); rt.className = 'rt'; rt.textContent = e.rt != null ? e.rt.toFixed(2).replace('.', ',') + ' s' : '';
    li.append(ic, mid, rt); L.append(li);
  }
  const bk = bestKey(G.mode), best = +(lsGet(bk) || 0); if (G.score > best) lsSet(bk, String(G.score));
  $('ovTrain').hidden = !weakCats().length;
  $('over').hidden = false; $('over').scrollTop = 0;
  loadAttract();
}

