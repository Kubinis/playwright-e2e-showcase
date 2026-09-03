import { test, expect } from '../../src/fixtures/test';


test.describe('Product detail', () => {
  test('opening a card from the grid keeps name and price identical @smoke', async ({ home, product }) => {
    await home.open('/');
    await home.waitForGrid();
    const gridName = (await home.productNames())[0];
    const gridPrice = (await home.productPrices())[0];

    await home.openProduct(0);

    await expect(product.name).toHaveText(gridName);
    // Grid and detail read the same record — a mismatch here is a data-binding bug,
    // the kind that only shows up when the two views use different endpoints.
    expect(await product.unitPrice()).toBe(gridPrice);
  });

  test('quantity stepper does not go below 1', async ({ product, knownProduct }) => {
    await product.openById(knownProduct.id);

    await expect(product.quantity).toHaveValue('1');
    await product.decrease.click();
    await expect(product.quantity).toHaveValue('1');
  });

  test('quantity stepper increments and is reflected in the cart badge', async ({ product, knownProduct }) => {
    await product.openById(knownProduct.id);
    await product.setQuantity(3);
    await expect(product.quantity).toHaveValue('3');

    await product.addToCartAndWait(3);

    expect(await product.cartCount()).toBe(3);
  });

  test('product page exposes a description and a specification table', async ({ product, page, knownProduct }) => {
    await product.openById(knownProduct.id);

    await expect(page.getByTestId('product-description')).not.toBeEmpty();
    await expect(page.getByTestId('spec-row').first()).toBeVisible();
    const specNames = await page.getByTestId('spec-name').allInnerTexts();
    expect(specNames.every((n) => n.trim().length > 0)).toBe(true);
  });

  test('an out-of-stock product cannot be added to the cart', async ({ home, page, product }) => {
    await home.open('/');
    await home.waitForGrid();
    const outOfStockCard = page.locator('[data-test^="product-01"]').filter({ has: page.getByTestId('out-of-stock') });
    test.skip((await outOfStockCard.count()) === 0, 'demo dataset currently has no out-of-stock product');

    await outOfStockCard.first().click();

    await expect(product.outOfStock).toBeVisible();
    await expect(product.addToCart).toBeDisabled();
  });
});
