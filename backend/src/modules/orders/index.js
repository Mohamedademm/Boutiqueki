const express = require('express');
const router = express.Router();
const db = require('../../utils/db');
const protect = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');

// @route   GET /api/shops/:shopId/orders
// @desc    Get all orders for a shop
// @access  Private (Owner/Admin)
router.get('/:shopId/orders', protect, requireRole(['owner', 'admin']), async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const { rows } = await db.query(
      `SELECT id, shop_id, customer, payment, status, total,
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM orders WHERE shop_id = $1 ORDER BY created_at DESC`,
      [shopId]
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/shops/:shopId/stats
// @desc    Real aggregated stats for the owner dashboard
// @access  Private (Owner/Admin)
router.get('/:shopId/stats', protect, requireRole(['owner', 'admin']), async (req, res, next) => {
  try {
    const { shopId } = req.params;

    const totals = await db.query(
      `SELECT
         COUNT(*)::int AS total_orders,
         COUNT(*) FILTER (WHERE status = 'pending')::int   AS pending_orders,
         COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered_orders,
         COALESCE(SUM(total) FILTER (WHERE status <> 'cancelled'), 0) AS revenue
       FROM orders WHERE shop_id = $1`,
      [shopId]
    );

    // Orders count per day for the last 7 days (oldest → newest)
    const byDay = await db.query(
      `SELECT to_char(d::date, 'Dy') AS day,
              COALESCE(o.cnt, 0)::int AS count
       FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') d
       LEFT JOIN (
         SELECT created_at::date AS day, COUNT(*) AS cnt
         FROM orders
         WHERE shop_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '6 days'
         GROUP BY created_at::date
       ) o ON o.day = d::date
       ORDER BY d`,
      [shopId]
    );

    const t = totals.rows[0];
    res.json({
      success: true,
      data: {
        totalOrders: t.total_orders,
        pendingOrders: t.pending_orders,
        deliveredOrders: t.delivered_orders,
        revenue: Number(t.revenue) || 0,
        ordersByDay: byDay.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/shops/:shopId/analytics?period=30
// @desc    Rich analytics: revenue/orders time series, best-sellers, status breakdown, AOV
// @access  Private (Owner/Admin)
router.get('/:shopId/analytics', protect, requireRole(['owner', 'admin']), async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const period = Math.min(365, Math.max(7, parseInt(req.query.period, 10) || 30));

    // Totals over the period (excluding cancelled)
    const totals = await db.query(
      `SELECT
         COUNT(*)::int AS orders,
         COALESCE(SUM(total), 0) AS revenue,
         COALESCE(AVG(total), 0) AS aov
       FROM orders
       WHERE shop_id = $1 AND status <> 'cancelled'
         AND created_at >= CURRENT_DATE - ($2 || ' days')::interval`,
      [shopId, period]
    );

    // Revenue + orders per day across the period (zero-filled)
    const series = await db.query(
      `SELECT to_char(d::date, 'YYYY-MM-DD') AS date,
              COALESCE(o.orders, 0)::int AS orders,
              COALESCE(o.revenue, 0) AS revenue
       FROM generate_series(CURRENT_DATE - ($2 || ' days')::interval, CURRENT_DATE, INTERVAL '1 day') d
       LEFT JOIN (
         SELECT created_at::date AS day, COUNT(*) AS orders, SUM(total) AS revenue
         FROM orders
         WHERE shop_id = $1 AND status <> 'cancelled'
           AND created_at >= CURRENT_DATE - ($2 || ' days')::interval
         GROUP BY created_at::date
       ) o ON o.day = d::date
       ORDER BY d`,
      [shopId, period]
    );

    // Best-selling products (by quantity) from order_items
    const bestSellers = await db.query(
      `SELECT oi.product_name AS name,
              SUM(oi.quantity)::int AS units,
              COALESCE(SUM(oi.price * oi.quantity), 0) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.shop_id = $1 AND o.status <> 'cancelled'
         AND o.created_at >= CURRENT_DATE - ($2 || ' days')::interval
       GROUP BY oi.product_name
       ORDER BY units DESC
       LIMIT 5`,
      [shopId, period]
    );

    // Order status breakdown (all time)
    const byStatus = await db.query(
      `SELECT status, COUNT(*)::int AS count FROM orders WHERE shop_id = $1 GROUP BY status`,
      [shopId]
    );

    const t = totals.rows[0];
    res.json({
      success: true,
      data: {
        period,
        revenue: Number(t.revenue) || 0,
        orders: t.orders,
        avgOrderValue: Number(t.aov) || 0,
        series: series.rows.map(r => ({ date: r.date, orders: r.orders, revenue: Number(r.revenue) || 0 })),
        bestSellers: bestSellers.rows.map(r => ({ name: r.name, units: r.units, revenue: Number(r.revenue) || 0 })),
        byStatus: byStatus.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/shops/:shopId/orders/:id/status
// @desc    Update order status
// @access  Private (Owner/Admin)
router.put('/:shopId/orders/:id/status', protect, requireRole(['owner', 'admin']), async (req, res, next) => {
  try {
    const { shopId, id } = req.params;
    const { status } = req.body;

    const { rows } = await db.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 AND shop_id = $3 RETURNING *`,
      [status, id, shopId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
