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
