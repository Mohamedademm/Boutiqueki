const express = require('express');
const router = express.Router();
const db = require('../../utils/db');
const protect = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');

// @route   GET /api/admin/analytics
// @desc    Get platform analytics for admin dashboard
// @access  Private (Admin)
router.get('/analytics', protect, requireRole('admin'), async (req, res, next) => {
  try {
    // 1. Total Users
    const usersResult = await db.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(usersResult.rows[0].count, 10);

    // 2. Total Shops
    const shopsResult = await db.query('SELECT COUNT(*) FROM shops');
    const totalShops = parseInt(shopsResult.rows[0].count, 10);

    // 3. Total Orders & Platform Revenue
    // (Assuming all orders represent revenue. In MVP we just sum the totals)
    const ordersResult = await db.query('SELECT COUNT(*) as count, SUM(total) as revenue FROM orders WHERE status != $1', ['cancelled']);
    const totalOrders = parseInt(ordersResult.rows[0].count, 10) || 0;
    const platformRevenue = parseFloat(ordersResult.rows[0].revenue) || 0;

    // 4. Recent Shops
    const recentShopsResult = await db.query(`
      SELECT 
        s.id, 
        s.name, 
        s.slug, 
        s.created_at,
        u.name AS owner_name,
        u.email AS owner_email
      FROM shops s
      JOIN users u ON s.owner_id = u.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `);

    const recentShops = recentShopsResult.rows.map(shop => ({
      _id: shop.id,
      name: shop.name,
      slug: shop.slug,
      createdAt: shop.created_at,
      ownerId: {
        name: shop.owner_name,
        email: shop.owner_email
      }
    }));

    res.json({
      success: true,
      data: {
        totalUsers,
        totalShops,
        totalOrders,
        platformRevenue,
        recentShops
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
