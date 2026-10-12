/*
 * The sketches: every headline is its own little cartoon, acted out by the maatjes,
 * with the headline worked into the scene: on a scoreboard, a claw machine, a karaoke
 * screen, a gas pump, a cake, a departure board, or as letters that topple, melt or
 * rain down. No two work the same way.
 *
 * A sketch is SCHETSEN[beeld](u, it): u runs from 0 to D seconds (the shot's length).
 * Its moments come from REEL.SCHETS in reel-data.js (in beats), so the sound hits the
 * same frames: tm(it) gives them in seconds.
 */
const SCHETSEN = {};
const tm = it => { const m = REEL.momenten(it), o = {}; for (const k in m) o[k] = m[k] * B; return o; };
const acteurVan = (it, fallback) => it.maatje || fallback;

// ---------------------------------------------------------------- helpers
// the small label: where and when
function chip(it, x = 56, y = 48, alpha = 1) {
  const t = (it.tag === 'NL' ? 'NEDERLAND' : 'DE WERELD') + ' · ' + it.datum.toUpperCase();
  const w = measure(t, font(FM, 20, 700), 3) + 36;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.beginPath(); ctx.roundRect(x, y, w, 40, 10); ctx.fillStyle = it.tag === 'NL' ? C.fire : C.blue; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke();
  txt(t, x + 18, y + 21, { f: FM, size: 20, weight: 700, color: C.paper, align: 'left', track: 3 });
  ctx.restore();
}
// a comic starburst
function burst(x, y, r1, r2, n, color, rot = 0, edge = C.ink) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n, r = i % 2 ? r1 : r2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = edge; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}
// a sound written out, comic style: it pops, shakes and goes
function boem(woord, x, y, g, o = {}) {
  if (g < 0 || g > (o.dur || 0.7)) return;
  const p = E.outPop(P(g, 0, 0.12)), a = 1 - P(g, (o.dur || 0.7) - 0.15, o.dur || 0.7);
  const size = o.size || 120;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate((o.rot || -0.12) + Math.sin(g * 40) * 0.03 * Math.exp(-g * 6)); ctx.scale(p, p);
  if (o.burst !== false) burst(0, -size * 0.35, size * 0.9, size * 1.35, 12, o.kleur || C.sun, g * 0.5);
  sticker(woord, 0, 0, { size, shadow: o.schaduw || C.fire, align: 'center' });
  ctx.restore();
}
// letters that do something: f(i, n) returns how letter i moves {x, y, rot, s, a, px, py}
// (px, py: the pivot, as a fraction of the letter: 0.5, 1 is the middle of its foot)
function letters(s, x, y, size, f, o = {}) {
  const fnt = font(o.f || FL, size), L = layout(s, fnt);
  const x0 = o.align === 'center' ? x - L.width / 2 : o.align === 'right' ? x - L.width : x;
  L.chars.forEach((c, i) => {
    if (c.ch === ' ') return;
    const m = f(i, L.chars.length, c) || {};
    if (m.a !== undefined && m.a <= 0) return;
    const px = x0 + c.x + c.w * (m.px !== undefined ? m.px : 0.5), py = y - size * 0.72 * (1 - (m.py !== undefined ? m.py : 1));
    ctx.save();
    ctx.translate(px + (m.x || 0), py + (m.y || 0)); if (m.rot) ctx.rotate(m.rot); if (m.s !== undefined) ctx.scale(m.s, m.sy !== undefined ? m.sy : m.s);
    ctx.translate(-px, -py);
    if (o.plain) txt(c.ch, x0 + c.x, y, { f: o.f || FL, size, color: m.kleur || o.kleur || C.paper, align: 'left', base: 'alphabetic', alpha: m.a !== undefined ? m.a : 1 });
    else sticker(c.ch, x0 + c.x, y, { size, shadow: m.schaduw || o.schaduw || C.fire, fill: m.kleur || o.kleur || C.paper, alpha: m.a !== undefined ? m.a : 1, f: o.f || FL });
    ctx.restore();
  });
}
// a headline on a panel, popping in word by word
function paneel(s, x, y, u, t0, o = {}) {
  const size = o.size || 78, fnt = font(FL, size), lines = balans(s.toUpperCase(), fnt, o.maxW || 1100), lh = size * 1.05;
  const w = Math.max(...lines.map(l => measure(l, fnt))) + 60, h = lines.length * lh + 34;
  const p = E.outBack(P(u, t0, t0 + 0.25));
  if (p <= 0) return;
  ctx.save();
  const ax = o.align === 'center' ? x - w / 2 : x, ay = y - h;
  ctx.translate(ax + w / 2, ay + h); ctx.rotate(o.tilt || 0); ctx.scale(1, p); ctx.translate(-(ax + w / 2), -(ay + h));
  ctx.beginPath(); ctx.roundRect(ax, ay, w, h, 18); ctx.fillStyle = o.bg || C.ink; ctx.fill();
  if (o.rand !== false) { ctx.lineWidth = 6; ctx.strokeStyle = o.rand || C.paper; ctx.stroke(); }
  let n = 0;
  lines.forEach((l, li) => {
    let xx = ax + 30;
    l.split(' ').forEach(wd => {
      const ti = t0 + 0.08 + n * 0.05; n++;
      const q = E.outPop(P(u, ti, ti + 0.18));
      const ww = measure(wd, fnt);
      if (q > 0) around(xx + ww / 2, ay + 22 + (li + 0.6) * lh, q, 0, () => txt(wd, xx, ay + 22 + (li + 0.85) * lh, { f: FL, size, color: o.kleur || C.paper, align: 'left', base: 'alphabetic' }));
      xx += ww + measure(' ', fnt);
    });
  });
  ctx.restore();
}
// motion lines behind something that flies
function snelheid(x, y, dx, dy, n, len, kleur = C.paper, a = 0.7) {
  const l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  ctx.save(); ctx.strokeStyle = kleur; ctx.globalAlpha *= a; ctx.lineCap = 'round';
  for (let k = 0; k < n; k++) { const o = (k - (n - 1) / 2) * 22; ctx.lineWidth = 6 - Math.abs(k - (n - 1) / 2) * 1.5; ctx.beginPath(); ctx.moveTo(x - ux * 40 - uy * o, y - uy * 40 + ux * o); ctx.lineTo(x - ux * (40 + len) - uy * o, y - uy * (40 + len) + ux * o); ctx.stroke(); }
  ctx.restore();
}
// a crown on an animal's head
function kroon(sleutel, x, y, h, flip, kleur = '#FF8A00') {
  const e = oogVan(sleutel, x, y, h, flip), s = h / 300;
  ctx.save(); ctx.translate(e.x - (flip ? -1 : 1) * 20 * s, e.y - 70 * s); ctx.scale(s, s);
  ctx.fillStyle = kleur; ctx.strokeStyle = C.ink; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-40, 20); ctx.lineTo(-40, -20); ctx.lineTo(-20, 0); ctx.lineTo(0, -30); ctx.lineTo(20, 0); ctx.lineTo(40, -20); ctx.lineTo(40, 20); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ================================================================ JANUARI
function dartbord(x, y, R) {
  circle(x, y, R * 1.12, '#111');
  for (let k = 0; k < 20; k++) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(k * TAU / 20 - Math.PI / 2 - Math.PI / 20);
    ctx.fillStyle = k % 2 ? '#F2ECE1' : '#141414'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, 0, TAU / 20); ctx.fill();
    ctx.fillStyle = k % 2 ? C.fire : '#1E7A3C';
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU / 20); ctx.arc(0, 0, R * 0.92, TAU / 20, 0, true); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, R * 0.6, 0, TAU / 20); ctx.arc(0, 0, R * 0.53, TAU / 20, 0, true); ctx.fill();
    ctx.restore();
  }
  circle(x, y, R * 0.1, '#1E7A3C'); circle(x, y, R * 0.045, C.fire);
}
function pijl(x, y, s, rot, kleur) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  line(-150, 0, 0, 0, '#C8C8D0', 10); rect(-70, -9, 50, 18, '#555');
  poly([[-150, 0], [-205, -30], [-188, 0], [-205, 30]], kleur);
  ctx.restore();
}
// the dart cam: thrown, followed all the way in, then two more and 180
SCHETSEN.darts = (u, it) => {
  const m = tm(it);
  vgrad(0, H, [[0, '#07070B'], [1, '#1B1230']]);
  const fly = P(u, m.gooi, m.raak), back = E.outExpo(P(u, m.raak + 0.1, m.twee - 0.02));
  const z = u < m.raak ? E.inCubic(fly) : 1 - back;
  const bx = lerp(1450, W / 2, z), by = lerp(420, H / 2 - 40, z), R = lerp(170, 1250, z);
  beam(bx - 520, -40, -0.72, 900, 220, 'rgba(255,230,190,A)', 0.16 * (1 - z));
  beam(bx + 520, -40, 0.72, 900, 220, 'rgba(255,230,190,A)', 0.16 * (1 - z));
  rgrad(bx, by, 0, R * 1.8, [[0, 'rgba(255,220,170,0.3)'], [1, 'rgba(255,220,170,0)']], 'lighter');
  const wob = u > m.raak ? Math.sin((u - m.raak) * 50) * 10 * Math.exp(-(u - m.raak) * 9) : 0;
  dartbord(bx + wob, by, R);
  // the darts that hit, all in the treble twenty
  [[m.raak, 0, C.blue], [m.twee, 0.07, C.fire], [m.drie, -0.06, C.lime]].forEach(([t0, dx, kl]) => {
    if (u < t0) return;
    const shake = Math.sin((u - t0) * 60) * 0.1 * Math.exp(-(u - t0) * 8);
    pijl(bx + wob + dx * R, by - 0.565 * R, R / 600, -0.5 + shake, kl);
  });
  // the egel throws: wind-up, release
  const zt = 1 - z;
  if (u > m.score) {
    crowd(930, '#05050A', 3, u, { n: 30, hands: true, bounce: 34 });
    acteur(acteurVan(it, 'egel'), 'juich', u - m.score, 360, 1010, 440, { t0: 1 });
  } else if (zt > 0.05) {
    const wind = P(u, 0, m.gooi), rel = P(u, m.gooi, m.gooi + 0.15);
    dier(acteurVan(it, 'egel'), 330, 980, 380 * (0.8 + 0.2 * zt), { pose: { ogen: u > m.gooi ? 'blij' : 'open', arm: rel > 0 ? 'op' : 'neer' }, rot: -0.15 * wind + 0.25 * rel, alpha: zt });
  }
  // the dart in flight, seen from behind
  if (u >= m.gooi && u < m.raak) {
    const q = E.inCubic(fly);
    const x = lerp(470, W / 2, q), y = lerp(760, H / 2 - 40 - 0.565 * R, q);
    snelheid(x, y, 1, -0.4, 5, 260 * (1 - q), C.paper, 0.6);
    pijl(x, y, lerp(1.5, 0.9, q), -0.35, C.blue);
  }
  boem('TOK!', W / 2 + 260, 250, u - m.raak, { size: 120, kleur: C.sun });
  // the scoreboard counts up, then 180
  const score = u < m.raak ? 0 : u < m.twee ? 60 : u < m.drie ? 120 : 180;
  const sp = E.outBack(P(u, m.raak, m.raak + 0.2));
  if (sp > 0) {
    ctx.save(); ctx.translate(W - 330, 880); ctx.scale(sp, sp);
    ctx.beginPath(); ctx.roundRect(-200, -110, 400, 220, 24); ctx.fillStyle = C.ink; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.sun; ctx.stroke();
    txt('SCORE', 0, -70, { f: FM, size: 26, weight: 700, color: C.sun, track: 8 });
    txt(String(score), 0, 60, { f: FD, size: 160, color: score === 180 ? C.fire : C.paper, base: 'alphabetic' });
    ctx.restore();
  }
  if (u > m.score) {
    const g = u - m.score, bx2 = 820, by2 = 560;
    around(bx2, by2, E.outPop(P(g, 0, 0.2)) * (1 + 0.08 * beatPulse(g, 9)), -0.1 + Math.sin(g * 4) * 0.04, () => { burst(bx2, by2 - 80, 190, 290, 14, C.sun, g); sticker('180!', bx2, by2 + 20, { size: 200, shadow: C.fire, align: 'center' }); });
    flashes(u, 7, 14);
    confetti(u, 18, 80 * P(g, 0, 0.3), [C.fire, C.sun, C.paper], 260);
  }
  paneel(it.kop, 70, 300, u, m.raak + 0.05, { size: 70, maxW: 1000, bg: C.ink, rand: C.fire });
  chip(it);
};

// the restorer scrubs the varnish off in three swipes; the painted guards turn to look
SCHETSEN.nachtwacht = (u, it) => {
  const m = tm(it);
  rect(0, 0, W, H, '#3A2418');
  for (let x = 0; x < W; x += 120) rect(x, 0, 60, H, '#43291C');
  const x0 = 170, y0 = 90, fw = 1580, fh = 700;
  const pan = Math.sin(u * 0.8) * 20;
  ctx.save(); ctx.translate(pan, 0);
  rect(x0 - 44, y0 - 44, fw + 88, fh + 88, '#8A6A2E'); rect(x0 - 26, y0 - 26, fw + 52, fh + 52, '#C9A24E');
  rect(x0, y0, fw, fh, '#211A10');
  // the painting: figures in warm light
  const look = E.outBack(P(u, m.glans - 0.2, m.glans + 0.1));
  const figs = rng(1642);
  for (let i = 0; i < 24; i++) {
    const x = x0 + 90 + figs() * (fw - 180), y = y0 + 200 + figs() * (fh - 300), s = 34 + figs() * 46, warm = figs() < 0.3;
    ctx.fillStyle = warm ? '#E8C27A' : '#4A3826'; ctx.beginPath(); ctx.ellipse(x, y + s * 1.6, s * 0.8, s * 1.8, 0, 0, TAU); ctx.fill();
    circle(x, y, s * 0.55, warm ? '#F3D9A4' : '#5A4630');
    if (figs() < 0.35) line(x + s, y + s * 3, x + s * 1.8, y - s * 3, '#6B5536', 6);
    // their eyes: they look at the raccoon once it is clean
    const ex = lerp(0, 0.18, look) * s;
    circle(x - s * 0.18 + ex, y - s * 0.05, s * 0.09, '#FFFFFF'); circle(x + s * 0.18 + ex, y - s * 0.05, s * 0.09, '#FFFFFF');
    circle(x - s * 0.18 + ex * 1.3, y - s * 0.05, s * 0.045, '#000'); circle(x + s * 0.18 + ex * 1.3, y - s * 0.05, s * 0.045, '#000');
  }
  rgrad(x0 + fw * 0.55, y0 + fh * 0.55, 20, 380, [[0, 'rgba(255,214,140,0.45)'], [1, 'rgba(255,214,140,0)']], 'lighter');
  // the varnish, gone in three swipes
  const swipes = [m.v1, m.v2, m.v3].map(t => E.inOutCubic(P(u, t - 0.12, t + 0.12)));
  const clean = x0 + fw * (swipes[0] + swipes[1] + swipes[2]) / 3;
  ctx.save(); clipRect(clean, y0, x0 + fw - clean, fh); rect(x0, y0, fw, fh, '#7A5A12', 0.6); rect(x0, y0, fw, fh, '#3A2A08', 0.25); ctx.restore();
  if (clean < x0 + fw - 2) { line(clean, y0, clean, y0 + fh, '#FFF3D0', 5, 0.8); }
  // the raccoon on its lift, riding along the clean edge
  const rx = Math.min(x0 + fw - 120, clean + 40), ry = y0 + fh - 30;
  rect(rx - 140, ry + 10, 300, 18, '#9BA3AD');
  for (const xx of [rx - 120, rx + 140]) line(xx, ry + 28, xx, H, '#9BA3AD', 7);
  line(rx - 120, ry + 28, rx + 140, H, '#9BA3AD', 4); line(rx + 140, ry + 28, rx - 120, H, '#9BA3AD', 4);
  const scrub = swipes.some((s, k) => s > 0 && s < 1);
  acteur(acteurVan(it, 'wasbeer'), scrub ? 'poets' : 'juich', u, rx, ry + 10, 260, { flip: false, t0: 1 });
  if (u > m.glans) { const g = u - m.glans; for (let k = 0; k < 5; k++) pixelStar(x0 + 200 + k * 300, y0 + 120 + (k % 2) * 300, 10 + 8 * Math.sin(g * 12 + k), '#FFFFFF', g * 3 + k); }
  ctx.restore();
  // the museum plaque
  const pp = E.outBack(P(u, 0.1, 0.4));
  ctx.save(); ctx.translate(0, (1 - pp) * 200);
  const lines = balans(it.kop.toUpperCase(), font(FL, 56), 820);
  const pw = 900, ph = 40 + lines.length * 62;
  ctx.beginPath(); ctx.roundRect(W / 2 - pw / 2 + pan, H - ph - 40, pw, ph, 10); ctx.fillStyle = '#C9A24E'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#6B5020'; ctx.stroke();
  lines.forEach((l, i) => txt(l, W / 2 + pan, H - ph - 40 + 70 + i * 62, { f: FL, size: 56, color: '#3A2808', base: 'alphabetic' }));
  ctx.restore();
  chip(it);
};

// the claw machine: the claw comes down for Greenland, the camera goes in with it,
// the seal holds up its sign, the island slips and lands with a splash on the glass
SCHETSEN.groenland = (u, it) => {
  const m = tm(it);
  const cx = W / 2 + 40;
  const down = E.inOutCubic(P(u, m.zak, m.grijp)), up = E.inOutCubic(P(u, m.op, m.glip));
  const holding = u >= m.grijp && u < m.glip;
  const lift = holding ? 380 * up : u >= m.glip ? Math.max(0, 380 * (1 - E.inCubic(P(u, m.glip, m.plons)))) : 0;
  const isY = 760 - lift;
  // the camera: in with the claw, up with the island, a jolt on the splash
  const zoom = 1 + 0.45 * down - 0.2 * P(u, m.plons, m.plons + 0.4);
  const fy = lerp(H / 2, isY - 200, down);
  const jolt = u >= m.plons ? Math.sin((u - m.plons) * 70) * 18 * Math.exp(-(u - m.plons) * 8) : 0;
  ctx.save(); ctx.translate(W / 2, H / 2 + jolt); ctx.scale(zoom, zoom); ctx.translate(-cx, -fy);
  // the arctic, inside the machine
  vgrad(-400, 700, [[0, '#0E1B3A'], [0.6, '#35507F'], [1, '#B9CFE6']]);
  for (let k = 0; k < 3; k++) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.2; ctx.strokeStyle = k === 1 ? '#6DFFB4' : '#4AE0C8'; ctx.lineWidth = 50 - k * 10; ctx.beginPath(); for (let x = -400; x <= W + 400; x += 40) ctx.lineTo(x, 100 + k * 50 + Math.sin(x / 260 + u * 0.9 + k) * 50); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.fillStyle = '#1E3E66'; ctx.fillRect(-400, 680, W + 800, 800); ctx.restore();
  // the island with the seal on it
  ctx.save(); ctx.translate(cx, isY); ctx.rotate(holding ? Math.sin(u * 14) * 0.04 : 0);
  poly([[-330, 0], [-210, -170], [-90, -250], [60, -170], [330, 0]], '#EAF4FB');
  poly([[-90, -250], [60, -170], [330, 0], [40, 0]], '#A8C7DF');
  poly([[-300, 0], [300, 0], [170, 80], [-200, 70]], '#7FB2D6', 0.5);
  const sx = 130, sy = -150, sk = acteurVan(it, 'zeehond');
  dier(sk, sx, sy, 250, { flip: true, pose: { ogen: holding ? 'open' : 'blij', blos: !holding, arm: 'op' }, rot: holding ? Math.sin(u * 30) * 0.12 : 0 });
  if (holding) druppels(sx, sy - 200, u, 4);
  const sg = E.outPop(P(u, m.grijp - 0.1, m.grijp + 0.15));
  if (sg > 0) {
    ctx.save(); ctx.translate(sx - 170, sy - 130); ctx.rotate(-0.1 + Math.sin(u * 20) * 0.1 * (holding ? 1 : 0.2)); ctx.scale(sg, sg);
    line(0, 0, 0, 170, '#8A6A3A', 12);
    ctx.beginPath(); ctx.roundRect(-170, -130, 340, 140, 10); ctx.fillStyle = '#E2C08A'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = '#6B4A22'; ctx.stroke();
    txt('NIET', 0, -80, { f: FL, size: 56, color: C.fire }); txt('TE KOOP!', 0, -26, { f: FL, size: 56, color: C.fire });
    ctx.restore();
  }
  ctx.restore();
  if (u >= m.plons) { const g = u - m.plons; for (let k = 0; k < 24; k++) { const a = -Math.PI / 2 + (k / 23 - 0.5) * 2.6, d = 520 * E.outCubic(P(g, 0, 0.5)); circle(cx + Math.cos(a) * d, 760 + Math.sin(a) * d * 0.8 + g * g * 700, 18 - k % 3 * 4, '#CFE8FF', 1 - P(g, 0.35, 0.7)); } }
  // the claw itself
  const clawY = 40 + 470 * down - 380 * up;
  const cy2 = holding ? isY - 250 : clawY;
  const open = holding ? 0.15 : u < m.grijp ? 0.6 : 0.6 * E.outBack(P(u, m.glip, m.glip + 0.2));
  line(cx, -600, cx, cy2 - 40, '#9AA3AE', 6);
  ctx.save(); ctx.translate(cx, cy2);
  rect(-50, -60, 100, 50, '#C9CED6'); ctx.lineCap = 'round';
  [-1, 1].forEach(sd => { ctx.save(); ctx.rotate(sd * open); ctx.strokeStyle = '#C9CED6'; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(sd * 30, -15); ctx.lineTo(sd * 90, 60); ctx.lineTo(sd * 60, 120); ctx.stroke(); ctx.restore(); });
  ctx.restore();
  if (u >= m.glip && u < m.glip + 0.6) txt('?!', cx + 130, cy2 - 40, { f: FL, size: 100, color: C.sun });
  ctx.restore();
  // the machine: glass, chrome, the marquee in light bulbs; water drops on the glass
  ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#FFFFFF'; for (let k = 0; k < 3; k++) { const x = 300 + k * 520; ctx.beginPath(); ctx.moveTo(x, 200); ctx.lineTo(x + 140, 200); ctx.lineTo(x - 160, H); ctx.lineTo(x - 300, H); ctx.fill(); } ctx.restore();
  if (u >= m.plons) { const g = u - m.plons, r = rng(808); for (let k = 0; k < 26; k++) { const x = 120 + r() * (W - 240), y0 = 260 + r() * 700, sz = 10 + r() * 22, d = E.outPop(P(g, 0.05 + r() * 0.1, 0.25 + r() * 0.1)); if (d <= 0) continue; const y = y0 + Math.max(0, g - 0.4) * (60 + r() * 140); circle(x, y, sz * d, '#E6F4FF', 0.55); circle(x - sz * 0.3, y - sz * 0.3, sz * 0.3 * d, '#FFFFFF', 0.8); } }
  rect(0, 0, 80, H, '#B6BCC6'); rect(W - 80, 0, 80, H, '#B6BCC6'); rect(0, 0, W, 170, '#C0262D');
  for (let k = 0; k < 40; k++) circle(60 + k * 46, 22, 9, (Math.floor(u / (B / 2)) + k) % 2 ? '#FFE9A0' : '#7A4A10');
  for (let k = 0; k < 40; k++) circle(60 + k * 46, 150, 9, (Math.floor(u / (B / 2)) + k + 1) % 2 ? '#FFE9A0' : '#7A4A10');
  const kop = it.kop.toUpperCase();
  letters(kop, W / 2, 125, 96, (i) => ({ s: E.outPop(P(u, i * 0.025, i * 0.025 + 0.2)), kleur: (Math.floor(u / (B / 2)) + i) % 4 === 0 ? C.sun : C.paper }), { align: 'center', schaduw: '#7A1015' });
  chip(it, 100, 196);
};

// ================================================================ FEBRUARI
// a note, for singing
function noot(x, y, s, kleur) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = kleur;
  ctx.beginPath(); ctx.ellipse(0, 0, 14, 10, -0.4, 0, TAU); ctx.fill(); ctx.fillRect(10, -46, 6, 46); ctx.fillRect(10, -46, 22, 8);
  ctx.restore();
}
// one singer in its own little screen: on stage, in the shower, in the car, on the couch, in the bath
const ZANGERS = ['kikker', 'kip', 'hond', 'pinguin', 'aap', 'nijlpaard', 'lama', 'octopus', 'uil', 'konijn', 'giraf', 'zeehond', 'kameel', 'flamingo', 'egel', 'wasbeer', 'eenhoorn', 'hamster', 'kangoeroe', 'papegaai', 'luiaard', 'krokodil', 'eekhoorn', 'das', 'dolfijn', 'goudvis', 'bij', 'vlinder', 'kreeft', 'slak', 'worm'];
const VAKKLEUR = ['#3A1030', '#2F4BFF', '#8FC3EA', '#7B4BFF', '#3DDC97', '#FF6F91', '#FFD23F', '#00A6A6', '#E85D04'];
function zanger(i, x, y, w, h, u, feest) {
  if (w < 12 || h < 12) return;
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(w, h) * 0.06); ctx.clip();
  const decor = i % 5, bg = VAKKLEUR[i % VAKKLEUR.length], s = h / 900;
  rect(x, y, w, h, feest && Math.floor(u / (B / 2) + i) % 2 ? mix(bg, '#FFFFFF', 0.3) : bg);
  if (decor === 0) { rect(x, y, w, h, '#3A1030'); beam(x + w / 2, y - 10, Math.sin(u * 3 + i) * 0.2, h * 1.2, w * 0.4, 'rgba(255,220,150,A)', 0.35); rect(x, y + h * 0.9, w, h * 0.1, '#26182E'); }
  if (decor === 1) { for (let k = 1; k < 8; k++) { line(x + k * w / 8, y, x + k * w / 8, y + h, '#FFFFFF', 3, 0.3); line(x, y + k * h / 8, x + w, y + k * h / 8, '#FFFFFF', 3, 0.3); } circle(x + w * 0.8, y + h * 0.12, 40 * s * 2, '#C9CED6'); for (let k = 0; k < 8; k++) { const q = (u * 3 + k / 8) % 1; line(x + w * (0.72 + k * 0.02), y + h * (0.15 + q * 0.7), x + w * (0.72 + k * 0.02) - 10 * s, y + h * (0.22 + q * 0.7), '#DDF2FF', 6 * s * 2, 1 - q); } }
  if (decor === 2) { for (let k = 0; k < 4; k++) { const q = (u * 2 + k / 4) % 1; line(x + w * (1 - q), y + h * (0.3 + k * 0.08), x + w * (1 - q) - w * 0.2, y + h * (0.3 + k * 0.08), '#FFFFFF', 8 * s * 2, 0.5); } }
  if (decor === 3) { rect(x + w * 0.08, y + h * 0.2, w * 0.05, h * 0.65, '#5A3A22'); circle(x + w * 0.105, y + h * 0.2, w * 0.08, '#FFE9A0'); rect(x + w * 0.1, y + h * 0.66, w * 0.8, h * 0.3, '#B5652B'); }
  // the singer, on the beat
  const k = ZANGERS[i % ZANGERS.length], ah = h * (decor === 0 ? 0.74 : 0.66), ax = x + w / 2, ay = y + h * (decor === 4 ? 0.98 : 0.94);
  const nb = Math.floor(u / B + i * 0.5), sw = (nb % 2 ? 1 : -1) * 0.1 * Math.sin(Math.PI * fase(u));
  const sprong = feest ? hop(u + i * 0.03) * ah * 0.35 : hop(u) * ah * 0.06;
  dier(k, ax, ay - sprong, ah, { flip: i % 2 === 1, rot: sw, sy: 1 - 0.1 * beatPulse(u, 12), sx: 1 + 0.08 * beatPulse(u, 12), schaduw: false, pose: { ogen: 'blij', blos: true, arm: nb % 2 ? 'op' : 'neer', vleugel: nb % 2 ? 'op' : 'neer' } });
  if (decor === 0) { line(ax + ah * 0.42, ay, ax + ah * 0.42, ay - ah * 0.7, '#888', Math.max(3, 8 * s)); circle(ax + ah * 0.42, ay - ah * 0.72, ah * 0.05, '#333'); }
  if (decor === 2) { rect(x, y + h * 0.78, w, h * 0.22, '#2A2A30'); ring(ax - w * 0.08, y + h * 0.82, h * 0.16, '#111', Math.max(4, 22 * s)); }
  if (decor === 4) { ctx.save(); ctx.beginPath(); ctx.roundRect(x + w * 0.1, y + h * 0.62, w * 0.8, h * 0.34, h * 0.08); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore(); for (let b = 0; b < 7; b++) circle(x + w * (0.15 + b * 0.12), y + h * 0.63 + Math.sin(b * 2 + u * 4) * 6 * s, h * 0.06, '#FFFFFF'); }
  // notes floating up
  for (let n = 0; n < 2; n++) { const q = (u * 0.9 + n * 0.5 + i * 0.13) % 1; noot(ax + (n ? 1 : -1) * ah * 0.5 + Math.sin(q * 7) * 10 * s, y + h * (0.55 - q * 0.45), Math.max(0.4, 2.2 * s), 'rgba(255,255,255,' + (Math.sin(Math.PI * q) * 0.9).toFixed(2) + ')'); }
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(w, h) * 0.06); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.restore();
}
// one frog sings; on every word the screen splits: 4 of us, 9, 16, then the whole country
SCHETSEN.concert = (u, it) => {
  const m = tm(it);
  const top = H - 190, lv = [[0, 1], [m.w1, 2], [m.w2, 3], [m.w3, 4], [m.juich, 6]];
  let li = 0; for (let k = 0; k < lv.length; k++) if (u >= lv[k][0]) li = k;
  const n = lv[li][1], vorig = li ? lv[li - 1][1] : 1, g = u - lv[li][0], tr = E.outBack(P(g, 0, 0.2));
  const vak = (i, n) => [(i % n) * W / n, Math.floor(i / n) * top / n, W / n, top / n];
  rect(0, 0, W, H, C.ink);
  for (let i = n * n - 1; i >= 0; i--) {
    let [x, y, w, h] = vak(i, n);
    if (li > 0 && i < vorig * vorig) { const [x0, y0, w0, h0] = vak(i, vorig); x = lerp(x0, x, tr); y = lerp(y0, y, tr); w = lerp(w0, w, tr); h = lerp(h0, h, tr); }
    else if (li > 0) { const p = E.outPop(P(g, i * 0.008, i * 0.008 + 0.2)); if (p <= 0) continue; x += w * (1 - p) / 2; y += h * (1 - p) / 2; w *= p; h *= p; }
    zanger(i, x + 5, y + 5, w - 10, h - 10, u, li === 4);
  }
  // the karaoke line, the ball bouncing from word to word
  rect(0, top, W, H - top, C.ink);
  const words = it.kop.toUpperCase().split(' '), wt = [m.w0, m.w1, m.w2, m.w3];
  const fnt0 = font(FL, 100), sp0 = measure(' ', fnt0), tot0 = words.reduce((s, w) => s + measure(w, fnt0), 0) + sp0 * (words.length - 1);
  const size = Math.min(100, 100 * 1780 / tot0), fnt = font(FL, size), sp = measure(' ', fnt);
  const tot = words.reduce((s, w) => s + measure(w, fnt), 0) + sp * (words.length - 1);
  let x = W / 2 - tot / 2; const y = H - 52;
  const xs = [];
  words.forEach((w, i) => {
    const ww = measure(w, fnt), t0 = wt[Math.min(i, 3)] + (i > 3 ? (i - 3) * 0.2 : 0);
    xs.push([x, ww, t0]);
    const fill = P(u, t0, t0 + B * 0.8);
    sticker(w, x, y, { size, shadow: '#333', fill: C.paper });
    if (fill > 0) { ctx.save(); clipRect(x - 10, y - size, (ww + 20) * fill, size * 1.4); sticker(w, x, y, { size, shadow: '#333', fill: C.sun }); ctx.restore(); }
    x += ww + sp;
  });
  const k = Math.max(0, Math.min(words.length - 1, xs.findIndex(([, , t0], i) => u < (xs[i + 1] ? xs[i + 1][2] : 1e9))));
  const [bx, bw, bt] = xs[k], nxt = xs[k + 1] || [bx + bw, 0, bt + B];
  const q = clamp((u - bt) / Math.max(0.01, nxt[2] - bt));
  circle(lerp(bx + bw / 2, nxt[0] + (nxt[1] || 0) / 2, q), y - size - 18 - Math.sin(Math.PI * q) * 60, 20, C.fire);
  if (li < 4) chip(it, 40, 30);
};

// the fire horse gallops through; the unicorn can't keep up
SCHETSEN.vuurpaard = (u, it) => {
  vgrad(0, H, [[0, '#1A0306'], [1, '#4A0A0A']]);
  // lanterns rushing past
  for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) {
    const x = ((i * 300 + row * 150 - u * (700 + row * 300)) % (W + 300) + W + 300) % (W + 300) - 150, y = 120 + row * 130 + Math.sin(u * 3 + i) * 8;
    line(x, 0, x, y - 40, '#8A5A2A', 2);
    rgrad(x, y, 0, 110, [[0, 'rgba(255,90,40,0.4)'], [1, 'rgba(255,90,40,0)']], 'lighter');
    ctx.fillStyle = '#D81E1E'; ctx.beginPath(); ctx.ellipse(x, y, 40, 50, 0, 0, TAU); ctx.fill();
    rect(x - 24, y - 56, 48, 10, '#E8B84A'); rect(x - 24, y + 46, 48, 10, '#E8B84A');
  }
  rect(0, 880, W, 200, '#2A0606');
  for (let k = 0; k < 12; k++) { const x = ((k * 200 - u * 1400) % (W + 200) + W + 200) % (W + 200) - 100; rect(x, 900, 80, 8, '#5A1010'); }
  // the horse: a burning chess knight, galloping on the beat
  const run = P(u, 0, D);
  const hx = lerp(W + 350, -450, run), hy = 760 - Math.abs(Math.sin(Math.PI * u / (B / 2))) * 70;
  const head = [[-150, 330], [-150, 180], [-90, 60], [-120, -20], [-60, -150], [20, -210], [60, -250], [80, -190], [150, -130], [230, -40], [250, 30], [200, 70], [110, 40], [60, 90], [90, 330]];
  const r = rng(1966);
  for (let i = 0; i < 70; i++) { const per = 0.5 + r() * 0.4, q = ((u + r()) % per) / per; circle(hx + 150 + q * 400 + r() * 60, hy - 120 + r() * 300 - q * 80, (22 + r() * 20) * (1 - q), q < 0.4 ? '#FFD27A' : C.fire, 0.8 * (1 - q)); }
  ctx.save(); ctx.translate(hx, hy - 120); ctx.scale(-1, 1); ctx.rotate(Math.sin(Math.PI * u / (B / 2)) * 0.08);
  const g = ctx.createLinearGradient(0, 330, 0, -250); g.addColorStop(0, '#8E0E06'); g.addColorStop(0.5, C.fire); g.addColorStop(1, '#FFD27A');
  ctx.fillStyle = g; ctx.beginPath(); head.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
  circle(120, -100, 12, '#1A0306');
  ctx.restore();
  // the unicorn, panting behind
  const ux = hx + 700 + Math.sin(u * 3) * 30;
  if (ux < W + 300) {
    acteur(acteurVan(it, 'eenhoorn'), 'paniek', u, ux, 900, 260, { flip: true, t0: 3, pose: { poten: Math.floor(u * 14) % 2 ? 'a' : 'b' } });
    druppels(ux, 640, u, 4);
  }
  // the banner unrolls from the top
  const roll = E.outCubic(P(u, 0.1, 0.6));
  const kop = it.kop.toUpperCase(), lines = balans(kop, font(FL, 80), 1100);
  const bw = 1240, bh = (40 + lines.length * 88) * roll;
  ctx.save(); ctx.translate(W / 2, 40);
  rect(-bw / 2 - 30, -10, bw + 60, 26, '#8A5A2A');
  ctx.beginPath(); ctx.rect(-bw / 2, 0, bw, bh); ctx.fillStyle = '#C81E1E'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#E8B84A'; ctx.stroke();
  ctx.save(); clipRect(-bw / 2, 0, bw, bh);
  lines.forEach((l, i) => txt(l, 0, 104 + i * 88, { f: FL, size: 80, color: '#FFD27A', base: 'alphabetic' }));
  ctx.restore();
  rect(-bw / 2 - 20, bh - 6, bw + 40, 22, '#8A5A2A');
  ctx.restore();
  chip(it, 56, 960);
};

// serious: no gag; a slow, quiet push in
SCHETSEN.iran = (u, it) => {
  rect(0, 0, W, H, '#0C0C10');
  around(W / 2, H / 2, 1 + 0.05 * (u / D), 0, () => {
    globe(W / 2, H * 0.42, 420, 25 - u * 3, 0.45, '#8A8A96', 0.7);
    const p = (u * 0.6) % 1;
    ring(W / 2 + 40, H * 0.42 - 60, 30 + p * 140, '#C0392B', 3, 0.7 * (1 - p));
    circle(W / 2 + 40, H * 0.42 - 60, 8, '#C0392B');
  });
  const a = P(u, 0.2, 0.7);
  txt(it.kop.toUpperCase(), W / 2, H - 270, { f: FS, size: 128, weight: 700, color: C.paper, alpha: a });
  balans(it.sub, font(FS, 36, 500), 1400).forEach((l, i) => txt(l, W / 2, H - 165 + i * 48, { f: FS, size: 36, weight: 500, color: C.paper, alpha: a * 0.75 }));
  txt((it.tag === 'NL' ? 'NEDERLAND' : 'DE WERELD') + ' · ' + it.datum.toUpperCase(), W / 2, 110, { f: FM, size: 22, weight: 700, color: C.paper, track: 8, alpha: a * 0.6 });
};

// ================================================================ MAART
// the election chart: the local bar grows and breaks through the top
SCHETSEN.stemmen = (u, it) => {
  const m = tm(it);
  vgrad(0, H, [[0, '#F4EEE2'], [1, '#E2D6BE']]);
  const x0 = 260, y0 = 300, cw = 1400, ch = 600, base = y0 + ch;
  line(x0, base, x0 + cw, base, C.ink, 6);
  // the frame the bar breaks through
  const door = u >= m.door, dg = u - m.door;
  ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.strokeRect(x0, y0, cw, ch); ctx.restore();
  const bars = [['LOKAAL', 1.2, C.fire], ['B', 0.32, '#9AA3AD'], ['C', 0.24, '#9AA3AD'], ['D', 0.18, '#9AA3AD'], ['E', 0.1, '#9AA3AD']];
  bars.forEach(([lbl, v, kl], i) => {
    const bw = 200, bx = x0 + 80 + i * 260;
    const steps = Math.min(4, Math.floor(P(u, m.groei, m.door) * 4 + (u >= m.groei ? 1 : 0)));
    const grow = i === 0 ? (u < m.door ? lerp(0, 0.92, steps / 4) : 0.92 + E.outBack(P(u, m.door, m.door + 0.25)) * 0.5) : v * E.outBack(P(u, 0.05 + i * 0.05, 0.3 + i * 0.05));
    const bh = ch * grow;
    rect(bx, base - bh, bw, bh, kl);
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.strokeRect(bx, base - bh, bw, bh); ctx.restore();
    if (i === 0) txt(lbl, bx + bw / 2, base + 50, { f: FL, size: 46, color: C.ink });
    else txt('ANDEREN', bx + bw / 2, base + 46, { f: FM, size: 18, weight: 700, color: C.ink, alpha: 0.5, track: 3 });
  });
  if (door) {
    // cracks in the top of the chart
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 4;
    const cx = x0 + 180;
    for (let k = 0; k < 7; k++) { const a = -Math.PI + k * Math.PI / 6; ctx.beginPath(); ctx.moveTo(cx, y0); ctx.lineTo(cx + Math.cos(a) * 140 * E.outExpo(P(dg, 0, 0.15)), y0 + Math.sin(a) * 90 * E.outExpo(P(dg, 0, 0.15))); ctx.stroke(); }
    ctx.restore();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k - 4.5) * 0.25; rect(x0 + 180 + Math.cos(a) * dg * 900, y0 + Math.sin(a) * dg * 700 + dg * dg * 1200, 20, 14, '#FFFFFF'); }
    boem('KRAK!', x0 + 560, y0 + 120, dg, { size: 110 });
  }
  // the octopus stuffs ballots into the bar with eight arms
  const ox = x0 + 80 + 100 - 260, oy = base;
  acteur(acteurVan(it, 'octopus'), 'zwaai', u, ox + 120, oy + 120, 260, { flip: false, t0: 4 });
  const r = rng(77);
  for (let k = 0; k < 8; k++) { const t0 = 0.1 + k * B / 4 + r() * 0.1, q = P(u, t0, t0 + 0.4); if (q <= 0 || q >= 1) continue; const bx = lerp(ox + 160, x0 + 180, q), by = lerp(oy - 60, y0 + ch * (1 - Math.min(0.9, u / D)), q) - Math.sin(Math.PI * q) * 160; ctx.save(); ctx.translate(bx, by); ctx.rotate(q * 6); rect(-30, -20, 60, 40, '#FFFDF3'); txt('X', 10, 2, { f: FL, size: 24, color: C.fire }); ctx.restore(); }
  // the chart's title is the headline
  txt('GEMEENTERAADSVERKIEZINGEN · ' + it.datum.toUpperCase(), W / 2, 70, { f: FM, size: 24, weight: 700, color: C.ink, track: 6, alpha: 0.6 });
  letters(it.kop.toUpperCase(), W / 2, 190, 100, i => ({ s: E.outPop(P(u, i * 0.02, i * 0.02 + 0.2)) }), { align: 'center', schaduw: C.fire });
};

// the old name peels off, the new one slaps on
SCHETSEN.pro = (u, it) => {
  const m = tm(it);
  vgrad(0, H, [[0, '#0F2A1A'], [1, '#07120C']]);
  for (let i = 0; i < 6; i++) beam(260 + i * 280, -20, Math.sin(u + i) * 0.3, 1100, 170, 'rgba(120,255,170,A)', 0.1);
  // the wall sign
  const sx = W / 2 - 700, sy = 260, sw = 1400, sh = 320;
  rect(sx, sy, sw, sh, '#1E6B3A');
  ctx.save(); ctx.strokeStyle = '#0B2A16'; ctx.lineWidth = 10; ctx.strokeRect(sx, sy, sw, sh); ctx.restore();
  const peel = E.inOutCubic(P(u, m.trek, m.trek + 0.5));
  if (peel < 1) {
    // the old label curls off from the right corner and flies away
    ctx.save();
    ctx.translate(sx + sw - 40, sy + 40); ctx.rotate(-peel * 1.2); ctx.translate(peel * 700, -peel * 500); ctx.scale(1 - peel * 0.4, 1 - peel * 0.4); ctx.translate(-(sx + sw - 40), -(sy + 40));
    rect(sx + 30, sy + 30, sw - 60, sh - 60, '#F2ECE1');
    txt('GROENLINKS–PVDA', W / 2, sy + sh / 2 + 10, { f: FD, size: 160, color: '#1E6B3A' });
    ctx.restore();
  }
  txt('HEET VOORTAAN', W / 2, sy - 40, { f: FL, size: 64, color: C.paper, alpha: P(u, m.trek + 0.3, m.trek + 0.5) });
  const pl = E.outPop(P(u, m.plak, m.plak + 0.18));
  if (pl > 0) {
    around(W / 2, sy + sh / 2, (2.2 - 1.2 * pl), -0.04 * pl, () => {
      ctx.save(); ctx.globalAlpha = Math.min(1, pl * 2);
      burst(W / 2 + 330, sy + sh / 2 - 20, 70, 110, 10, '#4FD27F', u);
      sticker('PRO', W / 2 - 40, sy + sh / 2 + 110, { size: 330, shadow: '#0B2A16', align: 'center', fill: '#FFFFFF' });
      ctx.restore();
    });
    // the green rose
    const bloom = E.outPop(P(u, m.plak + 0.1, m.plak + 0.4));
    ctx.save(); ctx.translate(W / 2 + 330, sy + sh / 2 - 20); ctx.scale(bloom * 0.6, bloom * 0.6);
    for (let r2 = 3; r2 >= 0; r2--) { const n = 5 + r2, rr = 30 + r2 * 32, c = ['#7CF0A4', '#4FD27F', '#2FB060', '#1E8A48'][r2]; for (let k = 0; k < n; k++) { ctx.save(); ctx.rotate(k * TAU / n + r2 * 0.5 + u * 0.3); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -rr * 0.7, rr * 0.55, rr * 0.8, 0, 0, TAU); ctx.fill(); ctx.restore(); } }
    ctx.restore();
    if (u - m.plak < 0.4) for (let k = 0; k < 12; k++) { const a = k * TAU / 12, d = 600 * E.outExpo(P(u - m.plak, 0, 0.3)); circle(W / 2 + Math.cos(a) * d, sy + sh / 2 + Math.sin(a) * d * 0.5, 10, '#FFFFFF', 1 - P(u - m.plak, 0.1, 0.4)); }
  }
  // the parrot grabs the corner and pulls, then says the new name, over and over
  const pk = acteurVan(it, 'papegaai');
  const px = peel < 1 ? lerp(W + 200, sx + sw - 40, E.outCubic(P(u, 0, m.trek))) + peel * 700 : lerp(W + 200, W - 330, E.outCubic(P(u, m.plak, m.plak + 0.3)));
  const py = peel < 1 ? sy + 40 - peel * 500 + 240 : 860;
  dier(pk, px, py, 240, { flip: true, pose: { vleugel: Math.floor(u * 16) % 2 ? 'op' : 'neer', ogen: u > m.plak ? 'blij' : 'open' }, rot: peel > 0 && peel < 1 ? -0.4 : 0, schaduw: false });
  if (it.zegt && u > m.plak + 0.3) ballon(it.zegt, px - 20, py - 240, u - m.plak - 0.3, { side: 1 });
  chip(it);
};

// a little car, side on, facing left, with an open roof: (x, y) the middle of its wheels' feet
function autootje(x, y, s, wiel, kleur = '#D9342B') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  const pad = () => { ctx.beginPath(); ctx.moveTo(-270, -60); ctx.lineTo(-250, -150); ctx.lineTo(-150, -160); ctx.lineTo(-110, -150); ctx.lineTo(160, -150); ctx.lineTo(250, -130); ctx.lineTo(270, -60); ctx.closePath(); };
  pad(); ctx.fillStyle = kleur; ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.stroke();
  rect(-262, -110, 30, 26, '#FFE9A0'); rect(236, -112, 26, 22, '#C0101A');
  line(-20, -150, -20, -70, C.ink, 6); rect(-6, -116, 40, 10, C.ink);
  for (const wx of [-170, 160]) {
    circle(wx, -50, 58, C.ink); circle(wx, -50, 30, '#C9CED6');
    ctx.save(); ctx.translate(wx, -50); ctx.rotate(wiel); line(-28, 0, 28, 0, C.ink, 6); line(0, -28, 0, 28, C.ink, 6); ctx.restore();
  }
  ctx.restore();
}
// the price runs away: three crash zooms (the price, the camel's face, the price),
// and then the camel just carries its car home
SCHETSEN.tanker = (u, it) => {
  const m = tm(it);
  const pxm = 520, top = 150, disp = [pxm, top + 290];
  const kk = acteurVan(it, 'kameel');
  // the car rolls in; later the camel carries it off on its humps
  const rij = E.outBack(P(u, 0, m.stop));
  const uit = u >= m.schrik, til = E.outBack(P(u, m.til, m.til + 0.25)), loop = P(u, m.weg, D);
  const carX0 = lerp(W + 400, 1240, rij), wiel = (1 - rij) * -14;
  const kx = uit ? lerp(1240, 1560, E.outCubic(P(u, m.schrik, m.schrik + 0.3))) + loop * 900 : carX0;
  const ky = 1000, kh = 380;
  const sprong = uit && u < m.til ? Math.sin(Math.PI * P(u, m.schrik, m.schrik + 0.3)) * 260 : 0;
  // the euros on the display
  const run = P(u, m.tank, m.schrik);
  const euro = Math.floor(2.1 + Math.pow(run, 2.2) * 999990);
  // the camera: crash zoom on the price, on the camel's face, on the price again
  const eye = oogVan(kk, carX0 - 10, ky - 50, kh, true);
  let zoom = 1, focus = [W / 2, H / 2];
  if (u >= m.z1 && u < m.schrik) {
    const z = u >= m.z3 ? [4.2, disp] : u >= m.z2 ? [3.2, [eye.x, eye.y + 30]] : [2.1, disp];
    const since = u - (u >= m.z3 ? m.z3 : u >= m.z2 ? m.z2 : m.z1);
    zoom = z[0] * (1 + 0.08 * Math.exp(-since * 25)); focus = z[1];
  }
  const shake = u >= m.z1 && u < m.schrik ? Math.sin(u * 95) * 6 * Math.exp(-((u - m.z1) % (m.z2 - m.z1)) * 12) : 0;
  ctx.save();
  ctx.translate(W / 2 + shake, H / 2); ctx.scale(zoom, zoom); ctx.translate(-focus[0], -focus[1]);
  // the strait at sunset, a tanker stuck behind the barrier
  vgrad(0, 560, [[0, '#2C0F12'], [0.6, '#C24A1C'], [1, '#FF9B4A']]);
  circle(1500, 430, 110, '#FFD39A');
  vgrad(540, H, [[0, '#5A2014'], [1, '#12060A']]);
  const tx = 900 + u * 10;
  poly([[tx, 560], [tx + 700, 560], [tx + 740, 525], [tx + 760, 525], [tx + 720, 590], [tx + 30, 590]], '#140808');
  rect(tx + 40, 470, 110, 90, '#140808');
  for (let k = 0; k < 14; k++) rect(40 + k * 136, 640, 110, 22, k % 2 ? C.paper : C.fire);
  rect(0, 700, W, H - 700, '#3A2420'); rect(0, 700, W, 10, '#5A3A30');
  // the pump
  ctx.save(); ctx.beginPath(); ctx.roundRect(pxm - 230, top, 460, 760, 30); ctx.fillStyle = '#C8261E'; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.restore();
  rect(pxm - 230, top + 100, 460, 14, C.ink);
  letters('HORMUZ DICHT', pxm, top + 82, 60, i => ({ s: E.outPop(P(u, 0.05 + i * 0.02, 0.25 + i * 0.02)), schaduw: C.ink }), { align: 'center' });
  rect(pxm - 190, top + 150, 380, 260, '#0E1A12');
  txt('TE BETALEN', pxm, top + 190, { f: FM, size: 22, weight: 700, color: '#7CFF9A', track: 4 });
  const val = '€ ' + nl(euro);
  const fs = Math.min(110, 360 / (measure(val, font(FM, 100, 700)) / 100));
  txt(val, pxm, top + 290, { f: FM, size: fs, weight: 700, color: run > 0.8 ? C.fire : '#7CFF9A' });
  txt('LITER  0,02', pxm, top + 370, { f: FM, size: 28, weight: 700, color: '#7CFF9A', alpha: 0.7 });
  if (u >= m.z3) for (let k = 0; k < 8; k++) { const q = ((u - m.z3) * 2.5 + k / 8) % 1; txt('€', pxm - 170 + k * 48, top + 330 + q * 140 + q * q * 200, { f: FL, size: 44, color: C.sun, alpha: 1 - q }); }
  rect(pxm - 190, top + 460, 380, 300, '#2A2A30');
  txt('TANKEN', pxm, top + 560, { f: FL, size: 70, color: C.paper });
  txt('ONBETAALBAAR', pxm, top + 650, { f: FL, size: 62, color: C.sun });
  // the hose: into the car, then dropped
  const hoseEnd = uit ? [900, 1000] : [carX0 - 250, 880];
  ctx.save(); ctx.strokeStyle = '#1A1A1A'; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(pxm + 230, top + 500); ctx.quadraticCurveTo((pxm + 230 + hoseEnd[0]) / 2, 1010, hoseEnd[0], hoseEnd[1]); ctx.stroke(); ctx.restore();
  // camel and car
  const stap = Math.floor(u * 9) % 2 ? 'a' : 'b';
  if (!uit) {
    dier(kk, carX0 - 10, ky - 50 + Math.sin(u * 40) * 3 * (1 - rij), kh, { flip: true, schaduw: false, pose: { ogen: u >= m.z2 ? 'open' : 'blij', blos: u < m.z2 } });
    autootje(carX0, ky, 1, wiel);
    if (u < m.stop) stof(carX0 + 300, ky - 20, u, -1);
    if (u >= m.z2) druppels(eye.x, eye.y - 40, u, 3);
  } else {
    // out it jumps; then the car goes up onto its back
    const carY = til > 0 ? lerp(ky, ky - kh * 0.78, til) : ky, carX = til > 0 ? lerp(1240, kx, til) : 1240;
    dier(kk, kx, ky - sprong, kh, { flip: true, pose: { ogen: u < m.til ? 'open' : 'dicht', poten: loop > 0 ? stap : 'rust' }, rot: loop > 0 ? Math.sin(u * 18) * 0.04 : 0 });
    autootje(carX, carY + (loop > 0 ? Math.abs(Math.sin(u * 18)) * -10 : 0), til > 0 ? lerp(1, 0.7, til) : 1, 0);
    if (u < m.til) uitroep(kx - 60, ky - kh - sprong - 40, 1.3, C.fire);
    if (loop > 0) { druppels(kx - 80, ky - kh * 0.9, u, 3); stof(kx + 180, ky - 10, u, -1); }
  }
  ctx.restore();
  if (u >= m.z1 && u < m.schrik) rect(0, 0, W, H, '#FFFFFF', 0.6 * Math.exp(-((u - m.z1) % (m.z2 - m.z1)) * 30));
  chip(it, 56, 48);
};
