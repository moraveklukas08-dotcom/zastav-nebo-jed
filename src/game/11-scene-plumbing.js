/* ============================== scene plumbing ============================== */
const CATS = { right: 'Přednost v jízdě', main: 'Přednost v jízdě', stop: 'Přednost v jízdě', left: 'Přednost v jízdě', round: 'Přednost v jízdě', flash: 'Přednost v jízdě', zebra: 'Chodci a děti', child: 'Chodci a děti', rturn: 'Chodci a děti', tramstop: 'Chodci a děti', light: 'Semafory a pokyny', works: 'Semafory a pokyny', arrow: 'Semafory a pokyny', officer: 'Semafory a pokyny', police: 'Semafory a pokyny', bus: 'MHD a zvláštní vozidla', tram: 'MHD a zvláštní vozidla', ambb: 'MHD a zvláštní vozidla', garbage: 'MHD a zvláštní vozidla', rail: 'Železnice', deer: 'Zvěř', jam: 'Dálnice', merge: 'Dálnice', night: 'Počasí a viditelnost', fog: 'Počasí a viditelnost', rain: 'Počasí a viditelnost', snow: 'Počasí a viditelnost', glare: 'Počasí a viditelnost', moto: 'Zrcátka a mrtvý úhel' };

const ACC = 3.2, BRK = 3.4;
function decDist(v, T, mu = 1) { return v * T + v * v / (14 * mu) + 3; }
function newScene(o) { const G = new THREE.Group(); const sc = { group: G, actors: [], tickers: [], phases: [], events: [], time: 0, pi: 0, cur: null, pending: null, ending: false, ...o }; sc.v = o.kmh / 3.6; if (!o.noWx && (o.fog === 'city' || o.fog === 'village') && vchance(0.18)) { sc.fog = 'rain'; sc.env = o.env + ' · déšť'; } else if (!o.noWx && o.fog === 'fields' && vchance(0.3)) { sc.fog = 'sunset'; sc.env = o.env + ' · západ slunce'; } sc.night = sc.fog === 'night'; sc.wet = sc.fog === 'rain'; sc.snow = sc.fog === 'snow'; sc.mu = o.mu || (sc.wet ? 0.85 : 1); sc.cat = CATS[o.id] || 'Ostatní'; sc.after = (dt, fn) => sc.events.push({ t: sc.time + dt, fn }); BUILD = sc; return sc; }
function spawn(sc, obj, pts, o = {}) {
  sc.group.add(obj);
  let a;
  if (o.tA != null) { let s0 = o.conflictS - o.v * o.tA, delay = 0; if (s0 < 0) { delay = -s0 / o.v; s0 = 0; } a = new Actor(obj, pts, { ...o, s0, delay, tv: o.v }); }
  else a = new Actor(obj, pts, o);
  sc.actors.push(a); return a;
}
const HIDDEN = 1e9;

