// English text of the project pages, keyed by slug. Only words live here: pictures, sizes and links
// come from tools/projects.mjs, matched by position (gallery[i], links[i]).
// Edit here, then run: node tools/build-projects.mjs

export const en = {
  moonarrow: {
    lead: 'A community for people who make games: a forum to show progress and a marketplace to share assets.',
    facts: { Year: '2025, 12th-grade final project (PAP)', Role: 'Solo, start to finish', Result: 'Graded 20/20', Stack: 'PHP, MySQL, Bootstrap, JavaScript' },
    video: { alt: 'Tour of MoonArrow Studios: home page, forum, marketplace and about page' },
    image: { alt: 'MoonArrow Studios marketplace with the asset list and the leaderboard', caption: 'Marketplace: assets with category, hashtags, votes and views.' },
    side: { alt: 'MoonArrow Studios forum with three posts', caption: 'Forum: posts by category, with votes and comments.' },
    gallery: [
      { alt: 'MoonArrow Studios admin panel with totals and recent users', caption: 'Admin panel. User emails are hidden.' },
      { alt: 'Asset page with a 3D preview of a wood texture', caption: 'An asset page, with the texture previewed on a sphere.' },
    ],
    links: ['View the code'],
    body: [
      ['The challenge', ['People starting out in game development spread their questions across several Discord servers and hunt for free assets on dozens of different sites. I wanted to bring both into one place, built for that community.']],
      ['What I built', [[
        'A forum with categories, hashtags, votes, comments and view counts.',
        'A marketplace to publish and download 3D models, textures, music and videos.',
        'Profiles with followers, a feed of the people you follow and email notifications.',
        'An admin panel to manage users, posts, assets, comments, categories and reports.',
        'Sign-up, password recovery and account deletion, all confirmed by email.',
      ]]],
      ['How it works', ['PHP without a framework, using PDO and prepared statements, on a 17-table MySQL database. Post HTML goes through HTMLPurifier before it is saved, and emails are sent with PHPMailer. The interface uses Bootstrap 5 and JavaScript.']],
      ['What I learned', ['It was the first project where I had to think about everything: the data model, the permissions of each kind of user, form security and the moderator experience. Over 224 commits I learned how to organise a project that keeps growing.']],
    ],
  },
  devday: {
    lead: 'A daily planner for developers: tasks as a list or kanban, a pomodoro timer and the weather.',
    facts: { Year: '2026', Role: 'Personal project, solo', Status: 'Live on GitHub Pages', Stack: 'JavaScript, CSS, Firebase' },
    video: { alt: 'Tour of DevDay: task list, kanban, statistics, schedule and settings' },
    image: { alt: 'DevDay kanban board with tasks and the dot-matrix weather widget', caption: 'Kanban view, with the clock and the weather drawn in dots.' },
    side: { alt: 'DevDay home page', caption: 'DevDay home page.' },
    gallery: [
      { alt: 'DevDay weekly schedule', caption: 'A weekly schedule that repeats every week.' },
    ],
    links: ['Open DevDay', 'View the code'],
    body: [
      ['The challenge', ['I wanted to organise my coding day without jumping between Notion, Jira and loose lists: one simple page, always open, that kept my tasks on any device.']],
      ['What I built', [[
        'Tasks as a list or a kanban board with drag and drop, on phones too.',
        'A floating 25/5-minute pomodoro timer you can drag around the screen.',
        'Due dates with a custom calendar, filters and overdue warnings.',
        'A weekly schedule, notes and statistics.',
        'Live weather in a dot-matrix widget.',
      ]]],
      ['How it works', ['JavaScript, HTML and CSS with no build tools or dependencies, split into modules by feature. Firebase Realtime Database syncs tasks across devices, with rules that only let each person read their own data. Sign-in works with Google, email or as a guest. The weather comes from the Open-Meteo API.']],
      ['What I learned', ['How to structure a large app in plain JavaScript, without a framework, and how to write security rules for a database the browser talks to directly.']],
    ],
  },
  dailyfuel: {
    lead: 'A private diary for calories, weight and water, with reminders to drink water and work out.',
    facts: { Year: '2026', Role: 'Personal project, solo', Status: 'Live on Cloudflare Pages', Stack: 'Next.js, TypeScript, Supabase' },
    video: { alt: 'Tour of DailyFuel: food diary, progress, reminders and settings' },
    side: { alt: 'DailyFuel reminders page', caption: 'Reminders to drink water and work out.' },
    image: { alt: 'DailyFuel dashboard with daily energy, macronutrients, weight and water', caption: 'The day at a glance: energy, macronutrients, weight and water.' },
    gallery: [
      { alt: 'DailyFuel progress page', caption: 'Progress: average energy, weight change and goal.' },
    ],
    links: ['Open DailyFuel'],
    body: [
      ['The challenge', ["I wanted to gain weight and didn't know whether I was eating enough or drinking water regularly. I needed to see all of it in one place, every day, so I built my own app."]],
      ['What I built', [[
        'A meal diary with calories and macronutrients.',
        'Weight tracking with a progress chart.',
        'A water counter for the day.',
        'Phone reminders to drink water and work out.',
        'Workouts, habits and a to-do list.',
      ]]],
      ['How it works', ['Next.js with TypeScript, exported as a static site and hosted on Cloudflare Pages. Supabase handles email sign-in and stores each account\'s data, with row-level security so nobody can read anyone else\'s data. Notifications are delivered through ntfy.']],
      ['What I learned', ['TypeScript and React in a real project, and how to migrate the data from an old version to a new database without losing anything.']],
    ],
  },
  telepomba: {
    lead: 'A browser chat with real-time messages, groups and file sharing.',
    facts: { Year: '2025, 12th grade', Role: 'Scrum master and lead, team of 6', Status: 'Class project', Stack: 'PHP, Node.js, Socket.IO, MySQL' },
    video: { alt: 'TelePomba home page scrolling section by section' },
    image: { alt: 'TelePomba sign-in screen', caption: 'TelePomba sign-in.' },
    links: ['View the code'],
    body: [
      ['The challenge', ['Build, as a class, a chat that worked live between different computers, with accounts, groups and files, like the apps we use every day.']],
      ['What I built', [[
        'Sign-up, sign-in, profile and password recovery by email.',
        'One-to-one and group conversations, with user search to add people.',
        'Messages delivered in real time and each person\'s online status.',
        'Sharing images, videos and other files.',
        'As scrum master and lead, I organised the team\'s tasks and integrated everyone\'s work. I made 44 of the 72 commits.',
      ]]],
      ['How it works', ['The pages and the API are PHP with MySQL. A Node.js server with Socket.IO delivers messages instantly and updates user status. To test across computers, we exposed the server with ngrok.']],
      ['What I learned', ['How real-time connections work with WebSockets, and how to lead a team of six: splitting the work, following what everyone is doing and bringing it all together in one repository.']],
    ],
  },
  petgesthotel: {
    lead: 'A pet hotel: room and service bookings on a website and an Android app, both on the same API.',
    facts: { Year: '2026, in progress', Role: 'Team of 3', Status: 'First-semester final project', Stack: 'Yii2 Advanced, PHP, MySQL, Android' },
    video: { alt: 'Tour of PetGestHotel: home page, about us, sign-in and sign-up' },
    image: { alt: 'PetGestHotel home page with the availability form by dates and type of pet', caption: 'The website home page, still in development.' },
    links: [],
    body: [
      ['The challenge', ['A pet hotel has to manage rooms, bookings, extra services and communication with owners. The project brings it all into one system with a website, an API and a mobile app.']],
      ['What we are building', [[
        'Room and service bookings for the pet, with availability search by dates.',
        'Four roles: visitor, client, staff and administrator.',
        'One API serving both the website and the Android app.',
        'In-app chat between the client and the hotel staff.',
      ]]],
      ['How it works', ['The website and the API are built with Yii2 Advanced, using migrations for the database and the framework\'s models, views and controllers. The Android app uses the same API.']],
      ['Status', ['The home page is done, with the availability search. This page will be updated as the project moves forward.']],
    ],
  },
  securechat: {
    lead: 'A group chat where messages travel encrypted and signed.',
    facts: { Year: '2026, 1st year of the CTeSP', Role: 'Team of 2, with Paulo', Status: 'Finished', Stack: 'C#, Windows Forms, TCP, SQL Server' },
    image: { alt: 'SecureChat window with messages from three users and the list of commands', caption: 'A chat with three people connected, a private message and the list of commands.' },
    side: { alt: 'SecureChat sign-in window', caption: 'Sign-in.' },
    gallery: [
      { alt: 'Server console showing the 2048-bit RSA key exchange with a client', caption: 'The server logs the 2048-bit RSA key exchange before opening the secure channel.' },
    ],
    links: ['View the code'],
    body: [
      ['The challenge', ['Build a chat where several people talk in the same room, in real time, without anyone listening on the network being able to read or change the messages.']],
      ['What we built', [[
        'A TCP server that accepts several clients at once.',
        'Sign-up and sign-in, with passwords stored as salted hashes.',
        '2048-bit RSA key exchange and messages encrypted with AES.',
        'Every message signed with SHA-256 and verified on the other side.',
        '/users and /msg commands to see who is online and send private messages.',
        'A colour of choice for each user.',
      ]]],
      ['How it works', ['Client and server in C#, talking over TCP with ProtocolSI. Users are stored in a SQL Server LocalDB database.']],
      ['What I learned', ['The difference between encrypting, signing and hashing, and why each one solves a different problem.']],
    ],
  },
  ishopping: {
    lead: 'Planning the month\'s shopping within a budget, with a receipt at the end.',
    facts: { Year: '2026, 1st year of the CTeSP', Role: 'Team of 2, with Paulo', Status: 'Finished', Stack: 'C#, Entity Framework, SQL Server' },
    image: { alt: 'Prototype of the iShopping home screen with open shopping lists', caption: 'Prototype of the home screen, with the open shopping lists.' },
    gallery: [
      { alt: 'Prototype of the iShopping items screen', caption: 'Prototype of item management.' },
    ],
    links: ['View the code'],
    body: [
      ['The challenge', ['Help a family not spend more than they planned: set a budget for the month, make the list and know straight away whether it will go over.']],
      ['What we built', [[
        'A maximum budget per month.',
        'A planned shopping list, with expected and unexpected items.',
        'The running total, with a warning when the budget is exceeded.',
        'A printed receipt at the end of the shop.',
        'The family\'s shopping history and statistics.',
      ]]],
      ['How it works', ['A Windows Forms app in C#, organised into models, views and controllers. The database is created with Entity Framework Code First and migrations, on SQL Server LocalDB.']],
      ['What I learned', ['Using an ORM and migrations instead of writing SQL by hand, and keeping the interface apart from the logic.']],
    ],
  },
  lux: {
    lead: 'An AI assistant that runs entirely on your own computer: it chats, reads files and codes inside a folder.',
    facts: { Year: '2026', Role: 'Personal project, solo', Status: 'In daily use', Stack: 'Python, JavaScript, Ollama' },
    video: { alt: 'Lux answering a question with a local model' },
    image: { alt: 'Lux home screen with suggested questions and the list of conversations', caption: 'Home screen, in chat mode.' },
    gallery: [
      { alt: 'A Lux conversation explaining foreach in PHP with a code example', caption: 'A conversation with the qwen3.5:4b model, running locally.' },
    ],
    links: [],
    body: [
      ['The challenge', ['I wanted an assistant like Claude Code or Codex, but one that worked offline and never sent my files anywhere.']],
      ['What I built', [[
        'Two modes: plain chat, and coding inside a project folder.',
        'In coding mode it reads, searches, writes and edits files and runs commands, always asking for permission first.',
        'Image, PDF and text file attachments.',
        'One-click setup that checks memory and the graphics card and recommends the right model.',
        'Voice input with Whisper and, optionally, cloud models.',
      ]]],
      ['How it works', ['A Python server talks to Ollama, which runs the models on the computer. The interface is HTML, CSS and JavaScript and opens in its own window.']],
      ['What I learned', ['How language models work inside an application: context, tools and memory limits.']],
    ],
  },
};
