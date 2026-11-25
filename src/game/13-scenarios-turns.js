/* ============================== scenarios: new ============================== */
function scTram(T) {
  const sc = newScene({ id: 'tram', title: 'Tramvaj', place: 'Brno – Mendlovo náměstí', env: 'Město · křižovatka s tramvají', kmh: 35, fog: 'city' });
  const v = sc.v, trig = 60, stopS = trig + decDist(v, T), X = stopS + 7.2; sc.endS = X + 45;
  const G = sc.group;
  buildCity(sc, { len: X + 260, crossS: X }); cityPeds(sc, X, X + 260);
  addSign(G, 'tram', 4.6, X - 34);
  const tracks = []; for (const zc of [X - 1.75, X + 1.75]) for (const dz of [-0.72, 0.72]) tracks.push([0, 0.02, Z(zc) + dz]);
  instBoxes(G, tracks, 480, 0.02, 0.09, mat('rail', { color: 0x8e8f92, metalness: 0.8, roughness: 0.35, ...layer(5) }));
  const wp = []; for (let x = -230; x < 230; x += 30) for (const sd of [-1, 1]) wp.push([x, 3.6, Z(X + sd * 6.6)]); instBoxes(G, wp, 0.18, 7.2, 0.18, M.dark);
  for (const zc of [X - 1.75, X + 1.75]) B(G, 470, 0.025, 0.025, M.black, 0, 6.4, Z(zc), false);
  const zN = Z(X - 1.75), zF = Z(X + 1.75), tT = trig / v;
  const variant = weighted({ left: 0.45, right: 0.25, stopped: 0.3 });
  const ph = { type: 'moving', triggerS: trig, stopS, crashTitle: 'Srážka s tramvají!' };
  sc.trams = [];
  if (variant === 'left') {
    const tr = spawn(sc, makeTram(), [[-250, zN], [300, zN]], { v: 9, conflictS: 251.75, tA: tT + T + 0.6 }); sc.trams.push(tr);
    Object.assign(ph, { answer: 'stop', hazard: tr, crashS: X - 5.2, clear: 34, ok: 'Tramvaj má na křižovatce bez značek přednost, i když přijíždí zleva.', bad: 'Zleva jela tramvaj. Ta má na neřízené křižovatce přednost před ostatními vozidly.' });
  } else if (variant === 'right') {
    const tr = spawn(sc, makeTram(), [[250, zF], [-300, zF]], { v: 9, conflictS: 248.25, tA: tT + T + 0.6 }); sc.trams.push(tr);
    Object.assign(ph, { answer: 'stop', hazard: tr, crashS: X - 1.7, clear: 34, ok: 'Tramvaj zprava má přednost dvakrát: jede zprava a je to tramvaj.', bad: 'Zprava jela tramvaj. Té musíš dát přednost.' });
  } else {
    const tr = makeTram(); tr.position.set(-62, 0, zN); tr.rotation.y = -Math.PI / 2; G.add(tr);
    const isl = B(G, 30, 0.2, 2.0, M.concrete, -52, 0.1, Z(X - 4.6), false);
    for (let i = 0; i < 4; i++) { const p = makePerson(); p.position.set(-58 + i * 3, 0.2, Z(X - 4.6)); G.add(p); }
    Object.assign(ph, { answer: 'go', ok: 'Tramvaj stála v zastávce daleko vlevo. Křižovatka byla volná.', bad: 'Tramvaj stála v zastávce a nastupovalo se. Zbytečně jsi zastavil.' });
  }
  sc.update = () => { for (const tr of sc.trams) { if (!tr.belled && tr.started && Math.abs(tr.pos.x) < 70) { tr.belled = true; AU.tramBell(); } } };
  sc.phases = [ph]; return sc;
}
function scLeft(T) {
  const sc = newScene({ id: 'left', title: 'Odbočení vlevo', place: 'Hradec Králové – centrum', env: 'Město · odbočuješ vlevo', kmh: 35, fog: 'city' });
  sc.nav = { text: 'Odbočíš vlevo', arrow: '←' };
  const v = sc.v, trig = 55, X = trig + decDist(v, T) + 5;
  const stopS = X - 5;
  const r = new Route(1.75, 0).line(X - 5); const sArc = r.len; r.arc(6.75, Math.PI / 2).line(220).done(); r.limit(sArc - 2, sArc + 11, 4.2);
  sc.route = r; sc.navS = sArc; sc.endS = sArc + 10.6 + 45;
  buildCity(sc, { len: X + 260, crossS: X }); cityPeds(sc, X, X + 260);
  addSign(sc.group, 'main', 4.6, X - 30);
  const crashS = r.sWhere(s => r.at(s + 2.2).x <= -0.85, sArc - 3);
  const fp = r.at(crashS + 2.2);
  const OP = [[-1.75, Z(X + 160)], [-1.75, Z(-200)]];
  const cS = sNearPts(OP, -1.75, fp.z);
  const tT = trig / v;
  const ph = { type: 'moving', triggerS: trig, stopS, crashS };
  if (vchance(0.58)) {
    const a = spawn(sc, makeCar(pick(CAR_COLORS)), OP, { v: 12, conflictS: cS, tA: tT + T + 0.7 });
    Object.assign(ph, { answer: 'stop', hazard: a, clear: 7, ok: 'Při odbočování vlevo dáváš přednost protijedoucím vozidlům.', bad: 'Proti tobě jelo auto rovně. Při odbočení vlevo mu musíš dát přednost.' });
    const ph2 = { type: 'standing', crashS };
    if (vchance(0.45)) {
      const b = spawn(sc, makeCar(pick(CAR_COLORS)), OP, { v: 12, delay: HIDDEN, conflictS: cS });
      Object.assign(ph2, { answer: 'stop', hazard: b, clear: 7, ok: 'Za prvním autem jelo další. Odboč, až bude mezera dost velká.', bad: 'Za prvním autem jelo hned další a ty jsi mu vjel do cesty.' });
      ph2.onPrep = () => b.activate(T + 0.7 + 1.4, 12);
    } else {
      Object.assign(ph2, { answer: 'go', ok: 'Protisměr je volný, můžeš odbočit.', bad: 'Protisměr byl volný. Dlouhé čekání uprostřed křižovatky zdržuje ostatní.' });
    }
    sc.phases = [ph, ph2];
  } else {
    spawn(sc, makeCar(pick(CAR_COLORS)), OP, { v: 12, conflictS: cS, tA: tT + T + 15 });
    Object.assign(ph, { answer: 'go', ok: 'Protijedoucí auto bylo daleko. Bezpečně jsi odbočil.', bad: 'Protijedoucí auto bylo hodně daleko, mohl jsi odbočit.' });
    sc.phases = [ph];
  }
  return sc;
}
function scRightTurn(T) {
  const sc = newScene({ id: 'rturn', title: 'Odbočení vpravo', place: 'Olomouc – třída Svobody', env: 'Město · odbočuješ přes cyklostezku', kmh: 35, fog: 'city' });
  sc.nav = { text: 'Odbočíš vpravo', arrow: '→' };
  const v = sc.v, trig = 55, X = trig + decDist(v, T) + 7.5;
  const stopS = X - 7.5;
  const r = new Route(1.75, 0).line(X - 7.5); const sArc = r.len; r.arc(5.75, -Math.PI / 2).line(220).done(); r.limit(sArc - 2, sArc + 9.5, 4.2);
  sc.route = r; sc.navS = sArc; sc.endS = sArc + 9 + 45;
  buildCity(sc, { len: X + 260, crossS: X, cycleRight: true }); cityPeds(sc, X, X + 260, 3.8, 4.6);
  const crashS = r.sWhere(s => r.at(s + 2.2).x >= 5.0, sArc);
  const fp = r.at(crashS + 2.2);
  const tT = trig / v;
  const ph = { type: 'moving', triggerS: trig, stopS, crashS, kind: 'vulnerable' };
  const variant = weighted({ cyclist: 0.45, ped: 0.25, clear: 0.3 });
  if (variant === 'cyclist') {
    const CP = [[5.6, Z(X + 120)], [5.6, Z(-80)]];
    const c = spawn(sc, makeCyclist(), CP, { v: 5.5, conflictS: sNearPts(CP, 5.6, fp.z), tA: tT + T + 0.8 }); c.y = 0.15;
    Object.assign(ph, { answer: 'stop', hazard: c, clear: 3, ok: 'Cyklista jel po cyklostezce rovně. Při odbočení mu musíš dát přednost.', bad: 'Po cyklostezce jel cyklista. Při odbočování dáváš přednost cyklistům jedoucím rovně.' });
  } else if (variant === 'ped') {
    const PP = [[4.4, Z(X + 18)], [4.4, Z(X - 40)]];
    const p = spawn(sc, makePerson(), PP, { v: 1.5, conflictS: sNearPts(PP, 4.4, fp.z), tA: tT + T + 1.4 }); p.y = 0.15;
    ph.crashS = r.sWhere(s => r.at(s + 2.2).x >= 3.6, sArc);
    Object.assign(ph, { answer: 'stop', hazard: p, clear: 2.5, ok: 'Chodec přecházel ulici, do které odbočuješ. Musíš ho nechat přejít.', bad: 'Přes ulici, do které jsi odbočoval, přecházel chodec. Při odbočování mu musíš umožnit přejít.' });
  } else {
    const c = spawn(sc, makeCyclist(), [[5.6, Z(X + 30)], [5.6, Z(X + 400)]], { v: 5, s0: 0 }); c.y = 0.15;
    Object.assign(ph, { answer: 'go', ok: 'Cyklista jel od křižovatky pryč. Mohl jsi plynule odbočit.', bad: 'Cyklista ujížděl od křižovatky pryč a nikoho jsi neohrožoval. Zastavení nebylo nutné.' });
  }
  sc.phases = [ph]; return sc;
}
function buildRoundabout(sc, Rs, len) {
  const G = sc.group;
  ground(G, 'grass');
  road(G, 'city', 0, -40, Rs - 13.8); road(G, 'city', 0, Rs + 13.8, Rs + 400);
  crossRoad(G, 'city', Rs, 13.8, 300); crossRoad(G, 'city', Rs, -300, -13.8);
  const ring = new THREE.Mesh(planarUV(new THREE.RingGeometry(8.6, 14.3, 80, 1).rotateX(-Math.PI / 2), 7, 12), roadMat('plain', 2)); ring.position.set(0, 0.006, Z(Rs)); ring.receiveShadow = true; G.add(ring);
  const isl = new THREE.Mesh(cached('g:islcurb', () => new THREE.CylinderGeometry(8.7, 8.7, 0.24, 64)), M.curb); isl.position.set(0, 0.12, Z(Rs)); G.add(isl);
  const top = new THREE.Mesh(cached('g:isltop', () => new THREE.CylinderGeometry(8.45, 8.6, 0.32, 64)), mat('islgrass', { color: 0x5f8a3a, roughness: 1 })); top.position.set(0, 0.16, Z(Rs)); top.receiveShadow = true; G.add(top);
  trees(G, [[0, Rs, 1.4]], 'leaf');
  const fl = []; for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; fl.push([Math.cos(a) * 6.5, Rs + Math.sin(a) * 6.5, 0.45]); } bushes(G, fl);
  const flowerM = mat('flowers', { color: 0xd0342c, roughness: 0.8 }); const fls = []; for (let i = 0; i < 60; i++) { const a = Math.random() * Math.PI * 2, rr = rand(3, 5.5); fls.push([Math.cos(a) * rr, 0.38, Z(Rs + Math.sin(a) * rr)]); } instBoxes(G, fls, 0.25, 0.15, 0.25, flowerM);
  for (const [x, s, rot] of [[0, Rs - 19, 0], [0, Rs + 19, 0], [19, Rs, 1], [-19, Rs, 1]]) { if (rot) B(G, 9, 0.16, 1.1, M.curb, x, 0.08, Z(s), false); else B(G, 1.1, 0.16, 9, M.curb, x, 0.08, Z(s), false); }
  for (const [a, b] of [[-40, Rs - 16], [Rs + 16, Rs + 400]]) { sidewalk(G, 3.5, 6.2, a, b, 'x'); sidewalk(G, -6.2, -3.5, a, b, 'x'); }
  for (const xs of [-1, 1]) { sidewalk(G, xs > 0 ? 16 : -300, xs > 0 ? 300 : -16, Rs + 3.5, Rs + 6.2); sidewalk(G, xs > 0 ? 16 : -300, xs > 0 ? 300 : -16, Rs - 6.2, Rs - 3.5); }
  zebra(G, 0, Rs + 21, false, 7, 3.2); zebra(G, 0, Rs - 22, false, 7, 3.2); zebra(G, 21, Rs, true, 7, 3.2); zebra(G, -21, Rs, true, 7, 3.2);
  for (let i = 0; i < 6; i++) line(G, 0.4 + i * 0.55, Rs - 14.4, 0.3, 0.2);
  addSign(G, 'yield', 4.7, Rs - 17, { h: 1.3, postH: 3.0 }); addSign(G, 'roundabout', 4.7, Rs - 17, { h: 2.15, noPost: true });
  addSign(G, 'yield', -4.7, Rs + 17, { h: 1.3, postH: 3.0, rot: Math.PI }); addSign(G, 'roundabout', -4.7, Rs + 17, { h: 2.15, noPost: true, rot: Math.PI });
  const tl = [], bl = [];
  for (const qx of [-1, 1]) for (const qs of [-1, 1]) {
    for (let k = 0; k < 5; k++) { const x = qx * rand(30, 120), s = Rs + qs * rand(30, 160); house(G, x, s, vchance(0.5) ? 0 : Math.PI / 2); tl.push([x + rand(-8, 8), s + rand(8, 12), rand(0.8, 1.2)]); }
    for (let k = 0; k < 8; k++) bl.push([qx * rand(9, 24), Rs + qs * rand(18, 28), rand(0.5, 0.9)]);
  }
  for (let s = 0; s < Rs - 30; s += 22) { house(G, rand(14, 17), s, vchance(0.5) ? 0 : Math.PI / 2); house(G, -rand(14, 17), s + 10, vchance(0.5) ? 0 : Math.PI / 2); }
  trees(G, tl, 'leaf'); bushes(G, bl);
  for (const [x, s, sd] of [[6, Rs - 26, 1], [-6, Rs + 26, -1], [26, Rs - 6, 1], [-26, Rs + 6, -1]]) streetLamp(G, x, s, sd);
}
function ringPt(Rs, deg, r = 11) { return [r * Math.cos(deg * DEG), -(Rs + r * Math.sin(deg * DEG))]; }
function ringPts(Rs, d0, d1, step = 14) { const out = []; const n = Math.max(1, Math.round(Math.abs(d1 - d0) / step)); for (let i = 0; i <= n; i++) out.push(ringPt(Rs, d0 + (d1 - d0) * i / n)); return out; }
function scRound(T) {
  const sc = newScene({ id: 'round', title: 'Kruhový objezd', place: 'Pardubice – Palackého třída', env: 'Město · kruhový objezd', kmh: 40, fog: 'village' });
  const v = sc.v, trig = 55, D = decDist(v, T), Rs = trig + D + 17, stopS = Rs - 17;
  const exit = pick(['east', 'north', 'west']);
  const exitN = { east: 1, north: 2, west: 3 }[exit];
  sc.nav = { text: `Kruhový objezd: ${exitN}. výjezd`, arrow: '↻' };
  const r = new Route(1.75, 0).line(stopS);
  const ex = {
    east: { deg: -26, pts: [[14.6, -(Rs - 2.4)], [19, -(Rs - 1.75)], [40, -(Rs - 1.75)]], zeb: [21, -(Rs - 1.75)], ped: [[21, -(Rs - 6.6)], [21, -(Rs + 6.6)]], along: [[21, -(Rs - 6.6)], [50, -(Rs - 6.6)]] },
    north: { deg: 64, pts: [[2.6, -(Rs + 14.6)], [1.75, -(Rs + 19)], [1.75, -(Rs + 40)]], zeb: [1.75, -(Rs + 21)], ped: [[6.6, -(Rs + 21)], [-6.6, -(Rs + 21)]], along: [[6.6, -(Rs + 21)], [6.6, -(Rs + 50)]] },
    west: { deg: 154, pts: [[-14.6, -(Rs + 2.4)], [-19, -(Rs + 1.75)], [-40, -(Rs + 1.75)]], zeb: [-21, -(Rs + 1.75)], ped: [[-21, -(Rs + 6.6)], [-21, -(Rs - 6.6)]], along: [[-21, -(Rs + 6.6)], [-50, -(Rs + 6.6)]] },
  }[exit];
  r.curve([[2.6, -(Rs - 14.2)], ...ringPts(Rs, -62, ex.deg), ...ex.pts]).line(200).done();
  const sExit = r.sNear(...ex.pts[1]);
  r.limit(stopS - 1, sExit + 4, 5.6);
  sc.route = r; sc.navS = stopS; sc.endS = sExit + 50;
  buildRoundabout(sc, Rs);
  const cp = ringPt(Rs, -62);
  const crashS = r.sNear(cp[0], cp[1]) - 2.2;
  const tT = trig / v;
  const ph = { type: 'moving', triggerS: trig, stopS, crashS };
  const variant = weighted({ circ: 0.42, exits: 0.38, fake: 0.2 });
  let hp;
  if (variant === 'exits') hp = smoothPts([...ringPts(Rs, 110, 236), [-2.6, -(Rs - 14.6)], [-1.75, -(Rs - 20)], [-1.75, -(Rs - 200)]]);
  else hp = smoothPts([...ringPts(Rs, 110, 334), [14.6, -(Rs - 2.4)], [19, -(Rs - 1.75)], [200, -(Rs - 1.75)]]);
  const hc = makeCar(pick(CAR_COLORS));
  if (variant !== 'circ') hc.userData.setBlink('right');
  if (variant === 'exits') {
    const ep = sNearPts(hp, -2.6, -(Rs - 14.6));
    spawn(sc, hc, hp, { v: 7, conflictS: ep, tA: tT + T * 0.75 });
    Object.assign(ph, { answer: 'go', ok: 'Auto na kruhovém objezdu blikalo vpravo a vyjelo dřív, než jsi vjížděl. Cesta byla volná.', bad: 'Auto na objezdu vyjíždělo ven a tvou cestu nekřížilo. Zastavení nebylo nutné.' });
  } else {
    const a = spawn(sc, hc, hp, { v: 7, conflictS: sNearPts(hp, cp[0], cp[1]), tA: tT + T + 0.6 });
    Object.assign(ph, { answer: 'stop', hazard: a, clear: 6, ok: variant === 'fake' ? 'Auto blikalo vpravo, ale nevyjelo. Blinkru na kruháči nevěř, dokud auto opravdu nevyjíždí.' : 'Vozidla na kruhovém objezdu mají přednost. Počkej, až projedou.', bad: variant === 'fake' ? 'Auto sice blikalo vpravo, ale pokračovalo po objezdu. Na blinkr se nespoléhej.' : 'Po kruhovém objezdu jelo auto. Při vjezdu musíš dát přednost vozidlům na objezdu.' });
  }
  const zp = ex.zeb, sZ = r.sNear(zp[0], zp[1]);
  const stop2 = sZ - 4.4, trig2 = Math.max(stopS + 4, stop2 - decDist(5.6, T));
  const ph2 = { type: 'moving', triggerS: trig2, stopS: stop2, crashS: sZ - 2.7, kind: 'vulnerable' };
  if (vchance(0.5)) {
    const pd = spawn(sc, makePerson(), ex.ped, { v: 0, tv: 0, conflictS: sNearPts(ex.ped, zp[0], zp[1]) }); pd.y = 0.15;
    ph2.onStart = () => sc.after(rand(0.2, 0.5), () => { pd.v = pd.tv = 1.7; });
    Object.assign(ph2, { answer: 'stop', hazard: pd, clear: 3.2, ok: 'Na přechodu za výjezdem vstoupil chodec do silnice. Pustit ho!', bad: 'Za výjezdem z objezdu vstoupil chodec na přechod. Musíš mu umožnit přejít.' });
  } else {
    const pd = spawn(sc, makePerson(), ex.along, { v: 1.3 }); pd.y = 0.15;
    Object.assign(ph2, { answer: 'go', kind: null, ok: 'Chodec šel po chodníku podél silnice. Přechod byl volný.', bad: 'Chodec šel po chodníku pryč od přechodu. Zastavení nebylo nutné.' });
  }
  sc.phases = [ph, ph2]; return sc;
}
function scNight(T) {
  const sc = newScene({ id: 'night', title: 'Noční silnice', place: 'Silnice II/602 u Jihlavy', env: 'Mimo obec · noc', kmh: 70, fog: 'night' });
  const v = sc.v, trig = 70, stopS = trig + decDist(v, T), C = stopS + 7; sc.endS = C + 60;
  const G = sc.group;
  buildRural(sc, { len: C + 500, noAlley: true });
  const tT = trig / v;
  const variant = weighted({ cyclist: 0.4, ped: 0.3, vest: 0.3 });
  const ph = { type: 'moving', triggerS: trig, stopS };
  if (variant === 'cyclist') {
    const cv = 4.5, gap = (v - cv) * (T + 1.6) + 6;
    const c = spawn(sc, makeCyclist({ dark: true }), [[2.6, 0], [2.6, Z(4000)]], { s0: trig + gap - cv * tT, v: cv, tv: cv });
    oncoming(sc, -1.75, trig + (v * (T + 1.2)) * 0.95, 20);
    Object.assign(ph, { answer: 'slow', slowTo: 14, endAfterStop: true, kind: 'vulnerable', ok: 'Před tebou jel cyklista bez osvětlení a v protisměru auto. Správně jsi zpomalil, předjet můžeš až bezpečně.', bad: 'Před tebou jel neosvětlený cyklista. V noci jeď tak, abys zastavil na vzdálenost, na kterou vidíš.' });
    ph.crashCheck = () => P.s + 2.2 >= c.s - 1.2;
  } else if (variant === 'ped') {
    const pts = [[-6, Z(C)], [6, Z(C + 1)]];
    const p = spawn(sc, makePerson({ shirt: 0x1d1f24, pants: 0x14161a }), pts, { v: 1.5, conflictS: sNearPts(pts, 1.75, Z(C + 0.6)), tA: tT + T + 0.9 });
    Object.assign(ph, { answer: 'stop', hazard: p, kind: 'vulnerable', crashS: C - 2.7, clear: 2.5, ok: 'Silnici přecházel chodec v tmavém oblečení. Bez reflexních prvků ho vidíš až na pár desítek metrů.', bad: 'Přes silnici šel chodec v tmavém oblečení. Ve tmě sleduj okraje silnice a nespoléhej, že tě uvidí.' });
  } else {
    const pts = [[-4.3, Z(C + 60)], [-4.3, Z(-100)]];
    spawn(sc, makePerson({ vest: true }), pts, { v: 1.4, conflictS: 60, tA: tT + T });
    Object.assign(ph, { answer: 'go', ok: 'Chodec s reflexní vestou šel správně po levé krajnici, proti směru jízdy. Mohl jsi opatrně pokračovat.', bad: 'Chodec v reflexní vestě šel po krajnici a do silnice nevstoupil. Zastavení nebylo nutné.' });
  }
  sc.phases = [ph]; return sc;
}
function scFog(T) {
  const sc = newScene({ id: 'fog', title: 'Mlha', place: 'Silnice u Třeboně', env: 'Mimo obec · hustá mlha', kmh: 70, fog: 'fog' });
  sc.q = 'Brzdit, nebo jet?';
  const v = sc.v, trig = 70, stopS = trig + decDist(v, T); sc.endS = stopS + 80;
  buildRural(sc, { len: stopS + 500 });
  const tT = trig / v;
  const variant = weighted({ tractor: 0.5, turnoff: 0.25, clear: 0.25 });
  const ph = { type: 'moving', triggerS: trig, stopS };
  const tv = 6.5, gap = (v - tv) * (T + 1.4) + 8;
  if (variant === 'tractor') {
    const t = spawn(sc, makeTractor(), [[1.75, 0], [1.75, Z(4000)]], { s0: trig + gap - tv * tT, v: tv, tv });
    Object.assign(ph, { answer: 'slow', slowTo: 20, endAfterStop: true, crashTitle: 'Náraz do traktoru!', ok: 'Z mlhy se vynořil pomalý traktor. Správně jsi zpomalil a držíš odstup.', bad: 'V mlze jel pomalý traktor. Rychlost musíš přizpůsobit dohlednosti.' });
    ph.crashCheck = () => P.s + 2.2 >= t.s - 1.8;
    ph.static = true; ph.hazard = t;
  } else if (variant === 'turnoff') {
    const s0 = trig + gap - tv * tT, ts = s0 + tv * (tT + T * 0.6);
    const tr = makeTractor(); tr.userData.setBlink('right');
    spawn(sc, tr, [[1.75, Z(s0)], [1.75, Z(ts)], [6, Z(ts + 6)], [30, Z(ts + 8)]].map(p => p), { s0: 0, v: tv, tv });
    FL(sc.group, 4, 30, mat('dirt', { color: 0x6d5a40, roughness: 1, ...layer(1) }), 18, -0.005, Z(ts + 7), 4, 30).rotation.y = Math.PI / 2;
    Object.assign(ph, { answer: 'go', ok: 'Traktor blikal a sjel z hlavní silnice na polní cestu. Silnice je volná.', bad: 'Traktor sjížděl ze silnice na polní cestu. Prudké brzdění v mlze může způsobit nehodu zezadu.' });
  } else {
    oncoming(sc, -1.75, trig + v * T * 0.8, 18);
    Object.assign(ph, { answer: 'go', ok: 'V mlze se objevilo jen protijedoucí auto ve svém pruhu. Pokračuj opatrně.', bad: 'Proti tobě jelo auto ve svém pruhu. Zbytečné brzdění v mlze je nebezpečné.' });
  }
  sc.phases = [ph]; return sc;
}
function scWorks(T) {
  const sc = newScene({ id: 'works', title: 'Práce na silnici', place: 'Silnice I/34 u Pelhřimova', env: 'Mimo obec · kyvadlová doprava', kmh: 50, fog: 'fields' });
  const v = sc.v, trig = 55, stopS = trig + decDist(v, T), W0 = stopS + 18.2, W1 = W0 + 40;
  sc.nav = { text: 'Objížďka zúženým úsekem', arrow: '↰' };
  const r = new Route(1.75, 0).line(W0 - 14).shift(3.5, 12).line(W1 - W0 + 4).shift(-3.5, 12).line(300).done();
  sc.route = r; sc.navS = W0 - 14; sc.endS = W1 + 60;
  const G = sc.group;
  buildRural(sc, { len: W1 + 400 });
  addSign(G, 'works', 4.6, W0 - 70);
  const tl1 = makeTrafficLight(true); tl1.position.set(4.3, 0, Z(W0 - 16)); G.add(tl1);
  const tl2 = makeTrafficLight(true); tl2.position.set(-4.3, 0, Z(W1 + 16)); tl2.rotation.y = Math.PI; G.add(tl2);
  line(G, 1.75, W0 - 15.5, 3.3, 0.4); line(G, -1.75, W1 + 15.5, 3.3, 0.4);
  const set = (a, b) => { tl1.userData.set(a); tl2.userData.set(b); sc.ours = a; };
  const bar = mat('barrier', { color: 0xffffff, roughness: 0.6 }), red = mat('barrierRed', { color: 0xd42a20, roughness: 0.6 });
  for (const s of [W0, W1]) { for (let i = 0; i < 6; i++) B(G, 0.55, 0.25, 0.08, i % 2 ? bar : red, 0.4 + i * 0.55, 1.0, Z(s), false); B(G, 0.06, 1.0, 0.06, M.dark, 0.5, 0.5, Z(s)); B(G, 0.06, 1.0, 0.06, M.dark, 3.2, 0.5, Z(s)); }
  const cones = []; for (let s = W0 - 8; s < W1 + 8; s += 3) cones.push([0.15, 0.35, Z(s)]);
  const cm = new THREE.InstancedMesh(cached('g:cone2', () => new THREE.ConeGeometry(0.2, 0.7, 10)), mat('conem', { color: 0xff5a10, roughness: 0.6 }), cones.length); const mm = new THREE.Matrix4(); cones.forEach(([x, y, z], i) => { mm.makeTranslation(x, y, z); cm.setMatrixAt(i, mm); }); cm.castShadow = true; G.add(cm);
  FL(G, 3.2, W1 - W0 - 4, mat('dug', { color: 0x5c4a36, roughness: 1, ...layer(3) }), 1.9, 0.02, Z((W0 + W1) / 2), 3, 3);
  const dig = new THREE.Group(); RB(dig, 2.2, 1.2, 3, 0.15, M.yellowM, 0, 1.2, 0); RB(dig, 1.6, 1.6, 1.6, 0.1, M.glass, 0, 2.5, 0.4); B(dig, 0.3, 0.3, 3.5, M.yellowM, 0, 2.6, -2.2).rotation.x = 0.6; B(dig, 2.4, 0.6, 3.4, M.black, 0, 0.35, 0); dig.position.set(2.2, 0, Z(W0 + 20)); dig.rotation.y = 0.5; G.add(dig);
  for (let i = 0; i < 3; i++) { const p = makePerson({ vest: true }); p.position.set(rand(1.2, 3.2), 0, Z(W0 + rand(6, 34))); p.rotation.y = rand(0, 6); G.add(p); }
  const tT = trig / v;
  const crashS = r.sWhere(s => r.at(s + 2.2).x <= -1.6, W0 - 14);
  const fp = r.at(crashS + 2.2);
  const OP = [[-1.75, Z(W1 + 300)], [-1.75, Z(-200)]];
  const cS = sNearPts(OP, -1.75, fp.z - 2.2);
  const variant = weighted({ red: 0.4, green: 0.35, late: 0.25 });
  const ph = { type: 'moving', triggerS: trig, stopS, crashS };
  if (variant === 'red') {
    set('red', 'green');
    const cars = [0, 1, 2].map(i => spawn(sc, makeCar(pick(CAR_COLORS)), OP, { v: 11, conflictS: cS, tA: tT + T + 0.8 + i * 2.2 })); cars[1].leader = cars[0]; cars[2].leader = cars[1];
    Object.assign(ph, { answer: 'stop', hazard: cars[0], ok: 'Na dočasném semaforu svítila červená a zúženým úsekem jela kolona z protisměru.', bad: 'Svítila červená a zúženým úsekem jely protijedoucí auta. Srazil ses čelně.' });
    ph.canResume = () => sc.ours === 'green';
    sc.update = () => { if (!sc.switched && cars[2].pos.z > fp.z + 30) { sc.switched = true; set('red', 'yellow'); sc.after(1, () => set('red', 'red')); sc.after(2.2, () => set('redyellow', 'red')); sc.after(3.2, () => set('green', 'red')); } };
  } else if (variant === 'green') {
    set('green', 'red');
    const w = spawn(sc, makeCar(pick(CAR_COLORS)), OP, { s0: 300 - 18 - 2.3, v: 0, tv: 0, stopAt: 300 - 18 - 2.3 }); w.releaseAt = W1 + 20;
    Object.assign(ph, { answer: 'go', ok: 'Zelená a zúžený úsek je volný. Protijedoucí čekají na červenou.', bad: 'Svítila zelená a úsek byl volný. Zbytečné zastavení zdržuje celou kolonu.' });
  } else {
    set('green', 'red');
    const a = spawn(sc, makeCar(pick(CAR_COLORS)), OP, { v: 10, conflictS: cS, tA: tT + T + 0.6 });
    Object.assign(ph, { answer: 'stop', hazard: a, clear: 8, ok: 'Máš zelenou, ale úsekem ještě projíždělo opožděné auto z protisměru. Počkat!', bad: 'Měl jsi zelenou, ale v zúženém úseku ještě jelo auto z protisměru. Zelená neznamená, že je volno.' });
  }
  sc.phases = [ph]; return sc;
}
