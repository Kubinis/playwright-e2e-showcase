import { test, expect } from '../../src/fixtures/test';


/**
 * Component-level pixel checks, not full-page ones.
 *
 * A full-page baseline breaks on every unrelated content change and gets muted
 * within a week; a header, a card and a form are stable surfaces where a diff
 * almost always means a real regression.
 *
 * Anything animated or time-dependent is masked rather than waited out.
 */
test.describe('Visual regression', () => {
  const noise = (page: import('@playwright/test').Page) => [
    page.getByTestId('chat-toggle'),
    page.getByTestId('live-activity-toggle'),
    page.getByTestId('notification-bar'),
  ];

  test('site header', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('search-query').waitFor();

    await expect(page.locator('nav').first()).toHaveScreenshot('header.png', {
      mask: noise(page),
      animations: 'disabled',
    });
  });

  test('product card in the grid', async ({ home, page }) => {
    await home.open('/');
    await home.waitForGrid();

    await expect(home.productCards.first()).toHaveScreenshot('product-card.png', {
      animations: 'disabled',
      mask: noise(page),
    });
  });

  test('product detail panel', async ({ product, page, knownProduct }) => {
    await product.openById(knownProduct.id);
    await product.addToCart.waitFor();

    await expect(page.locator('[data-test="product-name"]').locator('xpath=ancestor::div[1]')).toHaveScreenshot(
      'product-detail.png',
      { animations: 'disabled', mask: noise(page) },
    );
  });

  test('contact form', async ({ contact, page }) => {
    await contact.openContact();

    await expect(page.locator('form').first()).toHaveScreenshot('contact-form.png', {
      animations: 'disabled',
      mask: noise(page),
    });
  });

  test('checkout cart step', async ({ product, checkout, page, knownProduct }) => {
    await product.openById(knownProduct.id);
    await product.addToCartAndWait(1);
    await checkout.openCheckout();
    await checkout.cartTotal.waitFor();

    await expect(page.locator('table').first()).toHaveScreenshot('checkout-cart.png', {
      animations: 'disabled',
      mask: noise(page),
    });
  });
});
