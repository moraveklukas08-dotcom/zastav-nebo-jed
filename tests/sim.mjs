// Automatický test všech situací: každou projede s volbami stop / jeď / zpomal /
// bez reakce / pozdě / správně a hlídá pády, zaseknutí, protínání aut a
// nehody bez překážky. Spuštění: npm test  (REPS=počet opakování, ONLY=0,5,7)
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
let FAILS = 0;
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
function serve(dir) {
  return new Promise(res => {
    const s = http.createServer((q, r) => { const f = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
    s.listen(0, () => res({ url: 'http://127.0.0.1:' + s.address().port, close: () => s.close() }));
  });
}
(async () => {
  const srv = await serve('dist'); const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 640, height: 400 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack||'').slice(0,300)));
  p.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_FAILED')) errs.push('console: ' + m.text()); });
  await p.route('**/*', r => r.request().url().startsWith(srv.url) ? r.continue() : r.abort());
  await p.addInitScript(() => { try { localStorage.setItem('zastav-q', 'low'); } catch (e) {} }); for (let k = 0; k < 3; k++) { try { await p.goto(srv.url + '/index.html', { timeout: 90000 }); break; } catch (e) { console.log('RETRY goto'); } } await p.waitForFunction(() => window.__zastav && window.__zastav.S, null, { timeout: 90000 }); await p.waitForTimeout(500); await p.evaluate(() => { window.__noRender = true; });
  const REPS = +(process.env.REPS || 5);
  const NS = await p.evaluate(() => window.__zastav.SCENARIOS.length); const ONLYL = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : [...Array(NS).keys()];
  for (const SI of ONLYL) {
  const res = await p.evaluate(async ([REPS, ONLY]) => {
    if (!window.__stOrig) { window.__stOrig = window.setTimeout; window.setTimeout = (fn, d, ...a) => d === 400 ? 0 : window.__stOrig(fn, d, ...a); }
    const Zs = window.__zastav, THREE = Zs.THREE; const out = { runs: 0, problems: [], stats: {} };
    const bx = new THREE.Box3(), by = new THREE.Box3();
    const isVeh = a => !!a.obj.userData.setBrake;
    function playerBox() { const S = Zs.S, r = S.route.at(Zs.P.s); const hx = Math.abs(r.dx) * 2.2 + Math.abs(r.dz) * 0.9, hz = Math.abs(r.dz) * 2.2 + Math.abs(r.dx) * 0.9; return new THREE.Box3(new THREE.Vector3(r.x - hx, 0, r.z - hz), new THREE.Vector3(r.x + hx, 2, r.z + hz)); }
    function pen(a, b) { const ox = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x), oz = Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z); return Math.min(ox, oz); }
    function actorBox(a, box) { if (!a._he) { const o = a.obj, ry = o.rotation.y, px = o.position.clone(); o.rotation.y = 0; o.position.set(0, 0, 0); o.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o, false); a._he = [Math.max(-bb.min.x, bb.max.x), Math.max(-bb.min.z, bb.max.z)]; o.rotation.y = ry; o.position.copy(px); o.updateMatrixWorld(true); } const c = Math.abs(Math.cos(a.obj.rotation.y)), s2 = Math.abs(Math.sin(a.obj.rotation.y)); const hx = a._he[0] * c + a._he[1] * s2, hz = a._he[0] * s2 + a._he[1] * c; const p = a.obj.position; box.min.set(p.x - hx, 0, p.z - hz); box.max.set(p.x + hx, 2, p.z + hz); return box; }
    for (const i of (ONLY || [...Zs.SCENARIOS.keys()])) for (const mode of ['stop', 'go', 'slow', 'timeout', 'late', 'correct']) for (let rep = 0; rep < REPS; rep++) {
      try {
        Zs.G.lives = 3; Zs.G.log = []; Zs.G.T = [3, 2.4, 1.8][rep % 3];
        Zs.loadSceneFn(Zs.SCENARIOS[i]);
        const S0 = Zs.S, id = S0.id; let steps = 0, crashChecked = false, maxPen = 0, maxPenInfo = '', vv = 0, vvInfo = '';
        while (Zs.S === S0 && !S0.ending && steps < 5000) {
          Zs.step(1 / 30); steps++;
          const m = Zs.P.mode, S = Zs.S;
          if ((m === 'decide' || m === 'decideStand')) { const el = S.T - S.timer; const want = mode === 'late' ? S.T * 0.85 : 0.35;
            if (mode !== 'timeout' && el > want) Zs.choose(mode === 'correct' ? S.cur.answer : mode === 'late' ? (['stop','go','slow'][(Math.random()*3)|0]) : mode); }
          if (steps % 3) continue;
          const pb = playerBox();
          const inCrash = m === 'crash' || m === 'nearmiss' || m === 'replay' || !!S.pending;
          const vis = S.actors.filter(a => a.started && a.obj.visible);
          if (!inCrash) for (const a of vis) { const p2 = pen(pb, actorBox(a, bx)); if (p2 > maxPen) { maxPen = p2; maxPenInfo = (isVeh(a) ? 'veh' : 'obj') + ' at s=' + Zs.P.s.toFixed(1) + ' t=' + S.time.toFixed(1); } }
          const vehs = vis.filter(isVeh);
          for (let x = 0; x < vehs.length; x++) for (let y = x + 1; y < vehs.length; y++) { if (vehs[x].frozen || vehs[y].frozen) continue; const p2 = pen(actorBox(vehs[x], bx), actorBox(vehs[y], by)); if (p2 > vv) { vv = p2; vvInfo = 't=' + S.time.toFixed(1) + ' ' + vehs[x].obj.position.x.toFixed(1) + ',' + vehs[x].obj.position.z.toFixed(1) + ' vs ' + vehs[y].obj.position.x.toFixed(1) + ',' + vehs[y].obj.position.z.toFixed(1); } }
          if (m === 'crash' && !crashChecked) { crashChecked = true; const h = S.actors.find(a => a.frozen); let d = 'nohazard'; if (h) { const hb = actorBox(h, bx); const gx = Math.max(0, hb.min.x - pb.max.x, pb.min.x - hb.max.x), gz = Math.max(0, hb.min.z - pb.max.z, pb.min.z - hb.max.z); d = Math.hypot(gx, gz); }
            const jam = S.id === 'jam' || S.id === 'fog'; if (d === 'nohazard' ? !jam && S.id !== 'jam' : d > 1.5) out.problems.push({ id, mode, kind: 'crash-far', d, log: Zs.G.log.map(e => e.answer + '/' + e.choice).join(' ') }); }
        }
        out.runs++;
        const log = Zs.G.log.map(e => (e.correct ? 'OK' : 'X') + ':' + e.answer + '/' + e.choice + (e.crash ? '*' : '')).join(' ');
        out.stats[id] = out.stats[id] || {}; out.stats[id][log] = (out.stats[id][log] || 0) + 1;
        if (steps >= 5000) out.problems.push({ id, mode, kind: 'stuck', pmode: Zs.P.mode, log });
        if (!Zs.G.log.length) out.problems.push({ id, mode, kind: 'nodecision' });
        if (mode === 'correct' && Zs.G.log.some(e => !e.correct)) out.problems.push({ id, mode, kind: 'correct-but-wrong', log });
        if (mode === 'correct' && Zs.G.lives < 3) out.problems.push({ id, mode, kind: 'correct-lost-life', log });
        if (maxPen > 0.35) out.problems.push({ id, mode, kind: 'player-overlap', pen: +maxPen.toFixed(2), info: maxPenInfo, log });
        if (vv > 0.6) out.problems.push({ id, mode, kind: 'veh-veh-overlap', pen: +vv.toFixed(2), info: vvInfo, log });
      } catch (e) { out.problems.push({ i, mode, kind: 'exception', err: e.message + ' ' + e.stack.slice(0, 300) }); }
    }
    out.geos = Zs.renderer.info.memory;
    return out;
  }, [REPS, [SI]]);
  console.log('SCEN', SI, 'RUNS', res.runs, 'MEM', JSON.stringify(res.geos));
  const agg = {}; for (const pr of res.problems) { const k = pr.id + ' ' + pr.kind; (agg[k] = agg[k] || []).push(pr); }
  for (const k in agg) { FAILS++; console.log('PROBLEM', k, agg[k].length, JSON.stringify(agg[k].slice(0, 3))); }
  for (const id in res.stats) console.log('STAT', id, JSON.stringify(res.stats[id]));
  }
  console.log('ERRORS', JSON.stringify(errs.slice(0, 10)));
  await b.close(); srv.close();
  process.exit(FAILS || errs.length ? 1 : 0);
})();
