// Synthesizes the soundtrack at 100 BPM. It reads the scene order from reel-data.js,
// so every hit stays locked to the picture. It writes three files:
//   score.wav       the full synthesized score
//   soundtrack.wav  the score; mix.js replaces it with your songs when muziek/ has them
// Pure JS, no dependencies: node audio.js
const fs = require('fs');
const path = require('path');
const REEL = require('./reel-data.js');

let B = REEL.B, BAR = REEL.BAR; // set per scene below: a chapter can follow a song's tempo
const { seq: SEQ, total: DUR } = REEL.sequence();
const SR = 44100, N = Math.ceil(SR * DUR);
console.log(`score en effecten maken (${DUR.toFixed(0)} s)…`);
const SWOOSH = 0.32; // matches the swoosh between shots in index.html

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
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t, a, b) => clamp((t - a) / (b - a));
const outExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
const outBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

// chords: bass note + pad voicing (A minor)
const CH = {
  Am: { b: 45, p: [57, 60, 64] }, F: { b: 41, p: [57, 60, 65] }, C: { b: 36, p: [55, 60, 64] },
  G: { b: 43, p: [55, 59, 62] }, Dm: { b: 38, p: [57, 62, 65] }, E: { b: 40, p: [56, 59, 64] },
};
const PROG = [['Am', 'F', 'C', 'G'], ['F', 'G', 'Am', 'Am'], ['C', 'G', 'Am', 'F'], ['Dm', 'F', 'C', 'G'], ['Am', 'Am', 'F', 'G']];
const tr = (c, k) => ({ b: c.b + k, p: c.p.map(m => m + k) });

// one bar of groove; level 1 = light, 2 = news bed, 3 = full
function grooveBar(t0, c, level, opts = {}) {
  pad(t0, BAR - 0.05, c.p, 1, opts.bright || 1);
  for (let b = 0; b < 4; b++) {
    const tb = t0 + b * B;
    kick(tb, level >= 3 ? 1 : 0.85);
    hat(tb + B / 2, true, level >= 2 ? 0.8 : 0.5);
    if (level >= 2 && b % 2 === 1) clap(tb, level >= 3 ? 0.9 : 0.7);
    if (level >= 2) for (const s of [0.25, 0.75]) hat(tb + s * B, false, 0.5, -0.3);
    // news-style staccato bass pulse in sixteenths
    for (let s = 0; s < 4; s++) bass(tb + s * B / 4, B / 4 - 0.03, c.b + (s === 2 ? 12 : 0), s ? 0.55 : 0.9);
  }
  if (opts.arp) {
    const seq = [c.p[0] + 12, c.p[1] + 12, c.p[2] + 12, c.p[1] + 24, c.p[2] + 12, c.p[0] + 24, c.p[1] + 12, c.p[2] + 24];
    for (let s = 0; s < 16; s++) pluck(t0 + s * B / 4, seq[s % 8], (s % 4 === 0 ? 1 : 0.7) * opts.arp, s % 2 ? 0.5 : -0.5);
  }
}
// the news chime that opens every headline
function chime(t0, lift = 0) {
  pluck(t0, 84 + lift, 1.4, -0.3); pluck(t0 + B / 2, 79 + lift, 1.2, 0.3);
  shimmer(t0, 1.2, [84 + lift, 91 + lift], 0.5);
}

// the reel ticks: the same curve as index.html, stretched to one bar
const OB = 60 / 128;
let K = BAR / (4 * OB);
const reelV = (i, t) => {
  let v = [2, 0, 2, 5][i] - (i + 1) * 10 * (1 - outExpo(P(t, 0.25, 0.95 + 0.14 * i)));
  if (i === 3) v += outBack(P(t, 1.46, 1.66));
  return v;
};

let progI = 0;
for (const sc of SEQ) {
  const t0 = sc.start, bars = sc.bars;
  BAR = sc.bar; B = sc.beat; K = BAR / (4 * OB);
  const at = k => t0 + k * BAR;
  switch (sc.kind) {
    case 'rol': {
      for (let i = 0; i < 4; i++) {
        let prev = Math.floor(reelV(i, 0.2) + 0.5), last = -1;
        for (let t = 0.2; t < 1.7; t += 0.0005) {
          const d = Math.floor(reelV(i, t) + 0.5);
          if (d !== prev && t - last > 0.012) { tick(t0 + t * K, 0.5, 2200 + i * 350, (i - 1.5) * 0.5); last = t; }
          prev = d;
        }
      }
      tick(t0 + 1.46 * K, 1.6, 1800); tick(t0 + 1.47 * K, 1.0, 3600);
      pad(t0, BAR, CH.Am.p, 0.7, 0.6);
      riser(t0 + 0.3, t0 + BAR, 0.8);
      whoosh(t0 + 1.62 * K, BAR - 1.62 * K, 300, 5000, 0.9);
      break;
    }
    case 'knal': {
      impact(t0, 1.0);
      grooveBar(t0, CH.Am, 3);
      stab(t0 + B, [69, 72, 76], 1.0);
      whoosh(t0 + 3 * B, B, 200, 7000, 0.9, -0.3, 0.3);
      break;
    }
    case 'raster': { tick(t0, 1, 1200); grooveBar(t0, CH.F, 3, { arp: 0.8 }); whoosh(t0 + 3 * B - 0.1, 0.5, 400, 3000, 0.6); break; }
    case 'baan': { grooveBar(t0, CH.C, 3, { arp: 0.8 }); riser(t0 + 2 * B, t0 + BAR, 0.7); break; }
    case 'getallen': {
      impact(t0, 0.8);
      grooveBar(t0, CH.G, 3);
      for (let b = 0; b < 4; b++) { stab(t0 + b * B, [69, 72, 76].map(m => m + [0, 2, 3, 5][b]), 1.1); if (b) whoosh(t0 + b * B - 0.1, 0.25, 800, 6000, 0.6, b % 2 ? -0.8 : 0.8, b % 2 ? 0.8 : -0.8); }
      break;
    }
    case 'opening': {
      // the network ident: a big hit, rising strings, the theme
      impact(t0, 1.1);
      stab(t0, [57, 64, 69, 72], 1.3);
      grooveBar(at(0), CH.Am, 3, { arp: 0.7, bright: 1.3 });
      grooveBar(at(1), CH.F, 3, { arp: 0.7, bright: 1.3 });
      [0, 0.75, 1.5, 3, 3.5].forEach((b, i) => stab(t0 + b * B, [69, 72, 76, 81].map(m => m + (i === 4 ? 2 : 0)), 0.9));
      chime(at(1) + 2 * B);
      whoosh(t0 + sc.dur - 0.35, 0.7, 500, 6000, 0.9);
      break;
    }
    case 'maand': {
      const lift = sc.m >= 6 ? 2 : 0; // the summer goes up a whole tone
      const prog = PROG[progI++ % PROG.length];
      const STING = REEL.STING_BARS * BAR, ITEM = REEL.ITEM_BARS * BAR, ZON_T = 1.25 * BAR;
      // month sting: a hit and two beats of drums
      impact(t0, 0.6); stab(t0, CH[prog[0]].p.map(m => m + 12 + lift), 1.0);
      pad(t0, STING, tr(CH[prog[0]], lift).p, 1.1, 1.2);
      kick(t0, 0.9); kick(t0 + B, 0.7, false); hat(t0 + B / 2, true, 0.6); riser(t0 + 0.2, t0 + STING, 0.35);
      sc.items.forEach((it, k) => {
        const i0 = t0 + STING + k * ITEM;
        chime(i0 + 0.12, lift);
        whoosh(i0 - SWOOSH, 2 * SWOOSH, 500, 6000, 0.55);
        if (it.beeld === 'zon' && !it.media) {
          // the eclipse: the drums drop out and it builds to totality
          pad(i0, ZON_T, [57, 60, 65].map(m => m + lift), 1.1, 0.7); bass(i0, ZON_T, 41 + lift, 0.6);
          riser(i0 + 0.2, i0 + ZON_T, 1.1); for (let b = 1; b < 5; b += 2) kick(i0 + b * B, 0.4, false);
          impact(i0 + ZON_T, 1.1); shimmer(i0 + ZON_T, 2.2, [76, 80, 83, 88].map(m => m + lift), 1);
          pad(i0 + ZON_T, ITEM - ZON_T, [56, 59, 64].map(m => m + lift), 1.2, 1.4);
          return;
        }
        for (let q = 0; q < REEL.ITEM_BARS; q++) {
          const c = tr(CH[prog[(k * 2 + q + 1) % 4]], lift);
          grooveBar(i0 + q * BAR, c, 2, { arp: q === 1 ? 0.5 : 0, bright: 1 + 0.04 * sc.m });
        }
      });
      break;
    }
    case 'memoriam': {
      whoosh(t0 - 0.3, 0.5, 3000, 300, 0.4);
      const ch = ['Am', 'F', 'C', 'G'];
      for (let k = 0; k < bars; k++) pad(at(k), BAR - 0.05, CH[ch[k]].p, 0.9, 0.6);
      bass(t0, bars * BAR - 0.3, 45, 0.5);
      [0.9, 1.4, 1.9, 2.4, 2.9, 3.4].forEach((d, i) => pluck(t0 + d, [76, 79, 81, 83, 84, 88][i], 0.8, i % 2 ? 0.4 : -0.4));
      shimmer(t0 + 5, 4, [81, 84, 88], 0.6);
      break;
    }
    case 'dossier': {
      for (let k = 0; k < bars; k++) {
        pad(at(k), BAR - 0.05, [k < 1 ? 57 : 56, 60, 64], 0.7, 0.6);
        for (let s = 0; s < 8; s++) hat(at(k) + s * B / 2, false, 0.7, s % 2 ? 0.4 : -0.4);
        for (let b = 0; b < 4; b++) bass(at(k) + b * B, 0.2, k < 1 ? 33 : 32, 0.9);
      }
      for (let i = 0; i < 11; i++) { const tt = t0 + 0.5 + i * B / 2; clap(tt, 0.5); kick(tt, 0.35, false); }
      impact(t0 + 1.5 * BAR, 1.0); stab(t0 + 1.5 * BAR, [68, 71, 76], 1.0);
      riser(t0 + 1.5 * BAR + 0.5, t0 + sc.dur, 1.0);
      whoosh(t0 + sc.dur - 0.9, 0.9, 6000, 200, 0.8, 0, 0);
      break;
    }
    case 'finale': {
      whoosh(t0, 0.8, 200, 7000, 0.9, 0, 0);
      pad(t0, BAR, CH.E.p, 1, 1.2);
      riser(t0 + 0.2, at(1), 0.7);
      impact(at(1), 1.1); stab(at(1), [69, 72, 76, 81], 1.3); shimmer(at(1), 2.0, [81, 84, 88], 0.8);
      for (let k = 1; k < bars - 1; k++) grooveBar(at(k), CH[['Am', 'F', 'C', 'G'][k - 1]], 3, { arp: 0.8, bright: 1.5 });
      impact(t0 + 2.4 * BAR, 0.6);
      const cd = t0 + sc.dur - BAR;
      for (let b = 0; b < 4; b++) { const tb = cd + b * B; kick(tb, 1.1); stab(tb, [69, 72, 76].map(m => m + [0, 3, 5, 12][b]), 1.1); tick(tb, 1, 1000 + 400 * b); }
      impact(cd + 3 * B, 1.2);
      break;
    }
  }
}

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
function writeWav(file, data, gain) {
  const n = data.length / 2;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n * 2; i++) buf.writeInt16LE(Math.round(clamp(data[i] * gain, -1, 1) * 32767), 44 + i * 2);
  fs.writeFileSync(path.join(__dirname, file), buf);
}
writeWav('score.wav', mix, 0.8 / peak);
fs.copyFileSync(path.join(__dirname, 'score.wav'), path.join(__dirname, 'soundtrack.wav'));
console.log('score.wav en soundtrack.wav geschreven');
