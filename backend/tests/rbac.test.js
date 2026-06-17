const request = require('supertest');
const { RegisterSchema } = require('../src/modules/auth/schema');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh';
const app = require('../src/app');

describe('Protected routes reject unauthenticated requests', () => {
  test('GET /api/wishlist → 401 without token', async () => {
    const res = await request(app).get('/api/wishlist');
    expect(res.status).toBe(401);
  });

  test('POST /api/claims → 401 without token', async () => {
    const res = await request(app).post('/api/claims').send({ subject: 'x', message: 'y' });
    expect(res.status).toBe(401);
  });

  test('GET /api/orders/my → 401 without token', async () => {
    const res = await request(app).get('/api/orders/my');
    expect(res.status).toBe(401);
  });

  test('rejects a malformed Bearer token', async () => {
    const res = await request(app).get('/api/wishlist').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });
});

describe('RegisterSchema default role (regression)', () => {
  // A visitor who registers must default to `client`, not `owner`.
  test('defaults role to client when omitted', () => {
    const r = RegisterSchema.safeParse({ name: 'Jean', email: 'j@example.com', password: 'password123' });
    expect(r.success).toBe(true);
    expect(r.data.role).toBe('client');
  });

  test('still allows explicit owner role', () => {
    const r = RegisterSchema.safeParse({ name: 'Jean', email: 'j@example.com', password: 'password123', role: 'owner' });
    expect(r.success).toBe(true);
    expect(r.data.role).toBe('owner');
  });

  test('rejects an arbitrary role (no privilege escalation to admin)', () => {
    const r = RegisterSchema.safeParse({ name: 'X', email: 'x@example.com', password: 'password123', role: 'admin' });
    expect(r.success).toBe(false);
  });
});
