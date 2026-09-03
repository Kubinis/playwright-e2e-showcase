import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { ProductPage } from '../pages/product.page';
import { CheckoutPage } from '../pages/checkout.page';
import { LoginPage } from '../pages/login.page';
import { ContactPage } from '../pages/contact.page';
import { ApiClient, type Product, type Paginated } from '../api/client';
import { KNOWN_PRODUCT_NAME, newUserPayload, type TestUser } from './data';

const API_BASE = process.env.API_BASE_URL ?? 'https://api.practicesoftwaretesting.com';

interface Pages {
  home: HomePage;
  product: ProductPage;
  checkout: CheckoutPage;
  login: LoginPage;
  contact: ContactPage;
}

interface ApiFixtures {
  api: ApiClient;
  apiRequest: APIRequestContext;
  /**
   * A throwaway account for one test. Negative auth tests trip the lockout, so they
   * must never share the worker account that positive tests rely on.
   */
  disposableUser: TestUser;
}

interface WorkerFixtures {
  /** A real, currently existing product resolved once per worker. */
  knownProduct: Product;
  /** An account this worker owns, so lockout from negative tests hurts nobody else. */
  testUser: TestUser;
}

/**
 * One entry point for the whole suite: `import { test, expect } from '<...>/fixtures/test'`.
 * Page objects are lazily constructed per test, so a spec that only needs the API
 * never pays for a browser page it does not use.
 */
export const test = base.extend<Pages & ApiFixtures, WorkerFixtures>({
  home: async ({ page }, use) => use(new HomePage(page)),
  product: async ({ page }, use) => use(new ProductPage(page)),
  checkout: async ({ page }, use) => use(new CheckoutPage(page)),
  login: async ({ page }, use) => use(new LoginPage(page)),
  contact: async ({ page }, use) => use(new ContactPage(page)),

  apiRequest: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: { Accept: 'application/json' },
    });
    await use(ctx);
    await ctx.dispose();
  },

  api: async ({ apiRequest }, use) => use(new ApiClient(apiRequest)),

  disposableUser: async ({ apiRequest }, use) => {
    const payload = newUserPayload();
    const res = await apiRequest.post('/users/register', { data: payload });
    if (!res.ok()) {
      throw new Error('Could not register a disposable user: ' + res.status() + ' ' + (await res.text()));
    }
    await use({
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
    });
  },

  testUser: [
    async ({ playwright }, use) => {
      const ctx = await playwright.request.newContext({ baseURL: API_BASE });
      const payload = newUserPayload();
      const res = await ctx.post('/users/register', { data: payload });
      const ok = res.ok();
      const detail = ok ? '' : res.status() + ' ' + (await res.text());
      await ctx.dispose();

      if (!ok) {
        throw new Error('Could not register a test user: ' + detail);
      }
      await use({
        email: payload.email,
        password: payload.password,
        firstName: payload.firstName,
        lastName: payload.lastName,
      });
    },
    { scope: 'worker' },
  ],

  // Worker-scoped: one lookup per worker instead of one per test.
  knownProduct: [
    async ({ playwright }, use) => {
      const ctx = await playwright.request.newContext({ baseURL: API_BASE });
      const res = await ctx.get('/products/search', { params: { q: KNOWN_PRODUCT_NAME } });
      const body = (await res.json()) as Paginated<Product>;
      const match = body.data.find((p) => p.name === KNOWN_PRODUCT_NAME) ?? body.data[0];
      await ctx.dispose();

      if (!match) {
        throw new Error(
          `No product named "${KNOWN_PRODUCT_NAME}" in the demo dataset — the fixture needs a new anchor product.`,
        );
      }
      await use(match);
    },
    { scope: 'worker' },
  ],
});

export { expect };
