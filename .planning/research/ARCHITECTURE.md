# Architecture Research

**Domain:** Bilingual artist portfolio + low-volume e-commerce (image-heavy, near-zero budget, non-technical content owner)
**Researched:** 2026-07-05
**Confidence:** HIGH (component boundaries, data flow, Astro/Sanity/Stripe integration patterns — verified against official docs) / MEDIUM (specific free-tier numbers, which shift over time — verify at build time)

## Standard Architecture

For this class of site (small artist/creator selling a limited catalog of physical goods, content-heavy, near-zero ops budget), the ecosystem has converged on a **Jamstack-with-islands** pattern: a static-first frontend, a headless CMS as the single source of truth for content *and* stock, and a payment provider handling money movement while a thin serverless layer glues them together. No traditional application server or database is needed — the CMS's document store doubles as the "database," and a couple of small serverless functions replace what would otherwise be a backend.

### System Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                          CONTENT/EDITING LAYER                        │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │  Headless CMS (e.g. Sanity Studio)                             │    │
│  │  - Galleries/projects, photos, about page, exhibitions         │    │
│  │  - Product catalog: title, price, images, edition/stock count  │    │
│  │  - Locale-aware fields (FR/EN)                                 │    │
│  │  - Built-in image CDN (resize/format/crop on the fly)          │    │
│  └───────────────────────────────────┬───────────────────────────┘    │
└──────────────────────────────────────┼────────────────────────────────┘
                                        │ content API (GROQ/REST) + image CDN URLs
                                        │ webhook on publish
┌───────────────────────────────────────▼───────────────────────────────┐
│                        FRONTEND / RENDERING LAYER                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ Galleries / │  │ About /     │  │ Exhibitions │  │ Product     │   │
│  │ Portfolio   │  │ Bio pages   │  │ list        │  │ listing/PDP │   │
│  │ (static)    │  │ (static)    │  │ (static)    │  │ (static +   │   │
│  │             │  │             │  │             │  │  live stock)│   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────┬──────┘   │
│         i18n routing layer (/fr/*, /en/*, locale fallback)  │         │
│  ┌────────────────────────────────────────────────────────┐│         │
│  │ Client-side cart (localStorage / nanostores)             ││        │
│  └────────────────────────────────────────────────────────┘│         │
└──────────────────────────────────────────┬──────────────────┼─────────┘
                                            │ same-origin calls
┌───────────────────────────────────────────▼──────────────────▼────────┐
│                     SERVERLESS / EDGE FUNCTIONS LAYER                 │
│  ┌───────────────────────────┐   ┌───────────────────────────────┐   │
│  │ create-checkout-session   │   │ stripe-webhook                 │   │
│  │ - re-validates price+stock│   │ - verifies signature            │   │
│  │   against CMS server-side │   │ - decrements stock in CMS      │   │
│  │ - creates Stripe Session  │   │ - logs order / notifies         │   │
│  └─────────────┬─────────────┘   └───────────────┬─────────────────┘   │
│  ┌──────────────────────────┐                    │                    │
│  │ contact-form submit      │                     │                   │
│  └──────────────────────────┘                     │                   │
└───────────────┼─────────────────────────────────────┼──────────────────┘
                 │ hosted checkout redirect            │ CMS mutation API
       ┌─────────▼──────────┐                 ┌────────▼────────┐
       │   Stripe Checkout   │────webhook─────▶│  CMS (Sanity)   │
       │  (hosted payment)   │  session done   │  stock field    │
       └──────────────────────┘                └──────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|-------------------------|
| Content/CMS layer | Single source of truth for all editable content: galleries, photos, about/bio, exhibitions, product catalog **and** stock counts. Provides a non-technical editing UI. | Headless CMS with a hosted, brandable editor UI (e.g. Sanity Studio deployed as a static app, or Payload/Storyblok/Directus equivalents). Content modeled as documents with locale-aware fields. |
| Image delivery | Store, transform, and serve responsive images without bloating the git repo or build time. | CMS-native asset pipeline with an on-the-fly image CDN (resize, crop, format=webp/avif, quality params via URL) — this is the single biggest lever for an "image-heavy" site on a near-zero budget, since it avoids re-processing images at every build and avoids a separate image host. |
| Frontend/rendering layer | Renders portfolio, about, exhibitions, and product pages; owns SEO, layout, performance. | Static-site generator with islands architecture (e.g. Astro) fetching from the CMS at build time; ships near-zero client JS by default, with small interactive islands (cart, language switcher, lightbox). |
| i18n layer | Serves FR/EN content under locale-prefixed routes with a working language switcher and sane fallback when a translation is missing. | Framework-native i18n routing (locale-prefixed paths) + locale-aware content documents/fields in the CMS. Translation of UI strings (buttons, labels) kept separate from translation of long-form content (bio, gallery text). |
| Storefront (cart) | Lets a visitor accumulate items and proceed to checkout; must never be the source of truth for price or stock. | Client-side cart state (localStorage-backed store) hydrated from statically-rendered product data; always re-validated server-side before payment. |
| Checkout/payment | Executes the actual money movement, handles cards, taxes, receipts, refunds. | Stripe Checkout (hosted page) — the site never touches card data. A serverless function creates the Checkout Session server-side. |
| Order/stock sync | Keeps stock counts accurate after a successful payment; prevents overselling one-of-a-kind originals. | A small serverless function acting as a Stripe webhook receiver, which mutates the stock field back in the CMS and triggers order notification. |
| Exhibitions data | A simple, ownable list (not a booking system). | Modeled as CMS documents (date, location, title, description, status: upcoming/past) rendered as a static list, sorted at build/query time. |
| Contact | Lets a visitor reach the artist without exposing an inbox to spam or requiring a backend. | Static form posting to a forms-as-a-service endpoint or a thin serverless function that relays to a transactional email API. |
| Deploy/hosting | Serves the static output globally, cheaply, and rebuilds on content change. | Static host with free-tier edge/serverless functions and a deploy webhook triggered by CMS publish events. |

## Recommended Project Structure

```
src/
├── content/                 # (if using framework content collections for anything git-managed)
│   └── config.ts            # schema/types shared with CMS-fetched data
├── lib/
│   ├── cms/                 # CMS client, typed query functions (getGalleries, getProducts, getExhibitions)
│   │   ├── client.ts
│   │   ├── queries.ts
│   │   └── image.ts         # image URL builder / srcset helper wrapping the CMS's CDN
│   ├── stripe/               # Stripe SDK wrapper, session helpers (shared between functions and pages)
│   └── i18n/
│       ├── ui.ts             # UI string dictionaries (FR/EN)
│       └── routing.ts        # locale detection, path helpers, fallback rules
├── pages/  (or app/)
│   ├── [locale]/
│   │   ├── index.astro
│   │   ├── galleries/[slug].astro
│   │   ├── about.astro
│   │   ├── exhibitions.astro
│   │   ├── shop/
│   │   │   ├── index.astro
│   │   │   └── [product].astro
│   │   └── contact.astro
│   └── api/  (or netlify/functions/, functions/)
│       ├── create-checkout-session.ts
│       ├── stripe-webhook.ts
│       └── contact.ts
├── components/
│   ├── cart/                 # cart store + UI (island)
│   ├── language-switcher/    # island
│   └── gallery/               # image grid, lightbox (island only where needed)
└── styles/
```

### Structure Rationale

- **`lib/cms/`:** Isolates all CMS coupling behind typed query functions so the content model can evolve (or the CMS can be swapped) without touching every page. Also centralizes the image URL builder so responsive-image logic isn't duplicated across templates.
- **`lib/stripe/`:** Both `create-checkout-session` and `stripe-webhook` need the same Stripe client and product/price lookup logic — sharing it prevents price/stock validation drift between the two functions.
- **`pages/[locale]/`:** Puts locale at the routing root so every page automatically exists in both languages and the language switcher is a simple path transform, not a per-page translation lookup.
- **`pages/api/` (functions):** Kept separate from content pages because these are the only parts of the site that need a live server context (secrets, signature verification) — everything else can be fully static.
- **`components/*` islands:** Only the interactive pieces (cart, switcher, lightbox) ship client JS; galleries, about, exhibitions render as plain HTML.

## Architectural Patterns

### Pattern 1: CMS as single source of truth for stock (not a separate database)

**What:** The stock/edition-count field lives on the product document in the CMS, not in a separate inventory database or in Stripe metadata. Stripe is treated purely as a payment executor; it is explicitly documented as not tracking stock-on-hand itself.
**When to use:** Low order volume (roughly under a few hundred orders/month), single fulfiller (Romane), no multi-warehouse or complex SKU logic. This describes this project.
**Trade-offs:** Simpler (one less service, one less credential set to manage) but requires the webhook function to be the *only* writer of stock, and requires re-validating stock at Checkout Session creation time, not just after payment, to avoid overselling one-of-a-kind originals during the checkout window.

**Example:**
```typescript
// api/create-checkout-session.ts
const product = await cms.getProduct(productId);       // server-side, not trusted from client
if (product.stock < 1) return error(409, "sold_out");

const session = await stripe.checkout.sessions.create({
  line_items: [{ price_data: { currency: "eur", unit_amount: product.priceCents,
    product_data: { name: product.title } }, quantity: 1 }],
  mode: "payment",
  expires_at: Math.floor(Date.now() / 1000) + 30 * 60,  // release hold after 30 min
  metadata: { productId: product._id },
  success_url, cancel_url,
});
```

### Pattern 2: Static-first rendering with a server-context escape hatch for stock freshness

**What:** Galleries, about, and exhibitions are fully static (built at deploy time). Product pages are also statically rendered by default for speed/SEO, but the "sold out" state either (a) is refreshed via CMS webhook → redeploy on every stock change, or (b) is fetched client-side after hydration as a thin freshness check ("still available?") before allowing add-to-cart, since a full rebuild per sale is acceptable at this order volume.
**When to use:** Content-heavy sites where 95%+ of pages never change stock state, and order volume is low enough that "rebuild on sale" latency (seconds to a couple minutes) is acceptable.
**Trade-offs:** Simpler than running a server-rendered app for every request; the only risk is a visitor seeing a stale "available" badge for the few minutes between a sale and the next rebuild — mitigated by re-validating stock server-side at checkout-session creation (Pattern 1), so the worst case is a friendly "sold out" message at checkout, not an oversold order.

### Pattern 3: Locale-prefixed routing + CMS-native document internationalization

**What:** Every page lives under `/fr/...` and `/en/...`. Long-form content (bio, gallery descriptions, exhibition descriptions) is modeled as locale-aware fields/documents in the CMS so Romane edits both languages in the same editing UI. Short UI strings (nav labels, "Add to cart", "Sold out") live in a small dictionary file in the codebase, not the CMS, since they change rarely and don't need non-technical editing.
**When to use:** Two languages, content owner is non-technical but comfortable filling in a CMS form field per language.
**Trade-offs:** Splitting "content translations" (CMS) from "UI translations" (code) avoids forcing every microcopy change through a deploy, while avoiding forcing Romane into a codebase for content changes.

## Data Flow

### Content publishing flow

```
Romane edits in CMS Studio
    ↓
CMS dataset updated (document saved/published)
    ↓ (webhook)
Deploy platform receives build hook
    ↓
Static site rebuild: pages/[locale]/* re-queries CMS, re-renders HTML + image URLs
    ↓
New content live within ~1-2 minutes, no code involved
```

### Purchase flow (critical path)

```
Visitor browses static shop pages (stock badge from last build)
    ↓
Adds item to client-side cart (localStorage)
    ↓
Clicks "Checkout" → calls create-checkout-session function
    ↓
Function re-reads product from CMS (server-side truth) → checks stock > 0
    ↓ (if available)
Function creates Stripe Checkout Session (short expiry) → redirects visitor to Stripe
    ↓
Stripe hosts payment UI, handles card capture/3-D Secure/receipts
    ↓ (on success)
Stripe fires `checkout.session.completed` webhook → stripe-webhook function
    ↓
Function verifies signature → mutates CMS: decrement stock / mark sold
    ↓
Function triggers a rebuild (or relies on next build) so the site reflects new stock
    ↓
Function sends fulfillment notification (email to Romane with order + shipping details)
```

### Key data flows

1. **Content → Frontend:** One-directional, pull-based. The frontend queries the CMS at build time (and optionally at request time for a freshness check); the CMS never calls the frontend directly except via the publish webhook that triggers a rebuild.
2. **Checkout → Stock:** One-directional, push-based via Stripe webhook. The CMS is never queried by Stripe; the webhook function is the only bridge, and it must be idempotent (Stripe retries webhooks) — check "already processed this session ID" before decrementing stock twice.
3. **Locale state:** Carried entirely in the URL path, not cookies/sessions, so static caching and CDN edge delivery work unmodified per locale.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|---------------------------|
| 0–1k visitors/mo (this project's realistic range) | Exactly the architecture above. Free tiers of CMS, hosting, and functions comfortably cover this; the real constraint is order volume (tens/month), not traffic. |
| 1k–50k visitors/mo | Watch CMS API request quota and hosting bandwidth/function-invocation free-tier ceilings; image CDN bandwidth is usually the first to approach a limit on an image-heavy site — mitigate with aggressive `srcset`/lazy-loading and long CDN cache TTLs on static pages. |
| 50k+ visitors/mo or order volume in the hundreds/month | Reconsider "rebuild on every sale" (move stock-sensitive fragments to a small server-rendered/edge-cached island instead of a full static rebuild) and consider a dedicated lightweight order ledger (e.g. a small Postgres/SQLite-at-the-edge table) if reconciliation between Stripe and CMS stock ever needs auditing beyond what CMS document history provides. |

### Scaling Priorities

1. **First likely bottleneck:** CMS free-tier API request quota or asset bandwidth, since every page load pulls image URLs from the CMS CDN — not visitor count itself. Fix: cache aggressively, keep image transforms consistent (same size buckets) so the CDN cache hits instead of generating new variants per request.
2. **Second (much later) bottleneck:** Full-site rebuild time if the gallery catalog grows very large (hundreds of high-res photo entries) — fix by scoping rebuilds to only the affected route segment where the hosting platform supports incremental/on-demand rendering, or by moving the shop section to on-demand (server) rendering while keeping galleries static.

## Anti-Patterns

### Anti-Pattern 1: Trusting client-submitted price or stock at checkout

**What people do:** Build the Stripe Checkout Session (or PaymentIntent) using the price/quantity sent from the browser cart.
**Why it's wrong:** A visitor can tamper with client-side state (browser devtools, replayed requests) and pay an arbitrary lower price, or attempt to "buy" an item that's already sold.
**Do this instead:** Always re-fetch price and stock from the CMS inside the serverless function before creating the Checkout Session; the client only ever sends a product ID and quantity.

### Anti-Pattern 2: Storing product/gallery images in the git repository

**What people do:** Commit full-resolution photos into the frontend repo and let the framework's local image optimizer process them at build time.
**Why it's wrong:** Bloats repo size and clone/build times, duplicates what the CMS's image CDN already does better (on-the-fly resize/format), and makes it impossible for a non-technical owner to add photos without a code change — directly conflicting with the "Romane can add photos herself" requirement.
**Do this instead:** All artwork/gallery images live as CMS assets; the frontend only stores a thin URL-builder helper that requests the right size/format from the CMS's image CDN.

### Anti-Pattern 3: Two independent sources of truth for stock

**What people do:** Track available quantity both in the CMS (for display) and in Stripe (via `inventory` on Products/Prices) or in a spreadsheet, updating both by hand.
**Why it's wrong:** The two numbers drift the first time an update is missed, and Stripe explicitly does not enforce stock limits on its own — it will keep charging cards regardless of remaining stock.
**Do this instead:** CMS is the only place stock is stored; Stripe only ever sees "charge for this price," and the webhook function is the only writer that decrements CMS stock, gated by an idempotency check on the Checkout Session ID.

### Anti-Pattern 4: Full client-rendered SPA for the portfolio

**What people do:** Build the whole site as a client-side-rendered single-page app (plain React/Vue SPA) fetching CMS content in the browser.
**Why it's wrong:** Hurts SEO and first-paint performance for an image-heavy, discovery-driven artist site where search visibility and fast perceived load matter; adds unnecessary client JS for pages that are 95% static content.
**Do this instead:** Static-site generation (with islands for the few interactive widgets — cart, switcher, lightbox) gives fast, indexable pages by default.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|----------------------|-------|
| Headless CMS (e.g. Sanity) | Content API (GROQ/REST) queried at build time via an official client SDK; images referenced via the CMS's image URL builder | Free tier limits (API requests, bandwidth, users) vary and change over time — confirm current numbers before committing (see Sources); generally generous enough for this project's scale. |
| Stripe | Stripe Checkout (hosted page) created via server-side SDK call; webhook endpoint (`checkout.session.completed`, `checkout.session.expired`) verified with signing secret | Stripe does not track inventory itself — enforce stock server-side before session creation, and use `expires_at` on sessions to auto-release abandoned holds on limited items. |
| Deploy/hosting platform (e.g. Netlify/Vercel/Cloudflare Pages) | Static hosting + small serverless/edge functions for the checkout and webhook endpoints; a deploy hook URL is called by the CMS on publish | Free tiers of these platforms typically include enough function invocations and build minutes for this project's realistic traffic. |
| Transactional email (e.g. Resend, or forms-as-a-service like Netlify Forms/Formspree) | Serverless function or static form POST for the contact form and order-fulfillment notifications | Keeps a real inbox off the public form target and avoids running a mail server. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|----------------|-------|
| Frontend pages ↔ CMS | Read-only content API calls, build-time (and optionally light request-time freshness checks) | Frontend never writes to the CMS directly; all writes to the CMS (stock decrements) happen only from the webhook function, using a separate write-scoped API token. |
| Frontend cart ↔ Checkout function | Same-origin API call carrying only product ID + quantity | No price or stock data trusted from this call. |
| Checkout function ↔ Stripe | Server-side SDK call, secret API key never exposed to the browser | Standard hosted-Checkout integration; the frontend only receives a redirect URL. |
| Stripe ↔ Webhook function | Signed HTTPS webhook, verified against `STRIPE_WEBHOOK_SECRET` | Must be idempotent against retried deliveries (Stripe retries on non-2xx). |
| Webhook function ↔ CMS | Authenticated mutation API call (write token, scoped narrowly to the stock field/document type if the CMS supports token scoping) | This is the only write path into the CMS from application code; everything else content-related is edited by Romane through the Studio UI. |
| i18n routing ↔ Content queries | Locale segment from the URL is passed as a query parameter/filter into every CMS content query | Keeps locale resolution stateless and CDN-cacheable. |

## Sources

- [Stripe: Manage limited inventory with Checkout](https://docs.stripe.com/payments/checkout/managing-limited-inventory) — confirms `expires_at` session-hold pattern and that Stripe does not enforce stock limits itself. HIGH confidence (official docs).
- [Stripe: Manage your product catalog](https://docs.stripe.com/payments/checkout/product-catalog) — official guidance on server-side price/product handling for Checkout. HIGH confidence.
- [Astro Docs: Internationalization (i18n) Routing](https://docs.astro.build/en/guides/internationalization/) — confirms native locale-prefixed routing, fallback policy, added in Astro 3.0/4.0. HIGH confidence (official docs).
- [Astro Docs: E-commerce guide](https://docs.astro.build/en/guides/ecommerce/) — official patterns for pairing Astro's static/island model with payment providers. HIGH confidence.
- [Sanity Docs: Plans and payments](https://www.sanity.io/docs/platform-management/plans-and-payments) and [Sanity Docs: Technical limits](https://www.sanity.io/docs/content-lake/technical-limits) — free-tier limits; numbers vary by secondary source (blog posts) so treat exact figures as MEDIUM confidence and re-check at build time. Secondary commentary: [robotostudio.com — Sanity pricing 2026](https://robotostudio.com/blog/sanity-cms-pricing-which-plan-is-right-for-you), [nayankyada.com — Sanity free plan 2026](https://nayankyada.com/blog/sanity-cms-pricing-in-2026-free-plan-growth-and-when-you-need-enterprise).
- [Netlify: Headless Commerce whitepaper](https://www.netlify.com/resources/whitepapers/headless-e-commerce-whitepaper/) — general Jamstack + headless commerce architecture rationale. MEDIUM confidence (vendor content, but consistent with official framework/Stripe docs).
- [Snipcart: Headless eCommerce — a Developer's Guide](https://snipcart.com/blog/headless-ecommerce) — corroborates "static catalog + API-driven cart/checkout" as the standard small-shop Jamstack pattern. MEDIUM confidence (vendor content, cross-checked against Stripe/Astro official docs).

---
*Architecture research for: bilingual artist portfolio + low-volume e-commerce*
*Researched: 2026-07-05*
