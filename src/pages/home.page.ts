import type { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  readonly searchInput: Locator;
  readonly searchSubmit: Locator;
  readonly searchReset: Locator;
  readonly sortSelect: Locator;
  readonly productCards: Locator;
  readonly paginationNext: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByTestId('search-query');
    this.searchSubmit = page.getByTestId('search-submit');
    this.searchReset = page.getByTestId('search-reset');
    this.sortSelect = page.getByTestId('sort');
    this.productCards = page.locator('[data-test^="product-01"]');
    this.paginationNext = page.getByTestId('pagination-next');
  }

  protected get anchor(): Locator {
    return this.searchInput;
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchSubmit.click();
    await this.waitForGrid();
  }

  async resetSearch(): Promise<void> {
    await this.searchReset.click();
    await this.waitForGrid();
  }

  /** Grid re-renders on every filter change; wait for the request, not a timeout. */
  async waitForGrid(): Promise<void> {
    await this.page
      .waitForResponse((r) => r.url().includes('/products') && r.status() === 200, { timeout: 15_000 })
      .catch(() => undefined);
    await this.page.locator('[data-test^="product-01"], [data-test="no-results"]').first().waitFor();
  }

  async filterByCategory(name: string): Promise<void> {
    await this.page.getByLabel(name, { exact: true }).check();
    await this.waitForGrid();
  }

  async sortBy(label: string): Promise<void> {
    await this.sortSelect.selectOption({ label });
    await this.waitForGrid();
  }

  async productNames(): Promise<string[]> {
    return this.productCards.locator('[data-test="product-name"]').allInnerTexts();
  }

  async productPrices(): Promise<number[]> {
    const raw = await this.productCards.locator('[data-test="product-price"]').allInnerTexts();
    return raw.map((t) => Number(t.replace(/[^0-9.]/g, '')));
  }

  async openProduct(index = 0): Promise<void> {
    await this.productCards.nth(index).click();
  }

  async openProductByName(name: string): Promise<void> {
    await this.productCards.filter({ hasText: name }).first().click();
  }
}
