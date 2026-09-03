import type { Page, Locator } from '@playwright/test';

/**
 * Shared plumbing for every page object.
 *
 * The app is an Angular SPA with a live-activity websocket, so `networkidle`
 * never settles — `goto` here waits for a page-specific anchor instead.
 */
export abstract class BasePage {
  protected constructor(protected readonly page: Page) {}

  /** Element that proves this page finished rendering. */
  protected abstract get anchor(): Locator;

  async open(path = '/'): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    await this.anchor.waitFor({ state: 'visible' });
  }

  get cartBadge(): Locator {
    return this.page.getByTestId('cart-quantity');
  }

  get navCart(): Locator {
    return this.page.getByTestId('nav-cart');
  }

  async cartCount(): Promise<number> {
    if (!(await this.cartBadge.isVisible().catch(() => false))) return 0;
    return Number((await this.cartBadge.textContent())?.trim() ?? '0');
  }

  async gotoCart(): Promise<void> {
    await this.navCart.click();
  }

  /**
   * Opens the account dropdown. Below the Bootstrap breakpoint the whole navbar
   * collapses behind a toggler, so the menu button exists but is not visible —
   * the reason the same click works on desktop and times out on a phone viewport.
   */
  async expandNavbarIfCollapsed(): Promise<void> {
    const toggler = this.page.locator('.navbar-toggler');
    if (await toggler.isVisible().catch(() => false)) {
      await toggler.click();
    }
  }

  async openAccountMenu(): Promise<void> {
    await this.expandNavbarIfCollapsed();
    const menu = this.page.getByTestId('nav-menu');
    await menu.waitFor({ state: 'visible' });
    await menu.click();
  }

  async signOut(): Promise<void> {
    await this.openAccountMenu();
    await this.page.getByTestId('nav-sign-out').click();
  }
}
