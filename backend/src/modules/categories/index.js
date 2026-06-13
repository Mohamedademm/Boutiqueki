const express = require('express');
const { db, createSuccessResponse, createErrorResponse } = require('../../utils');
const authMiddleware = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { CategorySchema } = require('./schema');

// Remarque : ce router est monté sur `/api/shops` (voir app.js)
// Donc la route ici `/` correspond à `/api/shops/:shopId/categories`
const router = express.Router({ mergeParams: true });

// Middleware pour verifier que le shopId de l'URL appartient au user connecte (pour les mutations)
const requireShopOwner = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const shop = await db.query('SELECT owner_id FROM shops WHERE id = $1', [shopId]);
    if (shop.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'Shop not found' });
    }
    if (shop.rows[0].owner_id !== req.user.id) {
      return createErrorResponse(res, { statusCode: 403, message: 'Forbidden: You do not own this shop' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

// Obtenir toutes les categories d'une boutique (Public)
router.get('/:shopId/categories', async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const result = await db.query(
      'SELECT id, parent_id, name, slug, created_at FROM categories WHERE shop_id = $1 ORDER BY parent_id NULLS FIRST, name ASC',
      [shopId]
    );
    return createSuccessResponse(res, { data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.use('/:shopId/categories', authMiddleware);

// Creer une categorie
router.post('/:shopId/categories', requireShopOwner, validate(CategorySchema), async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const { name, slug, parent_id } = req.body;

    const existingSlug = await db.query('SELECT id FROM categories WHERE shop_id = $1 AND slug = $2', [shopId, slug]);
    if (existingSlug.rows.length > 0) {
      return createErrorResponse(res, { statusCode: 400, message: 'Slug already taken for this shop' });
    }

    if (parent_id) {
      const parent = await db.query('SELECT id FROM categories WHERE id = $1 AND shop_id = $2', [parent_id, shopId]);
      if (parent.rows.length === 0) {
        return createErrorResponse(res, { statusCode: 400, message: 'Parent category not found' });
      }
    }

    const result = await db.query(
      'INSERT INTO categories (shop_id, parent_id, name, slug) VALUES ($1, $2, $3, $4) RETURNING *',
      [shopId, parent_id || null, name, slug]
    );

    return createSuccessResponse(res, {
      statusCode: 201,
      message: 'Category created',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// Modifier une categorie
router.put('/:shopId/categories/:id', requireShopOwner, validate(CategorySchema), async (req, res, next) => {
  try {
    const { shopId, id } = req.params;
    const { name, slug, parent_id } = req.body;

    const category = await db.query('SELECT id FROM categories WHERE id = $1 AND shop_id = $2', [id, shopId]);
    if (category.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'Category not found' });
    }

    if (parent_id && parent_id === id) {
      return createErrorResponse(res, { statusCode: 400, message: 'A category cannot be its own parent' });
    }

    if (slug) {
      const existingSlug = await db.query('SELECT id FROM categories WHERE shop_id = $1 AND slug = $2 AND id != $3', [shopId, slug, id]);
      if (existingSlug.rows.length > 0) {
        return createErrorResponse(res, { statusCode: 400, message: 'Slug already taken' });
      }
    }

    const result = await db.query(
      'UPDATE categories SET name = $1, slug = $2, parent_id = $3 WHERE id = $4 RETURNING *',
      [name, slug, parent_id || null, id]
    );

    return createSuccessResponse(res, {
      message: 'Category updated',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// Supprimer une categorie
router.delete('/:shopId/categories/:id', requireShopOwner, async (req, res, next) => {
  try {
    const { shopId, id } = req.params;
    
    // Check if it has subcategories
    const subs = await db.query('SELECT id FROM categories WHERE parent_id = $1', [id]);
    if (subs.rows.length > 0) {
      return createErrorResponse(res, { statusCode: 400, message: 'Cannot delete category with subcategories' });
    }

    const result = await db.query('DELETE FROM categories WHERE id = $1 AND shop_id = $2 RETURNING id', [id, shopId]);
    
    if (result.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'Category not found' });
    }

    return createSuccessResponse(res, { message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
