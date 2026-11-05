// ================================================== THE DRAWN BACKDROPS
// The pieces that sketches and scenes share: a crowd, confetti, camera flashes,
// light beams, stars and canal-house gables, and the few full backdrops a sketch
// builds on (the eclipse, the quiet New Year's Eve city with its sparkler, the test
// card). BEELD.default is the plain globe behind a headline whose photo or clip is
// missing. u runs from 0 to D seconds (the shot's length).
// heads and shoulders; hands up when `hands`, phone lights when `phones`
function crowd(y, c, seed, u, o = {}) {
  const r = rng(seed), n = o.n || 34, s = o.scale || 1;
  for (let i = 0; i < n; i++) {
    const x = (i + r() * 0.6) * (W + 120) / n - 60, hh = (40 + r() * 16) * s;
    const bob = Math.abs(Math.sin(Math.PI * (u / B) + r() * 0.9)) * (o.bounce || 8) * 1.6 * s;
    const yy = y - bob + r() * 18 * s;
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(x, yy + hh * 1.35, hh * 1.05, hh * 0.9, 0, Math.PI, 0); ctx.lineTo(x + hh * 1.05, H + 50); ctx.lineTo(x - hh * 1.05, H + 50); ctx.fill();
    ctx.beginPath(); ctx.arc(x, yy + hh * 0.35, hh * 0.52, 0, TAU); ctx.fill();
    if (o.hands && r() < 0.5) {
      const side = r() < 0.5 ? -1 : 1, wave = Math.sin(Math.PI * u / B + i) * 0.3;
      ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = hh * 0.28; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + side * hh * 0.7, yy + hh * 1.3); ctx.lineTo(x + side * hh * (0.9 + wave), yy - hh * 0.8); ctx.stroke(); ctx.restore();
      if (o.phones && r() < 0.6) { circle(x + side * hh * (0.9 + wave), yy - hh * 0.95, hh * 0.22, '#FFF6D8', 0.9); rgrad(x + side * hh * (0.9 + wave), yy - hh * 0.95, 0, hh * 1.4, [[0, 'rgba(255,246,216,0.35)'], [1, 'rgba(255,246,216,0)']], 'lighter'); }
    }
    if (o.flags && r() < 0.35) {
      const fx = x + hh * 0.4, fy = yy - hh * 1.6, wv = Math.sin(u * 5 + i) * 10;
      line(fx, yy + hh, fx, fy, c, 4);
      o.flags.forEach((fc, k) => poly([[fx, fy + k * 16], [fx + 70, fy + k * 16 + wv], [fx + 70, fy + (k + 1) * 16 + wv], [fx, fy + (k + 1) * 16]], fc));
    }
  }
}
function confetti(u, seed, n, cols, grav = 160) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x0 = r() * W, sp = 0.6 + r(), ph = r() * 10, c = cols[i % cols.length];
    const y = ((r() * H + u * grav * sp) % (H + 60)) - 30;
    const x = x0 + Math.sin(u * 2 + ph) * 30;
    ctx.save(); ctx.translate(x, y); ctx.rotate(u * 3 * sp + ph); ctx.scale(1, Math.cos(u * 6 * sp + ph));
    ctx.fillStyle = c; ctx.fillRect(-7, -4, 14, 8); ctx.restore();
  }
}
function flashes(u, seed, n, y0 = 500, y1 = 900) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = y0 + r() * (y1 - y0), per = 0.8 + r() * 2.2, ph = r() * per;
    const q = ((u + ph) % per) / per;
    if (q < 0.05) rgrad(x, y, 0, 90, [[0, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,255,255,0)']], 'lighter');
  }
}
function beam(x, y, ang, len, w, color, a) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, 0, 0, len);
  g.addColorStop(0, color.replace('A', a)); g.addColorStop(1, color.replace('A', 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.lineTo(w, len); ctx.lineTo(-w, len); ctx.fill(); ctx.restore();
}
function starsBg(seed, n, a, u = 0) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H * 0.7, s = r(); circle(x, y, 0.6 + s * 1.5, '#FFFFFF', a * (0.3 + 0.7 * s) * (0.7 + 0.3 * Math.sin(u * 3 + i))); }
}
function gable(x, base, w, h, c, kind, win) {
  ctx.fillStyle = c; ctx.beginPath();
  ctx.moveTo(x, base); ctx.lineTo(x, base - h);
  if (kind === 0) { const s = w / 5; for (let k = 0; k < 2; k++) { ctx.lineTo(x + s * k, base - h - s * (k + 1)); ctx.lineTo(x + s * (k + 1), base - h - s * (k + 1)); } ctx.lineTo(x + w / 2, base - h - s * 2.6); for (let k = 2; k >= 0; k--) { ctx.lineTo(x + w - s * (k + 1), base - h - s * (k + 1)); ctx.lineTo(x + w - s * k, base - h - s * k); } }
  else if (kind === 1) { ctx.lineTo(x + w / 2, base - h - w * 0.55); }
  else { ctx.quadraticCurveTo(x, base - h - w * 0.4, x + w / 2, base - h - w * 0.5); ctx.quadraticCurveTo(x + w, base - h - w * 0.4, x + w, base - h); }
  ctx.lineTo(x + w, base); ctx.closePath(); ctx.fill();
  if (win) for (let r = 0; r < 3; r++) for (let q = 0; q < 2; q++) rect(x + w * (0.2 + q * 0.38), base - h + 30 + r * (h / 3.4), w * 0.22, h / 6, win);
}

const BEELD = {
  default(u) { rect(0, 0, W, H, C.ink); globe(W * 0.68, H * 0.42, 380, u * 10, 0.3, C.paper, 0.8); },

  zon(u) {
    const S = { x: W / 2, y: 380, r: 200 };
    const T = 3 * B; // totality, on the fourth beat of the shot
    const mp = E.outQuart(P(u, 0.1, T));
    const mx = S.x - 820 * (1 - mp), my = S.y + 30 * (1 - mp);
    const cov = clamp(1 - Math.hypot(mx - S.x, my - S.y) / (2 * S.r));
    const dark = Math.pow(cov, 2.2);
    vgrad(0, H, [[0, `rgb(${lerp(70, 6, dark)},${lerp(110, 6, dark)},${lerp(170, 14, dark)})`], [1, `rgb(${lerp(230, 30, dark)},${lerp(160, 18, dark)},${lerp(110, 30, dark)})`]]);
    starsBg(77, 200, Math.pow(dark, 3), u);
    rgrad(S.x, S.y, S.r * 0.8, S.r * 3.2, [[0, `rgba(255,200,120,${0.7 * (1 - dark)})`], [1, 'rgba(255,160,80,0)']], 'lighter');
    const cp = u >= T - 0.05 ? E.outExpo(P(u, T - 0.05, T + 0.5)) : 0;
    if (cp > 0) {
      rgrad(S.x, S.y, S.r * 0.95, S.r * 2.4, [[0, `rgba(255,250,240,${0.85 * cp})`], [0.25, `rgba(210,220,255,${0.25 * cp})`], [1, 'rgba(120,140,255,0)']], 'lighter');
      const cr = rng(9);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (let i = 0; i < 200; i++) {
        const a = cr() * TAU, l = S.r * (0.15 + Math.pow(cr(), 3) * 1.6) * (0.85 + 0.15 * Math.sin(u * 4 + i)) * cp;
        ctx.strokeStyle = `rgba(245,240,255,${0.16 + cr() * 0.2})`; ctx.lineWidth = 1 + cr() * 2;
        ctx.beginPath(); ctx.moveTo(S.x + Math.cos(a) * S.r, S.y + Math.sin(a) * S.r); ctx.lineTo(S.x + Math.cos(a) * (S.r + l), S.y + Math.sin(a) * (S.r + l)); ctx.stroke();
      }
      ctx.restore();
    }
    circle(S.x, S.y, S.r, '#FFF1DC');
    circle(mx, my, S.r * 1.015, '#050507');
    const dr = Math.exp(-Math.pow((u - (T - 0.08)) / 0.1, 2));
    if (dr > 0.01) {
      const px = S.x + S.r * 0.99, py = S.y - 12;
      rgrad(px, py, 0, 380 * dr, [[0, `rgba(255,255,255,${dr})`], [0.15, `rgba(255,240,220,${0.6 * dr})`], [1, 'rgba(255,200,160,0)']], 'lighter');
      rect(px - 900 * dr, py - 1.5, 1800 * dr, 3, '#FFFFFF', 0.9 * dr);
    }
    const fl = u >= T ? Math.exp(-(u - T) * 8) : 0;
    if (fl > 0.01) rect(0, 0, W, H, '#fff', fl * 0.35);
    // people on a hill, looking up
    ctx.fillStyle = '#050507'; ctx.beginPath(); ctx.moveTo(0, 820); ctx.quadraticCurveTo(W / 2, 700, W, 800); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    const r = rng(4);
    for (let i = 0; i < 16; i++) { const x = 200 + i * 100 + r() * 40, y = 790 - Math.sin(x / W * Math.PI) * 90; circle(x, y - 70, 16, '#050507'); poly([[x - 22, y], [x - 16, y - 55], [x + 16, y - 55], [x + 22, y]], '#050507'); }
  },

  vuurwerk(u) {
    vgrad(0, H, [[0, '#05060F'], [1, '#15152A']]);
    starsBg(31, 160, 0.8, u);
    // a quiet city
    const r = rng(2027);
    ctx.fillStyle = '#07070C';
    let x = 0; while (x < W) { const w = 60 + r() * 100, h = 80 + r() * 200; ctx.fillRect(x, 760 - h, w, h + 400); for (let k = 0; k < 8; k++) if (r() < 0.4) rect(x + 10 + (k % 3) * 22, 760 - h + 20 + Math.floor(k / 3) * 40, 12, 18, '#FFD27A', 0.6); x += w + 6; }
    // a sparkler writes the new year
    const path = sparklerPath();
    const p = E.inOutSine(P(u, 0.1, D - 0.4));
    const n = Math.floor(path.length * p);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,220,150,0.8)'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255,190,90,0.9)'; ctx.shadowBlur = 24;
    ctx.beginPath(); for (let i = 0; i < n; i++) { const [px, py, pen] = path[i]; pen ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
    ctx.restore();
    if (n > 0) {
      const [hx, hy] = path[Math.min(n, path.length - 1)];
      const rs = rng(Math.floor(u * 60));
      for (let s = 0; s < 40; s++) { const a = rs() * TAU, d = rs() * 70; line(hx, hy, hx + Math.cos(a) * d, hy + Math.sin(a) * d, '#FFE7B0', 2, 0.8); }
      rgrad(hx, hy, 0, 120, [[0, 'rgba(255,230,160,0.8)'], [1, 'rgba(255,230,160,0)']], 'lighter');
    }
  },

  testbeeld(u, it) {
    rect(0, 0, W, H, '#202024');
    const bars = ['#C0C0C0', '#C0C000', '#00C0C0', '#00C000', '#C000C0', '#C00000', '#0000C0'];
    bars.forEach((c, i) => rect(i * W / 7, 0, W / 7 + 1, 470, c));
    for (let i = 0; i < 7; i++) rect(i * W / 7, 470, W / 7 + 1, 60, bars[6 - i], 0.6);
    // grid and circle
    ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
    for (let x = 0; x <= W; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 120) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
    circle(W / 2, 330, 250, '#111114');
    ring(W / 2, 330, 250, '#FFFFFF', 6);
    rect(W / 2 - 250, 300, 500, 60, '#FFFFFF');
    txt('BJ JOURNAAL', W / 2, 332, { f: FD, size: 50, color: '#111114' });
    txt((it && it.datum ? it.datum : '').toUpperCase(), W / 2, 220, { f: FM, size: 30, weight: 700, color: '#FFFFFF', track: 12 });
    txt('NIEUWS VOLGT', W / 2, 440, { f: FM, size: 30, weight: 700, color: '#FFC917', track: 12, alpha: 0.6 + 0.4 * (Math.floor(u * 2) % 2) });
    const sweepY = (u * 300) % H;
    rect(0, sweepY, W, 4, '#FFFFFF', 0.15);
  },
};

// "2027" in single strokes, for the sparkler
let SPARK = null;
function sparklerPath() {
  if (SPARK) return SPARK;
  const glyph = {
    2: [[0, 0.2], [0.2, 0], [0.8, 0], [1, 0.2], [1, 0.4], [0, 1], [1, 1]],
    0: [[0.5, 0], [1, 0.25], [1, 0.75], [0.5, 1], [0, 0.75], [0, 0.25], [0.5, 0]],
    7: [[0, 0], [1, 0], [0.35, 1]],
  };
  const out = [];
  '2027'.split('').forEach((ch, i) => {
    const x0 = 520 + i * 240, y0 = 200, w = 180, h = 300;
    const g = glyph[ch];
    for (let k = 0; k < g.length - 1; k++) {
      for (let s = 0; s <= 12; s++) {
        const q = s / 12, x = lerp(g[k][0], g[k + 1][0], q), y = lerp(g[k][1], g[k + 1][1], q);
        out.push([x0 + x * w, y0 + y * h, !(k === 0 && s === 0)]);
      }
    }
  });
  return (SPARK = out);
}
