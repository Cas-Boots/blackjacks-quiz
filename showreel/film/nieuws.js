/*
 * The BJ Journaal: the ident with the penguin anchor and his crew, the tear-off
 * calendar, and the month: its sting (stings.js), then its headlines one after the
 * other, each as its own sketch (schetsen*.js), cut on the beat with a snap, a
 * flash, a whip pan, a cartoon iris or a giant animal running across. A headline
 * without a sketch, or with a photo or clip from media/, falls back to the simple
 * template: a picture, a sticker headline popping in word by word, a maatje.
 */
const FLOOR = H - 58;          // where the maatjes stand
const ROLL = ['aap', 'kip', 'kangoeroe', 'lama', 'hond', 'kikker', 'eekhoorn', 'hamster', 'flamingo', 'papegaai', 'konijn', 'egel'];
const STING_BG = [C.fire, C.blue, C.sun, C.mint, C.pink, C.purple];

// the world as a dotted globe
function globe(cx, cy, R, rotLon, tilt, color, alpha = 1) {
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  ctx.save(); ctx.fillStyle = color;
  for (let i = 0; i < WORLD_DOTS.length; i += 2) {
    const lon = (WORLD_DOTS[i] * WORLD_STEP + rotLon) * Math.PI / 180, lat = WORLD_DOTS[i + 1] * WORLD_STEP * Math.PI / 180;
    const x = Math.cos(lat) * Math.sin(lon), y0 = Math.sin(lat), z0 = Math.cos(lat) * Math.cos(lon);
    const y = y0 * ct - z0 * st, z = y0 * st + z0 * ct;
    if (z <= 0) continue;
    ctx.globalAlpha = alpha * (0.25 + 0.75 * z);
    ctx.beginPath(); ctx.arc(cx + x * R, cy - y * R, 2.4 + z * 1.4, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = alpha * 0.25; ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- the ident
function sOpening(lt, sc) {
  rect(0, 0, W, H, C.ink);
  const g = ctx.createRadialGradient(W * 0.7, H * 0.45, 50, W * 0.7, H * 0.45, 1100);
  g.addColorStop(0, '#1B2A8A'); g.addColorStop(1, C.ink);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // rays turning behind everything
  ctx.save(); ctx.translate(W * 0.7, H * 0.47); ctx.rotate(lt * 0.25); ctx.globalAlpha = 0.07; ctx.fillStyle = C.paper;
  for (let k = 0; k < 16; k++) { ctx.rotate(TAU / 16); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1400, -120); ctx.lineTo(1400, 120); ctx.fill(); }
  ctx.restore();
  const gs = E.outPop(P(lt, 0.0, 0.5)) * (1 + 0.03 * beatPulse(lt, 8));
  globe(W * 0.7, H * 0.44, 380 * gs, lt * 40 - 10, 0.35, C.paper, 0.9);
  ring(W * 0.7, H * 0.44, 430 * gs, C.fire, 6, 0.8);
  ring(W * 0.7, H * 0.44, (430 + 80 * fase(lt)) * gs, C.sun, 4, 0.7 * (1 - fase(lt)));
  // the title, a word per beat
  [['HET JAAR', C.fire, 0], ['IN BEELD', C.blue, 1]].forEach(([w, c, i]) => {
    const t0 = i * sc.beat * 0.5;
    const p = E.outPop(P(lt, t0, t0 + 0.25));
    if (p <= 0) return;
    around(110 + 380, 300 + i * 190 - 70, p * (1 + 0.04 * beatPulse(lt - t0, 10)), (i ? 0.03 : -0.04) * (1 - p) + (i ? 0.02 : -0.02), () =>
      sticker(w, 110, 300 + i * 190, { size: 200, shadow: c }));
  });
  const kp = E.outExpo(P(lt, sc.beat * 1.2, sc.beat * 1.8));
  txt('BJ JOURNAAL · TERUGBLIK 2026', 118, 560, { f: FM, size: 24, weight: 700, color: C.paper, align: 'left', track: 6, alpha: kp });
  // the anchor slides in behind his desk, the crew pops up behind him
  const ax = lerp(W + 300, W * 0.7, E.outBack(P(lt, sc.beat * 1.5, sc.beat * 2.2)));
  const crew = ['kip', 'lama', 'goudvis', 'zeehond', 'aap'];
  crew.forEach((k, i) => {
    const c0 = sc.bar + i * sc.beat * 0.5;
    if (lt < c0) return;
    acteur(k, i % 2 ? 'zwaai' : 'juich', lt - c0, ax - 520 + i * 260, 900, 250, { flip: true, t0: i });
  });
  if (lt > sc.beat * 1.5) {
    acteur('pinguin', 'none', lt - sc.beat * 1.5, ax, 1010, 480, { flip: true, t0: 7, pose: { ogen: lt > sc.beat * 2.5 && lt < sc.bar ? 'blij' : 'open', arm: lt > sc.beat * 2.5 && lt < sc.bar ? 'op' : 'neer' } });
    poly([[ax - 760, 860], [W + 40, 860], [W + 40, H + 10], [ax - 700, H + 10]], '#0A0D2A');
    rect(ax - 760, 860, W, 22, C.fire);
    txt('BJ', ax - 640, 960, { f: FL, size: 70, color: C.paper, alpha: 0.9 });
  }
  ballon('GOEDENAVOND!', ax + 60, 540, lt - sc.beat * 2.5, { side: -1, size: 66 });
  // everyone jumps on the last beat
  if (lt > sc.dur - sc.beat) {
    const q = lt - (sc.dur - sc.beat);
    sticker('NIEUWS!', W * 0.36, 820 - E.outPop(P(q, 0, 0.2)) * 40, { size: 120 * E.outPop(P(q, 0, 0.2)), shadow: C.fire, align: 'center' });
  }
}

// ---------------------------------------------------------------- the calendar
function kalenderBlad(m, x, y, w, h, o = {}) {
  // one page of the tear-off calendar
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.fillStyle = o.papier || '#FFFDF5'; ctx.fill();
  ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h * 0.22, [18, 18, 0, 0]); ctx.fillStyle = o.band || C.fire; ctx.fill(); ctx.restore();
  line(x, y + h * 0.22, x + w, y + h * 0.22, C.ink, 6);
  txt(o.jaar || '2026', x + w / 2, y + h * 0.115, { f: FL, size: h * 0.12, color: C.paper });
  const naam = o.tekst || MAANDEN[m];
  const fs = Math.min(h * 0.24, (w - 60) / (measure(naam, font(FL, 100)) / 100));
  txt(naam, x + w / 2, y + h * 0.6, { f: FL, size: fs, color: C.ink });
  if (o.stempel) {
    ctx.save(); ctx.translate(x + w / 2, y + h * 0.82); ctx.rotate(-0.12);
    ctx.strokeStyle = C.fire; ctx.lineWidth = 7; ctx.beginPath(); ctx.roundRect(-w * 0.38, -38, w * 0.76, 76, 10); ctx.stroke();
    txt(o.stempel, 0, 4, { f: FL, size: 44, color: C.fire }); ctx.restore();
  } else txt(o.onder || '★ ★ ★', x + w / 2, y + h * 0.84, { f: FL, size: h * 0.06, color: C.ink, alpha: 0.35 });
  ctx.restore();
}
function kalender(sc, lt, o = {}) {
  const m = o.m !== undefined ? o.m : sc.m, prev = o.prev !== undefined ? o.prev : sc.prevM;
  const beat = sc.beat;
  rect(0, 0, W, H, o.bg || STING_BG[m % STING_BG.length]);
  // comic rays
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(lt * 0.4); ctx.globalAlpha = 0.14; ctx.fillStyle = '#FFFFFF';
  for (let k = 0; k < 14; k++) { ctx.rotate(TAU / 14); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1300, -150); ctx.lineTo(1300, 150); ctx.fill(); }
  ctx.restore();
  const w = 720, h = 760, x = W / 2 - w / 2, y = H / 2 - h / 2 + 30;
  const zoom = o.zoom === false ? 1 : 1 + 6 * E.inExpo(P(lt, 2 * beat - 0.16, 2 * beat));
  const pop = 1 + 0.06 * beatPulse(lt, 9);
  around(W / 2, H / 2, zoom * pop, 0, () => {
    // the block and its binding
    rect(x + 16, y + 20, w, h, 'rgba(0,0,0,0.25)');
    for (let k = 0; k < 4; k++) kalenderBlad(m, x, y + 6 - k * 0, w, h, { band: '#C7C0B4', papier: '#E8E1D4' });
    kalenderBlad(m, x, y, w, h, { tekst: o.tekst, stempel: o.stempel });
    // the old page rips off and flies at the camera
    const rip = P(lt, 0.05, 0.05 + beat * 0.9);
    if (rip < 1) {
      ctx.save();
      const fly = E.inCubic(rip);
      ctx.translate(x + w * 0.1 + fly * 600, y + fly * 900); ctx.rotate(fly * 1.4); ctx.scale(1 + fly * 0.6, 1 + fly * 0.6); ctx.translate(-(x + w * 0.1), -y);
      kalenderBlad(prev, x, y, w, h, { jaar: prev === 11 && m === 0 ? '2025' : '2026', tekst: o.oudTekst });
      ctx.restore();
    }
    for (let k = 0; k < 7; k++) { circle(x + 90 + k * 90, y - 6, 16, C.ink); rect(x + 84 + k * 90, y - 40, 12, 40, '#9A9AA6'); }
  });
  // the maatje that does the ripping
  if (o.dier !== false && zoom < 1.5) {
    const who = o.dier || ROLL[m % ROLL.length];
    const g = lt;
    const hd = acteur(who, g < beat * 0.6 ? 'none' : 'juich', g, x + w + 150, y + h + 40, 260, { flip: true, t0: m });
    if (hd && o.zegt) ballon(o.zegt, hd.x, hd.y, g - beat * 0.5, { side: 1 });
  }
  if (lt < 0.12) sticker('SCHRRR!', W / 2 + 330, 180, { size: 90, shadow: C.ink, align: 'center', alpha: 1 - lt / 0.12 });
  monthBar(m, prev === 11 && m === 0 ? -1 : prev, lt, beat);
}
function monthBar(m, prevM, lt, beat) {
  const x0 = 360, x1 = W - 360, y = H - 70, segW = (x1 - x0) / 12;
  const pos = lerp(prevM, m, E.inOutExpo(P(lt, 0.1, beat * 1.2)));
  rect(x0 - 30, y - 30, x1 - x0 + 60, 74, C.ink, 0.85);
  rect(x0, y - 4, Math.max(0, (pos + 1) * segW), 8, C.paper, 0.9);
  for (let k = 0; k < 12; k++) txt(MND[k], x0 + (k + 0.5) * segW, y + 26, { f: FM, size: 14, weight: k === m ? 700 : 400, color: C.paper, track: 2, alpha: k === m ? 1 : 0.4 });
  if (pos >= 0) dier(ROLL[m % ROLL.length], x0 + (pos + 0.5) * segW, y + 4, 56, { pose: { poten: Math.floor(lt * 12) % 2 ? 'a' : 'b' }, schaduw: false });
}

// ---------------------------------------------------------------- a headline
function picture(it, u) {
  const m = it.media && MEDIA[it.kop];
  if (m && m.img) {
    const img = m.frame ? m.frame(u) : m.img;
    if (img && img.naturalWidth) {
      const s0 = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const r = rng(it.kop.length * 7);
      const z = 1.02 + 0.08 * (m.frame ? 0.2 : 1) * (u / D);
      const dx = (r() - 0.5) * 80 * (u / D), dy = (r() - 0.5) * 40 * (u / D);
      const w = img.naturalWidth * s0 * z, h = img.naturalHeight * s0 * z;
      ctx.drawImage(img, W / 2 - w / 2 + dx + (it.media.x || 0) * (w - W) / 2, H / 2 - h / 2 + dy + (it.media.y || 0) * (h - H) / 2, w, h);
      return;
    }
  }
  (BEELD[it.beeld] || BEELD.default)(u, it);
}
// the picture, with a camera that pushes in and bumps on the beat
function camera(it, u, k, f) {
  const z = 1.03 + 0.07 * (u / D) + (it.ernstig ? 0 : 0.02 * beatPulse(u, 9));
  const r = (k % 2 ? 1 : -1) * 0.01 * (u / D);
  around(W / 2, H / 2, z, r, f);
}
// the sticker headline, word by word on the sixteenths
function koptekst(it, u, k, o = {}) {
  const col = it.tag === 'NL' ? C.fire : C.blue;
  const size = o.size || 92, lh = size * 1.04;
  const kop = it.kop.toUpperCase(), fnt = font(FL, size);
  const lines = balans(kop, fnt, o.maxW || 1180);
  const x0 = o.x !== undefined ? o.x : 96;
  const yLast = o.y !== undefined ? o.y : FLOOR - (it.held && !o.zonderSub ? 96 : 40);
  const sp = measure(' ', fnt);
  const words = [];
  lines.forEach((l, li) => {
    const lw = measure(l, fnt);
    let x = o.align === 'center' ? W / 2 - lw / 2 : x0;
    l.split(' ').forEach(w => { const ww = measure(w, fnt); words.push({ w, x, y: yLast - (lines.length - 1 - li) * lh, ww }); x += ww + sp; });
  });
  const step = Math.min(B / 4, B * 0.8 / words.length);
  const tilt = o.tilt !== undefined ? o.tilt : (k % 2 ? 0.018 : -0.022);
  const bump = 1 + (it.ernstig ? 0 : 0.028 * beatPulse(u, 10));
  const px = o.align === 'center' ? W / 2 : x0, py = yLast - size * 0.4;
  ctx.save();
  ctx.translate(px, py); ctx.rotate(tilt); ctx.scale(bump, bump); ctx.translate(-px, -py);
  // the label: where and when
  if (!o.zonderTag) {
    const tagTxt = (it.tag === 'NL' ? 'NEDERLAND' : 'DE WERELD') + ' · ' + it.datum.toUpperCase();
    const tw = measure(tagTxt, font(FM, 22, 700), 3) + 40;
    const ty = yLast - lines.length * lh - 18, tp = E.outExpo(P(u, 0, 0.22));
    const tx = o.align === 'center' ? W / 2 - tw / 2 : x0;
    ctx.save(); clipRect(tx - 10, ty - 30, (tw + 20) * tp, 60);
    ctx.beginPath(); ctx.roundRect(tx, ty - 22, tw, 44, 10); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke();
    txt(tagTxt, tx + 20, ty + 2, { f: FM, size: 22, weight: 700, color: C.paper, align: 'left', track: 3 });
    ctx.restore();
  }
  words.forEach((wd, i) => {
    const ti = 0.02 + i * step;
    const p = it.ernstig ? E.outCubic(P(u, ti, ti + 0.3)) : E.outPop(P(u, ti, ti + 0.2));
    if (p <= 0) return;
    const cx = wd.x + wd.ww / 2, cy = wd.y - size * 0.35;
    ctx.save(); ctx.translate(cx, cy);
    if (it.ernstig) ctx.globalAlpha *= p; else { ctx.scale(p, p); ctx.rotate((1 - p) * 0.35 * (i % 2 ? 1 : -1)); }
    ctx.translate(-cx, -cy);
    sticker(wd.w, wd.x, wd.y, { size, shadow: it.ernstig ? '#3A3A44' : col });
    ctx.restore();
  });
  ctx.restore();
  // the hero headline brings its sentence
  if (it.held && it.sub && !o.zonderSub) {
    const sa = P(u, B * 1.2, B * 1.6), fs = font(FS, 30, 700);
    const sw = Math.min(1500, measure(it.sub, fs)) + 40;
    if (sa > 0) {
      ctx.save(); ctx.globalAlpha = sa; clipRect(x0 - 6, FLOOR - 76, sw * E.outExpo(sa) + 12, 70);
      rect(x0, FLOOR - 70, sw, 52, C.ink, 0.88);
      txt(it.sub, x0 + 20, FLOOR - 44, { f: FS, size: 30, weight: 700, color: C.paper, align: 'left' });
      ctx.restore();
    }
  }
}
// when the maatje of a headline comes in, in seconds from the start of the shot
const { gagTel } = REEL;
function plekVan(it) { return { x: W - 310, y: FLOOR, h: 300, flip: true, ...(it.plek || {}) }; }
function gag(it, u, s, o = {}) {
  if (!it.maatje || it.ernstig) return null;
  const pl = { ...plekVan(it), ...o };
  const g = u - gagTel(it) * B;
  const hd = acteur(it.maatje, it.doet, g, pl.x, pl.y, pl.h, { flip: pl.flip, dur: s.dur - gagTel(it) * B, t0: hash(it.kop) % 10 });
  if (hd && it.zegt) ballon(it.zegt, hd.x, hd.y, g - 0.12, { side: pl.side || (pl.x > W / 2 ? 1 : -1), onder: hd.onder });
  return hd;
}

// the shot of headline k at u seconds into it
function shot(sc, k, u) {
  const s = sc.slots[k], it = s.it, vorm = it.vorm || 'vol';
  D = s.dur;
  u = clamp(u, 0, s.dur);
  if (SCHETSEN[it.beeld] && !it.media) return it.ernstig ? SCHETSEN[it.beeld](u, it) : around(W / 2, H / 2, 1 + 0.012 * beatPulse(u, 10), 0, () => SCHETSEN[it.beeld](u, it));
  if (vorm === 'tv') return shotTv(sc, k, u);
  if (vorm === 'krant') return shotKrant(sc, k, u);
  if (vorm === 'breaking') return shotBreaking(sc, k, u);
  if (it.ernstig) {
    // serious news: a calm picture, drained of colour, no gag
    const c = offscreen(1, () => camera(it, u, k, () => picture(it, u)));
    ctx.save(); ctx.filter = 'saturate(0.55) brightness(0.97)'; ctx.drawImage(c, 0, 0); ctx.restore();
  } else camera(it, u, k, () => picture(it, u));
  vignetteOnder();
  gag(it, u, s);
  koptekst(it, u, k);
}
function vignetteOnder() {
  const g = ctx.createLinearGradient(0, H * 0.5, 0, H);
  g.addColorStop(0, 'rgba(5,5,7,0)'); g.addColorStop(1, 'rgba(5,5,7,0.72)');
  ctx.fillStyle = g; ctx.fillRect(0, H * 0.5, W, H * 0.5);
}

// a tv in a living room; the camera starts in the screen and pulls back to the couch
function shotTv(sc, k, u) {
  const s = sc.slots[k], it = s.it;
  const sx = 110, sy = 120, sw = 1040, sh = 585;
  const back = E.inOutCubic(P(u, B * 0.4, B * 1.6));
  const zs = lerp(W / sw, 1, back), cx = sx + sw / 2, cy = sy + sh / 2;
  ctx.save();
  ctx.translate(lerp(W / 2, cx, back), lerp(H / 2, cy, back)); ctx.scale(zs, zs); ctx.translate(-cx, -cy);
  // the room
  vgrad(-200, H + 200, [[0, '#F6D7A7'], [1, '#E9B97A']]);
  for (let x = -100; x < W + 100; x += 90) rect(x, -200, 40, H + 400, '#F2CB91', 0.6);
  rect(-200, 840, W + 400, 400, '#8C5A3C');
  rect(-200, 832, W + 400, 14, '#5E3A26');
  // a lamp and a plant
  line(1830, 840, 1830, 380, '#333', 8); poly([[1760, 380], [1900, 380], [1870, 300], [1790, 300]], C.sun); rgrad(1830, 400, 0, 260, [[0, 'rgba(255,230,150,0.45)'], [1, 'rgba(255,230,150,0)']], 'lighter');
  // the tv on its cabinet
  rect(sx - 40, sy + sh + 40, sw + 80, 140, '#5E3A26');
  rect(sx - 36, sy - 36, sw + 72, sh + 72, '#26222A');
  ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
  ctx.translate(sx, sy); ctx.scale(sw / W, sh / H);
  camera(it, u, k, () => picture(it, u));
  ctx.restore();
  rgrad(cx, cy, 0, 700, [[0, 'rgba(255,255,255,0.0)'], [1, 'rgba(0,0,0,0.0)']]);
  ctx.save(); ctx.globalAlpha = 0.08; ctx.fillStyle = '#000'; for (let y = sy; y < sy + sh; y += 5) ctx.fillRect(sx, y, sw, 2); ctx.restore();
  // the couch, with the gang watching
  const bx = 1220, by = 900;
  ctx.save(); ctx.beginPath(); ctx.roundRect(bx, by - 230, 700, 140, 40); ctx.fillStyle = '#C0392B'; ctx.fill(); ctx.restore();
  const kijkers = [it.maatje || 'kip', 'goudvis', 'lama'];
  kijkers.forEach((w, i) => {
    const g = u - gagTel(it) * B;
    const doet = i === 0 ? it.doet : g > 0.15 ? 'juich' : 'none';
    acteur(w, doet === 'ren' ? 'juich' : doet, i === 0 ? g : Math.max(0, u) + (g > 0.15 ? -0.15 : 0), bx + 140 + i * 210, by - 70, 230, { flip: true, t0: i * 3 });
  });
  ctx.save(); ctx.beginPath(); ctx.roundRect(bx - 20, by - 110, 740, 150, 30); ctx.fillStyle = '#E74C3C'; ctx.fill(); ctx.restore();
  rect(bx, by + 30, 30, 50, '#3A2418'); rect(bx + 670, by + 30, 30, 50, '#3A2418');
  ctx.restore();
  const g = u - gagTel(it) * B;
  if (back >= 1 && it.zegt) ballon(it.zegt, bx + 160, by - 330, g - 0.12, { side: 1 });
  koptekst(it, u, k, { zonderSub: true });
}

// the spinning newspaper
function shotKrant(sc, k, u) {
  const s = sc.slots[k], it = s.it;
  const col = it.tag === 'NL' ? C.fire : C.blue;
  rect(0, 0, W, H, col);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(u * 0.3); ctx.globalAlpha = 0.18; ctx.fillStyle = C.ink;
  for (let q = 0; q < 18; q++) { ctx.rotate(TAU / 18); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1400, -110); ctx.lineTo(1400, 110); ctx.fill(); }
  ctx.restore();
  const sp = P(u, 0, B * 0.75), land = E.outCubic(sp);
  const rot = (1 - land) * TAU * 2.5 - 0.04, sc2 = lerp(0.04, 1, land) * (1 + 0.04 * beatPulse(u - B * 0.75, 8) * (sp >= 1 ? 1 : 0)) * (1 + 0.03 * (u / s.dur));
  const pw = 1360, ph = 860;
  around(W / 2, H / 2 - 20, sc2, rot, () => {
    const x = W / 2 - pw / 2, y = H / 2 - ph / 2 - 20;
    rect(x + 18, y + 22, pw, ph, 'rgba(0,0,0,0.35)');
    rect(x, y, pw, ph, '#F4EFE4');
    txt('BJ COURANT', W / 2, y + 92, { f: FD, size: 96, color: C.ink, track: 6 });
    line(x + 40, y + 130, x + pw - 40, y + 130, C.ink, 4); line(x + 40, y + 140, x + pw - 40, y + 140, C.ink, 1.5);
    txt(`${it.datum.toUpperCase()} 2026  ·  EXTRA EDITIE  ·  PRIJS: ÉÉN BITTERBAL`, W / 2, y + 166, { f: FM, size: 18, weight: 700, color: C.ink, track: 4 });
    const kop = it.kop.toUpperCase(), kl = balans(kop, font(FD, 104), pw - 100);
    kl.forEach((l, i) => txt(l, W / 2, y + 290 + i * 104, { f: FD, size: 104, color: C.ink, base: 'alphabetic' }));
    // the photo, in newsprint grey
    const py = y + 290 + kl.length * 104 - 60, fh = y + ph - 40 - py, fw = fh * 16 / 9;
    const c = offscreen(1, () => camera(it, u, k, () => picture(it, u)));
    ctx.save(); ctx.filter = 'grayscale(1) contrast(1.25)'; ctx.drawImage(c, x + 50, py, fw, fh); ctx.restore();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.strokeRect(x + 50, py, fw, fh);
    const tx = x + 80 + fw, tw = x + pw - 50 - tx;
    for (let q = 0; q < 9; q++) rect(tx, py + 8 + q * (fh - 16) / 9, tw * (q === 8 ? 0.6 : 1), 10, C.ink, 0.25);
  });
  if (sp >= 1) gag(it, u, s);
  else if (u < 0.05) rect(0, 0, W, H, '#fff', 0.4);
}

// breaking news: red bars slam in, the headline fills the screen
function shotBreaking(sc, k, u) {
  const s = sc.slots[k], it = s.it;
  camera(it, u, k, () => picture(it, u));
  rect(0, 0, W, H, C.ink, 0.55);
  const bp = E.outExpo(P(u, 0, 0.25));
  [[300, -1, C.fire], [H - 330, 1, C.fire]].forEach(([y, dir, c], i) => {
    ctx.save(); ctx.translate(dir < 0 ? -W * (1 - bp) : W * (1 - bp), 0);
    ctx.beginPath(); ctx.moveTo(0, y - 40); ctx.lineTo(W, y - 70); ctx.lineTo(W, y + 30); ctx.lineTo(0, y + 60); ctx.closePath(); ctx.fillStyle = c; ctx.fill();
    const lbl = 'EXTRA BERICHT   ●   ';
    ctx.save(); ctx.clip();
    for (let x = -((u * 300 * (i ? -1 : 1)) % 700) - 700; x < W + 700; x += measure(lbl, font(FL, 48))) txt(lbl, x, y + 10 - (x / W) * 30, { f: FL, size: 48, color: C.paper, align: 'left' });
    ctx.restore(); ctx.restore();
  });
  const p = E.outPop(P(u, B * 0.25, B * 0.25 + 0.22));
  if (p > 0) around(W / 2, H / 2, p * (1 + 0.035 * beatPulse(u, 9)), -0.03, () => koptekst(it, 1, k, { size: 168, align: 'center', y: H / 2 + 80, maxW: 1600, zonderTag: true, zonderSub: true, tilt: 0 }));
  const tagTxt = (it.tag === 'NL' ? 'NEDERLAND' : 'DE WERELD') + ' · ' + it.datum.toUpperCase();
  txt(tagTxt, W / 2, H / 2 - 200, { f: FM, size: 26, weight: 700, color: C.sun, track: 6, alpha: P(u, B * 0.4, B * 0.6) });
  gag(it, u, s);
}

// ---------------------------------------------------------------- transitions
// draws the month at lt, going from shot to shot on the beat
function sMaand(lt, sc) {
  const ST = REEL.STING * sc.beat;
  if (lt < ST) { stingVan(sc, lt); return; }
  const slots = sc.slots;
  let k = 0; while (k < slots.length - 1 && lt >= slots[k + 1].start) k++;
  const s = slots[k], u = lt - s.start;
  const next = slots[k + 1];
  // the transition into this shot, and the one out of it into the next
  const into = overgang(s.overgang), out = next ? overgang(next.overgang) : null;
  if (out && lt > next.start - out.voor) {
    out.teken(sc, k, k + 1, (lt - next.start + out.voor) / (out.voor + out.na), lt);
  } else if (into && k > 0 && u < into.na) {
    into.teken(sc, k - 1, k, (u + into.voor) / (into.voor + into.na), lt);
  } else if (into && into.kick && u < 0.2) around(W / 2, H / 2, 1 + 0.07 * Math.exp(-u * 18), 0, () => shot(sc, k, u));
  else shot(sc, k, u);
}
// each transition: how long before and after the cut it runs, and how to draw it
// p runs from 0 to 1 over the transition; the cut is at voor / (voor + na)
function overgang(naam) {
  const T = OVERGANG[naam];
  return T ? { ...T, voor: T.voor * B, na: T.na * B } : null;
}
const both = (sc, a, b, lt, f) => {
  const sa = sc.slots[a], sb = sc.slots[b];
  return { oud: () => shot(sc, a, lt - sa.start), nieuw: () => shot(sc, b, lt - sb.start), f };
};
const OVERGANG = {
  // a cut on the beat, with a kick of the camera
  snede: { voor: 0, na: 0, kick: true, teken: (sc, a, b, p, lt) => shot(sc, p < 0.5 ? a : b, lt - sc.slots[p < 0.5 ? a : b].start) },
  flits: {
    voor: 0, na: 0.25,
    teken(sc, a, b, p, lt) {
      // a hard cut on the beat with a punch of light and a kick of the camera
      const u = lt - sc.slots[b].start;
      around(W / 2, H / 2, 1 + 0.12 * Math.exp(-u * 14), 0, () => shot(sc, b, u));
      rect(0, 0, W, H, '#FFFFFF', 0.85 * Math.exp(-u * 22));
    },
  },
  zweep: {
    voor: 0.22, na: 0.22,
    teken(sc, a, b, p, lt) {
      // a whip pan: the old shot smears off, the new one smears in
      const { oud, nieuw } = both(sc, a, b, lt);
      const dir = (a % 3 === 1) ? -1 : 1, cut = p < 0.5;
      const q = cut ? E.inCubic(p * 2) : 1 - E.outCubic((p - 0.5) * 2);
      const c = offscreen(2, cut ? oud : nieuw);
      const off = (cut ? -1 : 1) * dir * q * W * 0.7;
      ctx.save();
      for (let i = 0; i < 6; i++) { ctx.globalAlpha = i ? 0.22 : 1; ctx.drawImage(c, off - dir * i * q * 70, 0); }
      ctx.restore();
      ctx.save(); ctx.globalAlpha = q * 0.7;
      for (let i = 0; i < 26; i++) { const y = (i * 41 + hash(String(a)) % 40) % H; rect(0, y, W, 3 + (i % 3) * 3, '#FFFFFF', 0.25); }
      ctx.restore();
    },
  },
  iris: {
    voor: 0.45, na: 0.4,
    teken(sc, a, b, p, lt) {
      // the cartoon iris closes on the old shot and opens on the new one
      const cut = p < 0.53;
      const sa = sc.slots[a];
      const pl = plekVan(sa.it);
      const cx = cut ? pl.x - 20 : W / 2, cy = cut ? pl.y - pl.h * 0.6 : H / 2;
      const r = cut ? lerp(1300, 0, E.inCubic(clamp(p / 0.53))) : lerp(0, 1300, E.outCubic(clamp((p - 0.53) / 0.47)));
      rect(0, 0, W, H, C.ink);
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, Math.max(0.1, r), 0, TAU); ctx.clip();
      if (cut) shot(sc, a, lt - sa.start); else shot(sc, b, lt - sc.slots[b].start);
      ctx.restore();
      ring(cx, cy, r, C.sun, 14, r > 2 ? 1 : 0);
    },
  },
  wis: {
    voor: 0.35, na: 0.35,
    teken(sc, a, b, p, lt) {
      // a giant maatje runs across and leaves the next shot behind it
      const who = ['hond', 'kangoeroe', 'kip', 'nijlpaard', 'giraf'][b % 5];
      const x = lerp(W + 700, -700, E.inOutSine(p));
      const sa = sc.slots[a], sb = sc.slots[b];
      shot(sc, a, lt - sa.start);
      ctx.save(); ctx.beginPath(); ctx.rect(x, 0, W, H); ctx.clip(); shot(sc, b, lt - sb.start); ctx.restore();
      dier(who, x, H + 40, H * 1.25, { flip: true, pose: { poten: Math.floor(lt * 14) % 2 ? 'a' : 'b', ogen: 'blij', arm: 'op', vleugel: Math.floor(lt * 14) % 2 ? 'op' : 'neer' }, dy: -Math.abs(Math.sin(lt * 20)) * 30, schaduw: false });
      stof(x + 300, H - 40, lt, -1);
    },
  },
};

// ---------------------------------------------------------------- nog in de maak
function sVervolgd(lt, sc) {
  const beat = sc.beat, n = sc.maanden.length;
  // the open months rip past, one per beat, then the test card and the goldfish
  const fase1 = n * beat;
  if (lt < fase1) {
    const i = Math.floor(lt / beat), u = lt - i * beat;
    kalender({ beat: beat * 0.5 }, u, { m: sc.maanden[i], prev: i ? sc.maanden[i - 1] : sc.prevM, stempel: 'NOG IN DE MAAK', zoom: false, dier: 'goudvis' });
  } else {
    const u = lt - fase1;
    BEELD.testbeeld(u, { datum: sc.maanden.map(m => MND[m]).join(' · ') });
    // fast-forwarding on an old tape
    ctx.save(); ctx.globalAlpha = 0.5;
    for (let k = 0; k < 3; k++) { const y = ((u * 900 + k * 380) % (H + 200)) - 100; rect(0, y, W, 26 + k * 10, '#FFFFFF', 0.35); }
    ctx.restore();
    sticker('▶▶', 120, 200, { size: 110, shadow: C.ink, f: FL, alpha: Math.floor(u * 4) % 2 ? 1 : 0.4 });
    around(W / 2 - 200, 820, E.outPop(P(u, beat * 0.5, beat * 0.5 + 0.25)), -0.04, () => sticker('WORDT VERVOLGD', W / 2 - 200, 860, { size: 150, shadow: C.fire, align: 'center' }));
    // the goldfish in its bowl: every lap it sees the sign again, and is amazed again
    const bx = W - 330, by = 770, br = 220, pop = E.outPop(P(u, 0, 0.3));
    around(bx, by + br, pop, 0, () => {
      ctx.save(); ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.clip();
      rect(bx - br, by - br * 0.55, br * 2, br * 1.6, '#5FB6E8', 0.75);
      for (let k = 0; k < 5; k++) { const q = (u * 0.8 + k / 5) % 1; ring(bx - 80 + k * 40, by + br * 0.8 - q * br * 1.3, 6 + k % 3 * 3, '#FFFFFF', 3, 1 - q); }
      const a = u * TAU / (beat * 2), fx = bx + Math.cos(a) * 110, fy = by + 40 + Math.sin(a) * 50, links = Math.sin(a) > 0;
      dier('goudvis', fx, fy + 70, 150, { flip: links, schaduw: false, pose: { ogen: links && Math.sin(a) > 0.6 ? 'open' : 'blij' } });
      ctx.restore();
      ring(bx, by, br, '#DDF2FF', 10, 0.9); rect(bx - 130, by - br - 10, 260, 24, '#DDF2FF', 0.9);
      ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(bx, by, br - 30, -2.4, -1.8); ctx.stroke(); ctx.restore();
      const a2 = u * TAU / (beat * 2);
      if (Math.sin(a2) > 0.6) uitroep(bx + Math.cos(a2) * 110 - 20, by - 60, 1.1, C.sun);
    });
  }
}
