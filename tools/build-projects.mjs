// Generates projetos/<slug>.html (Portuguese) and en/projects/<slug>.html (English)
// from tools/projects.mjs, with the English text laid over it from tools/projects.en.mjs.
// Usage: node tools/build-projects.mjs
//
// Each page follows the index: the name on the paper beside an ink panel that plays the project,
// then the challenge beside a screenshot, what was built on a field of ink, more screens,
// how it works and what was learned, and the next project as an ink card.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { projects as projectsPt } from './projects.mjs';
import { en } from './projects.en.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// The English text only replaces the words: sources, sizes and links stay as in projects.mjs.
const media = (m, t) => (m && t ? { ...m, ...t } : m);
const projectsEn = projectsPt.map((p) => {
  const t = en[p.slug];
  if (!t) throw new Error(`No English text for ${p.slug} in tools/projects.en.mjs`);
  return {
    ...p,
    name: t.name ?? p.name,
    lead: t.lead,
    facts: t.facts,
    body: t.body,
    video: media(p.video, t.video),
    image: media(p.image, t.image),
    side: media(p.side, t.side),
    gallery: p.gallery?.map((m, i) => media(m, t.gallery?.[i])),
    links: p.links.map((l, i) => ({ ...l, label: t.links?.[i] ?? l.label })),
  };
});

const LANGS = {
  pt: {
    projects: projectsPt, dir: 'projetos', up: '../', html: 'pt-PT', locale: 'pt_PT',
    other: (slug) => `../en/projects/${slug}.html`, otherHreflang: 'en',
    s: { skip: 'Saltar para o conteúdo', home: 'Thomaz Barrago, início', back: 'Todos os projetos', newTab: ' (abre noutro separador)', talk: 'Falar sobre este projeto', more: 'Mais ecrãs', tech: 'Detalhes técnicos', next: 'Projeto seguinte', view: 'Ver projeto', toTop: 'Voltar ao topo', nav: ['Projetos', 'Estágios', 'Sobre', 'Contacto'], langLabel: 'Idioma' },
  },
  en: {
    projects: projectsEn, dir: 'en/projects', up: '../../', html: 'en', locale: 'en_GB',
    other: (slug) => `../../projetos/${slug}.html`, otherHreflang: 'pt',
    s: { skip: 'Skip to content', home: 'Thomaz Barrago, home', back: 'All projects', newTab: ' (opens in a new tab)', talk: 'Talk about this project', more: 'More screens', tech: 'Technical details', next: 'Next project', view: 'View project', toTop: 'Back to top', nav: ['Projects', 'Internships', 'About', 'Contact'], langLabel: 'Language' },
  },
};

// PT / EN switch: the current language as text, the other one as a link to the same page.
function langSwitch(code, otherHref, label) {
  const pt = code === 'pt'
    ? '<span aria-current="true" title="Português">PT</span>'
    : `<a href="${otherHref}" hreflang="pt" lang="pt" title="Ler em português">PT</a>`;
  const enLink = code === 'en'
    ? '<span aria-current="true" title="English">EN</span>'
    : `<a href="${otherHref}" hreflang="en" lang="en" title="Read in English">EN</a>`;
  return `<div class="lang" role="group" aria-label="${label}">${pt}${enLink}</div>`;
}

for (const [code, L] of Object.entries(LANGS)) {
const { projects, up, s } = L;
const out = join(root, L.dir);
mkdirSync(out, { recursive: true });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isExternal = (href) => /^https?:/.test(href);

function paragraphs(parts) {
  return parts.map((p) => Array.isArray(p)
    ? `<ul class="p-list">${p.map((li) => `\n          <li>${esc(li)}</li>`).join('')}\n        </ul>`
    : `<p>${esc(p)}</p>`).join('\n        ');
}

// A picture inside the browser window used on the index cards (or bare, for a game).
function shot(m, { dark = false, lazy = true, video = false } = {}) {
  const w = m.w ?? (video ? 1280 : 2880), h = m.h ?? (video ? 800 : 1800);
  const inner = video
    ? `<video src="${up}assets/video/${m.src}" poster="${up}assets/img/${m.poster}" width="${w}" height="${h}" muted loop playsinline preload="metadata" aria-label="${esc(m.alt)}"></video>`
    : `<img src="${up}assets/img/${m.src}" alt="${esc(m.alt)}" width="${w}" height="${h}"${lazy ? ' loading="lazy"' : ''}>`;
  const cls = m.frame === false ? 'p-bare' : `work__shot${dark ? ' work__shot--dark' : ''}`;
  return `<div class="${cls}">${inner}</div>`;
}

function figure(m) {
  return `<figure class="p-fig">
      ${shot(m)}
      <figcaption>${esc(m.caption)}</figcaption>
    </figure>`;
}

function action(l, primary) {
  const ext = isExternal(l.href);
  return `<a class="btn${primary ? '' : ' btn--ink'}" href="${l.href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${esc(l.label)} <span class="arrow" aria-hidden="true">${ext ? '↗' : '→'}</span>${ext ? `<span class="sr-only">${s.newTab}</span>` : ''}</a>`;
}

// Pages marked listed: false are still built, but left out of the "next project" chain.
const chain = projects.filter((p) => p.listed !== false);

projects.forEach((p) => {
  const i = chain.indexOf(p);
  const next = chain[(i + 1) % chain.length];

  // Pictures in the order they are used: the panel (when there is no video), the challenge, then the rest.
  const pics = [p.image, p.side, ...(p.gallery ?? [])].filter(Boolean);
  const stageMedia = p.video ? shot(p.video, { dark: true, video: true }) : shot(pics.shift(), { dark: true, lazy: false });
  const introPic = pics.shift();
  const morePics = pics;

  // The body: the first part is the challenge, the part with a list is what was built, the rest sit side by side.
  const [intro, ...restBody] = p.body;
  const listIdx = restBody.findIndex(([, parts]) => parts.some(Array.isArray));
  const built = listIdx >= 0 ? restBody.splice(listIdx, 1)[0] : null;

  const longest = Math.max(...p.name.split(/\s+/).map((w) => w.length));
  const facts = Object.entries(p.facts).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n        ');
  const actions = p.links.length
    ? p.links.map((l, j) => action(l, j === 0)).join('\n          ')
    : `<a class="btn" href="../index.html#contacto">${s.talk} <span class="arrow" aria-hidden="true">→</span></a>`;

  const nextPoster = next.video?.poster ?? next.image?.src;
  const cover = p.video?.poster ?? p.image?.src; // what a shared link shows

  const html = `<!doctype html>
<html lang="${L.html}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(p.name)} · Thomaz Barrago</title>
  <meta name="description" content="${esc(p.lead)}">
  <meta name="theme-color" content="#ebebe8">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Thomaz Barrago">
  <meta property="og:title" content="${esc(p.name)} · Thomaz Barrago">
  <meta property="og:description" content="${esc(p.lead)}">
  <meta property="og:locale" content="${L.locale}">
  <meta property="og:image" content="${up}assets/img/${cover}">
  <meta property="og:image:alt" content="${esc((p.video ?? p.image).alt)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="alternate" hreflang="${L.otherHreflang}" href="${L.other(p.slug)}">
  <link rel="icon" href="${up}assets/img/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Doto:ROND,wght@100,900&family=Host+Grotesk:wght@400;500&display=swap">
  <link rel="stylesheet" href="${up}assets/css/site.css">
  <link rel="expect" href="#fim" blocking="render">
  <script src="${up}assets/js/lang.js"></script>
</head>
<body class="project">
<!-- Generated by tools/build-projects.mjs. Edit tools/projects.mjs and tools/projects.en.mjs instead. -->
<a class="skip" href="#conteudo">${s.skip}</a>

<div class="top p-top">
  <div class="hero">
    <header class="nav">
      <a class="wordmark" href="../index.html" aria-label="${s.home}">thomaz<i>.</i></a>
      <div class="nav__end">
        <a class="nav__back" href="../index.html#projetos"><span class="arrow" aria-hidden="true">←</span> ${s.back}</a>
        ${langSwitch(code, L.other(p.slug), s.langLabel)}
      </div>
    </header>
    <div class="hero__body" data-reveal>
      <h1 class="display p-title" style="--len: ${longest}">${esc(p.name)}</h1>
      <p class="lead">${esc(p.lead)}</p>
      <div class="hero__actions">
          ${actions}
      </div>
    </div>
  </div>
  <div class="p-stage" data-reveal>
    ${stageMedia}
    <dl class="p-facts">
        ${facts}
    </dl>
  </div>
</div>

<main id="conteudo">
  <section class="section p-intro" aria-labelledby="desafio-h">
    <div class="p-intro__text" data-reveal>
      <h2 class="h2" id="desafio-h">${esc(intro[0])}</h2>
      <div class="p-statement">
        ${paragraphs(intro[1])}
      </div>
    </div>
    ${introPic ? `<div data-reveal>\n    ${figure(introPic)}\n    </div>` : ''}
  </section>
${built ? `
  <section class="field p-built" aria-labelledby="feito-h">
    <div class="p-built__grid" data-reveal>
      <h2 class="h2" id="feito-h">${esc(built[0])}</h2>
      ${paragraphs(built[1])}
    </div>
  </section>
` : ''}${morePics.length ? `
  <section class="section p-more" aria-labelledby="ecras-h">
    <h2 class="h2" id="ecras-h" data-reveal>${s.more}</h2>
    <div class="p-more__grid p-more__grid--${Math.min(morePics.length, 3)}" data-reveal>
    ${morePics.map(figure).join('\n    ')}
    </div>
  </section>
` : ''}
  <section class="section p-notes" aria-label="${s.tech}">
    ${restBody.map(([title, parts]) => `<div class="p-note" data-reveal>
      <h2 class="h3">${esc(title)}</h2>
      ${paragraphs(parts)}
    </div>`).join('\n    ')}
  </section>
</main>

<nav class="p-next-wrap" aria-label="${s.next}">
  <a class="p-next" href="${next.slug}.html">
    <span class="p-next__media"><img src="${up}assets/img/${nextPoster}" alt="" width="1280" height="800" loading="lazy"></span>
    <span class="p-next__body">
      <span class="p-next__label">${s.next}</span>
      <span class="p-next__name">${esc(next.name)}</span>
      <span class="p-next__lead">${esc(next.lead)}</span>
      <span class="more">${s.view} <span class="arrow" aria-hidden="true">→</span></span>
    </span>
  </a>
</nav>

<footer class="footer" id="fim">
  <div class="footer__top">
    <ul>
      <li><a href="../index.html#projetos">${s.nav[0]}</a></li>
      <li><a href="../index.html#estagios">${s.nav[1]}</a></li>
      <li><a href="../index.html#sobre">${s.nav[2]}</a></li>
      <li><a href="../index.html#contacto">${s.nav[3]}</a></li>
    </ul>
    <a class="footer__up" href="#">${s.toTop} <span class="arrow" aria-hidden="true">↑</span></a>
  </div>
  <p class="footer__name" aria-hidden="true"><span>thomaz</span> <span>barrago</span></p>
  <div class="footer__legal"><span>© 2026 Thomaz Barrago</span><a href="mailto:thomazbarrago@gmail.com">thomazbarrago@gmail.com</a></div>
</footer>

<script src="${up}assets/js/site.js"></script>
</body>
</html>
`;
  writeFileSync(join(out, `${p.slug}.html`), html);
  console.log(L.dir + '/' + p.slug + '.html');
});
}
