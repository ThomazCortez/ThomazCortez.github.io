// MoonArrow Studios: the landing page, then a quick look at the forum, the marketplace and the about page.
const base = 'http://localhost/moonarrowstudios/';
export default {
  name: 'moonarrow-scroll',
  clips: [
    { url: base, record: [{ wait: 1300 }, { sections: { selector: '[id^=section]' } }, { wait: 300 }, { top: 1500 }, { wait: 500 }] },
    { url: base + 'php/forum.php', record: [{ wait: 1300 }, { sections: { maxStops: 1, hold: 1100 } }, { top: 1100 }, { wait: 400 }] },
    { url: base + 'php/marketplace.php', record: [{ wait: 1300 }, { sections: { maxStops: 1, hold: 1100 } }, { top: 1100 }, { wait: 400 }] },
    { url: base + 'php/about.php', record: [{ wait: 1200 }, { sections: { selector: 'section', maxStops: 3, hold: 1100 } }, { top: 1500 }, { wait: 500 }] },
  ],
};
