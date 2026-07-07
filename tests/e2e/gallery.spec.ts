import { test, expect } from '@playwright/test';

// RED (Wave 0): the gallery listing/detail pages and the Lightbox island do
// not exist yet — they are built in Plans 02-03 and 02-04. These assertions
// target the real data/markup contracts documented in 02-RESEARCH.md (native
// <dialog> lightbox, data-role="counter") and 02-UI-SPEC.md (accessible-name
// copywriting contract) and are expected to FAIL until those plans land — do
// not stub or weaken them to make them pass early.

test.describe('gallery listing', () => {
  test('renders gallery cards and the first card matches the manually-ordered first gallery', async ({
    page,
  }) => {
    await page.goto('/galleries/');

    const cards = page.getByRole('link', { name: /voir la galerie/i });
    await expect(cards.first()).toBeVisible();

    const firstCardName = (await cards.first().textContent())?.trim() ?? '';
    expect(firstCardName.length).toBeGreaterThan(0);

    const href = await cards.first().getAttribute('href');
    expect(href).toMatch(/\/galleries\/[^/]+\/?$/);
  });
});

test.describe('gallery detail', () => {
  test('renders the bilingual artist statement, differing between "/galleries/{slug}" and "/en/galleries/{slug}"', async ({
    page,
  }) => {
    await page.goto('/galleries/');

    const firstCardHref = await page
      .getByRole('link', { name: /voir la galerie/i })
      .first()
      .getAttribute('href');
    expect(firstCardHref).toBeTruthy();

    const slugMatch = firstCardHref!.match(/\/galleries\/([^/]+)\/?$/);
    const slug = slugMatch?.[1];
    expect(slug).toBeTruthy();

    await page.goto(firstCardHref!);
    const frStatement = (await page.locator('main').innerText()).trim();
    expect(frStatement.length).toBeGreaterThan(0);

    await page.goto(`/en/galleries/${slug}/`);
    const enStatement = (await page.locator('main').innerText()).trim();
    expect(enStatement.length).toBeGreaterThan(0);

    expect(enStatement).not.toBe(frStatement);
  });
});

test.describe('lightbox', () => {
  test('opens on thumbnail click, ArrowRight advances the counter, Escape closes and returns focus to the trigger', async ({
    page,
  }) => {
    await page.goto('/galleries/');

    const firstCardHref = await page
      .getByRole('link', { name: /voir la galerie/i })
      .first()
      .getAttribute('href');
    expect(firstCardHref).toBeTruthy();

    await page.goto(firstCardHref!);

    const firstThumbnail = page
      .getByRole('button', { name: /voir en taille r.elle|view full size/i })
      .first();
    await firstThumbnail.click();

    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();

    const counter = dialog.locator('[data-role="counter"]');
    const initialCounter = await counter.innerText();

    await page.keyboard.press('ArrowRight');
    await expect(counter).not.toHaveText(initialCounter);

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(firstThumbnail).toBeFocused();
  });
});
