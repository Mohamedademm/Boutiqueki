const express = require('express');
const { db, createSuccessResponse } = require('../../utils');
const authMiddleware = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');

const router = express.Router();

// GET /api/orders/my — Client: list their own orders
router.get('/my', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { rows } = await db.query(
      `SELECT o.id, o.shop_id AS "shopId", o.customer, o.payment,
              o.status, o.total, o.created_at AS "createdAt",
              s.name AS "shopName", s.slug AS "shopSlug",
              json_agg(json_build_object(
                'id', oi.id,
                'productName', oi.product_name,
                'variantName', oi.variant_name,
                'quantity', oi.quantity,
                'price', oi.price,
                'productId', oi.product_id
              )) AS items
       FROM orders o
       LEFT JOIN shops s ON s.id = o.shop_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id, s.name, s.slug
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, Number(limit), offset]
    );

    const countRes = await db.query('SELECT COUNT(*) FROM orders WHERE user_id = $1', [userId]);

    return createSuccessResponse(res, {
      data: rows,
      meta: {
        total: parseInt(countRes.rows[0].count),
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
