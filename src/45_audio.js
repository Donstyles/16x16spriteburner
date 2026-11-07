// ===================== audio =====================
const Snd = {
  ctx: null, master: null, muted: false, last: {},
  init() { if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; } try { const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.45; this.master.connect(this.ctx.destination); const len = this.ctx.sampleRate, nb = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; this.noise = nb; } catch (e) { } },
  tone(type, f0, f1, dur, vol, a = 0.005) { const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05); },
  burst(dur, vol, f0, f1, type = 'bandpass', q = 1) { const c = this.ctx, t = c.currentTime, s = c.createBufferSource(); s.buffer = this.noise; const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = q; const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + 0.05); },
  play(n) {
    if (!this.ctx || this.muted) return; const now = performance.now(); if (this.last[n] && now - this.last[n] < 50) return; this.last[n] = now;
    switch (n) {
      case 'hit': this.burst(0.1, 0.3, 1800, 500); this.tone('square', 200, 90, 0.08, 0.1); break;
      case 'crit': this.burst(0.14, 0.4, 2500, 600); this.tone('square', 300, 100, 0.12, 0.15); break;
      case 'miss': this.burst(0.12, 0.15, 900, 2500); break;
      case 'bow': this.burst(0.07, 0.2, 1600, 4000, 'bandpass', 2); this.tone('triangle', 800, 300, 0.07, 0.08); break;
      case 'cast': this.tone('sine', 500, 1400, 0.25, 0.1); this.burst(0.2, 0.08, 2000, 5000); break;
      case 'hurt': this.burst(0.15, 0.35, 500, 120, 'lowpass'); this.tone('square', 120, 60, 0.12, 0.12); break;
      case 'explode': this.burst(0.45, 0.5, 300, 60, 'lowpass'); this.tone('sine', 100, 30, 0.4, 0.25); break;
      case 'coin': this.tone('triangle', 1200, 1800, 0.08, 0.1); this.tone('triangle', 1800, 2400, 0.1, 0.08, 0.05); break;
      case 'drink': this.tone('sine', 400, 700, 0.2, 0.12); break;
      case 'ui': this.tone('square', 600, 800, 0.04, 0.05); break;
      case 'buy': this.tone('triangle', 900, 1300, 0.1, 0.1); this.tone('triangle', 1300, 1600, 0.1, 0.08, 0.08); break;
      case 'level': [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.tone('triangle', f, f, 0.3, 0.15, 0.01), i * 90)); break;
      case 'quest': [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone('sine', f, f, 0.4, 0.14, 0.02), i * 120)); break;
      case 'door': this.burst(0.3, 0.2, 200, 80, 'lowpass'); break;
      case 'chest': this.burst(0.12, 0.25, 500, 200); this.tone('triangle', 500, 800, 0.25, 0.12, 0.05); break;
      case 'rest': this.tone('sine', 330, 330, 0.6, 0.12, 0.1); this.tone('sine', 495, 495, 0.8, 0.1, 0.2); break;
      case 'dead': this.tone('sine', 220, 55, 2, 0.3, 0.3); this.tone('sine', 165, 41, 2, 0.2, 0.3); break;
      case 'boss': this.tone('sawtooth', 80, 40, 1, 0.3, 0.05); this.burst(0.8, 0.25, 200, 60, 'lowpass'); break;
      case 'portal': this.tone('sine', 300, 1800, 0.8, 0.15, 0.1); this.burst(0.6, 0.1, 800, 4000); break;
    }
  },
};
