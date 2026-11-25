/* ============================== stats ============================== */
function loadStats() { try { return JSON.parse(lsGet('zastav-stats') || '{}') || {}; } catch (e) { return {}; } }
function recordStat(cat, correct, rt) { const st = loadStats(); const c = st[cat] || (st[cat] = { n: 0, ok: 0, rt: 0, rtn: 0 }); c.n++; if (correct) c.ok++; if (rt != null && correct) { c.rt += rt; c.rtn++; } lsSet('zastav-stats', JSON.stringify(st)); }
function weakCats() { const st = loadStats(); return Object.entries(st).filter(([, c]) => c.n >= 2).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n).map(([k]) => k); }
function trainList() {
  const weak = weakCats().slice(0, 3); const pool = SCENARIOS.filter(f => weak.includes(CATS[SCEN_ID.get(f)]));
  const base = pool.length ? pool : SCENARIOS; const out = []; const sh = shuffle(base.slice()); while (out.length < 8) out.push(sh[out.length % sh.length]); return shuffle(out);
}
const ID_BY_NAME = { scRight: 'right', scMain: 'main', scLight: 'light', scZebra: 'zebra', scChild: 'child', scBus: 'bus', scRail: 'rail', scDeer: 'deer', scJam: 'jam', scMerge: 'merge', scStop: 'stop', scTram: 'tram', scLeft: 'left', scRightTurn: 'rturn', scRound: 'round', scNight: 'night', scFog: 'fog', scWorks: 'works', scAmbBehind: 'ambb', scMoto: 'moto', scRain: 'rain', scSnow: 'snow', scGlare: 'glare', scPolice: 'police', scGarbage: 'garbage', scTramStop: 'tramstop', scArrow: 'arrow', scFlash: 'flash', scOfficer: 'officer' };
const SCEN_ID = new Map(SCENARIOS.map(f => [f, ID_BY_NAME[f.name]]));

