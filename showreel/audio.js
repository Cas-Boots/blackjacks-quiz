// Synthesizes the film's sound from the same timeline as the picture (reel-data.js),
// so every hit, gag and transition lands on its frame. It writes two stems:
//   score.wav  the music: a bouncy chiptune-pop score that follows each chapter's tempo
//   sfx.wav    the effects: whooshes, slams, rips, and every maatje's gag sound
// Both are 32-bit float at fixed levels; `node muziek.js mix` puts them together
// with your songs (where you have them) into soundtrack.wav.
// Pure JS, no dependencies: node audio.js
const fs = require('fs');
const path = require('path');
const REEL = require('./reel-data.js');

let B = REEL.B, BAR = REEL.BAR; // set per scene below: a chapter can follow a song's tempo
const { seq: SEQ, total: DUR } = REEL.sequence();
const SR = 44100, N = Math.ceil(SR * DUR);

// the music: a dry bus, a bus that ducks under the kick (pads, bass), a reverb send
const ML = new Float32Array(N), MR = new Float32Array(N);
const PL = new Float32Array(N), PR = new Float32Array(N);
const RL = new Float32Array(N), RR = new Float32Array(N);
const duck = new Float32Array(N).fill(1);
// the effects, with their own reverb send
const XL = new Float32Array(N), XR = new Float32Array(N);
const YL = new Float32Array(N), YR = new Float32Array(N);
let BUS = 'mus';

let seed = 2026;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const P = (t, a, b) => clamp((t - a) / (b - a));
const pan = p => [Math.cos((p + 1) * Math.PI / 4), Math.sin((p + 1) * Math.PI / 4)];
function out(i, v, p = 0, send = 0, sc = false) {
  if (i < 0 || i >= N) return;
  const [gl, gr] = pan(p);
  if (BUS === 'sfx') { XL[i] += v * gl; XR[i] += v * gr; if (send) { YL[i] += v * gl * send; YR[i] += v * gr * send; } return; }
  if (sc) { PL[i] += v * gl; PR[i] += v * gr; } else { ML[i] += v * gl; MR[i] += v * gr; }
  if (send) { RL[i] += v * gl * send; RR[i] += v * gr * send; }
}
// a state-variable filter (the stable, trapezoidal kind); q is the damping: 1.4 is soft, 0.1 rings
function svf() {
  let ic1 = 0, ic2 = 0;
  return (x, f, q = 0.7) => {
    const g = Math.tan(Math.PI * Math.min(f, SR * 0.45) / SR), a1 = 1 / (1 + g * (g + q)), a2 = g * a1, a3 = g * a2;
    const v3 = x - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2;
    return { lp: v2, bp: v1, hp: x - q * v1 - v2 };
  };
}
const S = t => Math.round(t * SR);

// ================================================================ the band
function kick(t0, amp = 1, dk = true) {
  const s0 = S(t0); let ph = 0;
  for (let i = 0; i < 0.36 * SR; i++) {
    const t = i / SR;
    ph += TAU * (48 + 120 * Math.exp(-t * 30)) / SR;
    let v = Math.sin(ph) * Math.exp(-t * 7.5);
    if (t < 0.004) v += noise() * 0.45 * (1 - t / 0.004);
    out(s0 + i, Math.tanh(v * 1.7) * 0.75 * amp);
  }
  if (!dk) return;
  for (let i = 0; i < 0.3 * SR; i++) { const t = i / SR, j = s0 + i; if (j < N) duck[j] = Math.min(duck[j], 1 - 0.7 * Math.exp(-t * 9)); }
}
function snare(t0, amp = 1, p = 0.05) {
  const s0 = S(t0), f = svf(); let ph = 0;
  for (let i = 0; i < 0.25 * SR; i++) {
    const t = i / SR;
    ph += TAU * (200 - 40 * Math.min(1, t * 20)) / SR;
    const body = Math.sin(ph) * Math.exp(-t * 22) * 0.5;
    const sn = f(noise(), 1800, 0.6).hp * Math.exp(-t * 16) * 0.55;
    out(s0 + i, (body + sn) * amp * 0.7, p, 0.25);
  }
}
function clap(t0, amp = 1) {
  const s0 = S(t0), f = svf();
  for (let i = 0; i < 0.3 * SR; i++) {
    const t = i / SR;
    let env = Math.exp(-t * 16);
    for (const o of [0, 0.010, 0.021]) if (t >= o && t < o + 0.009) env += Math.exp(-(t - o) * 260);
    out(s0 + i, f(noise(), 1500, 0.9).bp * env * 0.5 * amp, 0.1, 0.3);
  }
}
function hat(t0, open, amp = 1, p = 0.3) {
  const s0 = S(t0), f = svf();
  const dec = open ? 13 : 60;
  for (let i = 0; i < (open ? 0.28 : 0.07) * SR; i++) {
    const t = i / SR;
    out(s0 + i, f(noise(), 8000, 0.5).hp * Math.exp(-t * dec) * 0.18 * amp, p, 0.08);
  }
}
const CRASH_F = [205.3, 304.4, 369.6, 522.7, 540, 800].map(f => f * 2.3);
function crash(t0, amp = 1, len = 1.8) {
  const s0 = S(t0);
  for (const side of [-0.45, 0.45]) {
    const f = svf(), g = svf(); const ph = CRASH_F.map(() => rnd());
    for (let i = 0; i < len * SR; i++) {
      const t = i / SR;
      let m = 0; for (let k = 0; k < 6; k++) { ph[k] += CRASH_F[k] * (1 + side * 0.01) / SR; m += (ph[k] % 1) < 0.5 ? 1 : -1; }
      const v = f(m * 0.12 + noise() * 0.6, 6500, 0.4).hp;
      out(s0 + i, g(v, 12000, 0.5).lp * Math.exp(-t * 2.6) * (1 - Math.exp(-t * 400)) * 0.32 * amp, side, 0.25);
    }
  }
}
function tom(t0, f0, amp = 1, p = 0) {
  const s0 = S(t0); let ph = 0;
  for (let i = 0; i < 0.4 * SR; i++) {
    const t = i / SR;
    ph += TAU * f0 * (1 + 0.6 * Math.exp(-t * 25)) / SR;
    out(s0 + i, Math.sin(ph) * Math.exp(-t * 8) * 0.55 * amp + (t < 0.003 ? noise() * 0.3 : 0), p, 0.2);
  }
}
// a chippy bass: a pulse through a filter, with a sine under it
function bass(t0, dur, m, amp = 1) {
  const s0 = S(t0), f = svf(), fr = mtof(m); let ph = 0;
  for (let i = 0; i < (dur + 0.03) * SR; i++) {
    const t = i / SR;
    ph += fr / SR;
    const pulse = (ph % 1) < 0.5 ? 1 : -1;
    const env = Math.min(1, t / 0.003) * (t > dur ? Math.exp(-(t - dur) * 80) : 1) * (0.75 + 0.25 * Math.exp(-t * 10));
    const v = (Math.sin(TAU * ph) * 0.7 + f(pulse, 500 + 1600 * Math.exp(-t * 22), 0.5).lp * 0.4) * env;
    out(s0 + i, v * 0.4 * amp, 0, 0, true);
  }
}
function pad(t0, dur, notes, amp = 1, bright = 1) {
  const s0 = S(t0);
  notes.forEach((m, k) => {
    for (const det of [-0.08, 0.08]) {
      const f = svf(), fr = mtof(m + det);
      let ph = rnd();
      const p = det < 0 ? -0.6 : 0.6;
      for (let i = 0; i < (dur + 0.5) * SR; i++) {
        const t = i / SR;
        ph += fr / SR;
        const env = Math.min(1, t / 0.05) * (t > dur ? Math.exp(-(t - dur) * 8) : 1);
        const cut = (900 + 500 * Math.sin(t * 3 + k)) * bright;
        out(s0 + i, f(2 * (ph % 1) - 1, cut, 0.5).lp * env * 0.045 * amp, p, 0.45, true);
      }
    }
  });
}
// square plucks for the arpeggios
function pluck(t0, m, amp = 1, p = 0) {
  const s0 = S(t0), f = svf(), fr = mtof(m); let ph = 0;
  for (let i = 0; i < 0.22 * SR; i++) {
    const t = i / SR;
    ph += fr / SR;
    out(s0 + i, f((ph % 1) < 0.5 ? 1 : -1, 600 + 5000 * Math.exp(-t * 30), 0.4).lp * Math.exp(-t * 15) * 0.09 * amp, p, 0.35);
  }
}
// the chiptune lead: two narrow pulses, a little apart, with vibrato that comes in late
function lead(t0, dur, m, amp = 1) {
  const s0 = S(t0), fr = mtof(m);
  [[-0.35, 0.997, 0.25], [0.35, 1.003, 0.22]].forEach(([p, det, duty]) => {
    const f = svf(); let ph = rnd();
    for (let i = 0; i < (dur + 0.08) * SR; i++) {
      const t = i / SR;
      const vib = 1 + 0.012 * Math.sin(TAU * 5.8 * t) * P(t, 0.1, 0.25);
      ph += fr * det * vib / SR;
      const env = Math.min(1, t / 0.004) * (0.7 + 0.3 * Math.exp(-t * 12)) * (t > dur ? Math.exp(-(t - dur) * 50) : 1);
      out(s0 + i, f((ph % 1) < duty ? 1 : -1, 3200, 0.5).lp * env * 0.085 * amp, p, 0.3);
    }
  });
}
function stab(t0, notes, amp = 1, len = 0.4) {
  notes.forEach((m, k) => {
    const s0 = S(t0), f = svf(), fr = mtof(m); let ph = rnd();
    for (let i = 0; i < len * SR; i++) {
      const t = i / SR;
      ph += fr / SR;
      out(s0 + i, f(2 * (ph % 1) - 1, 700 + 5000 * Math.exp(-t * 14), 0.5).lp * Math.exp(-t * 8) * 0.085 * amp, (k - 1) * 0.5, 0.5);
    }
  });
}
// glockenspiel
function glock(t0, m, amp = 1, p = 0) {
  const s0 = S(t0), fr = mtof(m);
  for (let i = 0; i < 1.2 * SR; i++) {
    const t = i / SR;
    const v = Math.sin(TAU * fr * t) * Math.exp(-t * 3) + 0.35 * Math.sin(TAU * fr * 2.76 * t) * Math.exp(-t * 7) + 0.12 * Math.sin(TAU * fr * 5.4 * t) * Math.exp(-t * 12);
    out(s0 + i, v * Math.min(1, t / 0.002) * 0.07 * amp, p, 0.5);
  }
}

// ================================================================ the effects
const sfx = f => (...a) => { const keep = BUS; BUS = 'sfx'; f(...a); BUS = keep; };
const whoosh = sfx((t0, dur, f0, f1, amp = 1, p0 = -0.8, p1 = 0.8) => {
  const s0 = S(t0), f = svf(), g = svf();
  for (let i = 0; i < dur * SR; i++) {
    const q = i / (dur * SR);
    const env = Math.pow(Math.sin(Math.PI * q), 2);
    const fc = f0 * Math.pow(f1 / f0, q);
    out(s0 + i, g(f(noise(), fc, 0.35).bp, 150, 0.7).hp * env * 0.55 * amp, lerp(p0, p1, q), 0.25);
  }
});
const impact = sfx((t0, amp = 1) => {
  const s0 = S(t0), f = svf(); let ph = 0;
  for (let i = 0; i < 1.1 * SR; i++) {
    const t = i / SR;
    ph += (42 + 70 * Math.exp(-t * 9)) / SR;
    const boom = Math.sin(TAU * ph) * Math.exp(-t * 4.5);
    const crack = f(noise(), 2400 * Math.exp(-t * 4) + 300, 0.8).lp * Math.exp(-t * 9);
    out(s0 + i, (boom * 0.75 + crack * 0.8) * amp * 0.8, 0, 0.4);
  }
});
const riser = sfx((t0, t1, amp = 1) => {
  const s0 = S(t0), len = (t1 - t0) * SR, f = svf(); let ph = 0;
  for (let i = 0; i < len; i++) {
    const q = i / len;
    ph += (220 * Math.pow(4, q)) / SR;
    const v = f(noise(), 400 * Math.pow(20, q), 0.3).bp * 0.5 + Math.sin(TAU * ph) * 0.1 * q;
    out(s0 + i, v * q * q * amp * 0.8, Math.sin(q * 20) * 0.4 * q, 0.3);
  }
});
const tick = sfx((t0, amp = 1, fr = 2600, p = 0) => {
  const s0 = S(t0);
  for (let i = 0; i < 0.02 * SR; i++) { const t = i / SR; out(s0 + i, (Math.sin(TAU * fr * t) * 0.7 + noise() * 0.3) * Math.exp(-t * 380) * 0.28 * amp, p, 0.1); }
});
// the stadium airhorn: daaa da da daaaaa
const airhorn = sfx((t0, amp = 1) => {
  [[0, 0.16], [0.2, 0.07], [0.3, 0.07], [0.4, 0.5]].forEach(([o, d]) => {
    const s0 = S(t0 + o), f = svf(); const ph = [0, 0.3, 0.6, 0.1];
    for (let i = 0; i < (d + 0.05) * SR; i++) {
      const t = i / SR;
      const bend = Math.pow(2, (-1.5 * Math.exp(-t * 40)) / 12) * (1 + 0.006 * Math.sin(TAU * 6 * t));
      let v = 0; [1, 1.004, 0.996, 2.002].forEach((m, k) => { ph[k] += 466 * m * bend / SR; v += (2 * (ph[k] % 1) - 1) * (k === 3 ? 0.4 : 1); });
      const env = Math.min(1, t / 0.008) * (t > d ? Math.exp(-(t - d) * 60) : 1);
      out(s0 + i, Math.tanh(f(v * 0.4, 1700, 0.9).bp * 2.2) * env * 0.42 * amp, 0, 0.3);
    }
  });
});
// the party blower: pfrrrt
const toeter = sfx((t0, amp = 1) => {
  const s0 = S(t0), f = svf(); let ph = 0;
  for (let i = 0; i < 0.6 * SR; i++) {
    const t = i / SR;
    ph += (480 + 260 * P(t, 0, 0.12) + 90 * P(t, 0.45, 0.6)) / SR;
    const buzz = (2 * (ph % 1) - 1) * (0.6 + 0.4 * Math.sign(Math.sin(TAU * 34 * t)));
    const env = Math.min(1, t / 0.02) * (t > 0.5 ? Math.exp(-(t - 0.5) * 30) : 1);
    out(s0 + i, f(buzz, 1500, 1.0).bp * env * 0.55 * amp, 0.2, 0.2);
  }
});
// a horn: toet toet
const toet = sfx((t0, amp = 1) => {
  [0, 0.17].forEach(o => {
    const s0 = S(t0 + o), f = svf();
    for (let i = 0; i < 0.13 * SR; i++) {
      const t = i / SR;
      const v = ((t * 415) % 1 < 0.5 ? 1 : -1) + ((t * 523) % 1 < 0.5 ? 0.8 : -0.8);
      out(s0 + i, f(v, 2400, 0.7).lp * Math.min(1, t / 0.005) * (t > 0.11 ? Math.exp(-(t - 0.11) * 80) : 1) * 0.16 * amp, 0.25, 0.2);
    }
  });
});
// a low ship's horn
const tuut = sfx((t0, amp = 1) => {
  const s0 = S(t0), f = svf();
  for (let i = 0; i < 0.9 * SR; i++) {
    const t = i / SR, vib = 1 + 0.004 * Math.sin(TAU * 5 * t);
    const v = (2 * ((t * 98 * vib) % 1) - 1) + 0.7 * (2 * ((t * 147 * vib) % 1) - 1);
    out(s0 + i, f(v, 700, 0.8).lp * Math.min(1, t / 0.06) * (t > 0.7 ? Math.exp(-(t - 0.7) * 15) : 1) * 0.3 * amp, -0.2, 0.4);
  }
});
// doing!
const boing = sfx((t0, amp = 1) => {
  const s0 = S(t0); let ph = 0;
  for (let i = 0; i < 0.7 * SR; i++) {
    const t = i / SR;
    const fr = 180 + 260 * (1 - Math.exp(-t * 9)) + 70 * Math.sin(TAU * 13 * t) * Math.exp(-t * 3);
    ph += fr / SR;
    const v = Math.sin(TAU * ph) + 0.35 * Math.sin(TAU * ph * 2) + 0.15 * Math.sin(TAU * ph * 3);
    out(s0 + i, v * Math.exp(-t * 5) * Math.min(1, t / 0.003) * 0.3 * amp, 0.1, 0.2);
  }
});
// a slide whistle, up or down
const fluit = sfx((t0, f0, f1, dur, amp = 1) => {
  const s0 = S(t0), f = svf(); let ph = 0;
  for (let i = 0; i < (dur + 0.05) * SR; i++) {
    const t = i / SR, q = P(t, 0, dur);
    const fr = f0 * Math.pow(f1 / f0, E2(q)) * (1 + 0.012 * Math.sin(TAU * 7 * t));
    ph += fr / SR;
    const v = Math.sin(TAU * ph) + f(noise(), fr, 2).bp * 0.15;
    out(s0 + i, v * Math.min(1, t / 0.02) * (t > dur ? Math.exp(-(t - dur) * 60) : 1) * 0.22 * amp, 0, 0.25);
  }
});
const E2 = q => q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
const plop = sfx((t0, amp = 1, f0 = 900, f1 = 160, dur = 0.07) => {
  const s0 = S(t0); let ph = 0;
  for (let i = 0; i < (dur + 0.05) * SR; i++) {
    const t = i / SR;
    ph += f0 * Math.pow(f1 / f0, Math.min(1, t / dur)) / SR;
    out(s0 + i, Math.sin(TAU * ph) * Math.exp(-t * 30) * 0.4 * amp, 0, 0.15);
  }
});
const ping = sfx((t0, amp = 1, fr = 1568) => {
  const s0 = S(t0);
  for (let i = 0; i < 1.4 * SR; i++) {
    const t = i / SR;
    const v = Math.sin(TAU * fr * t) * Math.exp(-t * 2.5) + 0.5 * Math.sin(TAU * fr * 2.01 * t) * Math.exp(-t * 4) + 0.3 * Math.sin(TAU * fr * 3.9 * t) * Math.exp(-t * 7);
    out(s0 + i, v * Math.min(1, t / 0.002) * 0.14 * amp, 0.3, 0.45);
  }
});
const piep = sfx((t0, amp = 1) => {
  [[0, 2300, 3400], [0.11, 2600, 3700]].forEach(([o, a, b]) => {
    const s0 = S(t0 + o); let ph = 0;
    for (let i = 0; i < 0.08 * SR; i++) { const t = i / SR; ph += lerp(a, b, t / 0.08) / SR; out(s0 + i, Math.sin(TAU * ph) * Math.sin(Math.PI * t / 0.08) * 0.14 * amp, 0.3, 0.1); }
  });
});
// a parrot: krr-kwek
const kwek = sfx((t0, amp = 1) => {
  [0, 0.2].forEach((o, k) => {
    const s0 = S(t0 + o), f = svf(); let ph = 0;
    for (let i = 0; i < 0.16 * SR; i++) {
      const t = i / SR;
      ph += 1050 * (1 + 0.09 * Math.sin(TAU * 26 * t)) * (k ? 1.15 : 1) * (1 - 0.25 * t / 0.16) / SR;
      out(s0 + i, f(2 * (ph % 1) - 1, 1900, 0.4).bp * Math.sin(Math.PI * t / 0.16) * 0.5 * amp, 0.35, 0.15);
    }
  });
});
// a crowd going wild
const juichen = sfx((t0, amp = 1, dur = 1.8) => {
  const s0 = S(t0);
  for (let v = 0; v < 26; v++) {
    const f = svf(), fq = 350 + rnd() * 1300, p = rnd() * 1.6 - 0.8, o = rnd() * 0.15, pitch = 260 + rnd() * 420; let ph = rnd();
    for (let i = 0; i < dur * SR; i++) {
      const t = i / SR - o; if (t < 0) continue;
      const env = Math.min(1, t / 0.18) * Math.exp(-Math.max(0, t - 0.4) * 2.2) * (0.7 + 0.3 * Math.sin(t * (3 + v % 5) + v));
      ph += pitch * (1 + 0.04 * Math.sin(TAU * 5 * t + v)) / SR;
      const woo = Math.sin(TAU * ph) * 0.25 + f(noise(), fq, 3).bp;
      out(s0 + i, woo * env * 0.06 * amp, p, 0.35);
    }
  }
});
// a few hundred hands clapping
const applaus = sfx((t0, dur = 1.6, amp = 1) => {
  const n = Math.round(dur * 45);
  for (let k = 0; k < n; k++) {
    const at = t0 + rnd() * dur, s0 = S(at), f = svf(), fq = 1000 + rnd() * 1800, p = rnd() * 1.6 - 0.8;
    const e = Math.min(1, (at - t0) / 0.15) * Math.exp(-Math.max(0, at - t0 - dur * 0.6) * 3);
    for (let i = 0; i < 0.03 * SR; i++) { const t = i / SR; out(s0 + i, f(noise(), fq, 1.2).bp * Math.exp(-t * 180) * 0.5 * amp * e, p, 0.3); }
  }
});
// ka-ching
const kassa = sfx((t0, amp = 1) => {
  const s0 = S(t0), f = svf();
  for (let i = 0; i < 0.06 * SR; i++) { const t = i / SR; out(s0 + i, (f(noise(), 2500, 0.8).bp * Math.exp(-t * 90) + Math.sin(TAU * 120 * t) * Math.exp(-t * 50)) * 0.45 * amp, -0.2, 0.2); }
  const s1 = S(t0 + 0.09);
  for (let i = 0; i < 1.3 * SR; i++) {
    const t = i / SR;
    const v = Math.sin(TAU * 2637 * t) + 0.7 * Math.sin(TAU * 3951 * t) * Math.exp(-t * 2) + 0.4 * Math.sin(TAU * 5274 * t);
    out(s1 + i, v * Math.exp(-t * 3) * (1 + 0.3 * Math.sin(TAU * 18 * t)) * 0.11 * amp, 0.25, 0.4);
  }
});
// wah wah wah waaah
const trombone = sfx((t0, amp = 1) => {
  [[0, 58, 0.42], [B * 0.5, 57, 0.42], [B, 56, 0.42], [B * 1.5, 55, B * 1.4]].forEach(([o, m, d], k) => {
    const s0 = S(t0 + o), f = svf(); let ph = 0;
    for (let i = 0; i < (d + 0.05) * SR; i++) {
      const t = i / SR;
      const vib = k === 3 ? 1 + 0.025 * Math.sin(TAU * 5.5 * t) * P(t, 0.15, 0.4) : 1;
      ph += mtof(m) * vib / SR;
      const wah = k === 3 ? 500 + 900 * Math.sin(Math.PI * P(t, 0, 0.3)) * (0.6 + 0.4 * Math.sin(TAU * 5.5 * t)) : 400 + 1200 * Math.sin(Math.PI * P(t, 0, d));
      const env = Math.min(1, t / 0.03) * (t > d ? Math.exp(-(t - d) * 40) : 1);
      out(s0 + i, Math.tanh(f(2 * (ph % 1) - 1, wah, 0.6).lp * 1.5) * env * 0.36 * amp, -0.1, 0.3);
    }
  });
});
const sis = sfx((t0, amp = 1) => {
  const s0 = S(t0), f = svf();
  for (let i = 0; i < 0.9 * SR; i++) { const t = i / SR; const crackle = rnd() < 0.003 ? 3 : 1; out(s0 + i, f(noise(), 5000, 0.5).hp * crackle * Math.min(1, t / 0.05) * Math.exp(-t * 3) * 0.3 * amp, 0.2, 0.2); }
});
const plons = sfx((t0, amp = 1) => {
  const s0 = S(t0), f = svf();
  for (let i = 0; i < 0.8 * SR; i++) { const t = i / SR; out(s0 + i, f(noise(), 2400 * Math.exp(-t * 3) + 300, 0.6).lp * Math.exp(-t * 6) * 0.7 * amp, 0, 0.3); }
  for (let k = 0; k < 6; k++) plop(t0 + 0.08 + rnd() * 0.4, 0.4 * amp, 500 + rnd() * 400, 1400 + rnd() * 600, 0.04);
});
// tring tring
const bel = sfx((t0, amp = 1) => {
  [0, 0.19].forEach(o => {
    const s0 = S(t0 + o);
    for (let i = 0; i < 0.7 * SR; i++) {
      const t = i / SR;
      const v = Math.sin(TAU * 2350 * t) + 0.6 * Math.sin(TAU * 4900 * t) * Math.exp(-t * 3) + 0.4 * Math.sin(TAU * 7600 * t) * Math.exp(-t * 6);
      out(s0 + i, v * Math.exp(-t * 5) * (0.75 + 0.25 * Math.sin(TAU * 30 * t)) * 0.12 * amp, 0.3, 0.3);
    }
  });
});
// paper tearing: schrrr
const rip = sfx((t0, amp = 1, dur = 0.3) => {
  const s0 = S(t0), f = svf(); let a = 0;
  for (let i = 0; i < dur * SR; i++) {
    const t = i / SR;
    if (i % 160 === 0) a = 0.3 + rnd() * 0.7;
    out(s0 + i, f(noise(), 1800 + 3000 * t / dur, 0.7).bp * a * Math.min(1, t / 0.01) * (1 - t / dur) * 0.9 * amp, lerp(-0.4, 0.4, t / dur), 0.15);
  }
});
// a cartoon bonk: a wood block and a thud
const bonk = sfx((t0, amp = 1) => {
  const s0 = S(t0);
  for (let i = 0; i < 0.4 * SR; i++) {
    const t = i / SR;
    const v = (Math.sin(TAU * 720 * t) + 0.5 * Math.sin(TAU * 1460 * t)) * Math.exp(-t * 38) * 0.5 + Math.sin(TAU * (90 + 40 * Math.exp(-t * 20)) * t) * Math.exp(-t * 12) * 0.8;
    out(s0 + i, v * 0.5 * amp, 0, 0.2);
  }
});
const stap = sfx((t0, amp = 1, p = 0) => {
  const s0 = S(t0), f = svf();
  for (let i = 0; i < 0.12 * SR; i++) { const t = i / SR; out(s0 + i, (Math.sin(TAU * 75 * t) * Math.exp(-t * 28) + f(noise(), 500, 0.7).lp * Math.exp(-t * 60) * 0.5) * 0.45 * amp, p, 0.1); }
});
// a snore: hrrrr ... pshhh
const snurk = sfx((t0, amp = 1, dur = 1.4) => {
  const s0 = S(t0), f = svf(), g = svf();
  for (let i = 0; i < dur * SR; i++) {
    const t = i / SR, q = t / dur;
    const inh = q < 0.55 ? Math.sin(Math.PI * q / 0.55) : 0, exh = q >= 0.6 ? Math.sin(Math.PI * (q - 0.6) / 0.4) : 0;
    const rasp = (2 * ((t * 62) % 1) - 1) * (0.5 + 0.5 * Math.sin(TAU * 31 * t));
    out(s0 + i, (f(rasp + noise() * 0.3, 900, 0.8).lp * inh * 0.5 + g(noise(), 3000, 0.6).bp * exh * 0.25) * 0.5 * amp, -0.3, 0.2);
  }
});
const rondweg = sfx((t0, amp = 1) => { // a feedback squeal
  const s0 = S(t0); let ph = 0;
  for (let i = 0; i < 0.5 * SR; i++) { const t = i / SR; ph += (2650 + 500 * t / 0.5) * (1 + 0.01 * Math.sin(TAU * 7 * t)) / SR; out(s0 + i, Math.sin(TAU * ph) * Math.min(1, t / 0.08) * Math.exp(-Math.max(0, t - 0.35) * 30) * 0.12 * amp, 0, 0.3); }
});
const tvAan = sfx((t0, amp = 1) => {
  const s0 = S(t0), f = svf();
  for (let i = 0; i < 0.7 * SR; i++) {
    const t = i / SR;
    const v = f(noise(), 3000, 0.5).bp * Math.exp(-t * 7) * 0.6 + Math.sin(TAU * 7800 * t) * Math.exp(-t * 4) * 0.05 + Math.sin(TAU * (60 + 200 * Math.exp(-t * 15)) * t) * Math.exp(-t * 10) * 0.5;
    out(s0 + i, v * amp * 0.6, 0, 0.2);
  }
});
const tik = sfx((t0, amp = 1) => {
  const s0 = S(t0);
  for (let i = 0; i < 0.15 * SR; i++) { const t = i / SR; out(s0 + i, (Math.sin(TAU * 130 * t) * Math.exp(-t * 32) + (t < 0.003 ? noise() * 0.5 : 0)) * 0.7 * amp, 0.15, 0.35); }
});
const bloep = sfx((t0, amp = 1, up = false) => { // uh-oh
  [[0, up ? 66 : 69], [0.14, up ? 70 : 64]].forEach(([o, m]) => {
    const s0 = S(t0 + o), fr = mtof(m + 12);
    for (let i = 0; i < 0.14 * SR; i++) { const t = i / SR; out(s0 + i, ((t * fr) % 1 < 0.5 ? 1 : -1) * Math.exp(-t * 10) * 0.08 * amp, 0, 0.2); }
  });
});

// the sketches' own sounds
const zwiep = (t0, amp = 1) => whoosh(t0 - 0.1, 0.24, 900, 7500, 0.8 * amp, -0.5, 0.5);
const tok = sfx((t0, amp = 1) => {
  const s0 = S(t0), f = svf();
  for (let i = 0; i < 0.25 * SR; i++) {
    const t = i / SR;
    const v = Math.sin(TAU * 310 * t) * Math.exp(-t * 45) * 0.6 + Math.sin(TAU * (110 + 60 * Math.exp(-t * 30)) * t) * Math.exp(-t * 18) * 0.8 + f(noise(), 3000, 0.7).bp * Math.exp(-t * 200) * 0.6;
    out(s0 + i, v * 0.6 * amp, 0.2, 0.25);
  }
});
const veeg = sfx((t0, amp = 1) => {
  const s0 = S(t0), f = svf();
  for (let i = 0; i < 0.35 * SR; i++) { const t = i / SR; out(s0 + i, f(noise(), 2200 + 1500 * Math.sin(TAU * 6 * t), 1.2).bp * Math.sin(Math.PI * t / 0.35) * (0.6 + 0.4 * Math.sin(TAU * 13 * t)) * 0.5 * amp, lerp(-0.5, 0.5, t / 0.35), 0.15); }
});
const zoem = sfx((t0, amp = 1, dur = 0.55) => {
  const s0 = S(t0), f = svf(); let ph = 0;
  for (let i = 0; i < dur * SR; i++) { const t = i / SR; ph += (105 + 30 * t / dur) / SR; const v = (2 * (ph % 1) - 1) + 0.6 * (2 * ((ph * 1.5) % 1) - 1); out(s0 + i, f(v, 900, 1).bp * Math.sin(Math.PI * t / dur) * 0.3 * amp, 0, 0.1); }
});
const klak = sfx((t0, amp = 1, fr = 1800) => {
  const s0 = S(t0);
  for (let i = 0; i < 0.06 * SR; i++) { const t = i / SR; out(s0 + i, ((t < 0.003 ? noise() : 0) * 0.8 + Math.sin(TAU * fr * t) * Math.exp(-t * 90) * 0.5 + Math.sin(TAU * fr * 0.5 * t) * Math.exp(-t * 60) * 0.4) * 0.6 * amp, (rnd() - 0.5) * 0.6, 0.1); }
});
const galop = (t0, dur, amp = 1) => { for (let t = 0; t < dur; t += B / 2) { stap(t0 + t, 0.7 * amp, -0.3); stap(t0 + t + B / 8, 0.5 * amp, 0.3); stap(t0 + t + B / 4, 0.9 * amp, 0); } };
const vuur = sfx((t0, amp = 1, dur = 1.6) => {
  const s0 = S(t0), f = svf();
  for (let i = 0; i < dur * SR; i++) { const t = i / SR, c = rnd() < 0.002 ? 4 : 1; out(s0 + i, f(noise(), 700, 0.5).lp * c * Math.sin(Math.PI * t / dur) * 0.6 * amp, Math.sin(t * 3) * 0.5, 0.2); }
});
const glas = sfx((t0, amp = 1) => {
  const s0 = S(t0), f = svf();
  for (let i = 0; i < 0.05 * SR; i++) { const t = i / SR; out(s0 + i, f(noise(), 3500, 0.6).bp * Math.exp(-t * 60) * 0.9 * amp, 0, 0.3); }
  for (let k = 0; k < 40; k++) {
    const at = t0 + 0.02 + Math.pow(rnd(), 2) * 0.5, s1 = S(at), g = svf(), fr = 2500 + rnd() * 6000, p = rnd() * 1.6 - 0.8;
    for (let i = 0; i < 0.03 * SR; i++) { const t = i / SR; out(s1 + i, (g(noise(), fr, 3).bp + Math.sin(TAU * fr * t) * 0.3) * Math.exp(-t * 140) * 0.35 * amp, p, 0.3); }
  }
});
const pets = sfx((t0, amp = 1) => {
  const s0 = S(t0), f = svf();
  for (let i = 0; i < 0.12 * SR; i++) { const t = i / SR; out(s0 + i, (f(noise(), 1600, 0.8).bp * Math.exp(-t * 70) + Math.sin(TAU * 140 * t) * Math.exp(-t * 30) * 0.6) * 0.8 * amp, 0, 0.25); }
});
const teller = (t0, dur, amp = 1) => { let t = 0, d = 0.12; while (t < dur) { tick(t0 + t, 0.6 * amp, 2200 + 1400 * t / dur); t += d; d = Math.max(0.025, d * 0.9); } };
const zoemer = sfx((t0, amp = 1) => {
  const s0 = S(t0), f = svf();
  for (let i = 0; i < 0.6 * SR; i++) { const t = i / SR; const v = ((t * 148) % 1 < 0.5 ? 1 : -1) + ((t * 156) % 1 < 0.5 ? 1 : -1); out(s0 + i, f(v, 1400, 0.6).lp * Math.min(1, t / 0.01) * (t > 0.5 ? Math.exp(-(t - 0.5) * 60) : 1) * 0.2 * amp, 0, 0.15); }
});
const kraak = sfx((t0, amp = 1) => {
  const s0 = S(t0), f = svf(); let ph = 0;
  for (let i = 0; i < 0.5 * SR; i++) { const t = i / SR; ph += (220 + 160 * Math.sin(t * 9) + 40 * noise()) / SR; out(s0 + i, f((2 * (ph % 1) - 1), 1200, 3).bp * Math.sin(Math.PI * t / 0.5) * (0.5 + 0.5 * Math.abs(Math.sin(t * 70))) * 0.4 * amp, -0.2, 0.3); }
});
const bam = (t0, amp = 1) => { impact(t0, 0.9 * amp); bonk(t0, 0.8 * amp); pets(t0, 0.7 * amp); };
const blaas = sfx((t0, amp = 1) => {
  const s0 = S(t0), f = svf();
  for (let i = 0; i < 0.7 * SR; i++) { const t = i / SR; out(s0 + i, f(noise(), 1300, 0.6).lp * Math.sin(Math.PI * t / 0.7) * 0.8 * amp, lerp(0.5, -0.5, t / 0.7), 0.2); }
});
const vuurwerk = (t0, amp = 1) => { for (let k = 0; k < 4; k++) { const at = t0 + k * 0.17 + rnd() * 0.05; impact(at, 0.4 * amp); sis(at + 0.05, 0.6 * amp); } };
const plof = sfx((t0, amp = 1) => {
  const s0 = S(t0), f = svf();
  for (let i = 0; i < 0.25 * SR; i++) { const t = i / SR; out(s0 + i, (Math.sin(TAU * (90 + 80 * Math.exp(-t * 30)) * t) * Math.exp(-t * 16) + f(noise(), 600, 0.8).lp * Math.exp(-t * 25)) * 0.8 * amp, 0.1, 0.2); }
});
const flap = (t0, dur, amp = 1) => { for (let t = 0; t < dur; t += 0.022 + rnd() * 0.02) klak(t0 + t, 0.35 * amp, 2400 + rnd() * 1500); };
const flits = sfx((t0, amp = 1) => {
  [0, 0.05].forEach(o => { const s0 = S(t0 + o); for (let i = 0; i < 0.03 * SR; i++) { const t = i / SR; out(s0 + i, noise() * Math.exp(-t * 200) * 0.6 * amp, 0, 0.1); } });
  const s1 = S(t0 + 0.08); let ph = 0;
  for (let i = 0; i < 0.6 * SR; i++) { const t = i / SR; ph += (1800 + 5000 * t / 0.6) / SR; out(s1 + i, Math.sin(TAU * ph) * Math.sin(Math.PI * t / 0.6) * 0.04 * amp, 0, 0.2); }
});
const propeller = sfx((t0, dur, amp = 1) => {
  const s0 = S(t0), f = svf(); let ph = 0;
  for (let i = 0; i < dur * SR; i++) { const t = i / SR, q = t / dur; ph += 95 * lerp(1.08, 0.9, q) / SR; const v = (2 * (ph % 1) - 1) * (0.6 + 0.4 * Math.sin(TAU * 38 * t)); out(s0 + i, f(v, 1100, 0.8).lp * Math.sin(Math.PI * q) * 0.35 * amp, lerp(-0.8, 0.8, q), 0.15); }
});
// the dramatic chord: two short stabs, then the long one, a semitone down, trembling
const dun = sfx((t0, amp = 1, lang = false) => {
  const dur = lang ? 0.9 : 0.22, root = lang ? 45 : 46;
  [0, 3, 7, 12].forEach((iv, k) => {
    const s0 = S(t0), f = svf(), fr = mtof(root + iv); let ph = rnd();
    for (let i = 0; i < (dur + 0.1) * SR; i++) {
      const t = i / SR; ph += fr / SR;
      const env = Math.min(1, t / 0.006) * (t > dur ? Math.exp(-(t - dur) * 30) : 1) * (lang ? 1 - 0.35 * (0.5 + 0.5 * Math.sin(TAU * 7 * t)) * P(t, 0.15, 0.3) : 1);
      out(s0 + i, f(2 * (ph % 1) - 1, 500 + 2500 * Math.exp(-t * 6), 0.6).lp * env * 0.07 * amp, (k - 1.5) * 0.3, 0.3);
    }
  });
  impact(t0, 0.35 * amp);
});
// a clock in time-lapse: tick, tock, faster and faster
const tiktak = (t0, dur, amp = 1) => { let t = 0, d = 0.16, k = 0; while (t < dur) { tick(t0 + t, 0.55 * amp, k++ % 2 ? 1500 : 2100, k % 2 ? -0.3 : 0.3); t += d; d = Math.max(0.03, d * 0.88); } };
// a desk fan: a whirr that steps up at every click, the blades chopping the air
const ventilator = sfx((t0, stappen, t1, amp = 1) => {
  const s0 = S(t0), f = svf(); let ph = 0;
  for (let i = 0; i < (t1 - t0 + 0.15) * SR; i++) {
    const t = t0 + i / SR, lvl = stappen.filter(s => t >= s).length, toeren = [2.5, 7, 12, 22][lvl];
    ph += 3 * toeren / SR;
    const chop = 0.6 + 0.4 * Math.sin(TAU * ph), fc = 300 + lvl * 380;
    const env = Math.min(1, (t - t0) / 0.05) * (t > t1 ? Math.exp(-(t - t1) * 25) : 1);
    out(s0 + i, f(noise(), fc, 0.8).bp * chop * env * (0.25 + 0.12 * lvl) * amp, 0.4, 0.1);
  }
});

// the gag sounds by name, as reel-data.js uses them
const GELUID = {
  toeter: t => toeter(t), piep: t => piep(t), toet: t => toet(t), juichen: t => juichen(t), ping: t => ping(t),
  plop: t => plop(t, 1.2, 700, 140, 0.09), kwek: t => kwek(t), tuut: t => tuut(t), applaus: t => applaus(t, 1.5),
  'fluit-neer': t => fluit(t, 1700, 380, 0.42), 'fluit-op': t => fluit(t, 420, 1800, 0.38), kassa: t => kassa(t),
  trombone: t => trombone(t), sis: t => sis(t), boing: t => boing(t), plons: t => plons(t), bel: t => bel(t), airhorn: t => airhorn(t),
  zwiep: (t, a) => zwiep(t, a), tok: (t, a) => tok(t, a), veeg: (t, a) => veeg(t, a), zoem: (t, a) => zoem(t, a), klak: (t, a) => klak(t, a),
  galop: (t, a) => galop(t, 4 * B, a), vuur: (t, a) => vuur(t, a), glas: (t, a) => glas(t, a), pets: (t, a) => pets(t, a),
  teller: (t, a) => teller(t, 2.5 * B, a), zoemer: (t, a) => zoemer(t, a), kraak: (t, a) => kraak(t, a), bam: (t, a) => bam(t, a),
  blaas: (t, a) => blaas(t, a), vuurwerk: (t, a) => vuurwerk(t, a), plof: (t, a) => plof(t, a), flap: (t, a) => flap(t, 1.6 * B, a),
  flits: (t, a) => flits(t, a), stap: (t, a) => stap(t, a), rip: (t, a) => rip(t, a), snurk: (t, a) => snurk(t, a), juichen2: t => juichen(t),
  dun: (t, a) => dun(t, a), dunnn: (t, a) => dun(t, a, true), tiktak: (t, a) => tiktak(t, 3 * B, a), propeller: (t, a) => propeller(t, 1.5 * B, a),
};

// ================================================================ the score
// chords: bass note + pad voicing, in C major
const CH = {
  C: { b: 36, p: [60, 64, 67] }, G: { b: 43, p: [59, 62, 67] }, Am: { b: 45, p: [60, 64, 69] }, F: { b: 41, p: [60, 65, 69] },
  Dm: { b: 38, p: [62, 65, 69] }, E: { b: 40, p: [59, 64, 68] }, Em: { b: 40, p: [59, 64, 67] },
};
const PROG = ['C', 'G', 'Am', 'F'];
const tr = (c, k) => ({ b: c.b + k, p: c.p.map(m => m + k) });
// the hook: four bars over C G Am F, as [beat, note, length in beats]
const HOOK = [
  [[0, 67, 0.5], [0.5, 72, 0.5], [1, 76, 0.5], [1.5, 79, 0.5], [2, 76, 0.75], [3, 72, 0.75]],
  [[0, 74, 0.5], [0.5, 71, 0.5], [1, 74, 0.5], [1.5, 79, 1], [3, 76, 0.5], [3.5, 74, 0.5]],
  [[0, 72, 0.5], [0.5, 76, 0.5], [1, 81, 0.75], [2, 79, 0.5], [2.5, 76, 0.5], [3, 72, 0.75]],
  [[0, 69, 0.5], [0.5, 72, 0.5], [1, 77, 0.75], [2, 76, 0.5], [2.5, 74, 0.5], [3, 72, 0.5], [3.5, 71, 0.5]],
];
// one bar of groove. level 1: light, 2: the news bed, 3: everything
function grooveBar(t0, c, level, o = {}) {
  pad(t0, BAR - 0.05, c.p, level >= 3 ? 1 : 0.85, o.bright || 1);
  for (let b = 0; b < 4; b++) {
    const tb = t0 + b * B;
    if (level >= 2 || b % 2 === 0) kick(tb, level >= 3 ? 1 : 0.9);
    hat(tb + B / 2, true, level >= 2 ? 0.75 : 0.45);
    if (level >= 2 && b % 2 === 1) { clap(tb, level >= 3 ? 0.85 : 0.7); snare(tb, 0.35); }
    if (level >= 2) for (const s of [0.25, 0.75]) hat(tb + s * B, false, 0.45, -0.3);
    // the disco octave bass in eighths
    for (let s = 0; s < 2; s++) bass(tb + s * B / 2, B / 2 - 0.04, c.b + (s ? 12 : 0), s ? 0.65 : 0.9);
  }
  if (o.hook !== undefined) HOOK[o.hook % 4].forEach(([b, m, d]) => lead(t0 + b * B, d * B * 0.92, m + (o.lift || 0), o.hookAmp || 1));
  if (o.arp) {
    const seq = [c.p[0] + 12, c.p[1] + 12, c.p[2] + 12, c.p[1] + 24, c.p[2] + 12, c.p[0] + 24, c.p[1] + 12, c.p[2] + 24];
    for (let s = 0; s < 16; s++) pluck(t0 + s * B / 4, seq[s % 8], (s % 4 === 0 ? 1 : 0.7) * o.arp, s % 2 ? 0.5 : -0.5);
  }
  if (o.crash) crash(t0, 0.6);
}
function fill(t0, beats = 1, amp = 1) {
  const n = Math.round(beats * 4);
  for (let k = 0; k < n; k++) snare(t0 + k * B / 4, (0.4 + 0.6 * k / n) * amp, (k % 2 ? 0.3 : -0.3));
}

// the reel ticks of the countdown: the same curve as film/intro.js, stretched to one bar
const OB = 60 / 128, BOTS = 1.46;
let K = BAR / (4 * OB);
const outExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
const reelV = (i, t) => [2, 0, 2, 5][i] - (i + 1) * 10 * (1 - outExpo(P(t, 0.25, 0.95 + 0.14 * i)));

let maandNr = 0;
for (const sc of SEQ) {
  const t0 = sc.start, bars = sc.bars;
  BAR = sc.bar; B = sc.beat; K = BAR / (4 * OB);
  const at = k => t0 + k * BAR;
  switch (sc.kind) {
    case 'tv': {
      // the tube warms up, the anchor taps the microphone, feedback squeals
      tvAan(t0 + 0.04, 0.8);
      pad(t0 + 0.3, BAR - 0.3, [48, 55, 60], 0.5, 0.5);
      tik(t0 + B, 1); tik(t0 + B * 1.5, 1);
      plop(t0 + B * 2.1, 0.7, 600, 1200, 0.06);
      rondweg(t0 + B * 3.3, 0.9);
      riser(t0 + B * 2, t0 + BAR, 0.5);
      break;
    }
    case 'rol': {
      for (let i = 0; i < 4; i++) {
        let prev = Math.floor(reelV(i, 0.2) + 0.5), last = -1;
        for (let t = 0.2; t < 1.0; t += 0.0005) {
          const d = Math.floor(reelV(i, t) + 0.5);
          if (d !== prev && t - last > 0.012) { tick(t0 + t * K, 0.5, 2200 + i * 350, (i - 1.5) * 0.5); last = t; }
          prev = d;
        }
      }
      // stuck at 99%: uh-oh, then the hippo stomps in and bumps it
      bloep(t0 + 1.0 * K, 1);
      for (let k = 0; k < 4; k++) stap(t0 + (0.98 + k * 0.12) * K, 0.8 + k * 0.1, 0.5);
      bonk(t0 + BOTS * K, 1.3); tick(t0 + BOTS * K, 1.4, 1800);
      pad(t0, BAR, [57, 60, 64], 0.6, 0.5);
      riser(t0 + 0.3, t0 + BAR, 0.8);
      whoosh(t0 + 1.62 * K, BAR - 1.62 * K, 300, 6000, 0.9);
      break;
    }
    case 'knal': {
      // the drop: everyone jumps in
      impact(t0, 1.0); crash(t0, 1.0); airhorn(t0 + B * 0.5, 0.9); toeter(t0 + B * 2, 0.7);
      grooveBar(t0, CH.C, 3, { hook: 0 });
      stab(t0, [72, 76, 79], 1.0);
      whoosh(t0 + 3 * B, B, 200, 7000, 0.9, -0.3, 0.3);
      break;
    }
    case 'raster': {
      tick(t0, 1, 1200);
      grooveBar(t0, CH.G, 3, { hook: 1 });
      // the days pop up like popcorn
      for (let k = 0; k < 16; k++) plop(t0 + 0.04 + k * B * 0.16, 0.25, 500 + k * 60, 900 + k * 80, 0.04);
      plop(t0 + 0.95 * K, 0.8, 700, 1400, 0.06);
      whoosh(t0 + 3 * B - 0.1, 0.5, 400, 3000, 0.6);
      break;
    }
    case 'baan': {
      grooveBar(t0, CH.Am, 3, { hook: 2 });
      fluit(t0 + OB * K, 1900, 500, OB * 0.5 * K, 0.9); tick(t0 + OB * 1.5 * K, 1.2, 3000);
      riser(t0 + 2 * B, t0 + BAR, 0.7);
      break;
    }
    case 'getallen': {
      impact(t0, 0.7);
      grooveBar(t0, CH.F, 3, { hook: 3 });
      for (let b = 0; b < 3; b++) { stab(t0 + b * B, [72, 76, 79].map(m => m + [0, 2, 4][b]), 1.0); if (b) whoosh(t0 + b * B - 0.1, 0.25, 800, 6000, 0.6, b % 2 ? -0.8 : 0.8, b % 2 ? 0.8 : -0.8); }
      snurk(t0 + 3 * B + 0.05, 1.1, B * 1.2);
      break;
    }
    case 'opening': {
      // the BJ Journaal theme: a fanfare, the anchor's chime, the crew popping up
      impact(t0, 1.0); crash(t0, 0.8);
      grooveBar(at(0), CH.C, 3, { hook: 0, bright: 1.3 });
      grooveBar(at(1), CH.G, 3, { hook: 1, bright: 1.3 });
      [0, 0.5, 1.5, 2].forEach((b, i) => stab(t0 + b * B, [72, 76, 79, 84].map(m => m + (i === 3 ? 2 : 0)), 0.9));
      ping(t0 + B * 2.5, 1, 1568); ping(t0 + B * 3, 0.8, 2093);
      for (let i = 0; i < 5; i++) plop(at(1) + i * B * 0.5, 0.6, 500 + i * 120, 1300 + i * 150, 0.06);
      fill(t0 + sc.dur - B, 1, 1);
      crash(t0 + sc.dur - B, 0.5); toeter(t0 + sc.dur - B, 0.6);
      break;
    }
    case 'maand': {
      const lift = [0, 0, 0, 0, 2, 2, 2, 2, 4, 4, 4, 4][sc.m];
      const ST = REEL.STING * B;
      // the opening trick
      kick(t0, 1); stab(t0, CH.C.p.map(m => m + 12 + lift), 1.0);
      pad(t0, ST, tr(CH.C, lift).p, 1.0, 1.2); bass(t0, B * 0.9, 36 + lift, 1);
      fill(t0 + B, 1, 0.8);
      const naam = REEL.MAANDEN[sc.m];
      ({
        kalender: () => { rip(t0 + 0.04, 1); impact(t0, 0.55); crash(t0, 0.7); },
        neon: () => { zoem(t0, 0.8, ST); for (let k = 0; k < 6; k++) tick(t0 + k * 0.05 + rnd() * 0.04, 0.8, 4000); },
        stempel: () => { whoosh(t0, B * 0.35, 300, 2000, 0.6, 0, 0); impact(t0 + B * 0.35, 1.0); pets(t0 + B * 0.35, 1.2); },
        trein: () => { whoosh(t0, B * 0.8, 200, 3000, 1, 0.8, -0.2); fluit(t0 + B * 0.5, 2600, 2200, B * 0.35, 0.4); tuut(t0 + B * 1.1, 0.9); whoosh(t0 + B * 1.55, B * 0.45, 400, 4000, 0.8, -0.2, -0.9); },
        val: () => { for (let k = 0; k < naam.length; k++) bonk(t0 + (k * 0.18 + 0.45) * B, 0.5 + 0.5 * k / naam.length); bonk(t0 + ((naam.length - 1) * 0.18 + 0.47) * B, 1.2); },
        vliegtuig: () => propeller(t0, ST + B * 0.4, 1),
        opblaas: () => { for (let k = 0; k < naam.length; k++) fluit(t0 + k * 0.2 * B, 300, 900 + k * 60, 0.3 * B, 0.35); plop(t0 + ST - 0.1, 1, 900, 200, 0.07); },
        typ: () => { const per = B * 1.2 / naam.length; for (let k = 0; k < naam.length; k++) klak(t0 + k * per, 1, 1500); ping(t0 + B * 1.2, 1, 3136); },
      }[sc.sting] || (() => rip(t0 + 0.04, 1)))();
      let bar = 0;
      sc.slots.forEach((s, k) => {
        const i0 = t0 + s.start, it = s.it;
        const nb = s.beats / 4; // bars in this sketch (can be 1.5)
        // the transition into it
        if (s.overgang === 'zweep') whoosh(i0 - B * 0.22, B * 0.44, 600, 7500, 0.8, k % 2 ? 0.8 : -0.8, k % 2 ? -0.8 : 0.8);
        if (s.overgang === 'snede') kick(i0, 0.4, false);
        if (s.overgang === 'iris') { fluit(i0 - B * 0.45, 1500, 600, B * 0.4, 0.5); plop(i0, 0.9, 400, 90, 0.08); }
        if (s.overgang === 'wis') { for (let q = 0; q < 4; q++) stap(i0 - B * 0.35 + q * B * 0.18, 1.3, 0.8 - q * 0.5); whoosh(i0 - B * 0.3, B * 0.6, 300, 4000, 0.7, 0.8, -0.8); }
        // the music under it
        for (let q = 0; q < Math.ceil(nb); q++) {
          const tb = i0 + q * BAR, frac = Math.min(1, nb - q);
          const c = tr(CH[PROG[(bar + q) % 4]], lift);
          if (it.ernstig) { pad(tb, BAR * frac - 0.05, c.p, 0.9, 0.6); continue; }
          if (frac < 1) {
            pad(tb, BAR * frac - 0.05, c.p, 0.85);
            for (let b = 0; b < frac * 4; b++) { kick(tb + b * B, 0.9); hat(tb + b * B + B / 2, true, 0.7); for (let s2 = 0; s2 < 2; s2++) bass(tb + b * B + s2 * B / 2, B / 2 - 0.04, c.b + (s2 ? 12 : 0), s2 ? 0.65 : 0.9); if (b % 2) clap(tb + b * B, 0.7); }
            continue;
          }
          const big = s.beats >= 6;
          grooveBar(tb, c, big ? 3 : 2, { hook: big ? (bar + q) % 4 : undefined, lift, arp: big ? 0 : 0.55, hookAmp: 0.85 });
        }
        bar += Math.ceil(nb);
        if (it.ernstig || it.media) return;
        // the sketch's own sounds, at its own moments
        const sch = REEL.SCHETS[it.beeld];
        if (!sch) return;
        sch.klank.forEach(([wanneer, geluid, amp]) => {
          const tt = i0 + (typeof wanneer === 'number' ? wanneer : sch.m[wanneer]) * B;
          if (GELUID[geluid]) GELUID[geluid](tt, amp || 1);
        });
        if (it.beeld === 'boedapest') {
          // a clack for every falling letter, a bonk for the llama
          const n = it.kop.replace(/ /g, '').length;
          for (let q = 0; q <= n; q++) klak(i0 + (sch.m.val + q * sch.m.stap) * B + 0.1, 1.1, 1400 - q * 40);
          const tf = i0 + (sch.m.val + n * sch.m.stap) * B + 0.02;
          fluit(tf - 0.05, 1600, 400, 0.3, 0.6); bonk(tf + 0.3, 1.2); impact(tf + 0.3, 0.6);
        }
        if (it.beeld === 'zon') { const tn = i0 + sch.m.nacht * B; riser(i0 + 0.1, tn, 1.0); impact(tn, 1.0); crash(tn, 0.8); [76, 80, 83, 88].forEach((m, q) => glock(tn + q * 0.05, m + lift, 0.8, q % 2 ? 0.5 : -0.5)); }
        if (it.beeld === 'concert') for (let q = 0; q < 4; q++) glock(i0 + q * B, [72, 74, 76, 79][q] + lift, 0.8);
        if (it.beeld === 'zomer') ventilator(i0 + sch.m.k1 * B, [sch.m.k1, sch.m.k2, sch.m.k3].map(k => i0 + k * B), i0 + sch.m.los * B, 1);
        if (it.beeld === 'trekkers') for (let q = 0; q < s.beats; q++) stap(i0 + q * B, 0.4 + q / s.beats, 0);
        if (it.beeld === 'staking') { const n = 6; for (let q = 0; q < n; q++) flap(i0 + (sch.m.flap + q * 0.25) * B, 0.3, 0.8); }
      });
      break;
    }
    case 'vervolgd': {
      sc.maanden.forEach((m, i) => { rip(t0 + i * B + 0.02, 0.9); kick(t0 + i * B, 0.9); stab(t0 + i * B, [72, 76, 79].map(x => x + i * 2), 0.7); });
      const f0 = t0 + sc.maanden.length * B;
      // fast-forward: a warbling tape, then the goldfish forgets
      const s0 = Math.round(f0 * SR);
      BUS = 'sfx';
      { let ph = 0; const len = (t0 + sc.dur - f0) * SR; for (let i = 0; i < len; i++) { const t = i / SR; ph += (900 + 300 * Math.sin(TAU * 9 * t)) / SR; out(s0 + i, ((ph % 1) < 0.5 ? 1 : -1) * 0.025 * Math.min(1, t / 0.05) * Math.max(0, 1 - t / (len / SR)), 0, 0.1); } }
      BUS = 'mus';
      for (let b = 0; b < (sc.dur - (f0 - t0)) / B; b++) { kick(f0 + b * B, 0.7); hat(f0 + b * B + B / 2, true, 0.6); bass(f0 + b * B, B * 0.8, 41, 0.7); }
      pad(f0, t0 + sc.dur - f0, [57, 60, 65], 0.9);
      [0, 0.5, 1].forEach((b, i) => glock(f0 + B * 0.5 + b * B * 0.5, [72, 76, 79][i], 1));
      plop(f0 + B * 1.2, 0.6, 900, 1500, 0.05);
      bloep(f0 + B * 1.4, 1, true);
      break;
    }
    case 'memoriam': {
      // quiet: a music box over soft chords
      const ch = ['Am', 'F', 'C', 'G'];
      for (let k = 0; k < bars; k++) pad(at(k), BAR - 0.05, CH[ch[k % 4]].p, 0.9, 0.55);
      const mel = [76, 72, 69, 72, 77, 76, 72, 74, 76, 79, 76, 72, 71, 72];
      mel.forEach((m, i) => glock(t0 + B * 1.5 + i * B * 1.0, m, 0.7, i % 2 ? 0.3 : -0.3));
      break;
    }
    case 'dossier': {
      // a spy groove in A minor
      ping(t0, 0.6, 1760);
      for (let k = 0; k < bars; k++) {
        pad(at(k), BAR - 0.05, [57, 60, 64], 0.6, 0.6);
        for (let s = 0; s < 8; s++) hat(at(k) + s * B / 2, false, 0.7, s % 2 ? 0.4 : -0.4);
        [45, 48, 50, 51].forEach((m, b) => bass(at(k) + b * B, B * 0.8, m - 12, 0.9));
        for (let b = 0; b < 4; b++) { kick(at(k) + b * B, 0.6, false); if (b % 2) clap(at(k) + b * B, 0.5); }
      }
      for (let i = 0; i < 11; i++) tick(t0 + B * (0.5 + i * 0.25), 0.7, 1800 + i * 40);
      impact(t0 + 3.5 * B, 1.0); stab(t0 + 3.5 * B, [69, 72, 76], 1.0); bonk(t0 + 3.5 * B, 0.8);
      for (let i = 0; i < 4; i++) plop(t0 + B * (4.3 + i * 0.25), 0.4, 400 + i * 100, 900, 0.05);
      for (let i = 0; i < 4; i++) pluck(t0 + B * (5.5 + i * 0.25), [57, 60, 57, 64][i], 1.5, 0.5);
      fluit(t0 + 6.5 * B, 500, 1700, B * 0.4, 0.8);
      for (let q = 0; q < 8; q++) stap(t0 + 7 * B + q * B / 8, 0.6, 0.6);
      whoosh(t0 + 7 * B, B, 400, 5000, 0.8, -0.5, 0.9);
      break;
    }
    case 'finale': {
      // sparks gather, 2026 lands, the conga, the kick line, the countdown
      riser(t0 + 0.1, at(1), 1.0);
      pad(t0, BAR, tr(CH.G, 2).p, 1, 1.2); bass(t0, BAR - 0.05, 43 + 2, 0.6);
      for (let s = 0; s < 8; s++) glock(t0 + s * B / 2, [79, 83, 86, 91, 86, 83, 86, 91][s] + 2, 0.5, s % 2 ? 0.5 : -0.5);
      impact(at(1), 1.1); crash(at(1), 1.0); stab(at(1), [74, 78, 81, 86], 1.3);
      grooveBar(at(1), tr(CH.C, 2), 3, { hook: 0, lift: 2, bright: 1.4 });
      grooveBar(at(2), tr(CH.G, 2), 3, { hook: 1, lift: 2, bright: 1.4, crash: true });
      for (let b = 0; b < 4; b++) stab(at(2) + b * B, [74, 78, 81].map(m => m + (b % 2 ? 2 : 0)), 0.8);
      juichen(at(2), 0.9, BAR * 1.2);
      const cd = at(3);
      pad(cd, BAR, tr(CH.G, 2).p, 1, 1.4);
      for (let b = 0; b < 3; b++) { kick(cd + b * B, 1.1); tom(cd + b * B, [110, 147, 196][b], 1.2); stab(cd + b * B, [74, 78, 81].map(m => m + [0, 3, 5][b]), 1.0); boing(cd + b * B + 0.05, 0.4); }
      impact(cd + 3 * B, 1.3); crash(cd + 3 * B, 1.2); airhorn(cd + 3 * B, 1.0); toeter(cd + 3 * B + 0.1, 0.8);
      stab(cd + 3 * B, [74, 78, 81, 86], 1.4, 0.8); kick(cd + 3 * B, 1.2);
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
      buf[idx] = inp[i] + lp * 0.78;
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
const CL = [1557, 1617, 1491, 1422, 1277, 1356], CR = [1580, 1640, 1514, 1445, 1300, 1379];
const WL = reverb(RL, CL, [225, 556]), WR = reverb(RR, CR, [248, 579]);
const ZL = reverb(YL, CL, [225, 556]), ZR = reverb(YR, CR, [248, 579]);

// ---------------------------------------------------------------- the stems
// Fixed levels, no normalising: muziek.js balances them against the songs.
const mus = new Float32Array(N * 2), fx = new Float32Array(N * 2);
let dcL = 0, dcR = 0;
for (let i = 0; i < N; i++) {
  let l = ML[i] + PL[i] * duck[i] + WL[i] * 0.8;
  let r = MR[i] + PR[i] * duck[i] + WR[i] * 0.8;
  dcL += (l - dcL) * 0.0005; dcR += (r - dcR) * 0.0005;
  mus[2 * i] = Math.tanh((l - dcL) * 0.7); mus[2 * i + 1] = Math.tanh((r - dcR) * 0.7);
  fx[2 * i] = Math.tanh((XL[i] + ZL[i] * 0.7) * 0.8); fx[2 * i + 1] = Math.tanh((XR[i] + ZR[i] * 0.7) * 0.8);
}
function writeWav(file, data) {
  const n = data.length / 2, buf = Buffer.alloc(44 + n * 8);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 8, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(3, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 8, 28); buf.writeUInt16LE(8, 32); buf.writeUInt16LE(32, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 8, 40);
  for (let i = 0; i < n * 2; i++) buf.writeFloatLE(data[i], 44 + i * 4);
  fs.writeFileSync(path.join(__dirname, file), buf);
}
writeWav('score.wav', mus);
writeWav('sfx.wav', fx);
console.log(`score.wav and sfx.wav written (${DUR.toFixed(1)} s)`);
