import { describe, expect, it } from 'vitest';
import { getSwitcherHref } from '../../src/lib/i18n-paths';

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
});
