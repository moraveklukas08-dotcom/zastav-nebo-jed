/* ============================== scenarios: rear view, weather, special ============================== */
function scAmbBehind(T) {
  const sc = newScene({ id: 'ambb', title: 'Sanitka za tebou', place: 'Liberec – Masarykova', env: 'Město · sleduj zpětné zrcátko', kmh: 50, fog: 'city', noWx: true });
  sc.nav = { text: 'Sleduj zpětné zrcátko', arrow: '▭' };
  const v = sc.v, trig = 60, stopS = trig + decDist(v, T); sc.endS = stopS + 75;
  buildCity(sc, { len: stopS + 320, crossS: null }); cityPeds(sc, null, stopS + 200);
  const tT = trig / v;
  const ph = { type: 'moving', triggerS: trig, stopS };
  if (weighted({ siren: 0.62, quiet: 0.38 }) === 'siren') {
    const av = v + 7, s0w = trig - 30 - av * tT, sh0 = trig - 6, sh1 = stopS + 60;
    const pts = [[1.75, Z(-400)], [1.75, Z(sh0)], [-1.75, Z(sh0 + 14)], [-1.75, Z(sh1)], [1.75, Z(sh1 + 14)], [1.75, Z(4000)]];
    const amb = spawn(sc, makeVan(0xe3e63a, true), pts, { s0: s0w + 400, v: av, tv: av });
    sc.siren = amb;
    Object.assign(ph, { answer: 'stop', accept: ['slow'], ok: 'Za tebou jela sanitka s majáky a sirénou. Zpomal, drž se u pravého okraje a nech ji projet.', bad: 'Za tebou jela sanitka s majáky a sirénou. Vozidlu s právem přednosti musíš umožnit bezpečný průjezd.' });
    ph.canResume = () => -amb.pos.z > stopS + 14;
  } else {
    const van = spawn(sc, makeVan(0xf2f2f2), [[1.75, Z(-400)], [1.75, Z(4000)]], { s0: 400 - 22, v, tv: v, acc: 6, dec: 8 });
    van.onUpdate = a => { const w = -a.pos.z; a.tv = Math.max(0, Math.min(sc.v + 3, P.v + (P.s - 16 - w) * 0.9)); };
    Object.assign(ph, { answer: 'go', ok: 'Za tebou jela obyčejná dodávka bez majáků. Pokračuj normálně dál.', bad: 'Za tebou jela dodávka bez majáků a sirény. Zastavením jsi zbytečně zdržel provoz.' });
  }
  sc.phases = [ph]; return sc;
}
function scMoto(T) {
  const sc = newScene({ id: 'moto', title: 'Objíždění dodávky', place: 'Zlín – třída Tomáše Bati', env: 'Město · motorka v mrtvém úhlu', kmh: 40, fog: 'city' });
  sc.nav = { text: 'Objeď stojící dodávku', arrow: '↰' };
  const v = sc.v, trig = 55, stopS = trig + decDist(v, T), V = stopS + 13; sc.endS = V + 60;
  const r = new Route(1.75, 0).line(stopS + 0.5).shift(3.5, 10).line(V + 6 - (stopS + 10.5)).shift(-3.5, 10).line(300).done();
  sc.route = r; sc.navS = stopS + 0.5;
  buildCity(sc, { len: V + 300, crossS: null }); cityPeds(sc, null, V + 200);
  const G = sc.group;
  const van = makeVan(0xf4f4f4); van.position.set(1.75, 0, Z(V)); van.userData.setBlink('hazard'); van.userData.setBrake(true); G.add(van);
  for (let i = 0; i < 3; i++) B(G, 0.55, 0.45, 0.55, mat('cardboard', { color: 0xb08a5a, roughness: 0.9 }), 4.2 + (i % 2) * 0.6, 0.37 + (i > 1 ? 0.45 : 0), Z(V + 3.4));
  const crashS = r.sWhere(s => r.at(s + 2.2).x <= -0.85, stopS);
  const fp = r.at(crashS + 2.2);
  const tT = trig / v;
  const ph = { type: 'moving', triggerS: trig, stopS, crashS };
  const variant = weighted({ moto: 0.42, oncoming: 0.3, clear: 0.28 });
  if (variant === 'moto') {
    const MP = [[-1.75, Z(-300)], [-1.75, Z(4000)]];
    const m = spawn(sc, makeMoto(), MP, { v: 18, conflictS: 300 - fp.z, tA: tT + T + 0.5, maxV: 40 });
    sc.moto = m;
    Object.assign(ph, { answer: 'stop', hazard: m, clear: 8, crashTitle: 'Srážka s motorkou!', ok: 'Zezadu předjížděla motorka. Před vybočením se vždy podívej do zrcátka a přes rameno.', bad: 'Zezadu tě předjížděla motorka, kterou jsi přehlédl. Před vybočením kontroluj zrcátka a mrtvý úhel.' });
  } else if (variant === 'oncoming') {
    const OP = [[-1.75, Z(V + 400)], [-1.75, Z(-200)]];
    const a = spawn(sc, makeCar(pick(CAR_COLORS)), OP, { v: 11, conflictS: sNearPts(OP, -1.75, fp.z - 2.3), tA: tT + T + 0.6 });
    Object.assign(ph, { answer: 'stop', hazard: a, clear: 7, ok: 'V protisměru jelo auto. Při objíždění překážky dáváš přednost protijedoucím.', bad: 'Při objíždění překážky musíš dát přednost protijedoucím vozidlům.' });
  } else {
    Object.assign(ph, { answer: 'go', ok: 'Zrcátko i protisměr byly volné. Bezpečně jsi objel dodávku.', bad: 'Zezadu ani v protisměru nic nejelo. Zbytečné čekání zdržuje.' });
  }
  sc.update = () => { if (sc.moto) { const p = sc.moto.pos, d = Math.hypot(p.x - P.wx, p.z - P.wz); AU.moto(sc.moto.frozen ? 0 : Math.max(0, Math.min(1, 30 / (d + 8)))); } };
  sc.phases = [ph]; return sc;
}
function scRain(T) {
  const sc = newScene({ id: 'rain', title: 'Déšť ve městě', place: 'Ostrava – Poruba', env: 'Město · mokrá vozovka', kmh: 50, fog: 'rain', noWx: true, mu: 0.75 });
  const v = sc.v, trig = 60, stopS = trig + decDist(v, T, 0.75), C = stopS + 4.2; sc.endS = C + 55;
  const G = sc.group;
  buildCity(sc, { len: C + 300, crossS: null, panel: 0.4, noTreeAt: [C] });
  const UMB = [0x2255aa, 0xc0392b, 0x222222, 0x27ae60, 0xf1c40f];
  for (let i = 0; i < 6; i++) { const side = chance(0.5) ? 1 : -1, x = side * rand(4.3, 5.5), a = rand(10, C - 20), b = a + rand(30, 90); const pp = spawn(sc, makePerson({ umbrella: pick(UMB) }), chance(0.5) ? [[x, Z(a)], [x, Z(b)]] : [[x, Z(b)], [x, Z(a)]], { s0: rand(0, 20), v: rand(1.1, 1.5) }); pp.y = 0.15; }
  const tT = trig / v;
  const variant = weighted({ runner: 0.45, wait: 0.3, brake: 0.25 });
  const ph = { type: 'moving', triggerS: trig, stopS };
  if (variant === 'runner') {
    const pts = [[5.0, Z(C - 5)], [4.0, Z(C)], [-6, Z(C + 1)]];
    const p = spawn(sc, makePerson({ umbrella: 0x2255aa }), pts, { v: 2.9, conflictS: sNearPts(pts, 1.75, Z(C + 0.25)), tA: tT + T + 0.6 });
    Object.assign(ph, { answer: 'stop', hazard: p, kind: 'vulnerable', crashS: C - 2.7, clear: 4.2, ok: 'Chodec v dešti přebíhal mimo přechod. Na mokru máš delší brzdnou dráhu, brzdit včas bylo klíčové.', bad: 'Chodec s deštníkem přebíhal silnici. Na mokré vozovce brzdíš déle, jeď opatrněji.' });
  } else if (variant === 'wait') {
    const p = makePerson({ umbrella: 0xc0392b, pose: 'static' }); p.position.set(4.1, 0.15, Z(C)); p.rotation.y = -Math.PI / 2; G.add(p);
    Object.assign(ph, { answer: 'go', ok: 'Chodec stál pod deštníkem a do silnice nevstoupil. Mohl jsi opatrně pokračovat.', bad: 'Chodec stál na chodníku a nepřecházel. Prudké brzdění na mokru je zbytečné riziko.' });
  } else {
    const LS = stopS + 7.8;
    const lead = spawn(sc, makeCar(pick(CAR_COLORS)), [[1.75, 0], [1.75, Z(5000)]], { s0: Math.max(28, LS - 60 - trig), v, tv: v });
    for (let i = 1; i <= 4; i++) { const c = makeCar(pick(CAR_COLORS)); c.position.set(1.75, 0, Z(LS + i * 7.2)); c.userData.setBrake(true); G.add(c); }
    Object.assign(ph, { answer: 'stop', hazard: lead, static: true, endAfterStop: true, ok: 'Auto před tebou prudce zabrzdilo do kolony. Na mokru drž větší odstup.', bad: 'Auto před tebou zabrzdilo a na mokré silnici jsi nestihl zastavit. V dešti zdvojnásob odstup.' });
    ph.onStart = () => { lead.stopAt = LS; };
    ph.crashCheck = () => P.s + 2.2 >= lead.s - 2.3;
  }
  sc.phases = [ph]; return sc;
}
function scSnow(T) {
  const sc = newScene({ id: 'snow', title: 'Sníh a led', place: 'Vrchlabí', env: 'Obec · zasněžená silnice', kmh: 40, fog: 'snow', noWx: true, mu: 0.5 });
  const v = sc.v, trig = 55, stopS = trig + decDist(v, T, 0.5), X = stopS + 7.2; sc.endS = X + 45;
  const G = sc.group;
  buildVillage(sc, { len: X + 260, crossS: X, name: 'Vrchlabí', churchS: X + 120 });
  addSign(G, 'main', 4.6, X - 30); addSign(G, 'yield', 7.4, X + 5.2, { rot: Math.PI / 2 }); addSign(G, 'yield', -7.4, X - 5.2, { rot: -Math.PI / 2 });
  const tT = trig / v, zF = Z(X + 1.75);
  const RP = [[150, zF], [-220, zF]];
  const variant = weighted({ slide: 0.45, plow: 0.3, stops: 0.25 });
  const ph = { type: 'moving', triggerS: trig, stopS };
  if (variant === 'slide') {
    const a = spawn(sc, makeCar(pick(CAR_COLORS)), RP, { v: 8, conflictS: 150 - 1.75, tA: tT + T + 0.6 });
    a.onUpdate = (act, dt, t) => { act.yawOff = Math.sin(t * 2.3) * 0.28; };
    Object.assign(ph, { answer: 'stop', hazard: a, crashS: X - 1.35, ok: 'Auto z vedlejší na ledu neubrzdilo a sklouzlo do křižovatky. V zimě počítej s tím, že ostatní nezastaví včas.', bad: 'Auto z vedlejší silnice na ledu nezastavilo. Měl jsi přednost, ale na sněhu musíš předvídat chyby ostatních.' });
  } else if (variant === 'plow') {
    const pv = 7, gap = (v - pv) * (T + 1.4) + 10;
    const pl = spawn(sc, makePlow(), [[1.75, 0], [1.75, Z(4000)]], { s0: trig + gap - pv * tT, v: pv, tv: pv });
    Object.assign(ph, { answer: 'slow', slowTo: 22, endAfterStop: true, crashTitle: 'Náraz do sypače!', ok: 'Před tebou jel pomalý sypač. Zpomalit a držet odstup, na sněhu nepředjížděj.', bad: 'Před tebou jel pomalý sypač. Na sněhu potřebuješ k zastavení mnohem víc místa.' });
    ph.crashCheck = () => P.s + 2.2 >= pl.s - 3.6; ph.static = true; ph.hazard = pl;
  } else {
    const a = spawn(sc, makeCar(pick(CAR_COLORS)), RP, { v: 7, conflictS: 150 - 7.4, tA: tT + T * 0.5, stopAt: 150 - 7.4 }); a.releaseAt = X + 4;
    Object.assign(ph, { answer: 'go', ok: 'Auto z vedlejší včas zastavilo. Na hlavní jsi měl přednost.', bad: 'Auto z vedlejší silnice bezpečně zastavilo. Prudké brzdění na sněhu je zbytečné a nebezpečné.' });
  }
  sc.phases = [ph]; return sc;
}
function scGlare(T) {
  const sc = newScene({ id: 'glare', title: 'Oslnění sluncem', place: 'Silnice u Žatce', env: 'Mimo obec · nízké slunce proti tobě', kmh: 70, fog: 'sunset' });
  const v = sc.v, trig = 70, stopS = trig + decDist(v, T), C = stopS + 7; sc.endS = C + 60;
  buildRural(sc, { len: C + 500 });
  const tT = trig / v;
  const variant = weighted({ cyclist: 0.4, ped: 0.3, clear: 0.3 });
  const ph = { type: 'moving', triggerS: trig, stopS };
  if (variant === 'cyclist') {
    const cv = 5, gap = (v - cv) * (T + 1.5) + 6;
    const c = spawn(sc, makeCyclist({ dark: true }), [[2.6, 0], [2.6, Z(4000)]], { s0: trig + gap - cv * tT, v: cv, tv: cv });
    Object.assign(ph, { answer: 'slow', slowTo: 15, endAfterStop: true, kind: 'vulnerable', ok: 'V protisvětle jel cyklista. Když tě oslní slunce, zpomal a drž si odstup.', bad: 'V oslnění jsi přehlédl cyklistu. Při oslnění musíš snížit rychlost.' });
    ph.crashCheck = () => P.s + 2.2 >= c.s - 1.2;
  } else if (variant === 'ped') {
    const pts = [[-6, Z(C)], [6, Z(C + 1)]];
    const p = spawn(sc, makePerson({ shirt: 0x333333 }), pts, { v: 1.5, conflictS: sNearPts(pts, 1.75, Z(C + 0.6)), tA: tT + T + 0.9 });
    Object.assign(ph, { answer: 'stop', hazard: p, kind: 'vulnerable', crashS: C - 2.7, clear: 2.5, ok: 'V protisvětle přecházel chodec. Při oslnění jeď tak, abys zastavil.', bad: 'Proti slunci jsi přehlédl chodce. Když nevidíš, musíš zpomalit.' });
  } else {
    oncoming(sc, -1.75, trig + v * T * 0.8, 20);
    Object.assign(ph, { answer: 'go', ok: 'Silnice byla volná, jen v protisměru jelo auto. Opatrně pokračuj.', bad: 'Silnice byla volná. Zastavení v plné rychlosti na okresce je nebezpečné.' });
  }
  sc.phases = [ph]; return sc;
}
function scPolice(T) {
  const sc = newScene({ id: 'police', title: 'Policejní kontrola', place: 'Silnice I/3 u Benešova', env: 'Mimo obec · policie u silnice', kmh: 50, fog: 'fields' });
  const v = sc.v, trig = 55, stopS = trig + decDist(v, T), O = stopS + 8; sc.endS = O + 60;
  const G = sc.group;
  buildRural(sc, { len: O + 400 });
  const pc = makePoliceCar(); pc.position.set(5.2, 0, Z(O + 9)); G.add(pc);
  const off = makeOfficer(); off.userData.dynamic = true; off.position.set(3.9, 0, Z(O)); off.rotation.y = Math.PI - 0.35; G.add(off);
  const [la, ra] = off.userData.arms;
  const ph = { type: 'moving', triggerS: trig, stopS };
  if (weighted({ stop: 0.55, wave: 0.45 }) === 'stop') {
    ra.rotation.z = 1.25; ra.rotation.x = -0.4; addPaddle(G, 3.3, 1.95, Z(O) + 0.2, 0);
    Object.assign(ph, { answer: 'stop', endAfterStop: true, ok: 'Policista ukázal zastavovací terč. Na jeho pokyn musíš zastavit.', bad: 'Policista dával terčem znamení k zastavení. Neuposlechnout pokyn policisty je přestupek.' });
  } else {
    addPaddle(G, 4.1, 0.75, Z(O) + 0.05, 0.3);
    tickerObj(sc, t => { la.rotation.z = -1.0 - Math.sin(t * 5) * 0.45; la.rotation.x = -0.3; });
    Object.assign(ph, { answer: 'go', ok: 'Policista mával, ať projedeš. Terč měl dole, kontrola se tě netýkala.', bad: 'Policista pokynem ruky dával znamení, ať pokračuješ. Zbytečně jsi zastavil a zdržel provoz.' });
  }
  sc.phases = [ph]; return sc;
}
function scGarbage(T) {
  const sc = newScene({ id: 'garbage', title: 'Popelářské auto', place: 'Kostelec nad Orlicí', env: 'Obec · stojící popelářský vůz', kmh: 40, fog: 'village' });
  sc.nav = { text: 'Objeď popelářské auto', arrow: '↰' };
  const v = sc.v, trig = 55, stopS = trig + decDist(v, T), V = stopS + 15; sc.endS = V + 60;
  const r = new Route(1.75, 0).line(stopS + 0.5).shift(3.5, 10).line(V + 9 - (stopS + 10.5)).shift(-3.5, 10).line(300).done();
  sc.route = r; sc.navS = stopS + 0.5;
  const G = sc.group;
  buildVillage(sc, { len: V + 300, name: 'Kostelec' });
  const tr = makeGarbageTruck(); tr.position.set(1.75, 0, Z(V)); tr.userData.setBlink('hazard'); tr.userData.setBrake(true); G.add(tr);
  const wk = makePerson({ vest: true, pose: 'static' }); wk.position.set(1.2, 0.6, Z(V - 4.7)); wk.rotation.y = Math.PI; G.add(wk);
  const binM = mat('wastebin', { color: 0x2c6b3a, roughness: 0.7 });
  for (const x of [4.2, 4.9]) B(G, 0.6, 1.05, 0.7, binM, x, 0.67, Z(V + 6));
  const crashS = r.sWhere(s => r.at(s + 2.2).x <= -0.85, stopS);
  const fp = r.at(crashS + 2.2);
  const tT = trig / v;
  const ph = { type: 'moving', triggerS: trig, stopS, crashS };
  const variant = weighted({ worker: 0.35, oncoming: 0.3, clear: 0.35 });
  if (variant === 'worker') {
    const cz = V - 6.2, pts = [[-5.4, Z(cz)], [2.1, Z(cz + 0.8)]];
    const w = makePerson({ vest: true }); B(w, 0.55, 0.95, 0.6, binM, 0, 0.5, -0.55);
    const p = spawn(sc, w, pts, { v: 1.4, conflictS: sNearPts(pts, -1.75, Z(cz)), tA: tT + T + 0.8 });
    const sZ = r.sNear(-1.75, Z(cz));
    Object.assign(ph, { answer: 'stop', hazard: p, kind: 'vulnerable', crashS: sZ - 2.7, ok: 'Popelář přecházel s popelnicí přes silnici. U popelářského vozu počítej s pracovníky v silnici.', bad: 'Kolem popelářského vozu přecházel popelář s popelnicí. Objížděj jen velmi opatrně.' });
    ph.canResume = () => p.s >= p.total - 0.1;
  } else if (variant === 'oncoming') {
    const OP = [[-1.75, Z(V + 400)], [-1.75, Z(-200)]];
    const a = spawn(sc, makeCar(pick(CAR_COLORS)), OP, { v: 11, conflictS: sNearPts(OP, -1.75, fp.z - 2.3), tA: tT + T + 0.6 });
    Object.assign(ph, { answer: 'stop', hazard: a, clear: 7, ok: 'V protisměru jelo auto. Objíždět můžeš, až je protisměr volný.', bad: 'Při objíždění stojícího vozu dáváš přednost protijedoucím.' });
  } else {
    Object.assign(ph, { answer: 'go', ok: 'Protisměr byl volný a nikdo nepřecházel. Opatrně jsi objel popelářský vůz.', bad: 'Cesta kolem vozu byla volná. Mohl jsi pomalu objet.' });
  }
  sc.phases = [ph]; return sc;
}
function buildTramStreet(sc, len, island, TS) {
  const G = sc.group; ground(G, 'city');
  FL(G, 14, len + 40, roadMat('plain'), 0, 0, Z((len - 40) / 2), 7, 12);
  for (const x of [-1.9, 1.9]) for (let s = -40; s < len; s += 6) line(G, x, s + 1.5, 0.12, 3);
  instBoxes(G, [[-0.72, 0.02, Z((len - 40) / 2)], [0.72, 0.02, Z((len - 40) / 2)]], 0.09, 0.02, len + 40, mat('rail', { color: 0x8e8f92, metalness: 0.8, roughness: 0.35, ...layer(5) }));
  for (const sd of [-1, 1]) { sidewalk(G, sd > 0 ? 7 : -10, sd > 0 ? 10 : -7, -40, len, 'x'); rowZ(G, sd, 10.5, -40, len, 0.3); }
  const wp = []; for (let s = -30; s < len; s += 30) for (const sd of [-1, 1]) wp.push([sd * 7.4, 3.6, Z(s)]); instBoxes(G, wp, 0.18, 7.2, 0.18, M.dark);
  B(G, 0.025, 0.025, len + 40, M.black, 0, 6.3, Z((len - 40) / 2), false);
  for (let s = 10; s < len; s += 32) streetLamp(G, 9.2, s, 1);
  if (island) { B(G, 1.3, 0.2, 30, M.curb, 2.0, 0.1, Z(TS - 15)); FL(G, 1.1, 30, pavingMat(), 2.0, 0.205, Z(TS - 15), 1.5, 1.5); addSign(G, 'bus', 2.0, TS - 2, { size: 0.5, h: 1.8 }); }
  else addSign(G, 'bus', 7.6, TS - 2, { size: 0.55 });
}
function scTramStop(T) {
  const sc = newScene({ id: 'tramstop', title: 'Tramvaj v zastávce', place: 'Praha – Vinohradská', env: 'Město · zastávka bez ostrůvku', kmh: 40, fog: 'city' });
  const v = sc.v, trig = 55, stopS = trig + decDist(v, T), TS = stopS + 2.2 + 3 + 31; sc.endS = TS + 50;
  sc.route = new Route(3.5, 0).line(4000).done();
  const variant = weighted({ people: 0.55, leaving: 0.25, island: 0.2 });
  buildTramStreet(sc, TS + 300, variant === 'island', TS);
  const tram = spawn(sc, makeTram(), [[0, Z(TS)], [0, Z(TS + 3000)]], { v: 0, tv: 0, acc: 0.9 });
  const tT = trig / v;
  const ph = { type: 'moving', triggerS: trig, stopS };
  if (variant === 'people') {
    const p1 = [[7.6, Z(TS - 9)], [1.5, Z(TS - 9.4)]];
    const a = spawn(sc, makePerson(), p1, { v: 1.4, conflictS: sNearPts(p1, 3.5, Z(TS - 9.2)), tA: tT + T + 0.8 });
    const p2 = [[1.5, Z(TS - 13)], [7.8, Z(TS - 13.4)]]; spawn(sc, makePerson({ shirt: 0xf1c40f }), p2, { v: 1.3, s0: 0, delay: tT + 0.3 });
    for (let i = 0; i < 2; i++) { const q = makePerson({ pose: 'static' }); q.position.set(1.6, 0, Z(TS - 16 - i)); q.rotation.y = -Math.PI / 2; sc.group.add(q); }
    Object.assign(ph, { answer: 'stop', hazard: a, kind: 'vulnerable', crashS: TS - 9.2 - 2.7, ok: 'Tramvaj stála v zastávce bez ostrůvku a lidé přecházeli k ní. Musíš zastavit za tramvají.', bad: 'U tramvaje stojící v zastávce bez ostrůvku nesmíš projet kolem, když lidé nastupují a vystupují.' });
    ph.canResume = () => { if (P.stopT > 2.6 && tram.tv === 0) tram.tv = 7; return tram.s > 25; };
  } else if (variant === 'leaving') {
    ph.onStart = () => { tram.tv = 7; };
    Object.assign(ph, { answer: 'go', ok: 'Tramvaj zavřela dveře a odjížděla, nikdo nepřecházel. Mohl jsi pokračovat.', bad: 'Tramvaj už odjížděla a nikdo nevystupoval. Zastavení nebylo nutné.' });
  } else {
    for (let i = 0; i < 4; i++) { const q = makePerson({ pose: 'static' }); q.position.set(2.0, 0.2, Z(TS - 8 - i * 3)); q.rotation.y = Math.PI / 2; sc.group.add(q); }
    Object.assign(ph, { answer: 'go', ok: 'Zastávka měla ostrůvek, lidé nevstupovali do tvého pruhu. Mohl jsi opatrně projet.', bad: 'Zastávka měla nástupní ostrůvek. Kolem tramvaje jsi mohl opatrně projet.' });
  }
  sc.phases = [ph]; return sc;
}
function scArrow(T) {
  const sc = newScene({ id: 'arrow', title: 'Zelená šipka', place: 'Praha – Smíchov', env: 'Město · odbočení na šipku', kmh: 35, fog: 'city' });
  sc.nav = { text: 'Odbočíš vpravo', arrow: '→' };
  const v = sc.v, trig = 55, X = trig + decDist(v, T) + 7.5, stopS = X - 7.5;
  const r = new Route(1.75, 0).line(X - 7.5); const sArc = r.len; r.arc(5.75, -Math.PI / 2).line(220).done(); r.limit(sArc - 2, sArc + 9.5, 4.2);
  sc.route = r; sc.navS = sArc; sc.endS = sArc + 9 + 45;
  const G = sc.group;
  buildCity(sc, { len: X + 260, crossS: X }); cityPeds(sc, X, X + 260);
  line(G, 1.75, X - 5, 3.3, 0.45);
  const L1 = makeArrowLight(); L1.position.set(4.2, 0, Z(X - 5.6)); G.add(L1); L1.userData.set('red');
  const C1 = makeTrafficLight(); C1.position.set(-5.6, 0, Z(X - 4.4)); C1.rotation.y = -Math.PI / 2; G.add(C1); C1.userData.set('green');
  const zN = Z(X - 1.75), LP = [[-150, zN], [220, zN]];
  const ph = { type: 'moving', triggerS: trig, stopS, answer: 'stop', ok: 'Na zelenou šipku musíš nejdřív zastavit na čáře.', bad: 'Zelená šipka neznamená volno. Nejdřív musíš zastavit a pak dát přednost.' };
  ph.canResume = () => P.stopT > 0.9;
  const crashS2 = r.sWhere(s => r.at(s + 2.2).x >= 4.6, sArc);
  const fp = r.at(crashS2 + 2.2);
  const ph2 = { type: 'standing', crashS: crashS2 };
  if (vchance(0.55)) {
    const b = spawn(sc, makeCar(pick(CAR_COLORS)), LP, { v: 11, delay: HIDDEN, conflictS: sNearPts(LP, fp.x - 2.4, zN) });
    Object.assign(ph2, { answer: 'stop', hazard: b, clear: 6, ok: 'Zleva jelo auto na zelenou. Na šipku mu musíš dát přednost.', bad: 'Při odbočení na zelenou šipku dáváš přednost vozidlům, která mají zelenou.' });
    ph2.onPrep = () => b.activate(T + 0.7 + 1.1, 11);
  } else {
    const b = spawn(sc, makeCar(pick(CAR_COLORS)), LP, { v: 11, delay: HIDDEN, conflictS: sNearPts(LP, fp.x - 2.4, zN) });
    Object.assign(ph2, { answer: 'go', ok: 'Zleva nic nejelo. Po zastavení jsi mohl odbočit.', bad: 'Zleva bylo volno. Po zastavení jsi mohl na šipku odbočit.' });
    ph2.onPrep = () => b.activate(T + 9, 11);
  }
  sc.phases = [ph, ph2]; return sc;
}
function scFlash(T) {
  const sc = newScene({ id: 'flash', title: 'Blikající žlutá', place: 'Olomouc – Hodolany', env: 'Město · semafory mimo provoz', kmh: 35, fog: 'city' });
  const v = sc.v, trig = 60, stopS = trig + decDist(v, T), X = stopS + 7.2; sc.endS = X + 45;
  const G = sc.group;
  buildCity(sc, { len: X + 260, crossS: X }); cityPeds(sc, X, X + 260);
  const mk = (x, s, r) => { const t = makeTrafficLight(); t.position.set(x, 0, Z(s)); t.rotation.y = r; G.add(t); return t; };
  const lights = [mk(4.2, X - 5.6, 0), mk(-4.2, X + 5.6, Math.PI), mk(5.6, X + 4.4, Math.PI / 2), mk(-5.6, X - 4.4, -Math.PI / 2)];
  tickerObj(sc, t => { const st = (t % 1.2) < 0.6 ? 'yellow' : 'off'; for (const L of lights) if (L.userData.state !== st) L.userData.set(st); });
  const tT = trig / v, zF = Z(X + 1.75), zN = Z(X - 1.75);
  const R = [[150, zF], [-220, zF]], L = [[-150, zN], [220, zN]];
  const variant = weighted({ right: 0.4, left: 0.3, main: 0.3 });
  const ph = { type: 'moving', triggerS: trig, stopS };
  if (variant === 'right') {
    const a = spawn(sc, makeCar(pick(CAR_COLORS)), R, { v: 9.5, conflictS: 150 - 1.75, tA: tT + T + 0.5 });
    Object.assign(ph, { answer: 'stop', hazard: a, crashS: X - 1.35, ok: 'Blikající žlutá znamená, že semafor neřídí. Bez značek platí přednost zprava.', bad: 'Semafory byly mimo provoz a zprava jelo auto. Na neřízené křižovatce má přednost.' });
  } else if (variant === 'left') {
    const b = spawn(sc, makeCar(pick(CAR_COLORS)), L, { v: 9, conflictS: 150 - 7.2, tA: tT + T * 0.55, stopAt: 150 - 7.2 }); b.releaseAt = X + 3;
    Object.assign(ph, { answer: 'go', ok: 'Semafory nesvítily, auto zleva ti dávalo přednost zprava.', bad: 'Auto zleva ti muselo dát přednost. Na blikající žlutou jeď opatrně, ale nemusíš zastavit.' });
  } else {
    addSign(G, 'main', 4.2, X - 5.6, { h: 1.2, noPost: true, size: 0.6 });
    const a = spawn(sc, makeCar(pick(CAR_COLORS)), R, { v: 9, conflictS: 150 - 7.4, tA: tT + T * 0.55, stopAt: 150 - 7.4 }); a.releaseAt = X + 4;
    addSign(G, 'yield', 7.4, X + 5.2, { rot: Math.PI / 2 });
    Object.assign(ph, { answer: 'go', ok: 'Semafor byl mimo provoz, ale pod ním byla značka Hlavní pozemní komunikace. Měl jsi přednost.', bad: 'Při vypnutých semaforech platí značky. Byl jsi na hlavní silnici.' });
  }
  sc.phases = [ph]; return sc;
}
function scOfficer(T) {
  const sc = newScene({ id: 'officer', title: 'Policista na křižovatce', place: 'Brno – Křenová', env: 'Město · pokyny policisty', kmh: 35, fog: 'city' });
  const v = sc.v, trig = 60, stopS = trig + decDist(v, T), X = stopS + 7.2; sc.endS = X + 45;
  const G = sc.group;
  buildCity(sc, { len: X + 260, crossS: X }); cityPeds(sc, X, X + 260);
  line(G, 1.75, X - 5, 3.3, 0.45);
  const mk = (x, s, r) => { const t = makeTrafficLight(); t.position.set(x, 0, Z(s)); t.rotation.y = r; G.add(t); return t; };
  const L1 = mk(4.2, X - 5.6, 0), C1 = mk(5.6, X + 4.4, Math.PI / 2);
  const off = makeOfficer(); off.userData.dynamic = true; off.position.set(-0.3, 0, Z(X)); G.add(off);
  B(G, 0.9, 0.12, 0.9, mat('podium', { color: 0xf2f2f2 }), -0.3, 0.06, Z(X), false);
  const [la, ra] = off.userData.arms;
  const tT = trig / v, zF = Z(X + 1.75), RP = [[150, zF], [-220, zF]];
  const variant = weighted({ front: 0.4, side: 0.35, up: 0.25 });
  const ph = { type: 'moving', triggerS: trig, stopS };
  if (variant === 'front') {
    L1.userData.set('green'); C1.userData.set('red'); off.rotation.y = Math.PI; la.rotation.z = -Math.PI / 2; ra.rotation.z = Math.PI / 2;
    const a = spawn(sc, makeCar(pick(CAR_COLORS)), RP, { v: 9, conflictS: 150 - 1.75, tA: tT + T + 0.5 });
    Object.assign(ph, { answer: 'stop', hazard: a, crashS: X - 1.35, ok: 'Policista k tobě stál čelem s rozpaženýma rukama, to znamená stůj. Jeho pokyn platí i přes zelenou.', bad: 'Policista stál čelem s upaženýma rukama, to znamená stůj. Pokyny policisty mají přednost před semaforem.' });
  } else if (variant === 'side') {
    L1.userData.set('red'); C1.userData.set('green'); off.rotation.y = Math.PI / 2; la.rotation.z = -Math.PI / 2; ra.rotation.z = Math.PI / 2;
    for (const [x, zz] of [[7.4, zF], [13.6, zF]]) { const c = makeCar(pick(CAR_COLORS)); c.position.set(x, 0, zz); c.rotation.y = Math.PI / 2; c.userData.setBrake(true); G.add(c); }
    Object.assign(ph, { answer: 'go', ok: 'Policista k tobě stál bokem, to znamená volno, i když svítí červená. Jeho pokyn má přednost.', bad: 'Policista stál bokem s upaženýma rukama, to pro tebe znamená volno. Pokyn policisty má přednost před semaforem.' });
  } else {
    L1.userData.set('green'); C1.userData.set('red'); off.rotation.y = Math.PI * 0.75; ra.rotation.z = Math.PI;
    Object.assign(ph, { answer: 'stop', ok: 'Zdvižená paže policisty znamená Pozor, stůj! pro všechny.', bad: 'Policista zvedl paži, to znamená Pozor, stůj! Musel jsi zastavit.' });
  }
  sc.phases = [ph]; return sc;
}
const SCENARIOS = [scRight, scMain, scLight, scZebra, scChild, scBus, scRail, scDeer, scJam, scMerge, scStop, scTram, scLeft, scRightTurn, scRound, scNight, scFog, scWorks, scAmbBehind, scMoto, scRain, scSnow, scGlare, scPolice, scGarbage, scTramStop, scArrow, scFlash, scOfficer];

