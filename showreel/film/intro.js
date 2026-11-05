/*
 * The cold open and the intro: one bar each. The tv switches on and the penguin
 * anchor taps the microphone; the year loads, gets stuck at 99% until the hippo
 * bumps it; 2026 bangs in with every maatje; 365 days; one lap around the sun in a
 * hamster ball; the year in numbers (and how much of it the sloth slept).
 *
 * The intro scenes keep the choreography of the first 15-second cut (128 BPM),
 * stretched to fill one bar at the chapter's tempo.
 */
const OB = 60 / 128, OBAR = 4 * OB;
let K = BAR / OBAR;
const oPulse = (t, k = 7) => { const u = ((t % OB) + OB) % OB; return Math.exp(-u * k); };

// ---- 0 · staat dit aan?
function studio(lt, a = 1) {
  // the BJ Journaal studio: a blue wall, the logo, the desk
  vgrad(0, H, [[0, '#1B2A8A'], [1, '#0B1150']]);
  rgrad(W / 2, H * 0.4, 50, 900, [[0, 'rgba(120,150,255,0.45)'], [1, 'rgba(0,0,0,0)']]);
  for (let i = 0; i < 9; i++) rect(80 + i * 220, 120, 150, 520, '#FFFFFF', 0.035);
  ctx.save(); ctx.globalAlpha = 0.25; globe(W / 2, 360, 300, lt * 30, 0.35, C.paper, 1); ctx.restore();
  rect(W / 2 - 260, 90, 520, 110, C.fire);
  txt('BJ JOURNAAL', W / 2, 150, { f: FL, size: 76, color: C.paper });
}
function bureau(y, w = 1500) {
  poly([[W / 2 - w / 2, y], [W / 2 + w / 2, y], [W / 2 + w / 2 - 60, H + 10], [W / 2 - w / 2 + 60, H + 10]], '#0A0D2A');
  rect(W / 2 - w / 2, y, w, 22, C.fire);
  rect(W / 2 - w / 2, y + 22, w, 8, '#FF9A7A', 0.5);
}
function sTv(lt) {
  const t = lt;
  rect(0, 0, W, H, '#000');
  // the tube warms up: a dot, a line, the picture
  const lineP = E.outExpo(P(t, 0.04, 0.16)), openP = E.outExpo(P(t, 0.14, 0.32));
  if (lineP <= 0) { circle(W / 2, H / 2, 4, '#FFFFFF', P(t, 0, 0.04)); return; }
  const hh = Math.max(4, H * openP);
  ctx.save();
  ctx.beginPath(); ctx.rect(W / 2 - W / 2 * lineP, H / 2 - hh / 2, W * lineP, hh); ctx.clip();
  studio(t);
  // the anchor behind the desk
  const g = t - 0.3;
  const tik = [B * 1, B * 1.5];
  const lean = tik.reduce((s, tk) => s + Math.exp(-Math.pow((t - tk) / 0.07, 2)), 0);
  const schrik = P(t, B * 3.55, B * 3.7);
  acteur('pinguin', 'none', Math.max(0, g), W / 2 - 40, 1010 - schrik * 60, 640, { t0: 0.3, pose: { ogen: schrik > 0 ? 'open' : t > B * 2 && t < B * 2.4 ? 'dicht' : 'open', arm: schrik > 0 ? 'op' : 'neer', vleugel: schrik > 0 ? 'op' : 'neer' } });
  bureau(800);
  // the microphone, tapped twice
  const mx = W / 2 + 230, my = 800;
  ctx.save(); ctx.translate(mx, my); ctx.rotate(-0.25 - lean * 0.12);
  rect(-8, -150, 16, 150, '#2A2A33'); ctx.beginPath(); ctx.ellipse(0, -170, 30, 40, 0, 0, TAU); ctx.fillStyle = '#1A1A22'; ctx.fill();
  for (let k = -2; k <= 2; k++) line(-24, -170 + k * 12, 24, -170 + k * 12, '#4A4A58', 3);
  ctx.restore();
  tik.forEach(tk => { const q = P(t, tk, tk + 0.3); if (q > 0 && q < 1) sticker('TIK', mx + 60 + q * 30, my - 210 - q * 40, { size: 64, shadow: C.fire, alpha: 1 - q }); });
  ballon('STAAT DIT AAN?', W / 2 + 60, 380, t - B * 2.1, { side: -1, size: 64 });
  if (schrik > 0) uitroep(W / 2 + 20, 300, 1.4);
  // scanlines and a little roll on the old tube
  ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = '#000'; for (let y = (t * 60) % 4; y < H; y += 4) ctx.fillRect(0, y, W, 2); ctx.restore();
  ctx.restore();
  if (openP < 1) rect(0, H / 2 - hh / 2, W, hh, '#FFFFFF', 1 - openP);
}

// ---- 1 · het aftellen: 2025 laadt, blijft op 99% hangen, het nijlpaard botst ertegen
const REEL_TARGET = [2, 0, 2, 5];
const BOTS = 1.46; // when the hippo bumps the last digit
function reelV(i, t) {
  const p = E.outExpo(P(t, 0.25, 0.95 + 0.14 * i));
  let v = REEL_TARGET[i] - (i + 1) * 10 * (1 - p);
  if (i === 3) v += E.outBack(P(t, BOTS, BOTS + 0.2)) + (t > 1.0 && t < BOTS ? 0.08 * Math.sin(t * 70) * P(t, 1.0, 1.1) : 0);
  return v;
}
function drawReelColumn(cx, cy, size, v, vPrev, color) {
  const dh = size * 1.02;
  const n = Math.min(10, 1 + Math.ceil(Math.abs(v - vPrev) * 4));
  for (let s = 0; s < n; s++) {
    const vv = n === 1 ? v : lerp(vPrev, v, (s + 1) / n);
    const base = Math.floor(vv), frac = vv - base;
    ctx.save();
    ctx.globalAlpha *= n === 1 ? 1 : Math.min(1, 1.7 / n);
    for (let k = -1; k <= 1; k++) digits(String(((base + k) % 10 + 10) % 10), cx, cy + (k - frac) * dh, size, color);
    ctx.restore();
  }
}
function sRol(lt) {
  const t = lt / K;
  rect(0, 0, W, H, C.ink);
  const grow = E.outExpo(P(t, 0.02, 0.55));
  const open = E.outExpo(P(t, 0.28, 0.72));
  const blow = E.inExpo(P(t, 1.62, OBAR));
  const gap = lerp(2, 400, open) + blow * 1400;
  const len = 1500 * grow;
  const yT = H / 2 - gap / 2, yB = H / 2 + gap / 2;
  ctx.save();
  ctx.globalAlpha = 0.18 * open * (1 - blow);
  for (let x = -((t * 240) % 40); x < W; x += 40) line(x, yT - 14, x, yT - (Math.round((x + t * 240) / 40) % 5 === 0 ? 34 : 22), C.paper, 1);
  for (let x = -((t * 180) % 40) + 20; x < W; x += 40) line(x, yB + 14, x, yB + 24, C.paper, 1);
  ctx.restore();
  line(W / 2 - len / 2, yT, W / 2 + len / 2, yT, C.paper, 2);
  line(W / 2 - len / 2, yB, W / 2 + len / 2, yB, C.paper, 2);
  ctx.save();
  clipRect(0, yT + 1, W, gap - 2);
  const g = E.inExpo(P(t, 1.66, OBAR));
  const size = lerp(300, 880, g), sp = DIGW * 300 * 1.12;
  for (let i = 0; i < 4; i++) {
    const x = lerp(W / 2 + (i - 1.5) * sp, W / 8 * (2 * i + 1), g);
    drawReelColumn(x, H / 2, size, reelV(i, t), reelV(i, t - 1 / FPS / K), i === 3 && t > 1.0 && t < BOTS ? C.sun : C.paper);
  }
  ctx.restore();
  const la = open * (1 - blow);
  const stuck = t > 0.95 && t < BOTS;
  txt(stuck ? 'HET JAAR WORDT GELADEN… NOG EVEN…' : 'HET JAAR WORDT GELADEN', W / 2 - 750, yT - 58, { f: FM, size: 20, align: 'left', track: 6, alpha: la });
  txt('Δ +1', W / 2 + 750, yT - 58, { f: FM, size: 20, align: 'right', track: 4, alpha: la * P(t, BOTS, BOTS + 0.04), color: C.fire });
  const pct = t >= BOTS ? 100 : Math.min(99, Math.round(100 * E.outExpo(P(t, 0.25, 1.0))));
  const blinkt = stuck && Math.floor(t * 8) % 2;
  txt(`LADEN ${String(pct).padStart(3, ' ')}%`, W / 2 + 750, yB + 60, { f: FM, size: 20, align: 'right', track: 6, alpha: la * (blinkt ? 0.35 : 1), color: stuck ? C.sun : C.paper });
  rect(W / 2 - 750, yB + 52, 300 * pct / 100, 6, stuck ? C.sun : C.fire, la);
  line(W / 2 - 750, yB + 55, W / 2 - 450, yB + 55, C.paper, 1, la * 0.4);
  // the hippo stomps in from the right and bumps the stuck digit
  const dx = W / 2 + 1.5 * sp + 150;
  const walk = P(t, 0.95, BOTS), back = E.outCubic(P(t, BOTS, BOTS + 0.25));
  const hx = lerp(W + 260, dx + 40, E.inCubic(walk)) + back * 120 + blow * 900;
  if (t > 0.95) {
    dier('nijlpaard', hx, H / 2 + 230 + blow * 600, 360, { flip: true, pose: { poten: Math.floor(t * 12) % 2 ? 'a' : 'b', ogen: t > BOTS ? 'dicht' : 'open' }, rot: t > BOTS ? 0.12 * Math.exp(-(t - BOTS) * 6) * Math.sin((t - BOTS) * 40) : 0, schaduw: false });
    if (t > BOTS) {
      const q = P(t, BOTS, BOTS + 0.25);
      sticker('BONK!', dx - 60, H / 2 - 170 - q * 30, { size: 110 * E.outPop(P(t, BOTS, BOTS + 0.1)), shadow: C.fire, align: 'center', alpha: 1 - blow });
      sterretjes(hx - 40, H / 2 - 60, t, 90);
    }
  }
}

// ---- 2 · de knal: 2026, en alle maatjes springen erin
const S2COL = [C.fire, C.paper, C.blue, C.fire];
const S2INK = [C.ink, C.ink, C.paper, C.ink];
function sKnal(lt) {
  const t = lt / K;
  const cols = [0, 1, 2, 3].map(i => ({ x: W / 8 * (2 * i + 1), y: H / 2 }));
  const size = 880, b3 = t >= 3 * OB;
  const zp = P(t, 3 * OB, OBAR);
  const zs = Math.pow(70, E.inCubic(zp));
  const zc = cols[1];
  ctx.save();
  if (b3) {
    ctx.translate(lerp(zc.x, W / 2, E.inOutCubic(zp)), lerp(zc.y, H / 2, E.inOutCubic(zp)));
    ctx.scale(zs, zs); ctx.translate(-zc.x, -zc.y);
  }
  rect(-W, -H, W * 3, H * 3, b3 ? C.paper : C.ink);
  if (!b3) {
    const swap = t >= OB ? 1 : 0;
    const retract = E.inExpo(P(t, 2 * OB, 2 * OB + 0.34));
    for (let i = 0; i < 4; i++) {
      const ci = (i + swap) % 4;
      const hh = H * E.outExpo(P(t, 0.025 * i, 0.3 + 0.025 * i));
      const up = retract > 0 ? P(t, 2 * OB + 0.04 * i, 2 * OB + 0.26 + 0.04 * i) : 0;
      const x0 = W / 4 * i, top = H - hh - E.inExpo(up) * H * 1.05;
      rect(x0, top, W / 4 + 1, hh, S2COL[ci]);
      ctx.save();
      ctx.beginPath(); ctx.rect(x0, 0, W / 4, H); ctx.clip();
      drawKnalDigit(i, cols[i], size, C.paper, t);
      ctx.beginPath(); ctx.rect(x0, top, W / 4, hh); ctx.clip();
      drawKnalDigit(i, cols[i], size, S2INK[ci], t);
      ctx.restore();
    }
    const ep = P(t, 2 * OB, 3 * OB);
    if (ep > 0) {
      for (let k = 1; k <= 5; k++) {
        const s = 1 + k * 0.07 * E.outExpo(ep);
        ctx.save();
        ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
        ctx.globalAlpha = (1 - ep) * (0.6 - k * 0.1);
        for (let i = 0; i < 4; i++) digits('2026'[i], cols[i].x, cols[i].y, size, k % 2 ? C.fire : C.paper, { stroke: 3 / s });
        ctx.restore();
      }
    }
  } else {
    for (let i = 0; i < 4; i++) digits('2026'[i], cols[i].x, cols[i].y, size, C.ink);
  }
  // every maatje leaps up in front, arms in the air
  if (t > 0.05) {
    const r = rng(2026);
    const n = 13;
    for (let k = 0; k < n; k++) {
      const key = BENDE[k], x = 80 + k * (W - 160) / (n - 1) + (r() - 0.5) * 40, h = 230 + r() * 90;
      const g = t * K - 0.05 - (k % 4) * 0.035 - r() * 0.04;
      if (g < 0) continue;
      acteur(key, 'juich', g, x, H + 30 - (k % 2) * 40, h, { flip: x > W / 2, t0: k });
    }
    const cp = P(t, 0.05, 1.2);
    if (cp > 0 && cp < 1) confettiKanon(t - 0.05, [C.fire, C.sun, C.blue, C.pink, C.paper, C.mint]);
  }
  ctx.restore();
  const fl = b3 ? Math.exp(-(t - 3 * OB) * 16) : t < 0.06 ? 1 - t / 0.06 : 0;
  if (fl > 0.01) rect(0, 0, W, H, '#fff', fl * 0.6);
}
function drawKnalDigit(i, c, size, color, t) {
  const ch = '2026'[i];
  const g = t >= OB ? Math.exp(-(t - OB) * 8) : 0;
  if (g < 0.02) { digits(ch, c.x, c.y, size, color); return; }
  const bands = 9, top = c.y - capH(size) / 2 - 20, bh = (capH(size) + 40) / bands;
  for (let b = 0; b < bands; b++) {
    const off = 140 * Math.sin(b * 2.3 + i * 1.7) * g * (b % 2 ? 1 : -1);
    ctx.save();
    ctx.beginPath(); ctx.rect(c.x - 400, top + b * bh, 800, bh + 1); ctx.clip();
    ctx.globalAlpha *= 0.85;
    digits(ch, c.x + off - 18 * g, c.y, size, C.fire);
    digits(ch, c.x + off + 18 * g, c.y, size, C.blue);
    ctx.globalAlpha = 1;
    digits(ch, c.x + off, c.y, size, color);
    ctx.restore();
  }
}
// confetti fired from both bottom corners; k: seconds since the bang
function confettiKanon(k, cols, n = 140, seed = 9) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1; // the left or the right corner
    const v = 1500 + r() * 1100, a = 0.15 + r() * 0.6, spin = 8 + r() * 10, flip = 10 + r() * 12;
    const x = (side < 0 ? 40 : W - 40) - side * Math.sin(a) * v * 0.6 * k;
    const y = H - Math.cos(a) * v * k + 1400 * k * k;
    if (y > H + 40) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(k * spin + i); ctx.scale(1, Math.cos(k * flip + i));
    ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-9, -5, 18, 10); ctx.restore();
  }
}

// ---- 3 · 365 dagen
const GRID = { pitch: 30, cell: 24, cols: 53 };
GRID.x0 = (W - GRID.cols * GRID.pitch) / 2 + 3;
GRID.y0 = 590;
const DAY_LEVEL = (() => { const r = rng(2026); return Array.from({ length: 365 }, () => Math.floor(Math.pow(r(), 1.3) * 5)); })();
const LEVEL_COL = ['#DCD4C4', '#FFC3A6', '#FF9166', '#FF6A3D', C.fire];
const ORBIT = { cx: W / 2, cy: H / 2 + 40, rx: 640, ry: 230 };
const ORBIT_ROT = t => lerp(-0.12, 0.05, t / OBAR);
const dayAngle = d => Math.PI / 2 + TAU * d / 365;
function orbitPos(a, rot, scale = 1) {
  const x0 = Math.cos(a) * ORBIT.rx * scale, y0 = Math.sin(a) * ORBIT.ry * scale;
  return { x: ORBIT.cx + x0 * Math.cos(rot) - y0 * Math.sin(rot), y: ORBIT.cy + x0 * Math.sin(rot) + y0 * Math.cos(rot), depth: Math.sin(a) };
}
function gridPos(d) {
  const c = Math.floor((d + JAN1_WEEKDAY) / 7), r = (d + JAN1_WEEKDAY) % 7;
  return { col: c, row: r, x: GRID.x0 + c * GRID.pitch, y: GRID.y0 + r * GRID.pitch };
}
const LAST = 364; // oudejaarsdag
function sRaster(lt) {
  const t = lt / K;
  rect(0, 0, W, H, C.paper);
  const exitP = E.inOutExpo(P(t, 3 * OB - 0.02, OBAR - 0.06));
  const portal = E.inOutExpo(P(t, 3 * OB - 0.08, OBAR - 0.1)) * 1200;
  if (portal > 0) circle(ORBIT.cx, ORBIT.cy, portal, C.ink);
  const punch = 1 + 0.012 * oPulse(t, 9) * (1 - exitP);
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(punch, punch); ctx.translate(-W / 2, -H / 2);
  const out = 1 - P(t, 3 * OB - 0.1, 3 * OB + 0.05);
  const hy = E.inExpo(P(t, 3 * OB - 0.1, 3 * OB + 0.25)) * -420;
  ctx.save();
  clipRect(0, 150, W, 330);
  const cnt = Math.round(365 * E.outExpo(P(t, 0.05, 1.0)));
  const rise = (1 - E.outExpo(P(t, 0, 0.35))) * 320;
  txt(String(cnt).padStart(3, '0'), GRID.x0 - 8, 440 + rise + hy, { f: FD, size: 300, color: C.ink, align: 'left', base: 'alphabetic' });
  const lw = layout('365', font(FD, 300)).width;
  txt('DAGEN', GRID.x0 + lw + 30, 330 + rise * 1.3 + hy, { f: FL, size: 86, color: C.ink, align: 'left', base: 'alphabetic' });
  txt('53 WEKEN · BEGON OP EEN DONDERDAG', GRID.x0 + lw + 34, 390 + rise * 1.6 + hy, { f: FM, size: 22, color: C.ink, align: 'left', track: 3, alpha: 0.7 });
  txt('VANAVOND IS DE LAATSTE', GRID.x0 + lw + 34, 432 + rise * 1.9 + hy, { f: FM, size: 22, weight: 700, color: C.fire, align: 'left', track: 3, alpha: P(t, 0.9, 1.1) });
  ctx.restore();
  for (let m = 0; m < 12; m++) {
    const g = gridPos(MONTH_START[m]);
    const a = P(t, 0.1 + m * 0.035, 0.3 + m * 0.035) * out;
    txt(MND[m], g.x + (g.row > 0 ? GRID.pitch : 0), GRID.y0 - 34 + (1 - a) * 14, { f: FM, size: 17, color: C.ink, align: 'left', alpha: a, track: 2 });
  }
  const rot0 = ORBIT_ROT(0);
  for (let d = 0; d < 365; d++) {
    const g = gridPos(d);
    const delay = 0.02 + g.col * 0.011 + g.row * 0.025;
    const s = E.outPop(P(t, delay, delay + 0.22));
    if (s <= 0) continue;
    const o = orbitPos(dayAngle(d), rot0);
    const cx = lerp(g.x + GRID.cell / 2, o.x, exitP), cy = lerp(g.y + GRID.cell / 2, o.y, exitP);
    const sz = lerp(GRID.cell, 5 + 2 * (o.depth + 1) / 2, exitP) * s;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cx - sz / 2, cy - sz / 2, sz, sz, lerp(4, sz / 2, exitP));
    if (d === LAST) ctx.fillStyle = exitP > 0.5 ? C.paper : C.ink;
    else { ctx.fillStyle = exitP > 0.5 ? C.paper : LEVEL_COL[DAY_LEVEL[d]]; ctx.globalAlpha = lerp(1, 0.55, exitP); }
    ctx.fill();
    ctx.restore();
  }
  const tg = gridPos(LAST);
  const ta = P(t, 0.95, 1.1) * out;
  if (ta > 0) {
    const tx = tg.x + GRID.cell / 2, ty = tg.y + GRID.cell / 2;
    const pr = (t * 2) % 1;
    ring(tx, ty, 16 + pr * 30, C.fire, 3, ta * (1 - pr));
    // the dog found tonight on the calendar
    const g = (t - 0.95) * K;
    const hd = acteur('hond', 'juich', g, tx - 120, GRID.y0 - 50, 170, { flip: false, t0: 3 });
    if (hd) ballon('VANAVOND!', hd.x, hd.y, g - 0.12, { size: 48, side: 1 });
  }
  ctx.restore();
}

// ---- 4 · één rondje zon (in een hamsterbal, met een zonnebril)
function sBaan(lt) {
  const t = lt / K;
  rect(0, 0, W, H, C.ink);
  const rot = ORBIT_ROT(t);
  const ed = 365 * E.inOutCubic(P(t, 0.22, 1.42));
  const sunGrow = E.outBack(P(t, 0.0, 0.42));
  const fill = Math.pow(34, E.inCubic(P(t, 3 * OB + 0.02, OBAR)));
  const sunR = 80 * sunGrow * (1 + 0.07 * oPulse(t, 8)) * fill;
  const ep = orbitPos(dayAngle(ed), rot);
  const sr = rng(44);
  for (let i = 0; i < 140; i++) {
    const x = sr() * W, y = sr() * H, s = sr();
    circle(((x - t * 30 * s) % W + W) % W, y, 0.6 + s * 1.3, C.paper, 0.15 + 0.35 * s);
  }
  const drawDots = back => {
    for (let d = 0; d < 365; d++) {
      const o = orbitPos(dayAngle(d), rot);
      if ((o.depth < 0) !== back) continue;
      const r = 2.5 + 1.2 * (o.depth + 1);
      if (d <= ed) { const glow = Math.exp(-(ed - d) / 12); circle(o.x, o.y, r + glow * 3, ed - d < 1 ? C.paper : C.fire, 0.55 + 0.45 * glow); }
      else circle(o.x, o.y, r, C.paper, 0.45);
    }
  };
  const drawEarth = () => {
    if (ed <= 0.01 || ed >= 364.99) return;
    const er = 40 + 18 * (ep.depth + 1) / 2;
    ctx.save(); ctx.strokeStyle = C.blue; ctx.lineCap = 'round';
    for (let k = 0; k < 24; k++) {
      const a1 = orbitPos(dayAngle(ed - k * 1.6), rot), a2 = orbitPos(dayAngle(ed - (k + 1) * 1.6), rot);
      ctx.globalAlpha = (1 - k / 24) * 0.6; ctx.lineWidth = er * 0.9 * (1 - k / 24);
      ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y); ctx.stroke();
    }
    ctx.restore();
    // the hamster runs the year round in its ball
    circle(ep.x, ep.y, er, '#7FB2FF', 0.35);
    dier('hamster', ep.x, ep.y + er * 0.78, er * 1.5, { flip: ep.depth > 0, pose: { poten: Math.floor(t * 16) % 2 ? 'a' : 'b', ogen: 'blij' }, schaduw: false, dy: -Math.abs(Math.sin(t * 25)) * 4 });
    ring(ep.x, ep.y, er, '#DDEBFF', 4, 0.9);
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(ep.x, ep.y, er * 0.78, -2.4, -1.7); ctx.stroke(); ctx.restore();
  };
  const drawSun = () => {
    if (sunR <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(ORBIT.cx, ORBIT.cy, sunR * 0.6, ORBIT.cx, ORBIT.cy, sunR * 4);
    g.addColorStop(0, 'rgba(255,90,40,0.55)'); g.addColorStop(1, 'rgba(255,74,28,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    const g2 = ctx.createRadialGradient(ORBIT.cx - sunR * 0.3, ORBIT.cy - sunR * 0.3, 0, ORBIT.cx, ORBIT.cy, sunR);
    g2.addColorStop(0, '#FFB27A'); g2.addColorStop(1, C.fire);
    ctx.fillStyle = fill > 3 ? C.fire : g2;
    ctx.beginPath(); ctx.arc(ORBIT.cx, ORBIT.cy, sunR, 0, TAU); ctx.fill();
    // cool: the sunglasses drop in on the second beat
    if (fill < 3) {
      const d = E.outBounce(P(t, OB * 1, OB * 1.5));
      const gy = lerp(ORBIT.cy - 420, ORBIT.cy - sunR * 0.12, d), s = sunR / 80, px = 7 * s;
      if (d > 0) {
        ctx.save(); ctx.translate(ORBIT.cx, gy); ctx.fillStyle = '#000';
        const lens = [[-9, 0], [-8, 0], [-7, 0], [-6, 0], [-5, 0], [-4, 0], [-1, 0], [0, 0], [1, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0]];
        lens.forEach(([x, y]) => ctx.fillRect(x * px, y * px, px, px));
        [[-8, 1], [-7, 1], [-6, 1], [-5, 1], [-4, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [-7, 2], [-6, 2], [-5, 2], [4, 2], [5, 2], [6, 2]].forEach(([x, y]) => ctx.fillRect(x * px, y * px, px, px));
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-7 * px, 1 * px, px, px); ctx.fillRect(4 * px, 1 * px, px, px);
        ctx.restore();
        // and a smile
        ctx.save(); ctx.strokeStyle = '#8E1A06'; ctx.lineWidth = 6 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(ORBIT.cx, ORBIT.cy + 10 * s, 34 * s, 0.35, Math.PI - 0.35); ctx.stroke(); ctx.restore();
      }
    }
  };
  drawDots(true); if (ep.depth < 0) drawEarth(); drawSun(); drawDots(false); if (ep.depth >= 0) drawEarth();
  const tf = 1 - P(t, 3 * OB, 3 * OB + 0.15);
  for (let m = 0; m < 12; m++) {
    const o = orbitPos(dayAngle(MONTH_START[m]), rot, 1.16);
    const on = ed >= MONTH_START[m];
    txt(MND[m], o.x, o.y, { f: FM, size: 17, color: on ? C.fire : C.paper, alpha: P(t, 0.1 + m * 0.02, 0.3 + m * 0.02) * tf * (on ? 1 : 0.4), track: 2, weight: on ? 700 : 400 });
  }
  ctx.save(); ctx.globalAlpha = tf;
  clipRect(0, 90, W, 260);
  sticker('1 RONDJE ZON', 110, 300 + (1 - E.outPop(P(t, 0.1, 0.5))) * 240, { size: 170, shadow: C.fire });
  ctx.restore();
  const ta = P(t, 0.25, 0.45) * tf;
  txt('AFGELEGDE AFSTAND', W - 110, H - 250, { f: FM, size: 18, color: C.paper, align: 'right', alpha: ta * 0.6, track: 4 });
  txt(nl(940e6 * ed / 365) + ' KM', W - 110, H - 200, { f: FM, size: 50, weight: 700, color: C.fire, align: 'right', alpha: ta });
  txt('(ALLEMAAL GERED DOOR ÉÉN HAMSTER)', W - 110, H - 150, { f: FM, size: 16, color: C.paper, align: 'right', alpha: ta * 0.5 * P(t, 0.8, 1.0), track: 3 });
}
E.outBounce = t => { const n1 = 7.5625, d1 = 2.75; if (t < 1 / d1) return n1 * t * t; if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75; if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375; return n1 * (t -= 2.625 / d1) * t + 0.984375; };

// ---- 5 · in getallen (en hoeveel daarvan de luiaard sliep)
const GET = [
  { n: '8.760', u: 'UUR', k: '24 × 365', bg: C.fire, fg: C.ink },
  { n: '525.600', u: 'MINUTEN', k: '60 × 8.760', bg: C.ink, fg: C.fire },
  { n: '31.536.000', u: 'SECONDEN', k: '60 × 525.600', bg: C.paper, fg: C.ink },
  { n: '2.920', u: 'UUR GESLAPEN', k: 'ACHT PER NACHT · DE LUIAARD: 7.300', bg: C.blue, fg: C.paper },
];
const GET_SIZE = 330;
function drawGetal(k, u) {
  const s = GET[k];
  rect(0, 0, W, H, s.bg);
  const cy = H / 2 - 50;
  const L = layout(s.n, font(FD, GET_SIZE));
  const x0 = W / 2 - L.width / 2 - (k === 3 ? 260 : 0);
  txt(s.k, k === 3 ? x0 + L.width / 2 : W / 2, cy - capH(GET_SIZE) / 2 - 60, { f: FM, size: 24, color: s.fg, alpha: P(u, 0.05, 0.2) * 0.8, track: 8 });
  if (k === 0) {
    L.chars.forEach((c, i) => {
      const p = P(u, 0.03 * i, 0.03 * i + 0.32);
      ctx.save(); ctx.globalAlpha = P(u, 0.03 * i, 0.03 * i + 0.08);
      digits(c.ch, x0 + c.x + c.w / 2, cy - (1 - E.outBack(p)) * 520, GET_SIZE, s.fg);
      ctx.restore();
    });
  } else if (k === 1) {
    L.chars.forEach((c, i) => {
      const p = E.outExpo(P(u, 0.02 * i, 0.02 * i + 0.4));
      ctx.save();
      ctx.translate(x0 + c.x + c.w / 2 + (1 - p) * 900, cy); ctx.transform(1, 0, -0.35 * (1 - p), 1, 0, 0);
      ctx.globalAlpha = P(u, 0.02 * i, 0.02 * i + 0.06);
      digits(c.ch, 0, 0, GET_SIZE, s.fg);
      ctx.restore();
    });
  } else if (k === 2) {
    ctx.save();
    clipRect(0, cy - capH(GET_SIZE) / 2 - 8, W, capH(GET_SIZE) + 16);
    L.chars.forEach((c, i) => {
      const cx = x0 + c.x + c.w / 2;
      if (c.ch === '.') { digits('.', cx, cy, GET_SIZE, s.fg, { alpha: P(u, 0.2, 0.3) }); return; }
      const vf = uu => +c.ch - (2 + i) * 10 * (1 - E.outExpo(P(uu, 0, 0.22 + 0.028 * i)));
      drawReelColumn(cx, cy, GET_SIZE, vf(u), vf(u - 1 / FPS / K), s.fg);
    });
    ctx.restore();
  } else {
    // the sloth, fast asleep next to its number
    L.chars.forEach((c, i) => {
      const p = E.outPop(P(u, 0.02 * i, 0.02 * i + 0.3));
      ctx.save(); ctx.translate(x0 + c.x + c.w / 2, cy); ctx.scale(p, p); digits(c.ch, 0, 0, GET_SIZE, s.fg); ctx.restore();
    });
    acteur('luiaard', 'slaap', u * K - 0.05, W - 420, cy + 180, 420, { flip: true, t0: 2 });
  }
  const tr = 22, UL = layout(s.u, font(FS, 64, 700));
  const uw = UL.width + tr * (s.u.length - 1);
  const ux = k === 3 ? x0 + L.width / 2 : W / 2;
  ctx.save();
  clipRect(0, cy + capH(GET_SIZE) / 2 + 60, W, 100);
  s.u.split('').forEach((ch, i) => {
    const p = E.outExpo(P(u, 0.12 + i * 0.018, 0.4 + i * 0.018));
    txt(ch, ux - uw / 2 + UL.chars[i].x + tr * i, cy + capH(GET_SIZE) / 2 + 140 + (1 - p) * 100, { f: FS, size: 64, weight: 700, color: s.fg, align: 'left', base: 'alphabetic' });
  });
  ctx.restore();
}
function sGetallen(lt) {
  const t = lt / K;
  const k = Math.min(3, Math.floor(t / OB));
  const u = t - k * OB;
  const wp = E.inOutCubic(P(u, 0, 0.2));
  if (k > 0 && wp < 1) drawGetal(k - 1, OB);
  ctx.save();
  if (k > 0 && wp < 1) {
    ctx.beginPath();
    if (k === 1) { const x = lerp(-500, W + 500, wp); ctx.moveTo(-600, 0); ctx.lineTo(x + 250, 0); ctx.lineTo(x - 250, H); ctx.lineTo(-600, H); }
    else if (k === 2) { for (let i = 0; i < 6; i++) { const q = E.inOutCubic(P(u, i * 0.02, 0.1 + i * 0.02)); ctx.rect(W / 6 * i, 0, W / 6 + 1, H * q); } }
    else ctx.arc(W / 2, H / 2 - 50, 1150 * wp, 0, TAU);
    ctx.clip();
  }
  drawGetal(k, u);
  ctx.restore();
  if (k === 1 && wp > 0 && wp < 1) {
    const x = lerp(-500, W + 500, wp);
    ctx.save(); ctx.fillStyle = C.lime; ctx.beginPath();
    ctx.moveTo(x + 250, 0); ctx.lineTo(x + 290, 0); ctx.lineTo(x - 210, H); ctx.lineTo(x - 250, H); ctx.fill(); ctx.restore();
  }
}
