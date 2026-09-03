import type { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ProductPage extends BasePage {
  readonly name: Locator;
  readonly price: Locator;
  readonly quantity: Locator;
  readonly increase: Locator;
  readonly decrease: Locator;
  readonly addToCart: Locator;
  readonly addToFavorites: Locator;
  readonly outOfStock: Locator;

  constructor(page: Page) {
    super(page);
    this.name = page.getByTestId('product-name');
    this.price = page.getByTestId('unit-price');
    this.quantity = page.getByTestId('quantity');
    this.increase = page.getByTestId('increase-quantity');
    this.decrease = page.getByTestId('decrease-quantity');
    this.addToCart = page.getByTestId('add-to-cart');
    this.addToFavorites = page.getByTestId('add-to-favorites');
    this.outOfStock = page.getByTestId('out-of-stock');
  }

  protected get anchor(): Locator {
    return this.name;
  }

  async openById(id: string): Promise<void> {
    await this.open(`/product/${id}`);
  }

  async setQuantity(n: number): Promise<void> {
    for (let i = 1; i < n; i++) await this.increase.click();
  }

  /**
   * Adds to cart and waits for the badge to reach the expected total.
   * Asserting on the badge (not a sleep) is what keeps this stable under load.
   */
  async addToCartAndWait(expectedTotal: number): Promise<void> {
    await this.addToCart.click();
    await this.page
      .getByTestId('cart-quantity')
      .filter({ hasText: String(expectedTotal) })
      .waitFor({ timeout: 15_000 });
  }

  async unitPrice(): Promise<number> {
    return Number(((await this.price.textContent()) ?? '').replace(/[^0-9.]/g, ''));
  }
}
