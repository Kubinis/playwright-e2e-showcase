export interface GuestDetails {
  email: string;
  firstName: string;
  lastName: string;
}

export interface BillingAddress {
  countryCode: string;
  street: string;
  houseNumber: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface PaymentDetails {
  method: 'Bank Transfer' | 'Cash on Delivery' | 'Credit Card' | 'Buy Now Pay Later' | 'Gift Card';
  /** Extra inputs the chosen method reveals, keyed by their data-test id. */
  fields?: Record<string, string>;
}

/** Unique per run so parallel workers never collide on the shared demo instance. */
export function uniqueGuest(): GuestDetails {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return { email: `qa.showcase+${stamp}@example.com`, firstName: 'Alex', lastName: 'Tester' };
}

/** The app validates postal code against the selected country — keep them in sync. */
export const NL_ADDRESS: BillingAddress = {
  countryCode: 'NL',
  street: 'Keizersgracht',
  houseNumber: '42',
  city: 'Amsterdam',
  state: 'Noord-Holland',
  postalCode: '1015 CS',
};

export const CASH_ON_DELIVERY: PaymentDetails = { method: 'Cash on Delivery' };

export const BANK_TRANSFER: PaymentDetails = {
  method: 'Bank Transfer',
  // The field accepts digits only — an IBAN is rejected (see docs/bug-reports/BUG-02).
  fields: { bank_name: 'ING', account_name: 'Alex Tester', account_number: '417164300' },
};

export const IBAN_ACCOUNT_NUMBER = 'NL91ABNA0417164300';

/**
 * The suite registers its own account instead of using the shared demo login.
 * Negative auth tests trigger the app's lockout after a handful of failed attempts,
 * so running them against a shared account locks it out for everyone — including
 * the next run of this suite.
 */
export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export function newUserPayload(): TestUser & Record<string, unknown> {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    email: `qa.showcase.${stamp}@example.com`,
    password: 'Sup3rSecret!2026',
    firstName: 'Alex',
    lastName: 'Tester',
    first_name: 'Alex',
    last_name: 'Tester',
    phone: '0612345678',
    dob: '1990-01-01',
    address: {
      street: 'Keizersgracht 42',
      city: 'Amsterdam',
      state: 'Noord-Holland',
      country: 'NL',
      postal_code: '1015 CS',
    },
  };
}

/**
 * The demo instance rebuilds its database periodically and every record gets a new
 * ULID, so a hard-coded product id rots within days. Names are stable — the suite
 * resolves the id at runtime through the API (see the knownProduct fixture).
 */
export const KNOWN_PRODUCT_NAME = 'Combination Pliers';
