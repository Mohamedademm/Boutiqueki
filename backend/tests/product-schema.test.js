const { ProductSchema, VariantSchema } = require('../src/modules/products/schema');

describe('ProductSchema', () => {
  const valid = {
    name: 'T-Shirt Noir',
    price: 19.99,
    status: 'active',
    images: ['https://cdn.example.com/a.jpg'],
    variants: [],
  };

  test('accepts a minimal valid product', () => {
    expect(ProductSchema.safeParse(valid).success).toBe(true);
  });

  test('rejects empty name', () => {
    expect(ProductSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
  });

  test('rejects negative price', () => {
    expect(ProductSchema.safeParse({ ...valid, price: -1 }).success).toBe(false);
  });

  test('price of 0 is allowed (free product)', () => {
    expect(ProductSchema.safeParse({ ...valid, price: 0 }).success).toBe(true);
  });

  test('defaults status to draft and images/variants to []', () => {
    const r = ProductSchema.safeParse({ name: 'X', price: 5 });
    expect(r.success).toBe(true);
    expect(r.data.status).toBe('draft');
    expect(r.data.images).toEqual([]);
    expect(r.data.variants).toEqual([]);
  });

  test('rejects more than 8 images', () => {
    const images = Array.from({ length: 9 }, (_, i) => `https://x.com/${i}.jpg`);
    expect(ProductSchema.safeParse({ ...valid, images }).success).toBe(false);
  });

  test('rejects non-url image', () => {
    expect(ProductSchema.safeParse({ ...valid, images: ['not-a-url'] }).success).toBe(false);
  });

  test('rejects invalid status', () => {
    expect(ProductSchema.safeParse({ ...valid, status: 'published' }).success).toBe(false);
  });
});

describe('VariantSchema (regression: variant price accepts null/0)', () => {
  // Regression guard for the product-creation 400 bug: the DB column price is
  // nullable and the frontend sends null for an empty variant price. The schema
  // must use .nonnegative() (accepts 0 and null), NOT .positive().
  test('accepts null price', () => {
    expect(VariantSchema.safeParse({ name: 'M', price: null }).success).toBe(true);
  });

  test('accepts price of 0', () => {
    expect(VariantSchema.safeParse({ name: 'M', price: 0 }).success).toBe(true);
  });

  test('accepts omitted price', () => {
    expect(VariantSchema.safeParse({ name: 'M' }).success).toBe(true);
  });

  test('rejects negative price', () => {
    expect(VariantSchema.safeParse({ name: 'M', price: -5 }).success).toBe(false);
  });

  test('requires a name', () => {
    expect(VariantSchema.safeParse({ price: 10 }).success).toBe(false);
  });

  test('defaults stock_qty to 0 and alert_threshold to 5', () => {
    const r = VariantSchema.safeParse({ name: 'M' });
    expect(r.data.stock_qty).toBe(0);
    expect(r.data.alert_threshold).toBe(5);
  });

  test('rejects negative stock_qty', () => {
    expect(VariantSchema.safeParse({ name: 'M', stock_qty: -1 }).success).toBe(false);
  });
});
