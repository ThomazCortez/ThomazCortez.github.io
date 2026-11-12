// PT / EN switch without the jump: the two pages cross-fade (cross-document View Transitions),
// the filled pill slides to the other language, and the new page opens where you were reading.
// Loaded in <head> so it is listening before the new page is first shown.
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
