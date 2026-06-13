const { z } = require('zod');

const StockMovementSchema = z.object({
  variant_id: z.string().uuid(),
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.number().int().positive('Quantity must be positive'),
  reason: z.string().optional().nullable(),
});

module.exports = { StockMovementSchema };
