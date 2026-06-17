const request = require('supertest');
const { CheckoutSchema } = require('../src/modules/checkout/schema');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh';
const app = require('../src/app');

const validPayload = {
  shopId: '11111111-1111-1111-1111-111111111111',
  customerInfo: { firstName: 'Jean', lastName: 'Dupont', email: 'jean@example.com', phone: '0600000000' },
  shippingAddress: { address: '1 rue X', city: 'Paris', postalCode: '75001', country: 'France' },
  items: [{ productId: '22222222-2222-2222-2222-222222222222', quantity: 2 }],
};

describe('CheckoutSchema', () => {
  test('accepts a valid order payload', () => {
    expect(CheckoutSchema.safeParse(validPayload).success).toBe(true);
  });

  test('defaults paymentMethod to cash_on_delivery', () => {
    const r = CheckoutSchema.safeParse(validPayload);
    expect(r.data.paymentMethod).toBe('cash_on_delivery');
  });

  test('rejects empty cart', () => {
    expect(CheckoutSchema.safeParse({ ...validPayload, items: [] }).success).toBe(false);
  });

  test('rejects non-uuid shopId', () => {
    expect(CheckoutSchema.safeParse({ ...validPayload, shopId: 'abc' }).success).toBe(false);
  });

  test('rejects invalid customer email', () => {
    const bad = { ...validPayload, customerInfo: { ...validPayload.customerInfo, email: 'nope' } };
    expect(CheckoutSchema.safeParse(bad).success).toBe(false);
  });

  test('rejects zero / negative quantity', () => {
    const bad = { ...validPayload, items: [{ productId: validPayload.items[0].productId, quantity: 0 }] };
    expect(CheckoutSchema.safeParse(bad).success).toBe(false);
  });

  test('rejects unknown payment method', () => {
    expect(CheckoutSchema.safeParse({ ...validPayload, paymentMethod: 'bitcoin' }).success).toBe(false);
  });

  test('ignores client-supplied price/name (recomputed server-side) but accepts them', () => {
    const withExtras = {
      ...validPayload,
      items: [{ ...validPayload.items[0], name: 'X', price: 9999 }],
    };
    expect(CheckoutSchema.safeParse(withExtras).success).toBe(true);
  });
});

describe('POST /api/checkout (validation layer, no DB)', () => {
  test('empty body → 400', async () => {
    const res = await request(app).post('/api/checkout').send({});
    expect(res.status).toBe(400);
  });
});
