/*
 * The core: canvas, palette, fonts, easing, drawing helpers and the beat clock.
 * Every frame is a pure function of time, so the same code plays live in the
 * browser and renders frame-exact to video.
 */
const W = 1920, H = 1080, FPS = 60;
const cv = document.getElementById('c');
let ctx = cv.getContext('2d');

const C = {
  ink: '#0B0B0E', paper: '#F2ECE1', fire: '#FF4A1C', blue: '#2F4BFF',
  lime: '#D8FF3C', deep: '#050507', sun: '#FFD23F', pink: '#FF6F91', mint: '#3DDC97', purple: '#7B4BFF',
};
const FD = 'Anton, Impact, sans-serif';
const FS = '"Space Grotesk", sans-serif';
const FM = '"JetBrains Mono", monospace';
const FL = '"Luckiest Guy", "Arial Black", sans-serif';

const { MEMORIAM, MAANDEN } = REEL;

// the tempo can change per chapter (the film follows the song), so these are set per scene
let B = REEL.B, BAR = REEL.BAR;
// the length of the headline being drawn, for the drawn pictures
let D = 4 * B;

// ---------------------------------------------------------------- utilities
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const P = (t, a, b) => clamp((t - a) / (b - a));
const TAU = Math.PI * 2;
const E = {
  outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inExpo: t => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
  inOutExpo: t => t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inCubic: t => t * t * t,
  inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outQuart: t => 1 - Math.pow(1 - t, 4),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  // a bigger overshoot, for things that pop
  outPop: t => { const c1 = 3.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: t => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * TAU / 3) + 1,
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  inBack: t => { const c1 = 1.70158; return (c1 + 1) * t * t * t - c1 * t * t; },
};
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0; let t = s;
    t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
// how far into the current beat (0..1), and a kick that decays after each beat
const fase = t => ((t / B) % 1 + 1) % 1;
const beatPulse = (t, k = 7) => { const u = ((t % B) + B) % B; return Math.exp(-u * k); };
// a hop on every beat: 0 on the beat, 1 halfway
const hop = t => Math.sin(Math.PI * fase(t));

function font(f, size, weight = '') { return `${weight} ${size}px ${f}`; }
function txt(s, x, y, o = {}) {
  const { f = FS, size = 40, weight = '', color = C.paper, align = 'center', base = 'middle', track = 0, alpha = 1, stroke = 0 } = o;
  if (alpha <= 0) return;
  ctx.save();
  ctx.font = font(f, size, weight);
  ctx.textAlign = align; ctx.textBaseline = base;
  ctx.letterSpacing = track + 'px';
  ctx.globalAlpha *= alpha;
  const xx = align === 'center' ? x + track / 2 : align === 'right' ? x + track : x;
  if (stroke) { ctx.strokeStyle = color; ctx.lineWidth = stroke; ctx.lineJoin = 'round'; ctx.strokeText(s, xx, y); }
  else { ctx.fillStyle = color; ctx.fillText(s, xx, y); }
  ctx.restore();
}
const layoutCache = new Map();
function layout(s, fnt) {
  const key = s + '|' + fnt;
  if (layoutCache.has(key)) return layoutCache.get(key);
  ctx.save(); ctx.font = fnt; ctx.letterSpacing = '0px';
  const chars = [];
  for (let i = 0; i < s.length; i++) chars.push({ ch: s[i], x: ctx.measureText(s.slice(0, i)).width, w: ctx.measureText(s[i]).width });
  const out = { chars, width: ctx.measureText(s).width };
  ctx.restore();
  layoutCache.set(key, out);
  return out;
}
const wrapCache = new Map();
function wrap(s, fnt, maxW) {
  const key = s + '|' + fnt + '|' + maxW;
  if (wrapCache.has(key)) return wrapCache.get(key);
  ctx.save(); ctx.font = fnt; ctx.letterSpacing = '0px';
  const lines = []; let cur = '';
  for (const w of s.split(' ')) {
    const tryL = cur ? cur + ' ' + w : w;
    if (ctx.measureText(tryL).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tryL;
  }
  if (cur) lines.push(cur);
  ctx.restore();
  wrapCache.set(key, lines);
  return lines;
}
// like wrap, but two lines as even as possible: never one lonely word on the second
const balansCache = new Map();
function balans(s, fnt, maxW) {
  const key = s + '|' + fnt + '|' + maxW;
  if (balansCache.has(key)) return balansCache.get(key);
  let best = wrap(s, fnt, maxW);
  if (best.length === 2) {
    const w = s.split(' ');
    let bw = Infinity;
    for (let k = 1; k < w.length; k++) {
      const a = w.slice(0, k).join(' '), b = w.slice(k).join(' '), m = Math.max(measure(a, fnt), measure(b, fnt));
      if (m <= maxW && m < bw) { bw = m; best = [a, b]; }
    }
  }
  balansCache.set(key, best);
  return best;
}
function measure(s, fnt, track = 0) { ctx.save(); ctx.font = fnt; ctx.letterSpacing = track + 'px'; const w = ctx.measureText(s).width; ctx.restore(); return w; }
let CAP = 0.73, DIGW = 0.46, CAPL = 0.72;
const capH = size => CAP * size;
function digits(s, cx, cy, size, color, o = {}) { txt(s, cx, cy + capH(size) / 2, { f: FD, size, color, base: 'alphabetic', ...o }); }
function rect(x, y, w, h, color, a = 1) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = color; ctx.fillRect(x, y, w, h); ctx.restore(); }
function circle(x, y, r, color, a = 1) { if (r <= 0 || a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore(); }
function ring(x, y, r, color, w = 2, a = 1) { if (r <= 0 || a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore(); }
function line(x1, y1, x2, y2, color, w = 2, a = 1) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore(); }
function poly(pts, c, a = 1) { ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = c; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.restore(); }
function clipRect(x, y, w, h) { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); }
function vgrad(y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0);
}
function rgrad(x, y, r0, r1, stops, comp) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.save(); if (comp) ctx.globalCompositeOperation = comp;
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
// scale (and turn) everything drawn in f around a point
function around(x, y, s, rot, f) {
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); if (s !== 1) ctx.scale(s, s); ctx.translate(-x, -y);
  f(); ctx.restore();
}
// a colour between two hex colours
function mix(a, b, q) {
  const h = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), x = h(a), y = h(b);
  return 'rgb(' + x.map((v, i) => Math.round(lerp(v, y[i], clamp(q)))).join(',') + ')';
}
const pad2 = n => String(n).padStart(2, '0');
const nl = n => Math.round(n).toLocaleString('nl-NL');

const MND = ['JAN', 'FEB', 'MRT', 'APR', 'MEI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'];
const MONTH_START = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const JAN1_WEEKDAY = 4; // 1 januari 2026 was een donderdag

// ---------------------------------------------------------------- offscreen
// Draws f into a spare full-frame canvas (for smears and wipes); returns the canvas.
const SPARE = [];
function offscreen(k, f) {
  if (!SPARE[k]) { const c = document.createElement('canvas'); c.width = W; c.height = H; SPARE[k] = c; }
  const c = SPARE[k], o = c.getContext('2d'), keep = ctx;
  o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.globalCompositeOperation = 'source-over';
  o.clearRect(0, 0, W, H);
  ctx = o;
  try { f(); } finally { ctx = keep; }
  return c;
}

// ---------------------------------------------------------------- sticker type
// Text as a sticker: thick ink outline, an offset shadow in a colour, white fill.
function sticker(s, x, y, o = {}) {
  const { size = 90, fill = C.paper, edge = C.ink, shadow = C.fire, align = 'left', base = 'alphabetic', out = size * 0.16, off = size * 0.08, alpha = 1, f = FL } = o;
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = font(f, size); ctx.textAlign = align; ctx.textBaseline = base; ctx.letterSpacing = '0px';
  ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  if (shadow) { ctx.strokeStyle = shadow; ctx.lineWidth = out * 2; ctx.strokeText(s, x + off, y + off); ctx.fillStyle = shadow; ctx.fillText(s, x + off, y + off); }
  ctx.strokeStyle = edge; ctx.lineWidth = out * 2; ctx.strokeText(s, x, y);
  ctx.fillStyle = fill; ctx.fillText(s, x, y);
  ctx.restore();
}
