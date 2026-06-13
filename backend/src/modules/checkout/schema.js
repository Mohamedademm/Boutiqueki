const { z } = require('zod');

const CheckoutSchema = z.object({
  shopId: z.string().uuid('shopId invalide'),
  customerInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
  }),
  shippingAddress: z.object({
    address: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
  }),
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional().nullable(),
    quantity: z.number().int().positive(),
    // name/price from client are ignored server-side (recomputed), accepted for compatibility
    name: z.string().optional(),
    price: z.number().optional(),
    selectedVariants: z.record(z.any()).optional(),
  })).min(1, 'Le panier est vide'),
  paymentMethod: z.enum(['cash_on_delivery', 'stripe']).default('cash_on_delivery'),
  couponCode: z.string().optional().nullable(),
});

module.exports = { CheckoutSchema };
