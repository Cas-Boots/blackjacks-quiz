// Synthesizes soundtrack.wav: 15 s at 128 BPM, every hit locked to the picture.
// Pure JS, no dependencies: node audio.js
const fs = require('fs');
const path = require('path');

const SR = 44100, DUR = 15, N = SR * DUR;
const B = 60 / 128, BAR = 4 * B;

const L = new Float32Array(N), R = new Float32Array(N);      // dry bus
const PL = new Float32Array(N), PR = new Float32Array(N);    // sidechained bus (pads, bass)
const RL = new Float32Array(N), RR = new Float32Array(N);    // reverb send
const duck = new Float32Array(N).fill(1);

let seed = 2026;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const pan = p => [Math.cos((p + 1) * Math.PI / 4), Math.sin((p + 1) * Math.PI / 4)];
function out(i, v, p = 0, send = 0, bus = 'dry') {
  if (i < 0 || i >= N) return;
  const [gl, gr] = pan(p);
  if (bus === 'dry') { L[i] += v * gl; R[i] += v * gr; } else { PL[i] += v * gl; PR[i] += v * gr; }
  if (send) { RL[i] += v * gl * send; RR[i] += v * gr * send; }
}
function svf() {
  let lp = 0, bp = 0;
  return (x, f, q = 0.7) => {
    const F = 2 * Math.sin(Math.PI * Math.min(f, SR / 6.5) / SR);
    const hp = x - lp - q * bp; bp += F * hp; lp += F * bp;
    return { lp, bp, hp };
  };
}

// ---------------------------------------------------------------- voices
function kick(t0, amp = 1, dk = true) {
  const s0 = Math.round(t0 * SR), len = Math.round(0.5 * SR);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    ph += TAU() * (44 + 130 * Math.exp(-t * 32)) / SR;
    let v = Math.sin(ph) * Math.exp(-t * 5.2);
    if (t < 0.003) v += noise() * 0.5 * (1 - t / 0.003);
    out(s0 + i, Math.tanh(v * 1.8) * 0.8 * amp);
  }
  if (!dk) return;
  for (let i = 0; i < 0.34 * SR; i++) {
    const t = i / SR, j = s0 + i;
    const g = 1 - 0.8 * Math.exp(-t * 8) * Math.min(1, t / 0.004 + 0.3);
    if (j < N) duck[j] = Math.min(duck[j], g);
  }
}
function TAU() { return Math.PI * 2; }
function clap(t0, amp = 1) {
  const s0 = Math.round(t0 * SR), f = svf();
  for (let i = 0; i < 0.35 * SR; i++) {
    const t = i / SR;
    let env = Math.exp(-t * 14);
    for (const o of [0, 0.011, 0.022]) if (t >= o && t < o + 0.01) env += Math.exp(-(t - o) * 250);
    const v = f(noise(), 1500, 0.9).bp * env * 0.55 * amp;
    out(s0 + i, v, 0.1, 0.35);
  }
}
function hat(t0, open, amp = 1, p = 0.3) {
  const s0 = Math.round(t0 * SR), f = svf();
  const dec = open ? 12 : 55;
  for (let i = 0; i < (open ? 0.3 : 0.08) * SR; i++) {
    const t = i / SR;
    out(s0 + i, f(noise(), 7500, 0.5).hp * Math.exp(-t * dec) * 0.2 * amp, p, 0.1);
  }
}
function bass(t0, dur, m, amp = 1) {
  const s0 = Math.round(t0 * SR), f = svf(), fr = mtof(m);
  let ph = 0;
  for (let i = 0; i < (dur + 0.05) * SR; i++) {
    const t = i / SR;
    ph += fr / SR;
    const saw = 2 * (ph % 1) - 1;
    const env = Math.min(1, t / 0.004) * (t > dur ? Math.exp(-(t - dur) * 60) : 1) * Math.exp(-t * 2);
    const v = (Math.sin(TAU() * ph) * 0.8 + f(saw, 180 + 900 * Math.exp(-t * 18), 0.6).lp * 0.6) * env;
    out(s0 + i, v * 0.42 * amp, 0, 0, 'pad');
  }
}
function pad(t0, dur, notes, amp = 1, bright = 1) {
  const s0 = Math.round(t0 * SR);
  notes.forEach((m, k) => {
    for (const det of [-0.08, 0.08]) {
      const f = svf(), fr = mtof(m + det);
      let ph = rnd();
      const p = det < 0 ? -0.6 : 0.6;
      for (let i = 0; i < (dur + 0.6) * SR; i++) {
        const t = i / SR;
        ph += fr / SR;
        const saw = 2 * (ph % 1) - 1;
        const env = Math.min(1, t / 0.06) * (t > dur ? Math.exp(-(t - dur) * 7) : 1);
        const cut = (700 + 500 * Math.sin(t * 3 + k)) * bright;
        out(s0 + i, f(saw, cut, 0.5).lp * env * 0.055 * amp, p, 0.5, 'pad');
      }
    }
  });
}
function pluck(t0, m, amp = 1, p = 0) {
  const s0 = Math.round(t0 * SR), f = svf(), fr = mtof(m);
  let ph = 0;
  for (let i = 0; i < 0.25 * SR; i++) {
    const t = i / SR;
    ph += fr / SR;
    const sq = (ph % 1) < 0.5 ? 1 : -1;
    out(s0 + i, f(sq, 400 + 4500 * Math.exp(-t * 30), 0.4).lp * Math.exp(-t * 16) * 0.11 * amp, p, 0.4);
  }
}
function stab(t0, notes, amp = 1) {
  notes.forEach((m, k) => {
    const s0 = Math.round(t0 * SR), f = svf(), fr = mtof(m);
    let ph = rnd();
    for (let i = 0; i < 0.4 * SR; i++) {
      const t = i / SR;
      ph += fr / SR;
      out(s0 + i, f(2 * (ph % 1) - 1, 600 + 5000 * Math.exp(-t * 14), 0.5).lp * Math.exp(-t * 9) * 0.1 * amp, (k - 1) * 0.5, 0.6);
    }
  });
}
function whoosh(t0, dur, f0, f1, amp = 1, p0 = -0.8, p1 = 0.8) {
  const s0 = Math.round(t0 * SR), f = svf();
  for (let i = 0; i < dur * SR; i++) {
    const q = i / (dur * SR);
    const env = Math.pow(Math.sin(Math.PI * q), 2);
    out(s0 + i, f(noise(), f0 * Math.pow(f1 / f0, q), 0.35).bp * env * 0.5 * amp, lerp(p0, p1, q), 0.3);
  }
}
function riser(t0, t1, amp = 1) {
  const s0 = Math.round(t0 * SR), len = (t1 - t0) * SR, f = svf();
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const q = i / len;
    ph += (180 * Math.pow(4, q)) / SR;
    const v = f(noise(), 300 * Math.pow(25, q), 0.3).bp * 0.55 + Math.sin(TAU() * ph) * 0.12 * q;
    out(s0 + i, v * q * q * amp, Math.sin(q * 20) * 0.4 * q, 0.4);
  }
}
function impact(t0, amp = 1) {
  const s0 = Math.round(t0 * SR), f = svf();
  let ph = 0;
  for (let i = 0; i < 1.6 * SR; i++) {
    const t = i / SR;
    ph += (30 + 50 * Math.exp(-t * 6)) / SR;
    const boom = Math.sin(TAU() * ph) * Math.exp(-t * 2.4);
    const crack = f(noise(), 1800 * Math.exp(-t * 3) + 200, 0.8).lp * Math.exp(-t * 7);
    out(s0 + i, (boom * 0.9 + crack * 0.7) * amp, 0, 0.6);
  }
}
function shimmer(t0, dur, notes, amp = 1) {
  const s0 = Math.round(t0 * SR);
  notes.forEach((m, k) => {
    const fr = mtof(m);
    for (let i = 0; i < dur * SR; i++) {
      const t = i / SR;
      const env = Math.min(1, t / 0.02) * Math.exp(-t * 1.8);
      out(s0 + i, Math.sin(TAU() * fr * t + Math.sin(TAU() * 5 * t) * 0.3) * env * 0.05 * amp, (k % 2 ? 1 : -1) * 0.7, 0.9);
    }
  });
}
function tick(t0, amp = 1, fr = 2600, p = 0) {
  const s0 = Math.round(t0 * SR);
  for (let i = 0; i < 0.02 * SR; i++) {
    const t = i / SR;
    out(s0 + i, (Math.sin(TAU() * fr * t) * 0.7 + noise() * 0.3) * Math.exp(-t * 380) * 0.3 * amp, p, 0.15);
  }
}
const lerp = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- score
const CH = [
  { b: 45, p: [57, 60, 64] }, { b: 45, p: [57, 60, 64] }, { b: 41, p: [57, 60, 65] }, { b: 36, p: [55, 60, 64] },
  { b: 43, p: [55, 59, 62] }, { b: 45, p: [57, 60, 64] }, { b: 41, p: [57, 60, 65] }, { b: 45, p: [57, 60, 64, 71] },
];
const bar = k => k * BAR;

// bar 1 — the reel: ticks follow the digit reels exactly (same curve as index.html)
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t, a, b) => clamp((t - a) / (b - a));
const outExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
const outBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const reelV = (i, t) => {
  let v = [2, 0, 2, 5][i] - (i + 1) * 10 * (1 - outExpo(P(t, 0.25, 0.95 + 0.14 * i)));
  if (i === 3) v += outBack(P(t, 1.46, 1.66));
  return v;
};
for (let i = 0; i < 4; i++) {
  let prev = Math.floor(reelV(i, 0.2)), last = -1;
  for (let t = 0.2; t < 1.7; t += 0.0005) {
    const d = Math.floor(reelV(i, t) + 0.5);
    if (d !== prev && t - last > 0.012) { tick(t, 0.5, 2200 + i * 350, (i - 1.5) * 0.5); last = t; }
    prev = d;
  }
}
tick(1.5, 1.6, 1800); tick(1.51, 1.0, 3600);
pad(0.0, BAR, CH[0].p, 0.7, 0.6);
riser(0.35, BAR, 0.8);
whoosh(1.62, 0.26, 300, 5000, 0.9);

// bars 2–6 and 8: the groove
for (let k = 1; k < 8; k++) {
  const t0 = bar(k), c = CH[k];
  const breakdown = k === 6;
  for (let b = 0; b < 4; b++) {
    const tb = t0 + b * B;
    if (!breakdown || b === 0) kick(tb, breakdown ? 1.1 : 1);
    if (!breakdown) {
      hat(tb + B / 2, true, 0.8);
      if (b % 2 === 1 && k >= 2) clap(tb, 0.9);
      if (k >= 3) for (const s of [0.25, 0.75]) hat(tb + s * B, false, 0.6, -0.3);
      bass(tb, B / 2 - 0.02, c.b, 1);
      bass(tb + B / 2, B / 2 - 0.02, c.b + 12, 0.7);
    }
  }
  if (!breakdown) pad(t0, BAR - 0.05, c.p, 1, k === 7 ? 1.6 : 1);
  // arpeggio through the middle bars
  if (k >= 2 && k <= 5) {
    const seq = [c.p[0] + 12, c.p[1] + 12, c.p[2] + 12, c.p[1] + 24, c.p[2] + 12, c.p[0] + 24, c.p[1] + 12, c.p[2] + 24];
    for (let s = 0; s < 16; s++) pluck(t0 + s * B / 4, seq[s % 8], s % 4 === 0 ? 1 : 0.7, s % 2 ? 0.5 : -0.5);
  }
}
// hits and transitions
impact(bar(1), 1.0);
whoosh(bar(1) + 3 * B, 0.46, 200, 7000, 0.9, -0.3, 0.3);   // zoom into the zero
tick(bar(2), 1, 1200);
whoosh(bar(3) + 3 * B - 0.1, 0.4, 400, 3000, 0.6);          // grid to orbit
riser(bar(3) + 2 * B, bar(4), 0.6);                          // sun fills frame
impact(bar(4), 0.8);
for (let b = 0; b < 4; b++) stab(bar(4) + b * B, CH[4].p.map(m => m + 12), 1);
for (let b = 1; b < 4; b++) whoosh(bar(4) + b * B - 0.08, 0.22, 800, 6000, 0.7, b % 2 ? -0.8 : 0.8, b % 2 ? 0.8 : -0.8);
whoosh(bar(5) - 0.18, 0.2, 3000, 300, 0.7);                  // bars drop
for (const [a, d] of [[0, 0.34], [B, 0.3], [2 * B, 0.34], [3 * B, 0.3], [BAR - 0.36, 0.36]]) {
  whoosh(bar(5) + a, d, 500, 5000, 0.9, -0.9, 0.9);           // whip pans
  tick(bar(5) + a + d, 0.9, 3000);
}
// bar 7 — eclipse breakdown
pad(bar(6), 3 * B, CH[6].p, 1.1, 0.8);
pad(bar(6) + 3 * B, B + 0.1, [56, 59, 64], 1.2, 1.4);
bass(bar(6), 3 * B, 41, 0.8);
kick(bar(6) + B, 0.45, false); kick(bar(6) + B + 0.17, 0.3, false);
kick(bar(6) + 2 * B, 0.5, false); kick(bar(6) + 2 * B + 0.17, 0.35, false);
riser(bar(6) + 0.1, bar(6) + 3 * B, 1.1);
impact(bar(6) + 3 * B, 1.1);
shimmer(bar(6) + 3 * B, 1.6, [76, 80, 83, 88], 1);
whoosh(bar(7) - 0.26, 0.26, 200, 4000, 0.9, 0, 0);
// bar 8 — finale
impact(bar(7), 0.9);
riser(bar(7) + 0.2, bar(7) + 2 * B, 0.5);
impact(bar(7) + 2 * B, 1.0);
stab(bar(7) + 2 * B, [69, 72, 76, 81], 1.2);
shimmer(bar(7) + 2 * B, 1.0, [81, 84, 88], 0.8);
whoosh(bar(7) + 3 * B - 0.05, 0.4, 1000, 9000, 0.5);

// ---------------------------------------------------------------- reverb
function reverb(inp, combs, aps) {
  const o = new Float32Array(N);
  for (const d of combs) {
    const buf = new Float32Array(d); let idx = 0, lp = 0;
    for (let i = 0; i < N; i++) {
      const y = buf[idx];
      lp = y * 0.7 + lp * 0.3;
      buf[idx] = inp[i] + lp * 0.8;
      idx = (idx + 1) % d;
      o[i] += y / combs.length;
    }
  }
  for (const d of aps) {
    const buf = new Float32Array(d); let idx = 0;
    for (let i = 0; i < N; i++) {
      const b = buf[idx], x = o[i];
      const y = -x + b; buf[idx] = x + b * 0.5; idx = (idx + 1) % d; o[i] = y;
    }
  }
  return o;
}
const WL = reverb(RL, [1557, 1617, 1491, 1422, 1277, 1356], [225, 556]);
const WR = reverb(RR, [1580, 1640, 1514, 1445, 1300, 1379], [248, 579]);

// ---------------------------------------------------------------- master
const mix = new Float32Array(N * 2);
let peak = 0;
let dcL = 0, dcR = 0;
for (let i = 0; i < N; i++) {
  let l = L[i] + PL[i] * duck[i] + WL[i] * 0.9;
  let r = R[i] + PR[i] * duck[i] + WR[i] * 0.9;
  dcL += (l - dcL) * 0.0005; dcR += (r - dcR) * 0.0005;
  l = Math.tanh((l - dcL) * 0.6); r = Math.tanh((r - dcR) * 0.6);
  const t = i / SR;
  const fade = Math.min(1, t / 0.005) * Math.min(1, (DUR - t) / 0.35);
  mix[2 * i] = l * fade; mix[2 * i + 1] = r * fade;
  peak = Math.max(peak, Math.abs(l), Math.abs(r));
}
const g = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N * 2; i++) buf.writeInt16LE(Math.round(clamp(mix[i] * g, -1, 1) * 32767), 44 + i * 2);
fs.writeFileSync(path.join(__dirname, 'soundtrack.wav'), buf);
console.log('soundtrack.wav written, peak before normalize', peak.toFixed(3));
