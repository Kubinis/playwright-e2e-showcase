import { test, expect } from '../../src/fixtures/test';

test.describe('Catalog browsing @smoke', () => {
  test.beforeEach(async ({ home }) => {
    await home.open('/');
    await home.waitForGrid();
  });

  test('landing page lists products with a name and a price', async ({ home }) => {
    await expect(home.productCards.first()).toBeVisible();
    const [names, prices] = [await home.productNames(), await home.productPrices()];

    expect(names.length).toBeGreaterThan(0);
    expect(names.length).toBe(prices.length);
    expect(names.every((n) => n.trim().length > 0)).toBe(true);
    // A price that parses to 0 means the card rendered an empty or broken value.
    expect(prices.every((p) => p > 0)).toBe(true);
  });

  test('search narrows the grid and every hit matches the term', async ({ home }) => {
    await home.search('Pliers');

    const names = await home.productNames();
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) expect(name.toLowerCase()).toContain('pliers');
  });

  test('search for a term with no matches shows an empty grid, not a stale one', async ({ home, page }) => {
    const before = await home.productNames();
    await home.search('zzz-no-such-product-zzz');

    await expect(home.productCards).toHaveCount(0);
    await expect(page.getByText(/no products found|there are no products/i)).toBeVisible();
    expect(before.length).toBeGreaterThan(0);
  });

  test('reset restores the full grid after a search', async ({ home }) => {
    const initial = await home.productNames();
    await home.search('Pliers');
    expect((await home.productNames()).length).toBeLessThan(initial.length);

    await home.resetSearch();
    expect((await home.productNames()).length).toBe(initial.length);
  });

  test('sorting by price ascending returns a non-decreasing sequence', async ({ home }) => {
    await home.sortBy('Price (Low - High)');

    const prices = await home.productPrices();
    expect(prices.length).toBeGreaterThan(1);
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });

  test('sorting by price descending returns a non-increasing sequence', async ({ home }) => {
    await home.sortBy('Price (High - Low)');

    const prices = await home.productPrices();
    const sorted = [...prices].sort((a, b) => b - a);
    expect(prices).toEqual(sorted);
  });

  test('pagination loads a different set of products', async ({ home }) => {
    const firstPage = await home.productNames();
    await home.paginationNext.click();
    await home.waitForGrid();

    const secondPage = await home.productNames();
    expect(secondPage.length).toBeGreaterThan(0);
    expect(secondPage).not.toEqual(firstPage);
  });
});
