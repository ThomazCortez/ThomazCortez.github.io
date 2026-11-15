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

  // 32px deep either way. Every slab is a full-size layer, and on a phone's dense screen 32 of them ran past the
  // graphics memory Android allows, so whole bands of the screen went undrawn; touch screens get 8 thicker ones.
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const SLABS = coarse ? 8 : 32, GAP = 32 / SLABS;
  // One titanium tone for the whole rail, by depth (0 at the front, 1 at the back): a flat band between two bright bevels.
  const shade = (t, dim = 1) => {
    const bevel = Math.max(Math.exp(-((t / 0.07) ** 2)), Math.exp(-(((1 - t) / 0.07) ** 2)));
    return `hsl(220 4% ${((44 + 4 * Math.sin(t * Math.PI) + 22 * bevel) * dim).toFixed(1)}%)`;
  };
  const el = (tag, cls) => { const n = document.createElement(tag); n.className = cls; n.setAttribute('aria-hidden', 'true'); return n; };

  const back = el('div', 'phone__back');
  back.innerHTML = '<div class="phone__plate">'
    + '<i class="phone__flash"></i>'
    + '<div class="phone__glyph"></div>'
    + '<p class="phone__mark">thomaz<i>.</i></p><p class="phone__fine">HTML · CSS · JS</p></div>';
  back.querySelector('.phone__glyph').append(drawGlyph('monogram', { pad: 2 }));
  back.style.transform = `translateZ(${-(SLABS * GAP + 1)}px) rotateY(180deg)`;
  // The camera island (5px high) and the two lens barrels on top of it (5px more), one layer per pixel.
  const cam = el('div', 'phone__island');
  const layer = (cls, z) => { const n = el('i', cls); n.style.transform = `translateZ(${z}px)`; cam.append(n); };
  for (let z = 1; z <= 5; z++) layer('phone__bump' + (z === 5 ? ' phone__bump--top' : ''), z);
  ['a', 'b'].forEach((side) => {
    for (let z = 6; z <= 10; z++) layer(`phone__lens phone__lens--${side}` + (z === 10 ? ' phone__lens--glass' : ''), z);
  });
  back.append(cam);

  const walls = [el('i', 'phone__wall'), el('i', 'phone__wall phone__wall--right')];
  const rail = `linear-gradient(90deg, ${Array.from({ length: 17 }, (_, k) => shade(k / 16)).join(', ')})`;
  walls.forEach((w) => { w.style.background = rail; });
  // With only 8 slabs, the rounded corners and the top and bottom edges show the gaps between them when seen
  // edge-on, so on touch screens those are closed too: a flat wall along each, and 6 facets round each corner.
  if (coarse) {
    ['top', 'bottom'].forEach((side) => {
      const w = el('i', `phone__wall phone__wall--${side}`);
      w.style.background = rail.replace('90deg', '180deg');
      walls.push(w);
    });
    const R = 55, K = 6, rad = Math.PI / 180;
    [[180, '0px', '0px'], [270, '100%', '0px'], [0, '100%', '100%'], [90, '0px', '100%']].forEach(([from, x0, y0]) => {
      const cx = x0 === '0px' ? R : -R, cy = y0 === '0px' ? R : -R; // the corner's centre, from the edge it belongs to
      for (let k = 0; k < K; k++) {
        const a1 = (from + (90 * k) / K) * rad, a2 = (from + (90 * (k + 1)) / K) * rad;
        const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
        const x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
        const len = Math.hypot(x2 - x1, y2 - y1) + 1; // 1px of overlap so no seam shows between facets
        const f = el('i', 'phone__facet');
        f.style.left = `calc(${x0} + ${((x1 + x2) / 2).toFixed(2)}px)`;
        f.style.top = `calc(${y0} + ${((y1 + y2) / 2 - len / 2).toFixed(2)}px)`;
        f.style.height = `${len.toFixed(2)}px`;
        f.style.transform = `rotateZ(${Math.atan2(-(x2 - x1), y2 - y1).toFixed(4)}rad) rotateY(90deg)`;
        f.style.background = rail;
        walls.push(f);
      }
    });
  }
  phone.prepend(back, ...walls, el('i', 'phone__key'), el('i', 'phone__key phone__key--power'));

  for (let i = SLABS; i >= 1; i--) {
    const slab = el('i', 'phone__slab' + (i * GAP >= 12 && i * GAP <= 22 ? ' phone__slab--keys' : ''));
    slab.style.transform = `translateZ(${-i * GAP}px)`;
    slab.style.background = shade((i - 0.5) / SLABS);
    slab.style.setProperty('--key', shade((i - 0.5) / SLABS, 0.72));
    phone.prepend(slab);
  }

  // The stage holds what does not turn with the phone: its shadow and the hint.
  const stage = el('div', 'phone-stage');
  stage.removeAttribute('aria-hidden');
  phone.before(stage);
  const shadow = el('i', 'phone__shadow');
  const glare = el('i', 'phone__glare');
  phone.querySelector('.phone__screen')?.append(glare);
  stage.append(shadow, phone);
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
    // Written straight onto the three elements that move. As custom properties on the phone they
    // were inherited by its 700-odd children, and every pointer move restyled all of them.
    phone.style.transform = `perspective(1600px) rotateX(${cur.x.toFixed(2)}deg) rotateY(${cur.y.toFixed(2)}deg)`;
    glare.style.transform = `translateX(${(clamp(cur.y - REST.y, -40, 40) * 1.6).toFixed(1)}%)`;
    shadow.style.transform = `translate(-14px, 26px) scaleX(${(0.25 + 0.67 * Math.abs(Math.cos(cur.y * Math.PI / 180))).toFixed(3)})`;
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
    setTimeout(() => { gliding = false; arm(); }, 900);
  }
  // A wheel listener that may cancel makes every scroll wait for the script, so it is only
  // attached while the page sits at the top (or is gliding) and taken off for the rest of the page.
  const onWheel = (e) => {
    if (!wide.matches) return;
    if (gliding) { e.preventDefault(); return; }
    if (e.deltaY > 0 && atTop()) { e.preventDefault(); glide(); }
  };
  let armed = false;
  const arm = () => {
    const want = gliding || atTop();
    if (want === armed) return;
    armed = want;
    if (want) window.addEventListener('wheel', onWheel, { passive: false });
    else window.removeEventListener('wheel', onWheel);
  };
  window.addEventListener('scroll', arm, { passive: true });
  arm();
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

/* ---------- Halftone behind the phone, and behind the project on its own page: dots on a tilted grid, sized by slow diagonal waves ----------
   Drawn by a fragment shader, so a frame costs one draw call however many dots there are.
   The waves drift on their own and the dots swell a little under the pointer. */
document.querySelectorAll('.top__matrix, .p-stage').forEach((host) => {
  const canvas = document.createElement('canvas');
  canvas.className = 'halftone';
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);
  const STEP = 9;                       // grid pitch in CSS px
  const TILT = -14 * Math.PI / 180;     // grid rotation
  // The dots' colour follows the theme, so it is read again whenever the theme changes (theme.js).
  const ink = () => getComputedStyle(document.documentElement).getPropertyValue('--halftone').trim() || '#121212';
  let w = 0, h = 0, dpr = 1, ox = 0, oy = 0;

  const size = () => {
    const r = host.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    ox = r.left + window.scrollX; oy = r.top + window.scrollY;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  };

  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, failIfMajorPerformanceCaveat: true });
  if (!gl) {
    // No (fast) WebGL: one still frame on a 2D canvas, faded by a CSS mask.
    canvas.classList.add('halftone--flat');
    const ctx = canvas.getContext('2d');
    const cosT = Math.cos(TILT), sinT = Math.sin(TILT);
    const still = () => {
      size();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = ink();
      ctx.beginPath();
      const reach = Math.ceil((Math.hypot(w, h) / 2 + STEP) / STEP) * STEP, cx = w / 2, cy = h / 2;
      for (let v = -reach; v <= reach; v += STEP) {
        for (let u = -reach; u <= reach; u += STEP) {
          const x = cx + u * cosT - v * sinT, y = cy + u * sinT + v * cosT;
          if (x < -STEP || y < -STEP || x > w + STEP || y > h + STEP) continue;
          const f = 0.62 * Math.sin((x * 0.34 + y * 0.94) / 150 + 0.6) + 0.38 * Math.sin((x * 0.8 - y * 0.6) / 230 + 1.34);
          const k = Math.max(0, Math.min(1, 0.5 + 0.62 * f)), r = STEP * 0.5 * k * k;
          if (r < 0.45) continue;
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    };
    still();
    new ResizeObserver(still).observe(host);
    document.addEventListener('themechange', still);
    return;
  }

  const FRAG = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    uniform vec2 uSize;    // CSS px
    uniform float uDpr, uTime, uPull;
    uniform vec2 uMouse;   // CSS px, from the top left
    uniform vec3 uInk;
    const float STEP = ${STEP.toFixed(1)};
    const vec2 ROT = vec2(${Math.cos(TILT).toFixed(6)}, ${Math.sin(TILT).toFixed(6)});
    void main() {
      vec2 p = vec2(gl_FragCoord.x, uSize.y * uDpr - gl_FragCoord.y) / uDpr;
      vec2 d = p - uSize * 0.5;
      vec2 g = vec2(d.x * ROT.x + d.y * ROT.y, d.y * ROT.x - d.x * ROT.y);      // into the tilted grid
      vec2 cell = (floor(g / STEP) + 0.5) * STEP;
      vec2 q = uSize * 0.5 + vec2(cell.x * ROT.x - cell.y * ROT.y, cell.x * ROT.y + cell.y * ROT.x); // this dot's centre
      // Two crossing bands, like printed shading.
      float v = 0.62 * sin((q.x * 0.34 + q.y * 0.94) / 150.0 + uTime)
              + 0.38 * sin((q.x * 0.8 - q.y * 0.6) / 230.0 - uTime * 0.6 + 1.7);
      float f = 0.5 + 0.62 * v;
      vec2 m = q - uMouse;
      f = clamp(f + uPull * 0.55 * exp(-dot(m, m) / 16000.0), 0.0, 1.0);
      float r = STEP * 0.5 * f * f;
      float aa = 0.75 / uDpr;
      float a = smoothstep(r + aa, r - aa, length(g - cell)) * smoothstep(0.3, 0.7, r);
      a *= clamp(p.x / (uSize.x * 0.38), 0.0, 1.0);                             // fades out toward the hero text
      gl_FragColor = vec4(uInk * a, a);
    }`;
  const rgb = () => {
    const c = document.createElement('canvas').getContext('2d');
    c.fillStyle = ink(); c.fillRect(0, 0, 1, 1);
    return [...c.getImageData(0, 0, 1, 1).data].slice(0, 3).map((n) => n / 255);
  };

  let U = null;
  const setup = () => {
    const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }'));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.bindAttribLocation(prog, 0, 'a');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // one triangle over the whole canvas
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    U = Object.fromEntries(['uSize', 'uDpr', 'uTime', 'uPull', 'uMouse', 'uInk'].map((n) => [n, gl.getUniformLocation(prog, n)]));
    gl.uniform3fv(U.uInk, rgb());
    return true;
  };
  if (!setup()) { canvas.remove(); return; }

  const SPEED = 1 / 3200;               // radians of wave phase per millisecond
  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, pull: 0, want: 0 };
  let raf = 0, inView = true, now = 0.6 / SPEED;

  const draw = () => {
    if (!U) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.uSize, w, h);
    gl.uniform1f(U.uDpr, dpr);
    gl.uniform1f(U.uTime, now * SPEED);
    gl.uniform1f(U.uPull, mouse.pull);
    gl.uniform2f(U.uMouse, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const loop = (t) => {
    raf = 0;
    if (!inView) return;
    now = t;
    mouse.x += (mouse.tx - mouse.x) * 0.12;
    mouse.y += (mouse.ty - mouse.y) * 0.12;
    mouse.pull += (mouse.want - mouse.pull) * 0.06;
    draw();
    raf = requestAnimationFrame(loop);
  };
  const start = () => { if (!raf && !reduceMotion) raf = requestAnimationFrame(loop); };

  size(); draw();
  new ResizeObserver(() => { size(); draw(); }).observe(host);
  document.addEventListener('themechange', () => { if (U) { gl.uniform3fv(U.uInk, rgb()); draw(); } });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); U = null; });
  canvas.addEventListener('webglcontextrestored', () => { if (setup()) draw(); });
  if (reduceMotion) return;

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !inView) return;
    mouse.tx = e.pageX - ox; mouse.ty = e.pageY - oy;
    if (!mouse.want) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
    mouse.want = 1;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { mouse.want = 0; });
  if ('IntersectionObserver' in window) {
    // Off screen, the loop stops and the phone stops floating.
    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      host.classList.toggle('is-away', !inView);
      if (inView) start();
    }).observe(host);
  }
  start();
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
