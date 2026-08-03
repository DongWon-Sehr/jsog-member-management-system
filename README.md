# JSOG Member Management System (v1.0.5)

Admin web app and KakaoTalk chatbot backend for **주삼오공**, an online workout-accountability group. Members log workouts through a Kakao chatbot; admins review weekly results, run quarterly rankings and manage reward payouts from a single-page admin console.

Built entirely on Google Workspace: Google Sheets is the database and Google Apps Script (GAS) is the runtime, so the whole system runs without any dedicated server.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Vue 3 (Composition API), Tailwind CSS, Chart.js, Phosphor Icons, IMask |
| Backend | Google Apps Script — Controller/Service architecture |
| Database | Google Sheets (schema-managed typed tables) |
| Build | Vite + a post-build step that splits the bundle into GAS-compatible HTML files |
| Deploy | `clasp` (Apps Script CLI) |

## Project layout

```
src/
  backend/
    main/          Production GAS code (Api, Controllers, Services, migrations)
    tests/         Manual sandbox tests, run from the GAS editor
  components/      Vue modals and shared UI
  views/           Dashboard, Workout, Member, Reward, Log tabs
  composables/     Global store, dialogs, scroll lock, week helpers
scripts/
  post-build.js    Extracts Vue templates into per-component HTML for GAS
docs/              Functional specification and user guide (Korean)
dist/              Build output — this is what clasp pushes
```

### Backend structure

- **`Api.js`** — routes `doGet` (web app) and `doPost` (chatbot webhook), and wraps every call in `_executeApi` for uniform logging and error handling.
- **Controllers** — `WebAppController` (admin APIs called via `google.script.run`) and `KakaoController` (chatbot skill JSON responses).
- **Services** — `MemberService`, `WorkoutService`, `WorkoutLogService`, `WorkoutWeekService`, `RewardService`, `KakaoService`, `SystemLogService`, `MigrationService`.
- **`DataMigration.js`** — one-off operational scripts, run by hand from the GAS editor. Every destructive script is dry-run by default and has a separate `run_apply…` counterpart.

## Development

```bash
npm install
npm run dev     # Vite dev server (frontend only; GAS APIs are unavailable)
npm run build   # Required before every deploy — see below
```

`npm run build` must be run after **any** change. Vite bundles the frontend, then `scripts/post-build.js` extracts each Vue component's `<template>` into a standalone HTML file and rewrites `index.html` into a GAS template. Backend `.js` files are copied into `dist/` untouched by `vite-plugin-static-copy`.

Deployment is manual and intentionally so:

```bash
clasp push      # pushes dist/ to the Apps Script project
```

Then publish a new web app version from the Apps Script editor. Note that the editor always runs the latest pushed code, but end users see the last *published* version.

## Data model

Six sheets, defined and kept in sync by `MigrationService.SCHEMA`: `member`, `workout_records`, `workout_logs`, `workout_weeks`, `rewards_log`, `logs`. Running `run_setupDatabase()` creates missing sheets as native Tables and appends any missing columns to existing ones.

### Weeks (`workout_weeks`)

This table drives almost every calculation in the system, and three rules govern it:

**A week is identified by its `start_date`.** `year`, `month` and `week_number` are labels the admin assigns **by hand** — a week starting on the last day of a month may belong to the next month's week 1, and a month whose first week is a rest week may call its second week "workout week 1". None of that can be derived, so those three columns are never used to locate the row to update.

**`is_rest_week` is the single source of truth for rest weeks.** Rest weeks used to be encoded as `week_number = 0`, which caused three problems: every rest week in a month collided on the same `(year, month, 0)` key; `0` is falsy in JavaScript, so `if (weekNumber)` guards skipped rest weeks silently; and toggling a week out of rest lost the number the admin had chosen. A rest week's `week_number` is now a preserved value (`0` = never assigned) with no join meaning.

**`(year, month, week_number)` is the join key for `workout_records`, and must be unique among non-rest weeks only** — that set is exactly the set of weeks that can hold records.

Saving the planner rewrites every row whose `start_date` falls inside the submitted span, rather than upserting row by row: the composite key the old code matched on was the very thing the admin was editing, so renumbering a week left the stale row behind as a duplicate. The rewrite carries `id` and `created_at` over from the row with the same `start_date`, leaves rows outside the span untouched, keeps the sheet sorted by `start_date`, and validates the whole payload before touching the sheet — duplicate labels, missing week numbers, and rows inside the span that the planner did not produce all abort the save with no partial write.

## Operational scripts

Run these from the Apps Script editor. Dry-run variants only write to the log.

| Script | Purpose |
| --- | --- |
| `run_setupDatabase()` | Create missing sheets and append missing columns |
| `run_migrateWorkoutWeeksRestFlag()` | Dry run: migrate `workout_weeks` to the `is_rest_week` schema |
| `run_applyWorkoutWeeksRestFlagMigration()` | Apply the above — adds the column, collapses rows sharing a `start_date` (keeping the most recently created), and backfills the flag from the legacy `week_number === 0` encoding. Idempotent, and leaves `workout_records` joins intact |
| `run_recalculateWorkoutCounts(fromDate)` | Dry run: recompute weekly counts from the actual logs |
| `run_applyRecalculatedWorkoutCounts(fromDate)` | Apply the above. Updates `count` only, preserving `super_pass` and `note`. Idempotent |

`run_removeDuplicateWorkoutWeeks()` is **deprecated and disabled**: it deduplicated on `(year, month, week_number)`, which is not a week's identity, and kept the first occurrence — on a renumbered week that meant deleting the corrected row and keeping the stale one.

## Business rules

- **Workout success**: 3 or more certifications in a week, or 1 or more combined with a Superpass.
- **Superpass**: usable once per calendar month (by the week's assigned month), and never with zero certifications. Enforced on both the client and the server.
- **Rewards**: quarterly, based on cumulative successful weeks and total certifications. Rest weeks are excluded from every denominator.
- **Rest weeks**: hold no records. Admin entry is blocked, chatbot certification is rejected with an explanation, and they are excluded from rankings, success rates and reward recommendations.

## Documentation

- [`docs/기능명세서.md`](docs/기능명세서.md) — functional specification (Korean)
- [`docs/사용자가이드.md`](docs/사용자가이드.md) — user guide for admins (Korean)
