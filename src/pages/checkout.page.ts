import type { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import type { GuestDetails, BillingAddress, PaymentDetails } from '../fixtures/data';

/**
 * The checkout is a 4-step wizard rendered as one DOM: every step's inputs
 * exist from the start and only the active step is visible. Page-object methods
 * therefore assert on *visibility*, never on presence.
 */
export class CheckoutPage extends BasePage {
  readonly lineItems: Locator;
  readonly cartTotal: Locator;
  readonly proceedFromCart: Locator;
  readonly guestTab: Locator;
  readonly guestEmail: Locator;
  readonly guestFirstName: Locator;
  readonly guestLastName: Locator;
  readonly guestSubmit: Locator;
  readonly proceedFromSignIn: Locator;
  readonly country: Locator;
  readonly postalCode: Locator;
  readonly houseNumber: Locator;
  readonly street: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly proceedFromAddress: Locator;
  readonly paymentMethod: Locator;
  readonly finish: Locator;
  readonly successMessage: Locator;
  /** Bank-transfer conditional fields, revealed only when that method is picked. */
  readonly bankName: Locator;
  readonly accountName: Locator;
  readonly accountNumber: Locator;

  constructor(page: Page) {
    super(page);
    this.lineItems = page.getByTestId('product-title');
    this.cartTotal = page.getByTestId('cart-total');
    this.proceedFromCart = page.getByTestId('proceed-1');
    this.guestTab = page.getByRole('tab', { name: /continue as guest/i });
    this.guestEmail = page.getByTestId('guest-email');
    this.guestFirstName = page.getByTestId('guest-first-name');
    this.guestLastName = page.getByTestId('guest-last-name');
    this.guestSubmit = page.getByTestId('guest-submit');
    this.proceedFromSignIn = page.getByTestId('proceed-2-guest');
    this.country = page.getByTestId('country');
    this.postalCode = page.getByTestId('postal_code');
    this.houseNumber = page.getByTestId('house_number');
    this.street = page.getByTestId('street');
    this.city = page.getByTestId('city');
    this.state = page.getByTestId('state');
    this.proceedFromAddress = page.getByTestId('proceed-3');
    this.paymentMethod = page.getByTestId('payment-method');
    this.finish = page.getByTestId('finish');
    this.successMessage = page.getByTestId('payment-success-message');
    this.bankName = page.getByTestId('bank_name');
    this.accountName = page.getByTestId('account_name');
    this.accountNumber = page.getByTestId('account_number');
  }

  protected get anchor(): Locator {
    return this.proceedFromCart;
  }

  async openCheckout(): Promise<void> {
    await this.open('/checkout');
  }

  async totalAmount(): Promise<number> {
    return Number(((await this.cartTotal.textContent()) ?? '').replace(/[^0-9.]/g, ''));
  }

  async continueAsGuest(guest: GuestDetails): Promise<void> {
    await this.proceedFromCart.click();
    await this.guestTab.click();
    await this.guestEmail.fill(guest.email);
    await this.guestFirstName.fill(guest.firstName);
    await this.guestLastName.fill(guest.lastName);
    await this.guestSubmit.click();
    await this.proceedFromSignIn.click();
    await this.street.waitFor({ state: 'visible' });
  }

  async fillBillingAddress(address: BillingAddress): Promise<void> {
    await this.country.selectOption(address.countryCode);
    await this.street.fill(address.street);
    await this.houseNumber.fill(address.houseNumber);
    await this.city.fill(address.city);
    await this.state.fill(address.state);
    await this.postalCode.fill(address.postalCode);
    // Angular only re-validates on blur; without it the Proceed button can stay
    // disabled with every field filled — the classic false "the button is broken".
    await this.postalCode.blur();
  }

  async submitBillingAddress(): Promise<void> {
    await this.proceedFromAddress.click();
    await this.paymentMethod.waitFor({ state: 'visible' });
  }

  async pay(payment: PaymentDetails): Promise<void> {
    await this.paymentMethod.selectOption({ label: payment.method });
    for (const [testId, value] of Object.entries(payment.fields ?? {})) {
      const field = this.page.getByTestId(testId);
      await field.fill(value);
      await field.blur();
    }
    await this.finish.click();
  }

  /**
   * Only messages the customer can actually see. Angular keeps every error node
   * in the DOM, so an unfiltered read would report errors that are not on screen.
   */
  async validationMessages(): Promise<string[]> {
    return (await this.page.locator('.invalid-feedback:visible, .alert-danger:visible').allInnerTexts())
      .map((t) => t.trim())
      .filter(Boolean);
  }
}
