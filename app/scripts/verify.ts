/**
 * Komen de vragen goed door?
 *
 * Loopt de hele quiz na, eerst op papier en dan tegen een draaiende server,
 * en zegt precies waar het misgaat. Dit is de controle die je vóór de avond
 * draait — en op de avond zelf nog een keer, met de telefoon erbij.
 *
 * Op papier (werkt zonder server):
 *   · loopt ../index.html gelijk met packs.ts, of is content:sync vergeten?
 *   · heeft elke vraag wat zijn type nodig heeft (antwoord, opties, getal)?
 *   · staan de foto's, filmpjes en muziek waar vragen naar verwijzen in media/?
 *   · hoeveel vragen staan nog op 'teVullen'?
 *   · draait het jaaroverzicht rond: welke maanden doen mee, welke wachten
 *     nog op invulling, en ligt er een balk over elk antwoord?
 *
 * Tegen de server (standaard http://localhost:3000, of --url voor het
 * netwerkadres, zodat je écht de weg test die de telefoons nemen):
 *   · antwoordt /api/health en heeft hij de spelers?
 *   · komt de live-stroom (SSE) door, of vallen telefoons terug op navragen?
 *   · dan speelt hij als quizmaster elke ronde en elke vraag door en
 *     vergelijkt op een telefoon én op de televisie: vraagtekst, opties,
 *     beeld, punten, klok — en of het antwoord tot de onthulling verborgen
 *     blijft en daarna klopt met het spiekbriefje van de quizmaster. Media
 *     haalt hij één keer op via /media/.
 *
 * Het spel dat klaarstaat blijft onaangeroerd: de controle speelt in een
 * eigen wegwerpspel met dezelfde samenstelling, zet daarna het oude spel
 * weer actief en gooit het wegwerpspel weg. Schermen die open staan zien
 * de controle wel voorbijkomen; loopt er al een spel (fase niet 'lobby'),
 * dan stopt de controle daarom, tenzij je --forceer meegeeft.
 *
 *   npm run verify
 *   npm run verify -- --url http://192.168.1.10:3000
 *   npm run verify -- --zonder-server
 *
 * Opties:
 *   --url             serveradres (standaard http://localhost:3000)
 *   --pin             pincode van de quizmaster (standaard HOST_PIN uit .env of de omgeving)
 *   --media           map met mediabestanden (standaard MEDIA_DIR, anders ./media)
 *   --zonder-server   alleen de controle op papier
 *   --forceer         ook doorlopen als er al een spel bezig is
 *   --alles           toon elke gecontroleerde vraag, niet alleen de problemen
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leesArgs } from './lib/args';
import { vergelijkInhoud, HTML_PAD } from './lib/inhoud';
import { PAKKETTEN } from '../src/lib/content/packs';
import { JAAROVERZICHT } from '../src/lib/content/jaaroverzicht';
import { analyseer, type RecapExport } from '../src/lib/server/recap/analyse';
import { aantalBalken, inDeTrailer, maandenInDeFilm, maandNaam, maandenTeVullen } from '../src/lib/server/jaaroverzicht';
import type { Vraag, Ronde, Pakket } from '../src/lib/content/types';
import type { PubliekeStaat } from '../src/lib/shared/state';
import { VOORBEELD_PIN } from '../src/lib/server/omgeving';

const APP_MAP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = leesArgs();

// Dezelfde .env als npm run lokaal, zodat de pincode vanzelf klopt.
const envPad = resolve(APP_MAP, '.env');
if (existsSync(envPad)) process.loadEnvFile(envPad);

const URL_BASIS = (args.get('url') ?? 'http://localhost:3000').replace(/\/+$/, '');
const PIN = args.get('pin') ?? process.env.HOST_PIN ?? VOORBEELD_PIN;
const MEDIA_MAP = resolve(APP_MAP, args.get('media') ?? process.env.MEDIA_DIR ?? 'media');
const ZONDER_SERVER = args.has('zonder-server');
const FORCEER = args.has('forceer');
const ALLES = args.has('alles');

const VRAAGTYPES = ['waarnietwaar', 'meerkeuze', 'open', 'dichtstbij', 'stem'];
const MEDIA_TYPES = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif',
  '.mp4', '.m4v', '.webm', '.mov',
  '.mp3', '.m4a', '.aac', '.ogg', '.wav', '.flac',
]);

const vet = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const groen = (s: string) => `\x1b[32m${s}\x1b[0m`;
const geel = (s: string) => `\x1b[33m${s}\x1b[0m`;
const rood = (s: string) => `\x1b[31m${s}\x1b[0m`;
const kop = (s: string) => console.log(`\n${vet(s)}`);
const kort = (s: string, n = 60) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

/** Alles wat misgaat komt hier; aan het eind bepaalt dit de afloop. */
const problemen: string[] = [];
const waarschuwingen: string[] = [];
const fout = (s: string) => {
  problemen.push(s);
  console.log(`  ${rood('✗')} ${s}`);
};
const let_op = (s: string) => {
  waarschuwingen.push(s);
  console.log(`  ${geel('!')} ${s}`);
};
const ok = (s: string) => console.log(`  ${groen('✓')} ${s}`);

/* ====================================================================== */
/*  Deel 1 — op papier                                                     */
/* ====================================================================== */

function controleerInhoud() {
  kop('Vragen op papier');

  if (!existsSync(HTML_PAD)) {
    let_op(`index.html niet gevonden op ${HTML_PAD}; kan niet controleren of de losse quiz gelijk loopt`);
  } else {
    try {
      const { gelijk, aantalRondes } = vergelijkInhoud();
      if (gelijk) ok(`index.html loopt gelijk met packs.ts (${aantalRondes} rondes)`);
      else fout('index.html loopt achter op packs.ts — draai npm run content:sync');
    } catch (e) {
      fout(`kan packs.ts en index.html niet vergelijken: ${(e as Error).message}`);
    }
  }

  let vragen = 0;
  let teVullen = 0;
  let levend = 0;
  const mediaBronnen = new Map<string, string[]>();

  for (const [pakketId, pakket] of Object.entries(PAKKETTEN)) {
    const gezien = new Map<string, string>();
    pakket.rondes.forEach((ronde, ri) => {
      const label = `${pakketId} R${ri + 1} (${ronde.naam})`;
      if (!ronde.vragen?.length) {
        if (!ronde.teVullen) fout(`${label}: geen vragen`);
        return;
      }
      if (!VRAAGTYPES.includes(ronde.type)) fout(`${label}: onbekend type '${ronde.type}'`);
      ronde.vragen.forEach((v, vi) => {
        vragen++;
        const plek = `${label} V${vi + 1}`;
        if (!v.v || !v.v.trim()) fout(`${plek}: lege vraagtekst`);
        if (v.live) levend++;
        if (v.teVullen) teVullen++;
        else if (!v.live) for (const p of vraagGebreken(ronde, v)) fout(`${plek}: ${p} — "${kort(v.v ?? '')}"`);
        // Een emoji- of beeldvraag heet vaak gewoon "Welke film?"; pas mét
        // het beeld erbij is het dezelfde vraag.
        const handtekening = JSON.stringify([v.v, v.emoji, v.lyric, v.media?.bron, v.live]);
        const eerder = gezien.get(handtekening);
        if (eerder) let_op(`${plek} is dezelfde vraag als ${eerder}: "${kort(v.v)}"`);
        else gezien.set(handtekening, `R${ri + 1} V${vi + 1}`);
        if (v.media && !v.media.bron.startsWith('data:')) {
          const lijst = mediaBronnen.get(v.media.bron) ?? [];
          lijst.push(plek);
          mediaBronnen.set(v.media.bron, lijst);
        }
      });
    });
  }
  ok(`${Object.keys(PAKKETTEN).length} pakketten, ${vragen} vragen nagekeken${levend ? ` (${levend} leven op de cijfers van resolution-recap)` : ''}`);
  if (teVullen) let_op(`${teVullen} vragen wachten nog op een antwoord (teVullen); levende vragen vullen zichzelf op de server`);

  // De bestanden zelf staan niet in git en komen vlak voor de avond. Hier
  // is een ontbrekend bestand dus een waarschuwing; pas als een gekozen
  // vraag hem op de server niet kan laden (verderop) is het een probleem.
  if (!mediaBronnen.size) {
    ok('geen vragen met losse mediabestanden');
  } else {
    const ontbreekt: string[] = [];
    for (const [bron, plekken] of mediaBronnen) {
      const pad = resolve(MEDIA_MAP, bron);
      if (!MEDIA_TYPES.has(extname(bron).toLowerCase())) {
        fout(`media '${bron}' heeft een bestandstype dat de app niet bedient (${plekken.join(', ')})`);
      } else if (!existsSync(pad) || !statSync(pad).isFile()) {
        ontbreekt.push(`${bron} (${plekken.join(', ')})`);
      }
    }
    if (!ontbreekt.length) ok(`alle ${mediaBronnen.size} mediabestanden staan in ${MEDIA_MAP}`);
    else {
      let_op(`${ontbreekt.length} van ${mediaBronnen.size} mediabestanden staan nog niet in ${MEDIA_MAP}:`);
      for (const o of ontbreekt) console.log(`      ${dim('·')} ${o}`);
    }
  }
}

/**
 * Het jaaroverzicht: hoe lang is de trailer, welke maanden draaien in de
 * film, en hoort alles tussen haken bij een vraag van vanavond?
 */
function controleerJaaroverzicht() {
  kop('Het jaaroverzicht');

  let analyse;
  try {
    const snapshot = JSON.parse(readFileSync(resolve(APP_MAP, 'src/lib/content/recap-snapshot.json'), 'utf8')) as RecapExport;
    analyse = analyseer(snapshot);
  } catch (e) {
    fout(`kan de ingebouwde cijfers niet lezen: ${(e as Error).message}`);
    return;
  }

  // De trailer vóór de quiz: alleen regels zonder haken.
  const trailer = maandenInDeFilm(analyse);
  const trailerRegels = JAAROVERZICHT.maanden.flatMap((m) => m.momenten.filter(inDeTrailer));
  const trailerTekst = `${trailerRegels.length} ${trailerRegels.length === 1 ? 'regel' : 'regels'} in ${trailer.length} ${trailer.length === 1 ? 'maand' : 'maanden'}`;
  if (trailerRegels.length < 6) {
    let_op(`de trailer is nog kort: ${trailerTekst} (${trailer.map(maandNaam).join(', ') || 'geen'}). Schrijf regels zonder haken bij in jaaroverzicht.ts: wat de quiz níet vraagt, vaak iets van onszelf`);
  } else {
    ok(`de trailer: ${trailerTekst}, zonder één antwoord van vanavond`);
  }

  // De film na de uitslag.
  const inDeFilm = maandenInDeFilm(analyse, true);
  ok(`de film na de uitslag: ${inDeFilm.length} van de 12 maanden, plus een titel- en een slotkaart`);

  const weg = JAAROVERZICHT.maanden.filter((m) => !inDeFilm.includes(m.nr));
  if (weg.length) {
    let_op(`${weg.length} ${weg.length === 1 ? 'maand blijft' : 'maanden blijven'} leeg en worden overgeslagen: ${weg.map((m) => maandNaam(m.nr)).join(', ')}`);
  }

  const teVullen = maandenTeVullen();
  if (teVullen.length) {
    const totaal = teVullen.reduce((n, m) => n + m.aantal, 0);
    let_op(`${totaal} ${totaal === 1 ? 'regel wacht' : 'regels wachten'} nog op invulling: ${teVullen.map((m) => `${m.naam} (${m.aantal})`).join(', ')}`);
  }

  let balken = 0;
  for (const m of JAAROVERZICHT.maanden) {
    const n = aantalBalken(m);
    balken += n;
    const geschreven = m.momenten.filter((x) => !x.teVullen);
    if (!geschreven.length) continue;
    if (n === 0 && ALLES) console.log(`      ${dim('·')} ${maandNaam(m.nr)}: geen antwoord van vanavond`);
  }
  ok(`${balken} antwoorden van vanavond onderstreept in de film`);

  // Elk antwoord onder een balk hoort ergens in de vragen terug te komen.
  const quiz = JSON.stringify(PAKKETTEN).toLowerCase();
  const los: string[] = [];
  for (const m of JAAROVERZICHT.maanden) {
    for (const x of m.momenten) {
      for (const stuk of `${x.tekst} ${x.bij ?? ''}`.matchAll(/\[\[(.+?)\]\]/g)) {
        if (!quiz.includes(stuk[1].toLowerCase())) los.push(`${maandNaam(m.nr)}: "${stuk[1]}"`);
      }
    }
  }
  if (los.length) {
    let_op(`${los.length} ${los.length === 1 ? 'stuk tussen haken hoort' : 'stukken tussen haken horen'} bij geen enkele vraag:`);
    for (const l of los) console.log(`      ${dim('·')} ${l}`);
  } else {
    ok('alles tussen haken hoort bij een vraag die vanavond gesteld wordt');
  }
}

function vraagGebreken(ronde: Ronde, v: Vraag): string[] {
  const uit: string[] = [];
  switch (ronde.type) {
    case 'waarnietwaar':
      if (typeof v.goed !== 'boolean') uit.push("'goed' moet true of false zijn");
      break;
    case 'meerkeuze':
      if (!Array.isArray(v.opties) || v.opties.length < 2) uit.push('minstens twee opties nodig');
      else if (typeof v.goed !== 'number' || !Number.isInteger(v.goed) || v.goed < 0 || v.goed >= v.opties.length) {
        uit.push(`'goed' moet een index zijn tussen 0 en ${v.opties.length - 1}`);
      }
      break;
    case 'dichtstbij':
      if (typeof v.getal !== 'number' || !Number.isFinite(v.getal)) uit.push("'getal' ontbreekt");
      break;
    case 'open':
      if (!v.a || !v.a.trim()) uit.push('antwoord ontbreekt');
      break;
    case 'stem':
      // De tafel zelf is het antwoord; er valt niets in te vullen.
      break;
  }
  return uit;
}

/* ====================================================================== */
/*  Deel 2 — tegen de server                                               */
/* ====================================================================== */

/** Een client met een eigen koekjespot: een telefoon, de televisie of het hostscherm. */
class Apparaat {
  koek = '';
  constructor(public label: string) {}

  async ruw(pad: string, opties: RequestInit = {}): Promise<Response> {
    const r = await fetch(`${URL_BASIS}${pad}`, {
      ...opties,
      headers: {
        'content-type': 'application/json',
        ...(this.koek ? { cookie: this.koek } : {}),
        ...(opties.headers ?? {}),
      },
    });
    const set = r.headers.get('set-cookie');
    if (set) this.koek = set.split(';')[0];
    return r;
  }

  async vraag(pad: string, opties: RequestInit = {}) {
    const r = await this.ruw(pad, opties);
    if (!r.ok) throw new Error(`${this.label}: ${pad} gaf ${r.status} ${await r.text()}`);
    return r.headers.get('content-type')?.includes('json') ? r.json() : r.text();
  }

  post(pad: string, body: unknown) {
    return this.vraag(pad, { method: 'POST', body: JSON.stringify(body) });
  }

  async staat(): Promise<PubliekeStaat | null> {
    const r = await this.vraag('/api/state');
    return r.staat ?? null;
  }
}

/**
 * Luistert naar /api/stream zoals een telefoon dat doet, en onthoudt het
 * laatste pakketje. Zo controleren we niet alleen dat de server de juiste
 * stand hééft, maar ook dat hij hem uit zichzelf naar de telefoon duwt.
 */
class Stroom {
  laatste: PubliekeStaat | null = null;
  pakketten = 0;
  open = false;
  fout: string | null = null;
  #abort = new AbortController();
  #wachters: { versie: number; los: (s: PubliekeStaat) => void }[] = [];

  constructor(private apparaat: Apparaat) {}

  async start(): Promise<boolean> {
    let r: Response;
    try {
      r = await fetch(`${URL_BASIS}/api/stream`, {
        headers: this.apparaat.koek ? { cookie: this.apparaat.koek } : {},
        signal: this.#abort.signal,
      });
    } catch (e) {
      this.fout = (e as Error).message;
      return false;
    }
    if (!r.ok || !r.body) {
      this.fout = `status ${r.status}`;
      return false;
    }
    this.open = true;
    void this.#lees(r.body);
    // Het eerste pakketje komt meteen bij het openen.
    const eerste = await this.wachtOp(0, 5_000);
    return !!eerste;
  }

  async #lees(body: ReadableStream<Uint8Array>) {
    const lezer = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      for (;;) {
        const { value, done } = await lezer.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let grens: number;
        while ((grens = buffer.indexOf('\n\n')) >= 0) {
          const blok = buffer.slice(0, grens);
          buffer = buffer.slice(grens + 2);
          let naam = 'message';
          const data: string[] = [];
          for (const regel of blok.split('\n')) {
            if (regel.startsWith('event:')) naam = regel.slice(6).trim();
            else if (regel.startsWith('data:')) data.push(regel.slice(5).trimStart());
          }
          if (naam !== 'staat') continue;
          try {
            const staat = JSON.parse(data.join('\n')) as PubliekeStaat | null;
            if (!staat) continue;
            this.pakketten++;
            this.laatste = staat;
            this.#wachters = this.#wachters.filter((w) => {
              if (staat.versie >= w.versie) {
                w.los(staat);
                return false;
              }
              return true;
            });
          } catch {
            // Onleesbaar pakketje: overslaan, net als de telefoon doet.
          }
        }
      }
    } catch (e) {
      if (!this.#abort.signal.aborted) this.fout = (e as Error).message;
    }
    this.open = false;
  }

  /** Wacht tot de stroom een pakketje met minstens deze versie brengt. */
  wachtOp(versie: number, ms = 5_000): Promise<PubliekeStaat | null> {
    if (this.laatste && this.laatste.versie >= versie) return Promise.resolve(this.laatste);
    if (!this.open) return Promise.resolve(null);
    return new Promise((los) => {
      const timer = setTimeout(() => {
        this.#wachters = this.#wachters.filter((w) => w.los !== klaar);
        los(null);
      }, ms);
      const klaar = (s: PubliekeStaat) => {
        clearTimeout(timer);
        los(s);
      };
      this.#wachters.push({ versie, los: klaar });
    });
  }

  stop() {
    this.#abort.abort();
  }
}

/** De tekst die de server bij de onthulling toont — dezelfde regels als spel.ts. */
function verwachtAntwoord(ronde: Ronde, v: Vraag): string {
  if (ronde.type === 'waarnietwaar') return v.goed === true ? 'Waar' : 'Niet waar';
  if (ronde.type === 'meerkeuze' && v.opties && typeof v.goed === 'number') {
    return `${String.fromCharCode(65 + v.goed)} — ${v.opties[v.goed]}`;
  }
  if (ronde.type === 'dichtstbij' && typeof v.getal === 'number') {
    return `${v.getal.toLocaleString('nl-NL')}${v.eenheid ? ' ' + v.eenheid : ''}`;
  }
  return v.a ?? '';
}

function gelijk(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/** Wat /api/host/rondes per ronde en per vraag teruggeeft. */
interface RondeRij {
  pakketIndex: number;
  speelIndex: number | null;
  naam: string;
  gekozen: number[];
  vragen: { index: number; tekst: string; antwoord: string; teVullen: boolean; live: boolean }[];
}
interface Overzicht {
  pakket: string;
  rondes: RondeRij[];
}

async function controleerServer() {
  kop(`Server op ${URL_BASIS}`);

  const doelHost = (() => {
    try {
      return new URL(URL_BASIS).hostname;
    } catch {
      return '';
    }
  })();
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(doelHost)) {
    let_op('je test via localhost: dat zegt niets over de telefoons. Geef --url http://<netwerkadres>:<poort> mee (npm run lokaal drukt het af)');
  }

  // Gezondheid
  let gezond: { status: string; tabellen?: number; spelers?: number; schermenVerbonden?: number };
  try {
    const r = await fetch(`${URL_BASIS}/api/health`);
    gezond = await r.json();
    if (!r.ok || gezond.status !== 'ok') throw new Error(JSON.stringify(gezond));
  } catch (e) {
    fout(`de server antwoordt niet op /api/health: ${(e as Error).message}`);
    return;
  }
  ok(`/api/health: ${gezond.tabellen} tabellen, ${gezond.spelers} spelers, ${gezond.schermenVerbonden} schermen verbonden`);

  // De drie rollen
  const tv = new Apparaat('televisie');
  const telefoon = new Apparaat('telefoon');
  const host = new Apparaat('quizmaster');

  const begin = await tv.staat();
  if (!begin) {
    fout('geen actief spel; draai npm run db:seed of start de server opnieuw');
    return;
  }
  await tv.post('/api/join', { rol: 'tv' });

  if (!begin.spelers.length) {
    fout('geen spelers in het spel');
    return;
  }
  await telefoon.staat();
  await telefoon.post('/api/join', { rol: 'speler', spelerId: begin.spelers[0].id });
  ok(`telefoon aangemeld als ${begin.spelers[0].naam}`);

  await host.staat();
  try {
    await host.post('/api/join', { rol: 'quizmaster', pin: PIN });
  } catch (e) {
    fout(`hostscherm kon niet aanmelden (pincode ${PIN}?): ${(e as Error).message}`);
    return;
  }
  ok('quizmaster aangemeld');

  // QR-code
  try {
    const r = await fetch(`${URL_BASIS}/api/qr?doel=${encodeURIComponent(URL_BASIS + '/')}`);
    const svg = await r.text();
    if (!r.ok || !svg.includes('<svg')) throw new Error(`status ${r.status}`);
    ok('QR-code voor de televisie wordt gemaakt');
  } catch (e) {
    fout(`QR-code lukt niet: ${(e as Error).message}`);
  }

  // Live-stroom
  const stroom = new Stroom(telefoon);
  if (await stroom.start()) {
    ok('live-stroom (SSE) komt door op de telefoon');
  } else {
    let_op(`live-stroom komt niet door (${stroom.fout ?? 'geen pakketje binnen 5 s'}); telefoons vallen terug op navragen om de 2 s`);
  }

  // Waar staat het spel?
  if (begin.fase !== 'lobby' && !FORCEER) {
    fout(`er is al een spel bezig (fase '${begin.fase}', ronde ${begin.rondeIndex + 1}); schermen die open staan zouden de controle zien. Geef --forceer mee om toch door te lopen`);
    stroom.stop();
    return;
  }

  // De samenstelling zoals de quizmaster hem gekozen heeft.
  const origineel = (await host.vraag('/api/host/rondes')) as Overzicht;
  const pakket = PAKKETTEN[origineel.pakket];
  if (!pakket) {
    fout(`de server speelt pakket '${origineel.pakket}', maar dat staat niet in packs.ts`);
    stroom.stop();
    return;
  }
  const samenstelling: Record<string, number[]> = {};
  for (const r of origineel.rondes) samenstelling[String(r.pakketIndex)] = r.gekozen;
  const origineelId = begin.spelId;

  kop('Wegwerpspel');
  // Het spel dat klaarstaat blijft heel: we spelen in een eigen spel met
  // dezelfde samenstelling en zetten straks het oude weer actief.
  await host.post('/api/host', { opdracht: 'nieuw-spel', pakket: origineel.pakket });
  const wegwerp = await host.staat();
  if (!wegwerp || wegwerp.spelId === origineelId) {
    fout('kon geen wegwerpspel beginnen');
    stroom.stop();
    return;
  }
  await host.post('/api/host', { opdracht: 'zet-samenstelling', samenstelling });
  ok(`spel #${wegwerp.spelId} met de samenstelling van spel #${origineelId}; het oude spel blijft heel`);

  try {
    await loopDoor(host, telefoon, tv, stroom, pakket);
  } finally {
    stroom.stop();
    kop('Opruimen');
    try {
      await host.post('/api/beheer', { opdracht: 'spel-activeren', id: origineelId });
      await host.post('/api/beheer', { opdracht: 'spel-verwijderen', id: wegwerp.spelId });
      const eind = await tv.staat();
      if (eind?.spelId !== origineelId || eind.fase !== begin.fase) {
        fout(`het oude spel staat niet terug zoals het was (spel #${eind?.spelId}, fase '${eind?.fase}')`);
      } else {
        ok(`spel #${origineelId} is weer actief in fase '${eind.fase}'; wegwerpspel #${wegwerp.spelId} weggegooid`);
      }
    } catch (e) {
      fout(`opruimen mislukt: ${(e as Error).message} — zet spel #${origineelId} met de hand actief op /beheer en gooi #${wegwerp.spelId} weg`);
    }
  }
}

async function loopDoor(host: Apparaat, telefoon: Apparaat, tv: Apparaat, stroom: Stroom, pakket: Pakket) {
  // Nog een keer opvragen: in het wegwerpspel, mét de levende teksten die de
  // server uit de cijfers van resolution-recap haalt.
  const overzicht = (await host.vraag('/api/host/rondes')) as Overzicht;
  const volgorde = overzicht.rondes
    .filter((r) => r.speelIndex !== null)
    .sort((a, b) => a.speelIndex! - b.speelIndex!)
    .map((r) => {
      const bron = pakket.rondes[r.pakketIndex];
      const idx = r.gekozen.slice().sort((a, b) => a - b);
      return {
        ronde: { ...bron, vragen: idx.map((i) => bron.vragen[i]).filter(Boolean) },
        /** Wat de quizmaster op zijn spiekbriefje ziet, in dezelfde volgorde. */
        briefje: idx.map((i) => r.vragen.find((v) => v.index === i)).filter((v) => !!v),
      };
    });
  const totaal = volgorde.reduce((n, r) => n + r.ronde.vragen.length, 0);
  ok(`pakket '${pakket.naam}': ${volgorde.length} rondes, ${totaal} gekozen vragen`);

  const staatNu = await telefoon.staat();
  if (staatNu?.rondeAantal !== volgorde.length) {
    fout(`de server telt ${staatNu?.rondeAantal} rondes, de samenstelling ${volgorde.length}`);
  }

  kop('Elke vraag, op telefoon en televisie');
  const mediaGezien = new Map<string, boolean>();
  let nagekeken = 0;
  let mis = 0;
  let teVullenGekozen = 0;

  for (const [ri, { ronde, briefje }] of volgorde.entries()) {
    const rondeLabel = `R${ri + 1} ${ronde.naam}`;
    await host.post('/api/host', { opdracht: 'naar-ronde', ronde: ri });
    const bijRonde = await telefoon.staat();
    if (!bijRonde || bijRonde.fase !== 'ronde' || bijRonde.rondeIndex !== ri) {
      fout(`${rondeLabel}: na 'naar-ronde' staat de telefoon op fase '${bijRonde?.fase}', ronde ${(bijRonde?.rondeIndex ?? -1) + 1}`);
      continue;
    }
    const r = bijRonde.ronde!;
    const verschillen: string[] = [];
    if (r.naam !== ronde.naam) verschillen.push(`naam '${r.naam}'`);
    if (r.thema !== ronde.thema) verschillen.push(`thema '${r.thema}'`);
    if (r.suit !== ronde.suit) verschillen.push(`suit '${r.suit}'`);
    if (r.teamModus !== ronde.teamModus) verschillen.push(`teamModus '${r.teamModus}'`);
    if (r.vragenAantal !== ronde.vragen.length) verschillen.push(`${r.vragenAantal} vragen i.p.v. ${ronde.vragen.length}`);
    if (!gelijk(r.cijfers, ronde.cijfers)) verschillen.push(`cijfers '${r.cijfers}'`);
    if (verschillen.length) fout(`${rondeLabel}: ronde-kop wijkt af: ${verschillen.join(', ')}`);

    // Iedereen hoort in precies één team te zitten.
    const perSpeler = new Map<number, number>();
    for (const t of bijRonde.teams) for (const id of t.leden) perSpeler.set(id, (perSpeler.get(id) ?? 0) + 1);
    const zonderTeam = bijRonde.spelers.filter((s) => !perSpeler.has(s.id)).map((s) => s.naam);
    const dubbel = bijRonde.spelers.filter((s) => (perSpeler.get(s.id) ?? 0) > 1).map((s) => s.naam);
    if (zonderTeam.length) fout(`${rondeLabel}: zonder team: ${zonderTeam.join(', ')}`);
    if (dubbel.length) fout(`${rondeLabel}: in meer dan één team: ${dubbel.join(', ')}`);

    const teamTekst =
      ronde.teamModus === 'individueel' ? 'ieder voor zich' : ronde.teamModus === 'samen' ? 'iedereen samen' : `${bijRonde.teams.length} teams`;
    console.log(`\n  ${vet(`${ronde.suit} ${rondeLabel}`)} ${dim(`— ${ronde.type}, ${ronde.vragen.length} vragen, ${teamTekst}${ronde.cijfers ? ', daarna de cijfers' : ''}`)}`);

    await host.post('/api/host', { opdracht: 'start-ronde' });

    for (const [vi, vraag] of ronde.vragen.entries()) {
      const label = `R${ri + 1}V${vi + 1}`;
      const spiek = briefje[vi];
      nagekeken++;
      const gebreken: string[] = [];

      if (vi > 0) await host.post('/api/host', { opdracht: 'volgende' });

      const opTelefoon = await telefoon.staat();
      const opTv = await tv.staat();

      // Een levende vraag krijgt zijn tekst van de server; de tekst in
      // packs.ts is dan alleen de achtervang voor de losse quiz.
      const tekst = vraag.live ? (spiek?.tekst ?? vraag.v) : vraag.v;
      if (!vraag.live && spiek && spiek.tekst !== vraag.v) {
        gebreken.push(`spiekbriefje van de quizmaster toont "${kort(spiek.tekst)}" — draait de server een oudere bouw?`);
      }
      const verwacht = {
        index: vi,
        aantal: ronde.vragen.length,
        type: ronde.type,
        tekst,
        opties:
          ronde.type === 'waarnietwaar' ? ['Waar', 'Niet waar']
            : ronde.type === 'stem' ? opTelefoon?.spelers.map((s) => s.naam)
              : vraag.opties,
        emoji: vraag.emoji,
        lyric: vraag.lyric,
        eenheid: vraag.eenheid,
        media: vraag.media,
        punten: vraag.punten ?? ronde.punten ?? 1,
      };

      for (const [wie, s] of [['telefoon', opTelefoon], ['televisie', opTv]] as const) {
        if (!s || s.fase !== 'vraag' || !s.vraag) {
          gebreken.push(`${wie}: fase '${s?.fase}' zonder vraag`);
          continue;
        }
        const v = s.vraag;
        for (const veld of Object.keys(verwacht) as (keyof typeof verwacht)[]) {
          if (!gelijk(v[veld], verwacht[veld])) {
            gebreken.push(`${wie}: ${veld} is ${JSON.stringify(v[veld])}, verwacht ${JSON.stringify(verwacht[veld])}`);
          }
        }
        if (s.onthulling) gebreken.push(`${wie}: het antwoord lekt al vóór de onthulling`);
        if (s.inzendingen.length) gebreken.push(`${wie}: ziet inzendingen vóór de onthulling`);
        const tijd = (vraag.tijd ?? ronde.tijd ?? 30) * 1000;
        if (!s.klok?.loopt || s.klok.duurMs !== tijd) {
          gebreken.push(`${wie}: klok ${s.klok?.loopt ? `van ${s.klok.duurMs} ms` : 'loopt niet'}, verwacht ${tijd} ms`);
        }
      }

      // Kwam hetzelfde pakketje ook via de live-stroom binnen?
      if (stroom.open && opTelefoon) {
        const geduwd = await stroom.wachtOp(opTelefoon.versie);
        if (!geduwd) gebreken.push('live-stroom: versie kwam niet binnen 5 s op de telefoon');
        else if (geduwd.vraag?.tekst !== tekst) gebreken.push(`live-stroom: toont "${kort(geduwd.vraag?.tekst ?? '')}"`);
      }

      // Bestaat het mediabestand ook echt via de server?
      const bron = vraag.media?.bron;
      if (bron && !bron.startsWith('data:')) {
        if (!mediaGezien.has(bron)) {
          try {
            const r = await fetch(`${URL_BASIS}/media/${encodeURIComponent(bron)}`, { headers: { range: 'bytes=0-0' } });
            mediaGezien.set(bron, r.status === 206 || r.status === 200);
            await r.body?.cancel();
          } catch {
            mediaGezien.set(bron, false);
          }
        }
        if (!mediaGezien.get(bron)) gebreken.push(`media '${bron}' is niet op te halen via /media/`);
      }

      // Onthulling
      await host.post('/api/host', { opdracht: 'toon-antwoord' });
      const onthuld = await telefoon.staat();
      if (!onthuld || onthuld.fase !== 'antwoord' || !onthuld.onthulling) {
        gebreken.push(`na 'toon-antwoord' fase '${onthuld?.fase}' zonder onthulling`);
      } else {
        const o = onthuld.onthulling;
        if (ronde.type === 'stem') {
          // Niemand heeft gestemd, dus de server kan alleen dat zeggen.
          if (o.antwoord !== 'Niemand heeft gestemd' || !Array.isArray(o.stemmen)) {
            gebreken.push(`stemvraag onthult "${kort(o.antwoord)}" zonder telling`);
          }
        } else {
          // Het spiekbriefje van de quizmaster en de onthulling op de telefoon
          // horen hetzelfde te zeggen; voor een gewone vraag ook packs.ts.
          const antwoord = vraag.live ? (spiek?.antwoord ?? o.antwoord) : verwachtAntwoord(ronde, vraag);
          if (o.antwoord !== antwoord) gebreken.push(`onthulling toont "${kort(o.antwoord)}", verwacht "${kort(antwoord)}"`);
          if (spiek && spiek.antwoord !== o.antwoord) gebreken.push(`spiekbriefje zegt "${kort(spiek.antwoord)}", de telefoon "${kort(o.antwoord)}"`);
          if (!vraag.live && !gelijk(o.toelichting, vraag.toelichting)) gebreken.push('toelichting wijkt af');
          if (ronde.type === 'dichtstbij' && o.getal !== vraag.getal) gebreken.push(`doelgetal ${o.getal}, verwacht ${vraag.getal}`);
          if (ronde.type === 'meerkeuze' && o.goedeOptie !== vraag.goed) gebreken.push(`goede optie ${o.goedeOptie}, verwacht ${vraag.goed}`);
          if (ronde.type === 'waarnietwaar' && o.goedeOptie !== (vraag.goed === true ? 0 : 1)) gebreken.push('goede optie bij waar/niet waar klopt niet');
        }
        if (onthuld.klok?.loopt) gebreken.push('de klok loopt door na de onthulling');
      }

      const nogInvullen = spiek ? spiek.teVullen : !!vraag.teVullen;
      if (nogInvullen) teVullenGekozen++;
      const tag = nogInvullen ? ` ${geel('[nog invullen]')}` : '';
      if (gebreken.length) {
        mis++;
        fout(`${label} "${kort(tekst)}"${tag}`);
        for (const g of gebreken) console.log(`      ${dim('·')} ${g}`);
      } else if (ALLES) {
        ok(`${label} "${kort(tekst)}"${tag}`);
      }
    }

    // Na de laatste vraag: bij een recap-ronde eerst de cijfers van het
    // jaar, daarna (of anders meteen) de tussenstand.
    await host.post('/api/host', { opdracht: 'volgende' });
    let naRonde = await telefoon.staat();
    let cijfersTekst = '';
    if (naRonde?.fase === 'cijfers') {
      const c = naRonde.cijfers;
      if (!c || !c.stappen || !Array.isArray(c.personen)) fout(`${rondeLabel}: de fase 'cijfers' komt zonder cijfers`);
      else cijfersTekst = `, cijfers van ${c.jaar} tot ${c.peildatum} in ${c.stappen} dia's`;
      await host.post('/api/host', { opdracht: 'naar-stand' });
      naRonde = await telefoon.staat();
    } else if (ronde.cijfers) {
      let_op(`${rondeLabel}: hoort cijfers te tonen na de laatste vraag, maar ging meteen naar '${naRonde?.fase}'`);
    }
    const nogInvullen = briefje.filter((v) => v.teVullen).length;
    const staart = nogInvullen ? ` ${geel(`— ${nogInvullen} wachten nog op een antwoord`)}` : '';
    if (naRonde?.fase !== 'stand') fout(`${rondeLabel}: na de laatste vraag fase '${naRonde?.fase}' in plaats van 'stand'`);
    else if (!ALLES && !mis) console.log(`  ${groen('✓')} ${ronde.vragen.length} vragen kloppen op telefoon en televisie${cijfersTekst}${staart}`);
    else if (!ALLES) console.log(`  ${dim(`${ronde.vragen.length} vragen nagekeken${cijfersTekst}`)}${staart}`);
    mis = 0;
  }

  if (teVullenGekozen) {
    let_op(`${teVullenGekozen} van de ${nagekeken} gekozen vragen wachten nog op een antwoord; vul ze in packs.ts en draai npm run content:sync`);
  }

  kop('Live-stroom');
  if (stroom.pakketten) ok(`${stroom.pakketten} pakketjes geduwd naar de telefoon tijdens ${nagekeken} vragen`);
  else let_op('geen enkel pakketje via de live-stroom ontvangen');
}

/* ====================================================================== */

async function main() {
  console.log(vet('Blackjack Quiz — controle vooraf'));
  controleerInhoud();
  controleerJaaroverzicht();
  if (ZONDER_SERVER) {
    console.log(`\n${dim('(server overgeslagen: --zonder-server)')}`);
  } else {
    await controleerServer();
  }

  kop('Uitkomst');
  if (waarschuwingen.length) console.log(`  ${geel(`${waarschuwingen.length} waarschuwing(en)`)}`);
  if (problemen.length) {
    console.log(`  ${rood(`${problemen.length} probleem(en)`)}:`);
    for (const p of problemen) console.log(`    · ${p}`);
    process.exitCode = 1;
  } else {
    console.log(`  ${groen('alles in orde')}${ZONDER_SERVER ? ' op papier' : ': de vragen komen goed door'}`);
  }
}

main().catch((e) => {
  console.error(`\n${rood('controle gestopt:')} ${(e as Error).stack ?? e}`);
  process.exit(1);
});
