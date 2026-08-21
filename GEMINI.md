# Gemini Rules for JSOG Member Management System (v1.2.0)

## Core Technical Standards
- **Build Requirement**: ALWAYS run `npm run build` after any code change. This triggers the `post-build.js` script which extracts Vue templates for GAS compatibility. **NEVER run `clasp push` or deploy the application.** The user will manually review the code and deploy it themselves.
- **Frontend Architecture**: Vue 3 (Composition API) with Tailwind CSS. Specialized components use **Chart.js** (Analytics) and **snapdom** (Screenshots, loaded via dynamic import). Form inputs are built with native primitives and IMask for specialized validation.
- **Backend Architecture**: Modular GAS services (Member, Workout, Reward, Log) linked via `Api.js`.
- **Date Handling**: Use `YYYY-MM-DD` string format for all GAS/Frontend transfers. Use `parseToLocalParts` helper for safe local date manipulation.

## Specific Business Rules
- **Ranking (Top 3)**: Use joint-tie logic. If three members are tied for 1st, they fill all top 3 slots. Sort rankings and charts by cumulative count descending.
- **Refund Eligibility**: ≥3 certifications/week OR ≥1 certification with a Superpass.
- **Success Rate** (member modal, reward recommendation): counts only weeks with ≥3 real certifications — Superpass weeks are excluded. Denominator is the quarter's non-rest weeks that have already started.
- **Security**: Admin access is protected by a 4-digit PIN stored in GAS `PropertiesService`. Validation is server-side.

## UI/UX Standards
- **Indigo Theme**: All views must use the Indigo design system (headers `bg-indigo-50/30`, rounded-3xl containers).
- **Sticky Layout**: Maintain 3-layer sticky headers (GNB > Title > List Header). To avoid overlap with the taller GNB on mobile (which has horizontal tab menus), use responsive top offsets (`top-28 md:top-16` for Title).
- **Modal Layout**: Modals containing list items (e.g. workout logs) must be responsive. Use stacked cards with inline labels on mobile, and traditional grid/table row layout on desktop (e.g., using `sm:contents` or grid-cols-12).
- **Interactivity**: Charts must support legend-based highlighting (thick/vivid for focused, thin/dimmed for others).
