/* ============================== scenarios: straight roads ============================== */
function scRight(T) {
  const sc = newScene({ id: 'right', title: 'Křižovatka bez značek', place: 'Praha – Vinohrady', env: 'Město · neřízená křižovatka', kmh: 35, fog: 'city' });
  const v = sc.v, trig = 60, stopS = trig + decDist(v, T), X = stopS + 7.2; sc.endS = X + 45;
  buildCity(sc, { len: X + 260, crossS: X }); cityPeds(sc, X, X + 260);
  const tT = trig / v, zF = Z(X + 1.75), zN = Z(X - 1.75);
  const R = [[150, zF], [-220, zF]], L = [[-150, zN], [220, zN]];
  const ph = { type: 'moving', triggerS: trig, stopS, answer: 'stop' };
  const variant = weighted({ right: 0.45, left_yields: 0.33, left_ignores: 0.22 });
  if (variant === 'right') {
    const a = spawn(sc, makeCar(pick(CAR_COLORS)), R, { v: 9.5, conflictS: 150 - 1.75, tA: tT + T + 0.5 });
    Object.assign(ph, { hazard: a, crashS: X - 1.35, ok: 'Na křižovatce bez značek dáváš přednost vozidlům přijíždějícím zprava.', bad: 'Zprava přijíždělo auto. Na neřízené křižovatce mělo přednost ono.' });
    if (vchance(0.5)) { const b = spawn(sc, makeCar(pick(CAR_COLORS)), L, { v: 9, conflictS: 150 - 7.2, tA: tT + T * 0.5, stopAt: 150 - 7.2 }); b.releaseAt = X + 3; }
  } else if (variant === 'left_yields') {
    const b = spawn(sc, makeCar(pick(CAR_COLORS)), L, { v: 9, conflictS: 150 - 7.2, tA: tT + T * 0.55, stopAt: 150 - 7.2 }); b.releaseAt = X + 3;
    Object.assign(ph, { answer: 'go', ok: 'Auto zleva ti dává přednost, protože ty pro něj přijíždíš zprava.', bad: 'Auto zleva čekalo na tebe. Zbytečné zastavení zdržuje a mate ostatní řidiče.' });
  } else {
    const a = spawn(sc, makeCar(pick(CAR_COLORS)), L, { v: 10.5, conflictS: 150 + 1.75, tA: tT + T + 0.45 });
    Object.assign(ph, { hazard: a, crashS: X - 4.85, ok: 'Auto zleva nezpomalovalo. Přednost jsi měl ty, ale nehodě musíš předejít.', bad: 'Auto zleva přednost nedalo. Platí princip omezené důvěry: počítej s chybou ostatních.' });
  }
  sc.phases = [ph]; return sc;
}
function scMain(T) {
  const sc = newScene({ id: 'main', title: 'Hlavní silnice', place: 'Brno – Žabovřesky', env: 'Město · jedeš po hlavní', kmh: 50, fog: 'city' });
  const v = sc.v, trig = 55, stopS = trig + decDist(v, T), X = stopS + 7.2; sc.endS = X + 45;
  buildCity(sc, { len: X + 260, crossS: X, panel: 0.3 }); cityPeds(sc, X, X + 260);
  addSign(sc.group, 'main', 4.6, X - 30);
  addSign(sc.group, 'yield', 7.4, X + 5.2, { rot: Math.PI / 2 }); addSign(sc.group, 'yield', -7.4, X - 5.2, { rot: -Math.PI / 2 });
  for (let i = 0; i < 6; i++) { line(sc.group, 4.6, X + 0.3 + i * 0.6, 0.4, 0.3); line(sc.group, -4.6, X - 0.3 - i * 0.6, 0.4, 0.3); }
  const tT = trig / v, zF = Z(X + 1.75), zN = Z(X - 1.75);
  const R = [[150, zF], [-220, zF]], L = [[-150, zN], [220, zN]];
  const ph = { type: 'moving', triggerS: trig, stopS };
  const w = spawn(sc, makeCar(pick(CAR_COLORS)), L, { s0: 150 - 7.2, v: 0, tv: 0, stopAt: 150 - 7.2 }); w.releaseAt = X + 4;
  if (vchance(0.62)) {
    const a = spawn(sc, makeCar(pick(CAR_COLORS)), R, { v: 9.5, conflictS: 150 - 7.2, tA: tT + T * 0.6, stopAt: 150 - 7.2 }); a.releaseAt = X + 4;
    Object.assign(ph, { answer: 'go', ok: 'Jedeš po hlavní silnici. Auto z vedlejší ti dává přednost.', bad: 'Auto z vedlejší silnice brzdilo a čekalo. Na hlavní máš přednost, zbytečně jsi zastavil.' });
  } else {
    const a = spawn(sc, makeCar(pick(CAR_COLORS)), R, { v: 8.5, conflictS: 150 - 1.75, tA: tT + T + 0.45 });
    Object.assign(ph, { answer: 'stop', hazard: a, crashS: X - 1.35, ok: 'Auto z vedlejší nebrzdilo. I na hlavní silnici musíš sledovat ostatní.', bad: 'Auto z vedlejší silnice ti nedalo přednost. Přednost v jízdě neznamená, že ti nikdo nevjede do cesty.' });
  }
  sc.phases = [ph]; return sc;
}
function scLight(T) {
  const sc = newScene({ id: 'light', title: 'Semafor', place: 'Ostrava – centrum', env: 'Město · řízená křižovatka', kmh: 50, fog: 'city' });
  const v = sc.v, trig = 55, stopS = trig + decDist(v, T), X = stopS + 7.2; sc.endS = X + 45;
  const G = sc.group;
  buildCity(sc, { len: X + 260, crossS: X, panel: 0.35 }); cityPeds(sc, X, X + 260);
  line(G, 1.75, X - 5, 3.3, 0.45); line(G, -1.75, X + 5, 3.3, 0.45); line(G, 5.2, X + 1.75, 0.45, 3.3); line(G, -5.2, X - 1.75, 0.45, 3.3);
  zebra(G, 0, X - 6.8, false, 7, 3); zebra(G, 0, X + 6.8, false, 7, 3);
  const mk = (x, s, r) => { const t = makeTrafficLight(); t.position.set(x, 0, Z(s)); t.rotation.y = r; G.add(t); return t; };
  const L1 = mk(4.2, X - 5.6, 0), L2 = mk(-4.2, X + 5.6, Math.PI), C1 = mk(5.6, X + 4.4, Math.PI / 2), C2 = mk(-5.6, X - 4.4, -Math.PI / 2);
  const ours = st => { L1.userData.set(st); L2.userData.set(st); sc.ours = st; };
  const cross = st => { C1.userData.set(st); C2.userData.set(st); };
  ours('green'); cross('red');
  const tT = trig / v, zF = Z(X + 1.75), zN = Z(X - 1.75);
  const variant = weighted({ green: 0.38, red: 0.32, ambulance: 0.3 });
  const ph = { type: 'moving', triggerS: trig, stopS };
  const LP = [[-150, zN], [220, zN]], RP = [[150, zF], [-220, zF]];
  const wl = spawn(sc, makeCar(pick(CAR_COLORS)), LP, { s0: 150 - 8.2, v: 0, tv: 0, stopAt: 150 - 8.2 });
  const wl2 = spawn(sc, makeCar(pick(CAR_COLORS)), LP, { s0: 150 - 14.4, v: 0, tv: 0, stopAt: 150 - 14.4 }); wl2.leader = wl;
  let wr = null, wr2 = null;
  if (variant !== 'ambulance') { wr = spawn(sc, makeCar(pick(CAR_COLORS)), RP, { s0: 150 - 8.2, v: 0, tv: 0, stopAt: 150 - 8.2 }); wr2 = spawn(sc, makeCar(pick(CAR_COLORS)), RP, { s0: 150 - 14.4, v: 0, tv: 0, stopAt: 150 - 14.4 }); wr2.leader = wr; }
  if (variant === 'green') {
    Object.assign(ph, { answer: 'go', ok: 'Zelená a křižovatka je volná. Plynule pokračuj.', bad: 'Svítila zelená a nic nehrozilo. Zastavení na zelenou může způsobit nehodu zezadu.' });
  } else if (variant === 'red') {
    wr.conflictS = 150 - 1.75;
    Object.assign(ph, { answer: 'stop', hazard: wr, crashS: X - 1.35, ok: 'Na žlutou máš zastavit, pokud to jde bezpečně. Tady to šlo.', bad: 'Naskočila žlutá a pak červená. Vjel jsi do cesty autům, která dostala zelenou.' });
    ph.canResume = () => sc.ours === 'green';
    ph.onStart = () => {
      ours('yellow'); sc.after(1.0, () => ours('red')); sc.after(2.6, () => cross('redyellow'));
      sc.after(3.4, () => { cross('green'); if (sc.pending !== ph) { wr.release(9); sc.after(1.4, () => wr2.release(9)); } sc.after(0.8, () => wl.release(9)); sc.after(2.2, () => wl2.release(9)); });
      sc.after(8.6, () => cross('yellow')); sc.after(9.6, () => cross('red')); sc.after(10.4, () => ours('redyellow')); sc.after(11.4, () => ours('green'));
    };
  } else {
    const amb = spawn(sc, makeVan(0xe3e63a, true), [[-260, zF], [260, zF]], { v: 13.5, conflictS: 260 + 1.75, tA: tT + T + 0.6 });
    sc.siren = amb;
    Object.assign(ph, { answer: 'stop', hazard: amb, crashS: X - 1.35, clear: 9, ok: 'Vozidlo s modrým majákem a sirénou má přednost, i když máš zelenou.', bad: 'Zleva jela sanitka s majákem a sirénou. Té musíš dát přednost i na zelenou.' });
  }
  sc.phases = [ph]; return sc;
}
function scZebra(T) {
  const sc = newScene({ id: 'zebra', title: 'Přechod pro chodce', place: 'Plzeň – Slovany', env: 'Město · přechod', kmh: 40, fog: 'city' });
  const v = sc.v, trig = 55, stopS = trig + decDist(v, T), Zs = stopS + 4.2; sc.endS = Zs + 50;
  const G = sc.group;
  buildCity(sc, { len: Zs + 260, crossS: null, noTreeAt: [Zs] }); cityPeds(sc, null, Zs - 20);
  zebra(G, 0, Zs, false, 7, 4);
  addSign(G, 'crosswalk', 4.4, Zs - 2.6); addSign(G, 'crosswalk', -4.4, Zs + 2.6, { rot: Math.PI });
  const tT = trig / v;
  const ph = { type: 'moving', triggerS: trig, stopS, kind: 'vulnerable', crashS: Zs - 2.7 };
  const variant = weighted({ right_ped: 0.4, oncoming: 0.3, away: 0.3 });
  if (variant === 'right_ped' || variant === 'away') {
    const pts = variant === 'right_ped' ? [[5.2, Z(Zs - 14)], [5.2, Z(Zs)], [-5.5, Z(Zs)], [-5.5, Z(Zs + 30)]] : [[5.2, Z(Zs - 14)], [5.2, Z(Zs + 40)]];
    const p = spawn(sc, makePerson(), pts, { v: 1.45, conflictS: 14 + 3.45, tA: tT + T + 0.9 }); p.y = 0.15;
    if (variant === 'right_ped') Object.assign(ph, { answer: 'stop', hazard: p, clear: 4.4, ok: 'Chodec šel k přechodu a vstoupil na něj. Musíš mu umožnit přejít.', bad: 'Chodec vstoupil na přechod. Řidič musí chodci na přechodu umožnit bezpečné přejití.' });
    else Object.assign(ph, { answer: 'go', ok: 'Chodec šel kolem přechodu dál po chodníku. Mohl jsi plynule pokračovat.', bad: 'Chodec přechod nepoužil, šel dál po chodníku. Zastavení nebylo potřeba.' });
    if (variant === 'away') { const q = spawn(sc, makePerson(), [[-5.6, Z(Zs + 3)], [-5.6, Z(Zs + 3.1)]], { v: 0 }); q.y = 0.15; }
  } else {
    const car = spawn(sc, makeCar(pick(CAR_COLORS)), [[-1.75, Z(Zs + 150)], [-1.75, Z(-80)]], { v: 11, conflictS: 150 - 4.6, tA: tT + T * 0.25, stopAt: 150 - 4.6 });
    const pts = [[-5.4, Z(Zs + 8)], [-5.4, Z(Zs)], [5.6, Z(Zs)], [5.6, Z(Zs - 30)]];
    const p = spawn(sc, makePerson({ shirt: 0xf1c40f }), pts, { v: 1.6, conflictS: 8 + 7.15, tA: tT + T + 1.3 });
    sc.update = () => { if (car.stopAt != null && p.s > 8 + 9.6) car.release(10); };
    Object.assign(ph, { answer: 'stop', hazard: p, clear: 2.6, ok: 'Protijedoucí auto zastavilo před přechodem. To je signál, že někdo přechází.', bad: 'Protijedoucí auto zastavilo kvůli chodci. Chodec pak vešel do tvého pruhu.' });
  }
  sc.phases = [ph]; return sc;
}
function scChild(T) {
  const sc = newScene({ id: 'child', title: 'Vesnická ulice', place: 'Horní Lhota', env: 'Obec · zaparkovaná auta', kmh: 50, fog: 'village' });
  const v = sc.v, trig = 55, stopS = trig + decDist(v, T), C = stopS + 6.5; sc.endS = C + 50;
  const G = sc.group;
  buildVillage(sc, { len: C + 300, name: 'Horní Lhota', churchS: C + 160 });
  addSign(G, 'children', 4.4, trig - 22);
  for (const s of [C + 3.6, C - 3.4, C - 10, C + 18, C - 40]) { const c = makeCar(pick(CAR_COLORS)); c.position.set(4.15, 0, Z(s)); G.add(c); }
  oncoming(sc, -1.75, trig - 25, 13);
  const tT = trig / v;
  const ph = { type: 'moving', triggerS: trig, stopS, kind: 'vulnerable', crashS: C - 2.7 };
  const variant = weighted({ ball_child: 0.5, ball_only: 0.15, garden: 0.35 });
  if (variant !== 'garden') {
    const d0 = tT + rand(0.3, 0.8);
    spawn(sc, makeBall(), [[5.6, Z(C)], [-9, Z(C + 0.8)]], { v: 4.2, delay: d0, conflictS: 3.85 });
    if (variant === 'ball_child') {
      const kid = spawn(sc, makePerson({ child: true, shirt: 0xe67e22 }), [[6.3, Z(C - 0.3)], [-6, Z(C + 0.4)], [-9, Z(C + 6)]], { v: 3.2, delay: d0 + 0.65, conflictS: 4.55 });
      Object.assign(ph, { answer: 'stop', hazard: kid, clear: 5, ok: 'Za míčem vyběhlo dítě. Na míč reaguj jako na dítě.', bad: 'Za míčem vyběhlo dítě. Kde se objeví míč, tam počítej s dítětem.' });
    } else {
      Object.assign(ph, { answer: 'stop', hazard: null, kind: null, ok: 'Tentokrát za míčem nikdo nevyběhl, ale brzdit bylo správně.', bad: 'Za míčem často vybíhá dítě. Tentokrát nevyběhlo, ale bez brzdění to byla hazardní jízda.' });
      ph.canResume = () => P.stopT > 1.2;
    }
  } else {
    for (let i = 0; i < 2; i++) spawn(sc, makePerson({ child: true }), [[10.5 + i, Z(C - 4)], [10.5 + i, Z(C + 4)], [12 + i, Z(C + 4)], [12 + i, Z(C - 4)], [10.5 + i, Z(C - 4)], [10.5 + i, Z(C + 4)], [12 + i, Z(C + 4)], [12 + i, Z(C - 4)]], { s0: i * 5, v: 1.6 });
    const b = makeBall(); b.position.set(11.5, 0, Z(C + 1)); G.add(b);
    Object.assign(ph, { answer: 'go', ok: 'Děti si hrály za plotem na zahradě. Silnice zůstala volná.', bad: 'Děti byly za plotem a do silnice vběhnout nemohly. Zastavení nebylo nutné.' });
  }
  sc.phases = [ph]; return sc;
}
function scBus(T) {
  const sc = newScene({ id: 'bus', title: 'Autobusová zastávka', place: 'Stará Ves', env: 'Obec · zastávka autobusu', kmh: 50, fog: 'village' });
  const v = sc.v, trig = 55, base = trig + decDist(v, T); const G = sc.group;
  const variant = weighted({ blinker: 0.45, boarding: 0.3, runner: 0.25 });
  const Bs = variant === 'runner' ? base - 2.5 : base + 12.5;
  sc.endS = Bs + 70;
  buildVillage(sc, { len: Bs + 300, name: 'Stará Ves', bay: [Bs - 14, Bs + 10] });
  const sh = new THREE.Group(); RB(sh, 1.7, 0.12, 4.6, 0.04, M.dark, 0, 2.55, 0); B(sh, 0.05, 2.4, 4.2, mat('shelterglass', { color: 0x9fb8c8, transparent: true, opacity: 0.35, roughness: 0.1 }), 0.75, 1.3, 0, false); bench(sh, 0.4, 0, Math.PI / 2); sh.position.set(8.2, 0, Z(Bs)); sh.children.at(-1).position.set(0.3, 0.15, 0); G.add(sh);
  addSign(G, 'bus', 7.3, Bs + 7, { size: 0.6 });
  for (let i = 0; i < 3; i++) { const p = makePerson(); p.position.set(rand(7.2, 8.4), 0.15, Z(Bs + rand(-2, 2))); p.rotation.y = -Math.PI / 2; G.add(p); }
  const tT = trig / v;
  const busObj = makeBus();
  const bus = spawn(sc, busObj, [[5.15, Z(Bs)], [5.15, Z(Bs + 2)], [1.75, Z(Bs + 15)], [1.75, Z(Bs + 500)]], { v: 0, tv: 0, acc: 1.8 });
  oncoming(sc, -1.75, trig - 25, 13);
  const ph = { type: 'moving', triggerS: trig };
  if (variant === 'blinker') {
    busObj.userData.setBlink('left');
    Object.assign(ph, { answer: 'stop', stopS: Bs - 12.5, hazard: bus, static: true, fallbackS: Bs + 20, ok: 'Autobus dával znamení o změně směru. V obci mu musíš umožnit vyjet ze zastávky.', bad: 'Autobus blikal a vyjížděl. V obci musíš autobusu umožnit vyjetí ze zastávky.' });
    bus.acc = 1.0; sc.update = (dt, t) => { if (t > tT - 1.0 && bus.tv === 0) bus.tv = 8; };
    ph.crashCheck = () => { const p = bus.pos, sB = -p.z; return p.x < 3.5 && P.s + 2.2 >= sB - 6.2 && P.s - 2.2 <= sB + 6; };
    ph.canResume = () => bus.s > 32;
  } else {
    busObj.userData.openDoors();
    if (variant === 'boarding') {
      Object.assign(ph, { answer: 'go', stopS: Bs - 12.5, ok: 'Autobus stál, nastupovalo se a blinkr nesvítil. Mohl jsi opatrně projet.', bad: 'Autobus nedával znamení k vyjetí. Zastavení nebylo nutné.' });
    } else {
      const p = spawn(sc, makePerson({ shirt: 0x2e86c1 }), [[4.0, Z(Bs + 6.9)], [-6, Z(Bs + 7.6)]], { v: 2.8, delay: tT + rand(0.35, 0.9), conflictS: 2.25 });
      Object.assign(ph, { answer: 'stop', stopS: Bs + 2.5, kind: 'vulnerable', hazard: p, crashS: Bs + 7 - 2.7, clear: 4.5, ok: 'Zpoza stojícího autobusu vyběhl chodec. U stojícího autobusu buď připraven brzdit.', bad: 'Zpoza autobusu vyběhl člověk. Lidé po vystoupení často přebíhají před autobusem.' });
    }
  }
  sc.phases = [ph]; return sc;
}
function scRail(T) {
  const sc = newScene({ id: 'rail', title: 'Železniční přejezd', place: 'Přejezd u Kolína', env: 'Silnice mimo obec · přejezd', kmh: 50, fog: 'fields' });
  const v = sc.v, trig = 55, stopS = trig + decDist(v, T), R = stopS + 8.2; sc.endS = R + 50;
  const G = sc.group;
  buildRural(sc, { len: R + 400, rail: R }); addRail(sc, R);
  line(G, 1.75, R - 6, 3.3, 0.45);
  const s1 = makeRailSignal(); s1.position.set(4.5, 0, Z(R - 6.3)); G.add(s1);
  const s2 = makeRailSignal(); s2.position.set(-4.5, 0, Z(R + 6.3)); s2.rotation.y = Math.PI; G.add(s2);
  const sig = m => { s1.userData.mode = s2.userData.mode = m; sc.sig = m; };
  oncoming(sc, -1.75, trig - 30, 14);
  const tT = trig / v, zR = Z(R);
  const variant = weighted({ red_train: 0.45, red_late: 0.2, white: 0.35 });
  const ph = { type: 'moving', triggerS: trig, stopS };
  const mkTrain = (dir, opts) => { const pts = dir > 0 ? [[-500, zR], [900, zR]] : [[500, zR], [-900, zR]]; const c = dir > 0 ? 501.75 : 498.25; return spawn(sc, makeTrain(), pts, { y: 0.26, conflictS: c, maxV: 42, ...opts }); };
  sc.trains = [];
  if (variant === 'white') {
    sig('white');
    Object.assign(ph, { answer: 'go', ok: 'Přerušované bílé světlo znamená, že smíš přejezd opatrně přejet.', bad: 'Svítilo bílé přerušované světlo, které dovoluje jet. Zastavení nebylo nutné.' });
    sc.phases = [ph];
  } else {
    sig('red');
    const dir = vchance(0.5) ? 1 : -1;
    const tr = mkTrain(dir, { v: 25, tA: tT + T + (variant === 'red_late' ? 3.4 : rand(0.8, 1.6)) }); sc.trains.push(tr);
    Object.assign(ph, { answer: 'stop', hazard: tr, crashS: R - 3.8, crashTitle: 'Srážka s vlakem!', ok: variant === 'red_late' ? 'Červená bliká, i když vlak zatím nevidíš. Před přejezdem musíš zastavit.' : 'Červená světla blikají a jede vlak. Zastavit před přejezdem.', bad: 'Výstražník blikal červeně. Na přerušované červené světlo nesmíš na přejezd vjet.' });
    ph.canResume = () => tr.s > tr.conflictS + 66;
    const second = vchance(0.4);
    const tr2 = second ? mkTrain(-dir, { v: 24, delay: HIDDEN }) : null; if (tr2) sc.trains.push(tr2);
    const ph2 = { type: 'standing', crashS: R - 3.8, crashTitle: 'Srážka s vlakem!' };
    if (second) {
      Object.assign(ph2, { answer: 'stop', hazard: tr2, ok: 'Červená blikala dál. Z druhé strany jel další vlak.', bad: 'Po průjezdu vlaku blikala červená dál. Přijížděl druhý vlak z opačného směru.' });
      ph2.onPrep = () => tr2.activate(T + 0.7 + 1.2, 24);
      ph2.canResume = () => tr2.s > tr2.conflictS + 66;
      ph2.onResume = () => sig('white');
    } else {
      Object.assign(ph2, { answer: 'go', ok: 'Vlak projel a výstražník přepnul na bílé světlo. Můžeš jet.', bad: 'Svítilo bílé světlo a trať byla volná. Zbytečně dlouhé čekání zdržuje.' });
      ph2.onPrep = () => sig('white');
    }
    sc.phases = [ph, ph2];
  }
  sc.update = (dt, t) => {
    if (sc.sig === 'red' && P.s > R - 220) { sc.bellT = (sc.bellT || 0) - dt; if (sc.bellT <= 0) { sc.bellT = 0.55; AU.bell(Math.max(0.15, 1 - (R - P.s) / 220)); } }
    for (const tr of sc.trains) { if (!tr.horned && tr.started && Math.abs(tr.pos.x) < 330) { tr.horned = true; AU.horn(); } }
  };
  return sc;
}
function scDeer(T) {
  const sc = newScene({ id: 'deer', title: 'Lesní úsek', place: 'Šumava – silnice II/169', env: 'Mimo obec · les', kmh: 90, fog: 'forest' });
  const v = sc.v, trig = 60, stopS = trig + decDist(v, T), Ds = stopS + 7; sc.endS = Ds + 60;
  const G = sc.group;
  const variant = weighted({ deer: 0.6, none: 0.4 });
  buildRural(sc, { len: Ds + 400, forest: true, clearing: variant === 'none' ? [Ds - 40, Ds + 40] : null });
  addSign(G, 'deer', 4.6, trig - 40);
  oncoming(sc, -1.75, trig - 40, 22);
  const tT = trig / v;
  const ph = { type: 'moving', triggerS: trig, stopS, crashS: Ds - 2.8, crashTitle: 'Srážka se zvěří!' };
  if (variant === 'deer') {
    const p1 = [[13, Z(Ds - 2)], [-15, Z(Ds + 2)]];
    const d1 = spawn(sc, makeDeer(1), p1, { v: 7, conflictS: sNearPts(p1, 1.75, Z(Ds - 0.4)), tA: tT + T + rand(0.3, 0.7) });
    Object.assign(ph, { answer: 'stop', hazard: d1, ok: 'Z lesa vyběhl jelen. Brzdit a nestrhávat volant.', bad: 'Z lesa vyběhl jelen. Na úsecích se značkou „Zvěř“ jeď s připraveností brzdit.' });
    ph.canResume = () => d1.pos.x < -4;
    const p2 = [[14, Z(Ds - 1)], [-15, Z(Ds + 3)]];
    const second = vchance(0.55);
    const d2 = second ? spawn(sc, makeDeer(0.85), p2, { v: 7.5, delay: HIDDEN, conflictS: sNearPts(p2, 1.75, Z(Ds + 0.6)) }) : null;
    const ph2 = { type: 'standing', crashS: Ds - 2.8, crashTitle: 'Srážka se zvěří!' };
    if (second) {
      Object.assign(ph2, { answer: 'stop', hazard: d2, ok: 'Za prvním kusem běžel další. Zvěř se pohybuje ve skupinách.', bad: 'Za jelenem vyběhla laň. Po prvním zvířeti vždy počítej s dalšími.' });
      ph2.onStart = () => sc.after(rand(0.3, 0.8), () => { if (!d2.started) d2.activate(null, 7.5); });
      ph2.canResume = () => d2.pos.x < -4;
    } else {
      Object.assign(ph2, { answer: 'go', ok: 'Silnice je volná, můžeš se opatrně rozjet.', bad: 'Nic dalšího nevyběhlo. Dlouhé stání v lese na silnici ohrožuje ostatní.' });
    }
    sc.phases = [ph, ph2];
  } else {
    for (let i = 0; i < 2; i++) { const d = makeDeer(i ? 0.85 : 1); d.position.set(-rand(22, 34), 0, Z(Ds + rand(-15, 15))); d.rotation.y = rand(0, 6); G.add(d); }
    Object.assign(ph, { answer: 'go', ok: 'Srnky se pásly daleko na mýtině. Silnice byla volná.', bad: 'Zvěř stála daleko na mýtině. Prudké brzdění bez důvodu může způsobit nehodu zezadu.' });
    sc.phases = [ph];
  }
  return sc;
}
function scJam(T) {
  const sc = newScene({ id: 'jam', title: 'Dálnice', place: 'Dálnice D1 – km 112', env: 'Dálnice · hustý provoz', kmh: 130, fog: 'hwy' });
  sc.q = 'Brzdit, nebo jet?';
  const v = sc.v, trig = 80, stopS = trig + decDist(v, T), LS = stopS + 7.8; const G = sc.group;
  buildHighway(sc, { len: LS + 700, gantryS: trig + 30, gantryText: 'Brno|98;Jihlava|12' });
  const variant = weighted({ brake: 0.4, reveal: 0.25, clear: 0.35 });
  const leadTrig = LS - 95, lc0 = leadTrig + 10;
  const leadObj = makeCar(pick(CAR_COLORS));
  const pts = variant === 'brake' ? [[1.75, 0], [1.75, Z(6000)]] : [[1.75, 0], [1.75, Z(lc0)], [-1.75, Z(lc0 + 45)], [-1.75, Z(6000)]];
  const lead = spawn(sc, leadObj, pts, { s0: leadTrig - trig, v, tv: v });
  const ph = { type: 'moving', triggerS: trig, stopS };
  const jamCar = (x, s) => { const c = makeCar(pick(CAR_COLORS)); c.position.set(x, 0, Z(s)); c.userData.setBlink('hazard'); c.userData.setBrake(true); G.add(c); return c; };
  if (variant === 'brake') {
    for (let i = 1; i <= 6; i++) { jamCar(1.75, LS + i * 7.4); jamCar(-1.75, LS + 3 + i * 7.6); }
    Object.assign(ph, { answer: 'stop', hazard: lead, static: true, endAfterStop: true, ok: 'Před tebou kolona. Brzdi včas a zapni výstražná světla. V koloně vytvoř uličku pro záchranáře.', bad: 'Auto před tebou prudce brzdilo do kolony. Na dálnici drž odstup alespoň 2 sekundy.' });
    ph.onStart = () => { lead.stopAt = LS; };
    ph.crashCheck = () => P.s + 2.2 >= lead.s - 2.3;
    sc.update = () => { if (lead.v < 0.1 && lead.stopAt != null) leadObj.userData.setBlink('hazard'); };
  } else if (variant === 'reveal') {
    leadObj.userData.setBlink('left');
    jamCar(1.75, LS); jamCar(1.55, LS + 6.5).rotation.y = 0.5; addSign(G, 'warnTri', 1.75, LS - 22, { size: 0.55, h: 0.0, noPost: true });
    for (let i = 0; i < 4; i++) jamCar(1.75, LS + 14 + i * 7.4);
    Object.assign(ph, { answer: 'stop', endAfterStop: true, ok: 'Auto před tebou uhnulo a odhalilo nehodu v tvém pruhu. Rychlá reakce!', bad: 'Auto před tebou na poslední chvíli uhnulo a v pruhu stála nehoda. Nedívej se jen na auto před sebou.' });
    ph.crashCheck = () => P.s + 2.2 >= LS - 2.3;
    ph.static = true; ph.hazard = null; ph.fallbackS = LS + 10;
  } else {
    leadObj.userData.setBlink('left');
    lead.tv = v + 4;
    for (let i = 0; i < 3; i++) spawn(sc, makeCar(pick(CAR_COLORS)), [[pick([1.75, -1.75]), Z(LS + 200 + i * 90)], [1.75, Z(9000)]], { v: v + 1 });
    Object.assign(ph, { answer: 'go', slowTo: 60, ok: 'Auto před tebou přejelo do levého pruhu a cesta je volná. Plynule pokračuj.', bad: 'Silnice byla volná. Prudké brzdění na dálnici bez důvodu hrozí nárazem zezadu.' });
  }
  sc.endS = LS + 60;
  sc.phases = [ph]; return sc;
}
function scMerge(T) {
  const sc = newScene({ id: 'merge', title: 'Připojovací pruh', place: 'Dálnice D1 – nájezd Humpolec', env: 'Dálnice · připojování', kmh: 110, fog: 'hwy' });
  sc.q = 'Brzdit, nebo jet?';
  const v = sc.v, trig = 70, mv = 20, tT = trig / v;
  const gap = (v - mv) * (T + 1.6) + 10;
  const mS0 = trig + gap + mv * 0.5;
  buildHighway(sc, { len: mS0 + 700, ramp: [20, mS0 + 90], gantryS: mS0 + 220, gantryText: 'Praha|98;Humpolec|1' });
  const variant = weighted({ cutin: 0.5, yields: 0.5 });
  const base = mS0 - 400;
  const mc = makeCar(pick(CAR_COLORS));
  const pts = variant === 'cutin' ? [[5.25, Z(base)], [5.25, Z(mS0)], [1.75, Z(mS0 + 30)], [1.75, Z(mS0 + 6000)]] : [[5.25, Z(base)], [5.25, Z(mS0 + 85)]];
  const a = spawn(sc, mc, pts, { s0: (trig + gap - mv * tT) - base, v: mv, tv: mv });
  const ph = { type: 'moving', triggerS: trig, stopS: trig + decDist(v, T), slowTo: 65 };
  if (variant === 'cutin') {
    if (vchance(0.5)) mc.userData.setBlink('left');
    a.onUpdate = act => { if (act.s > 400 + 80) { act.tv = 33; act.acc = 2; } };
    Object.assign(ph, { answer: 'slow', hazard: a, static: true, fallbackS: mS0 + 120, ok: 'Auto z připojovacího pruhu se vecpalo před tebe. Přibrzdit a pustit ho bylo správné.', bad: 'Řidič z připojovacího pruhu ti nedal přednost a ty jsi nepřibrzdil.' });
    ph.crashCheck = () => { const p = a.pos, sW = -p.z; return p.x < 3.3 && P.s + 2.2 >= sW - 2.25 && P.s - 2.2 <= sW + 2.25; };
    ph.canResume = () => a.pos.x < 2 && P.stopT > 0.8;
  } else {
    mc.userData.setBlink('left');
    Object.assign(ph, { answer: 'go', ok: 'Na dálnici máš přednost. Řidič z připojovacího pruhu zpomalil a počká.', bad: 'Auto na připojovacím pruhu zpomalovalo a dávalo ti přednost. Brzdění bylo zbytečné.' });
    ph.onStart = () => { a.tv = 13; a.dec = 3; };
  }
  sc.endS = mS0 + 140;
  sc.phases = [ph]; return sc;
}
function scStop(T) {
  const sc = newScene({ id: 'stop', title: 'Značka STOP', place: 'Dolní Bukovany', env: 'Obec · omezený výhled', kmh: 40, fog: 'village' });
  const v = sc.v, trig = 55, stopS = trig + decDist(v, T), X = stopS + 7.2; sc.endS = X + 45;
  const G = sc.group;
  buildVillage(sc, { len: X + 260, crossS: X, walls: true, name: 'Dolní Bukovany', churchS: X + 120 });
  addSign(G, 'stop', 4.4, X - 5.8); line(G, 1.75, X - 5, 3.3, 0.5);
  addSign(G, 'main', -5.6, X + 5.6, { rot: -Math.PI / 2 }); addSign(G, 'main', 5.6, X - 5.7, { rot: Math.PI / 2 });
  const tT = trig / v, zF = Z(X + 1.75), zN = Z(X - 1.75);
  const LP = [[-150, zN], [220, zN]], RP = [[150, zF], [-220, zF]];
  const ph = { type: 'moving', triggerS: trig, stopS, answer: 'stop' };
  if (vchance(0.7)) {
    const a = spawn(sc, makeCar(pick(CAR_COLORS)), LP, { v: 12, conflictS: 150 + 1.75, tA: tT + T + 0.7 });
    Object.assign(ph, { hazard: a, crashS: X - 4.85, ok: 'Značka STOP znamená vždy zastavit na čáře. Zleva navíc jelo auto.', bad: 'Projel jsi STOP a vjel do cesty autu na hlavní. U značky STOP musíš vždy zastavit.' });
  } else {
    Object.assign(ph, { ok: 'Značka STOP znamená vždy zastavit na čáře, i když nic nejede.', bad: 'Značka STOP znamená vždy zastavit. Projetí je přestupek, i když zrovna nic nejelo.' });
    ph.canResume = () => P.stopT > 1.2;
  }
  const ph2 = { type: 'standing' };
  if (vchance(0.5)) {
    const b = spawn(sc, makeCar(pick(CAR_COLORS)), RP, { v: 12, delay: HIDDEN, conflictS: 150 - 1.75 });
    Object.assign(ph2, { answer: 'stop', hazard: b, crashS: X - 1.35, clear: 7, ok: 'Zprava jelo auto po hlavní. Počkat bylo správně.', bad: 'Zprava jelo auto po hlavní silnici a ty jsi mu vjel do cesty.' });
    ph2.onPrep = () => b.activate(T + 0.7 + 0.9, 12);
  } else {
    const b = spawn(sc, makeCar(pick(CAR_COLORS)), LP, { v: 12, delay: HIDDEN, conflictS: 150 + 1.75 });
    Object.assign(ph2, { answer: 'go', ok: 'Hlavní silnice je volná, auto zleva je daleko. Můžeš jet.', bad: 'Hlavní byla volná, auto zleva bylo hodně daleko. Dlouhé váhání u STOP zdržuje.' });
    ph2.onPrep = () => b.activate(T + 9, 12);
  }
  sc.phases = [ph, ph2]; return sc;
}

