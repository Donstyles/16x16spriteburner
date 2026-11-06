// ===== Procedural audio (WebAudio) =====
const Snd = {
  ctx: null, master: null, musicGain: null, cur: null, muted: false, musicNodes: [], musicKind: null, musicTimer: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.35; this.musicGain.connect(this.master);
      const len = this.ctx.sampleRate * 1.5, nb = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = nb.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = nb;
      if (this.musicKind) { const k = this.musicKind; this.musicKind = null; this.music(k); }
    } catch (e) { }
  },
  env(g, t, a, peak, dec, sus = 0) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus), t + a + dec); },
  tone(type, f0, f1, dur, vol, a = 0.005, dest) {
    const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    this.env(g, t, a, vol, dur); o.connect(g); g.connect(dest || this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  burst(dur, vol, f0, f1, q = 1, a = 0.003, type = 'bandpass') {
    const c = this.ctx, t = c.currentTime, s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = q;
    const g = c.createGain(); this.env(g, t, a, vol, dur); s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + 0.05);
  },
  sfx(name) {
    if (!this.ctx || this.muted) return;
    const now = performance.now(); this.last = this.last || {}; if (this.last[name] && now - this.last[name] < 40) return; this.last[name] = now;
    switch (name) {
      case 'step': this.burst(0.07, 0.12, 300 + Math.random() * 200, 120, 1); break;
      case 'sword': this.burst(0.12, 0.35, 2500, 600, 0.8); this.tone('square', 220, 90, 0.1, 0.12); break;
      case 'mace': this.burst(0.14, 0.35, 900, 200, 1); this.tone('sine', 150, 60, 0.12, 0.2); break;
      case 'bow': this.burst(0.08, 0.25, 1800, 4000, 2); this.tone('triangle', 900, 300, 0.08, 0.1); break;
      case 'spark': this.tone('sine', 1200, 300, 0.15, 0.15); break;
      case 'fire': this.burst(0.35, 0.4, 400, 1800, 0.7, 0.02); this.tone('sawtooth', 120, 60, 0.3, 0.12); break;
      case 'explode': this.burst(0.5, 0.6, 200, 60, 0.5, 0.005, 'lowpass'); this.tone('sine', 90, 30, 0.4, 0.3); break;
      case 'cast': this.tone('sine', 500, 1500, 0.25, 0.12); this.burst(0.2, 0.1, 2000, 4000, 2); break;
      case 'hurt': this.burst(0.18, 0.45, 500, 100, 1, 0.003, 'lowpass'); this.tone('square', 110, 50, 0.15, 0.15); break;
      case 'block': this.tone('square', 600, 250, 0.1, 0.2); this.burst(0.1, 0.25, 3000, 1500, 1); break;
      case 'dodge': this.burst(0.18, 0.2, 400, 1600, 1, 0.01); break;
      case 'kill': this.burst(0.3, 0.3, 800, 100, 1, 0.005, 'lowpass'); this.tone('triangle', 300, 60, 0.3, 0.2); break;
      case 'bossdie': this.burst(1.4, 0.6, 600, 40, 1, 0.01, 'lowpass'); this.tone('sawtooth', 110, 25, 1.4, 0.3); this.tone('sine', 55, 20, 1.6, 0.4); break;
      case 'windup': this.tone('sawtooth', 160, 320, 0.3, 0.07, 0.05); break;
      case 'bosswind': this.tone('sawtooth', 80, 200, 0.6, 0.18, 0.05); this.burst(0.5, 0.15, 200, 800, 1, 0.1); break;
      case 'whoosh': this.burst(0.2, 0.2, 600, 2000, 1, 0.02); break;
      case 'charge': this.burst(0.5, 0.4, 200, 1200, 1, 0.02); this.tone('sawtooth', 60, 140, 0.5, 0.2, 0.05); break;
      case 'slam': this.burst(0.6, 0.7, 150, 40, 0.5, 0.003, 'lowpass'); this.tone('sine', 70, 25, 0.6, 0.5); break;
      case 'roar': this.tone('sawtooth', 90, 45, 0.9, 0.35, 0.05); this.tone('square', 140, 60, 0.7, 0.15, 0.05); this.burst(0.8, 0.3, 300, 100, 0.7, 0.05); break;
      case 'notice': this.tone('square', 300, 420, 0.12, 0.08); break;
      case 'died': this.tone('sine', 220, 55, 2.5, 0.35, 0.3); this.tone('sine', 165, 41, 2.5, 0.25, 0.3); this.burst(2, 0.15, 300, 60, 0.5, 0.5, 'lowpass'); break;
      case 'fallen': this.tone('triangle', 240, 80, 0.6, 0.25, 0.02); break;
      case 'bonfire': this.tone('sine', 220, 440, 1.2, 0.2, 0.3); this.tone('sine', 330, 660, 1.4, 0.15, 0.4); this.tone('sine', 440, 880, 1.6, 0.1, 0.5); break;
      case 'rest': this.tone('sine', 330, 330, 0.6, 0.15, 0.1); this.tone('sine', 495, 495, 0.8, 0.12, 0.2); break;
      case 'levelup': [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.tone('triangle', f, f, 0.35, 0.18, 0.01), i * 90)); break;
      case 'item': this.tone('triangle', 660, 990, 0.25, 0.15, 0.01); this.tone('triangle', 990, 1320, 0.3, 0.1, 0.1); break;
      case 'chest': this.burst(0.15, 0.3, 500, 200, 1); this.tone('triangle', 520, 780, 0.3, 0.15, 0.05); break;
      case 'door': this.burst(0.35, 0.25, 200, 80, 0.8, 0.02, 'lowpass'); break;
      case 'unlock': this.tone('square', 800, 1200, 0.08, 0.15); this.tone('square', 1200, 600, 0.12, 0.12, 0.08); break;
      case 'locked': this.tone('square', 200, 180, 0.12, 0.15); break;
      case 'lever': this.burst(0.3, 0.35, 300, 100, 0.8, 0.01, 'lowpass'); this.tone('square', 150, 100, 0.2, 0.15); break;
      case 'break': this.burst(0.25, 0.45, 1500, 300, 1); break;
      case 'fog': this.burst(1.2, 0.3, 300, 2000, 0.5, 0.3); this.tone('sine', 440, 880, 1.2, 0.08, 0.5); break;
      case 'flask': this.tone('sine', 300, 600, 0.4, 0.15, 0.05); this.burst(0.3, 0.1, 800, 300, 1, 0.05); break;
      case 'heal': this.tone('sine', 520, 1040, 0.6, 0.15, 0.1); this.tone('sine', 780, 1560, 0.7, 0.1, 0.2); break;
      case 'blink': this.tone('sine', 1500, 200, 0.3, 0.15, 0.01); break;
      case 'summon': this.tone('sawtooth', 100, 400, 0.6, 0.12, 0.1); break;
      case 'victory': [330, 392, 494, 659, 784].forEach((f, i) => setTimeout(() => { this.tone('triangle', f, f, 0.8, 0.2, 0.02); this.tone('sine', f / 2, f / 2, 1, 0.15, 0.05); }, i * 160)); break;
      case 'ui': this.tone('square', 700, 900, 0.05, 0.06); break;
      case 'souls': this.tone('sine', 880, 1760, 0.2, 0.06, 0.01); break;
    }
  },
  music(kind) {
    this.musicKind = kind;
    if (!this.ctx) return;
    this.stopMusic();
    const c = this.ctx, t = c.currentTime;
    const mk = (type, f, vol, detune = 0) => { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; o.detune.value = detune; g.gain.value = 0; g.gain.linearRampToValueAtTime(vol, t + 3); o.connect(g); g.connect(this.musicGain); o.start(); this.musicNodes.push(o, g); return { o, g }; };
    if (kind === 'ambient') {
      mk('sine', 55, 0.25); mk('sine', 82.4, 0.12, 6); mk('triangle', 110, 0.05, -8);
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 18; lfo.connect(lg); lg.connect(this.musicNodes[0].frequency); lfo.start(); this.musicNodes.push(lfo, lg);
      this.bell = true;
    } else if (kind === 'boss') {
      mk('sawtooth', 55, 0.12); mk('sawtooth', 58.3, 0.1); mk('square', 110, 0.04);
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.type = 'square'; lfo.frequency.value = 2.2; lg.gain.value = 0.08; lfo.connect(lg); lg.connect(this.musicNodes[1].gain); lfo.start(); this.musicNodes.push(lfo, lg);
      this.bell = false;
    } else if (kind === 'title') { mk('sine', 65.4, 0.2); mk('sine', 98, 0.1, 5); mk('sine', 130.8, 0.05); this.bell = true; }
    else this.bell = false;
  },
  stopMusic() { for (const n of this.musicNodes) { try { n.stop && n.stop(); n.disconnect(); } catch (e) { } } this.musicNodes = []; },
  update(dt, boss) {
    if (!this.ctx) return;
    this.musicTimer -= dt;
    if (this.musicTimer <= 0) {
      this.musicTimer = boss ? 0.5 : 6 + Math.random() * 8;
      if (boss) { this.burst(0.25, 0.5, 120, 40, 0.5, 0.003, 'lowpass'); if (Math.random() < 0.3) this.tone('sine', 220 * (Math.random() < 0.5 ? 1 : 1.06), 220, 0.4, 0.08, 0.01, this.musicGain); }
      else if (this.bell && Math.random() < 0.6) { const f = [220, 261.6, 293.7, 329.6, 392][(Math.random() * 5) | 0]; this.tone('sine', f, f, 3, 0.12, 0.05, this.musicGain); this.tone('sine', f * 2.01, f * 2, 2, 0.04, 0.05, this.musicGain); }
    }
  },
};
