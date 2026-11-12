// First visit of the session: a short boot screen in the style of the Nothing dot display.
// A greeting for the time of day, then a row of dots that fills while the page loads.
// Loaded in <head> so the cover is there from the first paint; skipped on every later page.
(() => {
  const KEY = 'booted';
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (root.classList.contains('lang-redirect')) return; // leaving for the other language (lang.js)
  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; sessionStorage.setItem(KEY, '1'); } catch {}
  if (seen) return;
  root.classList.add('booting');

  const EN = root.lang.startsWith('en');
  const h = new Date().getHours();
  const hi = EN
    ? (h >= 5 && h < 12 ? 'Good morning' : h >= 12 && h < 19 ? 'Good afternoon' : 'Good evening')
    : (h >= 6 && h < 13 ? 'Bom dia' : h >= 13 && h < 20 ? 'Boa tarde' : 'Boa noite');

  const DOTS = 12;
  const MIN = reduce ? 700 : 1700; // long enough to read, short enough not to annoy
  const MAX = 4000;                // never hold the page hostage on a slow network
  const start = performance.now();
  let loaded = document.readyState === 'complete';
  window.addEventListener('load', () => { loaded = true; }, { once: true });

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.createElement('div');
    el.className = 'boot';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<p class="boot__hi"></p><div class="boot__dots"></div>';
    const greet = el.firstChild;
    [...hi].forEach((c, i) => {
      const s = document.createElement('span');
      s.textContent = c;
      s.style.setProperty('--i', i);
      greet.append(s);
    });
    const dot = document.createElement('i');
    dot.textContent = '.';
    dot.style.setProperty('--i', hi.length);
    greet.append(dot);
    const row = el.lastChild;
    const dots = Array.from({ length: DOTS }, () => row.appendChild(document.createElement('span')));
    document.body.prepend(el);

    // Wait for Doto so the greeting appears in dots, not in the fallback face.
    const fontReady = document.fonts?.load('900 1em Doto') ?? Promise.resolve();
    Promise.race([fontReady, new Promise((r) => setTimeout(r, 700))]).then(() => el.classList.add('is-on'));

    let lit = 0, done = false;
    const finish = () => {
      if (done) return;
      done = true;
      dots.forEach((d) => d.classList.add('on'));
      dots[DOTS - 1].classList.add('red');
      setTimeout(() => {
        el.classList.add('is-out');
        root.classList.remove('booting');
        setTimeout(() => el.remove(), 1500);
      }, reduce ? 150 : 380);
    };

    const tick = () => {
      if (done) return;
      const t = performance.now() - start;
      // Time drives the bar; until the page has loaded it stops one short of full.
      let p = Math.min(1, t / MIN);
      if (!loaded) p = Math.min(p, (DOTS - 1) / DOTS);
      const n = Math.floor(p * DOTS);
      while (lit < n) dots[lit++].classList.add('on');
      if ((p >= 1 && loaded) || t > MAX) finish();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // Impatient? Any click or key lets you straight in.
    const skip = () => finish();
    el.addEventListener('click', skip);
    window.addEventListener('keydown', skip, { once: true });
  });
})();
