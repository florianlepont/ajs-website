# Deferred Items — Phase 2

Out-of-scope discoveries logged during execution, per the executor's scope-boundary rule
(only auto-fix issues directly caused by the current task's changes).

## `npx tsc --noEmit` pre-existing errors (not caused by Plan 02-01)

Discovered during 02-01 Task 3 verification. `npx tsc --noEmit` at the frontend root reports:

- `Cannot find name 'process'` in `astro.config.mjs`, `playwright.config.ts`, and
  `src/lib/sanity.ts` (lines 13-15, unchanged since Phase 1) — missing `@types/node`
  dev dependency. Pre-dates this phase (present since Phase 1's `dc48306`/`63c0675` commits).
- `vitest.config.ts(8,3)`: `Object literal may only specify known properties, and 'test' does
  not exist in type 'UserConfig'` — pre-existing since Phase 1's test-harness commit.

Confirmed via `npx tsc --noEmit 2>&1 | grep -v "Cannot find name 'process'"` that Plan 02-01's
new/modified files (`src/lib/sanity.ts` additions, `src/lib/image.ts`) introduce **no new**
type errors beyond these two pre-existing categories. Not fixed here (out of scope for this
plan); left for a future cleanup task (`npm i --save-dev @types/node` + fixing the
`vitest.config.ts` type shape) — flagging for the phase owner to schedule.

## Plan 02-02 confirmation (BaseLayout/homepage rebrand)

Re-ran `npx tsc --noEmit` after 02-02's changes (`src/layouts/BaseLayout.astro`,
`src/pages/index.astro`, `src/pages/en/index.astro`) — no new errors introduced by these three
files; all reported errors match the pre-existing categories above, plus two more pre-existing
gaps surfaced by 02-01's own additions (also not caused by 02-02): `sanity/schemas/gallery.ts`
and `sanity/schemas/structure.ts` reference `@sanity/orderable-document-list`, and
`sanity/sanity.config.ts` references `@sanity/vision` — both listed in `sanity/package.json`
dependencies but not present in `sanity/node_modules` in this worktree checkout (a fresh
worktree does not run `npm install`). Not fixed here (out of scope, pre-existing dependency
install gap, not a code defect). The `<verify>` command's literal
`grep -q "#F92D97" dist/index.html` also does not match post-build because Vite's CSS minifier
lowercases hex colors in the compiled output (`#f92d97`); confirmed case-insensitively
(`grep -qi`) that the token reaches the built CSS correctly — the source file
`src/layouts/BaseLayout.astro` carries the exact uppercase value the plan's acceptance criteria
checks against.

## Delight variable font sourcing/licensing (Plan 02-02 Task 2, deferred by explicit user choice)

Task 2 of `02-02-PLAN.md` was a `checkpoint:human-action` gate: source the "Delight" variable
typeface (a free Behance release by Rajesh Rajput — not on Google Fonts, any CDN, or npm; the
Behance project page is image-only, not fetchable programmatically), confirm a license
permitting self-hosted commercial web embedding, and place the file at
`public/fonts/delight.woff2`. At the checkpoint, the user explicitly chose **"fallback-only"**
(2026-07-07) rather than block Phase 2 on font sourcing/licensing.

Current state: `src/layouts/BaseLayout.astro` already declares the `@font-face` rule for
`'Delight'` pointing at `/fonts/delight.woff2` with `font-weight: 100 900; font-display: swap;`
(added in Task 1). No file exists at that path yet, so every browser falls through to the
system-font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`)
declared alongside it — the site is fully functional and visually complete (Dawn Pink/Woodsmoke/
Wild Strawberry identity, correct weights via the system font's available weight axis) on this
fallback. No console errors result: the browser only requests the font file when it's actually
needed for a rendered glyph, and Astro's `font-display: swap` avoids a render-blocking wait.

**Follow-up (not scheduled to a phase yet):** source the licensed Delight `.woff2` file(s),
verify web-embedding rights, and place at `public/fonts/delight.woff2` (or update the
`@font-face` `src` to the actual filename) whenever font licensing is resolved — flagging for
the phase/milestone owner to schedule.
