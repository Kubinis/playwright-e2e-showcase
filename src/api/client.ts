import type { APIRequestContext } from '@playwright/test';

export interface Product {
  id: string;
  name: string;
  price: number;
  is_location_offer: boolean;
  is_rental: boolean;
  in_stock?: boolean;
  brand?: { id: string; name: string };
  category?: { id: string; name: string };
}

export interface Paginated<T> {
  current_page: number;
  data: T[];
  total: number;
  per_page: number;
}

/**
 * Thin wrapper over the demo REST API. It deliberately returns the raw response
 * for status/schema assertions instead of throwing — the tests decide what a
 * failure means.
 */
export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  products(params: Record<string, string | number> = {}) {
    return this.request.get('/products', { params });
  }

  product(id: string) {
    return this.request.get(`/products/${id}`);
  }

  brands() {
    return this.request.get('/brands');
  }

  categories() {
    return this.request.get('/categories');
  }

  search(query: string) {
    return this.request.get('/products/search', { params: { q: query } });
  }

  register(payload: Record<string, unknown>) {
    return this.request.post('/users/register', { data: payload });
  }

  login(email: string, password: string) {
    return this.request.post('/users/login', { data: { email, password } });
  }

  async token(email: string, password: string): Promise<string> {
    const res = await this.login(email, password);
    const body = (await res.json()) as { access_token?: string };
    if (!res.ok() || !body.access_token) {
      throw new Error(`Login failed: ${res.status()} ${JSON.stringify(body)}`);
    }
    return body.access_token;
  }

  me(token: string) {
    return this.request.get('/users/me', { headers: { Authorization: `Bearer ${token}` } });
  }
}
