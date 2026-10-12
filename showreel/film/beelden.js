// ================================================== THE DRAWN PICTURES
// One full-screen, animated picture per headline. u runs from 0 to D seconds (the
// shot's length, four or six beats); the big moments sit on beats (B), so they hit
// with the music. The subject sits in the top two thirds; the headline owns the
// bottom left and the maatje the bottom right (PLEK moves it where a picture needs).
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

const NLB = (() => {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  NL_SHAPE.forEach(r => r.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }));
  return { x0, x1, y0, y1 };
})();
const BEELD = {
  default(u) { rect(0, 0, W, H, C.ink); globe(W * 0.68, H * 0.42, 380, u * 10, 0.3, C.paper, 0.8); },

  darts(u) {
    vgrad(0, H, [[0, '#07070B'], [1, '#171226']]);
    const bx = W * 0.64, by = 400, R = 250;
    beam(bx - 520, -40, -0.72, 900, 220, 'rgba(255,230,190,A)', 0.18);
    beam(bx + 520, -40, 0.72, 900, 220, 'rgba(255,230,190,A)', 0.18);
    rgrad(bx, by, 0, R * 1.8, [[0, 'rgba(255,220,170,0.35)'], [1, 'rgba(255,220,170,0)']], 'lighter');
    circle(bx, by, R + 30, '#111');
    for (let k = 0; k < 20; k++) {
      ctx.save(); ctx.translate(bx, by); ctx.rotate(k * TAU / 20 - Math.PI / 20);
      ctx.fillStyle = k % 2 ? '#F2ECE1' : '#141414'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, 0, TAU / 20); ctx.fill();
      ctx.fillStyle = k % 2 ? C.fire : '#1E7A3C';
      ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU / 20); ctx.arc(0, 0, R * 0.92, TAU / 20, 0, true); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, R * 0.6, 0, TAU / 20); ctx.arc(0, 0, R * 0.53, TAU / 20, 0, true); ctx.fill();
      ctx.restore();
    }
    circle(bx, by, R * 0.1, '#1E7A3C'); circle(bx, by, R * 0.045, C.fire);
    [[0.5, -0.05, -0.02], [1, 0.08, 0.05], [1.5, -0.02, 0.03]].map(([b, ox, oy]) => [b * B, ox, oy]).forEach(([t0, ox, oy], i) => {
      const h = E.outExpo(P(u, t0 - 0.12, t0));
      if (h <= 0) return;
      const tx = bx + ox * R, ty = by + oy * R;
      const x = lerp(tx - 900, tx, h), y = lerp(ty + 200, ty, h);
      ctx.save(); ctx.translate(x, y); ctx.rotate(-0.25 + (h >= 1 ? Math.sin((u - t0) * 40) * Math.exp(-(u - t0) * 6) * 0.08 : 0));
      line(-150, 0, 0, 0, '#C8C8D0', 9);
      poly([[-150, 0], [-200, -26], [-185, 0], [-200, 26]], i === 1 ? C.fire : C.blue);
      ctx.restore();
      if (u - t0 < 0.5) flashes(u, 40 + i, 6, 600, 900);
    });
    crowd(820, '#05050A', 3, u, { n: 30, hands: true, tempo: 2.4 });
    flashes(u, 7, 10);
  },

  nachtwacht(u) {
    rect(0, 0, W, H, '#2A1612');
    vgrad(0, H, [[0, 'rgba(0,0,0,0.5)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.6)']]);
    const x0 = 250, y0 = 110, fw = 1420, fh = 620;
    rect(x0 - 40, y0 - 40, fw + 80, fh + 80, '#8A6A2E');
    rect(x0 - 24, y0 - 24, fw + 48, fh + 48, '#C9A24E');
    rect(x0, y0, fw, fh, '#15120C');
    // the painting: figures as warm light in the dark
    const figs = rng(1642);
    for (let i = 0; i < 26; i++) {
      const x = x0 + 80 + figs() * (fw - 160), y = y0 + 180 + figs() * (fh - 260), s = 30 + figs() * 50;
      const warm = figs() < 0.25;
      ctx.fillStyle = warm ? '#E8C27A' : '#3A2C1C';
      ctx.beginPath(); ctx.ellipse(x, y + s * 1.6, s * 0.8, s * 1.8, 0, 0, TAU); ctx.fill();
      circle(x, y, s * 0.55, warm ? '#F3D9A4' : '#4A3826');
      if (figs() < 0.3) line(x + s, y + s * 3, x + s * 1.8, y - s * 3, '#6B5536', 6);
    }
    rgrad(x0 + fw * 0.55, y0 + fh * 0.55, 20, 300, [[0, 'rgba(255,214,140,0.45)'], [1, 'rgba(255,214,140,0)']], 'lighter');
    // the old yellow varnish, wiped away left to right
    const wipe = x0 + fw * E.inOutSine(P(u, 0.1, D));
    ctx.save(); clipRect(wipe, y0, x0 + fw - wipe, fh); rect(x0, y0, fw, fh, '#8A6B1E', 0.45); ctx.restore();
    line(wipe, y0, wipe, y0 + fh, '#FFF3D0', 3, 0.7);
    // the lift the restorer (the raccoon) stands on
    const rx = wipe + 30, ry = y0 + fh - 40;
    rect(rx - 120, ry + 40, 280, 16, '#9BA3AD'); line(rx - 100, ry + 56, rx - 100, H, '#9BA3AD', 6); line(rx + 140, ry + 56, rx + 140, H, '#9BA3AD', 6);
    line(rx - 100, ry + 56, rx + 140, H, '#9BA3AD', 4); line(rx + 140, ry + 56, rx - 100, H, '#9BA3AD', 4);
    // the glass room
    ctx.save(); ctx.globalAlpha = 0.18; ctx.strokeStyle = '#CFE8FF'; ctx.lineWidth = 3;
    for (let k = 0; k <= 4; k++) { const x = 120 + k * 420; ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, H); ctx.stroke(); }
    ctx.restore();
    for (let k = 0; k < 3; k++) { const x = ((u * 160 + k * 700) % (W + 600)) - 300; poly([[x, 0], [x + 60, 0], [x - 200, H], [x - 260, H]], '#FFFFFF', 0.05); }
  },

  groenland(u) {
    vgrad(0, 620, [[0, '#0E1B3A'], [0.6, '#35507F'], [1, '#B9CFE6']]);
    for (let k = 0; k < 3; k++) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.22;
      ctx.strokeStyle = k === 1 ? '#6DFFB4' : '#4AE0C8'; ctx.lineWidth = 60 - k * 12;
      ctx.beginPath();
      for (let x = -50; x <= W + 50; x += 40) ctx.lineTo(x, 180 + k * 50 + Math.sin(x / 260 + u * 0.7 + k) * 60);
      ctx.stroke(); ctx.restore();
    }
    starsBg(8, 80, 0.5, u);
    vgrad(600, H, [[0, '#1E3E66'], [1, '#0A1830']]);
    const berg = (x, base, s, c1, c2) => {
      poly([[x - 260 * s, base], [x - 140 * s, base - 170 * s], [x - 40 * s, base - 240 * s], [x + 90 * s, base - 150 * s], [x + 250 * s, base]], c1);
      poly([[x - 40 * s, base - 240 * s], [x + 90 * s, base - 150 * s], [x + 250 * s, base], [x + 30 * s, base]], c2);
      poly([[x - 220 * s, base], [x + 220 * s, base], [x + 120 * s, base + 90 * s], [x - 150 * s, base + 70 * s]], '#7FB2D6', 0.35);
    };
    berg(560 + Math.sin(u * 0.4) * 10, 640, 1.3, '#EAF4FB', '#A8C7DF');
    berg(1300 - u * 6, 620, 0.9, '#DDEBF6', '#98B9D3');
    berg(1700 - u * 10, 660, 0.6, '#F4FAFF', '#B3CDE2');
    ctx.save(); ctx.globalAlpha = 0.3; ctx.strokeStyle = '#CFE3F3'; ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) { const y = 680 + i * 30, o = (u * 40 + i * 70) % 200; ctx.beginPath(); for (let x = -o; x < W; x += 200) { ctx.moveTo(x, y); ctx.lineTo(x + 90, y); } ctx.stroke(); }
    ctx.restore();
    // a target locks on
    const lp = E.outExpo(P(u, B, 2 * B)), cx = 560, cy = 440;
    const rr = lerp(420, 150, lp);
    ctx.save(); ctx.globalAlpha = 0.85 * P(u, B, B + 0.15); ctx.strokeStyle = C.fire; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.stroke();
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.moveTo(cx + dx * rr * 0.7, cy + dy * rr * 0.7); ctx.lineTo(cx + dx * rr * 1.25, cy + dy * rr * 1.25); ctx.stroke(); });
    ctx.restore();
  },

  concert(u) {
    rect(0, 0, W, H, '#0A0614');
    rgrad(W / 2, 260, 0, 900, [[0, 'rgba(255,74,28,0.35)'], [1, 'rgba(255,74,28,0)']]);
    for (let i = 0; i < 6; i++) {
      const a = Math.sin(u * 1.4 + i) * 0.5 + (i - 2.5) * 0.18;
      beam(260 + i * 280, -20, a, 1100, 200, i % 2 ? 'rgba(255,90,40,A)' : 'rgba(80,110,255,A)', 0.22);
    }
    // the screen
    const sx = W / 2 - 520, sy = 80, sw = 1040, sh = 380;
    rect(sx - 12, sy - 12, sw + 24, sh + 24, '#222');
    rect(sx, sy, sw, sh, C.fire);
    ctx.save(); clipRect(sx, sy, sw, sh);
    for (let r = 0; r < 12; r++) for (let q = 0; q < 34; q++) circle(sx + 16 + q * 31, sy + 16 + r * 31, 10, '#000', 0.12);
    const s = 1 + 0.06 * beatPulse(u, 6);
    ctx.translate(W / 2, sy + sh / 2); ctx.scale(s, s);
    digits('CHEERIO!', 0, 0, 230, C.paper);
    ctx.restore();
    // singer silhouette at the mic
    const sgx = W / 2, sgy = 640;
    poly([[sgx - 70, 900], [sgx - 55, sgy], [sgx + 55, sgy], [sgx + 70, 900]], '#05030A');
    circle(sgx, sgy - 40, 45, '#05030A');
    line(sgx + 60, sgy + 10, sgx + 130, sgy - 120 + Math.sin(u * 3) * 10, '#05030A', 26);
    line(sgx - 180, 900, sgx - 120, sgy - 10, '#333', 6); circle(sgx - 120, sgy - 20, 14, '#333');
    crowd(760, '#000', 11, u, { n: 36, hands: true, phones: true, tempo: 3.3, bounce: 14 });
  },

  iran(u) {
    vgrad(0, H, [[0, '#07060C'], [0.55, '#2A1024'], [0.72, '#7A2A18'], [1, '#150808']]);
    starsBg(21, 60, 0.35, u);
    // trails across the sky
    const r = rng(28);
    for (let i = 0; i < 7; i++) {
      const t0 = r() * D * 0.7 - 0.4, x0 = r() * W, dir = r() < 0.5 ? -1 : 1;
      const p = P(u, t0, t0 + 0.9);
      if (p <= 0) continue;
      ctx.save(); ctx.strokeStyle = 'rgba(255,220,180,0.55)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let q = Math.max(0, p - 0.35); q <= p; q += 0.02) { const x = x0 + dir * q * 700, y = 640 - Math.sin(q * Math.PI) * 420; q === Math.max(0, p - 0.35) ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke(); ctx.restore();
      if (p >= 1 && u - t0 - 0.9 < 1.2) { const k = u - t0 - 0.9; rgrad(x0 + dir * 700, 640, 0, 380 * (1 - Math.exp(-k * 5)), [[0, `rgba(255,150,70,${0.6 * Math.exp(-k * 2)})`], [1, 'rgba(255,90,40,0)']], 'lighter'); }
    }
    // skyline with domes and minarets
    const base = 700, rr = rng(5);
    ctx.fillStyle = '#060305';
    let x = -20;
    while (x < W + 40) {
      const w = 60 + rr() * 140, h = 80 + rr() * 220, kind = rr();
      ctx.fillRect(x, base - h, w, h + 400);
      if (kind < 0.25) { ctx.beginPath(); ctx.arc(x + w / 2, base - h, w / 2, Math.PI, 0); ctx.fill(); }
      else if (kind < 0.4) { ctx.fillRect(x + w / 2 - 8, base - h - 160, 16, 160); ctx.beginPath(); ctx.moveTo(x + w / 2 - 12, base - h - 160); ctx.lineTo(x + w / 2, base - h - 200); ctx.lineTo(x + w / 2 + 12, base - h - 160); ctx.fill(); }
      x += w + rr() * 10;
    }
    rect(0, base, W, H - base, '#060305');
  },

  stemmen(u) {
    rect(0, 0, W, H, '#E9E3D6');
    vgrad(640, H, [[0, '#C9B89A'], [1, '#A8946F']]);
    for (let i = 0; i < 14; i++) line(i * 150 - 50, 640, i * 170 - 300, H, '#9E8963', 2, 0.5);
    rect(0, 0, W, 90, '#D8CFBD');
    for (let i = 0; i < 8; i++) { rect(90 + i * 230, 20, 150, 40, '#FFFDF3', 0.6); }
    // voting booths
    for (let i = 0; i < 5; i++) {
      const x = 170 + i * 330, top = 250;
      rect(x, top, 240, 390, '#5A6B7A');
      ctx.save(); clipRect(x + 10, top + 20, 220, 370);
      const sway = Math.sin(u * 1.5 + i) * 12;
      for (let f = 0; f < 6; f++) rect(x + 10 + f * 37 + sway * (f / 6), top + 20, 30, 370, f % 2 ? '#F28C5A' : C.fire);
      ctx.restore();
      rect(x - 10, top - 20, 260, 24, '#3B4752');
      if (i === 2) { poly([[x + 70, 640], [x + 90, 560], [x + 150, 560], [x + 170, 640]], '#1B1B22'); }
    }
    // the ballot box and a ballot dropping on every bar
    const bx = W / 2 + 480, by = 700;
    rect(bx - 120, by - 20, 240, 200, '#2B2B33');
    rect(bx - 60, by - 24, 120, 10, '#000');
    const q = (u / (2 * B)) % 1;
    ctx.save(); clipRect(bx - 300, 0, 600, by - 16);
    const yy = lerp(by - 300, by + 40, E.inOutCubic(q));
    ctx.translate(bx, yy); ctx.rotate(0.08);
    rect(-50, -70, 100, 70, '#FFFDF3'); line(-30, -40, 30, -40, '#222', 3); txt('X', 20, -25, { f: FD, size: 30, color: C.fire });
    ctx.restore();
    rgrad(W / 2, 300, 100, 1200, [[0, 'rgba(255,255,255,0.15)'], [1, 'rgba(0,0,0,0.25)']]);
  },

  tanker(u) {
    vgrad(0, 560, [[0, '#2C0F12'], [0.6, '#C24A1C'], [1, '#FF9B4A']]);
    circle(1320, 470, 120, '#FFD39A');
    rgrad(1320, 470, 100, 600, [[0, 'rgba(255,200,120,0.5)'], [1, 'rgba(255,120,60,0)']], 'lighter');
    vgrad(540, H, [[0, '#5A2014'], [1, '#12060A']]);
    for (let i = 0; i < 16; i++) { const y = 560 + i * 26, o = (u * 30 * (1 + i * 0.1)) % 160; ctx.save(); ctx.globalAlpha = 0.3; ctx.strokeStyle = '#FFB070'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = -o; x < W; x += 160) { ctx.moveTo(x, y); ctx.lineTo(x + 60 + i * 3, y); } ctx.stroke(); ctx.restore(); }
    // the tanker, standing still
    const tx = 380 + u * 8, ty = 600;
    poly([[tx, ty - 60], [tx + 1000, ty - 60], [tx + 1060, ty - 110], [tx + 1080, ty - 110], [tx + 1030, ty + 20], [tx + 40, ty + 20]], '#140808');
    rect(tx + 60, ty - 200, 150, 140, '#140808'); rect(tx + 80, ty - 250, 40, 60, '#140808');
    for (let k = 0; k < 7; k++) rect(tx + 280 + k * 100, ty - 90, 70, 30, '#1E0C0C');
    // a barrier across the strait
    const bp = E.outExpo(P(u, B, 2 * B));
    for (let k = 0; k < 14; k++) { const x = 60 + k * 136; if (x / W > bp) break; rect(x, 780, 110, 26, k % 2 ? C.paper : C.fire); }
    rect(40, 806, W * bp - 40, 8, '#111');
  },

  kampioen(u) {
    vgrad(0, H, [[0, '#050508'], [1, '#1A0A0E']]);
    [[420, 50], [W - 420, 50]].forEach(([x, y], i) => {
      for (let k = 0; k < 3; k++) for (let q = 0; q < 4; q++) circle(x - 60 + q * 40, y + k * 40, 14, '#FFF8E0');
      beam(x, y + 60, (i ? 0.55 : -0.55), 1300, 360, 'rgba(255,248,224,A)', 0.14);
    });
    // stands full of red and white
    for (let row = 0; row < 6; row++) {
      const y = 430 + row * 55, r = rng(row + 30);
      for (let i = 0; i < 44; i++) {
        const x = i * 45 + (row % 2) * 22, bob = Math.abs(Math.sin(Math.PI * u / B + i * 0.15 + row * 0.5)) * 14;
        circle(x, y - bob, 17, r() < 0.55 ? '#D0101A' : '#F2ECE1', 0.9 - row * 0.05);
      }
    }
    // the dish goes up, held high by a player
    const lift = E.outPop(P(u, 0, B * 1.1));
    const cx = W / 2, cy = lerp(780, 300, lift) + Math.sin(Math.PI * u / B) * 6;
    rgrad(cx, cy, 0, 460, [[0, 'rgba(255,240,200,0.5)'], [1, 'rgba(255,240,200,0)']], 'lighter');
    const py = cy + 300;
    ctx.save(); ctx.fillStyle = '#0B0B0E'; ctx.strokeStyle = '#0B0B0E'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(cx, py + 190, 230, 130, 0, Math.PI, 0); ctx.lineTo(cx + 230, H + 40); ctx.lineTo(cx - 230, H + 40); ctx.fill();
    circle(cx, py, 70, '#0B0B0E');
    ctx.lineWidth = 46;
    [-1, 1].forEach(sd => { ctx.beginPath(); ctx.moveTo(cx + sd * 170, py + 120); ctx.quadraticCurveTo(cx + sd * 270, py - 40, cx + sd * 215, cy + 34); ctx.stroke(); });
    ctx.restore();
    // the dish itself, silver, in perspective
    ctx.save(); ctx.translate(cx, cy);
    ctx.fillStyle = '#8E97A6'; ctx.beginPath(); ctx.ellipse(0, 14, 250, 66, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#DCE2EA'; ctx.beginPath(); ctx.ellipse(0, 0, 250, 62, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#B5BDC9'; ctx.beginPath(); ctx.ellipse(0, 4, 190, 42, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#C9D0DA'; ctx.beginPath(); ctx.ellipse(0, 6, 120, 24, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(0, 0, 238, 56, 0, Math.PI * 1.1, Math.PI * 1.55); ctx.stroke();
    ctx.restore();
    [[-200, -8], [150, -30], [40, 30]].forEach(([dx, dy], i) => { const tw = Math.max(0, Math.sin(Math.PI * (u / B) * 2 + i * 2)); pixelStar(cx + dx, cy + dy, 6 + tw * 8, '#FFFFFF', u * 2 + i); });
    [-1, 1].forEach(sd => circle(cx + sd * 215, cy + 30, 30, '#0B0B0E'));
    crowd(830, '#08080B', 55, u, { n: 22, hands: true, bounce: 16, tempo: 4 });
    confetti(u, 9, 160, ['#D0101A', '#F2ECE1', '#D0101A', '#E8C95A']);
  },

  boedapest(u) {
    vgrad(0, 640, [[0, '#0B1030'], [0.7, '#3B2A5A'], [1, '#C9665A']]);
    starsBg(3, 50, 0.4, u);
    // the parliament on the Danube
    const base = 560, c = '#0C0A18';
    ctx.fillStyle = c;
    ctx.fillRect(260, base - 150, 1400, 150);
    for (let k = 0; k < 28; k++) { const x = 270 + k * 50; ctx.fillRect(x, base - 190, 20, 40); ctx.beginPath(); ctx.moveTo(x - 2, base - 190); ctx.lineTo(x + 10, base - 230); ctx.lineTo(x + 22, base - 190); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(W / 2 - 160, base - 150); ctx.quadraticCurveTo(W / 2 - 160, base - 360, W / 2, base - 380); ctx.quadraticCurveTo(W / 2 + 160, base - 360, W / 2 + 160, base - 150); ctx.fill();
    ctx.fillRect(W / 2 - 10, base - 470, 20, 100);
    [[W / 2 - 330, 300], [W / 2 + 330, 300]].forEach(([x, h]) => { ctx.fillRect(x - 25, base - h, 50, h); ctx.beginPath(); ctx.moveTo(x - 30, base - h); ctx.lineTo(x, base - h - 90); ctx.lineTo(x + 30, base - h); ctx.fill(); });
    for (let k = 0; k < 24; k++) rect(290 + k * 58, base - 110, 16, 30, '#FFD27A', 0.5 + 0.3 * Math.sin(u * 2 + k));
    vgrad(base, 700, [[0, '#2A1F3A'], [1, '#0A0812']]);
    for (let k = 0; k < 24; k++) rect(290 + k * 58 + Math.sin(u * 3 + k) * 6, base + 10 + (k % 3) * 20, 16, 50, '#FFD27A', 0.15);
    // fireworks of joy
    const r = rng(77);
    for (let i = 0; i < 4; i++) {
      const t0 = i * B * 0.75 + r() * 0.3, fx = 300 + r() * 1300, fy = 120 + r() * 200, k = u - t0;
      if (k < 0 || k > 1.4) continue;
      const cc = [C.fire, '#FFFFFF', '#2DB04E'][i % 3];
      for (let s = 0; s < 36; s++) { const a = s * TAU / 36, d = 160 * E.outExpo(k); circle(fx + Math.cos(a) * d, fy + Math.sin(a) * d + k * k * 40, 4, cc, 1 - k / 1.4); }
    }
    crowd(800, '#050409', 88, u, { n: 30, flags: ['#CD2A3E', '#FFFFFF', '#436F4D'], bounce: 10, hands: true });
  },

  koningsdag(u) {
    vgrad(0, 640, [[0, '#7FB7E8'], [1, '#CFE6F7']]);
    // clouds
    for (let i = 0; i < 4; i++) { const x = ((i * 520 + u * 25) % (W + 400)) - 200, y = 90 + (i % 2) * 70; [[0, 0, 60], [60, -20, 70], [130, 0, 55]].forEach(([dx, dy, r]) => circle(x + dx, y + dy, r, '#FFFFFF', 0.9)); }
    // a windmill turning
    const mx = 1560, my = 330;
    poly([[mx - 60, 640], [mx - 36, my], [mx + 36, my], [mx + 60, 640]], '#3B2F2A');
    ctx.save(); ctx.translate(mx, my); ctx.rotate(u * 0.9);
    for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); rect(-8, 0, 16, 230, '#2A201C'); rect(8, 40, 44, 180, '#F2ECE1', 0.85); }
    ctx.restore(); circle(mx, my, 14, '#2A201C');
    // canal houses
    const cols = ['#8C3B2E', '#5E3A2B', '#A0522D', '#6B3E30', '#7A2F25', '#4F3328'];
    for (let i = 0; i < 9; i++) gable(40 + i * 150, 640, 140, 220 + (i % 3) * 30, cols[i % cols.length], i % 3, 'rgba(255,245,220,0.8)');
    // bunting
    for (let row = 0; row < 2; row++) {
      const y0 = 250 + row * 90;
      ctx.save(); ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y0 + Math.sin(x / W * Math.PI) * 60 + Math.sin(u * 2 + x / 200) * 4);
      ctx.stroke(); ctx.restore();
      for (let x = 20; x < W; x += 60) {
        const y = y0 + Math.sin(x / W * Math.PI) * 60 + Math.sin(u * 2 + x / 200) * 4, sw = Math.sin(u * 3 + x) * 6;
        poly([[x - 20, y], [x + 20, y], [x + sw, y + 44]], ['#FF7A00', '#FFFFFF', C.blue, '#D0101A'][(x / 60 + row) % 4 | 0]);
      }
    }
    vgrad(640, H, [[0, '#3E6E8C'], [1, '#1F3E55']]);
    for (let i = 0; i < 9; i++) rect(40 + i * 150 + Math.sin(u * 2 + i) * 6, 660, 140, 60, cols[i % cols.length], 0.25);
    // orange balloons drifting up
    const r = rng(427);
    for (let i = 0; i < 14; i++) {
      const x = r() * W, sp = 60 + r() * 60, y = H + 80 - ((u * sp + r() * 900) % (H + 200));
      line(x, y + 38, x + Math.sin(u * 2 + i) * 10, y + 120, '#444', 1.5);
      ctx.fillStyle = '#FF7A00'; ctx.beginPath(); ctx.ellipse(x, y, 28, 36, 0, 0, TAU); ctx.fill();
    }
    crowd(860, '#E86A00', 427, u, { n: 30, hands: true, bounce: 10 });
  },

  mol(u) {
    rect(0, 0, W, H, '#050507');
    const red = u > 2 * B ? 1 : 0;
    const pulse = 0.5 + 0.5 * Math.sin(u * 3);
    // the screen: green, green, then red
    const sx = W / 2 - 360, sy = 110, sw = 720, sh = 440;
    rect(sx - 14, sy - 14, sw + 28, sh + 28, '#1A1A1E');
    const flick = u > 2 * B && u < 2 * B + 0.3 ? (Math.floor(u * 30) % 2) : 1;
    rect(sx, sy, sw, sh, red ? '#E0121B' : '#16C24A', flick);
    rgrad(W / 2, sy + sh / 2, 50, 900, [[0, red ? 'rgba(224,18,27,0.35)' : 'rgba(22,194,74,0.3)'], [1, 'rgba(0,0,0,0)']], 'lighter');
    // a fingerprint on the scanner
    const fx = W / 2, fy = sy + sh / 2;
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.ellipse(fx, fy + 20, 20 + i * 18, 34 + i * 22, 0, Math.PI * (1.06 + i * 0.015), Math.PI * (1.96 - i * 0.02)); ctx.stroke(); }
    ctx.restore();
    const scan = sy + ((u * 0.8) % 1) * sh;
    rect(sx, scan, sw, 6, '#FFFFFF', 0.6 * (1 - red));
    // the pedestal and a silhouette leaning in
    poly([[W / 2 - 140, H], [W / 2 - 90, 700], [W / 2 + 90, 700], [W / 2 + 140, H]], '#141418');
    rect(W / 2 - 110, 680, 220, 30, '#232329');
    circle(W / 2 - 520, 560, 70, '#000'); poly([[W / 2 - 640, H], [W / 2 - 610, 640], [W / 2 - 430, 640], [W / 2 - 400, H]], '#000');
    rgrad(W / 2 - 520, 600, 0, 400, [[0, `rgba(255,255,255,${0.04 * pulse})`], [1, 'rgba(0,0,0,0)']]);
  },

  chip(u) {
    rect(0, 0, W, H, '#05080F');
    // a rising line behind everything
    ctx.save(); ctx.strokeStyle = C.lime; ctx.lineWidth = 5; ctx.globalAlpha = 0.5;
    ctx.beginPath();
    const n = 60, prog = E.outCubic(P(u, 0, D));
    for (let i = 0; i <= n * prog; i++) { const x = 100 + i / n * (W - 200), y = 700 - Math.pow(i / n, 2.2) * 560 + Math.sin(i * 1.7) * 18; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
    // circuit traces
    const r = rng(8);
    for (let i = 0; i < 40; i++) {
      const side = i % 4, off = (r() - 0.5) * 360;
      const cx = W / 2, cy = 400;
      let pts;
      if (side === 0) pts = [[cx + off, cy - 190], [cx + off, cy - 260 - r() * 100], [cx + off + (r() - 0.5) * 600, cy - 380 - r() * 100]];
      else if (side === 1) pts = [[cx + off, cy + 190], [cx + off, cy + 260 + r() * 60], [cx + off + (r() - 0.5) * 800, cy + 330 + r() * 80]];
      else if (side === 2) pts = [[cx - 190, cy + off * 0.5], [cx - 300 - r() * 200, cy + off * 0.5], [cx - 600 - r() * 300, cy + off]];
      else pts = [[cx + 190, cy + off * 0.5], [cx + 300 + r() * 200, cy + off * 0.5], [cx + 600 + r() * 300, cy + off]];
      ctx.save(); ctx.strokeStyle = '#1F3A66'; ctx.lineWidth = 3; ctx.beginPath(); pts.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
      const q = ((u * 0.7 + r()) % 1);
      const a = q < 0.5 ? [lerp(pts[0][0], pts[1][0], q * 2), lerp(pts[0][1], pts[1][1], q * 2)] : [lerp(pts[1][0], pts[2][0], q * 2 - 1), lerp(pts[1][1], pts[2][1], q * 2 - 1)];
      circle(a[0], a[1], 5, '#7CE3FF');
      circle(pts[2][0], pts[2][1], 7, '#1F3A66');
    }
    // the chip
    const cx = W / 2, cy = 400;
    rgrad(cx, cy, 50, 600, [[0, 'rgba(124,227,255,0.35)'], [1, 'rgba(124,227,255,0)']], 'lighter');
    rect(cx - 190, cy - 190, 380, 380, '#10151F');
    for (let k = 0; k < 10; k++) { const o = -170 + k * 38; rect(cx + o, cy - 215, 14, 25, '#B8C2CC'); rect(cx + o, cy + 190, 14, 25, '#B8C2CC'); rect(cx - 215, cy + o, 25, 14, '#B8C2CC'); rect(cx + 190, cy + o, 25, 14, '#B8C2CC'); }
    rect(cx - 120, cy - 120, 240, 240, '#1C2533');
    rect(cx - 120, cy - 120, 240, 240, C.lime, 0.15 + 0.15 * beatPulse(u, 4));
    txt('AI', cx, cy + 8, { f: FD, size: 150, color: C.lime });
  },

  hitte(u) {
    vgrad(0, H, [[0, '#FFB347'], [0.5, '#FF6A2A'], [1, '#B8260E']]);
    const sun = 1 + 0.03 * Math.sin(u * 2);
    rgrad(W * 0.7, 200, 60, 700, [[0, 'rgba(255,255,220,0.9)'], [0.3, 'rgba(255,220,120,0.5)'], [1, 'rgba(255,160,60,0)']], 'lighter');
    circle(W * 0.7, 200, 120 * sun, '#FFF6D8');
    // the Netherlands, glowing red hot
    const s = 620 / (NLB.y1 - NLB.y0), cx = W * 0.33, cy = 420;
    ctx.save();
    ctx.beginPath();
    NL_SHAPE.forEach(rg => rg.forEach(([x, y], i) => { const px = cx + (x - (NLB.x0 + NLB.x1) / 2) * s, py = cy + (y - (NLB.y0 + NLB.y1) / 2) * s; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }));
    ctx.closePath();
    ctx.fillStyle = '#8E0E06'; ctx.fill();
    ctx.clip();
    for (let k = 0; k < 4; k++) { const q = ((u * 0.5 + k / 4) % 1); rgrad(cx + 40, cy + 240, 0, 700 * q, [[0, 'rgba(255,40,20,0)'], [0.9, `rgba(255,60,20,${0.5 * (1 - q)})`], [1, 'rgba(255,60,20,0)']]); }
    ctx.restore();
    // heat shimmer
    ctx.save(); ctx.globalAlpha = 0.25; ctx.strokeStyle = '#FFF2C0'; ctx.lineWidth = 3;
    for (let i = 0; i < 14; i++) { const y = 760 + i * 22; ctx.beginPath(); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, y + Math.sin(x / 70 + u * 4 + i) * 6); ctx.stroke(); }
    ctx.restore();
    // a thermometer in the red
    const tx = W * 0.72, ty = 470, lvl = E.outBack(P(u, 0.1, 2 * B));
    ctx.save(); ctx.fillStyle = '#FFFDF5'; ctx.beginPath(); ctx.roundRect(tx - 36, ty - 260, 72, 360, 36); ctx.fill(); ctx.restore();
    circle(tx, ty + 120, 70, '#FFFDF5'); circle(tx, ty + 120, 52, '#D0101A');
    rect(tx - 16, lerp(ty + 90, ty - 230, lvl), 32, lerp(0, 320, lvl), '#D0101A');
  },

  downing(u) {
    // brick
    rect(0, 0, W, H, '#2A1814');
    for (let r = 0; r < 30; r++) for (let q = 0; q < 26; q++) rect(q * 80 + (r % 2) * 40, r * 36, 74, 30, r % 3 ? '#3A211A' : '#43261D');
    rgrad(W / 2, 360, 100, 1000, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.6)']]);
    // the door
    const dx = W / 2 - 170, dy = 90;
    rect(dx - 40, dy - 40, 420, 720, '#E9E2D2');
    ctx.fillStyle = '#E9E2D2'; ctx.beginPath(); ctx.arc(W / 2, dy - 40, 210, Math.PI, 0); ctx.fill();
    rect(dx, dy, 340, 680, '#0B0B0E');
    for (let k = 0; k < 2; k++) for (let q = 0; q < 3; q++) ctx.save(), ctx.strokeStyle = '#1C1C22', ctx.lineWidth = 6, ctx.strokeRect(dx + 30 + k * 150, dy + 30 + q * 210, 130, 190), ctx.restore();
    ctx.fillStyle = '#1C1C22'; ctx.beginPath(); ctx.arc(W / 2, dy - 40, 170, Math.PI, 0); ctx.fill();
    txt('10', W / 2, dy + 360, { f: FS, size: 70, weight: 700, color: '#E9E2D2' });
    circle(W / 2, dy + 460, 20, '#C9A24E');
    rect(W / 2 + 170 + 90, 170, 60, 110, '#111'); rgrad(W / 2 + 290, 225, 0, 180, [[0, 'rgba(255,220,150,0.5)'], [1, 'rgba(255,220,150,0)']], 'lighter');
    // the lectern, empty now
    const lx = W / 2, ly = 640;
    poly([[lx - 150, ly], [lx + 150, ly], [lx + 110, H], [lx - 110, H]], '#1A1A20');
    for (let k = 0; k < 3; k++) line(lx - 30 + k * 30, ly, lx - 40 + k * 40, ly - 80, '#333', 6);
    // a gust of press flashes, then silence
    if (u < D * 0.6) flashes(u, 12, 20, 300, 800);
    crowd(930, '#050506', 99, u, { n: 26, bounce: 2, tempo: 1 });
  },

  trekkers(u) {
    vgrad(0, 600, [[0, '#6E8FB5'], [1, '#F5C49A']]);
    circle(1560, 420, 90, '#FFE6B8', 0.9);
    vgrad(560, H, [[0, '#3A4A2A'], [0.2, '#555B5E'], [1, '#2B2E30']]);
    // road markings rushing by
    for (let k = 0; k < 10; k++) { const x = ((k * 260 - u * 300) % (W + 260) + W + 260) % (W + 260) - 130; rect(x, 850, 140, 12, '#F2ECE1', 0.8); }
    // a column of tractors, some flying the flag upside down
    const tractor = (x, y, s, c, flag) => {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      const rot = u * 4;
      rect(-60, -150, 120, 110, c); rect(-50, -140, 100, 60, '#9FD3E6', 0.8);
      rect(-120, -60, 280, 70, c); rect(140, -120, 16, 70, '#222');
      [[-70, 20, 70], [110, 40, 42]].forEach(([wx, wy, wr]) => { circle(wx, wy, wr, '#161616'); circle(wx, wy, wr * 0.45, '#B9B9B9'); ctx.save(); ctx.translate(wx, wy); ctx.rotate(rot); for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); rect(-3, 0, 6, wr * 0.45, '#666'); } ctx.restore(); });
      if (flag) { line(-60, -150, -60, -300, '#333', 5); const wv = Math.sin(u * 5 + x) * 10; ['#21468B', '#FFFFFF', '#AE1C28'].forEach((fc, k) => poly([[-60, -300 + k * 26], [40, -300 + k * 26 + wv], [40, -300 + (k + 1) * 26 + wv], [-60, -300 + (k + 1) * 26]], fc)); }
      ctx.restore();
    };
    for (let i = 0; i < 6; i++) {
      const x = ((i * 420 + u * 90) % (W + 700)) - 350;
      tractor(x, 770 - (i % 2) * 40, 1 - (i % 2) * 0.2, ['#1F7A3A', '#C8261E', '#1F7A3A', '#E5A21A', '#1C5FB8', '#1F7A3A'][i], i % 2 === 0);
    }
  },

  bruiloft(u) {
    rect(0, 0, W, H, '#10060F');
    rgrad(W / 2, 360, 0, 1000, [[0, 'rgba(255,120,180,0.35)'], [1, 'rgba(255,120,180,0)']]);
    for (let i = 0; i < 5; i++) beam(W / 2 + (i - 2) * 380, -20, Math.sin(u + i) * 0.3, 1100, 150, 'rgba(255,200,230,A)', 0.14);
    // two rings, interlocked, turning
    const cx = W / 2, cy = 360, s = 1 + 0.04 * beatPulse(u, 5);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    [[-90, '#E8C95A'], [90, '#F5E6B0']].forEach(([dx, c], i) => {
      ctx.save(); ctx.translate(dx, 0); ctx.scale(Math.cos(u * 1.2 + i) * 0.25 + 0.85, 1);
      ctx.strokeStyle = c; ctx.lineWidth = 34; ctx.beginPath(); ctx.arc(0, 0, 150, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 150, -2.4, -1.6); ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
    const sp = (u * 0.9) % 1;
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + u; ctx.save(); ctx.translate(cx + Math.cos(a) * 280, cy + Math.sin(a) * 180); ctx.scale(1 - sp, 1 - sp); poly([[0, -40], [8, -8], [40, 0], [8, 8], [0, 40], [-8, 8], [-40, 0], [-8, -8]], '#FFFFFF'); ctx.restore(); }
    crowd(780, '#050206', 13, u, { n: 36, hands: true, phones: true, bounce: 12 });
    confetti(u, 13, 120, ['#FFC1DA', '#FFFFFF', '#E8C95A', '#FF7FB0'], 120);
  },

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

  zomer(u) {
    vgrad(0, 520, [[0, '#FFD27A'], [1, '#FFF1C9']]);
    circle(1500, 170, 110, '#FFF8E1');
    rgrad(1500, 170, 90, 600, [[0, 'rgba(255,240,180,0.6)'], [1, 'rgba(255,200,120,0)']], 'lighter');
    // the sea and the beach
    vgrad(470, 560, [[0, '#3FA6C9'], [1, '#6CC3D9']]);
    for (let k = 0; k < 6; k++) { const y = 480 + k * 14; ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, y + Math.sin(x / 90 + u * 2 + k) * 3); ctx.stroke(); ctx.restore(); }
    vgrad(550, H, [[0, '#F3D8A4'], [1, '#C79B5B']]);
    // parasols
    [[380, 700, C.fire], [820, 640, C.blue], [1250, 720, '#F2ECE1'], [1650, 660, C.fire]].forEach(([x, y, c], i) => {
      line(x, y, x + 10, y + 200, '#5A4A3A', 8);
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(u * 1.2 + i) * 0.04);
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-160, 30); ctx.quadraticCurveTo(0, -110, 160, 30); ctx.closePath(); ctx.fill();
      for (let k = -2; k <= 2; k++) line(0, -60, k * 80, 30, 'rgba(0,0,0,0.15)', 3);
      ctx.restore();
      rect(x - 90, y + 180, 150, 40, i % 2 ? '#FFFFFF' : C.lime, 0.8);
    });
    // parched grass in the foreground
    const r = rng(66);
    for (let i = 0; i < 160; i++) { const x = r() * W, h = 40 + r() * 90, lean = Math.sin(u * 1.5 + x / 100) * 10; line(x, H, x + lean + (r() - 0.5) * 30, H - h, r() < 0.5 ? '#B8914E' : '#8C6A34', 4); }
    ctx.save(); ctx.globalAlpha = 0.2; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) { const y = 600 + i * 30; ctx.beginPath(); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, y + Math.sin(x / 60 + u * 5 + i) * 5); ctx.stroke(); }
    ctx.restore();
  },

  staking(u) {
    vgrad(0, H, [[0, '#9FB3C8'], [1, '#D8E0E8']]);
    // canopy
    poly([[0, 0], [W, 0], [W, 150], [0, 230]], '#2C3440');
    for (let k = 0; k < 10; k++) line(k * 220, 0, k * 220 - 60, 230 - k * 8, '#4A5563', 8);
    // the departure board
    const bx = 260, by = 260, bw = 1400, bh = 300;
    rect(bx - 12, by - 12, bw + 24, bh + 24, '#1A1F28');
    rect(bx, by, bw, bh, '#0E2F7A');
    ['VERTREK', 'RIJDT NIET', 'RIJDT NIET', 'RIJDT NIET'].forEach((s, i) => {
      const y = by + 50 + i * 70;
      const flip = i > 0 ? E.outPop(P(u, i * B * 0.5, i * B * 0.5 + 0.18)) : 1;
      ctx.save(); clipRect(bx, y - 34, bw, 64);
      if (i === 0) txt(s, bx + 40, y, { f: FS, size: 34, weight: 700, color: '#FFFFFF', align: 'left' });
      else {
        txt(['UTRECHT CENTRAAL', 'AMSTERDAM CENTRAAL', 'ROTTERDAM CENTRAAL'][i - 1], bx + 40, y, { f: FS, size: 40, weight: 700, color: '#FFFFFF', align: 'left' });
        ctx.save(); ctx.translate(0, (1 - flip) * -60); txt(s, bx + bw - 40, y, { f: FS, size: 40, weight: 700, color: '#FFC917', align: 'right' }); ctx.restore();
      }
      ctx.restore();
      line(bx + 20, y + 32, bx + bw - 20, y + 32, '#FFFFFF', 1, 0.2);
    });
    // an empty platform, a lone pigeon
    poly([[0, 720], [W, 690], [W, H], [0, H]], '#9AA0A6');
    rect(0, 700, W, 18, '#FFC917');
    for (let k = 0; k < 5; k++) { const x = 200 + k * 380; rect(x, 560, 22, 150, '#4A5563'); }
    const px = 1300 + Math.sin(u * 0.8) * 60, py = 860;
    ctx.save(); ctx.translate(px, py); ctx.scale(Math.cos(u * 0.8) > 0 ? 1 : -1, 1);
    ctx.fillStyle = '#5E6670'; ctx.beginPath(); ctx.ellipse(0, 0, 44, 26, 0, 0, TAU); ctx.fill();
    circle(36 + Math.abs(Math.sin(u * 6)) * 8, -26, 16, '#5E6670'); line(-10, 24, -14, 44, '#C66', 4); line(10, 24, 12, 44, '#C66', 4);
    ctx.restore();
  },

  wielrennen(u) {
    vgrad(0, 620, [[0, '#A9C7E8'], [1, '#EEF3F8']]);
    // Montréal skyline
    const r = rng(514);
    ctx.fillStyle = '#7D93AD';
    let x = 0; while (x < W) { const w = 50 + r() * 120, h = 60 + r() * 260; ctx.fillRect(x, 560 - h, w, h + 60); x += w + 8; }
    ctx.fillStyle = '#6B819B'; ctx.beginPath(); ctx.moveTo(1300, 560); ctx.quadraticCurveTo(1500, 380, 1700, 560); ctx.fill();
    vgrad(560, H, [[0, '#3E4246'], [1, '#26292C']]);
    for (let k = 0; k < 10; k++) { const xx = ((k * 250 - u * 700) % (W + 250) + W + 250) % (W + 250) - 125; rect(xx, 760, 150, 10, '#F2ECE1', 0.8); }
    // crowd barriers with a waving crowd
    for (let k = 0; k < 20; k++) rect(k * 100, 560, 90, 40, k % 2 ? '#FFFFFF' : '#D0101A');
    crowd(470, '#34465C', 71, u, { n: 40, scale: 0.6, hands: true, flags: ['#FF7A00', '#FFFFFF', '#21468B'], bounce: 8 });
    // the rider in the rainbow jersey
    const rx = W * 0.5 + Math.sin(u * 0.6) * 60, ry = 700, a = u * 9;
    ctx.save(); ctx.translate(rx, ry);
    for (let s = 0; s < 6; s++) line(-420 - s * 60, -40 + s * 24, -240 - s * 40, -40 + s * 24, '#FFFFFF', 3, 0.5);
    [[-150, 70], [150, 70]].forEach(([wx, wy]) => { ring(wx, wy, 95, '#111', 10); ctx.save(); ctx.translate(wx, wy); ctx.rotate(a); for (let k = 0; k < 8; k++) { ctx.rotate(Math.PI / 4); line(0, 0, 90, 0, '#888', 2); } ctx.restore(); });
    ctx.strokeStyle = '#DDD'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-150, 70); ctx.lineTo(-30, 60); ctx.lineTo(80, -40); ctx.lineTo(150, 70); ctx.moveTo(-30, 60); ctx.lineTo(-60, -40); ctx.lineTo(80, -40); ctx.stroke();
    const px = Math.cos(a) * 36, py = Math.sin(a) * 36;
    ctx.lineCap = 'round'; ctx.strokeStyle = '#1B1B1F'; ctx.lineWidth = 26;
    ctx.beginPath(); ctx.moveTo(-60, -70); ctx.lineTo(-30 + px * 0.4, 0); ctx.lineTo(-30 + px, 60 + py); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-60, -70); ctx.lineTo(-10 - px * 0.4, 10); ctx.lineTo(-30 - px, 60 - py); ctx.stroke();
    // torso with rainbow stripes
    ctx.save(); ctx.translate(-60, -70); ctx.rotate(-0.55);
    ctx.beginPath(); ctx.roundRect(0, -30, 170, 64, 30); ctx.clip();
    rect(0, -30, 170, 64, '#FFFFFF');
    ['#0A73C7', '#D0101A', '#111111', '#F7D117', '#1E9E4A'].forEach((c, k) => rect(60, -30 + k * 13, 110, 12, c));
    ctx.restore();
    ctx.strokeStyle = '#E8B99A'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(60, -150); ctx.lineTo(80, -40); ctx.stroke();
    circle(85, -175, 34, '#E8B99A');
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(80, -196, 44, 26, -0.3, Math.PI, 0); ctx.fill();
    ctx.restore();
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
};
// the headlines added for the faster cut, and a stronger athletics shot
Object.assign(BEELD, {
  atletiek(u) {
    // a stadium at night, the track in perspective
    vgrad(0, H, [[0, '#050814'], [0.45, '#10204A'], [1, '#07091A']]);
    [[430, 150], [W - 430, 150]].forEach(([x, y], i) => {
      for (let k = 0; k < 3; k++) for (let q = 0; q < 5; q++) circle(x - 80 + q * 40, y + k * 34, 12, '#FFF8E0');
      beam(x, y + 60, i ? 0.62 : -0.62, 1300, 380, 'rgba(255,248,224,A)', 0.13);
    });
    for (let row = 0; row < 4; row++) { const r = rng(row + 90); for (let i = 0; i < 50; i++) { const x = i * 40 + (row % 2) * 20, b = Math.max(0, Math.sin(u * 6 + i * 0.6 + row)) * 6; circle(x, 250 + row * 30 - b, 12, r() < 0.55 ? '#FF7A00' : r() < 0.8 ? '#F2ECE1' : '#21468B', 0.75); } }
    flashes(u, 91, 16, 220, 360);
    const hz = 400;
    poly([[-400, H], [W + 400, H], [W * 0.62, hz], [W * 0.38, hz]], '#B8452A');
    for (let k = 0; k <= 8; k++) { const xb = lerp(-400, W + 400, k / 8), xt = lerp(W * 0.38, W * 0.62, k / 8); line(xt, hz, xb, H, '#F2ECE1', 3, 0.7); }
    for (let k = 0; k < 7; k++) { const q = ((k / 7 + u * 0.35) % 1), y = lerp(hz, H, q * q); line(0, y, W, y, '#F2ECE1', 1 + q * 3, 0.12); }
    // the finish tape snapping
    const snap = E.outExpo(P(u, 2 * B, 2 * B + 0.2));
    const ty = 610;
    if (snap < 1) line(W * 0.18, ty, W * 0.82, ty + Math.sin(u * 10) * 4, '#FFFFFF', 6);
    else { line(W * 0.18, ty, W * 0.18 + 260 * (1 - (u - 2 * B - 0.2) * 0.3), ty + 120, '#FFFFFF', 6); line(W * 0.82, ty, W * 0.82 - 260 * (1 - (u - 2 * B - 0.2) * 0.3), ty + 120, '#FFFFFF', 6); }
    // the hurdler, mid-leap, with speed trails
    const run = E.inOutSine(P(u, 0, D));
    const hx = lerp(W * 0.18, W * 0.6, run), hy = 560 - Math.sin(clamp(run * 2.2 - 0.5) * Math.PI) * 110;
    rect(W * 0.42 - 150, 700, 300, 20, '#FFFFFF'); line(W * 0.42 - 135, 720, W * 0.42 - 135, 860, '#FFFFFF', 12); line(W * 0.42 + 135, 720, W * 0.42 + 135, 860, '#FFFFFF', 12);
    for (let k = 1; k <= 6; k++) athlete(hx - k * 60, hy + k * 6, u - k * 0.03, 0.12 * (1 - k / 7), '#FF7A00', 2);
    athlete(hx, hy, u, 1, '#FF7A00', 2);
    // gold
    const gm = E.outPop(P(u, 2.5 * B, 2.5 * B + 0.3));
    if (gm > 0) {
      const mx = W * 0.8, my = 330 + Math.sin(u * 3) * 10;
      rgrad(mx, my, 0, 420 * gm, [[0, 'rgba(255,215,90,0.55)'], [1, 'rgba(255,215,90,0)']], 'lighter');
      ctx.save(); ctx.translate(mx, my); ctx.scale(gm, gm); ctx.rotate(Math.sin(u * 2) * 0.1);
      line(-40, -260, -12, -110, '#FF7A00', 20); line(40, -260, 12, -110, '#FF7A00', 20);
      circle(0, 0, 120, '#E8C95A'); circle(0, 0, 92, '#D4AF37'); ring(0, 0, 92, '#FFF0B0', 6, 0.7);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.rotate(u * 1.5); poly([[-8, -110], [8, -110], [3, 110], [-3, 110]], '#FFFFFF', 0.35); ctx.restore();
      ctx.restore();
    }
    confetti(u, 92, 70 * P(u, 2.5 * B, 2.5 * B + 0.3), ['#FF7A00', '#FFFFFF', '#E8C95A'], 200);
  },

  vuurpaard(u) {
    vgrad(0, H, [[0, '#1A0306'], [1, '#4A0A0A']]);
    // lanterns swaying on strings
    for (let row = 0; row < 2; row++) for (let i = 0; i < 7; i++) {
      const x = 140 + i * 280 + row * 140, y = 110 + row * 120 + Math.sin(u * 1.5 + i) * 8;
      line(x, 0, x, y - 40, '#8A5A2A', 2);
      rgrad(x, y, 0, 120, [[0, 'rgba(255,90,40,0.45)'], [1, 'rgba(255,90,40,0)']], 'lighter');
      ctx.fillStyle = '#D81E1E'; ctx.beginPath(); ctx.ellipse(x, y, 42, 52, 0, 0, TAU); ctx.fill();
      rect(x - 26, y - 58, 52, 10, '#E8B84A'); rect(x - 26, y + 48, 52, 10, '#E8B84A'); line(x, y + 58, x, y + 90, '#E8B84A', 3);
    }
    // a horse's head made of fire, like a chess knight
    const cx = W * 0.62, cy = 560, s = 1.25 + 0.02 * Math.sin(u * 4);
    const head = [[-150, 330], [-150, 180], [-90, 60], [-120, -20], [-60, -150], [20, -210], [60, -250], [80, -190], [150, -130], [230, -40], [250, 30], [200, 70], [110, 40], [60, 90], [90, 330]];
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    rgrad(0, 0, 0, 500, [[0, 'rgba(255,140,40,0.5)'], [1, 'rgba(255,60,20,0)']], 'lighter');
    const g = ctx.createLinearGradient(0, 330, 0, -250); g.addColorStop(0, '#8E0E06'); g.addColorStop(0.5, C.fire); g.addColorStop(1, '#FFD27A');
    ctx.fillStyle = g; ctx.beginPath(); head.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
    circle(120, -100, 12, '#1A0306');
    ctx.restore();
    // the mane: flames licking backwards
    const r = rng(1966);
    for (let i = 0; i < 90; i++) {
      const t0 = r() * 1.2, per = 0.8 + r() * 0.6, q = ((u + t0) % per) / per;
      const bx = cx + (-110 + r() * 120) * s, by = cy + (-200 + r() * 330) * s;
      circle(bx - q * 160 - Math.sin(q * 6 + i) * 20, by - q * 120, (18 + r() * 20) * (1 - q), q < 0.4 ? '#FFD27A' : C.fire, 0.8 * (1 - q));
    }
    // gold bursts
    for (let i = 0; i < 3; i++) {
      const t0 = 0.1 + i * B, fx = 200 + i * 300, fy = 250 + (i % 2) * 120, k = u - t0;
      if (k < 0 || k > 1.3) continue;
      for (let sp = 0; sp < 30; sp++) { const a = sp * TAU / 30, d = 150 * E.outExpo(k); circle(fx + Math.cos(a) * d, fy + Math.sin(a) * d + k * k * 40, 4, '#FFD27A', 1 - k / 1.3); }
    }
  },

  pro(u) {
    rect(0, 0, W, H, '#07120C');
    rgrad(W / 2, 380, 0, 900, [[0, 'rgba(60,200,110,0.35)'], [1, 'rgba(60,200,110,0)']]);
    for (let i = 0; i < 6; i++) beam(260 + i * 280, -20, Math.sin(u + i) * 0.35, 1100, 170, 'rgba(120,255,170,A)', 0.12);
    // a green rose opening up
    const bloom = E.outPop(P(u, 0.05, B)), cx = W / 2, cy = 380;
    rgrad(cx, cy, 0, 420, [[0, 'rgba(120,255,160,0.35)'], [1, 'rgba(0,0,0,0)']], 'lighter');
    line(cx, cy + 60, cx - 20, cy + 420, '#1F7A3A', 16);
    ctx.save(); ctx.translate(cx - 18, cy + 250); ctx.rotate(-0.6); ctx.fillStyle = '#2FA35A'; ctx.beginPath(); ctx.ellipse(-60, 0, 70, 26, 0, 0, TAU); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(cx, cy); ctx.scale(bloom, bloom); ctx.rotate(u * 0.1);
    for (let ring2 = 3; ring2 >= 0; ring2--) {
      const n = 5 + ring2, rr = 40 + ring2 * 42, c = ['#7CF0A4', '#4FD27F', '#2FB060', '#1E8A48'][ring2];
      for (let k = 0; k < n; k++) { const a = k * TAU / n + ring2 * 0.5; ctx.save(); ctx.rotate(a); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -rr * 0.7, rr * 0.55, rr * 0.8, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    }
    ctx.restore();
    crowd(800, '#030805', 26, u, { n: 34, hands: true, bounce: 12 });
    confetti(u, 26, 90, ['#4FD27F', '#FFFFFF', '#1E8A48'], 130);
  },

  schiphol(u) {
    vgrad(0, H, [[0, '#DDE3EA'], [1, '#AEB8C4']]);
    // big windows with a plane taxiing past
    rect(0, 60, W, 360, '#8FB6D9');
    const px = ((u * 180) % (W + 900)) - 450;
    ctx.save(); clipRect(0, 60, W, 360);
    poly([[px, 300], [px + 520, 300], [px + 580, 270], [px + 520, 250], [px + 40, 250]], '#F4F6F8');
    poly([[px + 220, 280], [px + 360, 280], [px + 260, 370]], '#DDE2E8'); poly([[px + 40, 250], [px + 100, 250], [px + 30, 170], [px + 0, 170]], '#1C5FB8');
    ctx.restore();
    for (let k = 0; k <= 8; k++) rect(k * 240, 60, 14, 360, '#4A5563');
    rect(0, 400, W, 24, '#4A5563');
    // the yellow signs
    rect(120, 450, 520, 70, '#FFC917'); txt('VERTREK · DEPARTURES', 380, 486, { f: FS, size: 30, weight: 700, color: '#1A1F28' });
    rect(1240, 450, 560, 70, '#1A1F28'); txt('VERTRAGD · DELAYED', 1520, 486, { f: FS, size: 30, weight: 700, color: '#FFC917', alpha: 0.6 + 0.4 * (Math.floor(u * 2) % 2) });
    rect(0, 560, W, H - 560, '#C8CDD3');
    // the queue snakes back and forth, barely moving
    const r = rng(518);
    for (let row = 0; row < 4; row++) {
      const y = 620 + row * 110, sc = 0.8 + row * 0.12;
      line(0, y + 90 * sc, W, y + 90 * sc, '#2F4BFF', 4, 0.5);
      for (let i = 0; i < 22; i++) {
        const x = ((row % 2 ? W - i * 90 : i * 90) + (row % 2 ? -1 : 1) * u * 6) + r() * 30;
        const c = ['#1A1A20', '#34465C', '#5A3A2A', '#2F4B3A'][i % 4];
        circle(x, y - 70 * sc, 16 * sc, c); poly([[x - 22 * sc, y + 40 * sc], [x - 18 * sc, y - 50 * sc], [x + 18 * sc, y - 50 * sc], [x + 22 * sc, y + 40 * sc]], c);
        if (r() < 0.5) { rect(x + 26 * sc, y, 34 * sc, 46 * sc, r() < 0.5 ? C.fire : '#1C5FB8'); line(x + 43 * sc, y, x + 43 * sc, y - 30 * sc, '#333', 3); }
      }
    }
  },

  japan(u) {
    vgrad(0, 700, [[0, '#9CC8EE'], [1, '#EAF4FB']]);
    vgrad(640, H, [[0, '#6FA05A'], [1, '#3D6B34']]);
    // flags on poles
    [[260, '#FFFFFF', 'jp'], [420, null, 'nl']].forEach(([x, , k]) => {
      line(x, 620, x, 140, '#666', 6);
      const wv = Math.sin(u * 3 + x) * 8;
      if (k === 'jp') { poly([[x, 150], [x + 200, 150 + wv], [x + 200, 280 + wv], [x, 280]], '#FFFFFF'); circle(x + 100, 215 + wv / 2, 40, '#BC002D'); }
      else ['#AE1C28', '#FFFFFF', '#21468B'].forEach((c, i) => poly([[x, 150 + i * 44], [x + 200, 150 + i * 44 + wv], [x + 200, 194 + i * 44 + wv], [x, 194 + i * 44]], c));
    });
    // the cherry tree
    const tx = W * 0.62, ty = 660, grow = E.outBack(P(u, 0, 1.5 * B));
    ctx.save(); ctx.strokeStyle = '#5A3A2A'; ctx.lineCap = 'round';
    const branch = (x, y, a, len, w, d) => {
      if (d === 0) return;
      const x2 = x + Math.cos(a) * len * grow, y2 = y + Math.sin(a) * len * grow;
      ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
      if (d <= 2) for (let k = 0; k < 6; k++) circle(x2 + Math.cos(k) * 26, y2 + Math.sin(k * 1.3) * 22, 30 * grow, ['#F7B8CF', '#F4A3C0', '#FFD1E0'][k % 3], 0.9);
      branch(x2, y2, a - 0.45, len * 0.72, w * 0.68, d - 1);
      branch(x2, y2, a + 0.4, len * 0.72, w * 0.68, d - 1);
    };
    branch(tx, ty, -Math.PI / 2, 200, 34, 5);
    ctx.restore();
    // falling petals
    const r = rng(1917);
    for (let i = 0; i < 70; i++) { const x0 = tx - 500 + r() * 1000, sp = 40 + r() * 60, y = ((r() * 700 + u * sp) % 700) + 150, x = x0 + Math.sin(u * 2 + i) * 30 + u * 20; ctx.save(); ctx.translate(x, y); ctx.rotate(u * 2 + i); ctx.fillStyle = '#F7B8CF'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 5, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    // a spade in fresh earth
    ctx.fillStyle = '#4A3226'; ctx.beginPath(); ctx.ellipse(tx, ty + 10, 160, 30, 0, 0, TAU); ctx.fill();
    line(tx + 170, ty - 170, tx + 110, ty + 10, '#8A6A3A', 10); poly([[tx + 95, ty], [tx + 130, ty + 10], [tx + 115, ty + 60], [tx + 85, ty + 50]], '#B8BEC6');
  },

  amerika(u) {
    vgrad(0, H, [[0, '#050A24'], [1, '#141C44']]);
    starsBg(250, 120, 0.6, u);
    // fireworks in red, white and blue
    const r = rng(1776);
    for (let i = 0; i < 9; i++) {
      const t0 = r() * D * 0.8 - 0.3, fx = 150 + r() * 1620, fy = 120 + r() * 320, k = u - t0, c = ['#E0162B', '#FFFFFF', '#3C5BFF'][i % 3];
      if (k < 0) { if (k > -0.5) line(fx, 760 + k * 700, fx, 760 + (k + 0.05) * 700 - 60, '#FFE7B0', 3, 0.8); continue; }
      if (k > 1.6) continue;
      for (let sp = 0; sp < 44; sp++) { const a = sp * TAU / 44, d = 190 * E.outExpo(k); line(fx + Math.cos(a) * d * 0.7, fy + Math.sin(a) * d * 0.7 + k * k * 30, fx + Math.cos(a) * d, fy + Math.sin(a) * d + k * k * 40, c, 3, 1 - k / 1.6); }
      rgrad(fx, fy, 0, 260, [[0, `rgba(255,255,255,${0.25 * Math.max(0, 1 - k * 2)})`], [1, 'rgba(255,255,255,0)']], 'lighter');
    }
    // the skyline with the Capitol dome
    ctx.fillStyle = '#03040C';
    const rr = rng(4);
    let x = 0; while (x < W) { const w = 70 + rr() * 110, h = 90 + rr() * 200; ctx.fillRect(x, 780 - h, w, h + 300); x += w + 4; }
    const cx = W * 0.5; ctx.fillRect(cx - 260, 620, 520, 200); ctx.beginPath(); ctx.moveTo(cx - 140, 620); ctx.quadraticCurveTo(cx - 140, 470, cx, 450); ctx.quadraticCurveTo(cx + 140, 470, cx + 140, 620); ctx.fill(); ctx.fillRect(cx - 12, 400, 24, 60);
    // bunting
    for (let i = 0; i < 13; i++) { const x0 = i * 160, y0 = 40 + Math.sin(u * 2 + i) * 4; ctx.fillStyle = i % 2 ? '#E0162B' : '#FFFFFF'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + 80, y0 + 60, x0 + 160, y0); ctx.lineTo(x0 + 160, y0 - 20); ctx.lineTo(x0, y0 - 20); ctx.fill(); }
  },

  amalia(u) {
    vgrad(0, 560, [[0, '#8FB0CF'], [1, '#D7E3EE']]);
    // gulls
    for (let i = 0; i < 6; i++) { const x = ((i * 330 + u * 60) % (W + 200)) - 100, y = 120 + (i % 3) * 60 + Math.sin(u * 2 + i) * 10, f = Math.sin(u * 8 + i) * 12; ctx.save(); ctx.strokeStyle = '#333'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 30, y - f); ctx.quadraticCurveTo(x - 12, y - 18, x, y); ctx.quadraticCurveTo(x + 12, y - 18, x + 30, y - f); ctx.stroke(); ctx.restore(); }
    vgrad(540, H, [[0, '#3E6B8C'], [1, '#1A3348']]);
    for (let i = 0; i < 14; i++) { const y = 560 + i * 30, o = (u * 50 + i * 60) % 220; ctx.save(); ctx.globalAlpha = 0.25; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = -o; x < W; x += 220) { ctx.moveTo(x, y); ctx.lineTo(x + 80, y); } ctx.stroke(); ctx.restore(); }
    // the frigate
    const sx = 260 + u * 14, sy = 590 + Math.sin(u * 1.4) * 5;
    poly([[sx, sy - 50], [sx + 1180, sy - 50], [sx + 1300, sy - 110], [sx + 1240, sy + 30], [sx + 60, sy + 30]], '#5E6670');
    poly([[sx + 300, sy - 50], [sx + 330, sy - 190], [sx + 720, sy - 190], [sx + 760, sy - 50]], '#6E7680');
    rect(sx + 440, sy - 300, 140, 110, '#6E7680'); line(sx + 510, sy - 300, sx + 510, sy - 440, '#555', 8);
    ctx.save(); ctx.translate(sx + 510, sy - 360); ctx.rotate(u * 2); rect(-50, -4, 100, 8, '#444'); ctx.restore();
    txt('F 802', sx + 1080, sy - 12, { f: FS, size: 34, weight: 700, color: '#F2ECE1' });
    ['#AE1C28', '#FFFFFF', '#21468B'].forEach((c, i) => poly([[sx + 1250, sy - 180 + i * 20], [sx + 1340, sy - 180 + i * 20 + Math.sin(u * 5) * 6], [sx + 1340, sy - 160 + i * 20 + Math.sin(u * 5) * 6], [sx + 1250, sy - 160 + i * 20]], c));
    line(sx + 1250, sy - 60, sx + 1250, sy - 180, '#333', 4);
    // an anchor, big, in the corner
    const ax = 1640, ay = 300, as = E.outBack(P(u, 0.2, 0.7));
    ctx.save(); ctx.translate(ax, ay); ctx.scale(as, as); ctx.strokeStyle = '#1A2A44'; ctx.lineWidth = 18; ctx.lineCap = 'round';
    ring(0, -120, 26, '#1A2A44', 14); ctx.beginPath(); ctx.moveTo(0, -94); ctx.lineTo(0, 120); ctx.moveTo(-70, -40); ctx.lineTo(70, -40); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 30, 110, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.restore();
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
});

// a runner in the reel's style; ph drives the stride
function athlete(x, y, ph, a, c, size = 1) {
  if (a <= 0) return;
  const s = ph * 11;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(size, size); ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const lim = (pts, w) => { ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.stroke(); };
  // lead leg stretched over the hurdle, trail leg folded
  lim([[0, 0], [70 + Math.sin(s) * 10, 30], [130, 40]], 26);
  lim([[0, 0], [-60, 20 + Math.cos(s) * 10], [-40, 80]], 26);
  lim([[0, 0], [40, -120]], 34);
  lim([[30, -100], [110, -80 + Math.sin(s) * 15], [150, -110]], 18);
  lim([[30, -100], [-40, -60 - Math.sin(s) * 15], [-70, -20]], 18);
  circle(58, -160, 30, c);
  ctx.restore();
}

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


// Where the maatje of a picture stands, if not bottom right; a function of u follows something that moves.
const PLEK = {
  nachtwacht: u => ({ x: 250 + 1420 * E.inOutSine(P(u, 0.1, D)) + 30, y: 110 + 620 - 40 + 40, h: 230, flip: false, side: -1 }),
  japan: { x: 1480, y: 700, h: 230 },
  amerika: { x: 1500, y: 0, h: 260 },
  pro: { x: 1520, y: FLOOR - 120, h: 260 },
  zon: { x: 1560, y: 760, h: 210 },
  koningsdag: { h: 380 },
};
