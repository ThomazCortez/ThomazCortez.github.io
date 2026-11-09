// Lux, running locally: a new chat answered by the local model.
// The reply is streamed live; that stretch is played back faster so the loop stays short.
const stop = `(() => { const b = document.querySelector('#send'); if (/stop/i.test(b.innerText)) b.click(); return true; })()`;
export default {
  name: 'lux-scroll',
  crf: 24,
  clips: [
    {
      url: 'http://127.0.0.1:8765/',
      settle: 2000,
      setup: [{ click: 'button[data-mode="chat"]', after: 800 }, { click: '#new-chat', after: 800 }],
      record: [
        { wait: 2000 },
        { type: { selector: 'textarea', text: 'Explica o que é uma API REST, com um exemplo curto em PHP.' }, after: 500 },
        { click: '#send', after: 1200 },
        { waitFor: { js: `(document.querySelector('#chat pre')?.innerText || '').length > 450`, timeout: 240000 }, after: 1500, speed: 8 },
        { eval: stop },
        { wait: 600 },
        { scrollIn: { selector: '#chat', to: 'start', ms: 1800 } },
        { wait: 1200 },
        { scrollIn: { selector: '#chat', to: 'end', ms: 2200 } },
        { wait: 1500 },
      ],
    },
  ],
};
