const { validateCoupon } = require('../src/modules/coupons/validate');

// Fake db that returns a single coupon row
const mockDb = (row) => ({ query: async () => ({ rows: row ? [row] : [] }) });

describe('validateCoupon', () => {
  test('rejects unknown code', async () => {
    const r = await validateCoupon(mockDb(null), 'shop', 'NOPE', 100);
    expect(r.ok).toBe(false);
  });

  test('applies percent discount', async () => {
    const db = mockDb({ code: 'P10', type: 'percent', value: 10, min_total: 0, active: true, expires_at: null });
    const r = await validateCoupon(db, 'shop', 'P10', 200);
    expect(r.ok).toBe(true);
    expect(r.discount).toBe(20);
  });

  test('applies fixed discount, capped at subtotal', async () => {
    const db = mockDb({ code: 'F50', type: 'fixed', value: 50, min_total: 0, active: true, expires_at: null });
    expect((await validateCoupon(db, 'shop', 'F50', 200)).discount).toBe(50);
    expect((await validateCoupon(db, 'shop', 'F50', 30)).discount).toBe(30); // capped
  });

  test('enforces minimum total', async () => {
    const db = mockDb({ code: 'MIN', type: 'percent', value: 10, min_total: 100, active: true, expires_at: null });
    const r = await validateCoupon(db, 'shop', 'MIN', 50);
    expect(r.ok).toBe(false);
  });

  test('rejects expired coupon', async () => {
    const db = mockDb({ code: 'OLD', type: 'percent', value: 10, min_total: 0, active: true, expires_at: '2000-01-01' });
    expect((await validateCoupon(db, 'shop', 'OLD', 100)).ok).toBe(false);
  });

  test('rejects inactive coupon', async () => {
    const db = mockDb({ code: 'OFF', type: 'percent', value: 10, min_total: 0, active: false, expires_at: null });
    expect((await validateCoupon(db, 'shop', 'OFF', 100)).ok).toBe(false);
  });
});
