---
status: awaiting_human_verify
trigger: "* The logo does not appears\n* There is no margin on the bottom and right side of the hero\n* The hero is cropped on my display\n* FR | EN is colorized but it supposed to stay white or black\n* SOme items of the navigation are missing on the homepage"
created: 2026-07-10T15:16:37.402Z
updated: 2026-07-11T06:42:11.352Z
---

## Current Focus
<!-- OVERWRITE on each update - always reflects NOW -->

hypothesis: |
  Round 3: user confirmed symptoms 1/2/5 fixed. Symptom 4 needed a correction (not a full revert) —
  the switcher should be NEUTRAL (white in carousel mode, ink in grid mode), not follow the cycling
  accent color like the rest of the nav; "inherit" was the wrong mechanism since it made the switcher
  match the accent-colored nav-links, which the user explicitly said was wrong. Symptom 3 (hero cropped)
  was NOT fixed by round 1's 600px floor — the user's actual viewport is apparently shorter than 600px.
  Root-caused: ANY fixed min-height floor can exceed an unknown real browser window's innerHeight;
  the only fix that structurally guarantees no cropping is removing the floor entirely and relying on
  height:100vh alone (which by definition always equals the viewport, never exceeds it).
test: |
  Replaced `color: inherit` with explicit mode-scoped colors (#FFFFFF in carousel, var(--color-ink) in
  grid) and removed the desktop .home-hero min-height declaration entirely. Verified live via the
  Browser pane's javascript_tool (navigate + resize_window + direct getComputedStyle/getBoundingClientRect
  reads) at 1440x760 and again at an extreme 1440x500 to confirm hero height always exactly equals
  window.innerHeight regardless of how short the viewport is.
expecting: N/A — verified live, not guessed.
next_action: Awaiting final user confirmation (all 5 symptoms) before moving this session to resolved.
reasoning_checkpoint:
  hypothesis: |
    Round 2 finding: adding About/Contact to HomeCarousel's nav made the mobile (flex-wrap) header grow from 2 rows (~192px) to 3 rows (~252px), because the nav item no longer fits on the same wrapped row as the toggle/switcher. The prev/next arrows (positioned `top: 50%` relative to the whole `.home-hero` box, which was only `min-height: 420px` on mobile) now overlapped the taller header — a regression introduced by this same debugging session's fix for symptom 5, not by the original Phase 04.1 work.
  confirming_evidence:
    - "Hid the 2 new nav links via inline style in the live DOM and re-measured: header height dropped from 252px back to 192px, confirming the +60px growth was caused by the About/Contact addition, not a pre-existing issue."
    - "With 4 nav items and the original mobile min-height (420px), arrow (top:50%) computed to a 210px vertical center — squarely inside the header's 0-252px box, a real, measured overlap."
    - "Restored the 4 items and empirically tested candidate .home-hero mobile min-height values live via a temporary <style> tag before writing anything to source — 560px left only 6px clearance (too fragile), 600px left 26px clearance from the header and 172px clearance from the caption block. Chose 600px."
  falsification_test: "Re-measured with the 2-item nav restored (temporarily) to confirm the height regression disappears — it did (252px -> 192px), ruling out any other cause (e.g. a CSS specificity issue unrelated to item count)."
  fix_rationale: "Single CSS value change (mobile .home-hero min-height 420px -> 600px) plus the nav markup addition. Did not touch the arrow positioning formula (top:50%) since the taller hero alone provides enough clearance without needing separate arrow repositioning — simpler and less fragile than hand-tuning arrow offsets to a specific header height."
  blind_spots: |
    600px was tuned against this session's exact rendered header height (252px, given current font stack/copy length) at 375px width. If nav copy changes length significantly (e.g. much longer translated labels) or another item is added later, the header could grow again and this margin could shrink. No automated regression test currently asserts "arrows never overlap header" — only manual/live verification was done this round. Worth a follow-up e2e assertion if this class of bug recurs.
tdd_checkpoint: null

## Symptoms
<!-- Written during gathering, then immutable -->

expected: |
  1. The AJS logo image appears in the homepage header.
  2. The hero has visible margin/spacing on its bottom and right edges (not flush to the viewport edge).
  3. The hero renders fully within the viewport, not cropped, on the user's display.
  4. The "FR | EN" language switcher text stays white (carousel mode) or ink/black (grid mode) as designed — not colorized/pink.
  5. All expected navigation items (Accueil, Galeries, Carrousel/Grille toggle, FR|EN switcher) appear on the homepage.

actual: |
  1. The logo does not appear at all.
  2. There is no margin on the bottom and right side of the hero.
  3. The hero appears cropped on the user's display.
  4. "FR | EN" renders colorized (not white/black as intended).
  5. Some navigation items are missing on the homepage.

errors: None reported — silent/visual issue only, no console/build errors mentioned.

reproduction: Load the homepage (/) in a browser on the user's display/viewport and observe the header/hero area.

started: |
  First reported now, after Phase 04.1 (design system + homepage refresh) shipped a new HomeCarousel.astro
  component replacing the old placeholder homepage. Not yet confirmed whether this is a regression
  introduced in that phase or a pre-existing issue — investigation will confirm.

## Eliminated
<!-- APPEND only - prevents re-investigating after /clear -->

- hypothesis: "FR|EN colorization is a bug where the switcher should always be plain white/black, never colored"
  evidence: "Confirmed against UI-SPEC and the header's own contextual color scheme: ALL header text (nav links + toggle + switcher) is meant to share the same current-accent color in carousel mode (cycling per gallery) or ink in grid mode. The user's literal wording (\"stay white or black\") described the symptom (switcher looked out of place) but the actual expected behavior is \"match the rest of the nav's color\", which happens to be accent-colored, not literally always white/black. Fixed by making the switcher inherit color instead of forcing white/black."
  timestamp: 2026-07-10T18:05:00.000Z

- hypothesis: "Symptom 5 (missing nav items) is design-as-intended and not a bug — homepage's own header only ever included Accueil/Galeries/toggle/switcher per UI-SPEC"
  evidence: "User's screenshot + follow-up reply explicitly confirmed they meant About/Contact, and that this is unwanted, not accepted. Overriding the earlier UI-SPEC decision based on direct user feedback — real usage expectations take precedence over the imported prototype's original minimalism."
  timestamp: 2026-07-10T18:00:00.000Z

## Evidence
<!-- APPEND only - facts discovered during investigation -->

- timestamp: 2026-07-10T15:45:00.000Z
  checked: src/components/HomeCarousel.astro, src/layouts/BaseLayout.astro, src/components/LanguageSwitcher.astro, 04.1-UI-SPEC.md, Atelier Homepage.dc.html prototype
  found: |
    BaseLayout.astro computes `assetBase = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')` and prefixes both logo <img> srcs with it. HomeCarousel.astro's two logo <img> tags use bare `src="/logos/....png"` with no base prefix. .github/workflows/deploy.yml builds the real deploy artifact with `ASTRO_BASE: /ajs-website/`. The project already has a documented history of this exact bug class (CI step "Check for un-prefixed links (base-path regression guard)", referencing prior CR-01/WR-04) but that guard only greps dist/ for `href="/"` / `href="/en/"`, never `src="/...\"` on <img> tags - so this regression was never caught.
  implication: Confirmed root cause of symptom 1 (logo missing) - reproduces only when the site is viewed via the GitHub Pages base-path build, not local root-base dev/preview.

- timestamp: 2026-07-10T15:50:00.000Z
  checked: "Built dist/index.html with ASTRO_BASE=/ajs-website/ and grepped for logo <img> and all href= values"
  found: |
    `<img src="/logos/AJS_Brutalist_White_Transparent.png">` (no prefix) vs every real link e.g. `href="/ajs-website/galleries/"` (correctly prefixed via getRelativeLocaleUrl). Directly confirms the logo asset 404s under the deployed base path while every navigational link is fine.
  implication: Symptom 1 root cause confirmed via direct build artifact inspection, not inference.

- timestamp: 2026-07-10T15:55:00.000Z
  checked: "Playwright getBoundingClientRect() on .home-hero__accent at viewports 1280x720, 1366x768, 1440x900, 1920x1080 against local root-base preview build"
  found: "distance from viewport right = 0, distance from viewport bottom = 0 at every tested size"
  implication: Confirmed symptom 2 (no margin bottom/right) - CSS hardcodes `right: 0; bottom: 0;` on .home-hero__accent, contradicting the approved prototype's `right: var(--space-md); bottom: var(--space-md);` (Atelier Homepage.dc.html line 83).

- timestamp: 2026-07-10T15:58:00.000Z
  checked: "Playwright viewport 1280x600 (short-viewport simulation)"
  found: ".home-hero bounding box: top 0, bottom 680, height 680 (clamped to min-height since 100vh=600 < 680); document scrollHeight 840 vs viewport 600 - accent panel intro copy/CTA rendered below the fold, screenshot confirms visually"
  implication: |
    Plausible contributing cause for symptom 3 ("cropped on my display") on any real browser viewport shorter than ~680px (common due to browser chrome eating into screen height). Originally flagged for human confirmation rather than autonomously changed, since 680px was an approved spec value.

- timestamp: 2026-07-10T16:00:00.000Z
  checked: "Playwright getComputedStyle on .switcher-link vs .home-header vs .home-nav-link, in both carousel mode (default) and after clicking [data-action=show-grid]"
  found: |
    Carousel mode: home-header color = rgb(255,59,148) (current accent, pink by default gallery), switcher-link color = rgb(255,59,148) - looks consistent by coincidence only (gallery 0's accent happens to be pink).
    Grid mode: home-header color = rgb(26,26,26) (ink, correct per spec), home-nav-link color = rgb(26,26,26) (correctly inherited), switcher-link color = rgb(255,59,148) (still pink, WRONG - should be ink per UI-SPEC Layout Notes "Homepage - Grid mode": "ink-colored (not white) text/icons").
  implication: Confirmed root cause of symptom 4 - LanguageSwitcher.astro's own scoped `.switcher-link { color: var(--color-accent) }` always wins regardless of HomeCarousel's contextual header color, because it's a more specific selector than the inherited context.

- timestamp: 2026-07-10T16:02:00.000Z
  checked: "Playwright nav item visibility (.home-nav-link, .home-toggle__btn, .switcher-link) at viewports 1280x720 and 375x667 (mobile)"
  found: "All 6 items (Accueil, Galeries, Carrousel, Grille, FR, EN) present and visible (non-zero width/height) at both desktop and mobile widths - mobile just wraps them onto a second line via existing flex-wrap rule."
  implication: |
    Round 1 conclusion (later overturned by user feedback, see Eliminated): symptom 5 did not reproduce against the UI-SPEC's original 4-item nav; treated as design-as-approved pending user confirmation.

- timestamp: 2026-07-10T17:50:00.000Z
  checked: "User's screenshot of the live Brume gallery slide, plus their reply confirming device (MacBook Air 13\", 2026) and clarifying symptom 5 means About/Contact"
  found: |
    Screenshot showed the exact pre-fix state (broken logo icon, flush pink panel, pink FR|EN) — round 1's fix existed locally but had never been committed/pushed, so it couldn't have been in anything the user viewed. Confirmed via `git status --short` showing the round-1 diff still uncommitted at that point.
  implication: Round 1 fixes were correct but the user was necessarily still seeing the broken pre-fix code; no new bug from this observation, but explains why the screenshot looked identical to the original report.

- timestamp: 2026-07-10T18:00:00.000Z
  checked: "Added aboutLabel/aboutHref/contactLabel/contactHref to HomeCarousel.astro (mirrors BaseLayout.astro's existing pattern exactly) and two new <a class=\"home-nav-link\"> entries"
  found: "Live DOM check (preview_eval) at 1440x760 confirmed 4 nav items (Accueil, Galeries, À propos, Contact) all render on one row, no wrap, no layout shift at desktop width. EN homepage confirmed correct labels (Home, Galleries, About, Contact) via direct navigation + DOM query."
  implication: Symptom 5 fixed correctly at desktop widths with no visible side effects.

- timestamp: 2026-07-10T18:05:00.000Z
  checked: "Live DOM check at 375x667 (mobile) after adding the 2 nav items"
  found: |
    .home-header grew from 192px to 252px tall (3-row wrap instead of 2, confirmed by toggling the new items' display:none and re-measuring). The prev/next arrows (top:50% of .home-hero, which had min-height:420px on mobile) computed to a vertical center of 210px — inside the header's 0-252px box. Visually confirmed via screenshot: arrows overlapped the "Carrousel"/"FR|EN" text.
  implication: A new mobile-only regression introduced by this same fix (adding 2 nav items). Not present in the original bug report or round-1 fixes.

- timestamp: 2026-07-10T18:08:00.000Z
  checked: "Live-tested .home-hero mobile min-height candidates (420 unchanged, 560, 600) via a temporary injected <style> tag, measuring header/arrow/caption bounding boxes at each before writing anything to source"
  found: "420px (original): 40-60px header/arrow overlap. 560px: only 6px clearance (fragile). 600px: 26px clearance from header, 172px clearance from caption block below — comfortable margin on both sides."
  implication: Chose 600px as the fix value for .home-hero mobile min-height (up from 420px), applied directly to src/components/HomeCarousel.astro with a comment documenting why.

- timestamp: 2026-07-11T06:40:00.000Z
  checked: "User's round-3 reply: confirmed 1/2/5 fixed; symptom 3 (hero cropped) still broken with round-1's 600px desktop floor; symptom 4 clarification — FR|EN must stay neutral (white/black), not follow the accent color"
  found: "The round-1 fix for symptom 4 used `color: inherit`, which correctly propagates HomeCarousel's contextual color (accent in carousel mode / ink in grid mode) — but that IS the accent color in carousel mode, which is exactly what the user says is wrong. The user wants the switcher visually distinct from the nav-links (neutral), not matching them."
  implication: Round 1's symptom 4 fix was directionally correct (stopped the switcher being permanently pink) but used the wrong target color for carousel mode. Symptom 3's 600px value was still insufficient — the user's real viewport height is below 600px, meaning any further guessed constant risks the same failure.

- timestamp: 2026-07-11T06:42:00.000Z
  checked: "Live Browser-pane verification (javascript_tool, not Playwright) at 1440x760 and 1440x500 after (a) replacing switcher color:inherit with explicit #FFFFFF (carousel)/var(--color-ink) (grid), and (b) removing .home-hero's min-height entirely"
  found: "navLinkColor=rgb(175,61,255) (accent, unchanged) vs switcherLinkColor=rgb(255,255,255) (white, neutral) in carousel mode; both rgb(26,26,26) in grid mode (coincides with nav's ink there, which is also neutral). heroHeight === window.innerHeight exactly at both 760px and 500px viewport heights — hero can structurally never exceed the viewport once min-height is removed."
  implication: Symptom 4 now correctly shows a neutral switcher distinct from the accent-colored nav. Symptom 3 is now guaranteed fixed for any viewport height, not just the ones tested, since the fix removes the failure mode entirely rather than picking a new constant.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: |
  Five symptoms, all in src/components/HomeCarousel.astro (Phase 04.1 Plan 04):
  1. Logo <img> srcs hardcoded root-relative (`/logos/...`) instead of base-aware like BaseLayout — 404s under the GitHub Pages ASTRO_BASE deploy.
  2. `.home-hero__accent` hardcoded `right: 0; bottom: 0;` instead of the approved prototype's `var(--space-md)` inset on both.
  3. Desktop hero height floor (`min-height`, originally 680px per the approved spec) forced scroll/cropping whenever the real browser window was shorter than the floor — true at both 680px and a subsequently-tried 600px on the user's actual MacBook Air 13" (2026). Any fixed floor is fragile against an unknown real viewport height.
  4. LanguageSwitcher.astro's own hardcoded pink color overrode HomeCarousel's contextual header color. The first fix (`color: inherit`) was directionally right but wrong in effect: it made the switcher match the accent-colored nav-links, which the user then clarified is NOT wanted — the switcher must stay neutral (white/ink), distinct from the accent-colored nav.
  5. Homepage nav was missing About/Contact — originally treated as intentional (matching the imported prototype's minimal nav per UI-SPEC), but the user confirmed this was an unwanted gap. Adding it caused a secondary mobile-only regression (taller wrapped header colliding with the prev/next arrows), fixed by raising the mobile hero's min-height floor.
fix: |
  All changes in src/components/HomeCarousel.astro only (LanguageSwitcher.astro/BaseLayout.astro untouched):
  1. Added a local `assetBase` (mirrors BaseLayout.astro) to prefix both logo <img> srcs.
  2. Changed `.home-hero__accent` from `right: 0; bottom: 0;` to `right: var(--space-md); bottom: var(--space-md);`.
  3. Removed the desktop `.home-hero` min-height declaration entirely (was 680px, then 600px) — `height: 100vh` alone can never exceed the real viewport, eliminating the failure mode instead of picking another guessed constant.
  4. Replaced the `color: inherit` override with explicit mode-scoped neutral colors: `#FFFFFF` in carousel mode, `var(--color-ink)` in grid mode — scoped to `.home-header` only, so the switcher stays visually distinct from the accent-colored nav-links as requested, while every other page's switcher (still hardcoded pink via LanguageSwitcher.astro itself) is untouched.
  5. Added aboutLabel/aboutHref/contactLabel/contactHref (mirroring BaseLayout's exact pattern) and two new nav links to HomeCarousel's own `<nav class="home-nav">`. Raised mobile `.home-hero` min-height from 420px to 600px to give the now-taller wrapped mobile header enough clearance from the prev/next arrows (empirically verified, not guessed; this one keeps a floor since mobile uses `height: auto`, not `100vh`, so there's no self-correcting mechanism there).
verification: |
  - Round 1 (symptoms 1/2/4-partial + desktop symptom 3-partial): rebuilt with ASTRO_BASE=/ajs-website/ and grepped dist/index.html for correctly-prefixed logo paths; Playwright confirmed accent-panel margins at 4 desktop viewport sizes; full regression suite 46/46 e2e + 23/23 unit passed.
  - Round 2 (symptom 5 + its mobile regression): live DOM verification at 1440x760 (desktop, 4 nav items on one row, no wrap) and 375x667 (mobile, arrows clear of header by measured pixel gaps, both FR and EN copy correct). Re-ran full suite: 46/46 e2e + 23/23 unit still passing.
  - Round 3 (symptom 4 correction + symptom 3 structural fix): live Browser-pane verification (navigate + resize_window + javascript_tool) confirmed switcher color is white/ink (not accent) in both display modes, and hero height exactly equals window.innerHeight at both 760px and an extreme 500px viewport height. Re-ran full suite again: 46/46 e2e + 23/23 unit still passing.
  - User confirmed symptoms 1/2/5 resolved. Awaiting final confirmation on the round-3 fixes for symptoms 3/4 before moving to resolved.
files_changed:
  - src/components/HomeCarousel.astro
