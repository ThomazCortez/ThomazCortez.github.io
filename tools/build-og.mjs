// Renders the cover a shared link shows, one per language, from tools/og.html.
//
// Usage: node tools/build-og.mjs
// Needs Brave or Chrome (BROWSER_PATH). Writes assets/img/og-pt.jpg and assets/img/og-en.jpg.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch } from './lib/cdp.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const page = pathToFileURL(join(here, 'og.html')).href;
const b = await launch({ width: 1200, height: 630, port: 9334 });
try {
  for (const lang of ['pt', 'en']) {
    await b.goto(`${page}?lang=${lang}`, 300);
    await b.evaluate('document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))');
    const { data } = await b.send('Page.captureScreenshot', { format: 'jpeg', quality: 86 });
    const out = join(here, '..', 'assets/img', `og-${lang}.jpg`);
    writeFileSync(out, Buffer.from(data, 'base64'));
    console.log(out);
  }
} finally {
  await b.close();
}
