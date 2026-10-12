/*
 * The maatjes: the quiz's pixel animals (maatjes.js, built from the app by
 * maatjes-bouw.js), drawn as big chunky pixel art with a white sticker edge, and
 * what they can do: cheer, faint, panic, sleep, dance, peek, run, applaud, jump,
 * dig, cry, sweat, shake, scrub, wave and salute. Plus speech bubbles and the
 * cartoon bits around them: stars, zzz, sweat drops, tears, hearts, dust.
 */
const B32 = '0123456789abcdefghijklmnopqrstuv';
const PIX = {};      // parsed layers per animal
const SPR = new Map(); // composed sprites, by animal and pose
function lagen(sleutel) {
  if (PIX[sleutel]) return PIX[sleutel];
  const bron = MAATJES[sleutel] || MAATJES.hond, uit = { oog: bron.oog };
  for (const [naam, laag] of Object.entries(bron)) {
    if (!Array.isArray(laag)) continue;
    uit[naam] = laag.map(([kleur, p]) => { const pts = []; for (let i = 0; i < p.length; i += 2) pts.push(B32.indexOf(p[i]), B32.indexOf(p[i + 1])); return { kleur, pts }; });
  }
  return (PIX[sleutel] = uit);
}
// one pose of an animal as a small canvas: 32×32 plus a 2-pixel border with its white edge
const RAND = 2, ZIJ = 32 + 2 * RAND;
function sprite(sleutel, p = {}) {
  const ogen = p.ogen || 'open', vl = p.vleugel || 'neer', arm = p.arm || 'neer', poten = p.poten || 'rust', romp = p.romp || 0;
  const key = [sleutel, ogen, p.blos ? 1 : 0, vl, arm, poten, romp, p.rand === false ? 0 : 1].join('|');
  if (SPR.has(key)) return SPR.get(key);
  const L = lagen(sleutel);
  const lijst = [romp && L['romp' + romp] ? L['romp' + romp] : L.lijf,
    ogen === 'dicht' ? L.ogenDicht : ogen === 'blij' ? L.ogenBlij : L.ogenOpen,
    p.blos ? L.wangen : null, vl === 'op' ? L.vleugelOp : L.vleugelNeer, arm === 'op' ? L.armOp : L.armNeer,
    poten === 'a' ? L.potenA : poten === 'b' ? L.potenB : L.potenRust];
  const c = document.createElement('canvas'); c.width = c.height = ZIJ;
  const o = c.getContext('2d');
  const vol = new Uint8Array(ZIJ * ZIJ);
  for (const laag of lijst) {
    if (!laag) continue;
    for (const { kleur, pts } of laag) {
      o.fillStyle = kleur;
      for (let i = 0; i < pts.length; i += 2) { o.fillRect(pts[i] + RAND, pts[i + 1] + RAND, 1, 1); vol[(pts[i + 1] + RAND) * ZIJ + pts[i] + RAND] = 1; }
    }
  }
  if (p.rand !== false) {
    // the white sticker edge: every empty pixel next to the animal
    o.globalCompositeOperation = 'destination-over'; o.fillStyle = '#FFFFFF';
    for (let y = 0; y < ZIJ; y++) for (let x = 0; x < ZIJ; x++) {
      if (vol[y * ZIJ + x]) continue;
      let n = false;
      for (let dy = -1; dy <= 1 && !n; dy++) for (let dx = -1; dx <= 1 && !n; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < ZIJ && yy < ZIJ && vol[yy * ZIJ + xx]) n = true; }
      if (n) o.fillRect(x, y, 1, 1);
    }
  }
  SPR.set(key, c);
  return c;
}
// the lowest row with pixels, so an animal stands on its feet and not on empty rows
const VOET = {};
function voet(sleutel) {
  if (VOET[sleutel] !== undefined) return VOET[sleutel];
  const L = lagen(sleutel); let max = 0;
  for (const naam of ['lijf', 'potenRust']) for (const { pts } of (L[naam] || [])) for (let i = 1; i < pts.length; i += 2) max = Math.max(max, pts[i]);
  return (VOET[sleutel] = max + 1);
}

/*
 * Draws an animal standing at (x, y) (its feet), h pixels tall (the 32-pixel grid).
 * o: pose (see sprite), flip (face left), rot (around the feet), sx, sy (squash), alpha
 */
function dier(sleutel, x, y, h, o = {}) {
  const c = sprite(sleutel, o.pose || {});
  const px = h / 32, v = voet(sleutel);
  ctx.save();
  ctx.globalAlpha *= o.alpha === undefined ? 1 : o.alpha;
  if (o.schaduw !== false) { ctx.save(); ctx.globalAlpha *= 0.28; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, y + 4, h * 0.36 * (o.sx || 1), h * 0.06, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  ctx.translate(x, y + (o.dy || 0));
  if (o.rot) ctx.rotate(o.rot);
  ctx.scale((o.sx || 1) * (o.flip ? -1 : 1), o.sy || 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(c, -ZIJ * px / 2, -(v + RAND) * px, ZIJ * px, ZIJ * px);
  ctx.restore();
}
// where an animal's eye is, in screen space, for tears and exclamation marks
function oogVan(sleutel, x, y, h, flip) {
  const L = lagen(sleutel), px = h / 32, v = voet(sleutel);
  const ox = (L.oog.x * 2 + 1 - 16) * px, oy = (L.oog.y * 2 + 1 - v) * px;
  return { x: x + (flip ? -ox : ox), y: y + oy };
}

// ---------------------------------------------------------------- cartoon bits
function pixelStar(x, y, s, c, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = c;
  ctx.fillRect(-s / 2, -s * 1.5, s, s * 3); ctx.fillRect(-s * 1.5, -s / 2, s * 3, s);
  ctx.restore();
}
function sterretjes(x, y, t, r = 70, c = C.sun) {
  for (let k = 0; k < 3; k++) { const a = t * 6 + k * TAU / 3; pixelStar(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.35, 9, c, a); }
}
function zzz(x, y, t, s = 1) {
  for (let k = 0; k < 3; k++) {
    const q = ((t * 0.9 + k / 3) % 1);
    const zx = x + q * 70 * s + Math.sin(q * 6) * 10, zy = y - q * 150 * s, a = Math.sin(Math.PI * q);
    txt('Z', zx, zy, { f: FL, size: (30 + q * 30) * s, color: '#DFE8FF', alpha: a });
  }
}
function druppels(x, y, t, n = 4, kleur = '#7CC8FF') {
  for (let k = 0; k < n; k++) {
    const q = ((t * 2.2 + k / n) % 1), side = k % 2 ? 1 : -1;
    const dx = side * (20 + q * 80), dy = -20 + q * q * 160 - Math.sin(q * Math.PI) * 50;
    ctx.save(); ctx.globalAlpha *= 1 - q; ctx.fillStyle = kleur;
    ctx.beginPath(); ctx.moveTo(x + dx, y + dy - 14); ctx.quadraticCurveTo(x + dx + 9, y + dy + 4, x + dx, y + dy + 8); ctx.quadraticCurveTo(x + dx - 9, y + dy + 4, x + dx, y + dy - 14); ctx.fill();
    ctx.restore();
  }
}
function tranen(e, t, h) {
  for (const side of [-1, 1]) for (let k = 0; k < 6; k++) {
    const q = ((t * 3 + k / 6) % 1);
    const x = e.x + side * (10 + q * h * 0.35), y = e.y + q * h * 0.3 - Math.sin(q * Math.PI) * h * 0.15;
    rect(x - 5, y - 5, 10, 10, '#7CC8FF', 1 - q * 0.6);
  }
}
function hartjes(x, y, t, n = 5) {
  for (let k = 0; k < n; k++) {
    const q = ((t * 0.8 + k / n) % 1), hx = x + Math.sin(q * 8 + k * 2) * 60 + (k - n / 2) * 30, hy = y - q * 260, s = 10 + 8 * Math.sin(Math.PI * q);
    ctx.save(); ctx.globalAlpha *= Math.sin(Math.PI * q); ctx.fillStyle = C.pink; ctx.translate(hx, hy);
    ctx.beginPath(); ctx.moveTo(0, s * 0.9); ctx.bezierCurveTo(-s * 1.6, -s * 0.2, -s * 0.7, -s * 1.4, 0, -s * 0.5); ctx.bezierCurveTo(s * 0.7, -s * 1.4, s * 1.6, -s * 0.2, 0, s * 0.9); ctx.fill();
    ctx.restore();
  }
}
function stof(x, y, t, dir = 1) {
  for (let k = 0; k < 5; k++) {
    const q = ((t * 3 + k / 5) % 1);
    circle(x - dir * q * 120, y - q * 30 - k * 4, 14 + q * 24, '#FFFFFF', 0.5 * (1 - q));
  }
}
function uitroep(x, y, s = 1, kleur = C.sun) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = kleur; ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-10, -70); ctx.lineTo(10, -70); ctx.lineTo(5, -18); ctx.lineTo(-5, -18); ctx.closePath(); ctx.stroke(); ctx.fill();
  ctx.beginPath(); ctx.rect(-8, -10, 16, 16); ctx.stroke(); ctx.fill();
  ctx.restore();
}
function vegen(x, y, t, s = 1) {
  // motion marks next to something that moves fast
  ctx.save(); ctx.strokeStyle = C.paper; ctx.lineWidth = 6 * s; ctx.lineCap = 'round'; ctx.globalAlpha *= 0.8;
  for (let k = 0; k < 3; k++) { const o = ((t * 4 + k / 3) % 1); ctx.beginPath(); ctx.moveTo(x - (40 + o * 30) * s, y + (k - 1) * 22 * s); ctx.lineTo(x - (90 + o * 60) * s, y + (k - 1) * 22 * s); ctx.stroke(); }
  ctx.restore();
}
function zeepbellen(x, y, t) {
  const r = rng(4242);
  for (let k = 0; k < 9; k++) {
    const q = ((t * (0.6 + r() * 0.6) + r()) % 1), bx = x + (r() - 0.5) * 160 + Math.sin(q * 7 + k) * 20, by = y - q * 220;
    ring(bx, by, 8 + r() * 14, '#FFFFFF', 3, 0.8 * (1 - q));
  }
}

/*
 * An animal acting. g: seconds since its cue (negative: not on yet). It pops up
 * from below its own feet. Returns where its head is, for the speech bubble.
 *   o.flip: face left. o.dur: how long the shot lasts (for running across).
 */
function acteur(sleutel, doet, g, x, y, h, o = {}) {
  if (g < 0 && doet !== 'ren') return null;
  const flip = !!o.flip, dir = flip ? -1 : 1;
  const tt = (o.t0 || 0) + g; // free-running time, for blinking and loops
  const blink = (tt * 0.7 + (hash(sleutel) % 100) / 100) % 1 < 0.06;
  let pose = { ogen: blink ? 'dicht' : 'open' }, dy = 0, rot = 0, sx = 1, sy = 1, xx = x, extra = null;
  // the entrance: up from below, with a bounce
  const inP = E.outPop(P(g, 0, 0.26));
  const binnen = doet === 'ren' ? 0 : (1 - inP) * h * 1.1;
  const flap = Math.floor(tt * 14) % 2 ? 'op' : 'neer';
  const stap = Math.floor(tt * 10) % 2 ? 'a' : 'b';
  switch (doet) {
    case 'juich': {
      const k = Math.max(0, g - 0.2);
      dy = -hop(k) * h * 0.32; sy = 1 - 0.16 * beatPulse(k, 14); sx = 1 + 0.14 * beatPulse(k, 14);
      pose = { ogen: 'blij', blos: true, arm: 'op', vleugel: flap };
      break;
    }
    case 'dans': {
      const n = Math.floor(g / B);
      rot = (n % 2 ? 1 : -1) * 0.14 * Math.sin(Math.PI * fase(g)); dy = -hop(g) * h * 0.12;
      sy = 1 - 0.1 * beatPulse(g, 12); sx = 1 + 0.08 * beatPulse(g, 12);
      pose = { ogen: 'blij', blos: true, arm: n % 2 ? 'op' : 'neer', poten: n % 2 ? 'a' : 'b', vleugel: n % 2 ? 'op' : 'neer' };
      break;
    }
    case 'val': {
      // the dramatic faint: a wobble, then flat on its back
      const f = P(g, B * 0.6, B * 0.6 + 0.3);
      rot = -dir * (Math.PI / 2) * E.outBack(f) + (f <= 0 ? Math.sin(g * 30) * 0.06 : 0);
      dy = -Math.abs(Math.sin(rot)) * h * 0.4;
      pose = { ogen: f > 0.3 ? 'dicht' : 'open' };
      if (f >= 1) extra = () => sterretjes(xx - dir * h * 0.55, y - h * 0.35, g, h * 0.3);
      else if (f <= 0) extra = () => uitroep(xx + dir * h * 0.2, y - h * 1.05, 0.9);
      break;
    }
    case 'paniek': {
      const w = Math.floor(g / (B / 2)) % 2;
      xx = x + Math.sin(g * 60) * 6 + (w ? 1 : -1) * Math.sin(Math.PI * fase(g * 2)) * h * 0.2;
      dy = -Math.abs(Math.sin(g * 22)) * h * 0.08;
      pose = { ogen: 'open', poten: stap, vleugel: flap, arm: flap };
      o.flip = !!w; extra = () => druppels(xx, y - h * 0.85, g, 4, '#BFE6FF');
      break;
    }
    case 'slaap': {
      sy = 1 + 0.04 * Math.sin(g * 3); rot = dir * 0.08;
      pose = { ogen: 'dicht' };
      extra = () => zzz(xx + dir * h * 0.25, y - h * 0.85, g, h / 260);
      break;
    }
    case 'kijk': {
      // peeks up slowly, looks around, hops once
      const peek = E.outCubic(P(g, 0, 0.35));
      dy = (1 - peek) * h * 0.5 - E.outPop(P(g, B, B + 0.2)) * 0 - hop(Math.max(0, g - B)) * h * 0.1 * (g > B ? 1 : 0);
      o.flip = g > B * 0.5 && g < B * 1.2 ? !flip : flip;
      pose = { ogen: blink ? 'dicht' : 'open', blos: g > B };
      if (g > B * 0.5 && g < B * 1.6) extra = () => { const e = oogVan(sleutel, xx, y + dy, h, o.flip); txt('?', e.x + dir * 40, e.y - h * 0.35, { f: FL, size: 70, color: C.sun }); };
      break;
    }
    case 'ren': {
      // runs across the whole shot
      const d = o.dur || 2;
      const p = P(g, -0.1, d);
      xx = lerp(flip ? W + h : -h, flip ? -h : W + h, p);
      dy = -Math.abs(Math.sin(tt * 14)) * h * 0.1;
      pose = { ogen: 'open', poten: stap, vleugel: flap, arm: stap === 'a' ? 'op' : 'neer', romp: Math.floor(tt * 8) % 3 };
      extra = () => stof(xx - dir * h * 0.3, y - 10, g, dir);
      break;
    }
    case 'klap': {
      const k = g * 2 / B;
      dy = -Math.abs(Math.sin(Math.PI * k)) * h * 0.08; sx = 1 + 0.06 * Math.abs(Math.sin(Math.PI * k));
      pose = { ogen: 'blij', blos: true, vleugel: Math.floor(k) % 2 ? 'op' : 'neer', arm: Math.floor(k) % 2 ? 'op' : 'neer' };
      extra = () => { if (Math.floor(k) % 2) { line(xx + dir * h * 0.45, y - h * 0.6, xx + dir * h * 0.6, y - h * 0.75, C.paper, 6); line(xx + dir * h * 0.48, y - h * 0.45, xx + dir * h * 0.68, y - h * 0.48, C.paper, 6); } };
      break;
    }
    case 'spring': {
      // a crouch, a big jump with a flip, a squashy landing, then hops
      const j = P(g, 0.12, 0.12 + B);
      if (g < 0.12) { sy = 1 - 0.25 * P(g, 0, 0.12); sx = 1 + 0.2 * P(g, 0, 0.12); }
      else if (j < 1) { dy = -Math.sin(Math.PI * j) * h * 1.0; rot = dir * TAU * E.inOutCubic(j); sy = 1.12; sx = 0.92; }
      else { const k = g - 0.12 - B; dy = -hop(k) * h * 0.15; sy = 1 - 0.18 * beatPulse(k, 12); sx = 1 + 0.15 * beatPulse(k, 12); }
      pose = { ogen: 'blij', blos: true, arm: 'op', vleugel: flap };
      break;
    }
    case 'graaf': {
      // comes up out of the ground, dirt flying
      const up = E.outPop(P(g, 0.05, 0.4));
      dy = (1 - up) * h * 0.9;
      pose = { ogen: g > 0.5 ? 'blij' : 'open', blos: g > 0.5 };
      extra = () => {
        poly([[xx - h * 0.7, y + 6], [xx - h * 0.45, y - h * 0.12], [xx + h * 0.45, y - h * 0.12], [xx + h * 0.7, y + 6]], '#5A3A22');
        const r = rng(77);
        for (let k = 0; k < 14; k++) { const q = P(g, 0.02 + r() * 0.1, 0.6 + r() * 0.3); if (q <= 0 || q >= 1) continue; const a = -Math.PI / 2 + (r() - 0.5) * 2.2; rect(xx + Math.cos(a) * q * h * 1.1, y - h * 0.1 + Math.sin(a) * q * h * 0.9 + q * q * h * 0.8, 14, 14, '#6B4428'); }
      };
      break;
    }
    case 'huil': {
      sy = 1 + 0.05 * Math.sin(g * 22); pose = { ogen: 'dicht' };
      extra = () => tranen(oogVan(sleutel, xx, y + dy, h, flip), g, h);
      break;
    }
    case 'zweet': {
      // melting
      const m = E.inOutSine(P(g, 0.2, (o.dur || 2) - 0.2));
      sy = 1 - 0.28 * m; sx = 1 + 0.22 * m;
      pose = { ogen: Math.floor(g * 3) % 3 === 0 ? 'dicht' : 'open' };
      extra = () => { druppels(xx, y - h * 0.9 * sy, g, 5); for (let k = 0; k < 3; k++) { ctx.save(); ctx.strokeStyle = '#FFF2C0'; ctx.globalAlpha *= 0.7; ctx.lineWidth = 5; ctx.beginPath(); for (let s = 0; s <= 10; s++) ctx.lineTo(xx + (k - 1) * 50 + Math.sin(s + g * 10) * 6, y - h * 1.05 - s * 10); ctx.stroke(); ctx.restore(); } };
      break;
    }
    case 'schud': {
      const s = g < B * 1.5;
      o.flip = s && Math.floor(g * 10) % 2 ? !flip : flip;
      sy = s ? 1 + 0.03 * Math.sin(g * 40) : 1;
      pose = { ogen: 'open' };
      if (s) extra = () => uitroep(xx, y - h * 1.08, 0.8, C.fire);
      break;
    }
    case 'poets': {
      xx = x + Math.sin(g * Math.PI * 2 / B) * h * 0.18;
      rot = Math.sin(g * Math.PI * 2 / B) * 0.08;
      pose = { ogen: 'blij', arm: Math.floor(g * 4 / B) % 2 ? 'op' : 'neer' };
      extra = () => { zeepbellen(xx + dir * h * 0.4, y - h * 0.6, g); ctx.save(); ctx.translate(xx + dir * h * 0.48, y - h * 0.62 + Math.sin(g * 18) * 10); ctx.rotate(0.3); rect(-26, -18, 52, 36, C.sun); rect(-26, -18, 52, 10, '#7BD389'); ctx.restore(); };
      break;
    }
    case 'zwaai': {
      const k = Math.floor(g * 4 / B) % 2;
      rot = (k ? 1 : -1) * 0.06; pose = { ogen: 'blij', blos: true, arm: k ? 'op' : 'neer', vleugel: k ? 'op' : 'neer' };
      break;
    }
    case 'hang': {
      // hangs from a vine at the top of the frame (y), upside down, swinging on the beat
      const drop = E.outBack(P(g, 0, 0.35)), len = lerp(-h * 0.2, h * 1.05, drop) + 40;
      const sw = Math.sin(Math.PI * g / B) * 0.22;
      const fx = x + Math.sin(sw) * len, fy = y + Math.cos(sw) * len;
      line(x, y - 10, fx, fy, '#3E7B2C', 10);
      dier(sleutel, fx, fy, h, { pose: { ogen: 'blij', blos: true, arm: Math.floor(g * 4 / B) % 2 ? 'op' : 'neer' }, flip: !flip, rot: Math.PI - sw, schaduw: false, alpha: o.alpha });
      return { x: fx + Math.sin(sw) * h * 0.95, y: fy + Math.cos(sw) * h * 0.95, flip, onder: true };
    }
    case 'vlieg': {
      // flies in from the top corner, flapping, and hovers above its spot
      const p = E.outCubic(P(g, 0, 0.45));
      xx = lerp(flip ? W + h : -h, x, p) ; dy = lerp(-y - h, 0, p) - h * 0.9 + Math.sin(tt * 6) * 14;
      rot = (1 - p) * (flip ? -0.5 : 0.5) + Math.sin(tt * 3) * 0.05;
      pose = { ogen: p < 1 ? 'open' : 'blij', blos: p >= 1, vleugel: Math.floor(tt * 16) % 2 ? 'op' : 'neer', arm: Math.floor(tt * 16) % 2 ? 'op' : 'neer' };
      dier(sleutel, xx, y + dy, h, { pose, flip, rot, schaduw: false, alpha: o.alpha });
      return { x: xx + (flip ? -1 : 1) * h * 0.1, y: y + dy - h * 0.95, flip };
    }
    case 'salueer': {
      pose = { ogen: 'open', arm: 'op' }; sy = 1 + 0.03 * beatPulse(g, 10);
      break;
    }
    default: {
      dy = -hop(g) * h * 0.08; pose = { ogen: blink ? 'dicht' : 'open' };
    }
  }
  if (o.pose) pose = { ...pose, ...o.pose };
  dier(sleutel, xx, y + binnen, h, { pose, flip: o.flip !== undefined ? o.flip : flip, rot, sx, sy, dy, alpha: o.alpha });
  if (extra && inP > 0.6) extra();
  const k = doet === 'val' && g > B * 0.6 + 0.3 ? 0.55 : 1;
  return { x: xx + dir * h * 0.1, y: y + binnen + dy - h * 0.95 * sy * k, flip: o.flip !== undefined ? o.flip : flip };
}

/*
 * A speech bubble pointing at (x, y). g: seconds since it popped. side: which way
 * the bubble leans (1: to the left of the speaker, -1: to the right).
 */
function ballon(s, x, y, g, o = {}) {
  if (g < 0 || !s) return;
  const size = o.size || 58, padX = 34, padY = 26;
  const tw = measure(s, font(FL, size)), bw = tw + padX * 2, bh = size * 0.92 + padY * 2;
  const side = o.side || 1;
  let cx = x - side * (bw * 0.35), cy = o.onder ? y + bh / 2 + 60 : y - bh / 2 - 70;
  cx = clamp(cx, bw / 2 + 30, W - bw / 2 - 30); cy = clamp(cy, bh / 2 + 30, H - bh / 2 - 30);
  const pop = E.outPop(P(g, 0, 0.22)), wob = Math.sin(g * 9) * 0.02 * Math.exp(-g * 1.5);
  ctx.save();
  ctx.translate(cx, cy + bh / 2); ctx.scale(pop, pop); ctx.rotate(wob + (o.tilt || -0.03)); ctx.translate(-cx, -(cy + bh / 2));
  const path = () => {
    ctx.beginPath(); ctx.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, bh * 0.45);
    const tx = clamp(x, cx - bw / 2 + 50, cx + bw / 2 - 50), ey = o.onder ? cy - bh / 2 + 4 : cy + bh / 2 - 4;
    ctx.moveTo(lerp(tx, cx, 0.3) - 26, ey); ctx.lineTo(x, o.onder ? y + 6 : y - 6); ctx.lineTo(lerp(tx, cx, 0.3) + 18, ey);
  };
  ctx.lineJoin = 'round';
  ctx.save(); ctx.translate(8, 8); path(); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill(); ctx.restore();
  path(); ctx.strokeStyle = C.ink; ctx.lineWidth = 12; ctx.stroke(); ctx.fillStyle = o.kleur || '#FFFFFF'; ctx.fill();
  txt(s, cx, cy + size * 0.38, { f: FL, size, color: o.inkt || C.ink, base: 'alphabetic' });
  ctx.restore();
}

// a whole crowd of maatjes, for the big moments
const BENDE = ['kip', 'lama', 'zeehond', 'hond', 'aap', 'pinguin', 'kikker', 'eenhoorn', 'hamster', 'flamingo', 'kangoeroe', 'uil', 'nijlpaard', 'egel', 'papegaai', 'konijn', 'luiaard', 'giraf', 'octopus', 'wasbeer', 'krokodil', 'eekhoorn', 'das', 'dolfijn', 'goudvis', 'kameel', 'bij', 'vlinder', 'kreeft', 'slak', 'worm'];
