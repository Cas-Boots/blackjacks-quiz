/**
 * Live oefenen zonder vijf telefoons.
 *
 * Start vijf nepspelers tegen een draaiende server. Ze melden zich aan, wachten
 * op vragen en leveren antwoorden in — met instelbare kans op een goed
 * antwoord en een menselijke aarzeling ertussen, zodat je ziet wat er gebeurt
 * als iemand te laat is of niets invult.
 *
 * Draait de quizmaster erbij (--auto-host), dan speelt hij een hele avond af en
 * kun je in het televisiescherm meekijken of alles klopt.
 *
 *   npx tsx scripts/simulate.ts --url http://localhost:3000 --auto-host --snelheid 8
 *
 * Opties:
 *   --url        serveradres (standaard http://localhost:3000)
 *   --pin        pincode van de quizmaster (standaard uit HOST_PIN, anders 2627)
 *   --auto-host  ook de quizmaster spelen en de quiz vanzelf doorlopen
 *   --snelheid   versnelling; 8 betekent achtmaal zo snel als een echte avond
 *   --goed       kans dat een speler het juiste antwoord geeft (0..1, standaard .6)
 *   --stil       nummer van een speler die niets inlevert, om uitval te oefenen
 *   --rondes     stop na zoveel rondes (standaard alle)
 */
import { PAKKETTEN } from '../src/lib/content/packs';
import type { Vraag, Ronde } from '../src/lib/content/types';

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (!a.startsWith('--')) continue;
  const sleutel = a.slice(2);
  const volgende = process.argv[i + 1];
  if (volgende && !volgende.startsWith('--')) {
    args.set(sleutel, volgende);
    i++;
  } else args.set(sleutel, 'ja');
}

const URL_BASIS = args.get('url') ?? 'http://localhost:3000';
const PIN = args.get('pin') ?? process.env.HOST_PIN ?? '2627';
const AUTO_HOST = args.has('auto-host');
const SNELHEID = Number(args.get('snelheid') ?? 6);
const KANS_GOED = Number(args.get('goed') ?? 0.6);
const STIL = args.get('stil') ? Number(args.get('stil')) : null;
const MAX_RONDES = args.get('rondes') ? Number(args.get('rondes')) : Infinity;

const wacht = (ms: number) => new Promise((r) => setTimeout(r, Math.max(0, ms / SNELHEID)));

/** Een client met een eigen koekjespot, zoals een aparte telefoon. */
class Apparaat {
  koek = '';
  constructor(public label: string) {}

  async vraag(pad: string, opties: RequestInit = {}) {
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
    if (!r.ok) throw new Error(`${this.label}: ${pad} gaf ${r.status} ${await r.text()}`);
    return r.headers.get('content-type')?.includes('json') ? r.json() : r.text();
  }

  post(pad: string, body: unknown) {
    return this.vraag(pad, { method: 'POST', body: JSON.stringify(body) });
  }
  staat() {
    return this.vraag('/api/state');
  }
}

/** Het juiste antwoord bij een vraagtekst, opgezocht in de inhoud. */
function bouwAntwoordenIndex() {
  const index = new Map<string, { vraag: Vraag; ronde: Ronde }>();
  for (const pakket of Object.values(PAKKETTEN)) {
    for (const ronde of pakket.rondes) {
      for (const vraag of ronde.vragen) index.set(vraag.v, { vraag, ronde });
    }
  }
  return index;
}
const ANTWOORDEN = bouwAntwoordenIndex();

function juistAntwoord(tekst: string): string | null {
  const hit = ANTWOORDEN.get(tekst);
  if (!hit) return null;
  const { vraag, ronde } = hit;
  if (ronde.type === 'waarnietwaar') return vraag.goed === true ? 'Waar' : 'Niet waar';
  if (ronde.type === 'meerkeuze' && typeof vraag.goed === 'number') return String.fromCharCode(65 + vraag.goed);
  if (ronde.type === 'dichtstbij') return String(vraag.getal ?? 0);
  return vraag.a ?? null;
}

function fantasieAntwoord(tekst: string): string {
  const hit = ANTWOORDEN.get(tekst);
  if (hit?.ronde.type === 'waarnietwaar') return Math.random() < 0.5 ? 'Waar' : 'Niet waar';
  if (hit?.ronde.type === 'meerkeuze') return String.fromCharCode(65 + Math.floor(Math.random() * 4));
  if (hit?.ronde.type === 'dichtstbij') return String(Math.floor(Math.random() * 500));
  return ['geen idee', 'Amsterdam', 'Spanje', 'de bakker', '42'][Math.floor(Math.random() * 5)];
}

const telling = { ingeleverd: 0, mislukt: 0, overgeslagen: 0, vragen: 0 };

async function main() {
  console.log(`Simulatie tegen ${URL_BASIS} — snelheid ${SNELHEID}×, kans op goed ${Math.round(KANS_GOED * 100)}%`);

  const kijker = new Apparaat('kijker');
  const eerste = await kijker.staat();
  const spelerLijst: { id: number; naam: string }[] = eerste.staat?.spelers ?? [];
  if (!spelerLijst.length) throw new Error('geen spelers gevonden — draait de server en is de basis klaargezet?');

  const telefoons: { apparaat: Apparaat; id: number; naam: string; stil: boolean }[] = [];
  for (const [i, s] of spelerLijst.entries()) {
    const apparaat = new Apparaat(s.naam);
    await apparaat.staat();
    await apparaat.post('/api/join', { rol: 'speler', spelerId: s.id });
    telefoons.push({ apparaat, id: s.id, naam: s.naam, stil: STIL === i + 1 });
    console.log(`  ${s.naam} aangemeld${STIL === i + 1 ? ' (doet niet mee — uitval oefenen)' : ''}`);
  }

  let host: Apparaat | null = null;
  if (AUTO_HOST) {
    host = new Apparaat('quizmaster');
    await host.staat();
    await host.post('/api/join', { rol: 'quizmaster', pin: PIN });
    console.log('  quizmaster aangemeld');
    await host.post('/api/host', { opdracht: 'naar-ronde', ronde: 0 });
  }

  const gezien = new Set<string>();
  let stappen = 0;

  while (stappen++ < 4000) {
    const { staat } = await kijker.staat();
    if (!staat) break;
    if (staat.fase === 'einde') {
      console.log('\nKlaar. Eindstand:');
      for (const [i, r] of staat.stand.entries()) console.log(`  ${i + 1}. ${r.naam} — ${r.punten}`);
      break;
    }
    if (staat.rondeIndex >= MAX_RONDES) {
      console.log(`\nGestopt na ${MAX_RONDES} ronde(s).`);
      break;
    }

    if (staat.fase === 'vraag' && staat.vraag) {
      const sleutel = `${staat.rondeIndex}:${staat.vraag.index}`;
      if (!gezien.has(sleutel)) {
        gezien.add(sleutel);
        telling.vragen++;
        const tekst = staat.vraag.tekst;
        process.stdout.write(`R${staat.rondeIndex + 1}V${staat.vraag.index + 1} ${tekst.slice(0, 54)}… `);

        // Alleen wie in een team zit levert in; bij teamrondes doet één telefoon
        // het voor de groep, precies zoals aan tafel.
        const teams: { id: string; leden: number[] }[] = staat.teams;
        const alGedaan = new Set<string>();

        await Promise.all(
          telefoons.map(async (t) => {
            if (t.stil) return;
            const team = teams.find((x) => x.leden.includes(t.id));
            if (!team) return;
            if (alGedaan.has(team.id)) return;
            alGedaan.add(team.id);
            await wacht(800 + Math.random() * 4000);
            const goed = Math.random() < KANS_GOED;
            const antwoord = (goed ? juistAntwoord(tekst) : null) ?? fantasieAntwoord(tekst);
            try {
              await t.apparaat.post('/api/answer', { tekst: antwoord });
              telling.ingeleverd++;
            } catch (e) {
              telling.mislukt++;
              console.error(`\n  ${t.naam} kon niet inleveren:`, (e as Error).message);
            }
          }),
        );
        console.log(`${alGedaan.size} ingeleverd`);
      }

      if (host) {
        await wacht(1500);
        await host.post('/api/host', { opdracht: 'toon-antwoord' });
      }
    } else if (staat.fase === 'antwoord' && host) {
      // De quizmaster kent punten toe op basis van wat er echt goed is.
      const r = await host.vraag('/api/host/antwoorden');
      const goed = r.inzendingen.filter((i: { voorstel?: { goed: boolean } }) => i.voorstel?.goed).map((i: { inzender: string }) => i.inzender);
      if (staat.vraag?.type === 'dichtstbij') {
        await host.post('/api/host', { opdracht: 'bereken-dichtstbij' });
      } else if (goed.length) {
        await host.post('/api/host', { opdracht: 'ken-toe', inzenders: goed });
      }
      await wacht(1200);
      await host.post('/api/host', { opdracht: 'volgende' });
    } else if (staat.fase === 'ronde' && host) {
      console.log(`\n— Ronde ${staat.rondeIndex + 1}: ${staat.ronde?.naam} —`);
      await wacht(800);
      await host.post('/api/host', { opdracht: 'start-ronde' });
    } else if (staat.fase === 'stand' && host) {
      await wacht(1200);
      if (staat.rondeIndex + 1 < staat.rondeAantal) {
        await host.post('/api/host', { opdracht: 'naar-ronde', ronde: staat.rondeIndex + 1 });
      } else {
        await host.post('/api/host', { opdracht: 'naar-einde' });
      }
    } else {
      await wacht(400);
    }
  }

  console.log(
    `\n${telling.vragen} vragen, ${telling.ingeleverd} antwoorden ingeleverd, ${telling.mislukt} mislukt.`,
  );
  if (telling.mislukt) process.exitCode = 1;
}

main().catch((e) => {
  console.error('simulatie gestopt:', e);
  process.exit(1);
});
