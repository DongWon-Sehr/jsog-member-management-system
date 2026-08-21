# JSOG Member Management System (v1.2.0)

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
  post-build.js        Extracts Vue templates into per-component HTML for GAS
  parse-kakao-chat.js  Turns a KakaoTalk chat export into ChatImportData.js
  run-e2e.js           Resolves the deployment URL and runs the Playwright smoke suite
e2e/               Playwright smoke spec, auth state and screenshot output
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
npm run e2e     # Playwright smoke: screenshots every view/modal on the DEPLOYED web app
```

`npm run e2e` tests the deployed app, not local source — run `npm run build && npx clasp push` first to see your changes. The deployment URL is resolved automatically via `clasp deployments` (override with `BASE_URL=...`); Google login reuses the session saved in `e2e/.auth.json` (refresh it with `PWDEBUG=1 npm run e2e`). Screenshots land in `e2e/screenshots/`.

`npm run build` must be run after **any** change. Vite bundles the frontend, then `scripts/post-build.js` extracts each Vue component's `<template>` into a standalone HTML file and rewrites `index.html` into a GAS template. Backend `.js` files are copied into `dist/` untouched by `vite-plugin-static-copy`.

Deployment is manual and intentionally so:

```bash
clasp push      # pushes dist/ to the Apps Script project
```

Then publish a new web app version from the Apps Script editor. Note that the editor always runs the latest pushed code, but end users see the last *published* version.

## Data model

Six sheets, defined and kept in sync by `MigrationService.SCHEMA`: `member`, `workout_records`, `workout_logs`, `workout_weeks`, `rewards_log`, `logs`. Running `run_setupDatabase()` creates missing sheets as native Tables and appends any missing columns to existing ones.

`run_setupDatabase()` only ever *adds* — it appends missing column names to an existing sheet's header row but never changes a column's type, so a type migration needs its own script (see `run_applyRewardsLogTypesMigration()`). Note also that Sheets refuses `setNumberFormat()` on a column of a native Table: the column type is what drives the display, so retyping comes first and the values are written after.

### Weeks (`workout_weeks`)

This table drives almost every calculation in the system, and three rules govern it:

**A week is identified by its `start_date`.** `year`, `month` and `week_number` are labels the admin assigns **by hand** — a week starting on the last day of a month may belong to the next month's week 1, and a month whose first week is a rest week may call its second week "workout week 1". None of that can be derived, so those three columns are never used to locate the row to update.

**`is_rest_week` is the single source of truth for rest weeks.** Rest weeks used to be encoded as `week_number = 0`, which caused three problems: every rest week in a month collided on the same `(year, month, 0)` key; `0` is falsy in JavaScript, so `if (weekNumber)` guards skipped rest weeks silently; and toggling a week out of rest lost the number the admin had chosen. A rest week's `week_number` is now a preserved value (`0` = never assigned) with no join meaning.

**`(year, month, week_number)` is the join key for `workout_records`, and must be unique among non-rest weeks only** — that set is exactly the set of weeks that can hold records.

Saving the planner rewrites every row whose `start_date` falls inside the submitted span, rather than upserting row by row: the composite key the old code matched on was the very thing the admin was editing, so renumbering a week left the stale row behind as a duplicate. The rewrite carries `id` and `created_at` over from the row with the same `start_date`, leaves rows outside the span untouched, keeps the sheet sorted by `start_date`, and validates the whole payload before touching the sheet — duplicate labels, missing week numbers, and rows inside the span that the planner did not produce all abort the save with no partial write.

### Members (`member`)

`joined_at` is the day the member joined the group, kept apart from `created_at`, which is only when
the row was written — the list, the CSV and the modal all read `joined_at` and fall back to
`created_at`. It is also the sort key: `useStore` exposes `sortedMembers` (ascending `joined_at`,
then name), and `activeMembers` derives from it, so every screen shares one order instead of
following the sheet's row order.

`bank_type` / `bank_account` hold the refund account. The column is TEXT but the UI keeps only
digits, stripping hyphens and spaces on input, paste and save.

There is no authoritative way to derive a bank from an account number — a bank is identified by a
separate bank code, not by the number, and account formats overlap across banks (우리 `1002…` sits
right next to 토스뱅크 `1000…`), so a loose prefix rule would confidently fill in the wrong bank.
The form therefore leans on the text instead: paste a string that names the bank into *either* field
(`우리 1002-123-456789`) and it splits out the bank and the digits, recognising aliases (`KB`, `카뱅`,
`woori`, `toss`). A typed name is normalised on blur (`우리은행` → `우리`), and a name that is not in
the list is left exactly as typed. Only two banks are inferred from the number itself, where the
prefix is effectively fixed: `3333…` 카카오뱅크 and `1000…` 토스뱅크. Every path only fills an empty
field and is always editable.

### List layout

The member, reward and log tabs share one grid convention: **every column is centre-aligned** on
desktop (header and body together — changing only the header leaves the two out of line) and
left-aligned on mobile, where each row becomes a stacked card with a label to the left of each value.
Long text columns need `min-w-0` for `truncate` to take effect inside the grid.

The refund-account cell gives the bank badge a fixed `68px` width — wide enough for the longest bank
name — so the account numbers all start at the same x instead of stepping in and out with the length
of the bank name. A row with an account but no bank still renders the badge (as `-`) to hold the
column.

### Deployed CSS

`post-build.js` rewrites `index.html` from its own template and **discards Vite's CSS bundle**;
Tailwind is loaded from the Play CDN, which generates utilities from the DOM at runtime. Two
consequences worth knowing before styling anything global:

- **`App.vue`'s `<style>` block never reaches `dist/`.** Rules that must survive the build belong in
  the inline `<style>` of the template inside `post-build.js` (they are mirrored in `App.vue` so
  `npm run dev` looks the same — keep the two in sync).
- Utility-driven animation is unreliable for anything that appears in the first seconds, before the
  CDN has booted. That is why the loading overlay's spinner never actually spun, and why the
  overlay now carries plain CSS instead of `animate-*` classes.

## Operational scripts

Run these from the Apps Script editor. Dry-run variants only write to the log.

| Script | Purpose |
| --- | --- |
| `run_setupDatabase()` | Create missing sheets and append missing columns |
| `run_migrateWorkoutWeeksRestFlag()` | Dry run: migrate `workout_weeks` to the `is_rest_week` schema |
| `run_applyWorkoutWeeksRestFlagMigration()` | Apply the above — adds the column, collapses rows sharing a `start_date` (keeping the most recently created), and backfills the flag from the legacy `week_number === 0` encoding. Idempotent, and leaves `workout_records` joins intact |
| `run_recalculateWorkoutCounts(fromDate)` | Dry run: recompute weekly counts from the actual logs |
| `run_applyRecalculatedWorkoutCounts(fromDate)` | Apply the above. Updates `count` only, preserving `super_pass` and `note`. Idempotent |
| `run_importChatHistory()` | Dry run: backfill weeks, records, logs and rewards from the KakaoTalk chat history |
| `run_applyChatHistoryImport()` | Apply the above. Fill-only — see below |
| `run_migrateRewardsLogTypes()` | Dry run: retype `rewards_log.reward_date` to DATE and `amount` to CURRENCY |
| `run_applyRewardsLogTypesMigration()` | Apply the above — rewrites the values, sets the number formats and retypes the Table columns. Aborts without writing if any value cannot be converted (a period label like `2026-Q1`, an amount like `미정`). Blanks stay blank. Idempotent |

### Importing the chat history

The group's first two years live only in the KakaoTalk chat, as the weekly leaderboard message that
everyone copy-pastes back with their own number bumped. `scripts/parse-kakao-chat.js` reads a chat
export (drop the CSV in `migration/`, which is gitignored) and writes
`src/backend/main/ChatImportData.js`, a generated file holding one entry per week:

```bash
node scripts/parse-kakao-chat.js          # → src/backend/main/ChatImportData.js
```

A week is identified by its start date, snapped to the Monday of its week — the header is typed by
hand and sometimes names the Sunday before. Its `(month, week_number)` label is decided by majority
vote across that week's postings, and its counts come from the posting marked **(최종)/(마감)**, the
admin's close-out, falling back to the last posting for the 8 weeks that were never closed. A 14-day
hole in the sequence is a rest week: no leaderboard is posted for one, and every hole in the export
lines up with a 보너스 휴식 주간 announced in the chat.

Individual workout logs are reconstructed from the same postings. Every posting is a copy of the
previous one with a single number bumped, so **a member's number going up is a certification**, and
the posting's timestamp dates it. The activity and duration come from that member's certification
message just before the bump (`헬스 1시간`), matched once and only once — a workout described again
after the fact must not become a second log. Spellings are normalised against a vocabulary
(`트밀`/`런데이`/`○○런` → 러닝, `PT`/`웨이트`/`등`/`천국의계단` → 헬스, `새태`/`밤테` → 테니스,
`4.7km` → 러닝), while `SNPE`, `F45` and `점핑` stay under their own names. A certification with no
message becomes `기타(알수없음)` 30분, and a message naming an activity without a duration gets the
same 30 minutes. Photos are ignored entirely — they carry no readable information.

**The leaderboard count is the authority**: each member-week gets exactly `count` logs, padded with
`기타(알수없음)` when a bump predates the week's first posting and trimmed (least-evidenced first)
when a number was raised and later corrected down. Every log is dated at midnight and clamped into
the week's span, because the chat records when a certification was *posted*, never when the workout
happened, and a Sunday-night workout is routinely posted after midnight.

`run_importChatHistory()` / `run_applyChatHistoryImport()` in `DataMigration.js` then load it into
the sheet — `ChatImportData.js` stays a separate file only because it is generated and 84 KB of
data. The import is
**fill-only**: the chat is a recollection, the sheet is the record. A `start_date` the sheet already
has is left untouched, labels included, and records are appended per (member, week) only where that
member has no record yet — onto the label *the sheet* gives the week, so a week the admin renumbered
keeps its numbering. A week whose chat label collides with one already in the sheet is skipped with a
warning rather than duplicated, since that label is the join key for `workout_records`. Both runs are
idempotent, and the dry run reports every row the apply run would write.

Rewards are the one part not derived from the chat by machine: each quarterly award is a free-form
announcement with no fixed shape and there are only eight, so they are a curated table in
`parse-kakao-chat.js` (kept there, not in the generated file, so regenerating cannot lose them). They
are matched on (member, `reward_date`). **`amount` is imported empty on purpose** — the prize is
bought out of the pooled unrefunded deposits and its value is never once stated in the chat, so any
number would be invented; fill it in from the reward tab. The dashboard sums amounts with
`parseFloat(...) || 0`, so an empty cell simply does not contribute.

Logs follow the same rule with one extra guard. A member-week that already holds *any* log inside its
span is skipped whole — the chatbot or an earlier run owns it, and adding to it would double-count.
And because `workout_records.count` is recomputed from the logs whenever the week is edited or
`run_applyRecalculatedWorkoutCounts()` runs, logs are only written when their number matches the
count the sheet actually holds; a mismatch is reported and skipped rather than left to silently
rewrite that count later.

`run_removeDuplicateWorkoutWeeks()` is **deprecated and disabled**: it deduplicated on `(year, month, week_number)`, which is not a week's identity, and kept the first occurrence — on a renumbered week that meant deleting the corrected row and keeping the stale one.

## Business rules

- **Refund eligibility**: 3 or more certifications in a week, or 1 or more combined with a Superpass.
- **Success rate** (member modal, reward recommendation): only weeks with 3+ real certifications count — Superpass weeks are excluded. The denominator is the quarter's non-rest weeks that have already started, so an in-progress quarter shows the actual completion rate.
- **Superpass**: usable once per calendar month (by the week's assigned month), and never with zero certifications. Enforced on both the client and the server.
- **Rewards**: quarterly, based on cumulative successful weeks and total certifications. Rest weeks are excluded from every denominator.
- **Rest weeks**: hold no records. Admin entry is blocked, chatbot certification is rejected with an explanation, and they are excluded from rankings, success rates and reward recommendations.

## Documentation

- [`docs/기능명세서.md`](docs/기능명세서.md) — functional specification (Korean)
- [`docs/사용자가이드.md`](docs/사용자가이드.md) — user guide for admins (Korean)
