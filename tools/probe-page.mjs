// Prints what a page offers for a recording: height, sections and clickable navigation, plus a screenshot.
// Usage: node tools/probe-page.mjs <url> [screenshot.png]
import { writeFileSync } from 'node:fs';
import { launch } from './lib/cdp.mjs';

const [url, shot] = process.argv.slice(2);
const b = await launch();
try {
  await b.goto(url, 2500);
  const info = await b.evaluate(`(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const label = (el) => (el.innerText || el.getAttribute('aria-label') || el.title || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
    const sel = (el) => el.id ? '#' + el.id : el.tagName.toLowerCase() + [...el.classList].slice(0, 2).map((c) => '.' + c).join('') + [...el.attributes].filter((a) => a.name.startsWith('data-')).slice(0, 1).map((a) => '[' + a.name + '="' + a.value + '"]').join('');
    return {
      title: document.title, location: location.href,
      height: document.documentElement.scrollHeight, viewport: innerHeight,
      sections: [...document.querySelectorAll('section, footer, main > div')].filter(vis).slice(0, 20).map((s) => [sel(s), Math.round(s.getBoundingClientRect().top + scrollY), Math.round(s.getBoundingClientRect().height)]),
      clickables: [...document.querySelectorAll('a, button, [role=tab], [data-view], [data-tab]')].filter(vis).slice(0, 80).map((el) => [sel(el), label(el)]).filter(([, t]) => t),
    };
  })()`);
  console.log(JSON.stringify(info, null, 1));
  if (shot) {
    const { data } = await b.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(shot, Buffer.from(data, 'base64'));
  }
} finally {
  await b.close();
}
