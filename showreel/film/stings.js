/*
 * How a month opens: two beats, and a different trick every time (STINGS in
 * reel-data.js): the calendar page ripped off, a neon sign flickering on, a rubber
 * stamp, a train that stops just right, letters that drop, a plane with a banner,
 * letters blown up like balloons, a typewriter.
 */
function stingVan(sc, lt) {
  const f = STING[sc.sting] || STING.kalender;
  f(sc, lt, MAANDEN[sc.m], sc.beat);
  maandBalk(sc.m, sc.prevM === 11 && sc.m === 0 ? -1 : sc.prevM, lt, sc.beat);
}
// where we are in the year: twelve months and a maatje walking along
function maandBalk(m, prevM, lt, beat) {
  const x0 = 460, x1 = W - 460, y = H - 46, segW = (x1 - x0) / 12;
  const pos = lerp(prevM, m, E.inOutExpo(P(lt, 0.1, beat * 1.2)));
  rect(x0 - 24, y - 26, x1 - x0 + 48, 56, C.ink, 0.8);
  rect(x0, y - 3, Math.max(0, (pos + 1) * segW), 6, C.paper, 0.9);
  for (let k = 0; k < 12; k++) txt(MND[k], x0 + (k + 0.5) * segW, y + 18, { f: FM, size: 13, weight: k === m ? 700 : 400, color: C.paper, track: 2, alpha: k === m ? 1 : 0.4 });
  if (pos >= 0) dier(ROLL[m % ROLL.length], x0 + (pos + 0.5) * segW, y + 2, 48, { pose: { poten: Math.floor(lt * 12) % 2 ? 'a' : 'b' }, schaduw: false });
}
const STING = {
  kalender: (sc, lt) => kalender(sc, lt),

  // a neon sign on a brick wall flickers on; a moth can't stay away
  neon(sc, lt, naam, beat) {
    rect(0, 0, W, H, '#1A0F14');
    for (let r = 0; r < 30; r++) for (let q = 0; q < 26; q++) rect(q * 80 + (r % 2) * 40, r * 36, 74, 30, r % 3 ? '#24151B' : '#2A1820');
    const flick = lt < beat * 0.6 ? (hash(String(Math.floor(lt * 24))) % 3 ? 1 : 0.15) : 1;
    const kleur = '#FF4FD8', size = 300;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = kleur; ctx.shadowBlur = 50 * flick;
    ctx.font = font(FL, size); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
    ctx.globalAlpha = flick; ctx.strokeStyle = kleur; ctx.lineWidth = 14; ctx.strokeText(naam, W / 2, H / 2 + 100);
    ctx.strokeStyle = '#FFE0F8'; ctx.lineWidth = 5; ctx.strokeText(naam, W / 2, H / 2 + 100);
    ctx.font = font(FL, 90); ctx.strokeStyle = '#4FE3FF'; ctx.shadowColor = '#4FE3FF'; ctx.lineWidth = 6; ctx.strokeText('2026', W / 2, H / 2 - 190);
    ctx.restore();
    const a = lt * 5;
    dier('vlinder', W / 2 + Math.cos(a) * 520, H / 2 - 120 + Math.sin(a * 1.7) * 160, 130, { flip: Math.sin(a) > 0, pose: { vleugel: Math.floor(lt * 18) % 2 ? 'op' : 'neer' }, schaduw: false });
  },

  // a giant rubber stamp comes down
  stempel(sc, lt, naam, beat) {
    vgrad(0, H, [[0, '#F4EEE2'], [1, '#E6DCC8']]);
    for (let y = 120; y < H; y += 48) line(0, y, W, y, '#C9D8E8', 2, 0.6);
    const slam = beat * 0.35, hit = lt >= slam;
    if (hit) {
      ctx.save(); ctx.translate(W / 2, H / 2 + 40); ctx.rotate(-0.06);
      ctx.strokeStyle = '#C8261E'; ctx.lineWidth = 14; ctx.beginPath(); ctx.roundRect(-760, -210, 1520, 360, 30); ctx.stroke();
      txt(naam, 0, 60, { f: FL, size: 250, color: '#C8261E', base: 'alphabetic' });
      txt('★ 2026 ★', 0, -140, { f: FL, size: 60, color: '#C8261E' });
      const r = rng(sc.m + 3); ctx.fillStyle = '#F4EEE2'; for (let k = 0; k < 500; k++) ctx.fillRect(-760 + r() * 1520, -210 + r() * 360, 3 + r() * 5, 2 + r() * 4);
      ctx.restore();
      const g = lt - slam, r2 = rng(sc.m);
      for (let k = 0; k < 14; k++) { const an = r2() * TAU, d = 700 + r2() * 300; circle(W / 2 + Math.cos(an) * d * E.outExpo(P(g, 0, 0.2)), H / 2 + Math.sin(an) * d * 0.5 * E.outExpo(P(g, 0, 0.2)), 6 + r2() * 14, '#C8261E', 0.8); }
    }
    // the stamp itself
    // it hangs in the top of the frame, winds up, slams
    const down = E.inBack(P(lt, 0, slam)), up = E.inOutCubic(P(lt, slam + beat * 0.3, beat * 1.4));
    const sy = lerp(260, H / 2 + 200, down) - up * 1300;
    if (!hit) { ctx.save(); ctx.globalAlpha = 0.18 + 0.3 * down; ctx.fillStyle = '#5A3A1A'; ctx.beginPath(); ctx.ellipse(W / 2, H / 2 + 40, 700 * (0.7 + 0.3 * down), 160 * (0.7 + 0.3 * down), -0.06, 0, TAU); ctx.fill(); ctx.restore(); }
    if (sy > -650) {
      ctx.save(); ctx.translate(W / 2, sy); ctx.rotate(-0.06);
      rect(-80, -520, 160, 360, '#8A5A2A'); circle(0, -540, 120, '#8A5A2A');
      rect(-800, -170, 1600, 120, '#5A3A1A'); rect(-780, -50, 1560, 40, '#C8261E');
      ctx.restore();
    }
    if (hit && lt < slam + 0.25) sticker('KLETS!', W - 330, 200, { size: 100, shadow: '#C8261E', align: 'center' });
  },

  // a train rushes in, brakes, and its windows spell the month
  trein(sc, lt, naam, beat) {
    vgrad(0, H, [[0, '#BFD3E6'], [1, '#E8EEF4']]);
    rect(0, 780, W, 300, '#9AA0A6'); rect(0, 780, W, 18, '#FFC917');
    rect(140, 120, 340, 90, '#0E2F7A'); txt('SPOOR 2026', 310, 168, { f: FS, size: 44, weight: 700, color: '#FFFFFF' });
    const inP = E.outCubic(P(lt, 0, beat * 0.8)), outP = E.inCubic(P(lt, beat * 1.55, beat * 2));
    const x = lerp(W + 200, 0, inP) - outP * (W + 2600);
    const n = naam.length, cw = Math.min(330, (W - 160) / n), y = 300, h = 470;
    ctx.save(); ctx.translate(x, 0);
    for (let k = -1; k <= n; k++) {
      const cx = 80 + k * cw;
      ctx.save(); ctx.beginPath(); ctx.roundRect(cx + 4, y, cw - 8, h, 26); ctx.fillStyle = '#FFC917'; ctx.fill(); ctx.restore();
      rect(cx + 4, y + h - 120, cw - 8, 40, '#0E2F7A');
      ctx.save(); ctx.beginPath(); ctx.roundRect(cx + 24, y + 50, cw - 48, 240, 16); ctx.fillStyle = '#1E2A3A'; ctx.fill(); ctx.restore();
      if (k >= 0 && k < n) txt(naam[k], cx + cw / 2, y + 260, { f: FL, size: 210, color: '#FFFFFF', base: 'alphabetic' });
      circle(cx + 60, y + h + 10, 34, '#222'); circle(cx + cw - 60, y + h + 10, 34, '#222');
    }
    ctx.restore();
    if (lt > beat * 0.5 && lt < beat * 0.9) for (let k = 0; k < 8; k++) circle(W - 200 + k * 30 + Math.sin(lt * 50 + k) * 10, 800 - k * 6, 10, '#FFE9A0', 0.8);
    if (inP < 1) snelheid(W / 2, 500, -1, 0, 9, 600, '#FFFFFF', 0.5 * (1 - inP));
  },

  // the letters drop from the sky, the last one lands on somebody
  val(sc, lt, naam, beat) {
    vgrad(0, H, [[0, '#2F4BFF'], [1, '#1A2A9A']]);
    rect(0, 800, W, H - 800, '#121A5A');
    const size = 300, cols = [C.fire, C.sun, C.mint, C.pink, C.paper];
    letters(naam, W / 2, 800, size, (i, n) => {
      const t0 = i * beat * 0.18, q = P(lt, t0, t0 + beat * 0.45);
      return { y: -900 * (1 - E.outBounce(q)), a: q > 0 ? 1 : 0, kleur: cols[i % cols.length], schaduw: C.ink, rot: (1 - q) * (i % 2 ? 0.4 : -0.4) };
    }, { align: 'center' });
    // the hippo walks into the last letter
    const n = naam.length, tl = (n - 1) * beat * 0.18 + beat * 0.45;
    const hx = lerp(W + 200, W - 260, E.outCubic(P(lt, 0, beat * 0.8)));
    dier('nijlpaard', hx, 1000, 300, { flip: true, pose: { ogen: lt > tl ? 'dicht' : 'open' }, rot: lt > tl ? Math.sin((lt - tl) * 30) * 0.05 : 0 });
    if (lt > tl) sterretjes(hx, 760, lt, 90);
    txt('2026', W / 2, 260, { f: FL, size: 80, color: C.paper, alpha: P(lt, 0, beat * 0.3) });
  },

  // a little plane pulls the month across the sky
  vliegtuig(sc, lt, naam, beat) {
    vgrad(0, H, [[0, '#5FA8F0'], [1, '#CFE8FF']]);
    for (let i = 0; i < 5; i++) { const x = ((i * 460 - lt * 120) % (W + 400) + W + 400) % (W + 400) - 200, y = 620 + (i % 2) * 120; [[0, 0, 70], [70, -20, 80], [150, 0, 60]].forEach(([dx, dy, r]) => circle(x + dx, y + dy, r, '#FFFFFF', 0.95)); }
    const px = lerp(W * 0.55, W + 1500, E.inCubic(P(lt, beat * 0.9, beat * 2.2))) - (1 - E.outCubic(P(lt, 0, beat * 0.9))) * 1500, py = 330 + Math.sin(lt * 4) * 20;
    const bw = measure(naam, font(FL, 240)) + 140;
    ctx.save();
    line(px - 120, py, px - 220, py + 10, '#555', 3);
    ctx.beginPath(); const x0 = px - 220 - bw;
    ctx.moveTo(x0, py - 130); for (let s = 0; s <= 24; s++) ctx.lineTo(x0 + s * bw / 24, py - 130 + Math.sin(s * 0.7 - lt * 12) * 14);
    for (let s = 24; s >= 0; s--) ctx.lineTo(x0 + s * bw / 24, py + 150 + Math.sin(s * 0.7 - lt * 12) * 14);
    ctx.closePath(); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke();
    txt(naam, x0 + bw / 2, py + 95, { f: FL, size: 240, color: C.fire, base: 'alphabetic' });
    ctx.restore();
    ctx.save(); ctx.translate(px, py);
    ctx.beginPath(); ctx.ellipse(0, 0, 130, 38, 0, 0, TAU); ctx.fillStyle = C.fire; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke();
    poly([[-40, -10], [40, -10], [10, -90], [-20, -90]], C.paper); poly([[-120, 0], [-90, -70], [-70, -70], [-80, 0]], C.paper);
    txt('2026', -10, 70, { f: FL, size: 34, color: C.ink });
    ctx.save(); ctx.translate(130, 0); ctx.scale(1, Math.cos(lt * 60)); rect(-6, -70, 12, 140, '#333'); ctx.restore();
    dier('pinguin', 20, -20, 90, { pose: { ogen: 'blij' }, schaduw: false });
    ctx.restore();
  },

  // the letters are blown up like balloons, one by one
  opblaas(sc, lt, naam, beat) {
    vgrad(0, H, [[0, C.mint], [1, '#1E9E6A']]);
    const cols = [C.fire, C.sun, C.pink, C.blue, C.purple, '#FFFFFF'];
    letters(naam, W / 2, H / 2 + 120, 300, (i, n) => {
      const t0 = i * beat * 0.2, q = P(lt, t0, t0 + beat * 0.35);
      const s = q < 1 ? 0.15 + 0.85 * E.outElastic(q) : 1 + 0.03 * Math.sin(lt * 8 + i);
      return { s, py: 1, a: q > 0 ? 1 : 0, kleur: cols[i % cols.length], schaduw: C.ink, y: -Math.sin(lt * 3 + i) * 12 };
    }, { align: 'center' });
    // a pump and the frog working it
    const pumping = Math.floor(lt / (beat * 0.2)) % 2;
    rect(220, 760 - (pumping ? 60 : 0), 20, 160, '#333'); rect(150, 750 - (pumping ? 60 : 0), 160, 20, '#333'); rect(190, 900, 80, 120, '#C8261E');
    dier('kikker', 380, 1020, 230, { flip: true, pose: { arm: pumping ? 'op' : 'neer', ogen: 'blij' }, sy: pumping ? 0.92 : 1 });
    txt('2026', W / 2, 260, { f: FL, size: 80, color: C.paper, alpha: P(lt, 0, beat * 0.3) });
  },

  // a typewriter types the month, ding
  typ(sc, lt, naam, beat) {
    rect(0, 0, W, H, '#2A2622');
    const n = naam.length, per = beat * 1.2 / n, shown = Math.min(n, Math.floor(lt / per) + 1);
    const size = 200, fnt = font(FM, size, 700), cw = measure('M', fnt);
    const carriage = (shown - n / 2) * cw;
    ctx.save(); ctx.translate(-carriage, 0);
    rect(W / 2 - n * cw / 2 - 120, 120, n * cw + 240, 760, '#FFFDF5');
    for (let k = 0; k < shown; k++) txt(naam[k], W / 2 - n * cw / 2 + (k + 0.5) * cw, 560, { f: FM, size, weight: 700, color: '#1A1A1A', base: 'alphabetic' });
    txt('2026', W / 2, 300, { f: FM, size: 60, weight: 700, color: '#1A1A1A', alpha: 0.7 });
    ctx.restore();
    // the machine in front
    rect(0, 820, W, 260, '#1A1A1A'); rect(W / 2 - 600, 760, 1200, 90, '#333');
    for (let k = 0; k < 12; k++) { const down = k === (shown * 5) % 12 && lt < beat * 1.2; circle(W / 2 - 550 + k * 100, 940 + (down ? 10 : 0), 34, '#E8E2D2'); ring(W / 2 - 550 + k * 100, 940 + (down ? 10 : 0), 34, '#555', 5); }
    if (lt > beat * 1.2) { sticker('DING!', W - 340, 260, { size: 110, shadow: C.fire, align: 'center', alpha: 1 - P(lt, beat * 1.7, beat * 2) }); }
  },
};
