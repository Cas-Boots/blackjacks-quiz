// Renders index.html frame by frame to jaaroverzicht-2026.mp4.
//   npm run check                    -> tests Node, ffmpeg, Chromium and one frame; says what to fix
//   npm run render                   -> soundtrack plus the whole film (1080p, 60 fps)
//   npm run render:snel              -> the same at 30 fps: half the frames, about half the time
//   node render.js --jobs 2          -> the number of browsers side by side (default: 3, or fewer cores)
//   node render.js --stills 1 4.2    -> PNG stills at the given times, for checking
// Everything it does is also written to render-log.txt; send that file along if something breaks.
// ffmpeg comes from the ffmpeg-static package; set FFMPEG to use another one.
const { spawn, spawnSync, fork } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pathToFileURL } = require('url');

const here = __dirname;
const LOG = path.join(here, 'render-log.txt');
const OUT = path.join(here, 'jaaroverzicht-2026.mp4');
const clip = { x: 0, y: 0, width: 1920, height: 1080 };
const isWorker = process.argv[2] === '--segment';

function log(msg) {
  const line = `[${new Date().toLocaleTimeString('nl-NL')}] ${msg}`;
  if (!isWorker) console.log(line);
  try { fs.appendFileSync(LOG, line + '\n'); } catch { /* the log is a nicety */ }
}
function fail(msg, err) {
  log('✗ ' + msg);
  if (err) log(String((err && err.stack) || err));
  if (!isWorker) console.log(`\nDe volledige melding staat in ${LOG}. Stuur dat bestand mee als je hulp vraagt.`);
  process.exit(1);
}
process.on('unhandledRejection', e => fail('Er ging iets mis:', e));
process.on('uncaughtException', e => fail('Er ging iets mis:', e));

let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { fail('Playwright is niet geïnstalleerd. Draai eerst: npm install', e); }
const FFMPEG = process.env.FFMPEG || (() => { try { return require('ffmpeg-static'); } catch { return 'ffmpeg'; } })();

async function openPage() {
  let browser;
  try { browser = await chromium.launch({ args: ['--font-render-hinting=none'], timeout: 0 }); }
  catch (e) { fail('Chromium start niet. Draai: npx playwright install --with-deps chromium', e); }
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(0); // a slow laptop may need more than Playwright's 30 s for a heavy frame
  page.on('pageerror', e => fail('De film zelf gaf een fout:', e));
  await page.goto(pathToFileURL(path.join(here, 'index.html')).href + '?capture=1');
  await page.evaluate(() => window.__ready);
  return { browser, page };
}
const grab = page => page.screenshot({ type: 'jpeg', quality: 95, clip }); // jpeg: much quicker than png

// ------------------------------------------------------------- a worker
// renders frames [from, to) at fps into its own file and reports progress to the main process
async function segment(from, to, file, fps) {
  const { browser, page } = await openPage();
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-tune', 'animation', file],
    { stdio: ['pipe', 'ignore', 'pipe'] });
  let ffErr = '';
  ff.stderr.on('data', d => { ffErr += d; });
  const done = new Promise(r => ff.on('close', r));
  let last = 0;
  for (let f = from; f < to; f++) {
    await page.evaluate(t => window.__render(t), f / fps);
    const buf = await grab(page);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (Date.now() - last > 1000 || f === to - 1) { process.send({ done: f - from + 1 }); last = Date.now(); }
  }
  ff.stdin.end();
  const code = await done;
  await browser.close();
  if (code) fail(`ffmpeg stopte met code ${code}: ${ffErr}`);
}

// -------------------------------------------------------------- checks
async function check() {
  log(`Node ${process.version} op ${os.platform()} (${os.cpus().length} kernen, ${Math.round(os.totalmem() / 2 ** 30)} GB geheugen)`);
  if (+process.versions.node.split('.')[0] < 18) fail('Node 18 of nieuwer is nodig: https://nodejs.org');
  log('✓ Node is nieuw genoeg');
  const v = spawnSync(FFMPEG, ['-hide_banner', '-encoders'], { encoding: 'utf8' });
  if (v.error || v.status) fail(`ffmpeg werkt niet (${FFMPEG}). Draai npm install opnieuw.`, v.error || v.stderr);
  if (!/libx264/.test(v.stdout)) fail('Deze ffmpeg kan geen H.264 maken (libx264 ontbreekt).');
  log('✓ ffmpeg werkt');
  if (!fs.existsSync(path.join(here, 'soundtrack.wav'))) log('! soundtrack.wav ontbreekt nog; npm run render maakt hem eerst');
  else log('✓ soundtrack.wav is er');
  const t0 = Date.now();
  const { browser, page } = await openPage();
  log(`✓ Chromium start en de film laadt (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  const t1 = Date.now();
  for (let i = 0; i < 10; i++) { await page.evaluate(t => window.__render(t), 20 + i / 60); await grab(page); }
  const perFrame = (Date.now() - t1) / 10;
  const dur = await page.evaluate(() => window.__duration);
  await browser.close();
  log(`✓ een frame duurt ${Math.round(perFrame)} ms`);
  const jobs = Math.max(1, Math.min(3, os.cpus().length - 1));
  const est = fps => Math.max(1, Math.round(dur * fps * perFrame / 1000 / 60 / Math.max(1, jobs * 0.8)));
  log(`Alles werkt. Schatting met ${jobs} browsers: ongeveer ${est(60)} min (npm run render) of ${est(30)} min (npm run render:snel).`);
}

// ---------------------------------------------------------------- main
(async () => {
  const args = process.argv.slice(2);
  if (isWorker) { await segment(+args[1], +args[2], args[3], +args[4]); process.exit(0); }
  const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? +args[i + 1] : dflt; };
  try { fs.writeFileSync(LOG, ''); } catch { /* ignore */ }

  if (args[0] === '--check') { await check(); return; }
  if (args[0] === '--stills') {
    const { browser, page } = await openPage();
    const out = path.join(here, 'stills');
    fs.mkdirSync(out, { recursive: true });
    for (const t of args.slice(1).map(Number)) {
      await page.evaluate(t => window.__render(t), t);
      await page.screenshot({ path: path.join(out, `t${t.toFixed(3)}.png`), clip });
      log(`✓ stills/t${t.toFixed(3)}.png`);
    }
    await browser.close();
    return;
  }

  const fps = opt('--fps', 60);
  const jobs = opt('--jobs', Math.max(1, Math.min(3, os.cpus().length - 1)));
  if (!fs.existsSync(path.join(here, 'soundtrack.wav'))) fail('soundtrack.wav ontbreekt. Draai eerst: npm run audio');
  log('De film wordt geladen…');
  const { browser, page } = await openPage();
  const dur = await page.evaluate(() => window.__duration);
  await browser.close();
  const total = Math.round(dur * fps);
  log(`${total} frames (${Math.floor(dur / 60)}:${String(Math.round(dur % 60)).padStart(2, '0')} op ${fps} fps), met ${jobs} browsers tegelijk. Voortgang volgt hieronder.`);

  const tmp = path.join(here, '.segments');
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  const parts = [], doneBy = new Array(jobs).fill(0);
  const t0 = Date.now();
  const tty = process.stdout.isTTY;
  const tick = setInterval(() => {
    const done = doneBy.reduce((a, b) => a + b, 0), sec = (Date.now() - t0) / 1000;
    const rate = done / sec, left = rate > 0 ? (total - done) / rate : 0;
    const bar = '█'.repeat(Math.round(done / total * 30)).padEnd(30, '░');
    const line = `${bar} ${(done / total * 100).toFixed(1).padStart(5)}%  ${done}/${total} frames  ${rate.toFixed(1)} fps  nog ~${Math.ceil(left / 60)} min`;
    if (tty) process.stdout.write('\r' + line); else log(line);
  }, tty ? 2000 : 30000);
  await Promise.all(Array.from({ length: jobs }, (_, j) => {
    const from = Math.floor(total * j / jobs), to = Math.floor(total * (j + 1) / jobs);
    const file = path.join(tmp, `deel-${j}.mp4`);
    parts.push(file);
    return new Promise((res, rej) => {
      const p = fork(__filename, ['--segment', from, to, file, fps], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] });
      p.on('message', m => { doneBy[j] = m.done; });
      p.on('exit', c => c ? rej(new Error(`browser ${j + 1} stopte (code ${c}); zie ${LOG}`)) : res());
    });
  })).catch(e => { clearInterval(tick); fail(e.message); });
  clearInterval(tick);
  if (tty) process.stdout.write('\n');
  log('Alle frames staan klaar; het geluid gaat erbij…');
  fs.writeFileSync(path.join(tmp, 'lijst.txt'), parts.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n'));
  const r = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'lijst.txt'),
    '-i', path.join(here, 'soundtrack.wav'), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', OUT], { encoding: 'utf8' });
  if (r.status) fail('Samenvoegen mislukt: ' + r.stderr);
  fs.rmSync(tmp, { recursive: true, force: true });
  log(`✓ Klaar: ${OUT} (${((Date.now() - t0) / 60000).toFixed(1)} min)`);
})();
