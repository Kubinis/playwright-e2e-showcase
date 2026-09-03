import { test, expect } from '../../src/fixtures/test';


test.describe('Cart', () => {
  test('adding a product puts one line in the cart with the right total @smoke', async ({ product, checkout, knownProduct }) => {
    await product.openById(knownProduct.id);
    const productName = (await product.name.textContent())!.trim();
    const unitPrice = await product.unitPrice();
    await product.addToCartAndWait(1);

    await checkout.openCheckout();

    await expect(checkout.lineItems).toHaveCount(1);
    await expect(checkout.lineItems.first()).toContainText(productName);
    expect(await checkout.totalAmount()).toBeCloseTo(unitPrice, 2);
  });

  test('cart total equals unit price times quantity', async ({ product, checkout, knownProduct }) => {
    await product.openById(knownProduct.id);
    const unitPrice = await product.unitPrice();
    await product.setQuantity(3);
    await product.addToCartAndWait(3);

    await checkout.openCheckout();

    // Rounding is where cart totals actually break, so compare against the
    // arithmetic result rather than re-reading the number the UI printed.
    expect(await checkout.totalAmount()).toBeCloseTo(unitPrice * 3, 2);
  });

  test('cart survives a full page reload', async ({ product, checkout, page, knownProduct }) => {
    await product.openById(knownProduct.id);
    await product.addToCartAndWait(1);

    await page.reload({ waitUntil: 'domcontentloaded' });

    // The badge is client state; a reload is the cheapest test that it is persisted
    // rather than held in memory.
    await expect(product.cartBadge).toHaveText('1');
    await checkout.openCheckout();
    await expect(checkout.lineItems).toHaveCount(1);
  });

  test('a fresh session starts with an empty cart', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('cart-quantity')).toBeHidden();

    await context.close();
  });
});
