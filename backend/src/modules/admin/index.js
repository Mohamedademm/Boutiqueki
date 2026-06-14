const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { db, createSuccessResponse, createErrorResponse } = require('../../utils');
const protect = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');

const VALID_USER_ROLES = ['admin', 'owner', 'client'];
const VALID_USER_STATUSES = ['active', 'banned'];
const VALID_SHOP_STATUSES = ['active', 'maintenance', 'suspended'];

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

// ---------------------------------------------------------------------------
// USERS
// ---------------------------------------------------------------------------

// @route   GET /api/admin/users
// @desc    List users with pagination, search and filters
// @access  Private (Admin)
router.get('/users', protect, requireRole('admin'), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const offset = (page - 1) * limit;
    const { search, role, status } = req.query;

    const conditions = [];
    const values = [];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(u.name ILIKE $${values.length} OR u.email ILIKE $${values.length})`);
    }
    if (role && role !== 'Tous') {
      // The admin UI uses "user" to mean any non-admin account.
      if (role === 'admin') {
        values.push('admin');
        conditions.push(`u.role = $${values.length}`);
      } else if (role === 'user') {
        conditions.push(`u.role <> 'admin'`);
      } else if (VALID_USER_ROLES.includes(role)) {
        values.push(role);
        conditions.push(`u.role = $${values.length}`);
      }
    }
    if (status && status !== 'Tous' && VALID_USER_STATUSES.includes(status)) {
      values.push(status);
      conditions.push(`u.status = $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM users u ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const usersResult = await db.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.role,
         u.status,
         u.created_at,
         COUNT(s.id) AS shops_count
       FROM users u
       LEFT JOIN shops s ON s.owner_id = u.id
       ${whereClause}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    const users = usersResult.rows.map(u => ({
      _id: u.id,
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status || 'active',
      shopsCount: parseInt(u.shops_count, 10) || 0,
      createdAt: u.created_at,
    }));

    return createSuccessResponse(res, {
      data: { users, total },
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/admin/users
// @desc    Create a new user
// @access  Private (Admin)
router.post('/users', protect, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return createErrorResponse(res, { statusCode: 400, message: 'Please provide name, email and password' });
    }

    const userRole = role && VALID_USER_ROLES.includes(role) ? role : 'owner';

    // Check if user already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return createErrorResponse(res, { statusCode: 400, message: 'Email already in use' });
    }

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, status, created_at`,
      [name, email, passwordHash, userRole]
    );

    const u = result.rows[0];
    return createSuccessResponse(res, {
      statusCode: 201,
      message: 'User created successfully',
      data: {
        _id: u.id,
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status || 'active',
        createdAt: u.created_at,
        shopsCount: 0
      },
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update a user's role or status
// @access  Private (Admin)
router.put('/users/:id', protect, requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, status } = req.body;

    if (role === undefined && status === undefined) {
      return createErrorResponse(res, { statusCode: 400, message: 'Nothing to update' });
    }
    if (role !== undefined && !VALID_USER_ROLES.includes(role)) {
      return createErrorResponse(res, { statusCode: 400, message: 'Invalid role' });
    }
    if (status !== undefined && !VALID_USER_STATUSES.includes(status)) {
      return createErrorResponse(res, { statusCode: 400, message: 'Invalid status' });
    }

    const fields = [];
    const values = [];
    if (role !== undefined) {
      values.push(role);
      fields.push(`role = $${values.length}`);
    }
    if (status !== undefined) {
      values.push(status);
      fields.push(`status = $${values.length}`);
    }
    values.push(id);

    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING id, name, email, role, status, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'User not found' });
    }

    const u = result.rows[0];
    return createSuccessResponse(res, {
      message: 'User updated',
      data: {
        _id: u.id,
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status || 'active',
        createdAt: u.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private (Admin)
router.delete('/users/:id', protect, requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return createErrorResponse(res, { statusCode: 400, message: 'You cannot delete your own account' });
    }

    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'User not found' });
    }

    return createSuccessResponse(res, { message: 'User deleted' });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// SHOPS
// ---------------------------------------------------------------------------

// @route   GET /api/admin/shops
// @desc    List shops with pagination, search and status filter
// @access  Private (Admin)
router.get('/shops', protect, requireRole('admin'), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const offset = (page - 1) * limit;
    const { search, status } = req.query;

    const conditions = [];
    const values = [];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(s.name ILIKE $${values.length} OR s.slug ILIKE $${values.length} OR u.name ILIKE $${values.length} OR u.email ILIKE $${values.length})`);
    }
    if (status && status !== 'Tous' && VALID_SHOP_STATUSES.includes(status)) {
      values.push(status);
      conditions.push(`s.status = $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM shops s LEFT JOIN users u ON s.owner_id = u.id ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const shopsResult = await db.query(
      `SELECT
         s.id,
         s.name,
         s.slug,
         s.status,
         s.owner_id,
         s.created_at,
         u.name AS owner_name,
         u.email AS owner_email,
         COUNT(p.id) AS products_count
       FROM shops s
       LEFT JOIN users u ON s.owner_id = u.id
       LEFT JOIN products p ON p.shop_id = s.id
       ${whereClause}
       GROUP BY s.id, u.name, u.email
       ORDER BY s.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    const shops = shopsResult.rows.map(s => ({
      _id: s.id,
      id: s.id,
      name: s.name,
      slug: s.slug,
      status: s.status || 'active',
      productsCount: parseInt(s.products_count, 10) || 0,
      ownerId: { name: s.owner_name, email: s.owner_email },
      createdAt: s.created_at,
    }));

    return createSuccessResponse(res, {
      data: { shops, total },
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/admin/shops/:id/status
// @desc    Update a shop's status
// @access  Private (Admin)
router.put('/shops/:id/status', protect, requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!VALID_SHOP_STATUSES.includes(status)) {
      return createErrorResponse(res, { statusCode: 400, message: 'Invalid status' });
    }

    const result = await db.query(
      `UPDATE shops SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, slug, status, created_at`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'Shop not found' });
    }

    const s = result.rows[0];
    return createSuccessResponse(res, {
      message: 'Shop updated',
      data: { _id: s.id, id: s.id, name: s.name, slug: s.slug, status: s.status, createdAt: s.created_at },
    });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/admin/shops/:id
// @desc    Delete a shop
// @access  Private (Admin)
router.delete('/shops/:id', protect, requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM shops WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'Shop not found' });
    }
    return createSuccessResponse(res, { message: 'Shop deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
