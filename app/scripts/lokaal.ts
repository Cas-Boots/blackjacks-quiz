/**
 * De quiz op je eigen pc, bereikbaar voor de televisie en de telefoons.
 *
 * `npm run dev` luistert alleen op deze computer zelf (localhost); een
 * telefoon op dezelfde wifi komt er niet bij. Dit script bouwt de app, start
 * hem op alle netwerkkaarten, wacht tot hij gezond is en zegt dan welk adres
 * je op de televisie en op de telefoons tikt — met een QR-code in het
 * terminalvenster, zodat je zonder televisie ook een telefoon kunt laten
 * meedoen.
 *
 *   npm run lokaal                  bouwen en starten op poort 3000
 *   npm run lokaal -- --dev         zonder bouwen, met herladen bij elke wijziging
 *   npm run lokaal -- --poort 8080  een andere poort
 *   npm run lokaal -- --pin 4711    een eigen pincode voor het hostscherm
 *   npm run lokaal -- --zonder-bouw de vorige build hergebruiken
 *
 * Instellingen komen uit `.env` naast dit project als dat er staat (kopieer
 * `.env.example`), anders uit de omgeving, en anders uit de standaarden
 * hieronder. De database staat in `data/lokaal.db`, de bestanden bij de
 * vragen in `media/`.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { hostname } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { adresUrl, inWsl, lijktAfgeschermd, netwerkAdressen } from '../src/lib/server/netwerk';
import { VOORBEELD_PIN } from '../src/lib/server/omgeving';

const hier = dirname(fileURLToPath(import.meta.url));
const appMap = resolve(hier, '..');

/* ---- Opties ------------------------------------------------------------ */

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

if (args.has('help') || args.has('h')) {
  console.log(`De quiz op je eigen pc, bereikbaar op het thuisnetwerk.

  npm run lokaal                  bouwen en starten op poort 3000
  npm run lokaal -- --dev         zonder bouwen, met herladen bij elke wijziging
  npm run lokaal -- --poort 8080  een andere poort
  npm run lokaal -- --pin 4711    een eigen pincode voor het hostscherm
  npm run lokaal -- --zonder-bouw de vorige build hergebruiken`);
  process.exit(0);
}

// `.env` naast het project, zoals de README beschrijft; nooit verplicht.
const envPad = resolve(appMap, '.env');
if (existsSync(envPad)) {
  process.loadEnvFile(envPad);
}

const DEV = args.has('dev');
const ZONDER_BOUW = args.has('zonder-bouw');
const POORT = Number(args.get('poort') ?? process.env.PORT ?? 3000);
const PIN = args.get('pin') ?? process.env.HOST_PIN ?? VOORBEELD_PIN;

if (!Number.isInteger(POORT) || POORT < 1 || POORT > 65535) {
  console.error(`Geen geldige poort: ${args.get('poort') ?? process.env.PORT}`);
  process.exit(1);
}

/** De omgeving voor de server: op alle netwerkkaarten, met de standaarden van een laptop. */
const omgeving: NodeJS.ProcessEnv = {
  ...process.env,
  HOST: '0.0.0.0',
  PORT: String(POORT),
  HOST_PIN: PIN,
  DATABASE_PATH: process.env.DATABASE_PATH ?? resolve(appMap, 'data', 'lokaal.db'),
  MEDIA_DIR: process.env.MEDIA_DIR ?? resolve(appMap, 'media'),
  // Met opzet géén productie: dan mag de voorbeeldpincode, blijft het cookie
  // zonder `Secure` (de telefoons praten over gewoon http) en toont de
  // server zijn netwerkadressen.
  NODE_ENV: 'development',
};
// Een ORIGIN uit .env is voor de echte server; hier zou hij elk verzoek van
// een telefoon als 'verkeerd adres' laten afwijzen.
delete omgeving.ORIGIN;

/* ---- Hulpjes ----------------------------------------------------------- */

const vite = resolve(appMap, 'node_modules', 'vite', 'bin', 'vite.js');

/** Start een Node-script en geeft het kind terug; de uitvoer gaat gewoon naar dit venster. */
function start(script: string, extra: string[], env: NodeJS.ProcessEnv): ChildProcess {
  return spawn(process.execPath, [script, ...extra], { cwd: appMap, env, stdio: 'inherit' });
}

/** Wacht tot een kind klaar is; een andere afsluitcode dan 0 is een fout. */
function klaar(kind: ChildProcess, wat: string): Promise<void> {
  return new Promise((res, rej) => {
    kind.on('error', rej);
    kind.on('exit', (code) => (code === 0 ? res() : rej(new Error(`${wat} mislukte (code ${code})`))));
  });
}

const slaap = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Wacht tot /api/health antwoordt, of tot de server er zelf de brui aan geeft. */
async function wachtOpGezond(kind: ChildProcess, url: string, maxMs: number): Promise<{ ok: boolean; reden?: string }> {
  const tot = Date.now() + maxMs;
  let gestopt = false;
  kind.once('exit', () => (gestopt = true));
  while (Date.now() < tot) {
    if (gestopt) return { ok: false, reden: 'de server stopte meteen weer; zie de melding hierboven' };
    try {
      const r = await fetch(url);
      if (r.ok) return { ok: true };
      const tekst = await r.text();
      return { ok: false, reden: `/api/health gaf ${r.status}: ${tekst}` };
    } catch {
      /* nog niet wakker */
    }
    await slaap(400);
  }
  return { ok: false, reden: 'geen antwoord binnen de wachttijd' };
}

/* ---- Het bord met adressen -------------------------------------------- */

async function toonAdressen() {
  const adressen = netwerkAdressen();
  const lijn = '─'.repeat(64);
  console.log(`\n${lijn}`);
  console.log('  De quiz draait. Sluit dit venster niet zolang de avond loopt.\n');

  if (adressen.length === 0) {
    console.log('  Geen netwerkadres gevonden: zit deze computer wel op de wifi?');
    console.log(`  Op deze computer zelf: ${adresUrl('localhost', POORT, '/tv')}`);
  } else {
    const eerste = adressen[0];
    console.log(`  Televisie      ${adresUrl(eerste.adres, POORT, '/tv')}`);
    console.log(`  Hostscherm     ${adresUrl(eerste.adres, POORT, '/host')}     pincode ${PIN}`);
    console.log(`  Telefoons      ${adresUrl(eerste.adres, POORT)}`);
    console.log(`  Beheer         ${adresUrl(eerste.adres, POORT, '/beheer')}`);
    console.log(`  Oefenen        ${adresUrl(eerste.adres, POORT, '/tv?test')}     de televisie zonder spel`);
    console.log(`\n  Dat is het adres van '${eerste.naam}' op ${hostname()}.`);
    if (adressen.length > 1) {
      console.log('  Deze computer heeft meer adressen; werkt het bovenste niet, probeer dan:');
      for (const a of adressen.slice(1)) console.log(`    ${adresUrl(a.adres, POORT, '/tv')}   (${a.naam})`);
    }
    console.log('\n  Scan met een telefoon op dezelfde wifi om meteen mee te doen:\n');
    const qr = await QRCode.toString(adresUrl(eerste.adres, POORT), { type: 'terminal', small: true });
    console.log(qr.replace(/^/gm, '  '));
  }
  if (lijktAfgeschermd(adressen, inWsl())) {
    console.log('  LET OP: dit is WSL, en het adres hierboven bestaat alleen binnen WSL.');
    console.log('  Een telefoon op de wifi komt er zo niet bij. Zet in Windows');
    console.log('  networkingMode=mirrored in .wslconfig en open poort ' + POORT + ' in de');
    console.log('  firewall; zie het README onder "WSL". Daarna staat hier 192.168.x.x.\n');
  }
  console.log('  Komt een telefoon er niet bij? Kijk in de README onder');
  console.log('  "Op je eigen pc" naar de firewall en het gastnetwerk.');
  if (adressen.length) {
    const basis = adresUrl(adressen[0].adres, POORT).replace(/\/$/, '');
    console.log(`\n  Komen de vragen goed door?   npm run verify -- --url ${basis}`);
    console.log(`  Nepspelers aan tafel:        npm run simulate -- --url ${basis} --auto-host --snelheid 8`);
  }
  console.log(`${lijn}\n`);
}

/* ---- Aan de slag ------------------------------------------------------- */

async function hoofd() {
  if (!existsSync(vite)) {
    console.error('node_modules ontbreekt. Draai eerst: npm install --legacy-peer-deps');
    process.exit(1);
  }
  if (PIN === VOORBEELD_PIN) {
    console.log(`Het hostscherm opent met de voorbeeldpincode ${VOORBEELD_PIN}. Een eigen code: --pin 4711, of HOST_PIN in .env.`);
  }

  let server: ChildProcess;
  if (DEV) {
    // Vite's ontwikkelserver, maar dan op alle netwerkkaarten. Vite zet
    // hooks.server.ts er zelf bij, dus de pincode en de database werken net zo.
    server = start(vite, ['dev', '--host', '0.0.0.0', '--port', String(POORT), '--strictPort'], omgeving);
  } else {
    const gebouwd = resolve(appMap, 'build', 'index.js');
    if (ZONDER_BOUW && existsSync(gebouwd)) {
      console.log('Vorige build hergebruikt (--zonder-bouw).');
    } else {
      console.log('Bouwen…');
      await klaar(start(vite, ['build'], { ...process.env, NODE_ENV: 'production' }), 'Bouwen');
    }
    server = start(gebouwd, [], omgeving);
  }

  // Ctrl+C stopt de server mee; anders blijft de poort bezet.
  const stop = () => {
    if (!server.killed) server.kill('SIGINT');
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  server.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  const gezond = await wachtOpGezond(server, adresUrl('127.0.0.1', POORT, '/api/health'), 60_000);
  if (!gezond.ok) {
    console.error(`\nDe server kwam niet goed op: ${gezond.reden}.`);
    console.error(`Staat er al iets op poort ${POORT}? Kies een andere met --poort.`);
    stop();
    process.exit(1);
  }
  await toonAdressen();
}

hoofd().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
