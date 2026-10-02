# Gym Diary: Personal Fitness Tracker

Gym Diary is a private gym and cardio diary for one person. It works offline, has no login, and keeps every record on your phone. Strength workouts and cardio are logged separately. You can back-date workouts you forgot to log, browse them on a calendar, and see dashboards, streaks and personal records.

> Built with React, TypeScript, Tailwind CSS, IndexedDB, Recharts, and an installable PWA.
> The full design (architecture, database design, screens, wireframes, data model, components, PWA strategy and roadmap) is in **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**, and the normalised SQL schema is in **[docs/schema.sql](docs/schema.sql)**.

## Features

- **Fast logging.** Type a few letters to add an exercise, or browse by muscle group. "Add set" copies the previous set, and every exercise pre-fills from last time. You can record workout duration.
- **Back-dating.** Choose any past date on the Log screen, or tap a day on the Calendar.
- **Your exercise library.** Twelve muscle groups (with a combined Legs filter), plus custom exercises. Search, filters, favourites, and per-exercise history and records.
- **Cardio.** Forty activities in 11 types (Running, Walking, Cycling, Swimming, HIIT, Sports and more) plus custom ones. Duration is required. Distance, calories and average heart rate are optional.
- **Profile.** Name, height, weight, age, gender, fitness goal and activity level, with BMI and estimated maintenance calories. A body-weight log with a trend chart.
- **Goals.** Workouts per week, cardio minutes, active days, body weight, lift targets and total volume, each with a live completion %.
- **Dashboard.** Today, week and month, totals, current weight and weight change, average duration, and volume by week, month, day, muscle and year. PRs and weight progression. Cardio by type and activity, distance and calories trends.
- **Progress.** Consistency streak, body-weight trend, exercise progression, strength improvement, strongest lifts, muscle frequency, personal bests and goal completion.
- **Templates.** Push, Pull, Legs, Upper, Lower, Full Body and Cardio Day, and you can save your own.
- **Export.** Excel (.xlsx, six sheets), a PDF report and CSV, all with an optional date range. JSON backup and restore.
- **Dark and light themes**, or follow the phone's setting. Works on phone, tablet and desktop.

## Use it on your phone

The app is a website that installs like an app. It must be hosted somewhere once, and after that it runs offline.

**Option A: GitHub Pages (free, automatic)**
1. Merge this branch into `main`.
2. On GitHub, open the repo's **Settings → Pages**, then under *Build and deployment* set **Source = GitHub Actions**.
3. The workflow `.github/workflows/deploy-fitness-tracker.yml` builds and publishes the app. Your link appears on the Actions run, usually `https://<your-username>.github.io/<repo-name>/`.
   *(GitHub Pages on a private repo needs a paid GitHub plan. If you don't have one, use option B.)*

**Option B: Netlify Drop (free, drag-and-drop)**
1. On a computer: `cd fitness-tracker && npm install && npm run build`
2. Drag the `dist` folder onto <https://app.netlify.com/drop>. You get a link.

**Then install it:**
- **Android (Chrome):** open the link, tap **⋮ → Install app**.
- **iPhone (Safari):** open the link, tap **Share → Add to Home Screen**.

Want to explore first? Go to **Settings (gear icon on Home) → Load sample data**, look around, then **Erase all data** when you're ready to start for real.

> **Important:** your workouts live only on that phone. Use **Settings → Full backup** every few weeks and save the file to Google Drive or iCloud.

## For developers

```bash
cd fitness-tracker
npm install
npm run dev        # http://localhost:5173 (also on your LAN for phone testing)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build (service worker active)
npm run icons      # regenerate PNG icons from public/icons/favicon.svg (needs Playwright)
```
