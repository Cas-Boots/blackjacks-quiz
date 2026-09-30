// Renders index.html frame by frame to showreel-2026.mp4.
//   node render.js                 -> full video (needs soundtrack.wav, see audio.js)
//   node render.js --stills 1 4.2  -> PNG stills at the given times, for checking
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const FPS = 60, DUR = 15;
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const here = __dirname;

(async () => {
  const args = process.argv.slice(2);
  const stills = args[0] === '--stills' ? args.slice(1).map(Number) : null;
  const browser = await chromium.launch({ args: ['--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => { console.error('[page error]', e); process.exit(1); });
  await page.goto('file://' + path.join(here, 'index.html') + '?capture=1');
  await page.evaluate(() => window.__ready);
  const clip = { x: 0, y: 0, width: 1920, height: 1080 };

  if (stills) {
    const out = path.join(here, 'stills');
    fs.mkdirSync(out, { recursive: true });
    for (const t of stills) {
      await page.evaluate(t => window.__render(t), t);
      await page.screenshot({ path: path.join(out, `t${t.toFixed(3)}.png`), clip });
    }
    await browser.close();
    return;
  }

  const ff = spawn(FFMPEG, [
    '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-i', path.join(here, 'soundtrack.wav'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-tune', 'animation',
    '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart',
    path.join(here, 'showreel-2026.mp4'),
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  const total = FPS * DUR;
  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    await page.evaluate(t => window.__render(t), f / FPS);
    const buf = await page.screenshot({ type: 'png', clip });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 60 === 0) process.stderr.write(`frame ${f}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
})();
