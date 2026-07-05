# Feature Research

**Domain:** Photographer/artist portfolio site with integrated fine-art e-commerce (prints, originals, books/zines, merch)
**Researched:** 2026-07-05
**Confidence:** MEDIUM-HIGH (table stakes and legal requirements are well-documented and consistent across sources; differentiator value is judgment-based; some specifics — e.g. exact CGV wording — need a final legal-copy pass before launch, not just research)

## Feature Landscape

### Table Stakes (Users Expect These)

Features visitors and buyers assume exist on any photographer/artist site that sells work directly. Missing these makes the site feel unfinished or untrustworthy for a purchase decision.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Portfolio/gallery browsing (grouped by project/series) | This is the core reason visitors arrive — to see the work before anything else. Matches the existing site's structure (Rebut, Silos, Brume, Adults, etc.). | LOW-MEDIUM | Needs a grid/gallery view per project + full-size image view (lightbox or dedicated page). Image optimization (responsive sizes, lazy loading) matters a lot for photography — large unoptimized images are the #1 way these sites feel slow. |
| About/bio page | Buyers of art/photography want to know who made it and why before paying. Standard on every artist site reviewed (contemporaryartissue.com, portfoliobox.com, etc.). Third-person editorial bio (100-300 words) is the convention, often paired with a portrait. | LOW | Static content page. No dependency on other systems. |
| Contact page/form | Table stakes for any professional/creative site — commissions, press, custom requests all route through this. Already exists on the current site. | LOW | Simple form + email delivery, or mailto. Needs spam protection (honeypot/reCAPTCHA-lite). |
| Product listings with clear pricing and availability | Buyers need to see price, medium, size, and edition status before adding to cart. This is non-negotiable for a real store — ambiguity kills conversion. | MEDIUM | Distinct product "types" (print, original, book/zine, merch) likely need distinct schemas — see Feature Dependencies below. |
| Cart + real checkout (payment processed online) | The project's explicit core value. Buyers today expect to complete a purchase without emailing back and forth — "DM to buy" or "inquire for price" feels outdated for anything positioned as a real shop. | MEDIUM-HIGH | Requires a payment processor (Stripe is the standard choice for a France-based near-zero-budget indie site — handles SCA/3D Secure required in the EU). |
| Stock/inventory accuracy — sold-out state for one-of-a-kind items, decrementing count for editions | Nothing damages trust faster than buying something already sold, especially for a unique original. Multiple sources (PhotoBiz, Shopify, WooCommerce guides) treat "quantity 1 → auto out-of-stock" as baseline e-commerce behavior, not a differentiator. | MEDIUM | Must prevent overselling under concurrent checkouts (race condition on the last unit) — a correctness requirement, not just a UI nicety. |
| Order confirmation + shipping notification emails | Buyers expect an email receipt and a "your order shipped" notice as a matter of course; absence reads as broken/untrustworthy. | LOW-MEDIUM | Usually comes bundled with the checkout/payment stack (Stripe emails, or CMS/e-commerce plugin emails). |
| Shipping cost and delivery expectations shown before/at checkout | Required by French/EU consumer law (delivery times must be stated) and a basic conversion-killer if hidden until the last step. | LOW-MEDIUM | Scope is already France + Europe (per PROJECT.md) — keep the shipping-zone matrix simple (2 zones: FR, rest of EU). |
| Legal pages: Mentions légales, CGV (Conditions Générales de Vente), Privacy Policy/GDPR notice | Legally mandatory in France for any commercial site selling to consumers (LCEN Article 6 + French Consumer Code). Not optional, not a nice-to-have. | LOW | Static content, but must be legally accurate: identity of the site owner, hosting provider, VAT/business status, right of withdrawal (14-day EU distance-selling right), and a mandatory checkbox at checkout acknowledging the CGV. |
| Cookie/consent banner | GDPR requirement the moment any analytics, embeds, or non-essential cookies are used. | LOW | Can be minimal if the stack avoids third-party trackers; still needed for Stripe/analytics cookies in most setups. |
| Mobile-responsive layout | Majority of portfolio/gallery traffic (especially from Instagram, where the current audience lives — @ajs_romanelepont) is mobile. A gallery site that doesn't work on a phone loses most visitors immediately. | LOW-MEDIUM | Standard responsive design; image-heavy pages need careful mobile performance tuning. |
| Bilingual presentation (FR/EN) with a language switcher | Explicit requirement; also increasingly standard for any European creative/e-commerce site wanting reach beyond one country. Weglot/Shopify guidance confirms: switcher must be visible (header/footer), must not reset the cart, and must be consistent across all pages including checkout and transactional emails. | MEDIUM | Touches nearly everything — content model, URLs, SEO (hreflang), checkout copy, legal pages, and transactional emails all need both languages. This is a cross-cutting concern, not an isolated feature — see Dependencies. |
| Exhibitions/agenda list (upcoming + past, informational) | Standard "third page" on professional artist sites per multiple sources (contemporaryartissue.com: portfolio, bio/CV, contact — exhibitions is the common fourth). Reverse-chronological list with date, location, short description is the established convention. | LOW | Explicitly informational only, no booking (already scoped out in PROJECT.md) — keep it a simple list/CMS collection, not a calendar UI. |

### Differentiators (Competitive Advantage)

Features that aren't required to be "a real shop" but meaningfully improve trust, conversion, or brand feel for a fine-art/photography seller specifically.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Certificate of authenticity (COA) messaging for originals and limited editions | Collectors specifically look for this on limited editions/originals — multiple sources note buyers are reluctant to buy signed/numbered work without one. Cheap to deliver (a PDF or printed insert stating edition number, medium, date, signature) but signals professionalism disproportionate to its cost. | LOW | No software dependency — can be a manual fulfillment step (Romane signs/numbers + includes a COA card) rather than an automated system. Strong value/effort ratio for a near-zero-budget project. |
| Clear "edition of X, this is print N" numbering shown on the product page | Reinforces scarcity/value proposition for limited editions; expected convention in the fine-art print market (e.g., "12/50"). | LOW | Just a data field for editions (current number sold / total). Ties directly into the stock-tracking table-stakes feature — cheap to add once inventory exists. |
| Per-project storytelling (artist statement per gallery/series, not just a generic bio) | Differentiates a genuine artist site from a generic print shop — context per series (why it was made, where, when) adds perceived value and supports higher price points for originals. Current site already implies this structure (named projects like Rebut, MADO). | LOW-MEDIUM | Content-only feature; depends on the CMS content model supporting a text block per gallery, not just images. |
| Room-view / scale mockups for prints | Multiple sources (Improve Photography, FilterGrade) flag this as one of the highest-impact, lowest-cost conversion improvements for print sales — helps buyers judge physical size/impact. | LOW-MEDIUM | Can start with a few generic mockups (e.g., print on a wall) reused across products rather than a bespoke render per piece — keeps cost near zero. |
| Self-service content editing for galleries and exhibitions (already required, but doing it well is a differentiator vs. typical dev-maintained sites) | Most bespoke developer-built artist sites end up bottlenecked on the developer for every update. A genuinely easy non-technical editing flow (per PROJECT.md requirement) is what makes this project succeed operationally long after launch, not just at launch. | MEDIUM | This is the single most consequential "soft" feature for long-term success of the project — worth deliberate UX attention in the CMS choice/config, covered further in STACK/ARCHITECTURE research. |
| Newsletter signup | Common recommendation across artist-business sources (ArtPlacer, Artwork Archive) as the main channel for announcing new editions/exhibitions to past buyers — higher-intent than social media. | LOW | Simple email capture + third-party list provider (free tier). Not required for v1 functionality but very cheap to add and compounds in value over time. |
| Bilingual SEO done properly (hreflang, translated metadata, translated URLs) | Most competitor/DIY sites bolt on translation without proper hreflang, which confuses search engines and splits/duplicates ranking signal. Doing this correctly is a real (if invisible) advantage for organic discovery in two language markets. | MEDIUM | Depends on the framework/CMS's i18n routing support — a stack-level decision, not just content work. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that look appealing for an artist/e-commerce site but would add disproportionate cost, complexity, or risk relative to this project's near-zero-budget, single-maintainer, single-artist context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Print-on-demand (POD) fulfillment integration (Printful/Printify/Gelato/Fine Art America) | Seems to remove fulfillment burden and "de-risk" starting a print shop. | Fundamentally conflicts with this project's model: originals and true limited editions can't be POD (POD is for infinite reproductions), margins drop to 10-20%, and quality control is out of Romane's hands — bad fit for a fine-art positioning where authenticity/quality is the selling point. | Self-fulfilled prints (Romane or a local print lab handles printing/signing/numbering/shipping), which is also what makes COAs and hand-numbering credible. |
| Multi-vendor marketplace features (other artists selling on the same site, reviews/ratings on products) | Marketplaces like Artfinder/UGallery show these work well and drive "social proof." | This is a single-artist personal site, not a marketplace — adds moderation, trust, and payout-splitting complexity with zero benefit here. Product reviews on one-of-a-kind art are also low-signal (nothing to compare against once sold). | Skip entirely; trust is built via the artist's own bio, exhibition history, and COA, not crowd reviews. |
| Worldwide shipping / multi-currency automatic conversion | "Why limit the market?" is a natural instinct once a checkout exists. | Already explicitly out of scope in PROJECT.md — customs paperwork, VAT/duties, and carrier complexity scale non-linearly outside France+EU, and this is a near-zero-budget one-person operation with no fulfillment staff. | France + rest-of-Europe shipping only for v1; revisit only if demand clearly justifies the operational overhead. |
| Exhibition booking/RSVP or ticketing | Feels like a natural "upgrade" once an exhibitions list exists. | Already explicitly out of scope. Turns a static content page into a system needing capacity management, confirmations, and possibly payments for ticketed events — disproportionate for what's meant to be an informational agenda. | Plain reverse-chronological list of dates/locations/descriptions; link out to a gallery's own RSVP system if one exists for a specific show. |
| Elaborate framing/matting configurator (choose frame color, mat width, glass type per print) | Big print-on-demand platforms (Fine Art America, WHCC) offer this and it looks feature-rich. | High implementation complexity (pricing matrix explodes combinatorially) for a shop that's explicitly not print-on-demand at scale; also implies fulfillment infrastructure (framing partner/inventory) this project doesn't have. | Offer a small, fixed number of print sizes and at most "framed / unframed" as a single binary option if requested later — not a full configurator. |
| Live chat / AI chatbot for customer support | Feels modern, seen on larger e-commerce sites. | Needs someone (Romane) monitoring it in real time or it becomes a broken promise; adds a third-party tool/cost for a low-volume single-artist shop. | Contact form + normal email response time is sufficient at this scale. |
| Customer accounts with order history, wishlists, saved addresses | Standard on large e-commerce platforms, feels like it "should" exist. | Adds authentication, password reset, and account-management surface area for what will likely be a low-frequency, often one-time purchase per customer (unique/limited art, not repeat consumables). | Guest checkout with an emailed receipt/order confirmation is sufficient; Stripe can store card details for repeat buyers without a full account system. |
| Real-time inventory sync across multiple sales channels (Instagram Shopping, Etsy, this site, in-person sales) | Romane may sell in person (exhibitions) and via Instagram too, so "keep it all in sync automatically" sounds appealing. | Multi-channel inventory sync is a genuinely hard problem (webhooks, conflict resolution) disproportionate to a single-artist near-zero-budget site, especially for one-of-a-kind items where a double-sale is embarrassing but recoverable (refund + apology), not catastrophic. | Manually mark an item sold/out-of-stock on the site immediately after an in-person or Instagram sale; keep the site as the single source of truth for online stock only. |
| "View on your wall" AR feature | Cutting-edge feel, some larger print platforms have started offering it. | High implementation complexity (camera access, AR rendering) for uncertain conversion lift versus simple room-view mockup images, which research shows deliver most of the same benefit far more cheaply. | Static room-view mockup images per print size (see Differentiators). |

## Feature Dependencies

```
Bilingual presentation (FR/EN)
    └──cross-cuts──> Portfolio/galleries, Product listings, Exhibitions, About, Checkout, Legal pages, Emails
                       (every content type and transactional flow needs both languages; this is not an
                       isolated feature to build once — it's a constraint on the content model from day one)

Product listings (with type: print / original / book-zine / merch)
    └──requires──> Stock/inventory tracking (per-unit for originals, per-edition-count for limited editions)
                       └──requires──> Cart + checkout (payment)
                                          └──requires──> Order confirmation emails
                                          └──requires──> Shipping cost calculation (FR / EU zones)
                                          └──requires──> Legal pages (CGV acceptance checkbox at checkout, GDPR)

Certificate of authenticity / edition numbering
    └──enhances──> Product listings (originals, limited editions specifically — not needed for books/merch)
    └──depends on──> Stock/inventory tracking (numbering requires knowing "this is unit N of M")

Portfolio/gallery browsing
    └──enhances──> Product listings (a print's product page often IS a photo already shown in a gallery —
                       shared image assets/content model between "portfolio" and "shop" reduces duplicate work)

Self-service content editing (non-technical)
    └──requires──> Portfolio/gallery content to live in a CMS, not hardcoded
    └──requires──> Exhibitions/agenda content to live in a CMS, not hardcoded
    (per PROJECT.md, product/stock editing is NOT required to be self-service for v1 — only galleries + exhibitions)

Exhibitions/agenda list
    └──independent──> no dependency on e-commerce or portfolio systems; can ship as a standalone content page

Room-view mockups
    └──enhances──> Product listings (print products specifically)

Newsletter signup
    └──independent──> no dependency on other features; can be added at any point
```

### Dependency Notes

- **Bilingual presentation cross-cuts almost everything:** this is the most important dependency to plan for early. It is far cheaper to build every content type (galleries, products, exhibitions, legal pages, checkout, emails) with translation as a first-class concern from the start than to retrofit i18n onto an English/French-only build later. This should influence phase 1 architecture, not be deferred to a "translation phase."
- **Stock tracking must exist before real checkout is trustworthy:** selling an original or a numbered edition without atomic stock decrement risks overselling a one-of-a-kind item, which is reputationally worse for a fine-art seller than for a generic retailer (there's no "reprint and apologize" option for an original). This makes inventory correctness a phase-1-adjacent requirement, not a later refinement.
- **COA/edition numbering depends on stock tracking:** you cannot credibly print "3/25" on a certificate or product page unless the system (or Romane's manual process) knows how many of that edition have sold. This can be fully manual at launch (Romane keeps track) as long as the site enforces the "sold out" cutoff automatically.
- **Self-service editing scope is deliberately narrow per PROJECT.md:** only galleries and exhibitions need to be non-technical-editable for v1 — product/shop management can remain developer-assisted initially, which meaningfully reduces v1 CMS/architecture complexity. Don't over-build a full self-service commerce backend if it's not required yet.
- **Portfolio and shop product images can share a content model:** since prints are literally the photographs already organized into galleries, treating "gallery image" and "sellable print" as the same underlying asset (with commerce fields added) avoids duplicate uploads and keeps Romane's content-editing burden low.

## MVP Definition

### Launch With (v1)

This maps directly to the "Active" requirements already captured in PROJECT.md — the research confirms none of these are excessive; they represent genuine table stakes for "a real portfolio + shop," not scope creep.

- [ ] Portfolio/gallery browsing across existing projects — the core reason visitors arrive
- [ ] About/bio page — required for buyer trust and standard on any artist site
- [ ] Exhibitions/agenda list (informational, reverse-chronological) — standard "third page" convention
- [ ] Product listings for prints, originals, books/zines, merch — the store itself
- [ ] Real cart + checkout (Stripe) — the explicit core value of the project
- [ ] Stock tracking (sold-out for originals, decrementing counts for editions) — non-negotiable correctness requirement once real money changes hands
- [ ] Shipping to France + rest of Europe with clear cost/delivery-time display — legal + trust requirement
- [ ] Bilingual FR/EN with a persistent, cart-safe language switcher — explicit requirement, cross-cuts everything
- [ ] Contact page/form — baseline expectation
- [ ] Legal pages: mentions légales, CGV, privacy/GDPR notice, cookie consent — legally mandatory in France
- [ ] Non-technical editing for galleries and exhibitions — required for Romane's independent operation post-launch

### Add After Validation (v1.x)

Add once the core shop is live and generating real orders — these compound the shop's effectiveness but aren't required to prove the concept works.

- [ ] Certificate-of-authenticity insert/PDF for originals and limited editions — trigger: first original/edition sales, cheap to add manually
- [ ] Edition numbering displayed on product pages ("N/M") — trigger: once limited editions are actually in the catalog and stock tracking is proven reliable
- [ ] Room-view mockup images for prints — trigger: if print conversion seems lower than expected, or simply as a quick post-launch polish pass
- [ ] Newsletter signup — trigger: once there's a first cohort of buyers/visitors worth retaining
- [ ] Per-project artist statements (beyond the general bio) — trigger: time allows content-writing after launch mechanics are done

### Future Consideration (v2+)

Defer until the core shop has real usage data and Romane's operational rhythm is established.

- [ ] Self-service editing extended to products/shop inventory — defer until it's clear this bottleneck actually matters in practice (v1 keeps this developer-assisted deliberately)
- [ ] Expanded shipping beyond Europe — defer until there's demonstrated demand that justifies the customs/duties complexity
- [ ] Any of the anti-features listed above (POD, marketplace features, accounts, live chat, AR, framing configurator) — defer indefinitely unless a specific, evidenced need emerges

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Portfolio/gallery browsing | HIGH | MEDIUM | P1 |
| Real checkout (Stripe) | HIGH | HIGH | P1 |
| Stock tracking (originals + editions) | HIGH | MEDIUM | P1 |
| Bilingual FR/EN | HIGH | MEDIUM-HIGH | P1 |
| About/bio page | MEDIUM | LOW | P1 |
| Exhibitions/agenda list | MEDIUM | LOW | P1 |
| Legal pages (mentions légales, CGV, GDPR) | HIGH (legally required) | LOW | P1 |
| Contact form | MEDIUM | LOW | P1 |
| Non-technical editing (galleries + exhibitions) | HIGH (long-term) | MEDIUM | P1 |
| Shipping FR + EU with cost display | HIGH | LOW-MEDIUM | P1 |
| Certificate of authenticity | MEDIUM | LOW | P2 |
| Edition numbering display | MEDIUM | LOW | P2 |
| Room-view mockups | MEDIUM | LOW-MEDIUM | P2 |
| Newsletter signup | LOW-MEDIUM | LOW | P2 |
| Per-project artist statements | LOW-MEDIUM | LOW | P2 |
| Self-service product/shop editing | MEDIUM | HIGH | P3 |
| Worldwide shipping | LOW (for this artist's stage) | HIGH | P3 |
| Framing configurator, accounts, live chat, AR, POD, marketplace features | LOW (anti-features) | HIGH | Not planned |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

Comparison drawn from documented patterns across dedicated fine-art marketplaces (Artfinder, UGallery, Fine Art America), photographer-website builders (Format/Squarespace — notably the current site's own platform), and general artist-site guidance (FASO, Contemporary Art Issue).

| Feature | Fine Art America / large POD platforms | UGallery / Artfinder (curated originals marketplaces) | Our approach |
|---------|----------------------------------------|--------------------------------------------------------|--------------|
| Fulfillment model | Print-on-demand, platform-run | Originals only; platform manages packing/shipping/returns for the artist | Self-fulfilled by Romane; deliberately not POD (originals + true limited editions don't fit POD) |
| Product breadth | Prints, home decor, greeting cards, apparel — very broad | Original paintings/photography/sculpture only | Focused catalog: prints, originals, books/zines, a small merch line — breadth stays deliberately narrow |
| Editions/authenticity | Framing/matting customization emphasized over authenticity messaging | Strong on scarcity ("one-of-a-kind") but originals-only, no edition-numbering use case | Combine both: originals (one-of-a-kind, sold-out state) AND numbered limited editions in the same shop, with COA messaging for both |
| Branding/portfolio integration | Artist gets a subsite within a larger marketplace — brand is diluted | Portfolio and shop feel more integrated, artist-first | Single unified custom site under Romane's own domain — no marketplace dilution, matches the "one unified site" decision in PROJECT.md |
| Language/market reach | English-first, US-centric | English-first | Bilingual FR/EN from day one — a genuine point of difference from most indie photographer sites reviewed, which are typically single-language |
| Exhibitions/agenda | Not a feature on commerce-first platforms (no exhibitions concept) | Not typically present — marketplaces don't show physical show history | Distinct "exhibitions" page is a feature these commerce-first platforms lack entirely, but a standard element on artist-first sites (FASO, Contemporary Art Issue guidance) — reinforces that this is an artist site with a shop, not a shop with an artist attached |

## Sources

- [How To Sell One-of-a-Kind or Limited Items with Inventory Tracking — PhotoBiz](https://support.photobiz.com/ecommerce/blog1/how-to-sell-one-of-a-kind-or-limited-items-with-inventory-tracking) — MEDIUM confidence (single vendor source, but consistent with general e-commerce inventory conventions)
- [How to Sell Limited Edition Prints as a Photographer — PetaPixel](https://petapixel.com/how-to-sell-limited-edition-prints/) — MEDIUM confidence
- [(Checklist) Selling wall decor and fine-art prints on your website — PhotoDeck](https://www.photodeck.com/checklists/selling-fine-art-prints/) — MEDIUM confidence
- [12 Tips for Selling Photography Prints from A Website — Improve Photography](https://improvephotography.com/47617/12-tips-selling-photography-prints-website/) — MEDIUM confidence (room-mockup conversion tip)
- [Limited Editions for Artists: Run Size, Labeling, Value Protection — AGI Fine Art](https://agifineart.com/advice/making-limited-edition-prints/) — MEDIUM confidence
- [A Guide to Authenticating Prints & Editions — MyArtBroker](https://www.myartbroker.com/collecting/articles/guide-to-authenticating-prints-editions) — MEDIUM confidence
- [All Pages You Need For A Professional Artist's Website — Contemporary Art Issue](https://www.contemporaryartissue.com/all-pages-you-need-for-a-professional-artists-website/) — MEDIUM-HIGH confidence (converges with multiple similar sources on portfolio/bio/contact/exhibitions structure)
- [Why Your Online Portfolio Website Needs a Comprehensive Artist Bio — Portfoliobox](https://www.portfoliobox.com/magazine/why-your-online-portfolio-website-needs-a-comprehensive) — MEDIUM confidence
- [15 Best Websites for Selling Art Online in 2026 — ecomm.design](https://ecomm.design/best-websites-for-selling-art-online/) — MEDIUM confidence
- [Artfinder / UGallery platform comparisons — Printful "Best Places to Sell Art"](https://www.printful.com/blog/Best-place-to-sell-art) — MEDIUM confidence
- [How to ship art internationally — Art Business Info for Artists](https://www.artbusinessinfo.com/how-to-ship-art-guide-for-artists.html) — MEDIUM confidence
- [Obligations légales en e-commerce : CGV et protection des consommateurs — Anov](https://www.anov.fr/obligations-legales-ecommerce-cgv-protection-consommateurs.html) — MEDIUM-HIGH confidence (converges with multiple French legal-guidance sources on LCEN/mentions légales/CGV requirements)
- [Mentions légales et CGV obligatoires pour un site e-commerce en France](https://blog.lueurexterne.com/fr/blog/mentions-legales-et-cgv-obligatoires-pour-un-site-e-commerce-en-france/) — MEDIUM-HIGH confidence
- [Lois e-commerce : guide pour vendre en ligne — Shopify France](https://www.shopify.com/fr/blog/lois-e-commerce) — MEDIUM confidence
- [Doing e-commerce: rules to follow — Service Public (French government)](https://entreprendre.service-public.gouv.fr/vosdroits/F23455?lang=en) — HIGH confidence (official government source)
- [Shopify Help Center: Localization and translation](https://help.shopify.com/en/manual/international/localization-and-translation) — HIGH confidence (official platform documentation)
- [Weglot guide: Shopify Language Switcher](https://www.weglot.com/guides/shopify-language-switcher) — MEDIUM confidence (vendor guidance, but consistent UX conventions)
- [Print on Demand pros/cons — Arts To Hearts Project](https://artstoheartsproject.com/the-pros-and-cons-of-print-on-demand/) — MEDIUM confidence
- [Standard Art Print Sizes: The Complete Chart — Bello](https://bello.art/resources/print-size-guide) — LOW-MEDIUM confidence (single source, general convention only)

**Note:** French e-commerce legal requirements (mentions légales, CGV, GDPR, 14-day withdrawal right) are well-converged across multiple sources including an official French government source, so table-stakes legal features are HIGH confidence in substance. However, the exact legal copy/wording for Romane's specific business status (auto-entrepreneur vs. other) should be verified with a French legal resource or accountant before launch — this research establishes *that* these pages/mechanisms are required, not their precise legal text.

---
*Feature research for: Photographer/artist portfolio + fine-art e-commerce site (Atelier Jacqueline Suzanne)*
*Researched: 2026-07-05*
