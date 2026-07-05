# Project Research Summary

**Project:** Atelier Jacqueline Suzanne — Website
**Domain:** Bilingual (FR/EN) photographer/artist portfolio with integrated low-volume fine-art e-commerce, near-zero budget, built by a developer for a non-technical family member
**Researched:** 2026-07-05
**Confidence:** MEDIUM-HIGH

## Executive Summary

This is a small, content-heavy artist portfolio with a real (not inquiry-based) shop bolted on — a well-trodden category the ecosystem has converged on solving with a **Jamstack-with-islands** architecture: a static-site generator (Astro) pulling content and product/stock data from a headless CMS (Sanity), with a couple of thin serverless functions (on Cloudflare Pages) handling Stripe Checkout session creation and webhook-driven stock decrements. No traditional backend or database is needed — the CMS document store doubles as the inventory system. This stack was chosen specifically because Cloudflare Pages has uncapped free-tier bandwidth (the binding constraint for an image-heavy site, where Vercel/Netlify free tiers are a real risk) and Sanity's free plan comfortably covers a single-artist catalog with zero recurring cost. Total baseline recurring cost is 0€/month; the only unavoidable cost is Stripe's per-transaction fee (~1.5% + €0.25 domestic).

The recommended approach treats three things as first-class from day one rather than retrofits: (1) **bilingual content** — FR/EN cross-cuts every content type, URL, and transactional email, so locale-aware fields belong in the initial content model, not a later "translation phase"; (2) **stock correctness** — because originals are one-of-a-kind, the CMS must be the single source of truth for stock, with server-side re-validation at Checkout Session creation (not just on payment success) to prevent overselling; and (3) **non-technical maintainability** — Romane must be able to add galleries and exhibitions herself through a real CMS UI, which shapes both the CMS choice and the project's long-term viability once the developer isn't actively involved.

The two biggest risks identified are technical/correctness and legal/administrative, not technology selection. Technically, a stock race condition on one-of-a-kind originals (two simultaneous buyers both "succeeding") is the single worst failure mode — it must be explicitly tested (two concurrent checkout attempts) before the checkout phase is considered done. Administratively, French legal requirements (mentions légales, CGV with correct right-of-withdrawal language, GDPR/cookie consent) and Romane's business registration (SIRET, needed for Stripe payouts to activate) are hard gates that are easy to deprioritize as "not real work" but will block launch or expose legal risk if skipped — both should start on a parallel, non-technical track from the earliest phase rather than being left to the end.

## Key Findings

### Recommended Stack

The stack converges on **Astro 7 + @astrojs/cloudflare on Cloudflare Pages** for hosting/rendering, **Sanity** as the headless CMS (content + product/stock data), and **Stripe Checkout Sessions** (via Cloudflare Pages Functions using the async/Web-Crypto webhook verification path, not Node's `crypto`) for payments. All core version numbers were verified live against the npm registry and official docs (HIGH confidence). This combination keeps the site fully static for all content pages (fast, cheap, SEO-friendly) while a handful of serverless endpoints handle checkout and stock mutation.

**Core technologies:**
- **Astro 7** (`@astrojs/cloudflare` adapter): static-first site framework with islands architecture and built-in i18n routing — ships minimal JS for a mostly-static portfolio+shop.
- **Cloudflare Pages**: hosting + CDN + serverless Functions — the only major free tier with no hard bandwidth cap, critical for an image-heavy site.
- **Sanity** (Content Lake + Studio): headless CMS for galleries, about, exhibitions, and product/stock records — free plan (20 seats, 100GB bandwidth/asset storage, 2 GROQ webhooks) is generous enough to run everything at zero cost, and gives Romane a real editor UI rather than a git-based tool.
- **Stripe** (Checkout Sessions + Webhooks): hosted payment page, no monthly fee, standard for a solo EU seller; requires custom stock-reservation logic since Stripe does not enforce inventory limits itself.
- **`sharp`** (build-time only) + **`@sanity/image-url`**: image optimization pipeline that keeps runtime image bandwidth on Cloudflare's uncapped free tier rather than Sanity's capped quota; must not be relied on for on-demand/SSR image transforms on the Cloudflare Workers runtime (documented incompatibility).

Fallback alternatives worth knowing: Keystatic (git-based CMS) if zero third-party SaaS accounts is a hard requirement; Stripe Payment Links if development time becomes more binding than budget (but this sacrifices auto-synced stock, which is an explicit requirement).

### Expected Features

Feature research strongly confirms the requirements already captured in PROJECT.md are genuine table stakes, not scope creep — no significant gaps or excesses were found between what's "Active" in PROJECT.md and what expert sources say a real photographer/e-commerce site needs.

**Must have (table stakes):**
- Portfolio/gallery browsing grouped by project, About/bio page, exhibitions/agenda list (informational only)
- Product listings with clear price/medium/size/availability across print, original, book/zine, and merch types
- Real cart + checkout (Stripe), with accurate stock/sold-out state (no overselling)
- Shipping cost/delivery-time display for France + EU zones
- Bilingual FR/EN with a persistent, cart-safe language switcher
- Legal pages (mentions légales, CGV, privacy/GDPR), cookie consent, contact form
- Non-technical editing for galleries and exhibitions only (product/shop editing can stay developer-assisted for v1 — deliberately narrower scope)

**Should have (competitive differentiators, v1.x — add after launch validates the core):**
- Certificate of authenticity messaging + edition numbering ("N/M") for originals/limited editions
- Room-view/scale mockup images for prints
- Per-project artist statements beyond the general bio
- Newsletter signup
- Properly implemented bilingual SEO (hreflang, translated metadata/URLs)

**Defer (v2+ / anti-features — explicitly avoid):**
- Print-on-demand fulfillment (conflicts with originals/limited-edition model), multi-vendor/marketplace features, customer accounts, live chat, AR "view on your wall," elaborate framing configurators, worldwide shipping, multi-channel inventory sync, self-service product/shop editing.

### Architecture Approach

The system is a **Jamstack-with-islands** pattern: a headless CMS (content/editing layer) is the single source of truth for both editorial content and stock; a static Astro frontend queries it at build time and renders fully static pages for galleries/about/exhibitions, with small interactive islands (cart, language switcher, lightbox) as the only client JS; a thin serverless layer (two Cloudflare Pages Functions) bridges checkout and stock — one creates the Stripe Checkout Session after re-validating price/stock server-side, the other is an idempotent Stripe webhook receiver that decrements CMS stock and triggers a rebuild. Locale is carried entirely in the URL path (`/fr/*`, `/en/*`) so CDN caching works unmodified per language, and content publishing flows one-directionally from CMS → webhook → rebuild.

**Major components:**
1. **Content/CMS layer (Sanity)** — single source of truth for galleries, about, exhibitions, and product/stock fields, with locale-aware fields for FR/EN.
2. **Frontend/rendering layer (Astro, static + islands)** — renders all pages, owns SEO/performance; only cart, language switcher, and lightbox ship client JS.
3. **Serverless functions layer (Cloudflare Pages Functions)** — `create-checkout-session` (re-validates stock/price server-side, creates a short-expiry Stripe session) and `stripe-webhook` (verifies signature, idempotently decrements CMS stock, sends fulfillment notification).
4. **Stripe Checkout** — hosted payment page; treated purely as a payment executor, never as an inventory system.

Key anti-patterns to avoid: trusting client-submitted price/stock, storing images in the git repo instead of the CMS's asset CDN, maintaining two sources of truth for stock (CMS + Stripe/spreadsheet), and building the portfolio as a client-rendered SPA (hurts SEO/perf for a discovery-driven image site).

### Critical Pitfalls

1. **Overselling one-of-a-kind originals via a stock race condition** — the single worst failure mode (no "reprint and apologize" option for a unique piece). Avoid by treating stock mutation as atomic at Checkout Session *creation* (not just on payment success), using a short `expires_at` on sessions, and handling `checkout.session.expired` to release holds. Must be verified with an explicit two-concurrent-checkout test before the checkout phase is done.
2. **Launching without mandatory French legal pages (mentions légales, CGV, GDPR notice)** — hard legal requirement in France (LCEN, Code de la consommation), independent of business size; not a "polish" task. Must include a real, non-pre-ticked CGV-acceptance checkbox at checkout.
3. **Assuming Stripe "just works" without business registration** — Stripe payouts can be blocked if Romane isn't registered (SIRET) as a business; this has its own administrative lead time and should be flagged as a parallel, non-technical, earliest-phase item, not discovered right before launch.
4. **Free-tier hosting/image bandwidth blown by a photography-heavy site** — mitigated by the chosen stack (Cloudflare's uncapped bandwidth + Sanity's image CDN + build-time `sharp` optimization) but only if upload constraints are enforced so Romane can't accidentally upload unoptimized originals.
5. **Bilingual content drift after launch** — once the developer stops actively reviewing every change, French-only updates (galleries, exhibitions) silently go stale in English. Mitigated by structuring CMS fields so both languages sit side-by-side per document, making omissions visually obvious.
6. **Unmaintainable handoff (bus factor of 1)** — the project must ship with a non-technical runbook for Romane and documented "operator facts" (services, credentials, deploy process) or it will silently rot once Florian isn't actively involved; this is a deliberate deliverable, not an afterthought.

Two additional pitfalls worth carrying into planning: DNS/domain cutover risk when replacing the live Myportfolio site (audit all existing DNS records, especially email/MX, before touching anything), and the mistaken assumption that unique originals are exempt from the 14-day EU right-of-withdrawal (they generally are not, unless made-to-order).

## Implications for Roadmap

Based on combined research, suggested phase structure:

### Phase 1: Foundation & Administrative Kickoff
**Rationale:** Bilingual routing and the CMS content model are cross-cutting concerns that are far cheaper to build in from day one than retrofit later (per FEATURES.md dependency analysis); meanwhile, business registration (SIRET) and DNS/domain audit have their own lead times independent of code and must start in parallel immediately (PITFALLS #3, #7).
**Delivers:** Astro + Cloudflare Pages + Sanity scaffolding deployed to a staging URL; working `/fr/` and `/en/` locale routing; Sanity Studio connected with a first locale-aware content type; DNS zone for atelierjacquelinesuzanne.fr fully audited/documented; Romane's business-registration status confirmed as an explicit checklist item.
**Addresses:** Bilingual FR/EN requirement (infrastructure), non-technical editing infrastructure (CMS access set up).
**Avoids:** Pitfall 6 (bus factor) by choosing the boring/managed stack from day one; Pitfall 3 and Pitfall 7 by starting their long lead-time administrative tracks immediately rather than late.

### Phase 2: Portfolio & Content (Galleries, About, Exhibitions)
**Rationale:** This is the core reason visitors arrive (FEATURES.md) and carries no payment/legal risk, making it the right place to validate the CMS content model and non-technical editing experience before the higher-stakes e-commerce build.
**Delivers:** Migrated galleries (Rebut, Silos, Brume, Adults, etc.), About/bio page, exhibitions/agenda list (reverse-chronological, upcoming/past distinction), build-time image optimization pipeline wired to Sanity's asset CDN.
**Addresses:** Portfolio browsing, About page, exhibitions list, non-technical editing for galleries + exhibitions (all P1 in FEATURES.md).
**Avoids:** Pitfall 4 (image bandwidth) by establishing the CMS-CDN image pipeline now, before large photo volumes accumulate; Pitfall 5 (bilingual drift) by designing CMS fields with FR/EN side-by-side from the start.

### Phase 3: E-commerce Core (Catalog, Stock, Checkout)
**Rationale:** Highest complexity and risk in the project; depends on the content model and stack from Phases 1-2 being in place; this is the project's explicit core value (PROJECT.md) and where the most severe pitfall (overselling) lives.
**Delivers:** Product listings for print/original/book-zine/merch types; client-side cart; `create-checkout-session` and `stripe-webhook` Cloudflare Pages Functions; atomic stock reservation with short session expiry; order confirmation emails; shipping cost/delivery-time display for France + EU zones.
**Uses:** Stripe Checkout Sessions (async webhook verification pattern), Sanity as stock source of truth, Cloudflare Pages Functions.
**Implements:** The `create-checkout-session` / `stripe-webhook` architectural pattern documented in ARCHITECTURE.md, with idempotency on the Checkout Session ID.
**Avoids:** Pitfall 1 (overselling race condition) via server-side stock re-validation at session creation, not just on payment success — must be verified with a concurrent-purchase test before this phase is marked done. Also depends on Pitfall 3 (business registration) being resolved by now, or live payouts will be blocked at the worst possible time.

### Phase 4: Legal & Compliance
**Rationale:** A hard gate on launch, not a "polish" pass — can be drafted in parallel with Phase 3's build but must be resolved before any real transaction goes live.
**Delivers:** Mentions légales (with SIRET), CGV (with delivery zones, right-of-withdrawal terms specific to originals vs. editions, non-pre-ticked acceptance checkbox at checkout), Politique de Confidentialité/GDPR notice, CNIL-compliant cookie consent banner — all bilingual.
**Addresses:** Legally mandatory French e-commerce requirements (FEATURES.md P1).
**Avoids:** Pitfall 2 (missing legal pages) and Pitfall 8 (incorrectly denying right-of-withdrawal on unique originals).

### Phase 5: Launch, Cutover & Handoff
**Rationale:** DNS cutover and long-term maintainability are both one-shot, high-risk activities that research flags as deserving deliberate treatment, not being bundled into a generic "deploy" step.
**Delivers:** Rehearsed DNS cutover (lowered TTLs, preserved MX/email records, redirects for indexed old URLs) from the current Myportfolio site to the new stack; a non-technical runbook for Romane (add a gallery, add an exhibition, check/fulfill an order, who to contact if something breaks); documented operator facts (services, credential locations, deploy process).
**Avoids:** Pitfall 7 (DNS/email breakage during cutover) and Pitfall 6 (unmaintainable handoff) — verified by having Romane complete one routine task using only the written docs, unassisted.

### Phase Ordering Rationale

- Content/i18n infrastructure comes before content population, which comes before commerce, because bilingual routing and the CMS schema are foundational and expensive to retrofit (FEATURES.md dependency graph: bilingual cross-cuts everything).
- E-commerce is deliberately sequenced after the portfolio/content phase so the highest-risk, highest-complexity work (stock correctness, Stripe integration) happens once the underlying content model and CMS habits are already proven with lower-stakes content.
- Legal/compliance runs conceptually in parallel with e-commerce (both can be worked on simultaneously) but is called out as its own phase/gate so it isn't silently deprioritized as "not real work," per Pitfall 2's root cause.
- Administrative tracks (SIRET registration, DNS audit) start in Phase 1 specifically because they have external lead times the code timeline doesn't control — starting them late is the single most avoidable self-inflicted delay identified in PITFALLS.md.
- Launch/handoff is last and treated as its own phase because both of its core risks (DNS cutover, maintainability) are one-shot or long-tail risks that are cheap to prevent up front and expensive to recover from later.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (E-commerce Core):** Cloudflare Workers-specific Stripe webhook verification (`constructEventAsync` + Web Crypto provider), atomic stock reservation pattern implementation details in Sanity, and idempotency handling for retried webhooks — documented but non-trivial integration, worth a `--research-phase` pass.
- **Phase 4 (Legal & Compliance):** Exact CGV/mentions légales legal copy for Romane's specific business status, and the precise right-of-withdrawal wording for originals vs. editions vs. any future commissions — research confirms *that* these are required but not their precise legal text; recommend verification against a French legal resource or accountant, not just developer research.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Astro + Cloudflare + Sanity scaffolding and i18n routing are well-documented, officially supported patterns with verified current versions (STACK.md, HIGH confidence).
- **Phase 2 (Portfolio & Content):** Static content pages and CMS-driven galleries are Astro/Sanity's core, best-documented use case.
- **Phase 5 (Launch & Cutover):** DNS migration and handoff documentation are well-understood, checklist-driven activities rather than novel technical problems.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core framework/hosting/CMS versions verified live against npm registry and official docs; commerce-integration pattern (Stripe + Astro + Cloudflare Workers) verified via official Cloudflare/Stripe docs, though not an Astro-blessed one-liner (community/custom pattern). |
| Features | MEDIUM-HIGH | Table-stakes and legal requirements converge strongly across multiple sources including an official French government source; differentiator value judgments are reasoned but inherently more subjective; exact CGV legal wording needs a final legal-copy pass, not just research. |
| Architecture | HIGH (patterns) / MEDIUM (exact free-tier numbers) | Component boundaries, data flow, and Astro/Sanity/Stripe integration patterns verified against official docs; specific free-tier quota numbers shift over time and should be re-verified immediately before implementation. |
| Pitfalls | MEDIUM-HIGH | Legal/payment mechanics verified against official Stripe/CNIL/gouv.fr sources (HIGH); hosting free-tier specifics and some comparison sources are MEDIUM — re-verify current numbers at implementation time. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Romane's business registration status (SIRET, VAT franchise threshold)** — a non-technical, business/legal question that gates both Stripe payouts and the legal pages; not resolvable by research alone, must be confirmed directly with Romane early (Phase 1).
- **Exact CGV/mentions légales legal text and right-of-withdrawal wording for originals** — research establishes the requirements and structure with high confidence but not Romane-specific final copy; recommend a French legal-resource or accountant review before Phase 4 is considered complete.
- **Current exact free-tier numbers (Cloudflare Pages Functions quota, Sanity API/bandwidth limits, Stripe fee percentages)** — all cited with reasonable confidence from official sources as of 2026-07-05, but these change over time; re-verify immediately before committing during Phase 1 setup.
- **Whether the domain currently has an active email service** — must be confirmed before any DNS cutover in Phase 5; unresolved as of this research and flagged as a specific pre-cutover checklist item.
- **Romane's actual sales volume expectations** — architecture and stock-tracking recommendations assume low order volume (tens/month); if this assumption is wrong, the "rebuild on every sale" and CMS-as-inventory patterns should be revisited sooner.

## Sources

### Primary (HIGH confidence)
- npm registry live queries (2026-07-05) — current package versions (astro, @astrojs/cloudflare, stripe, @sanity/client, etc.)
- https://developers.cloudflare.com/pages/platform/limits/ and /pages/functions/pricing/ — Cloudflare free-tier limits
- https://www.sanity.io/pricing and https://www.sanity.io/docs/platform-management/plans-and-payments — Sanity free-tier limits
- https://docs.stripe.com/payments/checkout/managing-limited-inventory and /product-catalog — official Stripe inventory/checkout guidance
- https://blog.cloudflare.com/announcing-stripe-support-in-workers/ — Stripe SDK on Cloudflare Workers
- https://docs.astro.build/en/guides/internationalization/ — Astro native i18n routing
- https://developers.cloudflare.com/r2/pricing/ — zero-egress object storage confirmation
- https://www.economie.gouv.fr (mentions légales) and https://www.service-public.gouv.fr (droit de rétractation) — official French government sources
- https://www.cnil.fr (cookies/traceurs rules) — official CNIL sources
- https://stripe.com/resources/more/siret-siren-numbers and Stripe support — SIRET requirement for French payouts

### Secondary (MEDIUM confidence)
- WebSearch aggregation on Snipcart pricing, Stripe France fee rates, Keystatic/Decap/TinaCMS comparisons, Cloudflare vs Netlify vs Vercel bandwidth
- GitHub `withastro/adapters` issues #191/#266 — Sharp/Cloudflare runtime incompatibility
- Multiple French legal-guidance blogs (Anov, LegalPlace, lueurexterne) — cross-checked against economie.gouv.fr
- PhotoBiz, PetaPixel, PhotoDeck, Improve Photography, AGI Fine Art, MyArtBroker — fine-art/print-selling feature conventions
- Contemporary Art Issue, Portfoliobox — standard artist-site page structure

### Tertiary (LOW confidence)
- Bello.art print-size chart (single source, general convention only)
- Netlify pricing page overage behavior (unclear at fetch time — re-verify before committing to any alternative host)
- Vercel vs Netlify third-party blog comparisons (directional only)

---
*Research completed: 2026-07-05*
*Ready for roadmap: yes*
