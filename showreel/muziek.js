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
  if (Math.abs(bpm - Math.round(bpm)) < 0.15) bpm = Math.round(bpm);
  const P = 60 * FPS / bpm;
  const ph = comb(o, P).phase;
  // the downbeat: the beat of the four that carries the most kick
  let down = 0, dBest = -1;
  for (let j = 0; j < 4; j++) { let s = 0; for (let p = ph + j * P; p < low.length; p += 4 * P) s += at(low, p); if (s > dBest) { dBest = s; down = j; } }
  return { bpm: +bpm.toFixed(2), tel: +(vanaf + (ph + down * P) / FPS).toFixed(3) };
}

function tempo() {
  const REEL = require('./reel-data.js');
  const T = {};
  for (const mz of REEL.MUZIEK) {
    const f = song(mz.bestand);
    if (!fs.existsSync(f)) { console.log(`  –  ${mz.van}: muziek/${mz.bestand} ontbreekt, de score speelt`); continue; }
    if (mz.bpm && mz.tel !== undefined) { console.log(`  ✓  ${mz.bestand}: ${mz.bpm} BPM (zelf opgegeven)`); continue; }
    const m = measure(f, mz.vanaf || 0);
    T[mz.bestand] = { bpm: mz.bpm || m.bpm, tel: mz.tel !== undefined ? mz.tel : m.tel };
    console.log(`  ✓  ${mz.bestand}: ${T[mz.bestand].bpm} BPM, eerste tel op ${T[mz.bestand].tel} s`);
  }
  fs.writeFileSync(path.join(here, 'tempo.js'),
    `// Tempo and first downbeat per song, measured by \`node muziek.js tempo\`. Leave empty to use the score.\n(function (root) {\n  const TEMPO = ${JSON.stringify(T, null, 2).replace(/\n/g, '\n  ')};\n  if (typeof module !== 'undefined' && module.exports) module.exports = TEMPO; else root.TEMPO = TEMPO;\n})(this);\n`);
}

// ---------------------------------------------------------------- mix
function mix() {
  const REEL = require('./reel-data.js');
  const { seq, total, liedjes } = REEL.sequence();
  const aanwezig = liedjes.filter(l => fs.existsSync(song(l.bestand)));
  if (!aanwezig.length) { console.log('geen liedjes in muziek/: soundtrack.wav blijft de gesynthetiseerde score'); return; }
  const FO = 0.45; // each chapter fades into the next
  const inputs = ['-i', path.join(here, 'score.wav'), '-i', path.join(here, 'sfx.wav')];
  const parts = [];
  const seg = (label, src, from, start, dur, gain = 1) => {
    const ms = Math.round(start * 1000);
    parts.push(`[${src}:a]atrim=start=${from.toFixed(3)}:end=${(from + dur + FO).toFixed(3)},asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=stereo,loudnorm=I=-16:TP=-2:LRA=11,aresample=44100,afade=t=in:d=0.02,afade=t=out:st=${dur.toFixed(3)}:d=${FO},volume=${gain},adelay=${ms}|${ms}[${label}]`);
  };
  const labels = [];
  aanwezig.forEach((l, k) => {
    inputs.push('-i', song(l.bestand));
    seg(`m${k}`, k + 2, l.tel, l.start, l.end - l.start, l.gain || 1);
    labels.push(`[m${k}]`);
    console.log(`  ♪  ${l.van} – ${l.tot}: ${l.bestand} (${l.bpm} BPM)`);
  });
  // the score fills every stretch without a song
  let s0 = null;
  const covered = t => aanwezig.some(l => t >= l.start - 1e-6 && t < l.end - 1e-6);
  seq.forEach((sc, i) => {
    const c = covered(sc.start);
    if (!c && s0 === null) s0 = sc.start;
    if ((c || i === seq.length - 1) && s0 !== null) {
      const end = c ? sc.start : sc.start + sc.dur;
      seg(`s${labels.length}`, 0, s0, s0, end - s0, 0.9);
      labels.push(`[s${labels.length}]`);
      s0 = null;
    }
  });
  const graph = [
    ...parts,
    `${labels.join('')}amix=inputs=${labels.length}:normalize=0:dropout_transition=0[mus]`,
    `[1:a]asplit[fx1][fx2]`,
    `[mus][fx1]sidechaincompress=threshold=0.08:ratio=3:attack=5:release=300[duck]`,
    `[duck][fx2]amix=inputs=2:weights=1 0.55:normalize=0,alimiter=limit=0.93,atrim=0:${total.toFixed(3)},afade=t=out:st=${(total - 0.5).toFixed(3)}:d=0.5[out]`,
  ].join(';');
  const r = spawnSync(FFMPEG, ['-y', '-v', 'error', ...inputs, '-filter_complex', graph, '-map', '[out]', '-c:a', 'pcm_s16le', '-ar', '44100', path.join(here, 'soundtrack.wav')], { stdio: 'inherit' });
  if (r.status) process.exit(r.status);
  console.log('soundtrack.wav: liedjes gemixt');
}

const cmd = process.argv[2];
if (cmd === 'tempo') tempo();
else if (cmd === 'mix') mix();
else { console.log('gebruik: node muziek.js tempo | mix'); process.exit(1); }
