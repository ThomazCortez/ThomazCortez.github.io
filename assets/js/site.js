// Portefólio: números em pontos, entradas e copiar email.
document.documentElement.classList.add('js');

// The page's language picks the strings below; the English pages live under en/.
const EN = document.documentElement.lang.startsWith('en');
const T = EN
  ? { locale: 'en-GB', copy: 'Copy', copied: 'Copied', copiedNote: 'The email is on your clipboard.', failed: (a) => "Couldn't copy it. The address is " + a + '.' }
  : { locale: 'pt-PT', copy: 'Copiar', copied: 'Copiado', copiedNote: 'O email está na área de transferência.', failed: (a) => 'Não foi possível copiar. O endereço é ' + a + '.' };

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

/* ---------- Em números: dot-matrix widgets on a phone, Nothing style ----------
   Each figure is drawn on a 5×7 dot grid. The unlit dots stay visible, like on the phone's display.
   They count up once the panel is on screen, and every few seconds a red scan runs across one of them. */
const DIGITS = {
  0: ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
  1: ['..X..', '.XX..', '..X..', '..X..', '..X..', '..X..', '.XXX.'],
  2: ['.XXX.', 'X...X', '....X', '...X.', '..X..', '.X...', 'XXXXX'],
  3: ['XXXXX', '...X.', '..X..', '...X.', '....X', 'X...X', '.XXX.'],
  4: ['...X.', '..XX.', '.X.X.', 'X..X.', 'XXXXX', '...X.', '...X.'],
  5: ['XXXXX', 'X....', 'XXXX.', '....X', '....X', 'X...X', '.XXX.'],
  6: ['..XX.', '.X...', 'X....', 'XXXX.', 'X...X', 'X...X', '.XXX.'],
  7: ['XXXXX', '....X', '...X.', '..X..', '.X...', '.X...', '.X...'],
  8: ['.XXX.', 'X...X', 'X...X', '.XXX.', 'X...X', 'X...X', '.XXX.'],
  9: ['.XXX.', 'X...X', 'X...X', '.XXXX', '....X', '...X.', '.XX..'],
  ',': ['..', '..', '..', '..', '.R', '.R', 'R.'],
  '.': ['.', '.', '.', '.', '.', '.', 'R'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
};

function buildStat(el) {
  const target = el.dataset.value;             // "18,7", "18.7" or "879"
  const sep = target.match(/[,.]/)?.[0];
  const decimals = sep ? target.split(sep)[1].length : 0;
  const end = Number(target.replace(sep, ''));  // 187 or 879
  const s = 10;
  const glyphs = [...target].map((c) => DIGITS[c]);
  const width = glyphs.reduce((w, g) => w + g[0].length + 1, -1);

  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width * s} ${7 * s}`);
  svg.setAttribute('aria-hidden', 'true');
  const cells = []; // one entry per character: its rows of circles
  let x = 0;
  glyphs.forEach((g) => {
    const cols = g[0].length;
    const rows = g.map((_, r) => Array.from({ length: cols }, (_, c) => {
      const dot = document.createElementNS(SVG, 'circle');
      dot.setAttribute('cx', (x + c) * s + s / 2);
      dot.setAttribute('cy', r * s + s / 2);
      dot.setAttribute('r', 3.6);
      dot.dataset.col = x + c;
      svg.appendChild(dot);
      return dot;
    }));
    cells.push(rows);
    x += cols + 1;
  });
  el.appendChild(svg);
  const dots = [...svg.querySelectorAll('circle')];

  // Writes a number into the grid, right-aligned; leading places stay dark.
  function paint(n) {
    let txt = String(n).padStart(decimals + 1, '0');
    if (decimals) txt = txt.slice(0, -decimals) + sep + txt.slice(-decimals);
    txt = txt.padStart(target.length, ' ');
    [...txt].forEach((ch, i) => {
      const g = DIGITS[ch];
      cells[i].forEach((row, r) => row.forEach((dot, c) => {
        const v = g[r][c];
        dot.classList.toggle('on', v === 'X');
        dot.classList.toggle('red', v === 'R');
      }));
    });
  }

  function count(delay) {
    const dur = 1300;
    const t0 = performance.now() + delay;
    // Driven by the clock, not by frames, so it always lands on the real figure.
    const step = () => {
      const p = Math.min(1, Math.max(0, (performance.now() - t0) / dur));
      paint(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) setTimeout(step, 16);
    };
    step();
  }

  // A red line sweeps across the figure, left to right.
  function scan() {
    for (let c = 0; c < width; c++) {
      setTimeout(() => {
        const col = dots.filter((d) => +d.dataset.col === c);
        col.forEach((d) => d.classList.add('hot'));
        setTimeout(() => col.forEach((d) => d.classList.remove('hot')), 160);
      }, c * 28);
    }
  }

  paint(reduceMotion ? end : 0);
  return { count, scan, el };
}

(() => {
  const panel = document.querySelector('.stats');
  if (!panel) return;
  const stats = [...panel.querySelectorAll('[data-value]')].map(buildStat);

  // The phone's lock screen shows the visitor's own time and date.
  const clock = document.querySelector('[data-clock]');
  const date = document.querySelector('[data-date]');
  const tick = () => {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString(T.locale, { hour: '2-digit', minute: '2-digit' });
    if (date) date.textContent = now.toLocaleDateString(T.locale, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');
  };
  if (clock) { tick(); setInterval(tick, 15000); }
  if (reduceMotion) return;

  let started = false;
  const root = document.documentElement;
  const go = () => {
    if (started || root.classList.contains('booting')) return;
    started = true;
    stats.forEach((st, i) => st.count(i * 110));
    // Afterwards, now and then, one figure gets scanned.
    setInterval(() => {
      if (document.hidden) return;
      stats[Math.floor(Math.random() * stats.length)].scan();
    }, 3800);
  };

  let visible = false;
  new MutationObserver(() => visible && go()).observe(root, { attributes: true, attributeFilter: ['class'] });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) go(); }, { threshold: 0.3 }).observe(panel);
  } else { visible = true; go(); }
})();

/* ---------- The phone as a 3D object ----------
   The body is a stack of thin slabs behind the front face, so the rounded sides have real depth,
   closed by two flat walls and a back plate. It rests turned towards the text, leans a little with
   the pointer, faces the reader when pointed at, and can be dragged all the way round. */
(() => {
  const phone = document.querySelector('.phone');
  if (!phone || !CSS.supports('transform-style', 'preserve-3d')) return;

  const SLABS = 16, GAP = 2; // 32px deep
  const el = (tag, cls) => { const n = document.createElement(tag); n.className = cls; n.setAttribute('aria-hidden', 'true'); return n; };

  const back = el('div', 'phone__back');
  back.innerHTML = '<div class="phone__plate">'
    + '<div class="phone__cams"><i class="phone__lens"></i><i class="phone__lens"></i></div><i class="phone__flash"></i>'
    + '<div class="phone__glyph"></div>'
    + '<p class="phone__mark">thomaz<i>.</i></p><p class="phone__fine">HTML · CSS · JS</p></div>';
  back.querySelector('.phone__glyph').append(drawGlyph('monogram', { pad: 2 }));
  back.style.transform = `translateZ(${-(SLABS * GAP + 1)}px) rotateY(180deg)`;
  phone.prepend(back, el('i', 'phone__wall'), el('i', 'phone__wall phone__wall--right'));

  for (let i = SLABS; i >= 1; i--) {
    const t = (i - 1) / (SLABS - 1);            // 0 at the front, 1 at the back
    const l = 60 - 30 * t + 16 * Math.exp(-(((t - 0.22) / 0.1) ** 2)); // a highlight runs along the rail
    const slab = el('i', 'phone__slab' + (i >= 6 && i <= 11 ? ' phone__slab--keys' : ''));
    slab.style.transform = `translateZ(${-i * GAP}px)`;
    slab.style.background = `linear-gradient(180deg, hsl(60 3% ${l + 9}%), hsl(60 3% ${l}%) 30%, hsl(60 3% ${l - 12}%))`;
    phone.prepend(slab);
  }

  // The stage holds what does not turn with the phone: its shadow and the hint.
  const stage = el('div', 'phone-stage');
  stage.removeAttribute('aria-hidden');
  phone.before(stage);
  stage.append(el('i', 'phone__shadow'), phone);
  phone.classList.add('is-3d');
  if (reduceMotion) return;

  const hint = el('p', 'phone__hint');
  hint.textContent = EN ? 'Drag to turn it around' : 'Arrasta para o rodar';
  stage.append(hint);

  const REST = { x: 5, y: -24 }, FACING = { x: 2, y: -7 };
  const cur = { ...REST }, goal = { ...REST };
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  let over = false, held = false, drag = null, px = 0, py = 0, raf = 0, timer = 0;

  const aim = () => {
    if (!drag && !held) {
      const base = over ? FACING : REST;
      const turns = Math.round((cur.y - base.y) / 360) * 360; // come back the short way round
      goal.y = turns + base.y + px * 7;
      goal.x = base.x - py * 5;
    }
    if (!raf) raf = requestAnimationFrame(step);
  };
  const step = () => {
    const k = drag ? 0.3 : 0.09;
    cur.x += (goal.x - cur.x) * k;
    cur.y += (goal.y - cur.y) * k;
    phone.style.setProperty('--rx', cur.x.toFixed(2) + 'deg');
    phone.style.setProperty('--ry', cur.y.toFixed(2) + 'deg');
    phone.style.setProperty('--glare', (clamp(cur.y - REST.y, -40, 40) * 1.6).toFixed(1) + '%');
    stage.style.setProperty('--sw', (0.25 + 0.67 * Math.abs(Math.cos(cur.y * Math.PI / 180))).toFixed(3));
    const settled = Math.abs(goal.x - cur.x) < 0.02 && Math.abs(goal.y - cur.y) < 0.02;
    raf = settled ? 0 : requestAnimationFrame(step);
  };

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || drag) return;
    px = (e.clientX / window.innerWidth - 0.5) * 2;
    py = (e.clientY / window.innerHeight - 0.5) * 2;
    aim();
  }, { passive: true });
  phone.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { over = true; aim(); } });
  phone.addEventListener('pointerleave', () => { over = false; aim(); });

  // Dragging turns it freely; a few seconds after letting go it settles back.
  phone.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, ry: cur.y, rx: cur.x, lastX: e.clientX, lastT: e.timeStamp, v: 0 };
    goal.x = cur.x; goal.y = cur.y;
    clearTimeout(timer);
    phone.setPointerCapture(e.pointerId);
    phone.classList.add('is-dragging');
    hint.classList.add('is-used');
  });
  phone.addEventListener('pointermove', (e) => {
    if (!drag) return;
    goal.y = drag.ry + (e.clientX - drag.x) * 0.6;
    goal.x = clamp(drag.rx - (e.clientY - drag.y) * 0.25, -18, 22);
    const dt = e.timeStamp - drag.lastT;
    if (dt > 0) { drag.v = (e.clientX - drag.lastX) / dt; drag.lastX = e.clientX; drag.lastT = e.timeStamp; }
    aim();
  });
  const release = (e) => {
    if (!drag) return;
    if (e.timeStamp - drag.lastT < 80) goal.y += clamp(drag.v * 90, -200, 200); // a flick carries on a little
    drag = null; held = true;
    phone.classList.remove('is-dragging');
    aim();
    timer = setTimeout(() => { held = false; aim(); }, 3500);
  };
  phone.addEventListener('pointerup', release);
  phone.addEventListener('pointercancel', release);
})();

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
document.querySelectorAll('.work__shot video, .p-bare video').forEach((v) => {
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

  root.querySelector('.carousel__arrow--prev')?.addEventListener('click', () => go(index - 1));
  root.querySelector('.carousel__arrow--next')?.addEventListener('click', () => go(index + 1));
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
      btn.textContent = T.copied;
      if (note) note.textContent = T.copiedNote;
    } catch {
      if (note) note.textContent = T.failed(btn.dataset.copy);
    }
    setTimeout(() => { btn.textContent = T.copy; }, 2400);
  });
});
