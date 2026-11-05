/*
 * The sketches, July to December (see schetsen.js for how they work).
 */

// ================================================================ JULI
// a tractor seen from the front: big wheels, a grille, headlights
function trekkerVoor(x, y, s, kleur, toeter) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (const sd of [-1, 1]) {
    ctx.fillStyle = '#161616'; ctx.beginPath(); ctx.roundRect(sd * 230 - 70, -330, 140, 330, 40); ctx.fill();
    for (let k = 0; k < 8; k++) rect(sd * 230 - 70, -320 + k * 40, 140, 10, '#2A2A2A');
  }
  rect(-150, -420, 300, 200, kleur); rect(-120, -400, 240, 120, '#9FD3E6', 0.85);
  rect(-180, -230, 360, 150, kleur);
  rect(-110, -210, 220, 110, '#222'); for (let k = 0; k < 6; k++) rect(-100, -200 + k * 18, 200, 8, '#555');
  circle(-150, -150, 30, toeter ? '#FFFFFF' : '#FFE9A0'); circle(150, -150, 30, toeter ? '#FFFFFF' : '#FFE9A0');
  rect(110, -520, 18, 110, '#333');
  rect(-60, -80, 120, 40, '#333');
  ctx.restore();
}
// the tractors roll toward the camera under a motorway sign
SCHETSEN.trekkers = (u, it) => {
  const hz = 430;
  vgrad(0, hz, [[0, '#6E8FB5'], [1, '#F5C49A']]);
  vgrad(hz, H, [[0, '#4F7A2E'], [1, '#2F5A1E']]);
  // the road in perspective, the lines rushing at us
  poly([[W / 2 - 40, hz], [W / 2 + 40, hz], [W + 500, H], [-500, H]], '#4A4F55');
  for (let k = 0; k < 10; k++) { const q = ((k / 10 + u * 0.9) % 1), z = q * q, y = lerp(hz, H, z), w = lerp(2, 30, z), l = lerp(4, 110, z); rect(W / 2 - w / 2, y, w, l, '#F2ECE1', 0.9); }
  for (let k = 0; k < 7; k++) { const q = ((k / 7 + u * 0.5) % 1), z = q * q, y = lerp(hz, H, z); for (const sd of [-1, 1]) { const x = W / 2 + sd * lerp(60, 1300, z); rect(x - 4 * (1 + z * 6), y - lerp(10, 220, z), 8 * (1 + z * 6), lerp(10, 220, z), '#D9D2C2'); } }
  // the tractors, one after another; the last one fills the frame
  const cols = ['#1F7A3A', '#C8261E', '#E5A21A', '#1C5FB8'];
  for (let i = 3; i >= 0; i--) {
    const q = clamp(u / D * 1.05 - (3 - i) * 0.12 + 0.2), z = Math.pow(q, 2.6);
    const s = lerp(0.04, 2.6, z), x = W / 2 + (i % 2 ? -1 : 1) * lerp(10, 120, z) * (i === 0 ? 0 : 1), y = lerp(hz + 10, H + 280, z) + Math.sin(u * 20 + i) * 3 * z;
    if (q <= 0) continue;
    const honk = Math.floor(u / (B * 0.5)) % 3 === 0;
    trekkerVoor(x, y, s, cols[i], i === 0 && honk);
    if (i === 0) {
      const ck = acteurVan(it, 'kip');
      dier(ck, x, y - 520 * s, 260 * s, { pose: { vleugel: Math.floor(u * 14) % 2 ? 'op' : 'neer', ogen: 'open' }, rot: Math.sin(u * 25) * 0.08, schaduw: false });
      if (honk && s > 0.6) boem('TOET!', x + 340 * s, y - 640 * s, (u % (B * 1.5)), { size: 90, dur: 0.35, kleur: C.sun });
    }
  }
  // the overhead sign
  const kop = it.kop.toUpperCase(), sw = Math.max(900, measure(kop, font(FL, 74)) + 120);
  rect(W / 2 - sw / 2 - 20, 0, 16, 150, '#888'); rect(W / 2 + sw / 2 + 4, 0, 16, 150, '#888');
  ctx.save(); ctx.beginPath(); ctx.roundRect(W / 2 - sw / 2, 120, sw, 210, 14); ctx.fillStyle = '#1C4FA0'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#FFFFFF'; ctx.stroke(); ctx.restore();
  txt('DEN HAAG  ·  KOEKAMP  ↑', W / 2, 172, { f: FS, size: 40, weight: 700, color: '#FFFFFF' });
  letters(kop, W / 2, 290, 74, i => ({ s: E.outPop(P(u, 0.1 + i * 0.02, 0.3 + i * 0.02)) }), { align: 'center', plain: true, kleur: '#FFFFFF' });
  chip(it, 56, 360);
};

// the bouquet goes up, time slows at the top, the flamingo leaps and catches it
SCHETSEN.bruiloft = (u, it) => {
  const m = tm(it);
  rect(0, 0, W, H, '#10060F');
  rgrad(W / 2, 360, 0, 1000, [[0, 'rgba(255,120,180,0.35)'], [1, 'rgba(255,120,180,0)']]);
  for (let i = 0; i < 5; i++) beam(W / 2 + (i - 2) * 380, -20, Math.sin(u + i) * 0.3, 1100, 150, 'rgba(255,200,230,A)', 0.14);
  const t = P(u, m.gooi, m.vang), slow = t < 0.5 ? 0.5 * Math.pow(2 * t, 0.45) : 1 - 0.5 * Math.pow(2 - 2 * t, 0.45);
  const vx = lerp(260, W * 0.62, slow), vy = 420 - Math.sin(Math.PI * slow) * 330;
  const zoom = 1 + 0.55 * Math.sin(Math.PI * clamp(t)) * (u < m.vang ? 1 : 0);
  ctx.save(); ctx.translate(vx, vy); ctx.scale(zoom, zoom); ctx.translate(-vx, -vy);
  // an arch of flowers
  ctx.save(); ctx.strokeStyle = '#3A6B3A'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(W / 2, 760, 700, Math.PI, 0); ctx.stroke(); ctx.restore();
  for (let k = 0; k <= 24; k++) { const a = Math.PI + k * Math.PI / 24; circle(W / 2 + Math.cos(a) * 700, 760 + Math.sin(a) * 700, 30, ['#FFC1DA', '#FFFFFF', '#FF7FB0'][k % 3]); }
  // the crowd jumps for it; the flamingo goes highest
  const fk = acteurVan(it, 'flamingo');
  const gang = ['kip', 'lama', 'konijn', 'pinguin', fk, 'aap', 'eenhoorn'];
  gang.forEach((k, i) => {
    const x = 280 + i * 240, isF = k === fk;
    const reach = u > m.gooi + 0.3 && u < m.vang + 0.2;
    const j = isF ? Math.sin(Math.PI * P(u, m.vang - 0.35, m.vang + 0.35)) * 330 : reach ? Math.abs(Math.sin(Math.PI * (u / (B * 0.6) + i * 0.3))) * 90 : 0;
    dier(k, x, 1010 - j, 290, { flip: x > W * 0.68, pose: { arm: reach ? 'op' : 'neer', vleugel: reach ? 'op' : 'neer', ogen: u > m.vang ? (isF ? 'blij' : 'dicht') : 'open', blos: isF && u > m.vang } });
  });
  // the bouquet
  const caught = u >= m.vang;
  const fx = 280 + 4 * 240, fy = 1010 - Math.sin(Math.PI * P(u, m.vang - 0.35, m.vang + 0.35)) * 330 - 300;
  const bqx = caught ? fx + 40 : vx, bqy = caught ? fy : vy;
  if (u >= m.gooi || u < m.gooi) {
    if (!caught && t > 0) for (let k = 1; k < 8; k++) { const tk = clamp(t - k * 0.03), sk = tk < 0.5 ? 0.5 * Math.pow(2 * tk, 0.45) : 1 - 0.5 * Math.pow(2 - 2 * tk, 0.45); pixelStar(lerp(260, W * 0.62, sk), 420 - Math.sin(Math.PI * sk) * 330, 8 - k * 0.8, '#FFFFFF', u * 4 + k); }
    ctx.save(); ctx.translate(bqx, bqy); ctx.rotate(caught ? 0.2 : u * 6); ctx.scale(1.6, 1.6);
    poly([[-20, 0], [20, 0], [8, 80], [-8, 80]], '#3A6B3A');
    for (let k = 0; k < 7; k++) circle(Math.cos(k) * 30, -10 + Math.sin(k * 1.7) * 20, 24, ['#FFFFFF', '#FFC1DA', '#FF7FB0'][k % 3]);
    ctx.restore();
  }
  if (t > 0.35 && t < 0.65) { ctx.save(); ctx.globalAlpha = 0.15; rect(0, 0, W, H, '#FFFFFF'); ctx.restore(); txt('SLOW-MO', W - 200, 140, { f: FM, size: 28, weight: 700, color: C.paper, track: 6, alpha: 0.7 }); }
  if (caught) { hartjes(fx, fy - 40, u - m.vang, 8); confetti(u, 13, 90, ['#FFC1DA', '#FFFFFF', '#E8C95A', '#FF7FB0'], 140); }
  ctx.restore();
  // the invitation card
  const cp = E.outBack(P(u, 0.1, 0.4));
  ctx.save(); ctx.translate(70, 60); ctx.rotate(-0.04); ctx.scale(cp, cp);
  ctx.beginPath(); ctx.roundRect(0, 0, 760, 220, 16); ctx.fillStyle = '#FFFDF7'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#E8C95A'; ctx.stroke();
  txt('U BENT UITGENODIGD', 380, 50, { f: FM, size: 20, weight: 700, color: '#B8932E', track: 6 });
  txt(it.kop.toUpperCase(), 380, 140, { f: FL, size: 76, color: '#E0457B' });
  txt('3 JULI · NEW YORK', 380, 190, { f: FM, size: 18, weight: 700, color: '#B8932E', track: 6 });
  ctx.restore();
};

// a cake with 250 candles; the monkey swings in and blows them out; fireworks
SCHETSEN.amerika = (u, it) => {
  const m = tm(it);
  vgrad(0, H, [[0, '#050A24'], [1, '#141C44']]);
  starsBg(250, 120, 0.6, u);
  if (u > m.boem) {
    const r = rng(1776);
    for (let i = 0; i < 8; i++) {
      const t0 = m.boem + r() * 0.6, fx = 150 + r() * 1620, fy = 120 + r() * 320, k = u - t0, c = ['#E0162B', '#FFFFFF', '#3C5BFF'][i % 3];
      if (k < 0 || k > 1.6) continue;
      for (let sp = 0; sp < 44; sp++) { const a = sp * TAU / 44, d = 220 * E.outExpo(k); line(fx + Math.cos(a) * d * 0.7, fy + Math.sin(a) * d * 0.7 + k * k * 30, fx + Math.cos(a) * d, fy + Math.sin(a) * d + k * k * 40, c, 4, 1 - k / 1.6); }
    }
  }
  // the cake, close up
  ctx.save(); const zc = 1.3 + 0.08 * (u / D); ctx.translate(W / 2, 1060); ctx.scale(zc, zc); ctx.translate(-W / 2, -1060);
  const cx = W / 2, base = 1000;
  const tiers = [[760, 220, '#FFFFFF'], [600, 180, '#E0162B'], [440, 160, '#FFFFFF']];
  let y = base;
  tiers.forEach(([w, h, c], i) => {
    y -= h;
    ctx.save(); ctx.beginPath(); ctx.roundRect(cx - w / 2, y, w, h, 20); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.restore();
    for (let k = 0; k < w / 50; k++) { const dx = cx - w / 2 + 25 + k * 50; ctx.fillStyle = i === 1 ? '#FFFFFF' : '#3C5BFF'; ctx.beginPath(); ctx.ellipse(dx, y + 6, 22, 14 + (k % 3) * 8, 0, 0, Math.PI); ctx.fill(); }
  });
  const kop = it.kop.toUpperCase();
  letters(kop, cx, base - 220 - 70, 84, i => ({ s: E.outPop(P(u, 0.05 + i * 0.02, 0.25 + i * 0.02)) }), { align: 'center', schaduw: '#7A0A14' });
  // the candles light up in a wave, then go out in a gust
  const topY = y, n = 25, count = Math.round(250 * E.outCubic(P(u, m.aan, m.aan + B)));
  for (let k = 0; k < n; k++) {
    const x = cx - 200 + k * (400 / (n - 1)), lit = k < count / 10, out = u > m.blaas + k * 0.012;
    rect(x - 5, topY - 60, 10, 60, k % 2 ? '#E0162B' : '#3C5BFF');
    if (lit && !out) { const f = 1 + 0.2 * Math.sin(u * 30 + k); ctx.fillStyle = '#FFC46B'; ctx.beginPath(); ctx.ellipse(x, topY - 76, 8 * f, 16 * f, 0, 0, TAU); ctx.fill(); rgrad(x, topY - 76, 0, 50, [[0, 'rgba(255,190,100,0.35)'], [1, 'rgba(255,190,100,0)']], 'lighter'); }
    if (out && u < m.blaas + 0.8) { const g = u - m.blaas; ctx.save(); ctx.globalAlpha = 0.5 * (1 - g / 0.8); ctx.strokeStyle = '#CCC'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, topY - 70); ctx.quadraticCurveTo(x + 20, topY - 110 - g * 60, x + 40 * Math.sin(g * 6), topY - 150 - g * 100); ctx.stroke(); ctx.restore(); }
  }
  txt(String(count), cx, topY - 140, { f: FD, size: 90, color: C.sun, alpha: P(u, m.aan, m.aan + 0.1) * (1 - P(u, m.blaas, m.blaas + 0.2)) });
  ctx.restore();
  // the monkey swings in on a vine and blows
  const sw = E.outCubic(P(u, m.blaas - B * 0.75, m.blaas));
  if (sw > 0) {
    const ax = lerp(W + 200, cx + 470, sw), ay = 440;
    line(ax + 140, -10, ax + 20, ay - 120, '#3E7B2C', 10);
    dier(acteurVan(it, 'aap'), ax, ay, 320, { flip: true, rot: lerp(0.5, 0, sw), pose: { ogen: 'dicht', arm: 'op' }, schaduw: false });
    if (u > m.blaas) { const g = u - m.blaas; ctx.save(); ctx.strokeStyle = '#DDEBFF'; ctx.lineWidth = 6; ctx.globalAlpha = 0.8 * (1 - P(g, 0.3, 0.6)); for (let k = 0; k < 4; k++) { const o = ((g * 3 + k / 4) % 1); ctx.beginPath(); ctx.moveTo(ax - 130 - o * 400, ay - 120 + (k - 1.5) * 25); ctx.lineTo(ax - 230 - o * 400, ay - 120 + (k - 1.5) * 25); ctx.stroke(); } ctx.restore(); }
  }
  chip(it);
};

// ================================================================ AUGUSTUS
// the eclipse: the lights go out letter by letter, the owl's eyes come on
SCHETSEN.zon = (u, it) => {
  const m = tm(it);
  BEELD.zon(u, it);
  const S = { x: W / 2, y: 380, r: 200 };
  const mp = E.outQuart(P(u, 0.1, m.nacht));
  const cov = clamp(1 - Math.hypot(-820 * (1 - mp), 30 * (1 - mp)) / (2 * S.r)), dark = Math.pow(cov, 2.2);
  // the rooster thinks it's night and goes to sleep; the owl thinks it's night and gets up to party
  const kx = 200, ky = 880, kh = 300, slaapt = dark > 0.6;
  if (slaapt) acteur('kip', 'slaap', u, kx, ky, kh, { t0: 1 });
  else dier('kip', kx, ky - hop(u) * 20, kh, { pose: { ogen: 'open', vleugel: Math.floor(u / B) % 2 ? 'op' : 'neer' }, schaduw: false });
  if (dark > 0.3 && !slaapt) { const e = oogVan('kip', kx, ky, kh, false); txt('?', e.x + 40, e.y - 90, { f: FL, size: 80, color: C.sun }); }
  const ok = acteurVan(it, 'uil'), ox = 1740, oy = 880, oh = 320;
  if (u >= m.nacht) acteur(ok, 'dans', u - m.nacht, ox, oy, oh, { flip: true, pose: { ogen: 'open' } });
  else if (dark > 0.6) dier(ok, ox, oy, oh, { flip: true, pose: { ogen: 'open' }, schaduw: false });
  else { dier(ok, ox, oy, oh, { flip: true, pose: { ogen: 'dicht' }, schaduw: false, sy: 1 + 0.03 * Math.sin(u * 3) }); zzz(ox - 60, oy - oh * 0.8, u, 1); }
  if (dark > 0.4) { const e = oogVan(ok, ox, oy, oh, true), a = P(dark, 0.4, 0.9); for (const dx of [-30, 22]) rgrad(e.x + dx, e.y, 0, 110, [[0, `rgba(255,220,60,${0.8 * a})`], [1, 'rgba(255,220,60,0)']], 'lighter'); }
  // the headline: the letters go out as the moon comes in, then light up as neon
  const kop = it.kop.toUpperCase(), n = kop.length, neon = u >= m.nacht;
  letters(kop, W / 2, 1010, 110, (i) => {
    const off = dark * n * 1.1 > i;
    if (neon) return { kleur: '#0B0B12', schaduw: C.sun, s: 1 + 0.05 * beatPulse(u - m.nacht, 8) };
    return { kleur: off ? '#1A1A26' : C.paper, schaduw: off ? '#0B0B12' : C.blue, s: E.outPop(P(u, i * 0.02, i * 0.02 + 0.2)) };
  }, { align: 'center' });
  if (neon) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = C.sun; ctx.shadowBlur = 30; txt(kop, W / 2, 1010 - 110 * 0.36, { f: FL, size: 110, color: 'rgba(255,210,63,0.35)' }); ctx.restore(); }
  chip(it);
};

// gold rain: the medals fall from the sky, the kangaroo collects them over the hurdles
SCHETSEN.atletiek = (u, it) => {
  const m = tm(it);
  vgrad(0, H, [[0, '#050814'], [0.45, '#10204A'], [1, '#07091A']]);
  for (let row = 0; row < 4; row++) { const r = rng(row + 90); for (let i = 0; i < 50; i++) { const x = i * 40 + (row % 2) * 20, b = Math.abs(Math.sin(Math.PI * u / B + i * 0.2 + row)) * 8; circle(x, 250 + row * 30 - b, 12, r() < 0.55 ? '#FF7A00' : r() < 0.8 ? '#F2ECE1' : '#21468B', 0.75); } }
  const hz = 400;
  poly([[-400, H], [W + 400, H], [W * 0.62, hz], [W * 0.38, hz]], '#B8452A');
  for (let k = 0; k <= 8; k++) line(lerp(W * 0.38, W * 0.62, k / 8), hz, lerp(-400, W + 400, k / 8), H, '#F2ECE1', 3, 0.6);
  // the hurdles and the kangaroo
  const hx = [W * 0.38, W * 0.7], hy = 920;
  hx.forEach(x => { rect(x - 110, hy - 150, 220, 18, '#FFFFFF'); line(x - 100, hy - 132, x - 100, hy, '#FFFFFF', 10); line(x + 100, hy - 132, x + 100, hy, '#FFFFFF', 10); });
  const kk = acteurVan(it, 'kangoeroe'), run = P(u, 0, D);
  const kx = lerp(-150, W + 150, run);
  const jump = Math.max(...[m.h1, m.h2].map(t => Math.sin(Math.PI * P(u, t - 0.3, t + 0.3))));
  const medals = (u > m.h1 ? 1 : 0) + (u > m.h2 ? 1 : 0) + (u > (m.h1 + m.h2) / 2 ? 1 : 0);
  dier(kk, kx, hy + 30 - jump * 330 - hop(u * 2) * 30, 300, { pose: { ogen: 'blij', blos: true, arm: jump > 0.2 ? 'op' : 'neer', poten: jump > 0.1 ? 'a' : Math.floor(u * 10) % 2 ? 'a' : 'b' }, rot: -0.2 * jump });
  for (let k = 0; k < medals; k++) { const mx = kx + 40 + k * 26, my = hy + 30 - jump * 330 - 140 + k * 10; line(mx, my - 50, mx, my, '#FF7A00', 6); circle(mx, my + 14, 20, '#FFD23F'); ring(mx, my + 14, 20, '#B8860B', 4); }
  // the gold rain
  const r = rng(92);
  for (let k = 0; k < 46; k++) {
    const x = r() * W, sp = 700 + r() * 500, t0 = r() * D;
    const y = -80 + (u - t0) * sp;
    if (y < -80 || u < t0) continue;
    const yy = Math.min(y, 1040 - (k % 4) * 12), landed = y > 1040 - (k % 4) * 12;
    ctx.save(); ctx.translate(x, yy); ctx.rotate(landed ? 1.2 : u * 6 + k); ctx.scale(landed ? 1 : Math.cos(u * 9 + k), 1);
    line(0, -50, 0, -10, '#FF7A00', 6); circle(0, 10, 22, '#FFD23F'); ring(0, 10, 22, '#B8860B', 4);
    ctx.restore();
  }
  // and the headline comes down in gold
  letters(it.kop.toUpperCase(), W / 2, 200, 104, (i) => { const t0 = 0.05 + i * 0.03, q = P(u, t0, t0 + 0.45); return { y: -700 * (1 - E.outBounce(q)), a: q > 0 ? 1 : 0, kleur: '#FFD23F', schaduw: '#8A5A00' }; }, { align: 'center' });
  chip(it, 56, 960);
};

// a desk fan, at (x, y) its foot: blades at hoek, blur 0..1, kantel 0 (three quarters,
// blowing to the right) to 1 (facing up, like a helicopter)
function ventilator(x, y, s, hoek, blur, kantel) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.ellipse(0, 0, 120, 30, 0, 0, TAU); ctx.fillStyle = '#2A6FDB'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.fillStyle = '#C9CED6'; ctx.fillRect(-14, -240, 28, 230); ctx.strokeRect(-14, -240, 28, 230);
  ctx.translate(0, -270); ctx.scale(lerp(0.62, 1, kantel), lerp(1, 0.3, kantel));
  circle(0, 0, 172, '#E8F2FF', 0.35);
  if (blur > 0.3) circle(0, 0, 150, '#9EC9FF', 0.55 * blur);
  for (let k = 0; k < 3; k++) {
    ctx.save(); ctx.rotate(hoek + k * TAU / 3); ctx.globalAlpha *= 1 - 0.75 * blur;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(40, -40, 150, -70, 152, 0); ctx.bezierCurveTo(150, 50, 60, 40, 0, 0);
    ctx.fillStyle = '#7FB8FF'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.restore();
  }
  ring(0, 0, 172, '#4A5260', 10); ring(0, 0, 112, '#4A5260', 4);
  for (let k = 0; k < 16; k++) { const a = k * TAU / 16; line(Math.cos(a) * 40, Math.sin(a) * 40, Math.cos(a) * 172, Math.sin(a) * 172, '#4A5260', 3); }
  circle(0, 0, 36, '#2A6FDB'); ring(0, 0, 36, C.ink, 6);
  ctx.restore();
}
// it's so hot that the fan goes one, two, MAX, and then flies off by itself
SCHETSEN.zomer = (u, it) => {
  const m = tm(it);
  const toeren = t => t < m.k1 ? 2.5 : t < m.k2 ? 7 : t < m.k3 ? 12 : 22;
  let hoek = 0; for (let t = 0; t < u; t += 1 / 240) hoek += TAU * toeren(t) / 240;
  const los = u >= m.los, g = u - m.los;
  const wind = (los ? 1 - P(g, 0.15, 0.6) : 1) * (toeren(u) + toeren(u - 0.04) + toeren(u - 0.08)) / 66;
  // the heat: a sunburst wall that turns, shimmer rising off the floor
  rect(0, 0, W, H, '#FFAA33');
  ctx.save(); ctx.translate(W / 2, 330); ctx.rotate(u * 0.3); ctx.fillStyle = '#FFC75A';
  for (let k = 0; k < 14; k++) { ctx.rotate(TAU / 14); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1700, -200); ctx.lineTo(1700, 200); ctx.fill(); }
  ctx.restore();
  rgrad(W / 2, 330, 0, 500, [[0, 'rgba(255,250,220,0.8)'], [1, 'rgba(255,250,220,0)']]);
  rect(0, 960, W, H - 960, '#B9502A'); rect(0, 960, W, 10, '#8E3A1C');
  ctx.save(); ctx.globalAlpha = 0.25; ctx.strokeStyle = '#FFF2C0'; ctx.lineWidth = 4;
  for (let k = 0; k < 7; k++) { const x0 = 140 + k * 280; ctx.beginPath(); for (let s = 0; s <= 12; s++) ctx.lineTo(x0 + Math.sin(s * 0.9 + u * 9 + k) * 12, 960 - ((s * 40 + u * 260) % 520)); ctx.stroke(); }
  ctx.restore();
  // the side table and the socket
  rect(440, 900, 500, 26, '#7A4A2A'); rect(470, 926, 24, 40, '#5A3418'); rect(886, 926, 24, 40, '#5A3418');
  ctx.save(); ctx.beginPath(); ctx.roundRect(40, 880, 70, 76, 10); ctx.fillStyle = C.paper; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.restore();
  circle(62, 918, 6, C.ink); circle(88, 918, 6, C.ink);
  // the fan: rattles across the table on MAX, then tilts up and takes off
  const ratel = u >= m.k3 && !los ? 1 : 0;
  const loop = P(u, m.k3, m.los) * 60;
  const kantel = los ? E.outBack(P(g, 0, 0.22)) : 0;
  const op = los ? E.inCubic(P(g, 0.1, 0.95)) : 0;
  const fx = 690 + loop + (los ? g * 380 + Math.sin(g * 10) * 40 * P(g, 0.1, 0.4) : 0) + ratel * Math.sin(u * 90) * 5;
  const fy = 900 - op * 1500 - (ratel ? Math.abs(Math.sin(u * 45)) * 8 : 0);
  const rot = los ? Math.sin(g * 13) * 0.14 * P(g, 0, 0.25) : ratel * Math.sin(u * 70) * 0.03;
  // the cord: slack, then taut, then the plug pops out and dangles
  const voetX = fx - 130, voetY = fy - 4;
  ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath();
  if (u < m.stekker) { ctx.moveTo(110, 930); ctx.quadraticCurveTo((110 + voetX) / 2, los ? 930 - op * 600 : 1000, voetX, voetY); ctx.stroke(); }
  else { const sw = Math.sin((u - m.stekker) * 9) * 0.5, px = voetX + Math.sin(sw) * 260, py = voetY + Math.cos(sw) * 260; ctx.moveTo(voetX, voetY); ctx.quadraticCurveTo(voetX - 30, voetY + 160, px, py); ctx.stroke(); rect(px - 22, py, 44, 40, C.paper); line(px - 10, py + 40, px - 10, py + 62, '#888', 6); line(px + 10, py + 40, px + 10, py + 62, '#888', 6); }
  ctx.restore();
  if (u >= m.stekker && u < m.stekker + 0.4) burst(110, 920, 30, 60 * E.outPop(P(u, m.stekker, m.stekker + 0.12)), 8, C.sun);
  around(fx, fy, 1, rot, () => ventilator(fx, fy, 1.3, hoek, P(toeren(u), 6, 20), kantel));
  // the wind it makes
  if (wind > 0.15 && !los) {
    ctx.save(); ctx.strokeStyle = C.paper; ctx.lineCap = 'round';
    for (let k = 0; k < 16; k++) {
      const q = (u * (1.5 + 2.5 * wind) + k * 0.137) % 1, x = fx + 180 + q * 760, y = fy - 350 + ((k * 53) % 320) - 160 + Math.sin(q * 7 + k) * 14;
      ctx.globalAlpha = (1 - q) * wind * 0.9; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 60 + 120 * wind, y); ctx.stroke();
    }
    ctx.restore();
  }
  // the numbers on the knob
  [['1', m.k1], ['2', m.k2], ['MAX!', m.k3]].forEach(([s, t]) => boem(s, 960, 640, u - t, { size: s.length > 1 ? 90 : 110, dur: m.k2 - m.k1 + 0.05, burst: s.length > 1, kleur: C.lime, rot: 0.1 }));
  // the hippo: sweating, then blown back with its cheeks flapping, then alone again
  const hk = acteurVan(it, 'nijlpaard'), hx = 1330, hy = 990, hh = 540;
  const flapper = wind > 0.4 ? Math.sin(u * 95) * 0.05 * wind : 0;
  const naKijk = los && g > 0.15;
  dier(hk, hx + wind * 30, hy, hh, { flip: true, rot: wind * 0.12, sx: 1 + flapper, sy: 1 - flapper * 0.6 + 0.02 * beatPulse(u, 8), pose: { ogen: naKijk ? 'open' : wind > 0.45 ? 'dicht' : 'blij', blos: !naKijk || g < 0.5 } });
  if (wind < 0.35 || naKijk) druppels(hx - 20, hy - hh * 0.95, u, 5);
  else { for (let k = 0; k < 6; k++) { const q = (u * 3 + k / 6) % 1; ctx.save(); ctx.globalAlpha = 1 - q; ctx.fillStyle = '#7CC8FF'; ctx.beginPath(); ctx.ellipse(hx - 40 + q * 420, hy - hh * 0.9 + (k - 3) * 30 + q * q * 60, 16, 8, 0, 0, TAU); ctx.fill(); ctx.restore(); } }
  if (naKijk && g < 0.7) { const e = oogVan(hk, hx, hy, hh, true); txt('?!', e.x - 40, e.y - 120, { f: FL, size: 100, color: C.ink }); }
  // the headline flaps in the wind like a flag
  const lines = balans(it.kop.toUpperCase(), font(FL, 120), 1300);
  lines.forEach((l, li) => letters(l, W / 2, 170 + li * 130, 120, (i, n, c) => {
    const a = (4 + 26 * wind), ph = c.x / 70 - u * 22 + li;
    return { s: E.outPop(P(u, li * 0.1 + i * 0.02, li * 0.1 + i * 0.02 + 0.2)), y: -a * Math.sin(ph), rot: 0.05 * wind * Math.cos(ph) + 0.08 * wind, x: wind * 14, schaduw: '#C2410C' };
  }, { align: 'center' }));
  chip(it, 56, 980);
};

// ================================================================ SEPTEMBER
// the departure board: every line flips to 'rijdt niet'; then the replacement bus
SCHETSEN.staking = (u, it) => {
  const m = tm(it);
  rect(0, 0, W, H, '#0E2F7A');
  const kop = it.kop.toUpperCase();
  rect(0, 0, W, 170, '#0A2463');
  letters(kop, W / 2, 125, 100, i => ({ s: E.outPop(P(u, i * 0.02, i * 0.02 + 0.2)), kleur: '#FFC917' }), { align: 'center', plain: true });
  const rows = [['08:02', 'UTRECHT CENTRAAL'], ['08:05', 'AMSTERDAM CENTRAAL'], ['08:11', 'ROTTERDAM CENTRAAL'], ['08:14', 'DEN HAAG CENTRAAL'], ['08:20', 'EINDHOVEN'], ['08:26', 'GRONINGEN']];
  const GL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  rows.forEach(([tijd, naar], i) => {
    const y = 290 + i * 104;
    line(60, y + 50, W - 60, y + 50, '#FFFFFF', 1, 0.2);
    txt(tijd, 80, y, { f: FM, size: 44, weight: 700, color: '#FFFFFF', align: 'left' });
    txt(naar, 300, y, { f: FS, size: 48, weight: 700, color: '#FFFFFF', align: 'left' });
    const t0 = m.flap + i * B * 0.25, q = P(u, t0, t0 + 0.3);
    const want = 'RIJDT NIET';
    let s = '';
    for (let c = 0; c < want.length; c++) { const done = q >= 1 || c / want.length < q * 0.8; s += want[c] === ' ' ? ' ' : done ? want[c] : q > 0 ? GL[(Math.floor(u * 40) + c * 7 + i) % 26] : ' '; }
    if (q <= 0) s = 'OP TIJD';
    // the flaps
    const fx = W - 560;
    for (let c = 0; c < 10; c++) { rect(fx + c * 50, y - 36, 44, 70, '#0A1E4E'); line(fx + c * 50, y, fx + c * 50 + 44, y, '#000', 2); }
    txt(s.padEnd(10, ' ').slice(0, 10).split('').join(''), fx + 6, y + 2, { f: FM, size: 50, weight: 700, color: q > 0 ? '#FFC917' : '#7CFF9A', align: 'left', track: 20 });
  });
  // the replacement bus: a snail with a destination sign
  const sq = E.outCubic(P(u, m.slak, D));
  if (sq > 0) {
    rect(0, 920, W, H - 920, '#5A6470'); rect(0, 920, W, 14, '#FFC917');
    const sk = acteurVan(it, 'slak'), sx = lerp(W + 300, W * 0.62, sq);
    dier(sk, sx, 1060, 360, { flip: true, pose: { ogen: 'blij' } });
    BENDE.slice(0, 3).forEach((k, i) => dier(k, sx + 40 + i * 70, 860 - (i % 2) * 10, 110, { flip: true, schaduw: false, pose: { ogen: 'blij' } }));
    ctx.save(); ctx.translate(sx - 30, 760); ctx.beginPath(); ctx.roundRect(-210, -60, 420, 80, 10); ctx.fillStyle = '#111'; ctx.fill();
    txt('VERVANGEND VERVOER', 0, -18, { f: FM, size: 26, weight: 700, color: '#FFB000', track: 2 }); ctx.restore();
  }
  chip(it, 56, 190);
};

// close on the bow: the champagne bottle smashes; pull back as the ship slides down
// the slipway; the splash; the dolphin in a sailor's cap salutes
SCHETSEN.amalia = (u, it) => {
  const m = tm(it);
  const slide = E.inCubic(P(u, m.smash + 0.15, m.plons));
  const sx = 60 + slide * 480, sy = 560 + slide * 220, rot = 0.16 * (1 - P(u, m.plons, m.plons + 0.3));
  // where the bottle hits, in the world
  const boeg = [sx + Math.cos(rot) * 1180 * 1.15 - Math.sin(rot) * -70, sy + Math.sin(rot) * 1180 * 1.15 + Math.cos(rot) * -70];
  const terug = E.inOutCubic(P(u, m.smash + 0.1, m.smash + 0.6));
  const zoom = lerp(1.3, 1, terug), hw = W / 2 / zoom, hh = H / 2 / zoom;
  const focus = [clamp(lerp(boeg[0] - 260, W / 2, terug), hw, W - hw), clamp(lerp(boeg[1] - 140, H / 2, terug), hh, H - hh)];
  const jolt = u >= m.plons ? Math.sin((u - m.plons) * 60) * 14 * Math.exp(-(u - m.plons) * 7) : 0;
  ctx.save(); ctx.translate(W / 2, H / 2 + jolt); ctx.scale(zoom, zoom); ctx.translate(-focus[0], -focus[1]);
  rect(-200, -200, W + 400, H + 400, '#1A3348');
  vgrad(0, 600, [[0, '#8FB0CF'], [1, '#D7E3EE']]);
  for (let i = 0; i < 5; i++) { const x = ((i * 380 + u * 60) % (W + 200)) - 100, y = 120 + (i % 3) * 50, f = Math.sin(u * 8 + i) * 12; ctx.save(); ctx.strokeStyle = '#333'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 30, y - f); ctx.quadraticCurveTo(x - 12, y - 18, x, y); ctx.quadraticCurveTo(x + 12, y - 18, x + 30, y - f); ctx.stroke(); ctx.restore(); }
  vgrad(640, H, [[0, '#3E6B8C'], [1, '#1A3348']]);
  poly([[-200, 540], [700, 830], [700, H], [-200, H]], '#6E6A64');
  // the ship, with the headline on a banner along its side
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(rot); ctx.scale(1.15, 1.15);
  poly([[0, -50], [1180, -50], [1300, -110], [1240, 30], [60, 30]], '#5E6670');
  poly([[300, -50], [330, -190], [720, -190], [760, -50]], '#6E7680');
  rect(440, -300, 140, 110, '#6E7680'); line(510, -300, 510, -440, '#555', 8);
  ['#AE1C28', '#FFFFFF', '#21468B'].forEach((c, i) => poly([[40, -180 + i * 20], [-50, -180 + i * 20 + Math.sin(u * 5) * 6], [-50, -160 + i * 20 + Math.sin(u * 5) * 6], [40, -160 + i * 20]], c));
  line(40, -60, 40, -180, '#333', 4);
  const kop = it.kop.toUpperCase(), bw = measure(kop, font(FL, 58)) + 60, bp = E.outBack(P(u, m.smash + 0.05, m.smash + 0.3));
  if (bp > 0) {
    ctx.save(); ctx.translate(620, -12); ctx.scale(bp, 1);
    rect(-bw / 2, -40, bw, 80, '#FFFFFF'); rect(-bw / 2, -40, bw, 8, '#AE1C28'); rect(-bw / 2, 32, bw, 8, '#21468B');
    txt(kop, 0, 22, { f: FL, size: 58, color: '#1A2A55', base: 'alphabetic' });
    ctx.restore();
  }
  ctx.restore();
  // the bottle on its rope
  const swing = E.inCubic(P(u, 0, m.smash));
  const pivot = [boeg[0] - 420, boeg[1] - 520], len = Math.hypot(420, 520), a1 = Math.atan2(420, 520);
  if (u < m.smash) {
    const a = lerp(-0.7, a1, swing), bx = pivot[0] + Math.sin(a) * len, by = pivot[1] + Math.cos(a) * len;
    line(pivot[0], pivot[1] - 400, bx, by, '#EEE', 3);
    ctx.save(); ctx.translate(bx, by); ctx.rotate(-a); rect(-18, 0, 36, 90, '#1F5A2A'); rect(-8, -30, 16, 32, '#1F5A2A'); rect(-18, 20, 36, 30, '#E8C95A'); ctx.restore();
  } else {
    const g = u - m.smash, r = rng(41), [bx, by] = boeg;
    for (let k = 0; k < 26; k++) { const an = r() * TAU, v = 300 + r() * 700; circle(bx + Math.cos(an) * v * g, by + Math.sin(an) * v * g + 900 * g * g, 6 + r() * 12, k % 3 ? '#FFFFFF' : '#2F8A3A', 1 - P(g, 0.4, 0.8)); }
  }
  // the splash, and the dolphin jumps through it in its cap, saluting
  if (u > m.plons) {
    const g = u - m.plons;
    for (let k = 0; k < 36; k++) { const an = -Math.PI / 2 + (k / 35 - 0.5) * 2.8, d = 620 * E.outCubic(P(g, 0, 0.5)); circle(sx + 760 + Math.cos(an) * d, 860 + Math.sin(an) * d * 0.8 + g * g * 700, 24 - (k % 3) * 5, '#DDEFFF', 1 - P(g, 0.4, 0.8)); }
    const dq = P(g, 0.05, 0.75);
    if (dq > 0 && dq < 1) {
      const dk = acteurVan(it, 'dolfijn'), dx = lerp(1850, 1150, dq), dy = 900 - Math.sin(Math.PI * dq) * 460, dr = lerp(-0.6, 0.5, dq);
      dier(dk, dx, dy, 260, { flip: true, rot: dr, pose: { ogen: 'blij', arm: 'op', vleugel: 'op' }, schaduw: false });
      const e = oogVan(dk, dx, dy, 260, true);
      ctx.save(); ctx.translate(e.x + 10, e.y - 50); ctx.rotate(dr); rect(-46, -14, 92, 26, '#FFFFFF'); rect(-46, 6, 92, 10, '#21468B'); circle(0, -18, 10, C.fire); ctx.restore();
    }
  }
  ctx.restore();
  if (u >= m.smash && u < m.smash + 0.5) boem('PLETS!', W / 2 + 330, 300, u - m.smash, { size: 130, kleur: '#E8C95A' });
  chip(it);
};

// the sprint, the line, the flash: a photo finish in the rainbow jersey
SCHETSEN.wielrennen = (u, it) => {
  const m = tm(it);
  const scene = (t) => {
    vgrad(0, 620, [[0, '#A9C7E8'], [1, '#EEF3F8']]);
    const r = rng(514), off = -(t * 300) % 400;
    ctx.fillStyle = '#7D93AD';
    let x = off - 400; while (x < W + 400) { const w = 50 + r() * 120, h = 60 + r() * 260; ctx.fillRect(x, 560 - h, w, h + 60); x += w + 8; }
    vgrad(560, H, [[0, '#3E4246'], [1, '#26292C']]);
    for (let k = 0; k < 10; k++) { const xx = ((k * 250 - t * 900) % (W + 250) + W + 250) % (W + 250) - 125; rect(xx, 760, 150, 10, '#F2ECE1', 0.8); }
    for (let k = 0; k < 22; k++) { const xx = ((k * 100 - t * 900) % (W + 100) + W + 100) % (W + 100) - 50; rect(xx, 560, 90, 40, k % 2 ? '#FFFFFF' : '#D0101A'); }
    crowd(470, '#34465C', 71, t, { n: 40, scale: 0.6, hands: true, flags: ['#FF7A00', '#FFFFFF', '#21468B'], bounce: 8 });
    // the finish line comes at us
    const fx = lerp(W + 200, W * 0.58, P(t, m.finish - B * 1.2, m.finish));
    for (let k = 0; k < 12; k++) for (let q = 0; q < 2; q++) rect(fx + q * 20, 600 + k * 40, 20, 40, (k + q) % 2 ? '#111' : '#FFF');
    // the rider
    const rx = W * 0.5 + Math.sin(t * 2) * 30, ry = 700, a = t * 14;
    ctx.save(); ctx.translate(rx, ry);
    for (let s = 0; s < 6; s++) line(-420 - s * 60, -40 + s * 24, -240 - s * 40, -40 + s * 24, '#FFFFFF', 3, 0.5);
    [[-150, 70], [150, 70]].forEach(([wx, wy]) => { ring(wx, wy, 95, '#111', 10); ctx.save(); ctx.translate(wx, wy); ctx.rotate(a); for (let k = 0; k < 8; k++) { ctx.rotate(Math.PI / 4); line(0, 0, 90, 0, '#888', 2); } ctx.restore(); });
    ctx.strokeStyle = '#DDD'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-150, 70); ctx.lineTo(-30, 60); ctx.lineTo(80, -40); ctx.lineTo(150, 70); ctx.moveTo(-30, 60); ctx.lineTo(-60, -40); ctx.lineTo(80, -40); ctx.stroke();
    const px = Math.cos(a) * 36, py = Math.sin(a) * 36;
    ctx.lineCap = 'round'; ctx.strokeStyle = '#1B1B1F'; ctx.lineWidth = 26;
    ctx.beginPath(); ctx.moveTo(-60, -70); ctx.lineTo(-30 + px * 0.4, 0); ctx.lineTo(-30 + px, 60 + py); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-60, -70); ctx.lineTo(-10 - px * 0.4, 10); ctx.lineTo(-30 - px, 60 - py); ctx.stroke();
    ctx.save(); ctx.translate(-60, -70); ctx.rotate(-0.55); ctx.beginPath(); ctx.roundRect(0, -30, 170, 64, 30); ctx.clip();
    rect(0, -30, 170, 64, '#FFFFFF'); ['#0A73C7', '#D0101A', '#111111', '#F7D117', '#1E9E4A'].forEach((c, k) => rect(60, -30 + k * 13, 110, 12, c)); ctx.restore();
    ctx.strokeStyle = '#E8B99A'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(60, -150); ctx.lineTo(80, -40); ctx.stroke();
    circle(85, -175, 34, '#E8B99A'); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(80, -196, 44, 26, -0.3, Math.PI, 0); ctx.fill();
    ctx.restore();
    // the dog runs alongside
    dier(acteurVan(it, 'hond'), rx - 420, 960, 230, { pose: { poten: Math.floor(t * 14) % 2 ? 'a' : 'b', ogen: 'blij' }, dy: -Math.abs(Math.sin(t * 14)) * 30 });
  };
  if (u < m.finish) { scene(u); chip(it); return; }
  // the freeze frame becomes a photo
  const g = u - m.finish;
  rect(0, 0, W, H, '#111');
  ['#0A73C7', '#D0101A', '#111111', '#F7D117', '#1E9E4A'].forEach((c, k) => { const sw2 = E.outExpo(P(g, k * 0.04, k * 0.04 + 0.35)); rect(0, k * H / 5, W * sw2, H / 5 + 1, c); });
  const s = lerp(1, 0.78, E.outCubic(P(g, 0, 0.35))), rot = lerp(0, -0.05, E.outCubic(P(g, 0, 0.35)));
  const c = offscreen(1, () => scene(m.finish));
  ctx.save(); ctx.translate(W / 2, H / 2 - 30); ctx.rotate(rot); ctx.scale(s, s);
  rect(-W / 2 - 30, -H / 2 - 30, W + 60, H + 200, '#FFFFFF');
  ctx.drawImage(c, -W / 2, -H / 2);
  txt(it.kop.toUpperCase(), 0, H / 2 + 120, { f: FL, size: 110, color: C.ink });
  ctx.restore();
  rect(0, 0, W, H, '#FFFFFF', 0.9 * Math.exp(-g * 10));
};

// ================================================================ DECEMBER
// no fireworks this year: a sparkler writes the new year, the dog sleeps right through it
SCHETSEN.vuurwerk = (u, it) => {
  BEELD.vuurwerk(u, it);
  const hk = acteurVan(it, 'hond');
  ctx.fillStyle = '#7A2F45'; ctx.beginPath(); ctx.ellipse(W / 2 + 420, 1010, 260, 40, 0, 0, TAU); ctx.fill();
  acteur(hk, 'slaap', u, W / 2 + 420, 1000, 260, { flip: true, t0: 2 });
  const a = P(u, B, B * 2);
  txt(it.kop.toUpperCase(), W / 2 - 140, 640, { f: FL, size: 76, color: '#FFE7B0', alpha: a });
  txt(it.sub, W / 2 - 140, 700, { f: FS, size: 28, weight: 700, color: '#FFE7B0', alpha: a * 0.75 });
  chip(it);
};
