# 🏋️ Gym Diary: Personal Fitness Tracker

Gym Diary is a private gym and cardio diary for one person. It works offline, has no login, and keeps every record on your phone. Strength workouts and cardio are logged separately. You can back-date workouts you forgot to log, browse them on a calendar, and see dashboards, streaks and personal records.

> Built with React, TypeScript, Tailwind CSS, IndexedDB, Recharts, and an installable PWA.
> The full design (architecture, database schema, screens, wireframes, data model, components, PWA strategy and roadmap) is in **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

## Features

- **Fast logging.** Pick an exercise, then type weight × reps. "Add set" copies the previous set, and exercises pre-fill from the last time you did them.
- **Back-dating.** Choose any past date on the Log screen, or tap a day on the Calendar and press **+ Strength** or **+ Cardio**.
- **About 220 exercises** across 12 muscle groups, plus your own custom exercises.
- **Cardio** with 24 activities and custom ones. Only duration is required.
- **Quick entry.** One-tap templates (Push, Pull, Legs, Upper, Lower, Full Body, Cardio Day), favourites ★, recent and frequent exercises, and *save any workout as a template*.
- **Dashboard.** Today's status, this week and this month, total volume, volume by muscle group, top exercises, PRs, weekly and monthly trends, and cardio minutes, activities and distance.
- **Progress.** Streaks, days trained, weight progression per exercise, strongest lifts, muscle frequency and a personal-bests table.
- **Data.** Export to Excel (CSV), import from CSV, full backup and restore (JSON), and erase. No cloud account is needed.
- **Auto-saved draft.** If you close the app mid-workout, you can resume it.

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

Want to explore first? Go to **⚙ Settings → Load sample data**, look around, then **Erase all data** when you're ready to start for real.

> ⚠️ Your workouts live only on that phone. Use **Settings → Full backup** every few weeks and save the file to Google Drive or iCloud.

## For developers

```bash
cd fitness-tracker
npm install
npm run dev        # http://localhost:5173 (also on your LAN for phone testing)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build (service worker active)
npm run icons      # regenerate PNG icons from public/icons/favicon.svg (needs Playwright)
```
