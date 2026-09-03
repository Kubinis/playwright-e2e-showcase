import { test, expect } from '../../src/fixtures/test';
import type { Paginated, Product } from '../../src/api/client';


test.describe('Products API', () => {
  test('GET /products returns a paginated payload with the documented shape @smoke', async ({ api }) => {
    const res = await api.products();

    expect(res.status()).toBe(200);
    const body = (await res.json()) as Paginated<Product>;
    expect(body.current_page).toBe(1);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.length).toBeLessThanOrEqual(body.per_page);

    for (const product of body.data) {
      expect(product).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        price: expect.any(Number),
      });
      // A price of 0 or below would render as a free product in the catalog.
      expect(product.price).toBeGreaterThan(0);
    }
  });

  test('GET /products/:id returns the requested product', async ({ api, knownProduct }) => {
    const res = await api.product(knownProduct.id);

    expect(res.status()).toBe(200);
    const product = (await res.json()) as Product;
    expect(product.id).toBe(knownProduct.id);
    expect(product.name.length).toBeGreaterThan(0);
  });

  test('GET /products/:id with an unknown id returns 404, not an empty 200', async ({ api }) => {
    const res = await api.product('01ZZZZZZZZZZZZZZZZZZZZZZZZ');

    // A 200 with an empty body is the failure mode that lets a broken detail page
    // ship unnoticed, so the status code is the assertion that matters.
    expect(res.status()).toBe(404);
  });

  test('pagination returns disjoint pages', async ({ api }) => {
    const first = (await (await api.products({ page: 1 })).json()) as Paginated<Product>;
    const second = (await (await api.products({ page: 2 })).json()) as Paginated<Product>;

    const firstIds = new Set(first.data.map((p) => p.id));
    const overlap = second.data.filter((p) => firstIds.has(p.id));
    expect(overlap).toEqual([]);
  });

  test('search returns only products matching the term', async ({ api }) => {
    const res = await api.search('pliers');

    expect(res.status()).toBe(200);
    const body = (await res.json()) as Paginated<Product>;
    expect(body.data.length).toBeGreaterThan(0);
    for (const product of body.data) {
      expect(product.name.toLowerCase()).toContain('pliers');
    }
  });

  test('brands and categories expose stable identifiers', async ({ api }) => {
    const [brands, categories] = await Promise.all([api.brands(), api.categories()]);

    expect(brands.status()).toBe(200);
    expect(categories.status()).toBe(200);
    for (const item of [...(await brands.json()), ...(await categories.json())]) {
      expect(item).toMatchObject({ id: expect.any(String), name: expect.any(String), slug: expect.any(String) });
    }
  });
});
