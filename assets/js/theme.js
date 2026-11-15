// Light or dark, decided before the first paint so the page never flashes the wrong one (loaded in <head> on every page).
// The system's setting is followed until the visitor picks the other theme on the key in the header;
// picking the system's own theme again goes back to following it.
(() => {
  const KEY = 'theme';
  const root = document.documentElement;
  const EN = root.lang.startsWith('en');
  const sys = window.matchMedia('(prefers-color-scheme: dark)');
  const sysTheme = () => (sys.matches ? 'dark' : 'light');
  const stored = () => { try { const v = localStorage.getItem(KEY); return v === 'dark' || v === 'light' ? v : null; } catch { return null; } };
  let choice = stored();
  let btn = null;

  const apply = () => {
    const theme = choice || sysTheme();
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#181817' : '#ebebe8');
    if (btn) {
      const to = theme === 'dark'
        ? (EN ? 'Switch to the light theme' : 'Mudar para o tema claro')
        : (EN ? 'Switch to the dark theme' : 'Mudar para o tema escuro');
      btn.setAttribute('aria-label', to);
      btn.title = to;
    }
    document.dispatchEvent(new CustomEvent('themechange')); // the halftone repaints in the new ink (site.js)
  };
  apply();

  sys.addEventListener('change', apply);
  window.addEventListener('storage', (e) => { if (e.key === KEY) { choice = stored(); apply(); } }); // changed in another tab

  document.addEventListener('DOMContentLoaded', () => {
    const lang = document.querySelector('.nav .lang');
    if (!lang) return;
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme';
    btn.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 2a8 8 0 0 1 0 16z" fill="currentColor"/></svg>';
    const item = lang.closest('li');
    if (item) {
      const li = document.createElement('li');
      li.className = 'nav__theme';
      li.append(btn);
      item.after(li);
    } else lang.after(btn);
    apply();

    btn.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      choice = next === sysTheme() ? null : next;
      try { if (choice) localStorage.setItem(KEY, choice); else localStorage.removeItem(KEY); } catch {}
      // The two themes cross-fade where the browser can do it.
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (document.startViewTransition && !calm) document.startViewTransition(apply); else apply();
    });
  });
})();
