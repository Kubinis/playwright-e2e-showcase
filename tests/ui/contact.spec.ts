import { test, expect } from '../../src/fixtures/test';

const LONG_ENOUGH_MESSAGE =
  'This message is deliberately longer than fifty characters so it passes the minimum length rule.';

test.describe('Contact form', () => {
  test.beforeEach(async ({ contact }) => {
    await contact.openContact();
  });

  test('an empty form is not submitted and reports what is missing @smoke', async ({ contact, page }) => {
    await contact.submit.click();

    await expect(page.getByText(/thanks for your message/i)).toBeHidden();
    // Note: on a first submit of a completely untouched form the app only reports
    // the two select/textarea fields — the text inputs stay silent until they are
    // touched. Asserting the full list here would be asserting a behaviour the app
    // does not have; the next test covers the text fields on their own.
    // Web-first assertions, not a one-shot read: the messages render a tick after
    // the click, and a plain array read turns the test flaky under parallel load.
    await expect(page.getByText('Subject is required')).toBeVisible();
    await expect(page.getByText('Message is required')).toBeVisible();
  });

  test('missing personal details are each reported by name', async ({ contact, page }) => {
    await contact.subject.selectOption({ label: 'Customer service' });
    await contact.message.fill(LONG_ENOUGH_MESSAGE);

    await contact.submit.click();

    for (const field of ['First name', 'Last name', 'Email']) {
      await expect(page.getByText(`${field} is required`)).toBeVisible();
    }
  });

  test('a message shorter than the minimum is rejected with the rule stated', async ({ contact, page }) => {
    await contact.firstName.fill('Alex');
    await contact.lastName.fill('Tester');
    await contact.email.fill('alex@example.com');
    await contact.subject.selectOption({ label: 'Customer service' });
    await contact.message.fill('too short');

    await contact.submit.click();

    // A rejection that does not state the rule sends the user guessing.
    await expect(page.getByText(/minimal 50 characters/i)).toBeVisible();
  });

  test('a malformed email address is rejected', async ({ contact, page }) => {
    await contact.firstName.fill('Alex');
    await contact.lastName.fill('Tester');
    await contact.email.fill('not-an-email');
    await contact.subject.selectOption({ label: 'Customer service' });
    await contact.message.fill(LONG_ENOUGH_MESSAGE);

    await contact.submit.click();

    await expect(page.getByText(/email format is invalid/i)).toBeVisible();
  });

  test('a complete form is accepted and confirmed on screen', async ({ contact, page }) => {
    await contact.firstName.fill('Alex');
    await contact.lastName.fill('Tester');
    await contact.email.fill(`qa.showcase+${Date.now()}@example.com`);
    await contact.subject.selectOption({ label: 'Customer service' });
    await contact.message.fill(LONG_ENOUGH_MESSAGE);

    await contact.submit.click();

    await expect(page.getByText(/thanks for your message/i)).toBeVisible();
  });
});
