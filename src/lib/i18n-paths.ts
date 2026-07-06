import { getRelativeLocaleUrl } from 'astro:i18n';

/**
 * Shared-slug switcher utility (D-04).
 *
 * Astro's built-in i18n routing does not know how to find "the equivalent
 * page in the other locale" for you — it only builds a URL for a locale +
 * path string you supply (RESEARCH.md Pattern 2 / Pitfall 1). This function
 * recovers the shared slug from the current pathname (stripping any locale
 * prefix) and re-applies it under the target locale via
 * `getRelativeLocaleUrl()`.
 */
export function getSwitcherHref(currentPath: string, targetLocale: 'fr' | 'en'): string {
  // Strip Astro's configured `base` (e.g. "/ajs-website/" on GitHub Pages)
  // before computing the slug: `Astro.url.pathname` reflects the deployed
  // base-prefixed path, but `getRelativeLocaleUrl()` below re-applies the
  // base itself — without stripping it first, a non-root base produces a
  // doubled path (e.g. "/ajs-website/ajs-website"). No-op when base is "/".
  const base = import.meta.env.BASE_URL ?? '/';
  const baseRelativePath =
    base !== '/' && currentPath.startsWith(base) ? currentPath.slice(base.length - 1) : currentPath;

  // Strip the current locale prefix (if any) and any trailing slash to
  // recover the shared slug.
  const slug = baseRelativePath.replace(/^\/en\//, '/').replace(/^\//, '').replace(/\/$/, '');

  // Missing-counterpart fallback (D-04, forward-looking to Phase 2+): if the
  // current page has no published translation in the target locale, send
  // the visitor to that locale's homepage instead of emitting a broken/404
  // link. Phase 1 only has a homepage, so every slug is treated as having a
  // counterpart today — later phases (galleries, About/Contact, Legal) should
  // replace `hasTranslatedCounterpart` with a real content-collection lookup
  // as pages that may exist in only one locale are introduced.
  const targetSlug = hasTranslatedCounterpart(slug, targetLocale) ? slug : '';
  const relative = getRelativeLocaleUrl(targetLocale, targetSlug);

  // Normalize the trailing slash independent of the project's configured
  // `trailingSlash`/`build.format` settings: the locale homepage always ends
  // in "/", every other page never does.
  if (targetSlug === '') {
    return relative.endsWith('/') ? relative : `${relative}/`;
  }
  const normalized = relative.replace(/\/$/, '');
  return normalized === '' ? '/' : normalized;
}

/**
 * Placeholder existence check. Always `true` in Phase 1 (only the homepage
 * exists, and it exists in both locales) — replace with a real per-page
 * lookup once Phase 2+ content can genuinely be missing a translation.
 */
function hasTranslatedCounterpart(_slug: string, _targetLocale: 'fr' | 'en'): boolean {
  return true;
}
