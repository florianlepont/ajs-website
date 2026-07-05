# Pitfalls Research

**Domain:** Small artist/photographer portfolio + e-commerce site, near-zero budget, built by a developer for a non-technical family member (French/EU market)
**Researched:** 2026-07-05
**Confidence:** MEDIUM-HIGH (legal/payment mechanics verified against official Stripe/CNIL/gouv sources; hosting-limit specifics are MEDIUM — verify exact current free-tier numbers at implementation time since providers change these often)

## Critical Pitfalls

### Pitfall 1: Overselling one-of-a-kind originals via a stock race condition

**What goes wrong:**
Two visitors both open checkout for the same one-of-a-kind original within minutes of each other. Both checkouts "look" valid (stock shows 1 available to both), both complete payment, and now Romane owes two people the same physical, non-reproducible artwork. This is the single worst possible failure mode for this project because — unlike a limited-edition print — there is no way to fulfill the second order short of a refund and an apology.

**Why it happens:**
Stripe Checkout/Payment Links do not manage inventory. A naive implementation checks "is this still in stock?" when rendering the product page or when creating the Checkout Session, then decrements stock only after payment succeeds (via webhook). Between "check" and "decrement," there's a window — sometimes minutes long, since a customer can sit on the Stripe-hosted payment page for a long time — during which a second buyer can also pass the same stale "in stock" check. Developers under time pressure often treat this as a low-probability edge case and skip it, especially for a project with modest expected traffic.

**How to avoid:**
- Treat stock mutation as the single source of truth, not the product page render. Decrement/mark-as-reserved atomically (e.g., a DB transaction or conditional update: `UPDATE products SET status='reserved' WHERE id=? AND status='available'`) at Checkout Session **creation**, not just on payment success.
- Set a short `expires_at` on the Stripe Checkout Session (Stripe defaults to 24h — reduce it) and listen for `checkout.session.expired` to release the reservation back to available.
- Listen for `checkout.session.completed` / `payment_intent.succeeded` to finalize the sale, and for `checkout.session.expired` / `payment_intent.payment_failed` to release the hold.
- For one-of-a-kind originals specifically, this reserve-then-confirm pattern matters far more than for prints/books with quantity > 1 — prioritize it there first.
- Use Stripe idempotency keys on any server-side write to avoid double-processing retried webhooks.

**Warning signs:**
- Product availability is only checked client-side or at page-render time, not re-verified atomically when checkout starts.
- No webhook handler exists for expired/abandoned checkout sessions (stock never gets released, originals falsely show "sold out" forever after abandoned carts).
- Load/concurrency testing was never done on the "buy" flow (even a simple two-tab manual test to open two checkouts for the same original catches this).

**Phase to address:**
The e-commerce/checkout implementation phase — before it is marked done. This should be a specific acceptance test, not an afterthought: "open checkout for the same one-of-a-kind item in two sessions, complete one, verify the other is blocked/refunded before capture."

---

### Pitfall 2: Launching without mandatory French legal pages (mentions légales, CGV) and treating them as an afterthought

**What goes wrong:**
The site goes live and starts taking real payments without a "Mentions légales" page or a CGV (Conditions Générales de Vente) page. Both are treated by developers as boilerplate to add "later," but in France they are a hard legal requirement for any public website (mentions légales, LCEN art. 6-III) and any B2C online sale (CGV, Code de la consommation art. L.221-5 et seq.), independent of business size or revenue.

**Why it happens:**
Developers coming from a "ship the product features first" mindset deprioritize legal/compliance pages because they don't look like "real work" and aren't part of the visible feature list (browse, buy, exhibitions, etc.). For a family project with no legal counsel involved, nobody flags it as blocking.

**How to avoid:**
- Mentions légales must include: Romane's name (or trade name), business status (for a micro-entrepreneur, "EI" + SIRET number — this presupposes she is actually registered as a business, see Pitfall 3), address/contact, hosting provider's identity and address, and the site's directeur de publication.
- CGV must include: identity/contact of the seller, essential characteristics of the goods, price (all-inclusive, incl. any shipping), delivery timeframes, legal/commercial guarantees, right-of-withdrawal terms (see Pitfall 8), and dispute-resolution/mediator contact.
- CGV acceptance must be an explicit action (a checkbox at checkout that isn't pre-ticked), not implied by clicking "pay."
- Also required: a Politique de Confidentialité (GDPR/RGPD — what data is collected, why, retention, rights) since the checkout collects personal + payment data.
- Build these as real content (in both languages, see Pitfall 5), not filler text, and put them in the footer of every page.
- Penalties are real (LCEN: up to 1 year imprisonment / €75k fine for an individual for missing mentions légales) — low probability of enforcement for a small site, but the point is these aren't optional "nice to haves," they gate whether the shop can legally launch at all.

**Warning signs:**
- Footer has no "Mentions légales" / "CGV" / "Confidentialité" links.
- CGV page is a generic template that doesn't mention delivery zones (France + Europe), right of withdrawal, or how originals vs. editions are handled on return.
- No explicit checkbox/consent step in the checkout flow.

**Phase to address:**
A dedicated legal/compliance phase (or a checklist item inside the checkout phase) that runs in parallel with e-commerce build-out, completed before any real transaction goes live — not a "polish" task at the very end.

---

### Pitfall 3: Assuming Stripe "just works" without business registration — payouts get blocked

**What goes wrong:**
The team builds the whole checkout flow, connects a Stripe account, and only discovers at the very end that Stripe won't release payouts (or even fully activate the account) because Romane isn't registered as a business yet. Stripe requires KYC identity/business verification, and for a French individual selling goods this generally means a SIRET number (i.e., she must be a registered micro-entrepreneur/auto-entrepreneur or similar), not just a personal bank account.

**Why it happens:**
"Add Stripe" feels like a pure integration task to a developer, so business/administrative registration (which can take days to weeks through the guichet unique) isn't scheduled as a dependency, and gets discovered as a blocker right before launch.

**How to avoid:**
- Confirm Romane's business registration status (auto-entrepreneur/micro-entreprise with a SIRET) as an early, non-technical checklist item — start this in parallel with the earliest development phases, since administrative registration has its own lead time independent of code.
- Once registered, also confirm: the franchise en base de TVA thresholds (as of 2025: €85,000 for buying/reselling goods — art sales likely fall here rather than the €37,500 services threshold) so she knows whether she needs to charge VAT at all initially.
- If sales to other EU countries are expected to be meaningful, be aware of the €10,000/year EU-wide distance-selling threshold, above which VAT is due in the buyer's country (managed via the One-Stop-Shop / OSS regime) — for a "France + Europe" shipping scope this is realistic to eventually cross and worth understanding even if not implemented on day one.
- Mentions légales/CGV (Pitfall 2) require the SIRET number anyway — these two pitfalls share the same root dependency.

**Warning signs:**
- Stripe dashboard shows account restrictions / "more information needed" that block payouts, discovered only when trying to withdraw the first real sale's funds.
- Nobody has confirmed whether Romane has (or is in the process of getting) a SIRET before checkout is built.

**Phase to address:**
Should be flagged as a project-setup / pre-requisite item in the earliest phase, run in parallel with technical work — this is an administrative critical path item, not a coding task.

---

### Pitfall 4: Free-tier hosting bandwidth/image limits get blown by a photography-heavy site

**What goes wrong:**
A photography portfolio is, by nature, image-heavy — large hero images, multiple galleries, high-resolution product photos for prints. Static hosts' free tiers (Netlify, Vercel, etc.) typically cap monthly bandwidth (commonly cited around 100GB/month, though exact numbers change and should be re-verified at build time — MEDIUM confidence, verify against current provider docs) and, in Vercel's case specifically, also cap the number of on-the-fly optimized images processed per month. Once exceeded, the host either throttles/pauses the site (Netlify) or starts charging (Vercel/AWS-style usage billing) — the opposite of the near-zero-budget goal.

**Why it happens:**
Photography sites naturally push way more image bytes per visitor than a typical text/app site, and it's easy to upload originals or lightly-compressed exports without a deliberate image pipeline, especially once a non-technical CMS user (Romane) is uploading her own photos post-launch without any size/format constraints enforced.

**How to avoid:**
- Don't serve raw uploaded images directly — put an image CDN/transform layer in front (Cloudflare Images, a self-hosted transform via `next/image`-style loader, or Cloudinary's free tier) that serves responsive, compressed, modern formats (WebP/AVIF).
- Strongly prefer an object storage + CDN combination with **zero egress fees** for the image-heavy asset layer — Cloudflare R2 confirms no data-transfer/egress charges on any storage class (only storage itself, ~$0.015/GB-month, is billed after a free 10GB/month allowance) — this directly protects the near-zero-budget constraint against "bandwidth surprise" bills, which the default host's free bandwidth cap doesn't (source: Cloudflare R2 official pricing docs, HIGH confidence).
- Enforce image constraints at the CMS/upload layer (max dimensions, automatic compression) so Romane can't accidentally upload a 40MB RAW-derived JPEG straight from her camera roll.
- Re-verify the chosen host's exact current free-tier bandwidth/image-processing caps at implementation time — these numbers and enforcement behavior change over time and vary by provider (MEDIUM confidence from current provider marketing pages, not a stable long-term fact).

**Warning signs:**
- Product/gallery images are served at original upload resolution with no resizing/compression step.
- No monitoring/alerting on hosting usage — the first sign of a problem is the site going down or an unexpected bill.
- CMS upload UI has no client-side or server-side size/dimension limit.

**Phase to address:**
The stack-selection / architecture phase (choosing hosting + image pipeline together, not hosting first and images as an afterthought), reinforced in the CMS/content-editing phase (enforcing upload constraints for Romane).

---

### Pitfall 5: Bilingual content drifts out of sync after launch

**What goes wrong:**
At launch, French and English content are in parity. Months later, Romane adds a new exhibition date or a new gallery in French (the language she's most comfortable in) and forgets — or doesn't know how — to add the English version. Visitors switching to English see stale or missing content (an old exhibition list, a gallery that doesn't exist in English), which undermines the "professional bilingual site" goal the project was built for.

**Why it happens:**
Bilingual content maintenance is a process problem, not just a technical one. Once the developer isn't reviewing every content change, there's no enforcement that a French addition has a corresponding English one — especially for content Romane manages herself (galleries, exhibitions) as opposed to code-level UI strings.

**How to avoid:**
- In the CMS content model, make translation fields structurally visible side-by-side (not buried in separate documents/tabs) so a missing English field is obvious when Romane is editing, not something she has to remember to go add separately.
- Where good machine translation is acceptable as a stopgap (e.g., exhibition descriptions), consider a "draft translation" default so nothing is ever fully blank in one language — she edits/corrects rather than starting from nothing.
- Keep the amount of content Romane must translate herself minimal and structurally simple (short fields: title, date, location, one-paragraph description) rather than long free-form bilingual essays, to reduce the chance of drift.
- For static/code-level UI strings (buttons, labels, legal pages), this is the developer's responsibility to keep in sync — treat missing-translation as a build-time or pre-deploy check if the stack supports it, not something discovered by a visitor.

**Warning signs:**
- CMS shows French and English fields in separate tabs/entries rather than side by side, making omissions easy to miss.
- No visual/editorial indicator in the CMS for "this field has no English translation yet."
- After a few months of no developer involvement, spot-check the English version of the site against the French one.

**Phase to address:**
The content model / CMS design phase (structure the data model to make drift visible and hard to miss), not the i18n technical implementation phase alone (which only handles routing/switching, not content completeness).

---

### Pitfall 6: The site becomes unmaintainable once the developer isn't actively involved (bus factor of 1)

**What goes wrong:**
Everything works at launch because Florian is actively building and testing it. Six months later something breaks (a dependency update, an expired API key, a CMS quota hit, a design tweak Romane wants) and there's no documentation, no simple way for her to get unstuck, and Florian may not have bandwidth to jump back in immediately. This is the single most common failure mode for developer-built-for-family-member sites: functionally excellent at handoff, silently rotting a year later.

**Why it happens:**
A solo developer building for one non-technical user has, by definition, a bus factor of 1 — all operational knowledge lives in one person's head. Documentation is deprioritized because "I'll remember how this works" and because writing docs doesn't feel like progress compared to shipping features. The stack is often optimized for developer convenience and cost, not for the eventual maintainer's technical comfort level.

**How to avoid:**
- Pick boring, well-supported tools for anything Romane touches directly (CMS, image uploads, order/exhibition management) — avoid anything requiring a terminal, redeploys, or environment variable edits for routine content changes.
- Write a short, non-technical runbook for Romane covering: how to add/edit a gallery, how to add an exhibition, how to check/fulfill an order, and — critically — "who to contact and what to say" if something looks broken (e.g., a specific error screenshot to send Florian, or a support-channel link for the CMS/host itself).
- Document, even briefly, the "operator" facts a future maintainer (could be Florian in a year, could be someone else) needs: which services are used (host, CMS, Stripe, domain registrar), where credentials/API keys live, what the deploy process is, and any manual steps (e.g., stock corrections) that aren't self-service.
- Prefer managed services with their own support/documentation (Stripe, a hosted CMS) over self-hosted infrastructure requiring server maintenance, patching, or backups that only the developer knows how to run.
- Set expectations explicitly: decide upfront whether Florian will do occasional "maintenance passes" (e.g., dependency updates, renewing anything time-limited) or whether the goal is a fully "set and forget" build — this changes stack choices materially.

**Warning signs:**
- No written documentation exists beyond code comments.
- Any routine content task (add a gallery, update agenda) requires touching code, redeploying, or using a CLI.
- Credentials/API keys for hosting, CMS, Stripe, and the domain registrar are not recorded anywhere Romane (or a future helper) could find them if Florian were unavailable.

**Phase to address:**
Should be an explicit deliverable of the final/launch phase ("handoff & documentation"), but the stack decisions that make it *possible* (self-service CMS, managed hosting, no server maintenance) must be made in the earliest architecture/stack phase — retrofitting maintainability onto a developer-centric stack after the fact is expensive.

---

### Pitfall 7: DNS/domain cutover breaks email or causes visible downtime when replacing the live site

**What goes wrong:**
The new site is ready, DNS is switched over to the new host, and either (a) there's a period where the domain resolves inconsistently (some visitors see the old Myportfolio site, some see the new one, some see errors) due to DNS propagation and caching, or (b) email tied to the domain (e.g., a `contact@atelierjacquelinesuzanne.fr` address, if one exists via the current provider) stops working because MX records were overwritten or not carried over during the switch.

**Why it happens:**
DNS TTLs on the current record set may be high (hours or a day), so a same-day cutover can leave stale entries cached at ISPs/resolvers for a while. Developers focused on the new site's DNS (A/CNAME records for the web host) can forget that the same domain likely has other DNS records (MX for email, TXT for SPF/verification) that must be preserved or deliberately migrated, not silently dropped.

**How to avoid:**
- Audit and document every existing DNS record on the domain (A, CNAME, MX, TXT/SPF/DKIM) *before* touching anything — treat the current Myportfolio/Format DNS zone as a source of truth to preserve or intentionally replace, not something to overwrite wholesale.
- Lower TTLs on the records that will change (e.g., to 300 seconds) a day or more ahead of the actual cutover, so the eventual switch propagates fast and any rollback is also fast.
- Fully build and test the new site on a temporary/staging URL (or via a local hosts-file override) before ever touching production DNS — never use the live DNS switch as the first real test of the new host.
- Pick a low-traffic window for the actual cutover, and keep the old site/hosting account live and untouched for at least a week or two after cutover in case rollback is needed.
- Explicitly confirm whether the domain has any active email service tied to it; if so, replicate the exact MX/SPF/DKIM records on the new DNS setup (or migrate mailboxes deliberately) rather than assuming "just the website" needs migrating.
- Also plan for old URLs: if any of the current gallery/page URLs are indexed by Google or linked from Instagram, set up redirects (or accept short-term SEO impact) rather than letting old links 404 — full traffic recovery after a re-platform can otherwise take months.

**Warning signs:**
- Nobody has pulled the current DNS zone file / record list for the domain before starting the migration.
- No plan exists for what to do if something breaks right after the DNS switch (no documented rollback = TTLs not lowered in advance = slow, painful rollback).
- Uncertainty about whether `atelierjacquelinesuzanne.fr` has any email or other service beyond the website itself.

**Phase to address:**
The final launch/cutover phase specifically — should have its own checklist and rehearsal, treated as a distinct, higher-risk activity from the rest of the build, not bundled into a generic "deploy" step.

---

### Pitfall 8: Assuming one-of-a-kind art can't be returned, when French consumer law says otherwise

**What goes wrong:**
The team decides that because an original artwork is unique and "obviously can't be resold if returned," no right of withdrawal (droit de rétractation) applies. In reality, French consumer law's 14-day withdrawal right applies by default to any distance sale to a consumer — including a unique original — unless the item is genuinely "made to the consumer's specifications" or "clearly personalized" (e.g., a commissioned piece). A pre-existing original painting/photo print sold as-is to whoever buys it first is generally **not** exempt just because it's one-of-a-kind. Shipping a CGV that flatly denies all returns for originals is a compliance gap that could be challenged.

**Why it happens:**
"Unique item, no returns" is an intuitive assumption for anyone used to physical-gallery norms (where cooling-off periods generally don't apply to in-person sales), and it's easy to conflate "can't be resold to someone else after a return" with "legally exempt from withdrawal rights" — these are not the same thing under French consumer law for online sales.

**How to avoid:**
- Default to offering the standard 14-day withdrawal right on originals sold via the online store, and account for it operationally: what happens to "stock" if a returned original needs to go back to "available" status, and who pays return shipping (seller must reimburse standard delivery cost on a valid withdrawal, per statutory rules — return shipping cost allocation should be spelled out in CGV).
- Only treat a piece as exempt from withdrawal if it is genuinely commissioned/made-to-order for that specific buyer after the order is placed — not simply because it happens to be a singular finished piece already in inventory.
- Get this specific point confirmed (CGV wording for right of withdrawal on originals vs. editions vs. any future commissions) rather than guessing — it's a narrow, specific legal question worth 20 minutes of targeted verification against current Code de la consommation guidance rather than assumption.

**Warning signs:**
- CGV draft says something like "no returns accepted on original artworks" without a specific, defensible exemption basis.
- No operational plan for what happens to inventory/stock state if a return does happen on a one-of-a-kind item.

**Phase to address:**
Same legal/compliance phase as Pitfall 2 (CGV drafting) — resolve this as part of writing the CGV, not left ambiguous.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Skip webhook-based stock reservation, just decrement on payment success | Faster to build checkout | Real risk of overselling a one-of-a-kind original (Pitfall 1) | Never for one-of-a-kind originals; borderline tolerable for limited editions with quantity > 3-4 where the odds of a simultaneous race are low, but still not recommended |
| Serve uploaded images at original resolution without a transform pipeline | No image pipeline to build initially | Blows free hosting bandwidth, slow page loads, bad SEO/Core Web Vitals (Pitfall 4) | Never beyond a short prototype/demo phase |
| Hardcode legal pages (mentions légales/CGV) as static text in code rather than CMS content | Fast to ship the first version | Romane can't update her own SIRET/address changes or CGV wording without Florian; also easy to forget to translate | Acceptable only if genuinely static and reviewed once at launch — otherwise move to CMS |
| Use a single flat "products" list without separating "original" (qty 1, needs reservation logic) from "edition/print" (qty N) as distinct types | Simpler initial data model | Forces the strict one-of-a-kind race-condition handling onto every product, or under-protects originals if handled uniformly and loosely | Acceptable only if the reservation logic (Pitfall 1) is applied universally and correctly regardless of quantity |
| Deploy without a staging environment, testing directly against production DNS/host | Saves initial setup time | No safe way to validate the cutover before it's live; higher downtime/rollback risk (Pitfall 7) | Never for the final domain cutover; acceptable for early internal iteration before a domain is involved |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| Stripe Checkout | Assuming Stripe manages inventory/stock automatically | Stripe only handles payment; inventory reservation/decrement must be built in the application layer around Checkout Session lifecycle events |
| Stripe payouts | Connecting Stripe before Romane is registered as a business (SIRET) | Confirm business registration status before building the payment flow; treat it as a pre-requisite, not a parallel task that can slip |
| Domain registrar / DNS | Changing A/CNAME records for the new host without first inventorying MX/TXT/SPF records | Pull and document the full existing DNS zone before any change; migrate every record deliberately |
| Headless CMS free tier (e.g., Sanity/Contentful-style) | Assuming free-tier API request/bandwidth/asset-storage limits are unlimited for a "small" site | Check current free-tier caps (API calls/month, asset storage GB, bandwidth) against expected image volume before committing; image-heavy sites are the use case most likely to hit these caps first |
| Analytics/cookies (e.g., Google Analytics) | Adding analytics/embeds without a CNIL-compliant consent banner | Any non-strictly-necessary tracker requires prior, granular, revocable consent under CNIL rules; either use a consent-management banner or choose analytics exempted under CNIL's audience-measurement exemption conditions (anonymized IP, ≤13-month cookie life, no cross-site use) |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Unoptimized full-resolution photo uploads | Slow page loads, poor Lighthouse/Core Web Vitals scores, high bandwidth usage | Automated resize/compress/modern-format (WebP/AVIF) pipeline on upload or serve, enforced regardless of what the CMS user uploads | Becomes visible almost immediately on a photography-heavy site — this is a day-one risk, not a scale problem |
| No CDN/egress-free storage for images | Free hosting bandwidth quota consumed quickly by a modest amount of traffic to an image-heavy site | Use zero-egress object storage (e.g., Cloudflare R2) or a CDN in front of the host | Breaks once monthly visits + gallery browsing exceed the host's free bandwidth allowance — realistic even at low visitor counts for an image-heavy site |
| Blocking, synchronous stock checks under concurrent load | Two simultaneous buyers both "succeed" for the same one-of-a-kind item | Atomic conditional updates / DB transactions for stock state changes | Breaks the moment two people attempt to buy the same original close together — low overall traffic doesn't eliminate the risk, it just makes it rarer, not impossible |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting client-side "add to cart"/price data | Buyer manipulates price or product ID client-side before checkout | Always create the Stripe Checkout Session server-side, deriving price/product from your own trusted data source, never from client input |
| No webhook signature verification | Anyone could POST a fake "payment succeeded" event to your endpoint and get an order marked as paid/shipped for free | Verify Stripe webhook signatures using the webhook signing secret on every incoming event |
| Storing Stripe/CMS API keys in code or committed config | Leaked keys in a public or shared repo compromise payments/content | Use environment variables / host-provided secret storage, never commit keys, rotate if ever exposed |
| No rate limiting/bot protection on checkout or contact form | Spam orders, carding attempts (using checkout to test stolen card numbers), or contact-form spam flooding Romane's inbox | Basic bot protection (e.g., a CAPTCHA-free heuristic, honeypot fields) on the contact form; rely on Stripe's built-in fraud tooling (Radar) for payment abuse |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| No clear "sold" state distinguishing a one-of-a-kind original from a limited edition still in stock | Buyer confusion about whether more are available, or disappointment discovering an "available" item was actually just purchased | Explicit, distinct UI states: "Original — Sold", "Edition — X of Y remaining", refreshed reliably from server-side stock state, not cached |
| Checkout flow forces language switch or loses selected language | Frustration for an English-reading buyer suddenly seeing French checkout text (or vice versa) | Persist language selection through the entire cart/checkout/confirmation flow, including transactional emails |
| Exhibitions/agenda page shows past events prominently without distinguishing upcoming vs. past | Visitors can't tell what's currently relevant | Clearly separate "Upcoming" and "Past" exhibitions, sorted with upcoming first |
| CGV/mentions légales pages only in French | Non-French-speaking buyers can't understand terms they're legally agreeing to | Translate legal pages into English too, consistent with the site's bilingual promise |

## "Looks Done But Isn't" Checklist

- [ ] **Checkout flow:** Often missing server-side, atomic stock reservation tied to Checkout Session lifecycle — verify by testing two concurrent purchase attempts on the same one-of-a-kind item.
- [ ] **Legal pages:** Often missing an actual, complete CGV (not a placeholder) with delivery zones, right-of-withdrawal terms specific to originals vs. editions, and a real SIRET-backed mentions légales — verify by reading the CGV against the Code de la consommation checklist, not just checking that a page exists.
- [ ] **Stripe account:** Often "connected" in test mode only, with live payouts still blocked pending business/identity verification — verify by confirming Romane's Stripe account is fully activated for live payouts, not just accepting test payments.
- [ ] **Bilingual content:** Often complete at launch but with no mechanism preventing drift — verify by checking the CMS UX itself surfaces missing translations, not just that both languages exist today.
- [ ] **Image pipeline:** Often "working" in that images display, but unoptimized — verify by checking actual served file sizes/formats (not just that the gallery renders), and confirm the CMS enforces limits on new uploads too.
- [ ] **DNS/domain:** Often "migrated" without preserving email or non-web DNS records — verify by listing every DNS record on the domain before and after cutover and confirming email (if any) still works.
- [ ] **Handoff docs:** Often nonexistent even when the code itself is clean — verify by asking Romane to attempt one routine task (add a gallery photo, add an exhibition) using only the written instructions, without Florian's help.
- [ ] **Cookie/consent:** Often missing entirely if analytics or embeds (e.g., Instagram embed, YouTube) were added ad hoc — verify by auditing every third-party script/embed against CNIL consent requirements.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|------------------|
| Overselling a one-of-a-kind original | MEDIUM | Immediately refund the second buyer via Stripe, communicate transparently and quickly, consider a discount/goodwill gesture on a future purchase; then retroactively add the atomic-reservation fix before continuing to sell |
| Missing/incomplete legal pages discovered post-launch | LOW | Draft and publish mentions légales/CGV/politique de confidentialité promptly (many generators exist for the boilerplate parts); low likelihood of enforcement action for a small site if fixed promptly, but don't leave it unresolved |
| Free-tier hosting bandwidth exceeded / site paused | LOW-MEDIUM | Move image assets to a zero-egress store (e.g., Cloudflare R2) fronted by a CDN; this is a bounded, well-understood migration, not a rewrite |
| DNS cutover breaks email or causes visible downtime | LOW-MEDIUM | Because TTLs were (hopefully) lowered in advance, rollback to old DNS records is fast; if email breaks, restore the original MX/TXT records immediately from the pre-migration audit |
| Bilingual content drifts significantly after months of neglect | LOW | A focused one-time audit/translation pass to re-sync both languages; then fix the CMS UX so it doesn't recur (see Pitfall 5 prevention) |
| Handoff gaps discovered when Florian is unavailable | MEDIUM-HIGH | Depends entirely on whether documentation exists at all; if none, this becomes an emergency reverse-engineering exercise — this is why prevention (Pitfall 6) is much cheaper than recovery |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Overselling one-of-a-kind originals (race condition) | E-commerce/checkout implementation phase | Manual concurrent-purchase test on a single-stock item before launch |
| Missing mentions légales/CGV | Legal/compliance phase (parallel to checkout build) | Legal pages reviewed against Code de la consommation / LCEN checklist before first live transaction |
| Stripe payouts blocked by missing business registration | Project-setup phase (earliest, non-technical, parallel track) | Stripe account confirmed fully activated for live payouts, not just test mode |
| Free-tier hosting/image bandwidth limits | Stack-selection/architecture phase | Confirm chosen host + image pipeline combination against expected image volume; re-check current free-tier numbers immediately before committing |
| Bilingual content drift | Content model/CMS design phase | CMS UI reviewed to confirm missing translations are visually obvious to Romane, not hidden |
| Unmaintainable handoff (bus factor 1) | Architecture phase (stack choice) + final launch/handoff phase (docs) | Romane successfully completes one routine content task using only written docs, unassisted |
| DNS/domain cutover risk | Final launch/cutover phase (dedicated, rehearsed) | Full DNS record audit before/after; rollback plan tested by lowering TTLs in advance |
| Right-of-withdrawal misapplied to originals | Legal/compliance phase (same as CGV drafting) | CGV wording on returns for originals specifically reviewed, not left as a generic denial |

## Sources

- [Stripe: Manage limited inventory with Checkout](https://stripe.com/docs/payments/checkout/managing-limited-inventory) — HIGH confidence, official Stripe docs
- [Stripe Webhooks: Solving Race Conditions](https://www.pedroalonso.net/blog/stripe-webhooks-solving-race-conditions/) — MEDIUM confidence, community write-up consistent with Stripe's own guidance
- [Vendure GitHub issue: Unhandled race condition during checkout with limited stock](https://github.com/vendure-ecommerce/vendure/issues/3065) — MEDIUM confidence, real-world reported issue in an e-commerce framework, illustrates the failure mode concretely
- [Mentions légales et CGV obligatoires pour un site e-commerce en France](https://blog.lueurexterne.com/fr/blog/mentions-legales-et-cgv-obligatoires-pour-un-site-e-commerce-en-france/) — MEDIUM confidence, cross-checked against economie.gouv.fr
- [economie.gouv.fr: Mentions sur votre site internet](https://www.economie.gouv.fr/entreprises/developper-son-entreprise/innover-et-numeriser-son-entreprise/mentions-sur-votre-site-internet-les-obligations-respecter) — HIGH confidence, official French government source
- [LegalPlace: CGV pour un auto-entrepreneur](https://www.legalplace.fr/guides/conditions-generales-vente-auto-entrepreneur/) — MEDIUM confidence
- [Stripe: SIRET number guide](https://stripe.com/resources/more/siret-siren-numbers) — HIGH confidence, official Stripe docs
- [Stripe: SIREN and SIRET numbers support article](https://support.stripe.com/questions/siren-and-siret-numbers?locale=en-GB) — HIGH confidence, official Stripe support
- [Nouveaux seuils de TVA 2025 en Auto-Entreprise](https://www.mon-autoentreprise.fr/nouveaux-seuils-franchise-tva-2025/) — MEDIUM confidence
- [Portail Auto-Entrepreneur: TVA 2026](https://www.portail-autoentrepreneur.fr/academie/statut-auto-entrepreneur/tva) — MEDIUM confidence
- [Cloudflare R2 pricing (official)](https://developers.cloudflare.com/r2/pricing/) — HIGH confidence, official docs, confirms zero egress fees
- [Netlify Pricing](https://www.netlify.com/pricing/) — LOW-MEDIUM confidence; official page but did not clearly state overage behavior at fetch time — re-verify exact current free-tier bandwidth limits and overage handling before committing to a host
- [Vercel vs Netlify 2026 comparisons](https://redstapler.co/netlify-vs-vercel-which-free-portfolio-hosting-2026/) — LOW-MEDIUM confidence, third-party blog aggregation, treat specific numbers as directional and re-verify against official docs at build time
- [CNIL: Cookies et autres traceurs — les règles](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles) — HIGH confidence, official CNIL source
- [CNIL: Cookies, solutions pour les outils de mesure d'audience](https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience) — HIGH confidence, official CNIL source, defines analytics-exemption conditions
- [Droit de rétractation lors de l'achat d'une œuvre d'art](https://mr-expert.com/droit-de-retractation-lors-de-lachat-dune-oeuvre-dart/) — MEDIUM confidence
- [service-public.gouv.fr: Droit de rétractation](https://www.service-public.gouv.fr/particuliers/vosdroits/F10485?lang=en) — HIGH confidence, official French government source
- [Website Migration SEO: Avoid 50% Traffic Loss](https://www.numentechnology.co.uk/blog/website-migration-seo-strategy) — MEDIUM confidence, industry blog, directionally consistent with widely reported migration-risk patterns
- [DCHost: Domain and DNS Migration Checklist](https://www.dchost.com/blog/en/domain-and-dns-migration-checklist-when-changing-hosting-provider/) — MEDIUM confidence
- [Livable Software: Calculate the bus factor of your software project](https://livablesoftware.com/calculate-bus-factor-software-project/) — MEDIUM confidence, conceptual framing of the handoff/maintainability risk
- [SimpleLocalize: The complete technical guide to i18n](https://simplelocalize.io/blog/posts/internationalization-guide-software-localization/) — MEDIUM confidence, on translation debt/content drift

---
*Pitfalls research for: artist/photographer portfolio + e-commerce site (near-zero budget, developer building for non-technical family member, France/EU market)*
*Researched: 2026-07-05*
