// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Static output (framework default) — no server-rendering integration is
  // installed. OVH Web Hosting is a plain Apache file server with zero
  // request-time compute, so this project never needs @astrojs/cloudflare,
  // @astrojs/node, or any other SSR-enabling package.
  output: 'static',
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      // French is served at "/" (no "/fr/" prefix); English lives under "/en/".
      // D-01 / D-02 — no Accept-Language auto-redirect.
      prefixDefaultLocale: false,
    },
  },
});
