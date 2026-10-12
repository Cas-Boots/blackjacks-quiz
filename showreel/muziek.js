// The songs under the film, and the final mix.
//   node muziek.js tempo     finds each song's tempo and its hook (the chorus), writes tempo.js
//   node muziek.js mix       mixes the songs (or the score), the effects and the master into soundtrack.wav
//   node muziek.js luister   puts every chapter change in a row in muziek/overgangen.wav, to check them
// Run `node audio.js` between tempo and mix, so the score and the effects follow the
// new tempos; `npm run audio` and `npm run render` do all of that in order.
//
// How a chapter with a song works:
//   - The film runs at the song's tempo, so cuts land on its beats.
//   - The song starts on its hook: the loudest stretch of the song that starts with a
//     jump in energy, nearly always the chorus, on a downbeat. No long intros.
//   - It can run in early (`voor` bars), muffled as if from the tv, and then drops.
//   - It leaves on a DJ trick on its last beat: an echo-out, a backspin, a tape stop or a
//     fade; the last song stops dead on START. Two songs never play over each other.
//   - Every song is levelled to the same loudness, statically (no pumping), the music
//     ducks a little under the effects, and the master is glued, limited and set to
//     -14 LUFS with peaks under -1 dB.
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const here = __dirname;
const FFMPEG = process.env.FFMPEG || (() => { try { const p = require('ffmpeg-static'); if (p && require('fs').existsSync(p)) return p; } catch { } return 'ffmpeg'; })();
const song = f => path.join(here, 'muziek', f);
const SR = 44100;
const DOEL = -14;          // LUFS: the loudness of the music and of the master
const PIEK = -1.6;         // dBTP: the limiter's ceiling, between samples too
const dB = x => Math.pow(10, x / 20);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// ================================================================ wav files
function readWav(file) {
  const b = fs.readFileSync(file);
  let o = 12, fmt = null, data = null;
  while (o + 8 <= b.length) {
    const id = b.toString('ascii', o, o + 4), len = b.readUInt32LE(o + 4);
    if (id === 'fmt ') fmt = { tag: b.readUInt16LE(o + 8), ch: b.readUInt16LE(o + 10), sr: b.readUInt32LE(o + 12), bits: b.readUInt16LE(o + 22) };
    if (id === 'data') { data = b.subarray(o + 8, o + 8 + len); break; }
    o += 8 + len + (len % 2);
  }
  const n = data.length / (fmt.bits / 8) / fmt.ch, L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) for (let c = 0; c < Math.min(2, fmt.ch); c++) {
    const at = (i * fmt.ch + c) * (fmt.bits / 8);
    const v = fmt.tag === 3 ? data.readFloatLE(at) : fmt.bits === 16 ? data.readInt16LE(at) / 32768 : data.readIntLE(at, 3) / 8388608;
    (c ? R : L)[i] = v;
  }
  if (fmt.ch === 1) R.set(L);
  return { L, R };
}
function writeWav16(file, L, R) {
  const n = L.length, buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  let s = 1;
  const dither = () => { s = (s * 1664525 + 1013904223) >>> 0; const a = s / 4294967296; s = (s * 1664525 + 1013904223) >>> 0; return (a + s / 4294967296 - 1) / 32768; };
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(clamp(L[i] + dither(), -1, 32767 / 32768) * 32768), 44 + i * 4);
    buf.writeInt16LE(Math.round(clamp(R[i] + dither(), -1, 32767 / 32768) * 32768), 46 + i * 4);
  }
  fs.writeFileSync(file, buf);
}
function decode(file, sr, ch) {
  const r = spawnSync(FFMPEG, ['-v', 'error', '-i', file, '-ac', String(ch), '-ar', String(sr), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  if (r.error || r.status) throw new Error(`ffmpeg kon ${file} niet lezen: ${r.error || r.stderr}`);
  const b = Buffer.from(r.stdout);
  const x = new Float32Array(b.buffer, b.byteOffset, b.length / 4);
  if (ch === 1) return x;
  const n = x.length / 2, L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { L[i] = x[2 * i]; R[i] = x[2 * i + 1]; }
  return { L, R };
}

// ================================================================ loudness (ITU-R BS.1770)
function biquad(b0, b1, b2, a1, a2) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return x => { const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
}
function kWeight(sr) {
  // the two K-weighting stages, designed for any sample rate
  const shelf = (() => { const f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196; const K = Math.tan(Math.PI * f0 / sr), Vh = Math.pow(10, G / 20), Vb = Math.pow(Vh, 0.4996667741545416), a0 = 1 + K / Q + K * K; return biquad((Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0); });
  const hp = (() => { const f0 = 38.13547087602444, Q = 0.5003270373238773; const K = Math.tan(Math.PI * f0 / sr), a0 = 1 + K / Q + K * K; return biquad(1 / a0, -2 / a0, 1 / a0, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0); });
  return () => { const s = shelf(), h = hp(); return x => h(s(x)); };
}
const KW = kWeight(SR);
// integrated loudness of [a, b) in samples
function lufs(L, R, a = 0, b = L.length) {
  a = Math.max(0, Math.floor(a)); b = Math.min(L.length, Math.floor(b));
  const kl = KW(), kr = KW(), blk = Math.round(0.4 * SR), hop = Math.round(0.1 * SR);
  // running sum of the K-weighted power, for 400 ms blocks with 75% overlap
  const cs = new Float64Array(b - a + 1);
  for (let i = a; i < b; i++) { const l = kl(L[i]), r = kr(R[i]); cs[i - a + 1] = cs[i - a] + l * l + r * r; }
  const blocks = [];
  for (let s = 0; s + blk <= b - a; s += hop) blocks.push((cs[s + blk] - cs[s]) / blk);
  const L0 = z => -0.691 + 10 * Math.log10(z + 1e-12);
  const abs = blocks.filter(z => L0(z) > -70);
  if (!abs.length) return -70;
  const rel = L0(abs.reduce((s, z) => s + z, 0) / abs.length) - 10;
  const g = abs.filter(z => L0(z) > rel);
  return L0(g.reduce((s, z) => s + z, 0) / g.length);
}

// ================================================================ tempo and hook
const ASR = 22050, HOP = 512, FPS = ASR / HOP;
// onset strength (rises in loudness, extra weight on the kick) and loudness per frame
function analyse(x) {
  const n = Math.floor(x.length / HOP) - 1;
  const full = new Float32Array(n), low = new Float32Array(n), db = new Float32Array(n);
  let lp = 0, prevF = 0, prevL = 0;
  const a = 1 - Math.exp(-2 * Math.PI * 150 / ASR);
  for (let f = 0; f < n; f++) {
    let ef = 0, el = 0;
    for (let i = f * HOP; i < f * HOP + HOP * 2 && i < x.length; i++) { lp += a * (x[i] - lp); ef += x[i] * x[i]; el += lp * lp; }
    const lf = Math.log(1e-6 + ef), ll = Math.log(1e-6 + el);
    full[f] = Math.max(0, lf - prevF); low[f] = Math.max(0, ll - prevL);
    db[f] = 10 * Math.log10(1e-10 + ef / (HOP * 2));
    prevF = lf; prevL = ll;
  }
  const o = new Float32Array(n);
  for (let f = 0; f < n; f++) o[f] = full[f] + 1.5 * low[f];
  // take away the local average so steady parts count for nothing
  const w = 16, on = new Float32Array(n);
  for (let f = 0; f < n; f++) { let s = 0, c = 0; for (let k = Math.max(0, f - w); k < Math.min(n, f + w); k++) { s += o[k]; c++; } on[f] = Math.max(0, o[f] - s / c); }
  return { o: on, low, db };
}
const at = (o, p) => { const i = Math.floor(p), f = p - i; return i >= 0 && i + 1 < o.length ? o[i] * (1 - f) + o[i + 1] * f : 0; };
function comb(o, P, a = 0, b = o.length) {
  let best = -1, phase = 0;
  for (let ph = 0; ph < P; ph += 0.25) {
    let s = 0, c = 0;
    for (let p = a + ph; p < b; p += P) { s += at(o, p); c++; }
    if (c && s / c > best) { best = s / c; phase = a + ph; }
  }
  return { score: best, phase };
}
function tempoVan(o, a, b) {
  let bestBpm = 100, bestS = -1;
  for (let bpm = 70; bpm <= 180; bpm += 0.5) {
    const lag = 60 * FPS / bpm;
    let s = 0;
    for (let f = a; f + 2 * lag < b; f++) s += o[f] * (at(o, f + lag) + 0.5 * at(o, f + 2 * lag));
    s *= Math.exp(-0.5 * Math.pow(Math.log2(bpm / 115) / 0.6, 2));
    if (s > bestS) { bestS = s; bestBpm = bpm; }
  }
  let bpm = bestBpm, fit = comb(o, 60 * FPS / bpm, a, b);
  for (let x = bestBpm - 1.5; x <= bestBpm + 1.5; x += 0.02) { const c = comb(o, 60 * FPS / x, a, b); if (c.score > fit.score) { fit = c; bpm = x; } }
  // guard against the classic mistakes: half, double, or a triplet feel (2/3, 3/2)
  const fitAt = t => { let best = { score: -1 }; for (let d = -0.6; d <= 0.6; d += 0.02) { const c = comb(o, 60 * FPS / (t + d), a, b); if (c.score > best.score) best = { score: c.score, bpm: t + d }; } return best; };
  // (each candidate gets the same fine search, the measured one included)
  let pick = fitAt(bpm);
  if (pick.score < fit.score) pick = { score: fit.score, bpm };
  for (const k of [1.5, 2 / 3, 2, 0.5]) {
    const t = bpm * k;
    if (t < 80 || t > 160) continue;
    const c = fitAt(t);
    if (c.score > pick.score) pick = c;
  }
  return pick.bpm;
}
// a song's tempo, measured in the middle of the song where it is steadiest
function luisterNaar(file, mz) {
  const x = decode(file, ASR, 1);
  const duur = x.length / ASR;
  if (duur < 20) throw new Error(`${file} is te kort`);
  const { o, low, db } = analyse(x);
  const a0 = Math.floor(o.length * 0.15), b0 = Math.floor(o.length * 0.85);
  let bpm = mz.bpm || tempoVan(o, a0, b0);
  if (Math.abs(bpm - Math.round(bpm)) < 0.15) bpm = Math.round(bpm);
  return { x, duur, o, low, db, bpm };
}
/*
 * Finds where a song should start: its hook. `nodig` is how many bars the chapter
 * lasts, `voor` how many bars play before it. Returns the tempo and the time of the
 * downbeat that lands on the chapter's first beat.
 */
function meet(an, mz, nodig, voor) {
  const { x, duur, o, low, db, bpm } = an;
  let lbBase = bpm;
  const Pf = 60 * FPS / bpm;
  const ph = comb(o, Pf, 0, o.length).phase % Pf;
  const nBeats = Math.floor((o.length - ph) / Pf);
  const beatT = k => (ph + k * Pf) / FPS;
  // loudness per beat, and which beat of four carries the kick (the downbeat)
  const E = new Float32Array(nBeats);
  for (let k = 0; k < nBeats; k++) { let s = 0, c = 0; for (let f = Math.floor(ph + k * Pf); f < ph + (k + 1) * Pf && f < db.length; f++) { s += Math.pow(10, db[f] / 10); c++; } E[k] = 10 * Math.log10(1e-10 + s / Math.max(1, c)); }
  let down = 0, dBest = -1;
  for (let j = 0; j < 4; j++) { let s = 0; for (let k = j; k < nBeats; k += 4) s += at(low, ph + k * Pf); if (s > dBest) { dBest = s; down = j; } }
  const nb = nodig * 4, vb = voor * 4;
  let start;
  if (mz.vanaf !== undefined && mz.vanaf !== 'auto') {
    // from a given time: the first downbeat after it
    start = down; while (start < nBeats && beatT(start) < mz.vanaf - 0.02) start += 4;
  } else {
    // the hook: loud for the whole chapter, and starting with a jump
    const mean = (a, b) => { a = Math.max(0, a); b = Math.min(nBeats, b); let s = 0; for (let k = a; k < b; k++) s += E[k]; return b > a ? s / (b - a) : -99; };
    let best = -1e9; start = down;
    for (let s = down; s < nBeats; s += 4) {
      if (s < vb + 8) continue;
      const fits = s + nb <= nBeats;
      const jump = Math.min(6, Math.max(0, mean(s, s + 8) - mean(s - 8, s)));
      const score = mean(s, s + nb) + 0.5 * jump - 4 * (s / nBeats) - (fits ? 0 : 6 + (s + nb - nBeats) * 0.3);
      if (score > best) { best = score; start = s; }
    }
  }
  // fine-tune the tempo around the chosen stretch
  const fa = Math.max(0, Math.floor(ph + (start - vb - 4) * Pf)), fb = Math.min(o.length, Math.floor(ph + (start + nb + 4) * Pf));
  let lb = lbBase, lfit = comb(o, Pf, fa, fb);
  if (!mz.bpm) for (let x2 = bpm * 0.995; x2 <= bpm * 1.005; x2 += bpm * 0.0005) { const c = comb(o, 60 * FPS / x2, fa, fb); if (c.score > lfit.score) { lfit = c; lb = x2; } }
  const lP = 60 * FPS / lb;
  // a frame stands for the middle of its window
  const f0 = lfit.phase + Math.round((ph + start * Pf - lfit.phase) / lP) * lP + 1.5;
  // the downbeat to the millisecond, and the tempo from the downbeat at the other end
  const tel = precies(x, f0 / FPS, 0.05);
  if (!mz.bpm && tel + nb * 60 / lb < duur - 0.5) {
    const eind = precies(x, tel + nb * 60 / lb, 0.03), b2 = nb * 60 / (eind - tel);
    if (Math.abs(b2 / lb - 1) < 0.003) lb = b2;
  }
  return { bpm: +lb.toFixed(4), tel: +tel.toFixed(4), duur: +duur.toFixed(2) };
}

// the exact start of the strongest attack within `win` seconds of t (to about a millisecond)
function precies(x, t, win) {
  const r = Math.round(0.001 * ASR), a = Math.max(0, Math.round((t - win - 0.03) * ASR)), b = Math.min(x.length, Math.round((t + win + 0.01) * ASR));
  let l1 = 0, l2 = 0, envL = 0, envF = 0;
  const k1 = 1 - Math.exp(-2 * Math.PI * 180 / ASR), ke = 1 - Math.exp(-1 / (0.002 * ASR));
  const eL = [], eF = [];
  for (let i = a; i < b; i++) {
    l1 += k1 * (x[i] - l1); l2 += k1 * (l1 - l2);
    envL += ke * (Math.abs(l2) - envL); envF += ke * (Math.abs(x[i]) - envF);
    if ((i - a) % r === 0) { eL.push(envL); eF.push(envF); }
  }
  let best = t, bv = -1;
  for (let k = 3; k < eL.length; k++) {
    const tk = (a + k * r) / ASR;
    if (Math.abs(tk - t) > win) continue;
    const rise = Math.max(0, eL[k] - eL[k - 3]) * 2 + Math.max(0, eF[k] - eF[k - 3]);
    const v = rise * Math.exp(-0.5 * Math.pow((tk - t) / win, 2));
    if (v > bv) { bv = v; best = (a + (k - 3) * r) / ASR; }
  }
  return best;
}

function tempo() {
  const REEL = require('./reel-data.js');
  // first every song's tempo, because a chapter's length in bars depends on it
  const an = {}, bpm = {};
  for (const mz of REEL.MUZIEK) {
    const f = song(mz.bestand);
    if (!fs.existsSync(f) || (mz.bpm && mz.tel !== undefined) || an[mz.bestand]) continue;
    an[mz.bestand] = luisterNaar(f, mz);
    bpm[mz.bestand] = an[mz.bestand].bpm;
  }
  const plan = REEL.sequence({ alle: true, bpm }).liedjes;
  const T = {};
  for (const mz of REEL.MUZIEK) {
    const f = song(mz.bestand);
    if (!fs.existsSync(f)) { console.log(`  –  ${mz.van}: muziek/${mz.bestand} ontbreekt, de score speelt`); continue; }
    if (mz.bpm && mz.tel !== undefined) { console.log(`  ✓  ${mz.bestand}: ${mz.bpm} BPM, vanaf ${mz.tel} s (zelf opgegeven)`); continue; }
    const pl = plan.find(l => l.bestand === mz.bestand && l.van === mz.van) || { bars: 16, voor: 0 };
    const m = meet(an[mz.bestand], mz, pl.bars, pl.voor);
    T[REEL.tempoSleutel(mz)] = m;
    const mmss = s => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
    console.log(`  ✓  ${mz.bestand}: ${m.bpm} BPM, start op ${mmss(m.tel)} (${pl.bars} maten${pl.voor ? `, ${pl.voor} ervoor` : ''})`);
  }
  fs.writeFileSync(path.join(here, 'tempo.js'),
    `// Tempo and starting downbeat per song, measured by \`node muziek.js tempo\`. Leave empty to use the score.\n(function (root) {\n  const TEMPO = ${JSON.stringify(T, null, 2).replace(/\n/g, '\n  ')};\n  if (typeof module !== 'undefined' && module.exports) module.exports = TEMPO; else root.TEMPO = TEMPO;\n})(this);\n`);
}

// ================================================================ the mix
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
// read a song at a fractional position, in samples
const lees = (x, p) => { const i = Math.floor(p), f = p - i; return i >= 0 && i + 1 < x.length ? x[i] * (1 - f) + x[i + 1] * f : 0; };

/*
 * Lays one song into the music bus: its run-up (muffled), its chapter, and the trick
 * it leaves on. Returns the echo tail that rings into the next chapter.
 */
function legIn(bus, l, src, gain, beat, uit) {
  const S = t => Math.round(t * SR);
  const off = l.tel * SR - l.start * SR; // song sample = film sample + off
  const a = S(l.preStart), s0 = S(l.start), e = S(l.end);
  const fl = svf(), fr = svf(), hl = svf(), hr = svf();
  // the run-up: from far away (a tv, a radio), getting closer, then the drop
  for (let i = Math.max(0, a); i < s0 && i < bus.L.length; i++) {
    const q = (i - a) / Math.max(1, s0 - a);
    const l0 = lees(src.L, i + off), r0 = lees(src.R, i + off);
    const m = (l0 + r0) / 2;
    const lpL = fl(hl(lerp(m, l0, q), 280, 0.7).hp, 2600 + 3000 * q * q, 0.8).lp, lpR = fr(hr(lerp(m, r0, q), 280, 0.7).hp, 2600 + 3000 * q * q, 0.8).lp;
    const g = gain * dB(-9 + 5 * q) * Math.min(1, (i - a) / (0.3 * SR));
    bus.L[i] = lpL * g; bus.R[i] = lpR * g;
  }
  // the chapter itself, until the trick on its last beat(s)
  const d = uit === 'stop' || uit === 'fade' ? 2 * beat : beat;
  const t0 = S(l.end - d);
  for (let i = s0; i < t0 && i < bus.L.length; i++) {
    const fin = Math.min(1, (i - s0) / (0.003 * SR));
    bus.L[i] = lees(src.L, i + off) * gain * fin; bus.R[i] = lees(src.R, i + off) * gain * fin;
  }
  const tail = { start: e, L: new Float32Array(S(3 * beat)), R: new Float32Array(S(3 * beat)) };
  const len = e - t0;
  if (uit === 'spin') {
    // a backspin: the record is pulled back, faster and faster
    let p = t0 + off, v = 1;
    for (let i = t0; i < e; i++) {
      const q = (i - t0) / len;
      v = 1 - 4.5 * Math.pow(q, 0.7);
      p += v;
      const g = gain * (q < 0.75 ? 1 : 1 - (q - 0.75) / 0.25);
      bus.L[i] = lees(src.L, p) * g; bus.R[i] = lees(src.R, p) * g;
    }
  } else if (uit === 'stop') {
    // a tape stop: the song slows down to nothing
    let p = t0 + off; const lpL = svf(), lpR = svf();
    for (let i = t0; i < e; i++) {
      const q = (i - t0) / len, v = Math.pow(1 - q, 1.6);
      p += v;
      const g = gain * (q < 0.85 ? 1 : 1 - (q - 0.85) / 0.15);
      bus.L[i] = lpL(lees(src.L, p), 300 + 9000 * v, 0.7).lp * g; bus.R[i] = lpR(lees(src.R, p), 300 + 9000 * v, 0.7).lp * g;
    }
  } else if (uit === 'echo') {
    // an echo-out: the last beat goes into a delay that keeps ringing over the cut
    const dl = Math.round(0.75 * beat * SR), bufL = new Float32Array(dl), bufR = new Float32Array(dl);
    let k = 0; const hpL = svf(), hpR = svf();
    const total = len + tail.L.length;
    for (let j = 0; j < total; j++) {
      const i = t0 + j, inp = j < len;
      const xL = inp ? lees(src.L, i + off) * gain : 0, xR = inp ? lees(src.R, i + off) * gain : 0;
      const q = j / total;
      const eL = bufL[k], eR = bufR[k];
      bufL[k] = hpL(xL * (j / len) + eR * 0.62, 150 + 1800 * q, 0.7).hp; bufR[k] = hpR(xR * (j / len) + eL * 0.62, 150 + 1800 * q, 0.7).hp;
      k = (k + 1) % dl;
      const wet = (eL + eR) * 0.5;
      if (inp) { bus.L[i] = xL * (1 - 0.6 * j / len) + eL * 0.7; bus.R[i] = xR * (1 - 0.6 * j / len) + eR * 0.7; }
      else { const tj = j - len, fade = 1 - tj / tail.L.length; tail.L[tj] = (eL * 0.8 + wet * 0.2) * fade * 0.8; tail.R[tj] = (eR * 0.8 + wet * 0.2) * fade * 0.8; }
    }
  } else if (uit === 'fade') {
    // a fade over the last two beats
    for (let i = t0; i < e && i < bus.L.length; i++) {
      const g = gain * Math.pow(1 - (i - t0) / len, 1.5);
      bus.L[i] = lees(src.L, i + off) * g; bus.R[i] = lees(src.R, i + off) * g;
    }
  } else {
    // stil: dead quiet on the last beat, so only the final hit rings
    const f = Math.round(0.01 * SR);
    for (let i = t0; i < t0 + f && i < bus.L.length; i++) { const g = gain * (1 - (i - t0) / f); bus.L[i] = lees(src.L, i + off) * g; bus.R[i] = lees(src.R, i + off) * g; }
  }
  return tail;
}
const lerp = (a, b, t) => a + (b - a) * t;

// the master: a gentle glue compressor, then a look-ahead limiter
function glue(L, R) {
  const att = Math.exp(-1 / (0.012 * SR)), rel = Math.exp(-1 / (0.16 * SR)), det = Math.exp(-1 / (0.01 * SR));
  let ms = 0, gr = 0;
  const thr = -11, ratio = 2, knee = 6;
  for (let i = 0; i < L.length; i++) {
    const x = Math.max(L[i] * L[i], R[i] * R[i]);
    ms = det * ms + (1 - det) * x;
    const lvl = 10 * Math.log10(ms + 1e-12);
    const over = lvl - thr;
    const want = over < -knee / 2 ? 0 : over > knee / 2 ? over * (1 - 1 / ratio) : (1 - 1 / ratio) * Math.pow(over + knee / 2, 2) / (2 * knee);
    gr = want > gr ? att * gr + (1 - att) * want : rel * gr + (1 - rel) * want;
    const g = dB(-gr); L[i] *= g; R[i] *= g;
  }
}
// the highest point of the signal around each sample, including between samples (4x
// oversampled with a windowed sinc), so the true peak stays under the ceiling too
const TAPS = 8, FASES = [0.25, 0.5, 0.75].map(f => {
  const h = [];
  for (let k = -TAPS + 1; k <= TAPS; k++) { const x = k - f, w = 0.5 + 0.5 * Math.cos(Math.PI * x / TAPS); h.push(x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x) * w); }
  return h;
});
function piek(X, i) {
  let p = Math.abs(X[i]);
  for (const h of FASES) { let v = 0; for (let k = 0; k < h.length; k++) { const j = i + k - TAPS + 1; if (j >= 0 && j < X.length) v += X[j] * h[k]; } p = Math.max(p, Math.abs(v)); }
  return p;
}
function limit(L, R, ceilingDb) {
  const c = dB(ceilingDb), la = Math.round(0.004 * SR), n = L.length;
  const req = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let p = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    if (p > c * 0.7) p = Math.max(piek(L, i), piek(R, i));
    req[i] = p > c ? c / p : 1;
  }
  // the lowest gain needed in the next few milliseconds, smoothed so it never clicks
  const h = new Float32Array(n), dq = [];
  for (let i = n - 1; i >= 0; i--) {
    while (dq.length && req[dq[dq.length - 1]] >= req[i]) dq.pop();
    dq.push(i);
    while (dq[0] > i + la - 1) dq.shift();
    h[i] = req[dq[0]];
  }
  const rel = 1 - Math.exp(-1 / (0.08 * SR));
  let sum = 0, g = 1;
  for (let i = 0; i < n; i++) {
    sum += h[i]; if (i >= la) sum -= h[i - la];
    const avg = sum / Math.min(i + 1, la);
    g = Math.min(avg, g + (1 - g) * rel);
    L[i] *= g; R[i] *= g;
  }
}

function mix() {
  const REEL = require('./reel-data.js');
  const { seq, total, liedjes } = REEL.sequence();
  const n = Math.ceil(total * SR);
  const score = readWav(path.join(here, 'score.wav')), fx = readWav(path.join(here, 'sfx.wav'));
  // the score and the effects keep the balance audio.js gave them; one gain for both
  const sg = dB(DOEL - lufs(score.L, score.R));
  const bus = { L: new Float32Array(n), R: new Float32Array(n) };
  for (let i = 0; i < n; i++) { bus.L[i] = (score.L[i] || 0) * sg; bus.R[i] = (score.R[i] || 0) * sg; }
  const aanwezig = liedjes.filter(l => fs.existsSync(song(l.bestand)));
  const staarten = [];
  aanwezig.forEach((l, k) => {
    const src = decode(song(l.bestand), SR, 2);
    const beat = seq[l.a].beat;
    // how it leaves: as set, or a tape stop before the quiet part, or nothing at the very end
    const next = seq[l.b + 1];
    const uit = l.uit || (!next ? 'stil' : next.kind === 'memoriam' ? 'stop' : k % 2 ? 'spin' : 'echo');
    // level it on the stretch that plays
    const off = l.tel - l.start;
    const gain = dB(DOEL + (l.db || 0) - lufs(src.L, src.R, (l.preStart + off) * SR, (l.end + off) * SR));
    // the score makes room: a short fade at both ends
    const a = Math.round(l.preStart * SR), e = Math.round(l.end * SR), f = Math.round(0.005 * SR);
    for (let i = Math.max(0, a - f); i < Math.min(n, e + f); i++) { const g = i < a ? (a - i) / f : i >= e ? (i - e) / f : 0; bus.L[i] *= g; bus.R[i] *= g; }
    staarten.push(legIn(bus, l, src, gain, beat, uit));
    // muffled, if the chapter asks for it
    if (l.lowpass) { const fL = svf(), fR = svf(); for (let i = Math.max(0, a); i < Math.min(n, e); i++) { bus.L[i] = fL(bus.L[i], l.lowpass, 1.4).lp; bus.R[i] = fR(bus.R[i], l.lowpass, 1.4).lp; } }
    console.log(`  ♪  ${l.van} – ${l.tot}: ${l.bestand} (${l.bpm} BPM, vanaf ${l.tel.toFixed(2)} s, eruit met ${uit})`);
  });
  if (!aanwezig.length) console.log('geen liedjes in muziek/: de gesynthetiseerde score speelt');
  for (const t of staarten) for (let j = 0; j < t.L.length && t.start + j < n; j++) { bus.L[t.start + j] += t.L[j]; bus.R[t.start + j] += t.R[j]; }

  // the music ducks a little under the effects
  const ex = { L: new Float32Array(n), R: new Float32Array(n) };
  for (let i = 0; i < n; i++) { ex.L[i] = (fx.L[i] || 0) * sg; ex.R[i] = (fx.R[i] || 0) * sg; }
  const att = Math.exp(-1 / (0.002 * SR)), rel = Math.exp(-1 / (0.15 * SR));
  let env = 0, gr = 0;
  const L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = Math.max(Math.abs(ex.L[i]), Math.abs(ex.R[i]));
    env = x > env ? att * env + (1 - att) * x : rel * env + (1 - rel) * x;
    const want = Math.min(6, Math.max(0, (20 * Math.log10(env + 1e-9) + 26) * 0.6));
    gr = want > gr ? 0.9 * gr + 0.1 * want : 0.9995 * gr + 0.0005 * want;
    const g = dB(-gr);
    L[i] = bus.L[i] * g + ex.L[i]; R[i] = bus.R[i] * g + ex.R[i];
  }
  // the master
  glue(L, R);
  for (let pass = 0; pass < 3; pass++) {
    const now = lufs(L, R);
    const g = dB(DOEL - now);
    for (let i = 0; i < n; i++) { L[i] *= g; R[i] *= g; }
    limit(L, R, PIEK);
    if (Math.abs(lufs(L, R) - DOEL) < 0.2) break;
  }
  // a breath at the start and the end
  const fe = Math.round(0.35 * SR);
  for (let i = 0; i < fe; i++) { const g = i / fe; L[n - 1 - i] *= g; R[n - 1 - i] *= g; }
  writeWav16(path.join(here, 'soundtrack.wav'), L, R);
  console.log(`soundtrack.wav: ${lufs(L, R).toFixed(1)} LUFS, ${aanwezig.length ? `${aanwezig.length} liedjes` : 'de score'}`);
}

// ================================================================ listening to the changes
function luister() {
  const REEL = require('./reel-data.js');
  const { seq } = REEL.sequence();
  const st = readWav(path.join(here, 'soundtrack.wav'));
  const parts = [];
  const gap = new Float32Array(Math.round(0.6 * SR));
  let prev = null;
  seq.forEach(sc => {
    if (prev && (sc.kind !== prev.kind || sc.kind === 'maand')) {
      const a = Math.max(0, Math.round((sc.start - 4) * SR)), b = Math.min(st.L.length, Math.round((sc.start + 3) * SR));
      parts.push([st.L.subarray(a, b), st.R.subarray(a, b)], [gap, gap]);
      console.log(`  ${String(parts.length / 2).padStart(2)}  ${prev.naam} → ${sc.naam} (op ${sc.start.toFixed(1)} s in de film)`);
    }
    prev = sc;
  });
  const n = parts.reduce((s, [l]) => s + l.length, 0), L = new Float32Array(n), R = new Float32Array(n);
  let o = 0; for (const [l, r] of parts) { L.set(l, o); R.set(r, o); o += l.length; }
  fs.mkdirSync(path.join(here, 'muziek'), { recursive: true });
  writeWav16(path.join(here, 'muziek', 'overgangen.wav'), L, R);
  console.log('muziek/overgangen.wav: elke overgang, van 4 s ervoor tot 3 s erna');
}

const cmd = process.argv[2];
if (cmd === 'tempo') tempo();
else if (cmd === 'mix') mix();
else if (cmd === 'luister') luister();
else { console.log('gebruik: node muziek.js tempo | mix | luister'); process.exit(1); }
