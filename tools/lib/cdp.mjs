// A tiny Chrome DevTools Protocol client for headless Brave or Chrome. No dependencies.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function findBrowser() {
  const path = process.env.BROWSER_PATH || [
    join(process.env.LOCALAPPDATA || '', 'BraveSoftware/Brave-Browser/Application/brave.exe'),
    'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ].find(existsSync);
  if (!path) throw new Error('No Brave or Chrome found. Set BROWSER_PATH.');
  return path;
}

export async function launch({ width = 1440, height = 900, port = 9333 } = {}) {
  const profile = mkdtempSync(join(tmpdir(), 'rec-'));
  const proc = spawn(findBrowser(), [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`, '--hide-scrollbars', '--mute-audio', '--no-first-run', '--no-default-browser-check', 'about:blank',
  ], { stdio: 'ignore' });

  let target;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(200);
    try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch {}
  }
  if (!target) { proc.kill(); throw new Error('Browser did not start.'); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let seq = 0;
  const pending = new Map(), listeners = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
    else if (m.method) (listeners.get(m.method) || []).forEach((f) => f(m.params));
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
  const on = (method, f) => { listeners.set(method, [...(listeners.get(method) || []), f]); return () => listeners.set(method, listeners.get(method).filter((g) => g !== f)); };
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error('Page script failed: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });

  async function goto(url, settle = 1500) {
    const loaded = new Promise((r) => { const off = on('Page.loadEventFired', () => { off(); r(); }); });
    await send('Page.navigate', { url });
    await Promise.race([loaded, sleep(20000)]);
    await sleep(settle);
  }

  async function close() {
    try { ws.close(); } catch {}
    proc.kill();
    await sleep(300);
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  }

  return { send, on, evaluate, goto, close };
}
