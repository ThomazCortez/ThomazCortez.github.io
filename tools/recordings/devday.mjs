// DevDay, signed in as a guest: the task list, the kanban board, stats, schedule and settings.
export default {
  name: 'devday-scroll',
  clips: [
    {
      url: 'https://thomazcortez.github.io/devday/login.html',
      setup: [
        { click: ['button.method-tab', 'guest'], after: 600 },
        { click: '#guestBtn', after: 9000 },
      ],
      record: [
        { wait: 1800 },
        { click: '#btnKanban', after: 2000 },
        { click: '#btnList', after: 600 },
        { click: '#sidebarStatsBtn', after: 2600 },
        { click: '#sidebarScheduleBtn', after: 2600 },
        { click: ['button.dropdown-item', '^settings$'], after: 2600 },
        { click: 'button.settings-close', after: 900 },
      ],
    },
  ],
};
