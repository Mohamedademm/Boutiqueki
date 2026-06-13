const { z } = require('zod');

const CreateShopSchema = z.object({
  name: z.string().min(2, 'Shop name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens'),
  description: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  banner_url: z.string().url().optional().or(z.literal('')),
});

const UpdateShopSchema = CreateShopSchema.partial().extend({
  theme: z.record(z.any()).optional(),
});

module.exports = { CreateShopSchema, UpdateShopSchema };
