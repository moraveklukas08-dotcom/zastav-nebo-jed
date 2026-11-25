/* ============================== audio ============================== */
const AU = {
  ctx: null, muted: false, rpm: 850, ambKind: null, nextEv: 1,
  init() {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC(); const m = this.master = c.createGain(); m.gain.value = this.muted ? 0 : 0.55; m.connect(c.destination);
    const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = nb.getChannelData(0); let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = i % 2 ? w : last * 3.5; } this.nb = nb;
    const loop = (filterType, freq, q) => { const s = c.createBufferSource(); s.buffer = nb; s.loop = true; const f = c.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q || 0.7; const g = c.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(m); s.start(0, Math.random()); return [f, g]; };
    this.e1 = c.createOscillator(); this.e1.type = 'sawtooth'; this.e2 = c.createOscillator(); this.e2.type = 'triangle'; this.e3 = c.createOscillator(); this.e3.type = 'square';
    this.ef = c.createBiquadFilter(); this.ef.type = 'lowpass'; this.ef.frequency.value = 300; this.ef.Q.value = 2.5; this.eg = c.createGain(); this.eg.gain.value = 0;
    const g3 = c.createGain(); g3.gain.value = 0.25; this.e3.connect(g3); g3.connect(this.ef);
    this.e1.connect(this.ef); this.e2.connect(this.ef); this.ef.connect(this.eg); this.eg.connect(m); this.e1.start(); this.e2.start(); this.e3.start();
    [this.rf, this.rg] = loop('lowpass', 500);
    [this.af, this.ag] = loop('lowpass', 400);
    [this.wf, this.wg] = loop('bandpass', 2600, 0.4);
    this.so = c.createOscillator(); this.so.type = 'square'; this.sf = c.createBiquadFilter(); this.sf.type = 'lowpass'; this.sf.frequency.value = 2000; this.sg = c.createGain(); this.sg.gain.value = 0; this.so.connect(this.sf); this.sf.connect(this.sg); this.sg.connect(m); this.so.start();
    this.mo = c.createOscillator(); this.mo.type = 'sawtooth'; this.mf = c.createBiquadFilter(); this.mf.type = 'lowpass'; this.mf.frequency.value = 900; this.mg = c.createGain(); this.mg.gain.value = 0; this.mo.connect(this.mf); this.mf.connect(this.mg); this.mg.connect(m); this.mo.start();
    if (this.ambKind) this.ambient(this.ambKind);
  },
  engine(v, load) {
    if (!this.ctx) return; const t = this.ctx.currentTime;
    const gs = [0, 5, 10, 16, 23, 31, 60]; let gi = 1; while (gi < 6 && v > gs[gi]) gi++;
    const frac = Math.min(1, (v - gs[gi - 1]) / (gs[gi] - gs[gi - 1]));
    const rpm = 850 + (gi === 1 ? frac * 2800 : 1300 + frac * 1700); this.rpm = rpm;
    const f = rpm / 60 * 2;
    this.e1.frequency.setTargetAtTime(f, t, 0.06); this.e2.frequency.setTargetAtTime(f * 0.5, t, 0.06); this.e3.frequency.setTargetAtTime(f * 0.25, t, 0.06);
    this.ef.frequency.setTargetAtTime(200 + rpm * 0.2 + load * 300, t, 0.06);
    this.eg.gain.setTargetAtTime(0.03 + 0.045 * load, t, 0.12);
    this.rg.gain.setTargetAtTime(Math.min(0.13, v * 0.0036), t, 0.25); this.rf.frequency.setTargetAtTime(280 + v * 22, t, 0.25);
  },
  ambient(kind) {
    this.ambKind = kind; if (!this.ctx) return; const t = this.ctx.currentTime;
    const A = { city: [380, 0.06], village: [700, 0.012], forest: [900, 0.022], fields: [700, 0.014], hwy: [520, 0.035], night: [500, 0.008], fog: [400, 0.015], rain: [1800, 0.05], snow: [300, 0.006], sunset: [700, 0.012] }[kind] || [500, 0.01];
    this.af.frequency.setTargetAtTime(A[0], t, 0.4); this.ag.gain.setTargetAtTime(A[1], t, 0.4);
    this.wg.gain.setTargetAtTime(kind === 'rain' ? 0.07 : 0, t, 0.4);
    this.nextEv = 0.8;
  },
  ambTick(dt) {
    if (!this.ctx) return; this.nextEv -= dt; if (this.nextEv > 0) return; const k = this.ambKind;
    if (k === 'village' || k === 'forest' || k === 'fields' || k === 'sunset') { this.bird(); this.nextEv = rand(0.7, 2.4); }
    else if (k === 'city') { if (Math.random() < 0.35) this.honk(0.018); else this.tone(rand(90, 140), 1.2, 'sawtooth', 0.01, 0, true); this.nextEv = rand(3, 7); }
    else if (k === 'night') { this.cricket(); this.nextEv = rand(0.35, 0.9); }
    else this.nextEv = 2;
  },
  bird() { const c = this.ctx, t = c.currentTime, n = (2 + Math.random() * 4) | 0, f0 = rand(2300, 4300); for (let i = 0; i < n; i++) { const o = c.createOscillator(), g = c.createGain(), st = t + i * rand(0.08, 0.15); o.frequency.setValueAtTime(f0 * rand(0.9, 1.1), st); o.frequency.exponentialRampToValueAtTime(f0 * rand(1.2, 1.5), st + 0.06); g.gain.setValueAtTime(0.0001, st); g.gain.linearRampToValueAtTime(0.022, st + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, st + 0.08); o.connect(g); g.connect(this.master); o.start(st); o.stop(st + 0.1); } },
  cricket() { for (let i = 0; i < 3; i++) this.tone(4300, 0.03, 'sine', 0.01, i * 0.05); },
  honk(v) { this.tone(420, 0.35, 'square', v, 0, true); this.tone(525, 0.35, 'square', v * 0.7, 0, true); },
  moto(level) { if (!this.ctx) return; const t = this.ctx.currentTime; this.mg.gain.setTargetAtTime(level * 0.08, t, 0.1); this.mo.frequency.setTargetAtTime(60 + level * 110, t, 0.1); },
  siren(level, t) { if (!this.ctx) return; const ct = this.ctx.currentTime; this.sg.gain.setTargetAtTime(level * 0.09, ct, 0.08); this.so.frequency.setTargetAtTime((Math.floor(t * 1.6) % 2) ? 980 : 700, ct, 0.01); },
  tone(freq, dur, type = 'sine', vol = 0.15, delay = 0, sustain = false) {
    const c = this.ctx; if (!c) return; const t = c.currentTime + delay;
    const o = c.createOscillator(); o.type = type; o.frequency.value = freq; const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.03);
    if (sustain) { g.gain.setValueAtTime(vol, t + dur - 0.25); g.gain.linearRampToValueAtTime(0.0001, t + dur); } else g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, freq, q, vol, type = 'bandpass') { const c = this.ctx; if (!c) return; const t = c.currentTime; const s = c.createBufferSource(); s.buffer = this.nb; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random()); s.stop(t + dur + 0.05); },
  tick(u) { this.tone(u ? 1300 : 900, 0.07, 'square', 0.05); },
  blinker(on) { this.noise(0.03, on ? 2400 : 1700, 4, 0.12); },
  wiper() { this.noise(0.18, 700, 1.5, 0.05); },
  good() { this.tone(784, 0.14, 'triangle', 0.16); this.tone(1175, 0.2, 'triangle', 0.16, 0.1); },
  meh() { this.tone(660, 0.16, 'triangle', 0.12); },
  bad() { this.tone(220, 0.28, 'sawtooth', 0.09); this.tone(165, 0.34, 'sawtooth', 0.09, 0.12); },
  screech() { this.noise(1.0, 2600, 7, 0.22); this.noise(0.9, 3500, 9, 0.12); },
  crash() { this.noise(1.3, 380, 0.7, 0.9, 'lowpass'); this.noise(0.6, 2600, 1, 0.35); this.tone(55, 0.6, 'sine', 0.6); this.noise(1.6, 5000, 2, 0.12); },
  horn() { [311, 370, 466].forEach(f => this.tone(f, 1.8, 'sawtooth', 0.035, 0, true)); },
  tramBell() { for (const d of [0, 0.22]) { this.tone(1760, 0.35, 'sine', 0.1, d); this.tone(2640, 0.2, 'sine', 0.04, d); } },
  bell(k) { this.tone(1480, 0.3, 'sine', 0.06 * k); this.tone(2960, 0.18, 'sine', 0.02 * k); },
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.55; },
};

