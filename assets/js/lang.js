// PT / EN switch without the jump: the two pages cross-fade (cross-document View Transitions),
// the filled pill slides to the other language, and the new page opens where you were reading.
// Loaded in <head> so it is listening before the new page is first shown.
// First arrival from outside the site: pick the language for the visitor.
// A choice made on the PT / EN switch always wins; without one, a browser that
// doesn't speak Portuguese is sent to the English page. Moving around the site never redirects.
(() => {
  const root = document.documentElement;
  const here = root.lang.startsWith('en') ? 'en' : 'pt';
  const other = here === 'en' ? 'pt' : 'en';
  let choice = null;
  try { choice = localStorage.getItem('lang-choice'); } catch {}
  let internal = false;
  try { internal = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch {}
  if (internal || choice === here) return;
  const speaksPt = (navigator.languages?.length ? navigator.languages : [navigator.language || '']).some((l) => /^pt\b/i.test(l));
  const go = choice === other || (!choice && here === 'pt' && !speaksPt);
  const alt = document.querySelector(`link[rel="alternate"][hreflang="${other}"]`);
  if (!go || !alt) return;
  root.classList.add('lang-redirect'); // hides the page and stops the boot screen (boot.js)
  location.replace(alt.href + location.hash);
})();

(() => {
  const KEY = 'lang-switch';
  const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch { return null; } };
  const clear = () => { try { sessionStorage.removeItem(KEY); } catch {} };

  // Arriving from the other language: no entrances, the page shows up as it already was.
  const root = document.documentElement;
  if (read()) root.classList.add('lang-arrive');
  const settle = () => {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('lang-arrive')));
  };

  // Where am I? The last element with an id that starts above the top of the screen, and how far into it.
  function where() {
    let best = null;
    for (const el of document.querySelectorAll('main [id], body > div [id], footer')) {
      const r = el.getBoundingClientRect();
      if (r.top <= 1 && r.height > 0 && (!best || r.top >= best.top)) best = { id: el.id, top: r.top, h: r.height, tag: el.tagName };
    }
    if (!best || window.scrollY < 8) return { y: 0 };
    return { id: best.id, tag: best.tag, f: -best.top / best.h };
  }

  function restore(pos) {
    if (!pos) return;
    const el = pos.id ? document.getElementById(pos.id) : pos.tag === 'FOOTER' ? document.querySelector('footer') : null;
    let y = 0;
    if (el) { const r = el.getBoundingClientRect(); y = r.top + window.scrollY + pos.f * r.height; }
    window.scrollTo({ top: y, behavior: 'instant' });
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('.lang a');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    try { sessionStorage.setItem(KEY, JSON.stringify(where())); } catch {}
    // Remember the choice, so the next visit opens in this language.
    try { if (a.hreflang) localStorage.setItem('lang-choice', a.hreflang); } catch {}
  });

  // Only the language switch animates; every other link keeps loading as before.
  window.addEventListener('pageswap', (e) => {
    if (e.viewTransition && !read()) e.viewTransition.skipTransition();
  });

  if ('onpagereveal' in window) {
    window.addEventListener('pagereveal', (e) => {
      const pos = read();
      clear();
      if (!pos) { e.viewTransition?.skipTransition(); return; }
      settle();
      restore(pos);
    });
  } else {
    // No View Transitions (Firefox for now): a plain load, but still at the same place.
    const pos = read();
    if (pos) { clear(); document.addEventListener('DOMContentLoaded', () => { settle(); restore(pos); }); }
  }
})();
