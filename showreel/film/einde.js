/*
 * The end of the film: in memoriam (quiet, no gags), the secret dossier (which the
 * raccoon steals) and the finale: 2026 from a cloud of sparks, the Blackjacks
 * Quiz, every maatje in a conga line and a kick line, and the countdown into the quiz.
 */

// ---- in memoriam (4 bars)
function sMemoriam(lt, sc) {
  const beat = sc.beat;
  rect(0, 0, W, H, C.ink);
  rgrad(W / 2, H * 0.62, 0, 900, [[0, 'rgba(255,170,90,0.10)'], [1, 'rgba(0,0,0,0)']]);
  const out = 1 - P(lt, sc.dur - beat, sc.dur - 0.05);
  const push = 1 + 0.03 * P(lt, 0, sc.dur);
  ctx.save();
  ctx.globalAlpha = out;
  ctx.translate(W / 2, H / 2); ctx.scale(push, push); ctx.translate(-W / 2, -H / 2);
  txt('IN MEMORIAM', W / 2, 200, { f: FS, size: 34, weight: 700, color: C.paper, track: lerp(10, 26, E.outExpo(P(lt, 0.2, 4 * beat))), alpha: P(lt, 0.1, beat) });
  line(W / 2 - 200 * E.outExpo(P(lt, beat * 0.5, beat * 2)), 242, W / 2 + 200 * E.outExpo(P(lt, beat * 0.5, beat * 2)), 242, C.fire, 2);
  MEMORIAM.forEach((p, i) => {
    const colI = i % 2, row = Math.floor(i / 2);
    const x = colI ? W / 2 + 60 : W / 2 - 60, y = 380 + row * 190;
    const t0 = beat * (1.5 + i * 1.75);
    const a = E.outCubic(P(lt, t0, t0 + beat * 1.5));
    txt(p.naam.toUpperCase(), x, y + (1 - a) * 20, { f: FD, size: 76, color: C.paper, align: colI ? 'left' : 'right', base: 'alphabetic', alpha: a });
    txt(p.wie.toUpperCase(), x, y + 44, { f: FM, size: 18, color: C.paper, align: colI ? 'left' : 'right', track: 4, alpha: a * 0.55 });
  });
  // one small flame
  const fl = 0.85 + 0.15 * Math.sin(lt * 9) * Math.sin(lt * 5.3);
  const ca = P(lt, beat, beat * 3);
  rect(W / 2 - 14, 960, 28, 70, '#E9E2D2', ca);
  ctx.save(); ctx.globalAlpha *= ca; ctx.fillStyle = '#FFC46B'; ctx.beginPath(); ctx.ellipse(W / 2, 935, 11 * fl, 24 * fl, 0, 0, TAU); ctx.fill(); ctx.restore();
  rgrad(W / 2, 935, 0, 160, [[0, `rgba(255,190,100,${0.35 * ca * fl})`], [1, 'rgba(255,190,100,0)']], 'lighter');
  ctx.restore();
}

// ---- het dossier (2 bars)
function sDossier(lt, sc) {
  const beat = sc.beat;
  rect(0, 0, W, H, C.ink);
  rgrad(W / 2, H / 2, 100, 1100, [[0, 'rgba(47,75,255,0.25)'], [1, 'rgba(0,0,0,0)']]);
  const r = rng(12);
  const slide = E.inOutExpo(P(lt, beat * 4, beat * 4.5));
  // the raccoon grabs it on beat 6 and runs off with it on beat 7
  const grab = lt > beat * 6.5, run = E.inCubic(P(lt, beat * 7, beat * 8));
  const fx = W / 2 - slide * 380 + run * 2000, fy = H / 2 + (1 - E.outPop(P(lt, 0, beat * 0.6))) * 900 + (grab ? -40 - Math.abs(Math.sin(lt * 20)) * 20 * (run > 0 ? 1 : 0) : 0);
  ctx.save();
  ctx.translate(fx, fy);
  ctx.rotate(-0.035 + slide * 0.02 + (grab ? -0.12 : 0));
  const sw = 1000, sh = 760;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40;
  rect(-sw / 2, -sh / 2, sw, sh, C.paper); ctx.restore();
  txt('DOSSIER 2026', -sw / 2 + 60, -sh / 2 + 110, { f: FD, size: 76, color: C.ink, align: 'left', base: 'alphabetic' });
  txt('VERTROUWELIJK · ALLEEN VOOR DE BLACKJACKS', -sw / 2 + 64, -sh / 2 + 150, { f: FM, size: 16, weight: 700, color: C.ink, align: 'left', track: 4, alpha: 0.6 });
  line(-sw / 2 + 60, -sh / 2 + 175, sw / 2 - 60, -sh / 2 + 175, C.ink, 2, 0.5);
  for (let i = 0; i < 11; i++) {
    const y = -sh / 2 + 225 + i * 44;
    const w1 = (0.55 + r() * 0.4) * (sw - 120);
    rect(-sw / 2 + 60, y, w1, 12, C.ink, 0.12);
    // redaction bars slam in on the sixteenths
    const t0 = beat * (0.5 + i * 0.25);
    const rp = E.outExpo(P(lt, t0, t0 + 0.1));
    const rx = -sw / 2 + 60 + r() * w1 * 0.3, rw = (0.3 + r() * 0.5) * w1;
    if (rp > 0) rect(rx, y - 12, rw * rp, 34, C.ink);
  }
  const sp = P(lt, beat * 3.5, beat * 3.5 + 0.2);
  if (sp > 0) {
    const s = lerp(2.4, 1, E.outPop(sp));
    ctx.save(); ctx.translate(120, 200); ctx.rotate(-0.18); ctx.scale(s, s);
    ctx.globalAlpha = Math.min(1, sp * 3) * 0.92;
    ctx.strokeStyle = C.fire; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.roundRect(-330, -80, 660, 160, 14); ctx.stroke();
    txt('GEHEIM', 0, -10, { f: FL, size: 96, color: C.fire, base: 'alphabetic' });
    txt('TOT VANAVOND', 0, 50, { f: FM, size: 30, weight: 700, color: C.fire, track: 10 });
    ctx.restore();
  }
  ctx.restore();
  // the raccoon
  if (lt > beat * 5.5) {
    const g = lt - beat * 5.5;
    const rx = lerp(W + 200, fx + 420, E.outCubic(P(g, 0, beat))) + run * 2000;
    dier('wasbeer', rx, H - 60, 300, { flip: !grab, pose: { poten: Math.floor(lt * (run > 0 ? 16 : 8)) % 2 ? 'a' : 'b', ogen: grab ? 'blij' : 'open', arm: grab ? 'op' : 'neer' } });
    if (grab) ballon('HEBBES!', rx, H - 330, lt - beat * 6.5, { side: 1 });
    else if (g > beat * 0.6) txt('?', rx - 40, H - 420, { f: FL, size: 90, color: C.sun });
  }
  const ta = P(lt, beat * 4.3, beat * 4.6) * (1 - P(lt, beat * 7, beat * 7.6));
  ctx.save(); clipRect(W / 2 + 140, 280, W, 560);
  ['DE REST', 'VAN HET NIEUWS', 'HOOR JE', 'VANAVOND.'].forEach((s, i) => {
    const p = E.outPop(P(lt, beat * (4.3 + i * 0.25), beat * (4.3 + i * 0.25) + 0.25));
    sticker(s, W / 2 + 200, 420 + i * 100 + (1 - p) * 120, { size: 86, shadow: i === 3 ? C.fire : C.blue, alpha: ta });
  });
  ctx.restore();
}

// ---- de quiz (4 bars)
let PARTS = null;
const FINAL = { size: 560, y: H / 2 - 60 };
function buildParticles() {
  const oc = document.createElement('canvas'); oc.width = W; oc.height = H;
  const o = oc.getContext('2d');
  o.fillStyle = '#fff'; o.font = font(FD, FINAL.size); o.textAlign = 'center'; o.textBaseline = 'alphabetic';
  o.fillText('2026', W / 2, FINAL.y + capH(FINAL.size) / 2);
  const data = o.getImageData(0, 0, W, H).data;
  const r = rng(314);
  PARTS = [];
  for (let y = 0; y < H; y += 6) for (let x = 0; x < W; x += 6) {
    if (data[(y * W + x) * 4 + 3] > 128) {
      const a = r() * TAU, d = 250 + r() * 900, c = r();
      PARTS.push({ tx: x + (r() - .5) * 2, ty: y + (r() - .5) * 2, mx: W / 2 + Math.cos(a) * d * 1.4, my: H / 2 + Math.sin(a) * d * 0.8, sx: W / 2 + (r() - .5) * 40, sy: H / 2 + (r() - .5) * 40, col: c < 0.7 ? 0 : c < 0.86 ? 1 : 2, dl: r() * 0.15 });
    }
  }
}
function partPos(p, u, S) {
  // burst, swirl, and land on the downbeat S
  const k = S / 1.94;
  const burst = E.outExpo(P(u, 0, 0.5 * k));
  const q = E.inOutExpo(P(u, (0.4 + (p.tx / W) * 0.3 + p.dl) * k, (1.5 + (p.tx / W) * 0.2 + p.dl) * k));
  const bx = lerp(p.sx, p.mx, burst), by = lerp(p.sy, p.my, burst);
  const sw = (1 - q) * burst * 0.6;
  const dx = bx - W / 2, dy = by - H / 2;
  const rx = W / 2 + dx * Math.cos(sw) - dy * Math.sin(sw), ry = H / 2 + dx * Math.sin(sw) + dy * Math.cos(sw);
  return { x: lerp(rx, p.tx, q), y: lerp(ry, p.ty, q) };
}
const CONGA = ['kip', 'lama', 'zeehond', 'hond', 'pinguin', 'kikker', 'eenhoorn', 'hamster', 'aap', 'flamingo', 'nijlpaard', 'wasbeer'];
function sFinale(lt, sc) {
  const beat = sc.beat, bar = sc.bar;
  rect(0, 0, W, H, C.ink);
  if (!PARTS) buildParticles();
  const S = bar;                    // the solid 2026 lands on the second bar
  const INV = 1.5 * bar, CD = sc.dur - bar;
  const up = E.inOutExpo(P(lt, INV, INV + beat * 1.5));
  const cnt = lt >= CD - 0.001;
  ctx.save();
  ctx.translate(0, -up * 280);
  ctx.translate(W / 2, FINAL.y); ctx.scale(1 - up * 0.45, 1 - up * 0.45); ctx.translate(-W / 2, -FINAL.y);
  const solid = P(lt, S - 0.02, S + 0.1);
  const pa = 1 - P(lt, S, S + 0.3);
  if (pa > 0) {
    const cols = [C.paper, C.fire, C.blue];
    for (let c = 0; c < 3; c++) {
      ctx.save(); ctx.strokeStyle = cols[c]; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.globalAlpha = pa;
      ctx.beginPath();
      for (const p of PARTS) {
        if (p.col !== c) continue;
        const a = partPos(p, lt, S), b = partPos(p, lt - 1 / FPS, S);
        ctx.moveTo(b.x, b.y); ctx.lineTo(a.x + 0.01, a.y);
      }
      ctx.stroke(); ctx.restore();
    }
  }
  if (solid > 0) {
    const sc2 = lerp(1.08, 1, E.outPop(P(lt, S, S + 0.4))) * (1 + 0.02 * beatPulse(lt, 9));
    ctx.save();
    ctx.translate(W / 2, FINAL.y); ctx.scale(sc2, sc2); ctx.translate(-W / 2, -FINAL.y);
    const sh = E.inOutCubic(P(lt, S + beat, S + beat * 2.5));
    const g = ctx.createLinearGradient(0, 0, W, 0);
    const pos = lerp(-0.2, 1.2, sh);
    const st = (o, c) => { if (o >= 0 && o <= 1) g.addColorStop(o, c); };
    g.addColorStop(0, C.paper); st(pos - 0.12, C.paper); st(pos - 0.04, C.fire); st(pos, '#FFFFFF'); st(pos + 0.04, C.blue); st(pos + 0.12, C.paper); g.addColorStop(1, C.paper);
    ctx.globalAlpha = solid;
    digits('2026', W / 2, FINAL.y, FINAL.size, sh > 0 && sh < 1 ? g : C.paper);
    ctx.restore();
  }
  ctx.restore();
  const fl = lt >= S ? Math.exp(-(lt - S) * 10) : 0;
  if (fl > 0.01) rect(0, 0, W, H, '#fff', fl * 0.5);

  // the invitation
  const ia = P(lt, INV + 0.2, INV + 0.5);
  if (ia > 0) {
    const tl = 'BLACKJACKS QUIZ', TL = layout(tl, font(FL, 170));
    TL.chars.forEach((c, i) => {
      const p = E.outPop(P(lt, INV + 0.2 + i * 0.025, INV + 0.5 + i * 0.025));
      if (p <= 0) return;
      const x = W / 2 - TL.width / 2 + c.x, y = 560 - hop(lt + i * 0.05) * 14 * P(lt, INV + 1, INV + 1.2);
      around(x + c.w / 2, y - 60, p, (1 - p) * 0.5, () => sticker(c.ch, x, y, { size: 170, shadow: i < 10 ? C.fire : C.blue }));
    });
  }
  txt('OUDEJAARSAVOND · 31.12.2026', W / 2, 650, { f: FM, size: 28, weight: 700, color: C.sun, track: 10, alpha: ia * P(lt, INV + beat, INV + beat * 1.3) });
  txt('MOTION DESIGN, TYPE, CODE & SOUND — CLAUDE · MET DE MAATJES', W / 2, 700, { f: FM, size: 16, color: C.paper, track: 6, alpha: ia * 0.5 * P(lt, INV + beat * 1.5, INV + beat * 2) });

  // the conga line comes in, then the kick line
  const c0 = S + beat;
  if (lt > c0) {
    const g = lt - c0, n = CONGA.length, kick = lt > 2 * bar;
    CONGA.forEach((key, i) => {
      const home = 120 + i * (W - 240) / (n - 1);
      const x = Math.min(home, -200 + g * 1500 - i * 150);
      if (x < -150) return;
      const arrived = x >= home - 1;
      const k2 = lt - 2 * bar;
      const up = kick ? (Math.floor(k2 / beat * 2) % 2 === i % 2 ? hop(k2 * 2) : 0) : hop(g + i * 0.05) * 0.25;
      dier(key, x, H - 40 - up * 160, 200, { pose: { poten: arrived && !kick ? 'rust' : Math.floor(lt * 12 + i) % 2 ? 'a' : 'b', ogen: kick ? 'blij' : 'open', blos: kick, arm: kick && up > 0.3 ? 'op' : 'neer', vleugel: Math.floor(lt * 14 + i) % 2 ? 'op' : 'neer' }, rot: kick ? 0 : Math.sin(lt * 10 + i) * 0.06, sx: 1 + 0.1 * beatPulse(lt, 12) * (kick ? 1 : 0), sy: 1 - 0.1 * beatPulse(lt, 12) * (kick ? 1 : 0) });
    });
  }
  if (lt > 2 * bar) confettiRegen(lt - 2 * bar, 220);

  // countdown on the last bar, a maatje through every number
  if (cnt) {
    const k = Math.min(3, Math.floor((lt - CD) / beat));
    const u = lt - CD - k * beat;
    const lbl = ['3', '2', '1', 'START!'][k];
    const bgc = [C.fire, C.blue, C.sun, C.ink][k];
    rect(0, 0, W, H, bgc);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(u * 0.6); ctx.globalAlpha = 0.15; ctx.fillStyle = '#FFFFFF';
    for (let q = 0; q < 14; q++) { ctx.rotate(TAU / 14); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1300, -150); ctx.lineTo(1300, 150); ctx.fill(); }
    ctx.restore();
    const s = lerp(2.2, 1, E.outPop(P(u, 0, 0.25)));
    around(W / 2, H / 2, s, (1 - P(u, 0, 0.25)) * 0.4, () => {
      if (k < 3) sticker(lbl, W / 2, H / 2 + 260, { size: 640, shadow: [C.ink, C.ink, C.fire][k], align: 'center', fill: C.paper });
      else sticker(lbl, W / 2, H / 2 + 120, { size: 330, shadow: C.fire, align: 'center', fill: C.paper });
    });
    const who = ['kangoeroe', 'kip', 'lama', 'hond'][k];
    const jx = lerp(-200, W + 200, P(u, 0, beat));
    dier(who, jx, H - 120 - Math.sin(Math.PI * P(u, 0, beat)) * 500, 300, { pose: { ogen: 'blij', arm: 'op', vleugel: 'op', poten: 'a' }, rot: P(u, 0, beat) * TAU });
    if (k === 3) BENDE.slice(0, 14).forEach((key, i) => acteur(key, 'juich', u - i * 0.015, 80 + i * 136, H + 20, 210, { flip: i > 6, t0: i }));
    const cl = E.inExpo(P(lt, sc.dur - 0.25, sc.dur - 0.02));
    if (cl > 0) { rect(0, 0, W, H / 2 * cl, '#000'); rect(0, H - H / 2 * cl, W, H / 2 * cl + 1, '#000'); }
  }
}
function confettiRegen(u, n) {
  const r = rng(7), cols = [C.fire, C.sun, C.blue, C.pink, C.paper, C.mint];
  for (let i = 0; i < n; i++) {
    const x0 = r() * W, sp = 0.6 + r(), ph = r() * 10;
    const y = -40 + (r() * 300 + u * 380 * sp) - 300;
    if (y > H + 20) continue;
    const x = x0 + Math.sin(u * 2 + ph) * 40;
    ctx.save(); ctx.translate(x, y); ctx.rotate(u * 3 * sp + ph); ctx.scale(1, Math.cos(u * 6 * sp + ph));
    ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-9, -5, 18, 10); ctx.restore();
  }
}
