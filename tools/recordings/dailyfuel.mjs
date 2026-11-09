// DailyFuel: the food diary, then progress, reminders and settings.
export default {
  name: 'dailyfuel-scroll',
  clips: [
    {
      url: 'https://dailyfuel.pages.dev/',
      settle: 3000,
      record: [
        { wait: 1500 },
        { sections: { selector: 'main section, main > div > div', maxStops: 2, hold: 1000 } },
        { top: 1200 },
        { wait: 300 },
        { click: ['button', '^progress$'], after: 2400 },
        { click: ['button', '^reminders$'], after: 2400 },
        { click: ['button', '^settings$'], after: 2400 },
        { click: ['button', '^food diary$'], after: 1000 },
      ],
    },
  ],
};
