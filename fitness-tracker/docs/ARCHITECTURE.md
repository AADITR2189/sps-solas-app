# Gym Diary: Design & Architecture

A personal, single-user gym and cardio diary. It has no accounts and no server, and every record stays on the device.

This document covers the ten requested deliverables:

1. [Application architecture](#1-application-architecture)
2. [Database schema](#2-database-schema-indexeddb)
3. [UI design system](#3-user-interface-design)
4. [Mobile screens](#4-mobile-screens)
5. [Dashboard wireframes](#5-dashboard-wireframes)
6. [Data model](#6-data-model)
7. [Component structure](#7-component-structure)
8. [PWA strategy](#8-pwa-implementation-strategy)
9. [Source tree](#9-complete-source-code-structure)
10. [Future enhancements](#10-future-enhancement-recommendations)

---

## 1. Application architecture

```
┌──────────────────────────── Phone / Browser ─────────────────────────────┐
│                                                                           │
│  React UI (pages + components, Tailwind)                                  │
│     │  reads                     ▲ re-render                              │
│     ▼                            │                                        │
│  DataProvider (React context) ───┘  loads all stores → derived lists      │
│     │  calls                     ▲ notify() after each write              │
│     ▼                            │                                        │
│  db.ts (idb wrapper: CRUD, backup/restore, settings)                      │
│     │                                                                     │
│     ▼                                                                     │
│  IndexedDB "gym-diary"  ← persistent storage requested (no eviction)      │
│                                                                           │
│  lib/stats.ts  pure functions → streaks, PRs, volume, trends (memoised)   │
│  lib/csv.ts    CSV export (Excel-friendly, BOM) & import parser           │
│                                                                           │
│  Service worker (Workbox via vite-plugin-pwa) → precaches app shell       │
└───────────────────────────────────────────────────────────────────────────┘
```

**Key decisions**

| Decision | Why |
|---|---|
| No backend, IndexedDB only | Single user. Works offline, needs no account, and costs nothing to run. |
| Load all data into memory | A heavy lifter logs fewer than 2,000 sessions in 5 years, which is a few MB. Stats run in milliseconds and the code stays simple. |
| Analytics are computed on the fly, never stored | There is no derived data to go stale. Editing a past workout updates every chart immediately. |
| Strength and cardio are separate `Session`s | Matches the spec. Cardio never asks for sets, reps or weight. |
| `HashRouter` | Works on any static host (GitHub Pages, Netlify, a USB stick) with no server rewrites, and works offline. |
| Relative `base: './'` | The same build runs at `/`, at `/repo-name/`, or anywhere else. |
| Draft autosave (localStorage) | If the app is closed mid-workout, the session can be resumed from the Log screen. |

**Stack:** React 18, TypeScript (strict), Tailwind CSS 3, Vite 5, `idb`, Recharts, `vite-plugin-pwa` (Workbox) and `lucide-react` icons.

---

## 2. Database schema (IndexedDB)

Database `gym-diary`, version 1, defined in `src/db/db.ts`:

| Object store | Key | Indexes | Contents |
|---|---|---|---|
| `sessions` | `id` (uuid) | `by-date` (date), `by-kind` (kind) | One workout session, with its exercises/sets or cardio entries embedded |
| `customExercises` | `id` | n/a | User-created strength exercises, each tagged with a muscle group |
| `customCardio` | `id` | n/a | User-created cardio activities |
| `favorites` | `key` (`"strength:Name"` / `"cardio:Name"`) | n/a | Starred exercises for quick entry |
| `templates` | `id` | n/a | User-saved templates (the 7 built-ins live in code) |
| `kv` | string key | n/a | `settings`: units and week start |

Exercises and sets are **embedded** inside the session document, not normalised into separate tables. A session is always read and written as one unit, so embedding gives atomic saves and one-read loads. "Frequently used", "recent" and PRs are derived by scanning sessions.

**Migrations:** bump the version in `openDB('gym-diary', N)` and add a branch in `upgrade(db, oldVersion)`. Backups carry `version: 1` for forward compatibility.

---

## 3. User interface design

| Token | Value | Use |
|---|---|---|
| `bg` | `#0b0d10` | App background (dark by default) |
| `surface` / `raised` | `#14171c` / `#1c2027` | Cards / inputs and secondary buttons |
| `line` | `#262b34` | Borders and chart grid |
| `muted` | `#8b93a1` | Secondary text and axis labels |
| `accent` (lime) | `#a3e635` | **Strength** identity, primary actions |
| `cardio` (sky) | `#38bdf8` | **Cardio** identity |
| `gold` | `#facc15` | Streaks, PRs, back-dated warnings |
| `danger` | `#f87171` | Delete actions |

**Principles**

- Touch targets are at least 44px. Set inputs are 48px tall with a large font, use the numeric keypad, and select their contents when tapped.
- Strength is always lime and cardio is always sky blue, across calendar dots, buttons and charts.
- The "Add set" button copies the previous set, and new exercises pre-fill from the last time you did them. Most sets need zero typing.
- A bottom sheet is used for every picker, so it is reachable with one thumb.
- Charts use a single hue per chart with names on the axis, so there are no legends to decode. Every chart has a tooltip.

---

## 4. Mobile screens

The bottom navigation reads: **Home · Calendar · [ + Log ] · History · Progress**. Settings sits behind the gear icon on Home.

| Screen | Route | Purpose |
|---|---|---|
| Dashboard | `#/` | Today's status, week and month summary, strength and cardio analytics, recent workouts |
| Log hub | `#/log` | Date picker for back-dating, Strength/Cardio buttons, one-tap templates, favorites, frequent and recent exercises, resume draft |
| Workout editor | `#/log/edit?…` | Add, edit or delete a session: date, type, exercises → sets (weight × reps), or cardio (duration\*, distance, calories), plus notes. Can also save the session as a template. |
| Calendar | `#/calendar?d=YYYY-MM-DD` | Month grid with strength and cardio dots. Tapping a day lists its workouts and offers **+ Strength / + Cardio** to backfill. Hovering shows a summary. |
| History | `#/history` | Search, date-range presets or a custom range, type filter, muscle filter, totals for the filtered set |
| Progress | `#/progress` | Streaks, active days, weight progression per exercise (top weight, e1RM or volume), strongest lifts, muscle frequency, personal-best table |
| Settings & data | `#/settings` | Units, CSV export/import, JSON backup/restore, storage protection, install help, custom exercises, sample data, erase |

Supported editor URL parameters: `id`, `date`, `kind`, `template`, `exercise`+`group`, `activity`, `resume`. Every quick-entry chip is just a link with these parameters.

---

## 5. Dashboard wireframes

```
┌─────────────────────────────┐   ┌─────────────────────────────┐
│ Fri, 2 Oct 2026          ⚙  │   │ PROGRESS                    │
│ Gym Diary                   │   │ ┌──────────┐ ┌──────────┐   │
│ ┌─────────────────────────┐ │   │ │🔥 5 days │ │📅 12     │   │
│ │✓ Trained today      [+] │ │   │ │best 14   │ │of 20 days│   │
│ │  Push Day · 18 sets ›   │ │   │ └──────────┘ └──────────┘   │
│ └─────────────────────────┘ │   │ Active days / month  ▂▅▇█   │
│ ┌──────────┐ ┌──────────┐   │   │ WEIGHT PROGRESSION          │
│ │STREAK 5d │ │TOTAL 128 │   │   │ [Bench Press ▾]  ▲ 12.5%    │
│ └──────────┘ └──────────┘   │   │ (Top wt)(e1RM)(Volume)      │
│ THIS WEEK                   │   │      ●──●──●──●─●           │
│ [Sess 3][Vol 13.8k][Car 40m]│   │ STRONGEST LIFTS (e1RM)      │
│ THIS MONTH                  │   │ 1 Deadlift        150 kg    │
│ [Days 9][Vol 52k][Car 3h]   │   │ 2 Squat           120 kg    │
│ STRENGTH                    │   │ MUSCLE FREQUENCY [30d][All] │
│ [Total vol][Sessions]       │   │ Chest ████████ 8            │
│ Weekly volume  (Week|Month) │   │ Back  ██████   6            │
│  ▂▃▅▅▆▇█▇▆▇█               │   │ PERSONAL BESTS (Heavy|Rec.) │
│ Volume by muscle  ███ ██ █  │   │ Exercise  Best set   e1RM   │
│ Most performed  1..5        │   └─────────────────────────────┘
│ Recent PRs 🏆               │
│ CARDIO                      │
│ [All-time][Week][Month]     │
│ Cardio minutes ▂▅▃▇         │
│ Activity breakdown ███ ██   │
│ Distance trend  ╱╲╱         │
│ RECENT WORKOUTS ›           │
├─────────────────────────────┤
│ ⌂   📅    [ + ]   ☰    📈   │
└─────────────────────────────┘
```

---

## 6. Data model

TypeScript definitions are in `src/types.ts`.

```ts
Session {
  id: string            // uuid
  date: 'YYYY-MM-DD'    // local calendar date, can be in the past (back-dating)
  kind: 'strength' | 'cardio'
  name?: string         // "Push Day"
  notes?: string
  strength: StrengthEntry[]   // empty for cardio sessions
  cardio:   CardioEntry[]     // empty for strength sessions
  createdAt, updatedAt: number
}
StrengthEntry { id, exercise, muscleGroup, sets: { reps, weight }[], notes? }
CardioEntry   { id, activity, durationMin (required), distance?, calories?, notes? }
Template      { id, name, kind, builtIn?, strength: {exercise, muscleGroup, sets}[], cardio: {activity, durationMin}[] }
Settings      { weightUnit: 'kg'|'lb', distanceUnit: 'km'|'mi', weekStartsOn: 0|1 }
```

**Derived metrics** (`src/lib/stats.ts`):

- Set volume is `reps × weight`. Exercise volume is the sum over its sets, and session volume is the sum over its exercises.
- Estimated 1RM uses the Epley formula: `weight × (1 + reps/30)`.
- The current streak counts consecutive days with a session, ending today, or yesterday if today isn't logged yet. The longest streak is computed over all time.
- A personal record per exercise is the heaviest set (ties broken by reps), the best e1RM, the best single-set volume and the best session volume.
- Weekly and monthly trends bucket volume, cardio minutes, distance, sessions and active days.

**CSV format** (one row per set, or per cardio entry):

```
session_id,date,type,session_name,session_notes,exercise_or_activity,muscle_group,
set_number,reps,weight,set_volume,duration_min,distance,calories,entry_notes
```

The file is UTF-8 with a BOM, so Excel opens it correctly. On import, rows are grouped back into sessions by `session_id`. If that column is blank, rows are grouped by date, type and name, so a hand-made spreadsheet can be imported. Only `date`, `type` and `exercise_or_activity` are required.

---

## 7. Component structure

```
App (HashRouter)
├─ DataProvider               context: sessions, library, templates, favorites, settings
├─ <main> routes
│  ├─ Dashboard               Stat, ChartCard, TrendBars, TrendLine, RankBars, SessionCard
│  ├─ LogHub                  quick-entry chips, templates grid, draft banner
│  ├─ Editor                  StrengthCard (sets grid), cardio cards, sticky Save bar
│  │   ├─ ExercisePicker      Sheet: search · ★Favorites · Recent · Frequent · 12 muscle tabs · custom
│  │   └─ CardioPicker        Sheet: favorites · recent · all 24 activities · custom
│  ├─ CalendarPage            month grid, day detail, backfill buttons
│  ├─ History                 filters (presets/custom range/type/muscle/search), grouped list
│  ├─ Progress                streaks, progression chart, strongest lifts, frequency, PR table
│  └─ SettingsPage            units, CSV, backup/restore, storage, install help, erase
└─ BottomNav
Shared UI (components/ui.tsx): Card, Stat, Button, Chip, Sheet, Empty, PageHeader, NumberInput
```

---

## 8. PWA implementation strategy

| Concern | Implementation |
|---|---|
| Installable (Android/Chrome) | `manifest.webmanifest` generated by vite-plugin-pwa: `display: standalone`, 192/512 icons plus a maskable icon, and dark theme and background colours |
| Installable (iPhone/Safari) | `apple-mobile-web-app-capable`, `black-translucent` status bar, a 180px `apple-touch-icon`, and `viewport-fit=cover` with safe-area padding (`pt-safe` / `pb-safe`) |
| Offline | A Workbox service worker precaches every JS, CSS, HTML and icon file. `navigateFallback: index.html`. With HashRouter, every screen loads offline. |
| Updates | `registerType: 'autoUpdate'`. A new version installs in the background and applies on next launch. |
| Data durability | `navigator.storage.persist()` is requested on start-up. The Settings screen shows the protection status, and regular JSON backups are recommended. |
| Fast loading | Code is split into `react`, `charts` and `app` chunks, about 200 KB gzipped in total and served from cache after the first visit. System fonts mean no web-font download. |

**iOS note:** Safari may clear website data after 7 days of non-use for sites that are *not* installed. Installing to the Home Screen exempts the app, and so does the persistence grant. Keep backups anyway.

---

## 9. Complete source code structure

```
fitness-tracker/
├─ index.html                 PWA/iOS meta tags
├─ package.json               scripts: dev, build, preview, typecheck, icons
├─ vite.config.ts             React + PWA plugin, manifest, Workbox, chunking
├─ tailwind.config.js         design tokens
├─ public/icons/              favicon.svg + generated PNGs (npm run icons)
├─ scripts/make-icons.mjs     renders the SVG icon to PNG sizes
├─ docs/ARCHITECTURE.md       this file
└─ src/
   ├─ main.tsx                mounts the app, registers the service worker
   ├─ App.tsx                 routes and layout
   ├─ index.css               Tailwind, safe-area and scrollbar utilities
   ├─ types.ts                data model and muscle groups
   ├─ data/exercises.ts       ~220-exercise library across 12 muscle groups
   ├─ data/cardio.ts          24 cardio activities and 7 built-in templates
   ├─ db/db.ts                IndexedDB schema, CRUD, backup/restore, persistence
   ├─ hooks/useData.ts        DataProvider context and live reload
   ├─ lib/date.ts             local-date helpers (no timezone bugs)
   ├─ lib/stats.ts            all analytics (pure functions)
   ├─ lib/csv.ts              CSV export, parser and import
   ├─ lib/demo.ts             sample-data generator
   ├─ components/             ui.tsx, BottomNav, SessionCard, ExercisePicker, charts
   └─ pages/                  Dashboard, LogHub, Editor, CalendarPage, History, Progress, SettingsPage
```

---

## 10. Future enhancement recommendations

**Training features**
- A rest timer with vibration and sound after each set, plus a set-completion checkbox for live logging.
- Set types: warm-up, drop set, failure and AMRAP, plus RPE/RIR per set.
- Bodyweight and assisted exercises, where volume uses bodyweight ± load.
- Supersets and circuits (grouped exercises).
- Progressive-overload suggestions, for example "Last time 3×8 @ 80, try 82.5".
- Plate calculator and warm-up set generator.
- Body metrics: bodyweight, body-fat % and measurements, with charts and progress photos stored as blobs in IndexedDB.

**Analytics**
- A GitHub-style yearly heatmap of training days.
- Weekly sets per muscle group compared against hypertrophy targets of 10–20 sets.
- PR celebration toasts when a record is beaten during logging.
- Cardio pace and speed derived from distance ÷ duration, plus heart-rate zones.
- Export a monthly PDF report.

**Data and sync (still no account)**
- Optional one-tap backup to a user-chosen Google Drive or iCloud file via the File System Access API or share sheet.
- Automatic weekly backup reminders.
- Import from Strong, Hevy or Fitbod CSV exports.
- Read Apple Health and Google Fit through a native wrapper (Capacitor) if ever needed.

**Engineering**
- Unit tests for `lib/stats.ts` and `lib/csv.ts` with Vitest, and Playwright smoke tests.
- Virtualised History list once there are more than 2,000 sessions.
- Lazy-load the charts chunk so the Log screen opens even faster.
- A light theme toggle.
