/* ============================== UI ============================== */
const ui = {
  decide(show, label) { $('decide').hidden = !show; if (show) { $('q').textContent = label; $('bar').style.transform = 'scaleX(1)'; } },
  toast(title, text, kind, pts) {
    const t = $('toast'); t.className = kind; $('tTitle').textContent = title; $('tPts').textContent = pts ? '+' + pts : '';
    $('tBadge').textContent = kind === 'good' ? '✓' : kind === 'warn' ? '!' : '✕'; $('tText').textContent = text;
    t.hidden = true; void t.offsetWidth; t.hidden = false; clearTimeout(ui._tt); ui._tt = setTimeout(() => { t.hidden = true; }, kind === 'good' ? 3200 : 5200);
  },
  stats() { $('score').textContent = G.score; $('prog').textContent = endlessLike() ? String(G.idx + 1) : Math.min(G.idx + 1, G.list.length) + '/' + G.list.length; $('lives').textContent = '♥'.repeat(G.lives) + '♡'.repeat(3 - G.lives); $('streak').textContent = G.streak > 1 ? 'série ×' + G.streak : ''; },
  place(sc) {
    $('placeName').textContent = sc.place; $('placeEnv').textContent = sc.env; const l = $('limitSign'); if (sc.kmh >= 110) { l.className = 'limit hwy'; l.textContent = 'D'; } else { l.className = 'limit'; l.textContent = sc.kmh; }
    $('nav').hidden = !sc.nav; if (sc.nav) { $('navText').textContent = sc.nav.text; $('navArrow').textContent = sc.nav.arrow; }
  },
  banner(sc, i) { const b = $('banner'); $('bnNum').textContent = (G.mode === 'classic' ? '' : MODE_NAMES[G.mode] + ' · ') + 'Situace ' + (i + 1) + (endlessLike() ? '' : ' / ' + G.list.length); $('bnTitle').textContent = sc.title; $('bnPlace').textContent = sc.place + ' · ' + sc.kmh + ' km/h'; b.hidden = true; void b.offsetWidth; b.hidden = false; clearTimeout(ui._bt); ui._bt = setTimeout(() => { b.hidden = true; }, 2650); },
  flash(kind) { const f = $('flash'); f.className = ''; void f.offsetWidth; f.className = kind === 'warn' ? 'on warn' : 'on'; },
  fade(out, cb) { const f = $('fade'); f.style.opacity = out ? '1' : '0'; if (cb) setTimeout(cb, 400); },
  replay(show, ph) { $('replay').hidden = !show; $('speedo').hidden = show; $('pedals').hidden = show || G.mode !== 'free'; if (show) { $('rpText').textContent = ph.bad; $('toast').hidden = true; } },
  menu() {
    document.querySelectorAll('.mode').forEach(b => { const m = b.dataset.mode; b.setAttribute('aria-pressed', String(m === G.mode)); const best = +(lsGet(bestKey(m)) || 0); b.querySelector('.mbest').textContent = best ? (m === 'daily' ? 'Dnes: ' : 'Rekord: ') + best + ' b.' : ''; if (m === 'train') b.disabled = !weakCats().length; });
    if (G.mode === 'train' && !weakCats().length) { G.mode = 'classic'; ui.menu(); }
    document.querySelectorAll('#qual button, #qualPause button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.q === Q.name)));
  },
  statsScreen() {
    const st = loadStats(), rows = Object.entries(st).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n), L = $('stList'); L.innerHTML = '';
    const tot = rows.reduce((a, [, c]) => a + c.n, 0), okc = rows.reduce((a, [, c]) => a + c.ok, 0);
    $('stSummary').textContent = tot ? `Celkem ${tot} rozhodnutí, správně ${Math.round(okc / tot * 100)} %. Nahoře jsou oblasti, které ti jdou nejhůř.` : 'Zatím žádná data. Odjeď pár situací a tady uvidíš, co ti jde a co ne.';
    for (const [k, c] of rows) { const pc = Math.round(c.ok / c.n * 100); const li = document.createElement('li'); const col = pc >= 80 ? '#2fbf6c' : pc >= 55 ? '#f5c400' : '#d42a20'; li.innerHTML = `<span class="nm"></span><span class="pc">${pc} %</span><span class="bar"><i style="width:${pc}%;background:${col}"></i></span><span class="meta"></span>`; li.querySelector('.nm').textContent = k; li.querySelector('.meta').textContent = `${c.ok} z ${c.n} správně` + (c.rtn ? ` · průměrná reakce ${(c.rt / c.rtn).toFixed(2).replace('.', ',')} s` : ''); L.append(li); }
    $('stTrain').hidden = !weakCats().length;
  },
};
function frameHud() {
  $('kmh').textContent = Math.round(P.v * 3.6);
  if (S && (P.mode === 'decide' || P.mode === 'decideStand') && G.mode !== 'free') { const k = Math.max(0, S.timer / S.T); const b = $('bar'); b.style.transform = 'scaleX(' + k + ')'; b.classList.toggle('hot', S.timer < 1); }
}
function applyQuality(name) {
  Q = QL[name] || QL.high; lsSet('zastav-q', Q.name);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.pr));
  renderer.shadowMap.enabled = Q.shadows; sun.castShadow = Q.shadows;
  if (sun.shadow.mapSize.x !== Q.shadowSize) { sun.shadow.mapSize.set(Q.shadowSize, Q.shadowSize); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  scene.traverse(o => { const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; ms.forEach(m => m.needsUpdate = true); });
  for (const k in CACHE) if (CACHE[k] && CACHE[k].isMaterial) CACHE[k].needsUpdate = true;
  CK.mirror.visible = Q.mirror > 0;
  resize(); ui.menu();
}

function pauseGame() {
  if (!G.playing || G.paused) return;
  G.paused = true; P.brakeHeld = false; $('pause').hidden = false; $('pauseMode').textContent = MODE_NAMES[G.mode] + ' · situace ' + (G.idx + 1);
  ui.menu(); if (AU.ctx) AU.ctx.suspend();
}
function resumeGame() { if (!G.paused) return; G.paused = false; $('pause').hidden = true; last = performance.now(); if (AU.ctx) AU.ctx.resume(); }
function quitToMenu() {
  G.paused = false; G.playing = false; P.brakeHeld = false; if (AU.ctx) AU.ctx.resume();
  for (const id of ['pause', 'hud', 'over', 'statsScreen']) $(id).hidden = true; $('toast').hidden = true; ui.decide(false); ui.replay(false);
  $('menu').hidden = false; ui.menu(); loadAttract();
}
function inDecision() { return G.playing && S && (P.mode === 'decide' || P.mode === 'decideStand'); }
function choose(c) {
  if (G.paused) return;
  if (P.mode === 'replay') { finishReplay(); return; }
  if (!inDecision()) return;
  if (G.mode === 'free') { if (c === 'stop' || c === 'slow') c = S.cur.answer === 'slow' ? 'slow' : 'stop'; }
  resolve(c);
}
const press = (id, c) => { const el = $(id); el.addEventListener('pointerdown', e => { e.preventDefault(); choose(c); }); el.addEventListener('click', e => { if (e.detail === 0) choose(c); }); };
press('bStop', 'stop'); press('bSlow', 'slow'); press('bGo', 'go');
const pb = $('pBrake');
pb.addEventListener('pointerdown', e => { e.preventDefault(); P.brakeHeld = true; pb.classList.add('on'); choose('stop'); });
const relBrake = () => { P.brakeHeld = false; pb.classList.remove('on'); };
pb.addEventListener('pointerup', relBrake); pb.addEventListener('pointercancel', relBrake); pb.addEventListener('pointerleave', relBrake);
$('pGas').addEventListener('pointerdown', e => { e.preventDefault(); choose('go'); });
$('rpSkip').addEventListener('click', () => finishReplay());
$('start').addEventListener('click', () => startGame(G.mode));
$('again').addEventListener('click', () => startGame(G.mode));
$('toMenu').addEventListener('click', () => { $('over').hidden = true; $('menu').hidden = false; ui.menu(); });
$('ovTrain').addEventListener('click', () => startGame('train'));
$('openStats').addEventListener('click', () => { ui.statsScreen(); $('menu').hidden = true; $('statsScreen').hidden = false; });
$('stBack').addEventListener('click', () => { $('statsScreen').hidden = true; $('menu').hidden = false; ui.menu(); });
$('stTrain').addEventListener('click', () => startGame('train'));
let resetArm = 0;
$('stReset').addEventListener('click', () => { const b = $('stReset'); if (Date.now() - resetArm < 3000) { lsSet('zastav-stats', '{}'); ui.statsScreen(); b.textContent = 'Smazáno'; resetArm = 0; } else { resetArm = Date.now(); b.textContent = 'Opravdu smazat?'; setTimeout(() => { b.textContent = 'Smazat statistiky'; }, 3000); } });
document.querySelectorAll('.mode').forEach(b => b.addEventListener('click', () => { if (b.disabled) return; G.mode = b.dataset.mode; lsSet('zastav-mode', G.mode); ui.menu(); }));
document.querySelectorAll('#qual button, #qualPause button').forEach(b => b.addEventListener('click', () => applyQuality(b.dataset.q)));
$('pauseBtn').addEventListener('click', () => pauseGame());
$('resumeBtn').addEventListener('click', () => resumeGame());
$('restartBtn').addEventListener('click', () => { G.paused = false; $('pause').hidden = true; if (AU.ctx) AU.ctx.resume(); startGame(G.mode); });
$('quitBtn').addEventListener('click', () => quitToMenu());
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
$('mute').addEventListener('click', () => { AU.setMuted(!AU.muted); $('mute').textContent = AU.muted ? 'Zvuk: vyp.' : 'Zvuk: zap.'; });
addEventListener('keydown', e => {
  const k = e.key;
  if (k === 'Escape' || k === 'p' || k === 'P') { if (G.paused) resumeGame(); else pauseGame(); e.preventDefault(); return; }
  if (G.paused) { if (k === 'Enter') { e.preventDefault(); resumeGame(); } return; }
  if (e.repeat && (k === ' ' || k === 'Enter')) { if (G.playing) e.preventDefault(); return; }
  if (P.mode === 'replay' && (k === 'Enter' || k === ' ')) { e.preventDefault(); finishReplay(); return; }
  if (k === ' ' || k === 's' || k === 'S' || k === 'ArrowDown' || k === '1') { if (G.playing) { e.preventDefault(); P.brakeHeld = true; pb.classList.add('on'); choose('stop'); } }
  else if (k === 'e' || k === 'E' || k === 'Shift' || k === '2') { if (G.playing) { e.preventDefault(); choose('slow'); } }
  else if (k === 'Enter' || k === 'w' || k === 'W' || k === 'ArrowUp' || k === '3') { if (G.playing) { e.preventDefault(); choose('go'); } else if (!$('menu').hidden && k === 'Enter') startGame(G.mode); }
  else if (k === 'a' || k === 'A' || k === 'ArrowLeft') keys.left = true;
  else if (k === 'd' || k === 'D' || k === 'ArrowRight') keys.right = true;
});
addEventListener('keyup', e => { const k = e.key; if (k === 'a' || k === 'A' || k === 'ArrowLeft') keys.left = false; if (k === 'd' || k === 'D' || k === 'ArrowRight') keys.right = false; if (k === ' ' || k === 's' || k === 'S' || k === 'ArrowDown' || k === '1') relBrake(); });
let drag = null;
canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y0: dragYaw }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { if (!drag) return; dragYaw = THREE.MathUtils.clamp(drag.y0 + (e.clientX - drag.x) / innerWidth * 2.6, -1.3, 1.3); });
const endDrag = () => { drag = null; dragYaw = 0; };
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 0.8 ? 84 : 70; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

let last = performance.now();
const PERF = { t: 0, n: 0, slow: 0, done: false };
function perfWatch(rawDt) {
  if (PERF.done || !G.playing || G.paused || window.__noRender) return;
  PERF.t += rawDt; PERF.n++;
  if (PERF.t < 3) return;
  const fps = PERF.n / PERF.t; PERF.t = 0; PERF.n = 0;
  if (fps < 28 && Q.name !== 'low') { PERF.slow++; if (PERF.slow >= 2) { applyQuality(Q.name === 'high' ? 'medium' : 'low'); ui.toast('Plynulost', 'Hra běžela trhaně, tak jsem snížil kvalitu grafiky. Změnit ji můžeš v pauze.', 'warn'); PERF.slow = 0; if (Q.name === 'low') PERF.done = true; } }
  else PERF.slow = 0;
}
function frame(now) {
  const rawDt = (now - last) / 1000, dt = Math.min(0.05, rawDt); last = now; frameNo++; perfWatch(Math.min(rawDt, 1));
  if (window.__noRender) { requestAnimationFrame(frame); return; }
  if (!G.paused) { update(dt); if (S) { updateCamera(dt); updateWeather(dt, S.time); } }
  AU.engine(P.v, P.mode === 'cruise' && P.v < P.cruise ? 1 : 0.3);
  frameHud();
  renderer.shadowMap.needsUpdate = true;
  renderer.render(scene, camera);
  if (S && Q.mirror && P.mode !== 'replay' && frameNo % Q.mirror === 0) { cockpit.visible = false; WX.rain.visible && (WX.rain.userData.hid = true, WX.rain.visible = false); renderer.setRenderTarget(mirrorRT); renderer.render(scene, mirrorCam); renderer.setRenderTarget(null); cockpit.visible = true; if (WX.rain.userData.hid) { WX.rain.visible = true; WX.rain.userData.hid = false; } }
  requestAnimationFrame(frame);
}
(async () => {
  try { await Promise.race([document.fonts.load('800 40px "Barlow Condensed"'), new Promise(r => setTimeout(r, 1500))]); } catch (e) {}
  CK.mirror.visible = Q.mirror > 0;
  ui.menu();
  loadAttract();
  requestAnimationFrame(t => { last = t; ui.fade(false); frame(t); });
})();
if (import.meta.env.DEV || /[?&]test\b/.test(location.search)) window.__zastav = { THREE, renderer, G, P, get S() { return S; }, SCENARIOS, CATS, choose, startGame, resolve, step: dt => { update(dt); if (S) { updateCamera(dt); updateWeather(dt, S.time); } }, loadSceneFn: fn => { G.list = [fn]; G.idx = 0; G.playing = true; $('menu').hidden = true; $('hud').hidden = false; loadScene(0); } };
