// Records a project as a short MP4 loop for the portfolio cards: smooth, eased scrolling and clicks,
// one clip per page, joined with soft crossfades.
//
// Usage:
//   node tools/record-scroll.mjs <url> <name>             one page, section by section
//   node tools/record-scroll.mjs tools/recordings/x.mjs    a scripted tour (see tools/recordings/)
//
// Needs Brave or Chrome (BROWSER_PATH) and ffmpeg (FFMPEG_PATH, or `pip install imageio-ffmpeg`).
// Writes assets/video/<name>.mp4 and assets/img/<name>-poster.jpg.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch, sleep } from './lib/cdp.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FPS = 30, FADE = 0.45;

const [first, second] = process.argv.slice(2);
if (!first) { console.error('usage: node tools/record-scroll.mjs <url> <name> | <tour.mjs>'); process.exit(1); }
const tour = first.endsWith('.mjs')
  ? (await import(pathToFileURL(resolve(first)).href)).default
  : { name: second, clips: [{ url: first, record: [{ wait: 1200 }, { sections: {} }, { wait: 400 }, { top: 1600 }, { wait: 400 }] }] };
const W = tour.width || 1440, H = tour.height || 900;
const ffmpeg = process.env.FFMPEG_PATH || execFileSync('python', ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();

// Runs inside the page: eased gliding and a section-by-section walk.
const HELPERS = `window.__rec = {
  ease: (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  wait: (ms) => new Promise((r) => setTimeout(r, ms)),
  max: () => document.documentElement.scrollHeight - innerHeight,
  glide(to, ms) {
    to = Math.max(0, Math.min(this.max(), to));
    ms = ms || Math.max(900, Math.min(1500, 600 + Math.abs(to - scrollY) * .6));
    return new Promise((r) => {
      const from = scrollY, start = performance.now();
      const step = (now) => { const k = Math.min(1, (now - start) / ms); scrollTo(0, from + (to - from) * this.ease(k)); k < 1 ? requestAnimationFrame(step) : r(); };
      requestAnimationFrame(step);
    });
  },
  stops(selector, maxStops) {
    const max = this.max();
    const tops = [...document.querySelectorAll(selector)].map((el) => Math.min(max, Math.round(el.getBoundingClientRect().top + scrollY))).sort((a, b) => a - b);
    let stops = [];
    for (const y of tops) if (y > 40 && (!stops.length || y - stops[stops.length - 1] > 240)) stops.push(y);
    if (!stops.length && max > 40) { for (let y = innerHeight * .8; y < max; y += innerHeight * .8) stops.push(Math.round(y)); }
    if (max > 40 && (!stops.length || stops[stops.length - 1] < max - 40)) stops.push(max);
    if (maxStops && stops.length > maxStops) stops = Array.from({ length: maxStops }, (_, i) => stops[Math.round((i + 1) * stops.length / maxStops) - 1]);
    return stops;
  },
};
(() => {
  const s = document.createElement('style');
  s.textContent = 'html,body{scroll-snap-type:none!important;scroll-behavior:auto!important}::-webkit-scrollbar{display:none}*{scrollbar-width:none}';
  document.head.append(s);
})();`;

async function run(b, step) {
  if (step.goto) return b.goto(step.goto, step.settle ?? 1800);
  if (step.wait) return sleep(step.wait);
  if (step.eval) return b.evaluate(step.eval);
  if (step.click) {
    const [sel, text] = Array.isArray(step.click) ? step.click : [step.click];
    await b.evaluate(`(() => {
      const el = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => x.offsetParent !== null && (${JSON.stringify(text || '')} === '' || new RegExp(${JSON.stringify(text || '')}, 'i').test(x.innerText)));
      if (!el) throw new Error('nothing to click: ${String(sel).replace(/'/g, '')} ${String(text || '').replace(/'/g, '')}');
      el.click(); return true;
    })()`);
    return sleep(step.after ?? 1400);
  }
  if (step.sections) {
    const { selector = 'section, footer', maxStops = 0, hold = 1000 } = step.sections;
    return b.evaluate(`(async () => { for (const y of __rec.stops(${JSON.stringify(selector)}, ${maxStops})) { await __rec.glide(y); await __rec.wait(${hold}); } })()`);
  }
  if (step.type) {
    const { selector, text, delay = 45 } = step.type;
    await b.evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
    for (const ch of text) { await b.send('Input.insertText', { text: ch }); await sleep(delay + Math.random() * delay * .6); }
    return sleep(step.after ?? 500);
  }
  if (step.waitStable) {
    // Waits until the text inside an element stops changing, e.g. a streamed reply.
    const { selector, quiet = 2500, timeout = 120000 } = step.waitStable;
    const t0 = Date.now(); let last = -1, since = Date.now();
    while (Date.now() - t0 < timeout) {
      const len = await b.evaluate(`(document.querySelector(${JSON.stringify(selector)})?.innerText || '').length`);
      if (len !== last) { last = len; since = Date.now(); } else if (Date.now() - since > quiet) break;
      await sleep(250);
    }
    return;
  }
  if (step.waitFor) {
    // Polls a page expression until it is true, e.g. a "Stop" button turning back into "Send".
    const { js, timeout = 180000 } = step.waitFor;
    const t0 = Date.now();
    while (Date.now() - t0 < timeout && !(await b.evaluate(js))) await sleep(300);
    return sleep(step.after ?? 0);
  }
  if (step.scrollIn) {
    const { selector, to = 'end', ms = 1400 } = step.scrollIn;
    return b.evaluate(`new Promise((r) => { const el = document.querySelector(${JSON.stringify(selector)}); const from = el.scrollTop;
      const target = ${JSON.stringify(to)} === 'end' ? el.scrollHeight - el.clientHeight : ${JSON.stringify(to)} === 'start' ? 0 : +${JSON.stringify(to)};
      const start = performance.now(); const step = (now) => { const k = Math.min(1, (now - start) / ${ms}); el.scrollTop = from + (target - from) * __rec.ease(k); k < 1 ? requestAnimationFrame(step) : r(); };
      requestAnimationFrame(step); })`);
  }
  if (step.top) return b.evaluate(`__rec.glide(0, ${step.top})`);
  if (step.to) return b.evaluate(`__rec.glide(${step.to}, ${step.ms || 0})`);
  throw new Error('unknown step ' + JSON.stringify(step));
}

const b = await launch({ width: W, height: H });
const work = mkdtempSync(join(tmpdir(), 'tour-'));
const clips = [];
try {
  for (const [ci, clip] of tour.clips.entries()) {
    if (clip.url) await b.goto(clip.url, clip.settle ?? 1800);
    await b.evaluate(HELPERS);
    if (clip.css) await b.evaluate(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(clip.css)}; document.head.append(s); })()`);
    for (const step of clip.setup || []) await run(b, step);
    await b.evaluate('scrollTo(0, 0)');
    await sleep(500);

    const frames = [];
    const off = b.on('Page.screencastFrame', (p) => {
      frames.push({ t: p.metadata.timestamp, data: p.data });
      b.send('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(() => {});
    });
    await b.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
    await sleep(250);
    const t0 = Date.now() / 1000;
    // Each step remembers its real time span; a step with speed > 1 is played back faster.
    const spans = [];
    let tPrev = t0;
    for (const step of clip.record) { await run(b, step); const now = Date.now() / 1000; spans.push({ a: tPrev, b: now, speed: step.speed || 1 }); tPrev = now; }
    const t1 = tPrev;
    await b.send('Page.stopScreencast');
    off();
    if (!frames.length) throw new Error(`clip ${ci}: no frames captured`);

    // Resample the variable-rate screencast to a steady 30 fps, holding the last frame through still moments.
    const dir = join(work, `c${ci}`); mkdirSync(dir);
    spans[0].a = Math.max(frames[0].t, t0 - 0.05);
    let fi = 0, n = 0;
    for (const sp of spans) {
      for (let k = 0; sp.a + k * sp.speed / FPS < sp.b; k++) {
        const t = sp.a + k * sp.speed / FPS;
        while (fi + 1 < frames.length && frames[fi + 1].t <= t) fi++;
        writeFileSync(join(dir, `f${String(n++).padStart(5, '0')}.jpg`), Buffer.from(frames[fi].data, 'base64'));
      }
    }
    const out = join(work, `c${ci}.mp4`);
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, 'f%05d.jpg'),
      '-vf', 'scale=1280:-2:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-an', out]);
    clips.push({ file: out, duration: n / FPS });
    console.log(`clip ${ci + 1}/${tour.clips.length}: ${(n / FPS).toFixed(1)} s`);
  }
} finally {
  await b.close();
}

// Join the clips with short crossfades, then encode once for the web.
mkdirSync(join(root, 'assets/video'), { recursive: true });
const mp4 = join(root, 'assets/video', `${tour.name}.mp4`);
const poster = join(root, 'assets/img', `${tour.name}-poster.jpg`);
const inputs = clips.flatMap((c) => ['-i', c.file]);
let filter = '', last = '[0:v]', offset = 0;
for (let i = 1; i < clips.length; i++) {
  offset += clips[i - 1].duration - FADE;
  filter += `${last}[${i}:v]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(3)}[x${i}];`;
  last = `[x${i}]`;
}
const map = clips.length > 1 ? ['-filter_complex', filter.replace(/;$/, ''), '-map', last] : [];
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', ...inputs, ...map,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', String(tour.crf || 25), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4]);
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', clips[0].file, '-frames:v', '1', '-q:v', '3', poster]);
rmSync(work, { recursive: true, force: true });
const seconds = clips.reduce((a, c) => a + c.duration, 0) - FADE * (clips.length - 1);
console.log(`${tour.name}: ${seconds.toFixed(1)} s → ${mp4}`);
