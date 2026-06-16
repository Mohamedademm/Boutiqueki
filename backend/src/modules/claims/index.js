const express = require('express');
const { db, createSuccessResponse, createErrorResponse } = require('../../utils');
const authMiddleware = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');

const router = express.Router();

// POST /api/claims — Create a new claim (authenticated client)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { orderId, shopId, subject, message } = req.body;
    const userId = req.user.id;

    if (!subject || !message) {
      return createErrorResponse(res, { statusCode: 400, message: 'Sujet et message sont requis' });
    }

    // Validate order belongs to this user (if provided)
    if (orderId) {
      const orderCheck = await db.query(
        `SELECT id FROM orders WHERE id = $1 AND (user_id = $2 OR customer->>'email' = (SELECT email FROM users WHERE id = $2))`,
        [orderId, userId]
      );
      if (orderCheck.rows.length === 0) {
        return createErrorResponse(res, { statusCode: 403, message: 'Commande introuvable ou non autorisée' });
      }
    }

    const { rows } = await db.query(
      `INSERT INTO claims (user_id, order_id, shop_id, subject, message, status)
       VALUES ($1, $2, $3, $4, $5, 'open')
       RETURNING id, subject, message, status, created_at AS "createdAt"`,
      [userId, orderId || null, shopId || null, subject, message]
    );

    return createSuccessResponse(res, {
      statusCode: 201,
      message: 'Réclamation créée',
      data: rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/claims/my — List the current user's claims
router.get('/my', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { rows } = await db.query(
      `SELECT c.id, c.subject, c.message, c.status, c.admin_reply AS "adminReply",
              c.created_at AS "createdAt", c.updated_at AS "updatedAt",
              c.order_id AS "orderId", s.name AS "shopName"
       FROM claims c
       LEFT JOIN shops s ON s.id = c.shop_id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );

    return createSuccessResponse(res, { data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/claims — Admin: list all claims with filters
router.get('/', authMiddleware, requireRole(['admin']), async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = '';
    const params = [];
    if (status) {
      params.push(status);
      whereClause = `WHERE c.status = $${params.length}`;
    }

    params.push(Number(limit));
    params.push(offset);

    const { rows } = await db.query(
      `SELECT c.id, c.subject, c.message, c.status, c.admin_reply AS "adminReply",
              c.created_at AS "createdAt", c.updated_at AS "updatedAt",
              c.order_id AS "orderId",
              u.name AS "userName", u.email AS "userEmail",
              s.name AS "shopName"
       FROM claims c
       LEFT JOIN users u ON u.id = c.user_id
       LEFT JOIN shops s ON s.id = c.shop_id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = status ? [status] : [];
    const countWhere = status ? 'WHERE c.status = $1' : '';
    const countRes = await db.query(`SELECT COUNT(*) FROM claims c ${countWhere}`, countParams);

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

// PATCH /api/claims/:id — Admin: update claim status + reply
router.patch('/:id', authMiddleware, requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminReply } = req.body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return createErrorResponse(res, { statusCode: 400, message: 'Statut invalide' });
    }

    const { rows } = await db.query(
      `UPDATE claims
       SET status = COALESCE($1, status),
           admin_reply = COALESCE($2, admin_reply),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, status, admin_reply AS "adminReply", updated_at AS "updatedAt"`,
      [status || null, adminReply || null, id]
    );

    if (rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'Réclamation introuvable' });
    }

    return createSuccessResponse(res, { data: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
