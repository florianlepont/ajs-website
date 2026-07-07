# Roadmap: Atelier Jacqueline Suzanne — Website

## Overview

This roadmap covers the **v1 milestone only**: a fast, bilingual replacement of the current Myportfolio site with portfolio galleries, an About page, contact, baseline French legal pages, self-service gallery editing for Romane, and a rehearsed DNS cutover to the live domain. The journey starts with the bilingual/CMS/hosting foundation (since French/English and non-technical editing cross-cut every later page), moves through the two content pillars (portfolio, then about/contact), adds the legally-required pages, and ends with the domain cutover that retires the old site. Shop, checkout, shipping, and exhibitions (the v1.x wave) are explicitly deferred and are not represented here.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Bilingual Infrastructure** - Site scaffolding (Astro + OVH Web Hosting + Sanity) deployed with working FR/EN routing and a persistent language switcher (completed 2026-07-06)
- [ ] **Phase 2: Portfolio Galleries** - Visitors can browse migrated galleries and full-size images; Romane can self-serve gallery edits via the CMS
- [ ] **Phase 3: About & Contact** - Visitors can read Romane's bio/practice info and reach her through a spam-protected contact form
- [ ] **Phase 4: Legal & Compliance** - Mentions légales, privacy/GDPR notice, and CNIL-compliant cookie consent are live
- [ ] **Phase 5: Launch & Domain Cutover** - The new site is live at atelierjacquelinesuzanne.fr, replacing the old Myportfolio site

## Phase Details

### Phase 1: Foundation & Bilingual Infrastructure

**Goal**: Establish the technical foundation (Astro static site + OVH Web Hosting + Sanity CMS) with working bilingual routing and a persistent language switcher, so every later content phase builds on proven i18n and CMS plumbing instead of retrofitting it.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: I18N-01, I18N-02
**Success Criteria** (what must be TRUE):

  1. Visitor can access the site under both `/fr/` and `/en/` URL paths with correctly localized UI chrome (nav, footer, etc.).
  2. Visitor can switch language via a persistent switcher that lands them on the equivalent page in the other language.
  3. The site is built as static output and deployed to OVH Web Hosting at a public URL, connected to a live Sanity CMS project with at least one locale-aware content type.

**Plans**: 5 plans
Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Scaffold Astro project + i18n routing config + Playwright/Vitest harness + failing tests (Wave 1)
- [x] 01-02-PLAN.md — Rescoped (D-12/D-13): record confirmed OVH SFTP facts for Phase 5 + wire conditional astro.config.mjs base + enable GitHub Pages staging (Wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-03-PLAN.md — Sanity CMS: project + locale-aware siteSettings singleton + build-time getSiteSettings() helper (Wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-04-PLAN.md — Bilingual UI slice: switcher utility, BaseLayout chrome from Sanity, FR/EN homepages + 404, e2e GREEN (Wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-05-PLAN.md — CI/CD: GitHub Actions build+test+deploy to GitHub Pages (rescoped per D-12) + Sanity rebuild webhook + verify live (Wave 4)

**UI hint**: yes

### Phase 2: Portfolio Galleries

**Goal**: Visitors can browse Romane's photographic work by project/series and view full-size images; Romane can independently add and edit galleries without code.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: PORT-01, PORT-02, PORT-03, CMS-01
**Success Criteria** (what must be TRUE):

  1. Visitor can browse a list of gallery/project pages migrated from the current site (Rebut, Silos, Brume, Adults, The Victorian Tea Room, Paysages, Accumulation, MADO, etc.).
  2. Visitor can open a gallery and view full-size images (lightbox or dedicated view).
  3. Visitor can read a short artist statement for each gallery/project, in both French and English.
  4. Romane can log into the CMS and add, edit, or reorder gallery images and create a new gallery entry without developer help.

**Plans**: 4 plans
Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Gallery schema + Studio drag-ordering + typed read layer (getGalleries/getGallery, image builders) + navLabels.galleries + RED Wave 0 tests (Wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — Site-wide visual identity: BaseLayout Dawn Pink/Woodsmoke/Wild Strawberry tokens, Delight font, two-weight Display system, galleries nav link, homepage Display (Wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 02-03-PLAN.md — Visitor browsing slice: GalleryGrid/GalleryCard + FR/EN listing & detail pages + full content migration (Wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 02-04-PLAN.md — Full-size viewing slice: native-dialog Lightbox island (prev/next/keyboard/touch/counter) + wiring + CMS-01 & live verification (Wave 4)

**UI hint**: yes

### Phase 3: About & Contact

**Goal**: Visitors can learn who Romane is and her artistic/atelier practice, and can reach her directly through a spam-protected contact form.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: ABOUT-01, ABOUT-02, CONT-01, CONT-02
**Success Criteria** (what must be TRUE):

  1. Visitor can read an About page covering Romane's background and artistic approach, in both French and English.
  2. Visitor can read atelier/practice information (where she works, medium, techniques) on the About page.
  3. Visitor can submit a contact form and the message reaches Romane.
  4. Automated/bot submissions are blocked by a honeypot (or equivalent) without impacting real visitors.

**Plans**: TBD
**UI hint**: yes

### Phase 4: Legal & Compliance

**Goal**: The content-only v1 site meets baseline French/EU legal requirements before public launch.
**Mode:** mvp
**Depends on**: Phase 1, Phase 3
**Requirements**: LEGAL-01, LEGAL-03, LEGAL-05
**Success Criteria** (what must be TRUE):

  1. Visitor can view a mentions légales page showing site owner identity, hosting provider, and business status, in both French and English.
  2. Visitor can view a privacy policy / GDPR notice describing what data is collected (e.g., via the contact form) and how it's used.
  3. Visitor sees a CNIL-compliant cookie/consent banner before any non-essential cookie is set (or the banner correctly reflects that none are used).

**Plans**: TBD
**UI hint**: yes

### Phase 5: Launch & Domain Cutover

**Goal**: The new site fully replaces the old Myportfolio site at the live domain, with no unplanned downtime or broken email.
**Mode:** mvp
**Depends on**: Phase 2, Phase 3, Phase 4
**Requirements**: LAUNCH-01
**Success Criteria** (what must be TRUE):

  1. Visiting atelierjacquelinesuzanne.fr serves the new site, not the old Myportfolio site.
  2. Any existing email service tied to the domain (MX records) continues to work after cutover.
  3. The DNS cutover was rehearsed/verified (e.g., staging alias tested, TTLs lowered in advance) before the production switch.

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Bilingual Infrastructure | 5/5 | Complete   | 2026-07-06 |
| 2. Portfolio Galleries | 2/4 | In Progress|  |
| 3. About & Contact | 0/TBD | Not started | - |
| 4. Legal & Compliance | 0/TBD | Not started | - |
| 5. Launch & Domain Cutover | 0/TBD | Not started | - |

## Milestone Scope Note

This roadmap covers the **v1 milestone** (portfolio-replacement launch) only. The v1.x wave — exhibitions/agenda (EXHB-01, EXHB-02, CMS-02), shop (SHOP-01..04), checkout (CHK-01..05), shipping (SHIP-01, SHIP-02), commerce-specific legal (LEGAL-02, LEGAL-04), and related bilingual/CMS extensions (I18N-02b, I18N-03, CMS-03) — is tracked in REQUIREMENTS.md's v2 section and will get its own roadmap phases once v1 ships.
