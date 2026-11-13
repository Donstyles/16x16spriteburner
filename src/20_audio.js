// ===================== synthesized sound: booms, thunder, quakes, steel =====================
const SFX = {
  ctx: null, on: false, master: null, last: {},
  init() {
    if (this.ctx) { this.ctx.resume(); this.on = true; return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 8; comp.attack.value = 0.002; comp.release.value = 0.3;
    this.master = c.createGain(); this.master.gain.value = 0.85; this.master.connect(comp); comp.connect(c.destination);
    const n = c.sampleRate * 2;
    this.white = c.createBuffer(1, n, c.sampleRate); const w = this.white.getChannelData(0); for (let i = 0; i < n; i++) w[i] = Math.random() * 2 - 1;
    this.brown = c.createBuffer(1, n, c.sampleRate); const b = this.brown.getChannelData(0); let l = 0; for (let i = 0; i < n; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; b[i] = l * 3.5; }
    this.crunch = c.createWaveShaper(); const curve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 3.2); } this.crunch.curve = curve; this.crunch.connect(this.master);
    this.on = true; this.drone();
  },
  toggle() { if (!this.ctx) { this.init(); return; } this.on = !this.on; this.master.gain.setTargetAtTime(this.on ? 0.85 : 0, this.ctx.currentTime, 0.05); },
  ok(name, gap) { if (!this.on || !this.ctx) return false; const t = this.ctx.currentTime; if (this.last[name] !== undefined && t - this.last[name] < gap) return false; this.last[name] = t; return true; },
  dest(pan, crunch) { const d = crunch ? this.crunch : this.master; if (pan && this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = clamp(pan, -0.9, 0.9); p.connect(d); return p; } return d; },
  noise(buf, dur, type, f0, f1, q, gain, pan, t0 = 0, att = 0.004, crunch = false) {
    const c = this.ctx, t = c.currentTime + t0, s = c.createBufferSource(); s.buffer = buf; s.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.dest(pan, crunch)); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  },
  tone(type, f0, f1, dur, gain, pan, t0 = 0, att = 0.004, crunch = false) {
    const c = this.ctx, t = c.currentTime + t0, o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(10, f1), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.dest(pan, crunch)); o.start(t); o.stop(t + dur + 0.05);
  },
  boom(size = 1, pan = 0) {
    if (!this.ok('boom', 0.035)) return; const s = Math.min(1.6, size);
    this.tone('sine', 120, 26, 0.5 + 0.5 * s, 0.9 * s, pan, 0, 0.003, true);
    this.noise(this.brown, 0.8 + 0.9 * s, 'lowpass', 2400, 70, 0.8, 1.0 * s, pan, 0, 0.003, true);
    this.noise(this.white, 0.22, 'lowpass', 7000, 600, 0.5, 0.4 * s, pan);
    for (let i = 0; i < 3 + s * 3; i++) this.noise(this.white, 0.05, 'bandpass', rand(1500, 4000), 900, 4, 0.12, pan + rand(-0.3, 0.3), 0.1 + Math.random() * 0.5);
  },
  thunder(pan = 0, big = 1) {
    if (!this.ok('thunder', 0.06)) return;
    this.noise(this.white, 0.16, 'highpass', 1400, 3200, 0.7, 1.1 * big, pan, 0, 0.001, true);
    this.tone('square', rand(70, 90), 30, 0.25, 0.35 * big, pan, 0, 0.001, true);
    this.noise(this.brown, 2.4 * big + 0.6, 'lowpass', 600, 50, 0.6, 0.95 * big, pan, 0.05, 0.03, true);
  },
  zap(pan = 0) {
    if (!this.ok('zap', 0.03)) return; const c = this.ctx, t = c.currentTime, o = c.createOscillator(); o.type = 'sawtooth';
    for (let i = 0; i < 14; i++) o.frequency.setValueAtTime(rand(300, 2400), t + i * 0.014);
    const g = c.createGain(); g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g); g.connect(this.dest(pan)); o.start(t); o.stop(t + 0.25);
    this.noise(this.white, 0.18, 'highpass', 3000, 6000, 0.6, 0.3, pan);
  },
  quake(dur = 2.5) {
    if (!this.ok('quake', 0.5)) return; const c = this.ctx, t = c.currentTime;
    this.noise(this.brown, dur + 0.8, 'lowpass', 160, 60, 0.9, 1.1, 0, 0, 0.25, true);
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 33; const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.6);
    const lfo = c.createOscillator(); lfo.frequency.value = 7; const lg = c.createGain(); lg.gain.value = 0.25; lfo.connect(lg); lg.connect(g.gain);
    o.connect(g); g.connect(this.crunch); o.start(t); lfo.start(t); o.stop(t + dur + 0.7); lfo.stop(t + dur + 0.7);
    for (let i = 0; i < dur * 5; i++) this.noise(this.brown, 0.25, 'lowpass', 900, 120, 1, 0.5, rand(-0.6, 0.6), Math.random() * dur, 0.002);
  },
  slash(pan = 0) { if (!this.ok('slash', 0.05)) return; this.noise(this.white, 0.14, 'bandpass', 700, 4200, 1.4, 0.4, pan); },
  clang(pan = 0) { if (!this.ok('clang', 0.06)) return; this.tone('triangle', 1250, 1180, 0.28, 0.14, pan); this.tone('sine', 1870, 1800, 0.2, 0.08, pan); this.noise(this.white, 0.05, 'highpass', 3000, 5000, 0.7, 0.25, pan); },
  hit(pan = 0) { if (!this.ok('hit', 0.03)) return; this.noise(this.brown, 0.14, 'lowpass', 1200, 200, 0.8, 0.6, pan); this.tone('sine', 150, 55, 0.12, 0.45, pan); },
  fire(pan = 0) { if (!this.ok('fire', 0.06)) return; this.noise(this.white, 0.35, 'lowpass', 400, 3000, 0.8, 0.35, pan, 0, 0.05); },
  whoosh(pan = 0) { if (!this.ok('whoosh', 0.08)) return; this.noise(this.white, 0.45, 'bandpass', 250, 1800, 1.2, 0.35, pan, 0, 0.12); },
  summon(pan = 0) { if (!this.ok('summon', 0.15)) return; this.noise(this.brown, 0.9, 'bandpass', 150, 900, 2, 0.5, pan, 0, 0.7); this.tone('sawtooth', 52, 48, 0.9, 0.08, pan, 0, 0.6); },
  pop(pan = 0) { if (!this.ok('pop', 0.025)) return; this.noise(this.white, 0.12, 'lowpass', 3000, 300, 0.7, 0.35, pan); this.tone('square', 220, 60, 0.1, 0.12, pan); },
  shatter(pan = 0) { if (!this.ok('shatter', 0.04)) return; this.noise(this.white, 0.28, 'highpass', 2500, 7000, 0.7, 0.28, pan); for (let i = 0; i < 4; i++) this.tone('triangle', rand(1800, 4200), 1500, 0.12, 0.05, pan, i * 0.03); },
  drum(inten = 0) { if (!this.ok('drum', 0.2)) return; const g = 0.35 + 0.45 * inten; this.tone('sine', 95, 38, 0.32, g, 0, 0, 0.002, true); this.noise(this.brown, 0.18, 'lowpass', 500, 120, 0.8, g * 0.6, 0); if (inten > 0.6) this.tone('sine', 70, 40, 0.25, g * 0.6, 0, 0.16, 0.002, true); },
  beam(dur = 1.5, pitch = 1) {
    if (!this.ok('beam', 0.3)) return; const c = this.ctx, t = c.currentTime, f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 8; f.frequency.setValueAtTime(400, t); f.frequency.linearRampToValueAtTime(2400, t + 0.3);
    const lfo = c.createOscillator(); lfo.frequency.value = 9; const lg = c.createGain(); lg.gain.value = 500; lfo.connect(lg); lg.connect(f.frequency);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.08); g.gain.setValueAtTime(0.3, t + dur - 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); f.connect(g); g.connect(this.crunch);
    for (const fr of [110 * pitch, 111.5 * pitch, 220 * pitch]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.connect(f); o.start(t); o.stop(t + dur + 0.05); } lfo.start(t); lfo.stop(t + dur + 0.05);
    this.noise(this.white, dur, 'bandpass', 3000, 5000, 2, 0.12, 0, 0, 0.05);
  },
  charge(tier = 2, wind = 0.5) { if (!this.ok('charge', 0.15)) return; this.tone('sine', 180, 180 * (2 + tier), Math.max(0.2, wind), 0.05 + tier * 0.03, 0, 0, Math.max(0.1, wind * 0.8)); this.noise(this.white, Math.max(0.2, wind), 'bandpass', 400, 3000, 3, 0.06 + tier * 0.03, 0, 0, Math.max(0.1, wind * 0.8)); },
  choice() { if (!this.ok('choice', 0.4)) return; this.noise(this.white, 0.6, 'bandpass', 300, 2400, 1.5, 0.25, 0, 0, 0.2); [523, 784, 1046].forEach((f, i) => this.tone('sine', f, f, 0.5, 0.06, 0, 0.15 + i * 0.08)); },
  levelup() { if (!this.ok('levelup', 0.5)) return; [392, 523, 659, 784, 1046, 1318].forEach((f, i) => { this.tone('triangle', f, f, 0.5, 0.1, 0, i * 0.055); this.tone('sine', f * 2, f * 2, 0.3, 0.03, 0, i * 0.055 + 0.02); }); this.noise(this.white, 0.9, 'highpass', 2000, 9000, 0.7, 0.12, 0, 0.1, 0.3); },
  heart() { if (!this.ok('heart', 0.5)) return; this.tone('sine', 72, 44, 0.14, 0.32, 0); this.tone('sine', 64, 40, 0.12, 0.22, 0, 0.19); },
  heal() { if (!this.ok('heal', 0.4)) return; [523, 659, 784, 1046].forEach((f, i) => this.tone('sine', f, f, 0.45, 0.08, 0, i * 0.07)); },
  braam() {
    if (!this.ok('braam', 1)) return; const c = this.ctx, t = c.currentTime, f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 6;
    f.frequency.setValueAtTime(120, t); f.frequency.exponentialRampToValueAtTime(1400, t + 0.5); f.frequency.exponentialRampToValueAtTime(200, t + 2.4);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6); f.connect(g); g.connect(this.crunch);
    for (const fr of [55, 55.6, 82.4, 110.3]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.connect(f); o.start(t); o.stop(t + 2.7); }
  },
  drone() {
    const c = this.ctx, f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 130; const g = c.createGain(); g.gain.value = 0.05; f.connect(g); g.connect(this.master);
    for (const fr of [41.2, 41.5, 61.7]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.connect(f); o.start(); }
    const lfo = c.createOscillator(); lfo.frequency.value = 0.07; const lg = c.createGain(); lg.gain.value = 60; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
  },
};
function buzz(p) { try { if (SFX.on && navigator.vibrate) navigator.vibrate(p); } catch (e) { } }
