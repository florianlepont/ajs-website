import { describe, expect, it } from 'vitest';
import { getSwitcherHref, stripBasePath } from '../../src/lib/i18n-paths';

// RED (Wave 0): src/lib/i18n-paths.ts does not exist yet — it is built in
// Plan 04. This import failure is the intended failing state for this task;
// do not stub or weaken these assertions to make them pass early.

describe('getSwitcherHref', () => {
  it('maps the French homepage to the English homepage', () => {
    expect(getSwitcherHref('/', 'en')).toBe('/en/');
  });

  it('maps the English homepage back to the French homepage', () => {
    expect(getSwitcherHref('/en/', 'fr')).toBe('/');
  });

  it('maps a French shared-slug page to its English counterpart', () => {
    expect(getSwitcherHref('/rebut', 'en')).toBe('/en/rebut');
  });

  it('maps an English shared-slug page back to its French counterpart', () => {
    expect(getSwitcherHref('/en/rebut', 'fr')).toBe('/rebut');
  });

  it('falls back to each locale homepage for the 404 page instead of a nonsensical /404 slug (WR-06)', () => {
    expect(getSwitcherHref('/404', 'en')).toBe('/en/');
    expect(getSwitcherHref('/en/404', 'fr')).toBe('/');
  });
});

// WR-04: regression coverage for the exact bug class that shipped as CR-01 —
// nothing previously exercised non-root-base behavior, so a base-stripping
// regression could (and did) ship undetected. stripBasePath is the pure,
// isolated piece of that logic (see i18n-paths.ts for why it's extracted).
describe('stripBasePath', () => {
  it('is a no-op when base is root', () => {
    expect(stripBasePath('/en/', '/')).toBe('/en/');
    expect(stripBasePath('/rebut', '/')).toBe('/rebut');
  });

  it('strips a non-root base without doubling it', () => {
    expect(stripBasePath('/ajs-website/', '/ajs-website/')).toBe('/');
    expect(stripBasePath('/ajs-website/en/', '/ajs-website/')).toBe('/en/');
    expect(stripBasePath('/ajs-website/rebut', '/ajs-website/')).toBe('/rebut');
  });

  it('leaves the path untouched if it does not start with the configured base', () => {
    expect(stripBasePath('/other-site/en/', '/ajs-website/')).toBe('/other-site/en/');
  });
});
