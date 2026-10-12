/*
 * The sketches, April to December (see schetsen.js for how they work).
 */

// ================================================================ APRIL
function schaal(x, y, s, spin) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#8E97A6'; ctx.beginPath(); ctx.ellipse(0, 10, 200, 52, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#DCE2EA'; ctx.beginPath(); ctx.ellipse(0, 0, 200, 50, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#B5BDC9'; ctx.beginPath(); ctx.ellipse(0, 3, 150, 34, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(0, 0, 188, 44, 0, spin, spin + 0.9); ctx.stroke();
  ctx.restore();
}
// the dish flies in like a frisbee and lands on the seal's nose
SCHETSEN.kampioen = (u, it) => {
  const m = tm(it);
  vgrad(0, H, [[0, '#050508'], [1, '#1A0A0E']]);
  [[420, 50], [W - 420, 50]].forEach(([x, y], i) => {
    for (let k = 0; k < 3; k++) for (let q = 0; q < 4; q++) circle(x - 60 + q * 40, y + k * 40, 14, '#FFF8E0');
    beam(x, y + 60, (i ? 0.55 : -0.55), 1300, 360, 'rgba(255,248,224,A)', 0.14);
  });
  for (let row = 0; row < 6; row++) {
    const y = 300 + row * 55, r = rng(row + 30);
    for (let i = 0; i < 44; i++) { const x = i * 45 + (row % 2) * 22, bob = Math.abs(Math.sin(Math.PI * u / B + i * 0.15 + row * 0.5)) * 14; circle(x, y - bob, 17, r() < 0.55 ? '#D0101A' : '#F2ECE1', 0.9 - row * 0.05); }
  }
  rect(0, 640, W, H - 640, '#1F6B2C'); for (let k = 0; k < 8; k++) rect(k * 260, 640, 130, H - 640, '#237A32');
  // the seal and its nose
  ctx.save(); const zm = 1 + 0.12 * E.inOutSine(P(u, 0, D)); ctx.translate(W / 2, 640); ctx.scale(zm, zm); ctx.translate(-W / 2, -640);
  const sk = acteurVan(it, 'zeehond'), sx = W / 2 - 120, sy = 980, sh = 540;
  const caught = u >= m.vang;
  const wob = caught ? Math.sin((u - m.vang) * 14) * 0.08 * Math.exp(-(u - m.vang) * 2) : 0;
  const clap = u > m.vang && Math.floor(u / (B / 2)) % 2;
  dier(sk, sx, sy - (u > m.vang ? hop(u) * 30 : 0), sh, { pose: { ogen: caught ? 'blij' : 'open', blos: caught, vleugel: clap ? 'op' : 'neer', arm: clap ? 'op' : 'neer' }, rot: wob * 0.5, sy: 1 - 0.06 * beatPulse(u, 12) });
  const e = oogVan(sk, sx, sy - (u > m.vang ? hop(u) * 30 : 0), sh, false), nx = e.x + sh * 0.2, ny = e.y - sh * 0.1;
  // the dish
  const fq = E.outCubic(P(u, m.vlieg, m.vang));
  const dx = caught ? nx + Math.sin(wob * 10) * 20 : lerp(W + 300, nx, fq), dy = caught ? ny - 30 : lerp(-150, ny - 30, fq) - Math.sin(Math.PI * fq) * 120;
  if (u >= m.vlieg) {
    schaal(dx, dy, caught ? 0.9 : 0.9, u * 14);
    if (!caught) snelheid(dx, dy, -1, 0.4, 5, 200, C.paper, 0.5);
  }
  rgrad(dx, dy, 0, 380, [[0, `rgba(255,240,200,${caught ? 0.35 : 0.1})`], [1, 'rgba(255,240,200,0)']], 'lighter');
  ctx.restore();
  if (u > m.feest) confettiKanon(u - m.feest, ['#D0101A', '#F2ECE1', '#E8C95A', '#D0101A']);
  // the LED board
  rect(0, H - 150, W, 150, '#0A0A0C');
  const kop = it.kop.toUpperCase(), shown = Math.floor(P(u, 0.05, 0.6) * kop.length);
  txt(kop.slice(0, shown), W / 2, H - 70, { f: FL, size: 104, color: '#FF2A1A' });
  ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = '#0A0A0C'; for (let y = H - 150; y < H; y += 8) ctx.fillRect(0, y, W, 3); for (let x = 0; x < W; x += 8) ctx.fillRect(x, H - 150, 3, 150); ctx.restore();
  chip(it);
};

// the letters fall like dominoes, and the last one takes the llama with it
SCHETSEN.boedapest = (u, it) => {
  const m = tm(it), stap = m.stap;
  vgrad(0, 700, [[0, '#0B1030'], [0.7, '#3B2A5A'], [1, '#C9665A']]);
  starsBg(3, 50, 0.4, u);
  const base = 560, c = '#0C0A18';
  ctx.fillStyle = c; ctx.fillRect(260, base - 150, 1400, 150);
  for (let k = 0; k < 28; k++) { const x = 270 + k * 50; ctx.fillRect(x, base - 190, 20, 40); ctx.beginPath(); ctx.moveTo(x - 2, base - 190); ctx.lineTo(x + 10, base - 230); ctx.lineTo(x + 22, base - 190); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(W / 2 - 160, base - 150); ctx.quadraticCurveTo(W / 2 - 160, base - 360, W / 2, base - 380); ctx.quadraticCurveTo(W / 2 + 160, base - 360, W / 2 + 160, base - 150); ctx.fill();
  ctx.fillRect(W / 2 - 10, base - 470, 20, 100);
  for (let k = 0; k < 24; k++) rect(290 + k * 58, base - 110, 16, 30, '#FFD27A', 0.5 + 0.3 * Math.sin(u * 2 + k));
  const r = rng(77);
  for (let i = 0; i < 4; i++) { const t0 = i * B * 0.75 + r() * 0.3, fx = 300 + r() * 1300, fy = 120 + r() * 200, k = u - t0; if (k < 0 || k > 1.4) continue; const cc = [C.fire, '#FFFFFF', '#2DB04E'][i % 3]; for (let s = 0; s < 36; s++) { const a = s * TAU / 36, d = 160 * E.outExpo(k); circle(fx + Math.cos(a) * d, fy + Math.sin(a) * d + k * k * 40, 4, cc, 1 - k / 1.4); } }
  rect(0, 700, W, H - 700, '#120E1C');
  line(0, 860, W, 860, '#3A3050', 4);
  // the dominoes
  const kop = it.kop.toUpperCase(), size = 250, fnt = font(FL, size), L = layout(kop, fnt);
  const x0 = W / 2 - L.width / 2 - 120;
  let nVal = 0;
  const valT = i => m.val + i * stap;
  letters(kop, x0, 860, size, (i, n) => {
    const t0 = valT(nVal++), q = P(u, t0, t0 + 0.16);
    const rot = q < 1 ? (Math.PI / 2) * q * q : Math.PI / 2 - 0.12 * Math.sin((u - t0 - 0.16) * 30) * Math.exp(-(u - t0 - 0.16) * 10);
    return { rot: rot * 0.93, px: 1, py: 1, s: E.outPop(P(u, i * 0.02, i * 0.02 + 0.15)) };
  });
  // the llama at the end of the line
  const tf = valT(L.chars.filter(ch => ch.ch !== ' ').length) + 0.02, f = E.outBack(P(u, tf, tf + 0.3));
  const lx = x0 + L.width + 170;
  dier(acteurVan(it, 'lama'), lx, 860, 300, { flip: true, rot: (Math.PI / 2) * f, dy: -Math.abs(Math.sin((Math.PI / 2) * f)) * 120, pose: { ogen: f > 0.3 ? 'dicht' : 'open' } });
  if (u < tf && u > tf - 0.5) uitroep(lx, 520, 1.2);
  if (f >= 1) sterretjes(lx + 120, 700, u, 90);
  boem('BOEM!', lx + 40, 470, u - tf, { size: 100, kleur: C.sun });
  chip(it);
};

// the King's Day parade in orange crowns, a balloon with the banner
SCHETSEN.koningsdag = (u, it) => {
  vgrad(0, 700, [[0, '#7FB7E8'], [1, '#CFE6F7']]);
  for (let i = 0; i < 4; i++) { const x = ((i * 520 + u * 25) % (W + 400)) - 200, y = 90 + (i % 2) * 70; [[0, 0, 60], [60, -20, 70], [130, 0, 55]].forEach(([dx, dy, r]) => circle(x + dx, y + dy, r, '#FFFFFF', 0.9)); }
  // the balloon with its banner drifts across
  const bp = P(u, 0, D);
  const bx = lerp(-100, W + 450, bp), by = 170 - Math.sin(Math.PI * bp) * 40;
  const kop = it.kop.toUpperCase(), bw = measure(kop, font(FL, 70)) + 60;
  const wave = t => Math.sin(t * 6 + u * 6) * 10;
  ctx.save();
  for (let k = 0; k < 3; k++) line(bx - 60 - k * 10, by + 120, bx - 140 - k * 20, by + 100 + k * 20, '#333', 2);
  ctx.beginPath(); ctx.moveTo(bx - 140 - bw, by + 90 + wave(0)); for (let s = 0; s <= 20; s++) ctx.lineTo(bx - 140 - bw + s * bw / 20, by + 90 + wave(s / 20)); for (let s = 20; s >= 0; s--) ctx.lineTo(bx - 140 - bw + s * bw / 20, by + 180 + wave(s / 20)); ctx.closePath();
  ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke();
  txt(kop, bx - 140 - bw / 2, by + 138 + wave(0.5), { f: FL, size: 70, color: '#FF7A00' });
  ctx.restore();
  ctx.fillStyle = '#FF7A00'; ctx.beginPath(); ctx.ellipse(bx, by, 110, 130, 0, 0, TAU); ctx.fill();
  for (let k = -2; k <= 2; k++) { ctx.strokeStyle = '#E05A00'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(bx, by, Math.abs(k) * 40 + 8, 130, 0, 0, TAU); ctx.stroke(); }
  rect(bx - 30, by + 150, 60, 40, '#8A5A2A'); line(bx - 70, by + 100, bx - 30, by + 150, '#333', 2); line(bx + 70, by + 100, bx + 30, by + 150, '#333', 2);
  // canal houses scrolling by
  const cols = ['#8C3B2E', '#5E3A2B', '#A0522D', '#6B3E30', '#7A2F25', '#4F3328'];
  const off = -(u * 80) % 150;
  for (let i = -1; i < 15; i++) gable(off + i * 150, 760, 140, 220 + ((i + 20) % 3) * 30, cols[(i + 12) % cols.length], (i + 12) % 3, 'rgba(255,245,220,0.8)');
  for (let row = 0; row < 2; row++) {
    const y0 = 420 + row * 70;
    for (let x = 20 + off; x < W; x += 60) poly([[x - 20, y0], [x + 20, y0], [x + Math.sin(u * 3 + x) * 6, y0 + 40]], ['#FF7A00', '#FFFFFF', C.blue, '#D0101A'][((x - off) / 60 + row) % 4 | 0]);
  }
  rect(0, 760, W, H - 760, '#9AA0A6'); rect(0, 760, W, 10, '#6E747A');
  // the giraffe in a crown looks over the roofs
  const gk = acteurVan(it, 'giraf');
  acteur(gk, 'kijk', u - 0.2, W - 260, 790, 460, { flip: true, t0: 5 });
  if (u > 0.5) kroon(gk, W - 260, 790, 460, true);
  // the parade marches in step
  const parade = ['kip', 'lama', 'hond', 'konijn', 'pinguin', 'aap', 'hamster', 'eenhoorn'];
  parade.forEach((key, i) => {
    const x = -200 + u * 380 - i * 210;
    if (x < -150 || x > W + 150) return;
    const y = 1010 - hop(u + i * 0.03) * 40;
    dier(key, x, y, 210, { pose: { poten: Math.floor(u / (B / 2)) % 2 ? 'a' : 'b', ogen: 'blij', arm: Math.floor(u / B) % 2 ? 'op' : 'neer' } });
    kroon(key, x, y, 210, false);
  });
  confetti(u, 427, 60, ['#FF7A00', '#FFFFFF', '#FF7A00'], 140);
  chip(it);
};

// ================================================================ MEI
// the one time the gang watches tv: green, green, green... red
SCHETSEN.mol = (u, it) => {
  const m = tm(it);
  const sx = 110, sy = 120, sw = 1040, sh = 585;
  const back = E.inOutCubic(P(u, B * 0.5, B * 1.4));
  const push = E.outBack(P(u, m.rood + 0.1, m.rood + 0.4)) * 0.12;
  const zs = lerp(W / sw, 1, back) * (1 + push), cx = sx + sw / 2, cy = sy + sh / 2;
  ctx.save();
  ctx.translate(lerp(W / 2, cx + push * 400, back), lerp(H / 2, cy + push * 200, back)); ctx.scale(zs, zs); ctx.translate(-cx, -cy);
  vgrad(-200, H + 200, [[0, '#F6D7A7'], [1, '#E9B97A']]);
  for (let x = -100; x < W + 100; x += 90) rect(x, -200, 40, H + 400, '#F2CB91', 0.6);
  rect(-200, 840, W + 400, 400, '#8C5A3C'); rect(-200, 832, W + 400, 14, '#5E3A26');
  line(1830, 840, 1830, 380, '#333', 8); poly([[1760, 380], [1900, 380], [1870, 300], [1790, 300]], C.sun);
  rect(sx - 40, sy + sh + 40, sw + 80, 140, '#5E3A26'); rect(sx - 36, sy - 36, sw + 72, sh + 72, '#26222A');
  // on the tv: four candidates, four screens
  ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
  rect(sx, sy, sw, sh, '#0B0B10');
  const kand = ['kip', 'uil', 'konijn', acteurVan(it, 'das')], ts = [m.s1, m.s2, m.s3, m.rood];
  kand.forEach((k, i) => {
    const px = sx + 70 + i * 245, py = sy + 60, pw = 210, ph = 330;
    const on = u >= ts[i], red = i === 3 && on;
    const flick = red && u < ts[i] + 0.3 ? Math.floor(u * 30) % 2 : 1;
    rect(px, py, pw, ph, on ? (red ? '#E0121B' : '#16C24A') : '#1A1A22', on ? flick : 1);
    dier(k, px + pw / 2, py + ph - 20, 170, { pose: { ogen: red ? 'open' : on ? 'blij' : 'open' }, rot: red ? Math.sin(u * 40) * 0.06 : 0, schaduw: false });
    if (red && u > ts[i] + 0.15) uitroep(px + pw / 2 + 60, py + 70, 0.9);
  });
  rect(sx, sy + sh - 120, sw, 120, C.ink, 0.85);
  letters(it.kop.toUpperCase(), sx + sw / 2, sy + sh - 34, 70, i => ({ s: E.outPop(P(u, m.rood + i * 0.02, m.rood + i * 0.02 + 0.2)) }), { align: 'center', schaduw: '#E0121B' });
  ctx.save(); ctx.globalAlpha = 0.08; ctx.fillStyle = '#000'; for (let y = sy; y < sy + sh; y += 5) ctx.fillRect(sx, y, sw, 2); ctx.restore();
  ctx.restore();
  // the couch: they jump out of their skins, the popcorn goes everywhere
  const bx = 1220, by = 900, schrik = u >= m.rood;
  ctx.save(); ctx.beginPath(); ctx.roundRect(bx, by - 230, 700, 140, 40); ctx.fillStyle = '#C0392B'; ctx.fill(); ctx.restore();
  ['lama', 'goudvis', 'hond'].forEach((w, i) => {
    const j = schrik ? Math.sin(Math.PI * P(u - m.rood, i * 0.04, i * 0.04 + 0.45)) * 160 : 0;
    dier(w, bx + 150 + i * 210, by - 70 - j, 230, { flip: true, pose: { ogen: schrik ? 'open' : (Math.floor(u * 0.8 + i) % 5 === 0 ? 'dicht' : 'open'), arm: schrik ? 'op' : 'neer', vleugel: schrik ? 'op' : 'neer' } });
  });
  if (schrik) { const g = u - m.rood, r = rng(9); for (let k = 0; k < 26; k++) { const a = -Math.PI / 2 + (r() - 0.5) * 2.2, v = 500 + r() * 600; circle(bx + 380 + Math.cos(a) * v * g, by - 160 + Math.sin(a) * v * g + 1400 * g * g, 12 + r() * 6, '#FFF3C4'); } }
  ctx.save(); ctx.beginPath(); ctx.roundRect(bx - 20, by - 110, 740, 150, 30); ctx.fillStyle = '#E74C3C'; ctx.fill(); ctx.restore();
  ctx.restore();
  chip(it, 56, 48, back);
};

// the share price as a rollercoaster: the camera rides along with the hamster, up
// and up, until the line goes straight through the roof and the cart flies off
SCHETSEN.chip = (u, it) => {
  const m = tm(it);
  rect(0, 0, W, H, '#05080F');
  const track = q => [q * 3400, -Math.pow(q, 3) * 2600 + Math.sin(q * 28) * 40 * (1 - q)];
  const q = E.inCubic(P(u, 0, m.top)), [cx, cy] = track(q), [px2, py2] = track(Math.max(0, q - 0.004));
  const ang = q > 0.002 ? Math.atan2(cy - py2, cx - px2) : 0;
  const sxs = W * 0.4, sys = H * 0.62;
  const off = u > m.top ? (u - m.top) : 0;
  ctx.save(); ctx.translate(sxs - cx, sys - cy);
  // the grid of the trading screen, in the world
  ctx.save(); ctx.strokeStyle = '#13233E'; ctx.lineWidth = 2;
  const gx0 = Math.floor((cx - sxs) / 160) * 160, gy0 = Math.floor((cy - sys) / 160) * 160;
  for (let x = gx0; x < gx0 + W + 320; x += 160) { ctx.beginPath(); ctx.moveTo(x, gy0); ctx.lineTo(x, gy0 + H + 320); ctx.stroke(); }
  for (let y = gy0; y < gy0 + H + 320; y += 160) { ctx.beginPath(); ctx.moveTo(gx0, y); ctx.lineTo(gx0 + W + 320, y); ctx.stroke(); }
  ctx.restore();
  // little candles along the way
  for (let k = 1; k < 40; k++) { const qk = k / 40; if (qk > q) break; const [x, y] = track(qk); rect(x - 10, y + 40, 20, 60 + (k % 3) * 20, '#1E7A3C'); }
  // the line so far, and once it is at the top, straight up
  ctx.save(); ctx.strokeStyle = C.lime; ctx.lineWidth = 14; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.shadowColor = C.lime; ctx.shadowBlur = 24;
  ctx.beginPath(); for (let s = 0; s <= 120; s++) { const [x, y] = track(s / 120 * q); s ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  if (off > 0) ctx.lineTo(cx + 20, cy - off * 4000);
  ctx.stroke(); ctx.restore();
  ctx.restore();
  // the cart and the hamster: at the top, the cart shoots off and the hamster flies
  const cartY = sys - off * 2600, hamY = sys - 60 - off * 1700 + off * off * 900;
  ctx.save(); ctx.translate(sxs, cartY); ctx.rotate(off > 0 ? -Math.PI / 2 : ang);
  ctx.beginPath(); ctx.roundRect(-110, -90, 220, 90, 18); ctx.fillStyle = C.fire; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = C.ink; ctx.stroke();
  circle(-60, 6, 22, C.ink); circle(60, 6, 22, C.ink);
  ctx.restore();
  if (off === 0) {
    ctx.save(); ctx.translate(sxs, sys); ctx.rotate(ang);
    dier(acteurVan(it, 'hamster'), 0, -60, 230, { pose: { ogen: q > 0.5 ? 'open' : 'blij', blos: true, arm: 'op' }, schaduw: false, rot: -ang * 0.5 + Math.sin(u * 30) * 0.03 * q });
    ctx.restore();
    snelheid(sxs, sys, Math.cos(ang), Math.sin(ang), 5, 300, C.lime, 0.5);
  } else {
    dier(acteurVan(it, 'hamster'), sxs + off * 500, hamY, 260, { pose: { ogen: 'blij', blos: true, arm: 'op' }, rot: off * 8, schaduw: false });
    const r = rng(55);
    for (let k = 0; k < 44; k++) { const x = r() * W, y = -60 + ((off * (600 + r() * 600) + r() * 300) % (H + 120)); ctx.save(); ctx.translate(x, y); ctx.scale(Math.cos(off * 8 + k), 1); circle(0, 0, 26, '#FFD23F'); txt('$', 0, 2, { f: FL, size: 32, color: '#B8860B' }); ctx.restore(); }
  }
  boem('KA-CHING!', W / 2 + 300, 300, u - m.top, { size: 130, kleur: C.lime, schaduw: '#0B5A2A', dur: 0.9 });
  // the ticker and the headline
  rect(0, H - 220, W, 220, '#0B1426');
  rect(0, H - 220, W, 6, C.lime);
  const tk = 'NVDA ▲▲▲   AI ▲▲▲   CHIPS ▲▲   ';
  for (let x = -((u * 260) % measure(tk, font(FM, 30, 700))); x < W; x += measure(tk, font(FM, 30, 700))) txt(tk, x, H - 36, { f: FM, size: 30, weight: 700, color: C.lime, align: 'left' });
  letters(it.kop.toUpperCase(), 80, H - 90, 100, i => ({ s: E.outPop(P(u, 0.1 + i * 0.02, 0.3 + i * 0.02)) }), { schaduw: '#0B5A2A' });
  chip(it);
};

// time-lapse in the queue: the clock spins, day turns to night and back, beards grow;
// at the front the sloth at security stamps one passport, in real time. Then: closed.
SCHETSEN.schiphol = (u, it) => {
  const m = tm(it);
  // hours since we came in: the cards say 2, 7 and 16 hours later
  const knik = [[0, 0], [m.u1, 2], [m.u2, 7], [m.u3, 16], [m.stap, 17]];
  let uur = 17;
  for (let k = 1; k < knik.length; k++) if (u < knik[k][0]) { const [a, ha] = knik[k - 1], [b, hb] = knik[k]; uur = lerp(ha, hb, (u - a) / (b - a)); break; }
  const klok = (14 + uur) % 24;
  // the sky by the hour
  const SKY = [[0, '#141A33'], [5.5, '#141A33'], [7, '#F7A86A'], [9, '#8FC3EA'], [17, '#8FC3EA'], [19, '#F27D52'], [20.5, '#141A33'], [24, '#141A33']];
  const kleur = h => { for (let k = 1; k < SKY.length; k++) if (h <= SKY[k][0]) { const q = (h - SKY[k - 1][0]) / (SKY[k][0] - SKY[k - 1][0]); return mix(SKY[k - 1][1], SKY[k][1], q); } return SKY[0][1]; };
  const nacht = klok > 20.5 || klok < 5.5 ? 1 : klok > 19 ? P(klok, 19, 20.5) : klok < 7 ? 1 - P(klok, 5.5, 7) : 0;
  vgrad(0, H, [[0, '#DDE3EA'], [1, '#AEB8C4']]);
  // the window: the sky racing through the day, planes darting past
  rect(400, 170, W - 400, 400, kleur(klok));
  const zon = (klok - 7) / 12;
  if (zon > 0 && zon < 1) circle(400 + zon * (W - 400), 520 - Math.sin(Math.PI * zon) * 300, 46, '#FFF1B0');
  else { const maan = ((klok + 5) % 24) / 10.5; if (maan > 0 && maan < 1) circle(400 + maan * (W - 400), 520 - Math.sin(Math.PI * maan) * 280, 34, '#E8ECF8'); }
  for (let k = 0; k < 3; k++) { const px = 400 + (((uur * 0.9 + k * 0.37) % 1) * 1900) - 300; poly([[px, 470], [px + 260, 470], [px + 290, 455], [px + 260, 445], [px + 20, 445]], nacht > 0.5 ? '#8A93A8' : '#F4F6F8'); poly([[px + 20, 445], [px + 50, 445], [px + 15, 400], [px, 400]], '#1C5FB8'); }
  for (let x = 400; x <= W; x += 240) rect(x, 170, 14, 400, '#4A5563');
  rect(400, 560, W - 400, 20, '#4A5563');
  // the wall clock, hands spinning
  const cx = 200, cy = 360;
  circle(cx, cy, 130, C.ink); circle(cx, cy, 116, '#FFFFFF');
  for (let k = 0; k < 12; k++) { const a = k * TAU / 12; line(cx + Math.cos(a) * 96, cy + Math.sin(a) * 96, cx + Math.cos(a) * 110, cy + Math.sin(a) * 110, C.ink, 6); }
  const ha = (klok % 12) / 12 * TAU - Math.PI / 2, ma = (klok % 1) * TAU - Math.PI / 2;
  line(cx, cy, cx + Math.cos(ha) * 62, cy + Math.sin(ha) * 62, C.ink, 14); line(cx, cy, cx + Math.cos(ma) * 98, cy + Math.sin(ma) * 98, C.fire, 8); circle(cx, cy, 12, C.ink);
  // the floor
  rect(0, 600, W, H - 600, '#C8CDD3'); rect(0, 600, W, 8, '#9AA0A6');
  // the plant by the queue grows the whole time
  const plant = 40 + uur * 22;
  rect(40, 900, 90, 70, '#B5652B');
  for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.35; ctx.save(); ctx.strokeStyle = '#2F8A3A'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(85, 900); ctx.quadraticCurveTo(85 + Math.cos(a) * plant * 0.4, 900 + Math.sin(a) * plant * 0.6, 85 + Math.cos(a) * plant * 0.8, 900 + Math.sin(a) * plant); ctx.stroke(); ctx.restore(); }
  // security: the scanner, the sloth behind its desk, the stamp coming down at sloth speed
  const lk = acteurVan(it, 'luiaard');
  rect(1290, 650, 380, 250, '#7F8894'); rect(1330, 700, 300, 150, '#2A2F38');
  for (let k = 0; k < 8; k++) rect(1335 + k * 37, 700, 30, 150, '#4A5260', 0.8);
  rect(1250, 890, 460, 22, '#3A3F48');
  const kof = 1250 + P(u, 0, m.stap) * 60;
  rect(kof, 830, 120, 60, '#1C5FB8'); line(kof + 60, 830, kof + 60, 805, '#333', 5);
  dier(lk, 1790, 980, 380, { flip: true, pose: { ogen: Math.floor(u * 0.8) % 2 ? 'dicht' : 'open', arm: 'op' }, rot: 0.04 * Math.sin(u * 0.8) });
  const sp = u < m.stap ? lerp(600, 735, E.inCubic(P(u, 0.2, m.stap))) : 735;
  rect(1690, sp - 60, 24, 60, '#7A4A2A'); rect(1665, sp, 74, 26, C.fire);
  rect(1700, 760, 220, 220, '#5A6270'); rect(1700, 760, 220, 16, '#3A3F48');
  if (u >= m.stap) { ctx.save(); ctx.translate(1702, 742); ctx.rotate(-0.12); sticker('OK', 0, 0, { size: 46, align: 'center', shadow: C.mint }); ctx.restore(); }
  txt('BEVEILIGING', 1480, 630, { f: FL, size: 44, color: '#1A1F28' });
  // the queue: impatient, then sitting, then asleep, then bearded; one step forward; closed
  const keys = ['eenhoorn', 'hond', 'pinguin', 'kip'], wakker = u >= m.stap, dicht = u >= m.dicht;
  const fase2 = uur < 2 ? 0 : uur < 7 ? 1 : 2;
  const stapje = wakker ? 40 * E.outBack(P(u, m.stap, m.stap + 0.25)) : 0;
  for (let i = 3; i >= 0; i--) {
    const x = 1040 - i * 250 + stapje, y = 960, h = 300, k = keys[i];
    rect(x - 150, 880, 90, 80, ['#FF4A1C', '#7B4BFF', '#3DDC97', '#FFD23F'][i]); line(x - 105, 880, x - 105, 850, '#333', 5);
    if (dicht) { acteur(k, 'val', u - m.dicht + i * 0.04, x, y, h, { t0: i }); continue; }
    if (wakker) { acteur(k, 'juich', u - m.stap + 0.2 + i * 0.03, x, y, h, { t0: i }); continue; }
    const tik = Math.floor(u * 7 + i) % 2;
    if (fase2 === 0) dier(k, x, y, h, { pose: { ogen: 'open', poten: tik ? 'a' : 'b' }, rot: Math.sin(u * 9 + i) * 0.04 });
    else if (fase2 === 1) dier(k, x, y, h, { sy: 0.84, sx: 1.06, pose: { ogen: Math.floor(u * 3 + i) % 4 ? 'open' : 'dicht' }, rot: -0.05 });
    else {
      const rot = (i % 2 ? 1 : -1) * 0.22;
      dier(k, x, y, h, { sy: 0.84, sx: 1.06, rot, pose: { ogen: 'dicht' } });
      zzz(x + 30, y - h * 0.8, u + i * 0.3, 0.8);
      if (uur >= 16) {
        // beards
        const e = oogVan(k, x, y, h, false), lang = 60 + 80 * P(u, m.u3, m.u3 + 0.3);
        poly([[e.x - 40, e.y + 40], [e.x + 40, e.y + 40], [e.x + 4, e.y + 40 + lang]], '#F4F4F4');
      }
    }
  }
  // cobwebs, once it's been long enough
  if (uur >= 16 && !wakker) { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { const x0 = 1040 - i * 250 - 40, x1 = x0 - 170; for (let s = 0; s < 4; s++) { ctx.beginPath(); ctx.moveTo(x0, 690 + s * 14); ctx.quadraticCurveTo((x0 + x1) / 2, 730 + s * 20, x1, 690 + s * 14); ctx.stroke(); } } ctx.restore(); }
  // the belt posts in front
  for (let i = 0; i < 5; i++) { const x = 1160 - i * 250; rect(x - 8, 800, 16, 160, '#9AA0A6'); circle(x, 800, 14, '#9AA0A6'); }
  line(160, 816, 1160, 816, C.blue, 10);
  // the shutter comes down
  if (dicht) {
    const q = E.outBounce(P(u, m.dicht, m.dicht + 0.22)), yb = lerp(560, 990, q);
    rect(1240, 560, 680, yb - 560, '#8A929E');
    for (let y = 580; y < yb; y += 34) rect(1240, y, 680, 6, '#6E7680');
    if (q > 0.6) { ctx.save(); ctx.translate(1580, yb - 220); ctx.rotate(-0.05); sticker('GESLOTEN', 0, 0, { size: 104, align: 'center', shadow: C.fire }); ctx.restore(); }
  }
  // night falls on the whole room
  rect(0, 0, W, H, '#0A1030', 0.35 * nacht);
  // the yellow sign, hanging from the ceiling
  const kop = it.kop.toUpperCase(), sw = measure(kop, font(FL, 74)) + 220;
  line(W / 2 - sw / 2 + 60, 0, W / 2 - sw / 2 + 60, 40, '#333', 6); line(W / 2 + sw / 2 - 60, 0, W / 2 + sw / 2 - 60, 40, '#333', 6);
  ctx.save(); ctx.translate(W / 2, 40); ctx.rotate(Math.sin(u * 3) * 0.01);
  rect(-sw / 2, 0, sw, 110, '#FFC917'); ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.strokeRect(-sw / 2, 0, sw, 110);
  rect(-sw / 2 + 20, 15, 80, 80, C.ink);
  ctx.translate(-sw / 2 + 60, 55); ctx.fillStyle = '#FFC917'; ctx.beginPath(); ctx.moveTo(-26, -8); ctx.lineTo(8, -8); ctx.lineTo(8, -24); ctx.lineTo(30, 0); ctx.lineTo(8, 24); ctx.lineTo(8, 8); ctx.lineTo(-26, 8); ctx.fill();
  ctx.restore();
  txt(kop, W / 2 + 50, 98, { f: FL, size: 74, color: '#1A1F28' });
  // the cards: 2 hours later... 7 hours later... 16 hours later...
  [[m.u1, 2], [m.u2, 7], [m.u3, 16]].forEach(([t, n]) => {
    const g = u - t; if (g < 0 || g > 0.5) return;
    const p = E.outPop(P(g, 0, 0.14)), a = 1 - P(g, 0.38, 0.5);
    around(W / 2, 440, p, -0.06 + Math.sin(g * 30) * 0.02, () => sticker(n + ' UUR LATER…', W / 2, 470, { size: 120, align: 'center', fill: C.sun, shadow: C.purple, alpha: a }));
  });
  chip(it, 56, 180);
};

// ================================================================ JUNI
// the thermometer bursts; the penguin melts; the letters drip
SCHETSEN.hitte = (u, it) => {
  const m = tm(it);
  vgrad(0, H, [[0, '#FFB347'], [0.5, '#FF6A2A'], [1, '#B8260E']]);
  rgrad(W * 0.82, 160, 60, 700, [[0, 'rgba(255,255,220,0.9)'], [0.3, 'rgba(255,220,120,0.5)'], [1, 'rgba(255,160,60,0)']], 'lighter');
  circle(W * 0.82, 160, 120 * (1 + 0.04 * beatPulse(u, 8)), '#FFF6D8');
  ctx.save(); ctx.globalAlpha = 0.25; ctx.strokeStyle = '#FFF2C0'; ctx.lineWidth = 3;
  for (let i = 0; i < 14; i++) { const y = 760 + i * 22; ctx.beginPath(); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, y + Math.sin(x / 70 + u * 4 + i) * 6); ctx.stroke(); }
  ctx.restore();
  // the thermometer
  const tx = W / 2 + 250, ty = 300, burst2 = u >= m.barst;
  const lvl = burst2 ? 1 : Math.min(0.92, 0.3 + 0.3 * Math.floor(u / B + 1) * 0.9 + 0.05 * Math.sin(u * 30));
  ctx.save(); ctx.translate(tx, ty); ctx.rotate(burst2 ? Math.sin((u - m.barst) * 40) * 0.05 * Math.exp(-(u - m.barst) * 5) : 0);
  ctx.fillStyle = '#FFFDF5'; ctx.beginPath(); ctx.roundRect(-46, -200, 92, 560, 46); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
  circle(0, 420, 92, '#FFFDF5'); ring(0, 420, 92, C.ink, 8); circle(0, 420, 70, '#D0101A');
  rect(-20, lerp(380, -180, lvl), 40, lerp(0, 560, lvl), '#D0101A');
  for (let k = 0; k < 8; k++) line(20, -150 + k * 60, 40, -150 + k * 60, C.ink, 4);
  ctx.restore();
  if (burst2) {
    const g = u - m.barst, r = rng(31);
    for (let k = 0; k < 30; k++) { const a = -Math.PI / 2 + (r() - 0.5) * 2.4, v = 700 + r() * 900; const x = tx + Math.cos(a) * v * g, y = ty - 200 + Math.sin(a) * v * g + 1600 * g * g; circle(x, y, 10 + r() * 14, '#D0101A'); }
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (r() - 0.5) * 2, v = 600 + r() * 600; ctx.save(); ctx.translate(tx + Math.cos(a) * v * g, ty - 200 + Math.sin(a) * v * g + 1200 * g * g); ctx.rotate(g * 10 + k); poly([[-14, -20], [16, -6], [-4, 22]], '#FFFFFF', 0.9); ctx.restore(); }
    boem('PANG!', tx + 300, ty + 40, g, { size: 130 });
  }
  // the penguin melts into a puddle with its sunglasses on top
  const pk = acteurVan(it, 'pinguin'), melt = E.inOutSine(P(u, 0.2, D - 0.1));
  const px = 520, py = 960, ph = 420;
  ctx.fillStyle = '#1A1A2A'; ctx.beginPath(); ctx.ellipse(px, py + 4, 120 + melt * 140, 20 + melt * 16, 0, 0, TAU); ctx.fill();
  dier(pk, px, py, ph, { sy: 1 - 0.85 * melt, sx: 1 + 0.5 * melt, pose: { ogen: 'dicht' } });
  const e = oogVan(pk, px, py, ph, false);
  const gy = lerp(e.y, py - 30, melt);
  ctx.save(); ctx.translate(e.x - 10, gy); ctx.fillStyle = '#000'; [[-40, -8, 34, 20], [6, -8, 34, 20], [-6, -6, 12, 6]].forEach(([x, y, w, h]) => ctx.fillRect(x, y, w, h)); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-34, -4, 8, 6); ctx.fillRect(12, -4, 8, 6); ctx.restore();
  druppels(px, py - ph * (1 - 0.85 * melt), u, 5);
  // the headline melts too
  const kop = it.kop.toUpperCase();
  letters(kop, W / 2, 210, 130, (i, n) => {
    const p = E.outPop(P(u, i * 0.02, i * 0.02 + 0.2)), sag = E.inCubic(P(u, B * 1.5 + i * 0.03, D));
    return { s: p, sy: p * (1 + 0.25 * sag), py: 0, kleur: C.paper, schaduw: '#B8260E' };
  }, { align: 'center' });
  const L = layout(kop, font(FL, 130)), r2 = rng(13);
  L.chars.forEach((c, i) => { if (c.ch === ' ' || r2() < 0.5) return; const d = E.inCubic(P(u, B * 1.2 + r2() * 0.4, D)) * (80 + r2() * 120), x = W / 2 - L.width / 2 + c.x + c.w * (0.3 + r2() * 0.4); if (d > 2) { rect(x - 7, 225, 14, d, C.paper); circle(x, 225 + d, 12, C.paper); } });
  chip(it);
};

// a cherry tree in time-lapse: days and nights fly by, then it blossoms
SCHETSEN.japan = (u, it) => {
  const m = tm(it);
  const lapse = P(u, m.plant, m.bloei), cyc = lapse * 6;
  const night = lapse > 0 && lapse < 1 ? 0.5 + 0.5 * Math.sin(cyc * TAU) : 0;
  vgrad(0, 700, [[0, `rgb(${lerp(156, 12, night)},${lerp(200, 20, night)},${lerp(238, 60, night)})`], [1, `rgb(${lerp(234, 40, night)},${lerp(244, 50, night)},${lerp(251, 90, night)})`]]);
  if (lapse > 0 && lapse < 1) { const a = (cyc % 1) * Math.PI; circle(W / 2 + Math.cos(a) * -800, 600 - Math.sin(a) * 450, 60, Math.sin(cyc * TAU) > 0 ? '#E8EEFF' : '#FFF2C0'); }
  starsBg(17, 60, night * 0.8, u);
  vgrad(640, H, [[0, '#6FA05A'], [1, '#3D6B34']]);
  // flags
  [[200, 'jp'], [380, 'nl']].forEach(([x, k]) => {
    line(x, 680, x, 220, '#666', 6); const wv = Math.sin(u * 3 + x) * 8;
    if (k === 'jp') { poly([[x, 230], [x + 160, 230 + wv], [x + 160, 330 + wv], [x, 330]], '#FFFFFF'); circle(x + 80, 280 + wv / 2, 32, '#BC002D'); }
    else ['#AE1C28', '#FFFFFF', '#21468B'].forEach((c, i) => poly([[x, 230 + i * 34], [x + 160, 230 + i * 34 + wv], [x + 160, 264 + i * 34 + wv], [x, 264 + i * 34]], c));
  });
  // the tree
  const tx = W * 0.58, ty = 720, grow = E.outCubic(lapse), bloom = E.outPop(P(u, m.bloei, m.bloei + 0.3));
  ctx.save(); ctx.strokeStyle = '#5A3A2A'; ctx.lineCap = 'round';
  const tips = [];
  const branch = (x, y, a, len, w, d) => {
    if (d === 0) return;
    const x2 = x + Math.cos(a) * len * grow, y2 = y + Math.sin(a) * len * grow;
    ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
    if (d <= 2) tips.push([x2, y2]);
    branch(x2, y2, a - 0.45, len * 0.72, w * 0.68, d - 1);
    branch(x2, y2, a + 0.4, len * 0.72, w * 0.68, d - 1);
  };
  if (grow > 0) branch(tx, ty, -Math.PI / 2, 230, 38, 6);
  ctx.restore();
  if (bloom > 0) tips.forEach(([x, y], k) => { for (let q = 0; q < 4; q++) circle(x + Math.cos(q * 1.7 + k) * 24, y + Math.sin(q * 1.3 + k) * 20, 30 * bloom, ['#F7B8CF', '#F4A3C0', '#FFD1E0'][(q + k) % 3], 0.95); });
  // petals blow at the camera
  if (u > m.bloei) { const g = u - m.bloei, r = rng(1917); for (let k = 0; k < 50; k++) { const a = r() * TAU, v = 300 + r() * 900, s = 1 + g * 3 * r(); ctx.save(); ctx.translate(tx + Math.cos(a) * v * g, 350 + Math.sin(a) * v * g * 0.7 + g * g * 200); ctx.rotate(g * 5 + k); ctx.scale(s, s); ctx.fillStyle = '#F7B8CF'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 7, 0, 0, TAU); ctx.fill(); ctx.restore(); } }
  // the squirrel plants it
  ctx.fillStyle = '#4A3226'; ctx.beginPath(); ctx.ellipse(tx, ty + 10, 170, 30, 0, 0, TAU); ctx.fill();
  acteur(acteurVan(it, 'eekhoorn'), u < m.bloei ? 'graaf' : 'juich', u < m.bloei ? u : u - m.bloei + 0.5, tx + 260, ty + 30, 230, { flip: true, t0: 2 });
  // the sign planted in the grass
  const sg = E.outBack(P(u, 0.1, 0.4));
  ctx.save(); ctx.translate(360, 1000); ctx.rotate(-0.04); ctx.scale(1, sg);
  rect(-10, -200, 20, 220, '#7A5230');
  const lines = balans(it.kop.toUpperCase(), font(FL, 62), 560);
  ctx.beginPath(); ctx.roundRect(-320, -210 - lines.length * 70, 640, lines.length * 70 + 40, 10); ctx.fillStyle = '#C8955A'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#5A3A1A'; ctx.stroke();
  lines.forEach((l, i) => txt(l, 0, -210 - lines.length * 70 + 70 + i * 70, { f: FL, size: 62, color: '#3A2208', base: 'alphabetic' }));
  ctx.restore();
  chip(it);
};

// the door of number 10 opens, a moving box walks out, the door slams
SCHETSEN.downing = (u, it) => {
  const m = tm(it);
  rect(0, 0, W, H, '#2A1814');
  for (let r = 0; r < 30; r++) for (let q = 0; q < 26; q++) rect(q * 80 + (r % 2) * 40, r * 36, 74, 30, r % 3 ? '#3A211A' : '#43261D');
  rgrad(W / 2, 360, 100, 1000, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.6)']]);
  const dx = W / 2 - 170, dy = 90, dw = 340, dh = 680;
  rect(dx - 40, dy - 40, dw + 80, dh + 40, '#E9E2D2');
  ctx.fillStyle = '#E9E2D2'; ctx.beginPath(); ctx.arc(W / 2, dy - 40, 210, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#1C1C22'; ctx.beginPath(); ctx.arc(W / 2, dy - 40, 170, Math.PI, 0); ctx.fill();
  rect(dx, dy, dw, dh, '#120C08');
  // the door swings open, then slams
  const open = E.outCubic(P(u, m.open, m.open + 0.3)) * (1 - E.inExpo(P(u, m.dicht - 0.12, m.dicht)));
  const doorW = dw * (1 - 0.82 * open);
  // the box walks out between
  const wq = P(u, m.open + 0.2, m.dicht + 0.4);
  if (wq > 0) {
    const s = lerp(0.5, 3.2, E.inCubic(wq)), bx = lerp(W / 2, W / 2 + 260, E.inCubic(wq)), by = lerp(dy + dh - 40, H + 260, E.inCubic(wq));
    const step = Math.floor(u / (B / 2)) % 2;
    ctx.save(); ctx.translate(bx, by - Math.abs(Math.sin(Math.PI * u / (B / 2))) * 20 * s); ctx.scale(s, s);
    line(-40, 0, -40 - (step ? 20 : -10), 60, '#1A1A1A', 14); line(40, 0, 40 + (step ? -10 : 20), 60, '#1A1A1A', 14);
    rect(-110, -180, 220, 180, '#C8955A'); rect(-110, -180, 220, 20, '#A87540'); line(-110, -110, 110, -110, '#A87540', 4);
    txt('VERHUIZING', 0, -90, { f: FM, size: 20, weight: 700, color: '#5A3A1A', track: 2 });
    rect(-60, -230, 50, 60, '#E9E2D2', 0.9);
    ctx.restore();
  }
  ctx.save(); ctx.translate(dx, dy); rect(0, 0, doorW, dh, '#0B0B0E');
  for (let k = 0; k < 2; k++) for (let q = 0; q < 3; q++) { ctx.strokeStyle = '#1C1C22'; ctx.lineWidth = 6; ctx.strokeRect(30 * doorW / dw + k * 150 * doorW / dw, 30 + q * 210, 130 * doorW / dw, 190); }
  if (doorW > 120) txt('10', doorW / 2, 360, { f: FS, size: 70, weight: 700, color: '#E9E2D2' });
  circle(doorW * 0.85, 460, 20, '#C9A24E');
  ctx.restore();
  if (u > m.dicht) { const g = u - m.dicht; for (let k = 0; k < 12; k++) circle(dx + dw / 2 + (k - 6) * 40, dy + dh - g * 100 - (k % 3) * 20, 20 + g * 60, '#BBB', 0.5 * (1 - P(g, 0, 0.6))); }
  boem('BAM!', W / 2 - 300, 300, u - m.dicht, { size: 140 });
  // the crocodile cries crocodile tears
  acteur(acteurVan(it, 'krokodil'), 'huil', u, 330, FLOOR, 380, { flip: false, t0: 4 });
  ctx.save(); ctx.translate(470, FLOOR - 250); ctx.rotate(Math.sin(u * 12) * 0.5); poly([[0, 0], [90, -20], [100, 50], [10, 60]], '#FFFFFF'); ctx.restore();
  // the newspaper board on the pavement
  ctx.save(); ctx.translate(W - 360, 1050); ctx.rotate(0.03);
  poly([[-190, 0], [-160, -560], [160, -560], [190, 0]], '#2A2A30');
  rect(-150, -540, 300, 500, '#F4EFE4');
  txt('EXTRA', 0, -490, { f: FD, size: 56, color: C.fire });
  const lines = balans(it.kop.toUpperCase(), font(FD, 96), 260);
  lines.forEach((l, i) => txt(l, 0, -360 + i * 100, { f: FD, size: Math.min(96, 260 / (measure(l, font(FD, 100)) / 100)), color: C.ink }));
  ctx.restore();
  chip(it);
};
