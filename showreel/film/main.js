/*
 * Sequencing and rendering: which scene plays when, the camera shake on every
 * slam, grain and vignette, and the hooks render.js uses to capture frames.
 */
const { seq: SEQ, total: DUR } = REEL.sequence();

const DRAW = { tv: sTv, rol: sRol, knal: sKnal, raster: sRaster, baan: sBaan, getallen: sGetallen, opening: sOpening, maand: sMaand, vervolgd: sVervolgd, memoriam: sMemoriam, dossier: sDossier, finale: sFinale };
function sceneIndex(t) { let i = 0; while (i < SEQ.length - 1 && t >= SEQ[i + 1].start) i++; return i; }
function setTempo(sc) { BAR = sc.bar; B = sc.beat; K = BAR / OBAR; }
function drawScene(i, lt) { const sc = SEQ[i]; setTempo(sc); DRAW[sc.kind](lt, sc, SEQ[i + 1]); }

// ---------------------------------------------------------------- the slams
const SCHOK = { tok: 12, glas: 14, pets: 12, bam: 18, plons: 10, zoemer: 10, plof: 10, flits: 8, airhorn: 8, klak: 6 };
const IMPACTS = (() => {
  const out = [];
  SEQ.forEach(sc => {
    setTempo(sc);
    const t0 = sc.start;
    if (sc.kind === 'rol') out.push([t0 + BOTS * K, 12]);
    if (sc.kind === 'knal') out.push([t0, 18]);
    if (sc.kind === 'getallen') out.push([t0, 10]);
    if (sc.kind === 'opening') out.push([t0, 12], [t0 + sc.dur - B, 10]);
    if (sc.kind === 'maand') {
      const st = { kalender: 0, stempel: 0.35, trein: 0.8, val: 1.2 }[sc.sting];
      if (st !== undefined) out.push([t0 + st * B, sc.sting === 'stempel' ? 16 : 9]);
      sc.slots.forEach(s => {
        const it = s.it, at = t0 + s.start, sch = REEL.SCHETS[it.beeld];
        if (it.ernstig || !sch || it.media) return;
        // the heavy sounds of a sketch shake the picture too
        sch.klank.forEach(([wanneer, geluid]) => {
          const amp = SCHOK[geluid];
          if (amp) out.push([at + (typeof wanneer === 'number' ? wanneer : sch.m[wanneer]) * B, amp]);
        });
        if (it.beeld === 'zon') out.push([at + sch.m.nacht * B, 16]);
      });
    }
    if (sc.kind === 'vervolgd') sc.maanden.forEach((m, i) => out.push([t0 + i * B, 6]));
    if (sc.kind === 'dossier') out.push([t0 + 3.5 * B, 12]);
    if (sc.kind === 'finale') { const cd = t0 + sc.dur - BAR; out.push([t0 + BAR, 14], [cd, 10], [cd + B, 10], [cd + 2 * B, 10], [cd + 3 * B, 18]); }
  });
  setTempo(SEQ[0]);
  return out;
})();
function shake(t) {
  let x = 0, y = 0;
  for (const [ti, amp] of IMPACTS) {
    if (t < ti || t > ti + 0.6) continue;
    const d = Math.exp(-(t - ti) * 13) * amp;
    x += Math.sin((t - ti) * 95) * d; y += Math.cos((t - ti) * 71) * d;
  }
  return [x, y];
}

// ---------------------------------------------------------------- grain and vignette
let GRAIN = [];
function buildGrain() {
  const r = rng(5);
  for (let k = 0; k < 4; k++) {
    const g = document.createElement('canvas'); g.width = 700; g.height = 400;
    const o = g.getContext('2d'); const im = o.createImageData(700, 400);
    for (let i = 0; i < im.data.length; i += 4) { const v = Math.floor(r() * 255); im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    o.putImageData(im, 0, 0); GRAIN.push(g);
  }
}
function post(t) {
  const f = Math.floor(t * FPS + 1e-6);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.07;
  const r = rng(f + 1);
  ctx.drawImage(GRAIN[f % 4], -r() * 180, -r() * 100, 2100, 1200);
  ctx.restore();
  ctx.save();
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H * 1.2);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ================================================================ render
const FLASH_IN = { opening: 1, maand: 1, vervolgd: 1, dossier: 1 };
function render(t) {
  t = clamp(t, 0, DUR - 1e-6);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  rect(0, 0, W, H, '#000');
  const [sx, sy] = shake(t);
  ctx.save();
  ctx.translate(sx, sy);
  const z = 1 + Math.hypot(sx, sy) / 900;
  ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  const i = sceneIndex(t), sc = SEQ[i], lt = t - sc.start;
  drawScene(i, lt);
  setTempo(sc);
  ctx.restore();
  // a punch of light into the next chapter, a fade in after the news
  if (FLASH_IN[sc.kind] && lt < 0.1) rect(0, 0, W, H, '#FFFFFF', 0.75 * (1 - lt / 0.1));
  if (sc.kind === 'memoriam') rect(0, 0, W, H, '#000', 1 - P(lt, 0, sc.beat));
  post(t);
}

// ================================================================== boot
const MEDIA = {};
async function boot() {
  await document.fonts.ready;
  await Promise.all([font(FD, 100), font(FS, 40, 700), font(FS, 40, 500), font(FM, 20), font(FM, 20, 700), font(FL, 40)].map(f => document.fonts.load(f, '0123456789ABCËÉ€')));
  ctx.font = font(FD, 100);
  const m = ctx.measureText('0');
  CAP = m.actualBoundingBoxAscent / 100;
  DIGW = m.width / 100;
  buildGrain();
  buildParticles();
  // photos from media/, loaded up front; a missing file falls back to the drawing
  await Promise.all(REEL.NIEUWS.filter(it => it.media && it.media.foto).map(it => new Promise(res => {
    const img = new Image();
    img.onload = () => { MEDIA[it.kop] = { img }; res(); };
    img.onerror = () => { console.warn('missing media/' + it.media.foto); res(); };
    img.src = 'media/' + it.media.foto;
  })));
  // clips are folders of frames (media/<name>/0001.jpg …), loaded as they are needed
  REEL.NIEUWS.filter(it => it.media && it.media.video).forEach(it => {
    const v = it.media, cache = new Map();
    const idx = u => 1 + Math.min(v.frames - 1, Math.floor((u + (v.start || 0)) * (v.fps || 30)));
    const src = i => `media/${v.video}/${String(i).padStart(4, '0')}.jpg`;
    MEDIA[it.kop] = {
      img: true,
      frame: u => cache.get(idx(u)),
      need: u => {
        const i = idx(u);
        if (cache.has(i)) return null;
        return new Promise(res => { const im = new Image(); im.onload = () => { cache.set(i, im); if (cache.size > 90) cache.delete(cache.keys().next().value); res(); }; im.onerror = res; im.src = src(i); });
      },
    };
  });
}
// wait until the clip frames for time t are decoded (used while rendering)
async function ensureMedia(t) {
  const i = sceneIndex(t), sc = SEQ[i];
  if (sc.kind !== 'maand') return;
  const lt = t - sc.start;
  for (const s of sc.slots) {
    if (lt < s.start - 1 || lt > s.start + s.dur + 1) continue;
    const m = MEDIA[s.it.kop];
    if (m && m.need) { const p = m.need(clamp(lt - s.start, 0, s.dur)); if (p) await p; }
  }
}
const capture = new URLSearchParams(location.search).has('capture');
window.__ready = boot();
window.__render = async t => { await ensureMedia(t); render(t); };
window.__duration = DUR;
window.__seq = SEQ.map(s => ({ kind: s.kind, naam: s.naam, start: s.start, dur: s.dur }));
if (capture) {
  document.body.classList.add('capture');
} else {
  const audio = new Audio('soundtrack.wav');
  let start = performance.now();
  cv.addEventListener('click', () => { audio.currentTime = 0; audio.play().catch(() => {}); start = performance.now(); });
  window.__ready.then(() => {
    const loop = () => {
      const t = !audio.paused ? audio.currentTime : ((performance.now() - start) / 1000) % DUR;
      ensureMedia(t);
      render(t);
      requestAnimationFrame(loop);
    };
    loop();
  });
}
