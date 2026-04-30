import { test, expect } from '@playwright/test';

test.describe('Health & Server', () => {
  test('GET /health returns 200', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('API root returns 404 for unknown routes', async ({ request }) => {
    const res = await request.get('/api/nonexistent-route');
    expect(res.status()).toBe(404);
  });
});

test.describe('Auth Sync', () => {
  test('POST /api/auth/sync without email returns 400', async ({ request }) => {
    const res = await request.post('/api/auth/sync', {
      data: { name: 'Test' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/auth/sync with email creates user', async ({ request }) => {
    const email = `test-${Date.now()}@e2e.test`;
    const res = await request.post('/api/auth/sync', {
      data: { email, name: 'E2E Tester' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.user.email).toBe(email);
  });
});
