---
phase: 02
slug: portfolio-galleries
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-06
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright `@playwright/test` (e2e) + Vitest (unit) — both already scaffolded in Phase 1 |
| **Config file** | `playwright.config.ts`, `vitest.config.ts` (existing — no Wave 0 install needed) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npm run build && npx playwright test && npx vitest run` |
| **Estimated runtime** | ~30-60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run` (fast unit check on gallery query/data functions)
- **After every plan wave:** Run `npm run build && npx playwright test && npx vitest run` (full suite)
- **Before `/gsd:verify-work`:** Full suite must be green, plus a manual CMS walkthrough (Romane's routine-task check, see Manual-Only Verifications)
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-XX-TBD | TBD | TBD | PORT-01 | — | Gallery listing renders all migrated galleries in manual `orderRank` order | e2e | `npx playwright test tests/e2e/gallery.spec.ts -g "listing order"` | ❌ W0 | ⬜ pending |
| 02-XX-TBD | TBD | TBD | PORT-02 | — | Lightbox opens on click, navigates via prev/next buttons, arrow keys, and touch swipe, closes and returns focus to trigger | e2e | `npx playwright test tests/e2e/gallery.spec.ts -g "lightbox"` | ❌ W0 | ⬜ pending |
| 02-XX-TBD | TBD | TBD | PORT-03 | — | Bilingual artist statement renders correctly on both `/galleries/[slug]` and `/en/galleries/[slug]`, with null-safe fallback if a locale value is missing | unit + e2e | `npx vitest run tests/unit/gallery-query.test.ts` + `npx playwright test tests/e2e/gallery.spec.ts -g "statement"` | ❌ W0 | ⬜ pending |
| 02-XX-TBD | TBD | TBD | CMS-01 | — | Romane can add/edit/reorder galleries and images in Sanity Studio without developer help | manual | N/A — see Manual-Only Verifications | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Task IDs are placeholders — the planner assigns real IDs; this table's Requirement/Test Type/Command columns are binding, IDs get filled in once PLAN.md exists.*

---

## Wave 0 Requirements

- [ ] `tests/e2e/gallery.spec.ts` — covers PORT-01 (listing order), PORT-02 (lightbox open/nav/close/focus-return), PORT-03 (statement rendering, both locales)
- [ ] `tests/unit/gallery-query.test.ts` — covers `getGalleries()`/`getGallery(slug)` data-shape and null-safety (mirrors Phase 1's `getSiteSettings()` test pattern)
- [ ] Seed content: at least 2 galleries with multiple images and both-locale statements in the Sanity dataset before e2e tests can run against real data

*No new framework install needed — Playwright and Vitest are already configured from Phase 1.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Romane can independently add a new gallery, upload/reorder images, and edit the bilingual statement in Sanity Studio | CMS-01 | Requires the actual non-technical end user completing a routine task unassisted — not automatable, consistent with Phase 1 pitfalls research's verification approach | Have Romane log into Sanity Studio and create one new gallery entry end-to-end without developer assistance; confirm it appears correctly on the live site after rebuild |
| Lightbox touch-swipe navigation feels correct on a real mobile device | PORT-02 | Playwright can simulate touch events but real-device gesture feel/performance needs a manual check | Open a gallery on an actual phone/tablet, swipe left/right through images, confirm smooth navigation and no accidental page-scroll |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
