/**
 * Het geluid van de quiz.
 *
 * Alles wordt in de browser opgewekt — geen bestanden, dus niets dat kan
 * ontbreken of te laat inlaadt. Dat is hier geen besparing maar een
 * betrouwbaarheidskeuze: op de avond zelf mag geen enkel geluid afhangen van
 * een netwerkverbinding.
 *
 * Browsers staan geen geluid toe voordat iemand de pagina heeft aangeraakt.
 * Daarom wordt de context pas bij de eerste klik of toetsaanslag gewekt; tot
 * die tijd doen alle aanroepen vanzelf niets.
 */

type Vorm = OscillatorType;

let ctx: AudioContext | null = null;
let meester: GainNode | null = null;
let aan = true;

/** Roep dit aan vanuit een echte klik of toetsaanslag. */
export function wek(): void {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    meester = ctx.createGain();
    meester.gain.value = 0.32;
    meester.connect(ctx.destination);
  } catch {
    ctx = null;
  }
}

export function zetAan(waarde: boolean): void {
  aan = waarde;
  if (meester && ctx) {
    meester.gain.setTargetAtTime(waarde ? 0.32 : 0, ctx.currentTime, 0.02);
  }
}

export function staatAan(): boolean {
  return aan;
}

export function isGewekt(): boolean {
  return ctx !== null;
}

/**
 * Eén toon met een nette omhullende. Zonder aanzet- en uitlooptijd klinkt een
 * oscillator als een klik; met een korte aanzet klinkt hij als een instrument.
 */
function toon(
  hz: number,
  begin: number,
  duur: number,
  opties: { vorm?: Vorm; volume?: number; glijNaar?: number } = {},
): void {
  if (!ctx || !meester || !aan) return;
  const { vorm = 'triangle', volume = 0.5, glijNaar } = opties;
  const t = ctx.currentTime + begin;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = vorm;
  osc.frequency.setValueAtTime(hz, t);
  if (glijNaar) osc.frequency.exponentialRampToValueAtTime(Math.max(20, glijNaar), t + duur);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + Math.min(0.02, duur * 0.2));
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duur);

  osc.connect(gain);
  gain.connect(meester);
  osc.start(t);
  osc.stop(t + duur + 0.03);
}

/** Korte ruispuls, voor een tik of een roffel. */
function ruis(begin: number, duur: number, volume = 0.25): void {
  if (!ctx || !meester || !aan) return;
  const t = ctx.currentTime + begin;
  const lengte = Math.max(1, Math.floor(ctx.sampleRate * duur));
  const buffer = ctx.createBuffer(1, lengte, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < lengte; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / lengte);

  const bron = ctx.createBufferSource();
  bron.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2400;
  const gain = ctx.createGain();
  gain.gain.value = volume;

  bron.connect(filter);
  filter.connect(gain);
  gain.connect(meester);
  bron.start(t);
}

/* ---- De momenten van de avond ------------------------------------- */

/** Een nieuwe ronde begint: twee noten omhoog, als een aankondiging. */
export function rondeStart(): void {
  toon(392, 0, 0.26, { volume: 0.4 });
  toon(587.33, 0.13, 0.5, { volume: 0.42 });
}

/** De vraag komt op tafel: één zachte aanslag. */
export function vraagOp(): void {
  toon(330, 0, 0.2, { vorm: 'sine', volume: 0.3 });
  ruis(0, 0.09, 0.12);
}

/** Iemand levert in. Kort en zacht; dit gebeurt vaak. */
export function ingeleverd(): void {
  toon(880, 0, 0.09, { vorm: 'sine', volume: 0.22 });
}

/** De laatste seconden. */
export function tik(laatste: boolean): void {
  toon(laatste ? 1046 : 784, 0, laatste ? 0.12 : 0.07, { vorm: 'square', volume: laatste ? 0.3 : 0.2 });
}

/** De tijd is om: een zakkende zoemer. */
export function tijdOm(): void {
  toon(220, 0, 0.55, { vorm: 'sawtooth', volume: 0.35, glijNaar: 110 });
}

/** De onthulling: een akkoord dat opzwelt. */
export function onthul(): void {
  toon(392, 0, 0.75, { volume: 0.3 });
  toon(493.88, 0.04, 0.75, { volume: 0.26 });
  toon(587.33, 0.08, 0.8, { volume: 0.26 });
}

/** Punten toegekend: kort en helder omhoog. */
export function juist(): void {
  [523.25, 659.25, 783.99].forEach((hz, i) => toon(hz, i * 0.07, 0.24, { volume: 0.3 }));
}

/** De uitslag. */
export function fanfare(): void {
  const noten: [number, number][] = [
    [523.25, 0],
    [659.25, 0.13],
    [783.99, 0.26],
    [1046.5, 0.39],
  ];
  for (const [hz, t] of noten) toon(hz, t, 0.42, { volume: 0.4 });
  toon(1318.5, 0.56, 0.9, { volume: 0.34 });
  toon(1046.5, 0.56, 0.9, { volume: 0.28 });
  ruis(0.39, 0.5, 0.14);
}

/** De ranglijst gaat schuiven. */
export function roffel(): void {
  for (let i = 0; i < 14; i++) ruis(i * 0.055, 0.05, 0.08 + i * 0.006);
}

/* ---- De gekke momenten --------------------------------------------- */

/** De treurige trombone: iedereen fout. */
export function wahwah(): void {
  const noten = [392, 370, 349, 330];
  noten.forEach((hz, i) => toon(hz, i * 0.28, 0.3, { vorm: 'sawtooth', volume: 0.22, glijNaar: hz * 0.94 }));
  toon(311, 1.12, 0.9, { vorm: 'sawtooth', volume: 0.24, glijNaar: 262 });
}

/** Een veer die uitschiet: iemand komt binnen. */
export function boing(): void {
  toon(180, 0, 0.32, { vorm: 'sine', volume: 0.32, glijNaar: 720 });
  toon(720, 0.3, 0.18, { vorm: 'sine', volume: 0.18, glijNaar: 540 });
}

/** Een klein plopje: een reactie zweeft voorbij. */
export function plop(): void {
  toon(520, 0, 0.07, { vorm: 'sine', volume: 0.16, glijNaar: 260 });
}

/** De stempel komt neer. */
export function stempel(): void {
  ruis(0, 0.06, 0.3);
  toon(110, 0, 0.16, { vorm: 'square', volume: 0.22, glijNaar: 60 });
}
