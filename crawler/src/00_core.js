// ===================== Cellar of Ruin II: core (the dungeon-crawler sequel; forked from ../src) =====================
'use strict';
const TAU = Math.PI * 2, TS = 16;
const rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;
// SEEDS. A floor is made from a stream of random numbers of its own (mulberry32), from the run's seed and the floor's
// number, so a seed and a floor number give the same floor again (in the same build: 60_run startFloor, the pause
// menu's REPORT); play itself stays on Math.random, so one more spark never reshuffles a floor
function seededRng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function floorSeed(run, floor) { let h = (run ^ Math.imul(floor + 1, 0x9E3779B1)) >>> 0; h = Math.imul(h ^ h >>> 16, 0x85EBCA6B) >>> 0; h = Math.imul(h ^ h >>> 13, 0xC2B2AE35) >>> 0; return (h ^ h >>> 16) >>> 0; }
function withSeed(seed, fn) { const R = Math.random; Math.random = seededRng(seed); try { return fn(); } finally { Math.random = R; } }
const hex8 = n => (n >>> 0).toString(16).toUpperCase().padStart(8, '0');
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const angTo = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const NOISE = (() => { const r = seededRng(0x5EED); return Float32Array.from({ length: 1024 }, () => r() * 2 - 1); })(); // (fixed: the same in every session, as a floor made from a seed must be)
function noise1(t) { const i = Math.floor(t), f = t - i, a = NOISE[i & 1023], b = NOISE[(i + 1) & 1023], s = f * f * (3 - 2 * f); return a + (b - a) * s; }
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; }
function removeIf(arr, fn) { let j = 0; for (let i = 0; i < arr.length; i++) { const o = arr[i]; if (!fn(o)) arr[j++] = o; } arr.length = j; }
// colours used by light, glow and particles
const COL = {
  white: [255, 255, 255], hot: [255, 244, 214], fire: [255, 128, 32], fire2: [255, 200, 80], ember: [255, 80, 16], red: [255, 36, 36],
  bolt: [110, 160, 255], bolt2: [190, 220, 255], arcane: [190, 80, 255], heal: [80, 255, 140], earth: [255, 160, 70], magma: [255, 84, 8],
  gold: [255, 214, 90], torch: [255, 150, 60], poison: [130, 255, 60], ice: [140, 220, 255], blood: [150, 0, 16], void: [130, 40, 220], crimson: [255, 40, 70], holy: [255, 236, 170],
};
const rgba = (k, a) => { const c = COL[k] || k; return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
