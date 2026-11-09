// Portefólio: matriz de atividade, entradas e copiar email.
document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SVG = 'http://www.w3.org/2000/svg';

/* ---------- Dot drawings (X = on, R = accent, . = off) ---------- */
const GLYPHS = {
  paw: [
    '...XX...XX...',
    '..XXXX.XXXX..',
    '..XXXX.XXXX..',
    '...XX...XX...',
    'XX.........XX',
    'XXX.......XXX',
    '.XX..XXX..XX.',
    '....XXXXX....',
    '...XXXRXXX...',
    '..XXXXXXXXX..',
    '..XXXXXXXXX..',
    '...XXX.XXX...',
  ],
  lock: [
    '...XXXXX...',
    '..XX...XX..',
    '.XX.....XX.',
    '.XX.....XX.',
    '.XX.....XX.',
    'XXXXXXXXXXX',
    'XXXXXXXXXXX',
    'XXXXXRXXXXX',
    'XXXXRRRXXXX',
    'XXXXXRXXXXX',
    'XXXXXRXXXXX',
    'XXXXXXXXXXX',
    'XXXXXXXXXXX',
  ],
  receipt: [
    'XXXXXXXXXXX',
    'X.........X',
    'X.XXXX.XX.X',
    'X.........X',
    'X.XXXXX.X.X',
    'X.........X',
    'X.XXX..XX.X',
    'X.........X',
    'X.XXXXXXX.X',
    'X.........X',
    'X.RRRR.RR.X',
    'X.........X',
    'X.X.X.X.X.X',
    '.X.X.X.X.X.',
  ],
  prompt: [
    '...............',
    '.X.............',
    '..X............',
    '...X...........',
    '..X............',
    '.X.....RRRRR...',
    '...............',
  ],
  monogram: [
    'XXXXXX..XXXXX..',
    '..XX....XX..XX.',
    '..XX....XX..XX.',
    '..XX....XXXXX..',
    '..XX....XX..XX.',
    '..XX....XX..XX.',
    '..XX....XXXXX.R',
  ],
};

function drawGlyph(name, { pad = 1 } = {}) {
  const rows = GLYPHS[name];
  const w = rows[0].length + pad * 2, h = rows.length + pad * 2, s = 10;
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', `0 0 ${w * s} ${h * s}`);
  svg.setAttribute('aria-hidden', 'true');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y - pad]?.[x - pad] ?? '.';
      const c = document.createElementNS(SVG, 'circle');
      c.setAttribute('cx', x * s + s / 2);
      c.setAttribute('cy', y * s + s / 2);
      c.setAttribute('r', ch === '.' ? 2.6 : 3.8);
      c.setAttribute('fill', ch === 'R' ? '#d71921' : ch === 'X' ? '#f2f1ec' : '#202020');
      svg.appendChild(c);
    }
  }
  return svg;
}

document.querySelectorAll('[data-glyph]').forEach((el) => el.prepend(drawGlyph(el.dataset.glyph)));

/* ---------- Activity matrix ---------- */
function buildMatrix(root) {
  const data = window.ACTIVITY;
  if (!data) return;
  const counts = data.counts;
  const start = new Date(data.start + 'T12:00:00');
  const offset = (start.getDay() + 6) % 7; // Monday first
  const weeks = Math.ceil((counts.length + offset) / 7);
  const s = 12;
  const grid = root.querySelector('.matrix__grid');
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', `0 0 ${weeks * s} ${7 * s}`);
  svg.setAttribute('aria-hidden', 'true');
  const dots = counts.map((n, i) => {
    const k = i + offset;
    const c = document.createElementNS(SVG, 'circle');
    c.setAttribute('cx', Math.floor(k / 7) * s + s / 2);
    c.setAttribute('cy', (k % 7) * s + s / 2);
    c.setAttribute('r', 3.9);
    c.setAttribute('class', n === 0 ? '' : n < 3 ? 'l1' : n < 7 ? 'l2' : 'l3');
    svg.appendChild(c);
    return c;
  });
  grid.appendChild(svg);

  const total = counts.reduce((a, b) => a + b, 0);
  root.querySelector('[data-total]').textContent = total;

  const fmt = new Intl.DateTimeFormat('pt-PT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const readout = root.querySelector('.matrix__readout');
  const range = root.querySelector('input[type=range]');
  range.max = counts.length - 1;
  let current = -1;

  function show(i) {
    if (i === current) return;
    if (current >= 0) dots[current].classList.remove('is-on');
    current = i;
    dots[i].classList.add('is-on');
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const iso = day.toISOString().slice(0, 10);
    const n = counts[i];
    const repos = data.repos[iso];
    readout.innerHTML = '';
    readout.append(`${fmt.format(day)}: ${n === 0 ? 'sem contribuições' : n === 1 ? '1 contribuição' : n + ' contribuições'}`);
    if (repos?.length) {
      const span = document.createElement('span');
      span.textContent = ' em ' + repos.join(', ');
      readout.append(span);
    }
    range.value = i;
  }

  const busiest = counts.indexOf(Math.max(...counts));
  show(busiest);
  range.addEventListener('input', () => show(+range.value));

  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect();
    const col = Math.floor(((e.clientX - r.left) / r.width) * weeks);
    const row = Math.floor(((e.clientY - r.top) / r.height) * 7);
    if (col < 0 || row < 0 || row > 6 || col >= weeks) return;
    const i = col * 7 + row - offset;
    if (i >= 0 && i < counts.length) show(i);
  });
}

document.querySelectorAll('.matrix').forEach(buildMatrix);

/* ---------- From the hero straight to the projects ----------
   On a wide screen, the first nudge downwards from the very top glides to "Projetos web",
   so the space under the hero is never seen half-scrolled. Everything after that scrolls normally. */
(() => {
  const target = document.getElementById('projetos');
  const wide = window.matchMedia('(min-width: 861px)');
  if (!target) return;
  let gliding = false;
  const atTop = () => window.scrollY < 8;
  function glide() {
    gliding = true;
    const y = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    setTimeout(() => { gliding = false; }, 900);
  }
  window.addEventListener('wheel', (e) => {
    if (!wide.matches) return;
    if (gliding) { e.preventDefault(); return; }
    if (e.deltaY > 0 && atTop()) { e.preventDefault(); glide(); }
  }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (!wide.matches || !atTop() || e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (['ArrowDown', 'PageDown', ' '].includes(e.key) && !e.shiftKey) { e.preventDefault(); glide(); }
  });
})();

/* ---------- Project videos play only while on screen, and never when motion is unwelcome ---------- */
document.querySelectorAll('.work__shot video').forEach((v) => {
  if (reduceMotion || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
  }, { threshold: 0.35 }).observe(v);
});

/* ---------- Carousel: arrows, dots, swipe and a gentle auto-advance ----------
   A slide with a video stays until the video ends; a picture stays for a few seconds.
   It waits while the pointer or focus is on it, or while it is off screen, and never moves by itself when motion is unwelcome. */
document.querySelectorAll('[data-carousel]').forEach((root) => {
  const track = root.querySelector('.carousel__track');
  const slides = [...track.children];
  const dots = [...root.querySelectorAll('.carousel__dot')];
  const STILL = 7000;
  let index = 0, timer = 0, inView = false, held = false;

  const videoOf = (i) => slides[i].querySelector('video');

  function schedule() {
    clearTimeout(timer);
    if (reduceMotion || !inView) return;
    const v = videoOf(index);
    if (v) { v.play().catch(() => {}); return; }
    timer = setTimeout(() => (held ? schedule() : go(index + 1)), STILL);
  }

  function go(n) {
    index = (n + slides.length) % slides.length;
    track.style.transform = `translateX(${-100 * index}%)`;
    slides.forEach((s, i) => { const on = i === index; s.inert = !on; s.setAttribute('aria-hidden', String(!on)); });
    dots.forEach((d, i) => d.setAttribute('aria-current', String(i === index)));
    slides.forEach((s, i) => { const v = videoOf(i); if (v && i !== index) { v.pause(); v.currentTime = 0; } });
    schedule();
  }

  slides.forEach((s, i) => {
    const v = videoOf(i);
    if (v) v.addEventListener('ended', () => { if (held || !inView) { v.currentTime = 0; v.play().catch(() => {}); } else go(index + 1); });
  });

  root.querySelector('.carousel__arrow--prev').addEventListener('click', () => go(index - 1));
  root.querySelector('.carousel__arrow--next').addEventListener('click', () => go(index + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
  });
  root.addEventListener('pointerenter', () => { held = true; });
  root.addEventListener('pointerleave', () => { held = false; });
  root.addEventListener('focusin', () => { held = true; });
  root.addEventListener('focusout', () => { held = false; });

  // Swipe on touch screens.
  let x0 = null;
  const viewport = root.querySelector('.carousel__viewport');
  viewport.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') x0 = e.clientX; });
  viewport.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) schedule();
      else { clearTimeout(timer); const v = videoOf(index); if (v) v.pause(); }
    }, { threshold: 0.4 }).observe(root);
  }
  go(0);
});

/* ---------- Entrances ---------- */
const revealables = document.querySelectorAll('[data-reveal]');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealables.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  revealables.forEach((el) => io.observe(el));
}

/* ---------- Copy email ---------- */
document.querySelectorAll('[data-copy]').forEach((btn) => {
  const note = document.getElementById(btn.getAttribute('aria-describedby'));
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = 'Copiado';
      if (note) note.textContent = 'O email está na área de transferência.';
    } catch {
      if (note) note.textContent = 'Não foi possível copiar. O endereço é ' + btn.dataset.copy + '.';
    }
    setTimeout(() => { btn.textContent = 'Copiar'; }, 2400);
  });
});
