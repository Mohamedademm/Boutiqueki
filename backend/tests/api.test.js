const request = require('supertest');

// Minimal env so module imports don't complain (no DB connection is made by these routes)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh';

const app = require('../src/app');

describe('API smoke tests (no DB required)', () => {
  test('GET /api/health → 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /api/auth/login with empty body → 400 (validation)', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/register invalid email → 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'X', email: 'nope', password: 'short' });
    expect(res.status).toBe(400);
  });

  test('GET /api/payments/config → 200, disabled when no Stripe key', async () => {
    const res = await request(app).get('/api/payments/config');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('enabled');
  });

  test('unknown route → 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});
