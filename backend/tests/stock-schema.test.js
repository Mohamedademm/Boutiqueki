const { StockMovementSchema } = require('../src/modules/stock/schema');

const valid = {
  variant_id: '33333333-3333-3333-3333-333333333333',
  type: 'in',
  quantity: 10,
};

describe('StockMovementSchema', () => {
  test('accepts a valid movement', () => {
    expect(StockMovementSchema.safeParse(valid).success).toBe(true);
  });

  test.each(['in', 'out', 'adjustment'])('accepts type "%s"', (type) => {
    expect(StockMovementSchema.safeParse({ ...valid, type }).success).toBe(true);
  });

  test('rejects unknown movement type', () => {
    expect(StockMovementSchema.safeParse({ ...valid, type: 'transfer' }).success).toBe(false);
  });

  test('rejects non-uuid variant_id', () => {
    expect(StockMovementSchema.safeParse({ ...valid, variant_id: 'x' }).success).toBe(false);
  });

  test('rejects zero quantity', () => {
    expect(StockMovementSchema.safeParse({ ...valid, quantity: 0 }).success).toBe(false);
  });

  test('rejects negative quantity', () => {
    expect(StockMovementSchema.safeParse({ ...valid, quantity: -3 }).success).toBe(false);
  });

  test('rejects non-integer quantity', () => {
    expect(StockMovementSchema.safeParse({ ...valid, quantity: 2.5 }).success).toBe(false);
  });

  test('reason is optional', () => {
    const { reason, ...withoutReason } = valid;
    expect(StockMovementSchema.safeParse(withoutReason).success).toBe(true);
  });
});
