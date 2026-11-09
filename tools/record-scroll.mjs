// Records a smooth, section-by-section scroll of a page as an MP4 loop, for the project cards.
// Usage: node tools/record-scroll.mjs <url> <name> [--width 1440] [--height 900]
// Needs Brave or Chrome (BROWSER_PATH) and ffmpeg (FFMPEG_PATH, or `pip install imageio-ffmpeg`).
// Writes assets/video/<name>.mp4 and assets/img/<name>-poster.jpg.
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); if (i === -1) return def; const v = args[i + 1]; args.splice(i, 2); return v; };
const W = +opt('width', 1440), H = +opt('height', 900), FPS = 30;
const [url, name] = args;
if (!url || !name) { console.error('usage: node tools/record-scroll.mjs <url> <name> [--width 1440] [--height 900]'); process.exit(1); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const browserPath = process.env.BROWSER_PATH || [
  join(process.env.LOCALAPPDATA || '', 'BraveSoftware/Brave-Browser/Application/brave.exe'),
  'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(existsSync);
if (!browserPath) throw new Error('No Brave or Chrome found. Set BROWSER_PATH.');
const ffmpeg = process.env.FFMPEG_PATH || execFileSync('python', ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9333;
const profile = mkdtempSync(join(tmpdir(), 'rec-'));
const browser = spawn(browserPath, [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  `--window-size=${W},${H}`, '--hide-scrollbars', '--mute-audio', '--no-first-run', '--no-default-browser-check', 'about:blank',
], { stdio: 'ignore' });

let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch {}
}
if (!target) throw new Error('Browser did not start.');

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let seq = 0; const pending = new Map(); const listeners = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
  else if (m.method) (listeners.get(m.method) || []).forEach((f) => f(m.params));
});
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
const on = (method, f) => listeners.set(method, [...(listeners.get(method) || []), f]);
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
const loaded = new Promise((r) => on('Page.loadEventFired', r));
await send('Page.navigate', { url });
await loaded;
await sleep(1500);

// Our own easing replaces the page's snap and smooth scrolling; the scrollbar stays out of the picture.
await evaluate(`(() => {
  const s = document.createElement('style');
  s.textContent = 'html,body{scroll-snap-type:none!important;scroll-behavior:auto!important}::-webkit-scrollbar{display:none}';
  document.head.append(s); window.scrollTo(0, 0); return true;
})()`);
await sleep(600);

const frames = [];
on('Page.screencastFrame', (p) => {
  frames.push({ t: p.metadata.timestamp, data: p.data });
  send('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(() => {});
});
await send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
await sleep(300);
const t0 = Date.now() / 1000;

// Section by section: ease to each section, rest on it, then glide back to the top so the loop is seamless.
await evaluate(`(async () => {
  const ease = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const max = document.documentElement.scrollHeight - innerHeight;
  const tops = [...document.querySelectorAll('section, footer')].map((el) => Math.min(max, Math.round(el.getBoundingClientRect().top + scrollY)));
  const stops = [];
  for (const y of tops.sort((a, b) => a - b)) if (y > 40 && (!stops.length || y - stops[stops.length - 1] > 240)) stops.push(y);
  if (!stops.length || stops[stops.length - 1] < max - 40) stops.push(max);
  const glide = (to, ms) => new Promise((r) => {
    const from = scrollY, start = performance.now();
    const step = (now) => { const k = Math.min(1, (now - start) / ms); scrollTo(0, from + (to - from) * ease(k)); k < 1 ? requestAnimationFrame(step) : r(); };
    requestAnimationFrame(step);
  });
  await wait(1200);
  for (const y of stops) { await glide(y, Math.max(900, Math.min(1500, 600 + Math.abs(y - scrollY) * .6))); await wait(1000); }
  await wait(400);
  await glide(0, 1600);
  await wait(500);
  return stops;
})()`);
const t1 = Date.now() / 1000;
await send('Page.stopScreencast');
await sleep(300);
ws.close(); browser.kill();

// Resample the variable-rate screencast to a steady 30 fps, holding the last frame through still moments.
if (!frames.length) throw new Error('No frames captured.');
const tmp = mkdtempSync(join(tmpdir(), 'frames-'));
const start = Math.max(frames[0].t, t0 - 0.05), total = t1 - start;
let fi = 0, n = 0;
for (let k = 0; k * (1 / FPS) <= total; k++) {
  const t = start + k / FPS;
  while (fi + 1 < frames.length && frames[fi + 1].t <= t) fi++;
  writeFileSync(join(tmp, `f${String(n++).padStart(5, '0')}.jpg`), Buffer.from(frames[fi].data, 'base64'));
}

mkdirSync(join(root, 'assets/video'), { recursive: true });
const mp4 = join(root, 'assets/video', `${name}.mp4`);
const poster = join(root, 'assets/img', `${name}-poster.jpg`);
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(tmp, 'f%05d.jpg'),
  '-vf', 'scale=1280:-2:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4]);
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', join(tmp, 'f00000.jpg'), '-vf', 'scale=1280:-2:flags=lanczos', '-q:v', '3', poster]);
rmSync(tmp, { recursive: true, force: true });
try { rmSync(profile, { recursive: true, force: true }); } catch {}
console.log(`${n} frames (${total.toFixed(1)} s) from ${frames.length} captured → ${mp4}`);
