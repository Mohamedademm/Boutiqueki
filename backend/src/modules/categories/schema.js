const { z } = require('zod');

const CategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens'),
  parent_id: z.string().uuid().optional().nullable(),
});

module.exports = { CategorySchema };
