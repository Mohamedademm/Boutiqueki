const express = require('express');
const { db, createSuccessResponse, createErrorResponse } = require('../../utils');
const authMiddleware = require('../../middleware/auth');

const router = express.Router({ mergeParams: true });

// Ownership guard for /:shopId/coupons
const requireShopOwner = async (req, res, next) => {
  try {
    const shop = await db.query('SELECT owner_id FROM shops WHERE id = $1', [req.params.shopId]);
    if (shop.rows.length === 0) return createErrorResponse(res, { statusCode: 404, message: 'Shop not found' });
    if (shop.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return createErrorResponse(res, { statusCode: 403, message: 'Forbidden' });
    }
    next();
  } catch (err) { next(err); }
};

router.use('/:shopId/coupons', authMiddleware);

// GET /api/shops/:shopId/coupons
router.get('/:shopId/coupons', requireShopOwner, async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT id, code, type, value, min_total AS "minTotal", expires_at AS "expiresAt", active, created_at AS "createdAt"
       FROM coupons WHERE shop_id = $1 ORDER BY created_at DESC`,
      [req.params.shopId]
    );
    return createSuccessResponse(res, { data: r.rows });
  } catch (err) { next(err); }
});

// POST /api/shops/:shopId/coupons
router.post('/:shopId/coupons', requireShopOwner, async (req, res, next) => {
  try {
    const { code, type, value, minTotal, expiresAt, active } = req.body;
    if (!code || !['percent', 'fixed'].includes(type) || !(Number(value) > 0)) {
      return createErrorResponse(res, { statusCode: 400, message: 'Coupon invalide (code, type, value requis)' });
    }
    const existing = await db.query('SELECT id FROM coupons WHERE shop_id = $1 AND lower(code) = lower($2)', [req.params.shopId, code]);
    if (existing.rows.length > 0) {
      return createErrorResponse(res, { statusCode: 400, message: 'Ce code existe déjà' });
    }
    const r = await db.query(
      `INSERT INTO coupons (shop_id, code, type, value, min_total, expires_at, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, code, type, value, min_total AS "minTotal", expires_at AS "expiresAt", active, created_at AS "createdAt"`,
      [req.params.shopId, String(code).trim(), type, Number(value), Number(minTotal) || 0, expiresAt || null, active !== false]
    );
    return createSuccessResponse(res, { statusCode: 201, data: r.rows[0] });
  } catch (err) { next(err); }
});

// DELETE /api/shops/:shopId/coupons/:id
router.delete('/:shopId/coupons/:id', requireShopOwner, async (req, res, next) => {
  try {
    const r = await db.query('DELETE FROM coupons WHERE id = $1 AND shop_id = $2 RETURNING id', [req.params.id, req.params.shopId]);
    if (r.rows.length === 0) return createErrorResponse(res, { statusCode: 404, message: 'Coupon introuvable' });
    return createSuccessResponse(res, { message: 'Coupon supprimé' });
  } catch (err) { next(err); }
});

module.exports = router;
