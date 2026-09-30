// The sound effects that sit on top of the songs: node effecten.js
// Writes sfx.wav (stereo, 44.1 kHz) and fx-events.json (when each effect happens, so the
// mix can make room for it). Designed to sit with music, not against it: airy swooshes
// between shots, a handful of real hits at the big moments, everything in one shared room.
const fs = require('fs');
const path = require('path');
const REEL = require('./reel-data.js');

const { seq: SEQ, total: DUR } = REEL.sequence();
const SR = 44100, N = Math.ceil(SR * (DUR + 3));
const L = new Float32Array(N), R = new Float32Array(N);    // dry
const SL = new Float32Array(N), SRt = new Float32Array(N); // reverb send
const events = [];

let seed = 7;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
function put(i, l, r, send) {
  if (i < 0 || i >= N) return;
  L[i] += l; R[i] += r;
  if (send) { SL[i] += l * send; SRt[i] += r * send; }
}
// state-variable filter, one per voice
function svf() {
  let lp = 0, bp = 0;
  return (x, f, q = 0.7) => {
    const F = 2 * Math.sin(Math.PI * Math.min(f, SR / 6.5) / SR);
    const hp = x - lp - q * bp; bp += F * hp; lp += F * bp;
    return { lp, bp, hp };
  };
}
// pink-ish noise: smoother than white, the way real air sounds
function pink() {
  let b0 = 0, b1 = 0, b2 = 0;
  return () => { const w = rnd() * 2 - 1; b0 = 0.997 * b0 + w * 0.029591; b1 = 0.985 * b1 + w * 0.032534; b2 = 0.95 * b2 + w * 0.048056; return (b0 + b1 + b2 + w * 0.05) * 2.2; };
}

// ------------------------------------------------------------------ voices
// a swoosh past the camera: rises, peaks near the cut, falls away; pans across
function swoosh(tc, dur, amp, dir = 1, bright = 1) {
  const s0 = Math.round((tc - dur * 0.6) * SR), n = Math.round(dur * SR);
  const fl = svf(), fr = svf(), nl = pink(), nr = pink();
  for (let i = 0; i < n; i++) {
    const q = i / n;
    const env = q < 0.6 ? Math.pow(q / 0.6, 2.2) : Math.pow(1 - (q - 0.6) / 0.4, 1.6);
    const f = (500 + 4200 * bright * Math.sin(Math.PI * Math.min(1, q / 0.75))) ;
    const a = fl(nl(), f, 0.9).bp, b = fr(nr(), f * 1.07, 0.9).bp;
    const p = clamp(0.5 + dir * (q - 0.5) * 1.4);
    put(s0 + i, a * env * amp * Math.cos(p * Math.PI / 2) * 1.4, b * env * amp * Math.sin(p * Math.PI / 2) * 1.4, 0.35);
  }
  events.push({ t: tc, kind: 'swoosh', amp });
}
// a cinematic hit: sub drop, a body thump, a snap on top, and a room
function hit(t0, amp) {
  const s0 = Math.round(t0 * SR);
  const fb = svf(), fs2 = svf(), nb = pink();
  let ph = 0;
  for (let i = 0; i < 1.4 * SR; i++) {
    const t = i / SR;
    ph += (38 + 24 * Math.exp(-t * 7)) / SR;
    const sub = Math.sin(2 * Math.PI * ph) * Math.min(1, t / 0.004) * Math.exp(-t * 3.2);
    const body = fb(nb(), 260, 0.8).bp * Math.exp(-t * 18) * 1.6;
    const snap = fs2(rnd() * 2 - 1, 3200, 0.6).hp * Math.exp(-t * 55) * 0.5;
    const v = (Math.tanh(sub * 1.2) * 0.8 + body + snap) * amp;
    put(s0 + i, v, v, 0.5);
  }
  events.push({ t: t0, kind: 'hit', amp });
}
// a soft thump for the month titles
function thump(t0, amp) {
  const s0 = Math.round(t0 * SR);
  let ph = 0;
  for (let i = 0; i < 0.35 * SR; i++) {
    const t = i / SR;
    ph += (70 + 40 * Math.exp(-t * 30)) / SR;
    const v = Math.sin(2 * Math.PI * ph) * Math.min(1, t / 0.003) * Math.exp(-t * 11) * amp;
    put(s0 + i, v, v, 0.15);
  }
  events.push({ t: t0, kind: 'thump', amp });
}
// a clock tick, dry and small
function tick(t0, amp, fr = 2600, pan = 0) {
  const s0 = Math.round(t0 * SR);
  for (let i = 0; i < 0.03 * SR; i++) {
    const t = i / SR;
    const v = (Math.sin(2 * Math.PI * fr * t) * 0.7 + (rnd() * 2 - 1) * 0.3) * Math.exp(-t * 320) * amp;
    put(s0 + i, v * (1 - pan) * 0.7, v * (1 + pan) * 0.7, 0.1);
  }
}
// a reverse swell that pulls into a moment
function swell(t1, dur, amp) {
  const s0 = Math.round((t1 - dur) * SR), n = Math.round(dur * SR);
  const fl = svf(), fr = svf(), nl = pink(), nr = pink();
  for (let i = 0; i < n; i++) {
    const q = i / n, env = Math.pow(q, 3);
    const f = 400 * Math.pow(18, q);
    put(s0 + i, fl(nl(), f, 0.7).lp * env * amp, fr(nr(), f, 0.7).lp * env * amp, 0.4);
  }
}
// a paper slam for the redaction bars
function slam(t0, amp) {
  const s0 = Math.round(t0 * SR);
  const f = svf();
  let ph = 0;
  for (let i = 0; i < 0.18 * SR; i++) {
    const t = i / SR;
    ph += 95 / SR;
    const v = (Math.sin(2 * Math.PI * ph) * Math.exp(-t * 26) * 0.7 + f(rnd() * 2 - 1, 1800, 0.9).bp * Math.exp(-t * 45)) * amp;
    put(s0 + i, v, v, 0.2);
  }
}
// a bright air shimmer that rings out (the eclipse)
function air(t0, dur, amp) {
  const s0 = Math.round(t0 * SR);
  const fl = svf(), fr = svf();
  for (let i = 0; i < dur * SR; i++) {
    const t = i / SR, env = Math.min(1, t / 0.05) * Math.exp(-t * 2.2);
    put(s0 + i, fl(rnd() * 2 - 1, 7000, 0.5).hp * env * amp * 0.5, fr(rnd() * 2 - 1, 7400, 0.5).hp * env * amp * 0.5, 0.9);
  }
}

// --------------------------------------------------------------- the score
const outExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
const outBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const P = (t, a, b) => clamp((t - a) / (b - a));
const OB = 60 / 128;
const reelV = (i, t) => {
  let v = [2, 0, 2, 5][i] - (i + 1) * 10 * (1 - outExpo(P(t, 0.25, 0.95 + 0.14 * i)));
  if (i === 3) v += outBack(P(t, 1.46, 1.66));
  return v;
};
const SW = 0.32;
let dir = 1;
for (const sc of SEQ) {
  const t0 = sc.start, BAR = sc.bar, B = sc.beat, end = sc.start + sc.dur;
  switch (sc.kind) {
    case 'rol': {
      const K = BAR / (4 * OB);
      for (let i = 0; i < 4; i++) {
        let prev = Math.floor(reelV(i, 0.2) + 0.5), last = -1;
        for (let t = 0.2; t < 1.7; t += 0.0005) {
          const d = Math.floor(reelV(i, t) + 0.5);
          if (d !== prev && t - last > 0.02) { tick(t0 + t * K, 0.12, 2200 + i * 300, (i - 1.5) * 0.4); last = t; }
          prev = d;
        }
      }
      tick(t0 + 1.46 * K, 0.35, 1600);
      swell(end, BAR * 0.45, 0.22);
      break;
    }
    case 'knal': hit(t0, 0.55); break;
    case 'raster': case 'baan': swoosh(t0, 0.55, 0.2, dir = -dir); break;
    case 'getallen': swoosh(t0, 0.5, 0.2, dir = -dir); for (let b = 1; b < 4; b++) swoosh(t0 + b * B, 0.35, 0.12, dir = -dir, 1.3); break;
    case 'opening': hit(t0, 0.45); swoosh(end, 0.7, 0.24, dir = -dir); break;
    case 'maand': {
      const STING = REEL.STING_BARS * BAR, ITEM = REEL.ITEM_BARS * BAR;
      thump(t0, 0.18);
      sc.items.forEach((it, k) => {
        const i0 = t0 + STING + k * ITEM;
        swoosh(i0, 0.62, 0.17, dir = -dir);
        if (it.beeld === 'zon' && !it.media) { swell(i0 + 1.25 * BAR, 1.25 * BAR - 0.3, 0.2); hit(i0 + 1.25 * BAR, 0.3); air(i0 + 1.25 * BAR, 2.5, 0.35); }
      });
      swoosh(end, 0.62, 0.2, dir = -dir);
      break;
    }
    case 'memoriam': break;
    case 'dossier': {
      for (let i = 0; i < 11; i++) slam(t0 + 0.5 + i * B / 2, 0.16);
      hit(t0 + 1.5 * BAR, 0.4);
      swoosh(end, 0.9, 0.24, -1, 0.7);
      break;
    }
    case 'finale': {
      hit(t0 + BAR, 0.5);
      const cd = end - BAR;
      swell(cd, BAR * 0.6, 0.15);
      for (let b = 0; b < 3; b++) tick(cd + b * B, 0.45, 1200 + 300 * b);
      hit(cd + 3 * B, 0.6);
      break;
    }
  }
}

// ------------------------------------------------------- one shared room
// Freeverb: eight damped combs and four allpasses per side
function freeverb(inp, spread) {
  const out = new Float32Array(N);
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map(d => ({ buf: new Float32Array(d + spread), i: 0, lp: 0 }));
  const aps = [556, 441, 341, 225].map(d => ({ buf: new Float32Array(d + spread), i: 0 }));
  const fb = 0.82, damp = 0.35, g = 0.015;
  for (let n = 0; n < N; n++) {
    const x = inp[n] * g;
    let y = 0;
    for (const c of combs) { const o = c.buf[c.i]; c.lp = o * (1 - damp) + c.lp * damp; c.buf[c.i] = x + c.lp * fb; c.i = (c.i + 1) % c.buf.length; y += o; }
    for (const a of aps) { const o = a.buf[a.i]; a.buf[a.i] = y + o * 0.5; a.i = (a.i + 1) % a.buf.length; y = o - y; }
    out[n] = y;
  }
  return out;
}
const WL = freeverb(SL, 0), WR = freeverb(SRt, 23);

const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
let peak = 0;
for (let i = 0; i < N; i++) {
  const l = (L[i] + WL[i] * 3) * 0.6, r = (R[i] + WR[i] * 3) * 0.6; // headroom; the mix sets the level
  peak = Math.max(peak, Math.abs(l), Math.abs(r));
  buf.writeInt16LE(Math.round(clamp(l, -1, 1) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(clamp(r, -1, 1) * 32767), 46 + i * 4);
}
fs.writeFileSync(path.join(__dirname, 'sfx.wav'), buf);
fs.writeFileSync(path.join(__dirname, 'fx-events.json'), JSON.stringify(events));
console.log(`sfx.wav en fx-events.json geschreven (piek ${(20 * Math.log10(peak)).toFixed(1)} dBFS)`);
