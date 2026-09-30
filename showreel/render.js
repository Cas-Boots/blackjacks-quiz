// Renders index.html frame by frame to jaaroverzicht-2026.mp4.
//   npm run render                   -> soundtrack plus the whole film, in parallel
//   node render.js --jobs 2          -> choose the number of parallel browsers (default: 3, or fewer cores)
//   node render.js --stills 1 4.2    -> PNG stills at the given times, for checking
// ffmpeg comes from the ffmpeg-static package; set FFMPEG to use another one.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pathToFileURL } = require('url');

const FPS = 60;
const FFMPEG = process.env.FFMPEG || (() => { try { return require('ffmpeg-static'); } catch { return 'ffmpeg'; } })();
const here = __dirname;
const OUT = path.join(here, 'jaaroverzicht-2026.mp4');
const clip = { x: 0, y: 0, width: 1920, height: 1080 };

async function openPage() {
  const browser = await chromium.launch({ args: ['--font-render-hinting=none'], timeout: 0 });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(0); // a slow laptop may need more than Playwright's 30 s for a heavy frame
  page.on('pageerror', e => { console.error('[page error]', e); process.exit(1); });
  await page.goto(pathToFileURL(path.join(here, 'index.html')).href + '?capture=1');
  await page.evaluate(() => window.__ready);
  return { browser, page };
}
const run = (args, opts = {}) => new Promise((res, rej) => {
  const p = spawn(FFMPEG, args, { stdio: ['pipe', 'inherit', 'inherit'], ...opts });
  p.on('close', c => c ? rej(new Error('ffmpeg ' + c)) : res());
  return p;
});

// one worker: frames [from, to) into its own segment
async function segment(from, to, file) {
  const { browser, page } = await openPage();
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-tune', 'animation', file],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(r => ff.on('close', r));
  for (let f = from; f < to; f++) {
    await page.evaluate(t => window.__render(t), f / FPS);
    const buf = await page.screenshot({ type: 'png', clip });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - from) % 600 === 0) console.error(`[${path.basename(file)}] ${f - from}/${to - from}`);
  }
  ff.stdin.end();
  await done;
  await browser.close();
}

(async () => {
  const args = process.argv.slice(2);
  if (args[0] === '--stills') {
    const { browser, page } = await openPage();
    const out = path.join(here, 'stills');
    fs.mkdirSync(out, { recursive: true });
    for (const t of args.slice(1).map(Number)) {
      await page.evaluate(t => window.__render(t), t);
      await page.screenshot({ path: path.join(out, `t${t.toFixed(3)}.png`), clip });
    }
    await browser.close();
    return;
  }
  if (args[0] === '--segment') { await segment(+args[1], +args[2], args[3]); return; }

  const jobs = args[0] === '--jobs' ? +args[1] : Math.max(1, Math.min(3, os.cpus().length - 1));
  const { browser, page } = await openPage();
  const dur = await page.evaluate(() => window.__duration);
  await browser.close();
  const total = Math.round(dur * FPS);
  const tmp = path.join(here, '.segments');
  fs.mkdirSync(tmp, { recursive: true });
  const parts = [];
  const t0 = Date.now();
  await Promise.all(Array.from({ length: jobs }, (_, j) => {
    const from = Math.floor(total * j / jobs), to = Math.floor(total * (j + 1) / jobs);
    const file = path.join(tmp, `deel-${j}.mp4`);
    parts.push(file);
    return new Promise((res, rej) => {
      const p = spawn(process.execPath, [__filename, '--segment', from, to, file], { stdio: 'inherit' });
      p.on('close', c => c ? rej(new Error('segment ' + j)) : res());
    });
  }));
  fs.writeFileSync(path.join(tmp, 'lijst.txt'), parts.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n'));
  await run(['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'lijst.txt'),
    '-i', path.join(here, 'soundtrack.wav'), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', OUT]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.error(`klaar: ${OUT} (${total} frames in ${((Date.now() - t0) / 60000).toFixed(1)} min)`);
})();
