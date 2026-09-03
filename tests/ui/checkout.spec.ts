import { test, expect } from '../../src/fixtures/test';
import { uniqueGuest, NL_ADDRESS, CASH_ON_DELIVERY, BANK_TRANSFER, IBAN_ACCOUNT_NUMBER } from '../../src/fixtures/data';

test.describe('Guest checkout', () => {
  test.beforeEach(async ({ product, knownProduct }) => {
    await product.openById(knownProduct.id);
    await product.addToCartAndWait(1);
  });

  test('completes end to end and confirms the payment @smoke', async ({ checkout }) => {
    await checkout.openCheckout();
    const total = await checkout.totalAmount();

    await checkout.continueAsGuest(uniqueGuest());
    await checkout.fillBillingAddress(NL_ADDRESS);
    await checkout.submitBillingAddress();
    await checkout.pay(CASH_ON_DELIVERY);

    await expect(checkout.successMessage).toBeVisible();
    await expect(checkout.successMessage).toContainText(/success/i);
    expect(total).toBeGreaterThan(0);
  });

  test('bank transfer reveals its own fields and only then enables Confirm', async ({ checkout }) => {
    await checkout.openCheckout();
    await checkout.continueAsGuest(uniqueGuest());
    await checkout.fillBillingAddress(NL_ADDRESS);
    await checkout.submitBillingAddress();

    await checkout.paymentMethod.selectOption({ label: 'Bank Transfer' });

    await expect(checkout.bankName).toBeVisible();
    // Conditional fields start empty, so Confirm must stay disabled — otherwise the
    // form would submit a payment with no account details.
    await expect(checkout.finish).toBeDisabled();

    await checkout.pay(BANK_TRANSFER);
    await expect(checkout.successMessage).toBeVisible();
  });

  test('a non-numeric account number is rejected with a message that says why', async ({ checkout }) => {
    await checkout.openCheckout();
    await checkout.continueAsGuest(uniqueGuest());
    await checkout.fillBillingAddress(NL_ADDRESS);
    await checkout.submitBillingAddress();
    await checkout.paymentMethod.selectOption({ label: 'Bank Transfer' });

    await checkout.bankName.fill('ING');
    await checkout.accountName.fill('Alex Tester');
    await checkout.accountNumber.fill(IBAN_ACCOUNT_NUMBER);
    await checkout.accountNumber.blur();

    // Rejecting input is only half the job: the customer has to be told why,
    // otherwise a disabled Confirm button looks like a broken page.
    await expect(checkout.finish).toBeDisabled();
    expect((await checkout.validationMessages()).join(' ')).toMatch(/account number must be numeric/i);
  });

  test('the billing step cannot be submitted with required fields empty', async ({ checkout }) => {
    await checkout.openCheckout();
    await checkout.continueAsGuest(uniqueGuest());

    await expect(checkout.proceedFromAddress).toBeDisabled();
  });

  test('later wizard steps are not reachable before the current one is completed', async ({ checkout, page }) => {
    await checkout.openCheckout();

    await expect(checkout.proceedFromCart).toBeVisible();
    // Every later step exists in the DOM from the start; only the active one is
    // visible. A "hidden" assertion is the meaningful one here, not "not present".
    await expect(page.getByTestId('payment-method')).toBeHidden();
    await expect(page.getByTestId('finish')).toBeHidden();
  });
});

/**
 * A defect found while building this suite. The test describes the behaviour the
 * application should have, so it fails on purpose and will start passing the day
 * the bug is fixed — see docs/bug-reports/BUG-01.
 */
test.describe('Known defects', () => {
  test.beforeEach(async ({ product, knownProduct }) => {
    await product.openById(knownProduct.id);
    await product.addToCartAndWait(1);
  });

  test.fail(true, 'BUG-01: postal-code validation is displayed but not enforced');
  test('a postal code that does not match the country blocks the billing step', async ({ checkout }) => {
    await checkout.openCheckout();
    await checkout.continueAsGuest(uniqueGuest());

    await checkout.fillBillingAddress({ ...NL_ADDRESS, postalCode: '00000' });

    // The app renders "The postal code format is not valid for the selected country."
    // and still marks the field ng-valid, so Proceed stays enabled and the order
    // goes through with an invalid address.
    expect((await checkout.validationMessages()).join(' ')).toMatch(/postal code/i);
    await expect(checkout.proceedFromAddress).toBeDisabled();
  });

});
