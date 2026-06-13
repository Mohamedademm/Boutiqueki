const { z } = require('zod');

const VariantSchema = z.object({
  id: z.string().uuid().optional(), // Pour l'update
  name: z.string().min(1, 'Variant name required'),
  sku: z.string().optional(),
  price: z.number().positive().optional().nullable(),
  stock_qty: z.number().int().min(0).default(0),
  alert_threshold: z.number().int().min(0).default(5),
});

const ProductSchema = z.object({
  name: z.string().min(1, 'Product name required'),
  description: z.string().optional().nullable(),
  price: z.number().min(0, 'Price must be positive'),
  compare_price: z.number().min(0).optional().nullable(),
  sku: z.string().optional().nullable(),
  status: z.enum(['active', 'draft', 'archived']).default('draft'),
  category_id: z.string().uuid().optional().nullable(),
  images: z.array(z.string().url()).max(8).default([]),
  variants: z.array(VariantSchema).default([]),
});

module.exports = { ProductSchema, VariantSchema };
