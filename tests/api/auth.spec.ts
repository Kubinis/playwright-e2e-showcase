import { test, expect } from '../../src/fixtures/test';

test.describe('Auth API', () => {
  test('valid credentials return a bearer token @smoke', async ({ api, testUser }) => {
    const res = await api.login(testUser.email, testUser.password);

    expect(res.status()).toBe(200);
    const body = (await res.json()) as { access_token: string };
    expect(body.access_token).toBeTruthy();
    // Three dot-separated segments — anything else is not a JWT.
    expect(body.access_token.split('.')).toHaveLength(3);
  });

  test('registration rejects a duplicate email', async ({ api, disposableUser }) => {
    const res = await api.register({
      first_name: 'Alex',
      last_name: 'Tester',
      email: disposableUser.email,
      password: disposableUser.password,
      phone: '0612345678',
      dob: '1990-01-01',
      address: {
        street: 'Keizersgracht 42',
        city: 'Amsterdam',
        state: 'Noord-Holland',
        country: 'NL',
        postal_code: '1015 CS',
      },
    });

    // 409 Conflict is what the API returns; a 2xx here would mean duplicate
    // accounts are creatable, which is the failure this test exists for.
    expect(res.status()).toBe(409);
    expect(await res.text()).toMatch(/email/i);
  });

  test('invalid credentials return 401 and no token', async ({ api }) => {
    const res = await api.login(`nobody.${Date.now()}@example.com`, 'DefinitelyNotThePassword1');

    expect(res.status()).toBe(401);
    expect(await res.text()).not.toContain('access_token');
  });

  test('a protected endpoint rejects an unauthenticated request', async ({ apiRequest }) => {
    const res = await apiRequest.get('/users/me');

    expect(res.status()).toBe(401);
  });

  test('a protected endpoint accepts a valid token and returns that user', async ({ api, testUser }) => {
    const token = await api.token(testUser.email, testUser.password);

    const res = await api.me(token);

    expect(res.status()).toBe(200);
    const me = (await res.json()) as { email: string; password?: string };
    expect(me.email).toBe(testUser.email);
    // A user payload must never carry the password hash back to the client.
    expect(me.password).toBeUndefined();
  });

  test('a tampered token is rejected', async ({ api, testUser }) => {
    const token = await api.token(testUser.email, testUser.password);
    const tampered = `${token.slice(0, -4)}AAAA`;

    const res = await api.me(tampered);

    expect(res.status()).toBe(401);
  });
});
