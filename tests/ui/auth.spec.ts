import { test, expect } from '../../src/fixtures/test';

/**
 * Authentication is tested against an account this worker registered itself.
 *
 * The application locks an account after a few failed logins, so running negative
 * cases against a shared login takes that login down for everyone — including the
 * next run of this suite. Self-provisioning keeps the blast radius inside one test.
 */
test.describe('Authentication', () => {
  test('a registered customer reaches the account area @smoke', async ({ login, page, testUser }) => {
    await login.openLogin();

    await login.login(testUser.email, testUser.password);

    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByTestId('nav-menu')).toBeVisible();
    await expect(page.getByTestId('page-title')).toContainText(/my account/i);
  });

  test('a wrong password is rejected without revealing which field was wrong', async ({ login, page, disposableUser }) => {
    await login.openLogin();

    await login.login(disposableUser.email, 'DefinitelyNotThePassword1');

    await expect(page).toHaveURL(/\/auth\/login$/);
    const error = await login.errorText();
    expect(error).toMatch(/invalid email or password/i);
    // Account enumeration check: the message must not confirm that the email exists.
    expect(error).not.toMatch(/password is (incorrect|wrong)|user not found|no account/i);
  });

  test('an unknown email gets the exact same error as a wrong password', async ({ login, disposableUser }) => {
    await login.openLogin();
    await login.login(disposableUser.email, 'DefinitelyNotThePassword1');
    const wrongPasswordError = await login.errorText();

    await login.openLogin();
    await login.login(`no.such.user.${Date.now()}@example.com`, 'DefinitelyNotThePassword1');
    const unknownEmailError = await login.errorText();

    expect(unknownEmailError).toBe(wrongPasswordError);
  });

  test('the account area is not reachable without a session', async ({ page }) => {
    await page.goto('/account', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('signing out clears the session @mobile', async ({ login, page, testUser }) => {
    await login.openLogin();
    await login.login(testUser.email, testUser.password);
    await expect(page).toHaveURL(/\/account$/);

    await login.signOut();

    // On a phone viewport the nav collapses, so "Sign in" is in the DOM but hidden
    // until the burger is opened — expand first, then assert what a user would see.
    await login.expandNavbarIfCollapsed();
    await expect(page.getByTestId('nav-sign-in')).toBeVisible();
    await page.goto('/account', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
