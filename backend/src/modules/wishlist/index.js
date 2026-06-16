const express = require('express');
const auth = require('../../middleware/auth');
const { db, createSuccessResponse, createErrorResponse } = require('../../utils');

const router = express.Router();

router.use(auth);

// GET /api/wishlist — current user's wishlist with product + shop details
router.get('/', async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT w.id, w.product_id, w.created_at,
              p.name, p.price, p.compare_price, p.images, p.status AS product_status,
              s.id AS shop_id, s.name AS shop_name, s.slug AS shop_slug, s.logo_url AS shop_logo
       FROM wishlists w
       JOIN products p ON p.id = w.product_id
       JOIN shops s ON s.id = p.shop_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );

    const items = r.rows.map(row => ({
      id: row.id,
      productId: row.product_id,
      name: row.name,
      price: row.price != null ? Number(row.price) : 0,
      comparePrice: row.compare_price != null ? Number(row.compare_price) : 0,
      images: Array.isArray(row.images) ? row.images : [],
      productStatus: row.product_status,
      shopId: row.shop_id,
      shopName: row.shop_name,
      shopSlug: row.shop_slug,
      shopLogo: row.shop_logo,
      createdAt: row.created_at,
    }));

    return createSuccessResponse(res, { data: items });
  } catch (err) {
    next(err);
  }
});

// POST /api/wishlist/:productId — toggle: add if not exists, remove if exists
router.post('/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;

    const prod = await db.query(
      "SELECT id FROM products WHERE id = $1 AND status = 'active'",
      [productId]
    );
    if (prod.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'Produit introuvable' });
    }

    const existing = await db.query(
      'SELECT id FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [req.user.id, productId]
    );

    if (existing.rows.length > 0) {
      await db.query('DELETE FROM wishlists WHERE id = $1', [existing.rows[0].id]);
      return createSuccessResponse(res, { data: { wishlisted: false } });
    }

    await db.query(
      'INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2)',
      [req.user.id, productId]
    );
    return createSuccessResponse(res, { statusCode: 201, data: { wishlisted: true } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/wishlist/:productId — remove from wishlist
router.delete('/:productId', async (req, res, next) => {
  try {
    await db.query(
      'DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [req.user.id, req.params.productId]
    );
    return createSuccessResponse(res, { data: { wishlisted: false } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
