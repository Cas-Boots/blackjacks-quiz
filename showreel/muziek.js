// The songs under the film.
//   node muziek.js tempo   measures tempo and a downbeat of each song in muziek/ (writes tempo.js)
//   node muziek.js mix     builds soundtrack.wav: your songs per chapter, the effects on top,
//                          and the synthesized score wherever a chapter has no song
// Run `node audio.js` between the two, so the score and the effects follow the new tempos;
// `npm run audio` and `npm run render` do all of that in order.
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const here = __dirname;
const FFMPEG = process.env.FFMPEG || (() => { try { return require('ffmpeg-static'); } catch { return 'ffmpeg'; } })();
const song = f => path.join(here, 'muziek', f);

// ---------------------------------------------------------------- tempo
const SR = 22050, HOP = 512, FPS = SR / HOP;
function decode(file, from, dur) {
  const r = spawnSync(FFMPEG, ['-v', 'error', '-ss', String(from), '-t', String(dur), '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  if (r.status) throw new Error(`ffmpeg kon ${file} niet lezen: ${r.stderr}`);
  const b = r.stdout;
  return new Float32Array(b.buffer, b.byteOffset, b.length / 4);
}
// onset strength: rises in loudness, with extra weight on the low end (the kick)
function onsets(x) {
  const n = Math.floor(x.length / HOP) - 1;
  const full = new Float32Array(n), low = new Float32Array(n);
  let lp = 0, prevF = 0, prevL = 0;
  const a = 1 - Math.exp(-2 * Math.PI * 150 / SR);
  for (let f = 0; f < n; f++) {
    let ef = 0, el = 0;
    for (let i = f * HOP; i < f * HOP + HOP * 2 && i < x.length; i++) { lp += a * (x[i] - lp); ef += x[i] * x[i]; el += lp * lp; }
    const lf = Math.log(1e-6 + ef), ll = Math.log(1e-6 + el);
    full[f] = Math.max(0, lf - prevF); low[f] = Math.max(0, ll - prevL);
    prevF = lf; prevL = ll;
  }
  const o = new Float32Array(n);
  for (let f = 0; f < n; f++) o[f] = full[f] + 1.5 * low[f];
  // take away the local average so steady parts count for nothing
  const w = 16, out = new Float32Array(n);
  for (let f = 0; f < n; f++) { let s = 0, c = 0; for (let k = Math.max(0, f - w); k < Math.min(n, f + w); k++) { s += o[k]; c++; } out[f] = Math.max(0, o[f] - s / c); }
  return { o: out, low };
}
const at = (o, p) => { const i = Math.floor(p), f = p - i; return i + 1 < o.length ? o[i] * (1 - f) + o[i + 1] * f : 0; };
function comb(o, P) {
  let best = -1, phase = 0;
  for (let ph = 0; ph < P; ph += 0.25) {
    let s = 0, c = 0;
    for (let p = ph; p < o.length; p += P) { s += at(o, p); c++; }
    if (s / c > best) { best = s / c; phase = ph; }
  }
  return { score: best, phase };
}
function measure(file, vanaf) {
  const x = decode(file, vanaf, 45);
  if (x.length < SR * 8) throw new Error(`${file} is te kort vanaf ${vanaf} s`);
  const { o, low } = onsets(x);
  // tempo: autocorrelation, with a gentle preference for pop tempos
  let bestBpm = 100, bestS = -1;
  for (let bpm = 70; bpm <= 180; bpm += 0.5) {
    const lag = 60 * FPS / bpm;
    let s = 0;
    for (let f = 0; f + 2 * lag < o.length; f++) s += o[f] * (at(o, f + lag) + 0.5 * at(o, f + 2 * lag));
    s *= Math.exp(-0.5 * Math.pow(Math.log2(bpm / 115) / 0.6, 2));
    if (s > bestS) { bestS = s; bestBpm = bpm; }
  }
  // refine it with a comb over the whole window
  let bpm = bestBpm, fit = comb(o, 60 * FPS / bpm);
  for (let b = bestBpm - 1.5; b <= bestBpm + 1.5; b += 0.02) { const c = comb(o, 60 * FPS / b); if (c.score > fit.score) { fit = c; bpm = b; } }
  // guard against the classic mistakes: half, double, or a triplet feel (2/3, 3/2)
  const fitAt = b => { let best = { score: -1 }; for (let d = -0.6; d <= 0.6; d += 0.02) { const c = comb(o, 60 * FPS / (b + d)); if (c.score > best.score) best = { ...c, bpm: b + d }; } return best; };
  let pick = { ...fit, bpm };
  for (const k of [1.5, 2 / 3, 2, 0.5]) {
    const b = bpm * k;
    if (b < 80 || b > 160) continue;
    const c = fitAt(b);
    if (c.score > pick.score) pick = c;
  }
  bpm = pick.bpm;
  if (Math.abs(bpm - Math.round(bpm)) < 0.15) bpm = Math.round(bpm);
  const P = 60 * FPS / bpm;
  const ph = comb(o, P).phase;
  // the downbeat: the beat of the four that carries the most kick
  let down = 0, dBest = -1;
  for (let j = 0; j < 4; j++) { let s = 0; for (let p = ph + j * P; p < low.length; p += 4 * P) s += at(low, p); if (s > dBest) { dBest = s; down = j; } }
  return { bpm: +bpm.toFixed(2), tel: +(vanaf + (ph + down * P) / FPS).toFixed(3) };
}

function duration(file) {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr || '');
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0;
}
// 'auto': the loudest stretch of the song that is long enough for its chapter (usually the choruses)
function autoStart(file, need) {
  const len = duration(file);
  const x = decode(file, 0, len);
  const sr = 10, hop = Math.floor(SR / sr), rms = [];
  for (let i = 0; i + hop <= x.length; i += hop) { let s = 0; for (let k = i; k < i + hop; k++) s += x[k] * x[k]; rms.push(Math.sqrt(s / hop)); }
  const win = Math.min(Math.round(need * sr), rms.length - 1);
  // smooth over 3 s, then score each window by its average and, twice as hard, its quietest moment
  const sm = rms.map((_, i) => { let s = 0, c = 0; for (let k = Math.max(0, i - 15); k < Math.min(rms.length, i + 15); k++) { s += rms[k]; c++; } return s / c; });
  let best = 0, bestV = -1;
  for (let i = 0; i + win < rms.length; i += 2) {
    let sum = 0, low = Infinity;
    for (let k = i; k < i + win; k++) { sum += sm[k]; if (sm[k] < low) low = sm[k]; }
    const v = sum / win + 2 * low;
    if (v > bestV) { bestV = v; best = i; }
  }
  return Math.max(0, best / sr - 1);
}

function tempo() {
  const REEL = require('./reel-data.js');
  const T = {};
  const plan = REEL.sequence().seq; // scene lengths in bars, for how long each chapter lasts
  for (const mz of REEL.MUZIEK) {
    const f = song(mz.bestand);
    if (!fs.existsSync(f)) { console.log(`  –  ${mz.van}: muziek/${mz.bestand} ontbreekt, de score speelt`); continue; }
    if (mz.bpm && mz.tel !== undefined) { console.log(`  ✓  ${mz.bestand}: ${mz.bpm} BPM (zelf opgegeven)`); continue; }
    let vanaf = mz.vanaf || 0;
    if (mz.vanaf === 'auto' || mz.vanaf === undefined) {
      // the tempo first (anywhere in the song), then how long the chapter will be at that tempo
      const probe = measure(f, Math.max(0, duration(f) / 2 - 20));
      const a = plan.findIndex(p => p.naam === mz.van), b = plan.findIndex(p => p.naam === mz.tot);
      const bars = plan.slice(a, b + 1).reduce((s, p) => s + p.bars, 0);
      vanaf = autoStart(f, bars * 240 / (mz.bpm || probe.bpm) + 1);
    }
    const m = measure(f, vanaf);
    // keyed per chapter: the same song may play in two chapters, from different places
    const key = `${mz.bestand}@${mz.van}`;
    T[key] = { bpm: mz.bpm || m.bpm, tel: mz.tel !== undefined ? mz.tel : m.tel };
    console.log(`  ✓  ${mz.bestand} (${mz.van}): ${T[key].bpm} BPM, begint op ${T[key].tel.toFixed(1)} s`);
  }
  fs.writeFileSync(path.join(here, 'tempo.js'),
    `// Tempo and first downbeat per song, measured by \`node muziek.js tempo\`. Leave empty to use the score.\n(function (root) {\n  const TEMPO = ${JSON.stringify(T, null, 2).replace(/\n/g, '\n  ')};\n  if (typeof module !== 'undefined' && module.exports) module.exports = TEMPO; else root.TEMPO = TEMPO;\n})(this);\n`);
}

// ---------------------------------------------------------------- mix
// Everything below runs in plain JS at 44.1 kHz, so every fade, filter and echo is ours.
const MSR = 44100;
function decodeStereo(file, from, dur) {
  const pad = Math.max(0, -from), n = Math.round(dur * MSR) * 2;
  const r = spawnSync(FFMPEG, ['-v', 'error', '-ss', String(Math.max(0, from)), '-t', String(dur - pad), '-i', file, '-ac', '2', '-ar', String(MSR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  if (r.status) throw new Error(`ffmpeg kon ${file} niet lezen: ${r.stderr}`);
  const src = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 4);
  const out = new Float32Array(n);
  out.set(src.subarray(0, Math.min(src.length, n - Math.round(pad * MSR) * 2)), Math.round(pad * MSR) * 2);
  return out;
}
function lufs(file, from, dur) {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-ss', String(Math.max(0, from)), '-t', String(dur), '-i', file, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /I:\s+(-?[\d.]+) LUFS/.exec(r.stderr || '');
  return m ? +m[1] : -14;
}
// RBJ biquad whose cutoff may move; refreshed every 32 samples
function biquad(type) {
  let b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0, last = -1;
  return (x, f, cnt) => {
    if (cnt % 32 === 0 && f !== last) {
      last = f;
      const w = 2 * Math.PI * Math.min(f, MSR * 0.45) / MSR, c = Math.cos(w), al = Math.sin(w) / (2 * 0.707);
      const a0 = 1 + al;
      if (type === 'lp') { b0 = (1 - c) / 2 / a0; b1 = (1 - c) / a0; b2 = b0; }
      else { b0 = (1 + c) / 2 / a0; b1 = -(1 + c) / a0; b2 = b0; }
      a1 = -2 * c / a0; a2 = (1 - al) / a0;
    }
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}
function readWav(file) {
  const b = fs.readFileSync(file);
  let o = 12, data = null, ch = 2;
  while (o < b.length) { const id = b.toString('ascii', o, o + 4), sz = b.readUInt32LE(o + 4); if (id === 'fmt ') ch = b.readUInt16LE(o + 10); if (id === 'data') { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz; }
  const n = data.length / 2, f = new Float32Array(ch === 2 ? n : n * 2);
  for (let i = 0; i < n; i++) { const v = data.readInt16LE(i * 2) / 32768; if (ch === 2) f[i] = v; else { f[2 * i] = v; f[2 * i + 1] = v; } }
  return f;
}
function writeWav(file, f) {
  const n = f.length;
  const b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(MSR, 24); b.writeUInt32LE(MSR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, f[i])) * 32767), 44 + i * 2);
  fs.writeFileSync(file, b);
}

function mix() {
  const REEL = require('./reel-data.js');
  const { seq, total, liedjes } = REEL.sequence();
  const aanwezig = liedjes.filter(l => fs.existsSync(song(l.bestand))).sort((a, b) => a.start - b.start);
  if (!aanwezig.length) { console.log('geen liedjes in muziek/: soundtrack.wav blijft de gesynthetiseerde score'); return; }
  const N = Math.ceil(total * MSR);
  const mus = new Float32Array(N * 2);
  const TARGET = -16;   // each chapter is matched to this loudness before the master

  // chapters: every song, and the score wherever no song plays
  const chapters = aanwezig.map(l => ({ ...l, type: 'song' }));
  let s0 = null;
  const covered = t => aanwezig.some(l => t >= l.start - 1e-6 && t < l.end - 1e-6);
  seq.forEach((sc, i) => {
    const c = covered(sc.start);
    if (!c && s0 === null) s0 = sc.start;
    if ((c || i === seq.length - 1) && s0 !== null) { chapters.push({ type: 'score', start: s0, end: c ? sc.start : sc.start + sc.dur, bpm: 100 }); s0 = null; }
  });
  chapters.sort((a, b) => a.start - b.start);

  chapters.forEach((ch, k) => {
    const next = chapters[k + 1], prev = chapters[k - 1];
    const bar = 240 / ch.bpm, beat = bar / 4;
    const lead = prev ? bar : 0;               // the incoming song fades in, muffled, over one bar
    const t0 = ch.start - lead, dur = ch.end - t0;
    const file = ch.type === 'song' ? song(ch.bestand) : path.join(here, 'score.wav');
    const from = ch.type === 'song' ? ch.tel - lead : t0;
    const x = decodeStereo(file, from, dur);
    // matched loudness, plus the chapter's own offset (db) and an optional muffle (lowpass, in Hz)
    const g = Math.pow(10, (TARGET + (ch.db || 0) - lufs(file, from + lead, ch.end - ch.start)) / 20);
    const top = ch.lowpass || 20000;
    const lpL = biquad('lp'), lpR = biquad('lp'), hpL = biquad('hp'), hpR = biquad('hp');
    const n = x.length / 2, outBar = next ? bar : 0;
    const echoFrom = n - Math.round(beat * MSR);      // the last beat feeds the echo
    const echo = next ? new Float32Array(Math.round(beat * MSR) * 2) : null;
    for (let i = 0; i < n; i++) {
      const t = i / MSR;
      let l = x[2 * i] * g, r = x[2 * i + 1] * g;
      if (ch.lowpass && i >= lead * MSR) { l = lpL(l, top, i); r = lpR(r, top, i); }
      let vol = 1;
      if (t < lead) {                                        // lead-in: low-pass opens, level rises
        const q = t / lead;
        const f = 220 * Math.pow(top / 220, q * q);
        l = lpL(l, f, i); r = lpR(r, f, i);
        vol = Math.sin(q * Math.PI / 2) * 0.9 + 0.1 * q;
      }
      const tl = dur - t;
      if (outBar && tl < outBar) {                           // lead-out: high-pass thins it out
        const q = 1 - tl / outBar;
        const f = 25 * Math.pow(500 / 25, q);
        l = hpL(l, f, i); r = hpR(r, f, i);
        vol *= 1 - 0.3 * q;
      }
      if (tl < 0.012) vol *= tl / 0.012;
      if (!next && tl < 0.25) vol *= tl / 0.25;
      if (echo && i >= echoFrom) { echo[2 * (i - echoFrom)] = l * vol; echo[2 * (i - echoFrom) + 1] = r * vol; }
      const j = Math.round((t0 + t) * MSR);
      if (j >= 0 && j < N) { mus[2 * j] += l * vol; mus[2 * j + 1] += r * vol; }
    }
    // echo-out: the last beat repeats in eighth notes at the outgoing tempo, darker and wider each time
    if (echo) {
      const D = Math.round(beat / 2 * MSR), en = echo.length / 2;
      const end = Math.round(ch.end * MSR);
      for (let rep = 1; rep <= 6; rep++) {
        const gain = 0.5 * Math.pow(0.6, rep - 1);
        let lpl = 0, lpr = 0;
        const a = Math.exp(-2 * Math.PI * (6000 / rep) / MSR);
        for (let i = 0; i < en; i++) {
          lpl = (1 - a) * echo[2 * i] + a * lpl; lpr = (1 - a) * echo[2 * i + 1] + a * lpr;
          const j = end + (rep - 1) * D + i;
          if (j >= N) break;
          const sw = rep % 2 ? 0.7 : 1.3; // ping-pong
          mus[2 * j] += lpl * gain * (2 - sw); mus[2 * j + 1] += lpr * gain * sw;
        }
      }
    }
    console.log(`  ♪  ${ch.type === 'song' ? ch.bestand : 'score'}: ${ch.start.toFixed(1)}–${ch.end.toFixed(1)} s, ${ch.bpm} BPM, ${(20 * Math.log10(g)).toFixed(1)} dB`);
  });

  // make room for the effects: the music dips under each one, smoothly
  const duck = new Float32Array(N).fill(1);
  const events = fs.existsSync(path.join(here, 'fx-events.json')) ? JSON.parse(fs.readFileSync(path.join(here, 'fx-events.json'))) : [];
  for (const e of events) {
    const depth = e.kind === 'hit' ? 0.5 : e.kind === 'thump' ? 0.8 : 0.88;
    const att = e.kind === 'hit' ? 0.02 : 0.15, hold = e.kind === 'hit' ? 0.2 : 0.1, rel = e.kind === 'hit' ? 0.9 : 0.35;
    const a = Math.round((e.t - att) * MSR), b = Math.round((e.t + hold + rel) * MSR);
    for (let j = Math.max(0, a); j < Math.min(N, b); j++) {
      const t = j / MSR - e.t;
      const env = t < 0 ? 1 + t / att : t < hold ? 1 : 1 - (t - hold) / rel;
      const v = 1 - (1 - depth) * (0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, env))));
      if (v < duck[j]) duck[j] = v;
    }
  }
  const fx = readWav(path.join(here, 'sfx.wav'));
  const FX_GAIN = 1.1;
  const outb = new Float32Array(N * 2);
  for (let j = 0; j < N; j++) {
    outb[2 * j] = mus[2 * j] * duck[j] + (fx[2 * j] || 0) * FX_GAIN;
    outb[2 * j + 1] = mus[2 * j + 1] * duck[j] + (fx[2 * j + 1] || 0) * FX_GAIN;
  }

  // master: gentle glue compression, loudness to -16 LUFS, then a look-ahead limiter at -1 dBFS
  const LOUD = -16;
  (function glue() {
    const thr = Math.pow(10, -12 / 20), ratio = 2, att = Math.exp(-1 / (0.012 * MSR)), rel = Math.exp(-1 / (0.2 * MSR));
    let env = 0;
    for (let j = 0; j < N; j++) {
      const lvl = Math.max(Math.abs(outb[2 * j]), Math.abs(outb[2 * j + 1]));
      env = lvl > env ? att * env + (1 - att) * lvl : rel * env + (1 - rel) * lvl;
      const gr = env > thr ? Math.pow(env / thr, 1 / ratio - 1) : 1;
      outb[2 * j] *= gr; outb[2 * j + 1] *= gr;
    }
  })();
  const tmp = path.join(here, '.mix-tmp.wav');
  writeWav(tmp, outb.map(v => v * 0.5)); // measured at half level so nothing clips on the way
  const measured = lufs(tmp, 0, total) + 6.02;
  fs.rmSync(tmp, { force: true });
  const lg = Math.pow(10, (LOUD - measured) / 20);
  for (let i = 0; i < outb.length; i++) outb[i] *= lg;
  (function limiter() {
    const ceil = Math.pow(10, -1 / 20), LA = Math.round(0.005 * MSR), rel = 1 - Math.exp(-1 / (0.08 * MSR));
    const req = new Float32Array(N);
    for (let j = 0; j < N; j++) { const p = Math.max(Math.abs(outb[2 * j]), Math.abs(outb[2 * j + 1])); req[j] = p > ceil ? ceil / p : 1; }
    // the lowest required gain over the next 2·LA samples, then smoothed over LA
    const mn = new Float32Array(N), dq = [];
    for (let j = N - 1; j >= 0; j--) {
      while (dq.length && req[dq[dq.length - 1]] >= req[j]) dq.pop();
      dq.push(j);
      while (dq[0] > j + 2 * LA) dq.shift();
      mn[j] = req[dq[0]];
    }
    let acc = LA, g = 1, over = 0, maxGr = 1; // acc: the sum of the last LA minima (1 before the start)
    for (let j = 0; j < N; j++) {
      acc += mn[j] - (j >= LA ? mn[j - LA] : 1);
      const target = Math.max(0, Math.min(mn[j], acc / LA));
      g = target < g ? target : g + (1 - g) * rel;
      if (g < 0.891) over++; if (g < maxGr) maxGr = g;
      outb[2 * j] = Math.max(-ceil, Math.min(ceil, outb[2 * j] * g));
      outb[2 * j + 1] = Math.max(-ceil, Math.min(ceil, outb[2 * j + 1] * g));
    }
    console.log(`  limiter: hooguit ${(-20 * Math.log10(maxGr)).toFixed(1)} dB, ${(100 * over / N).toFixed(1)}% van de tijd meer dan 1 dB`);
  })();
  writeWav(path.join(here, 'soundtrack.wav'), outb);
  console.log(`soundtrack.wav: liedjes gemixt (${LOUD} LUFS)`);
}

const cmd = process.argv[2];
if (cmd === 'tempo') { console.log('tempo van de liedjes meten…'); tempo(); }
else if (cmd === 'mix') { console.log('liedjes onder de film mixen…'); mix(); }
else { console.log('gebruik: node muziek.js tempo | mix'); process.exit(1); }
