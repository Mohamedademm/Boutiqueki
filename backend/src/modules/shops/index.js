const express = require('express');
const { db, createSuccessResponse, createErrorResponse } = require('../../utils');
const authMiddleware = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');
const validate = require('../../middleware/validate');
const { CreateShopSchema, UpdateShopSchema } = require('./schema');

const router = express.Router();

// Get public shop details by slug
router.get('/by-slug/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const result = await db.query(
      'SELECT id, name, slug, description, logo_url, banner_url, status, created_at FROM shops WHERE slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'Shop not found' });
    }

    return createSuccessResponse(res, { data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// Protect all other routes
router.use(authMiddleware);

// Create shop (only owners can create)
router.post('/', requireRole('owner'), validate(CreateShopSchema), async (req, res, next) => {
  try {
    const { name, slug, description, logo_url, banner_url } = req.body;

    // Check if slug is taken
    const existingSlug = await db.query('SELECT id FROM shops WHERE slug = $1', [slug]);
    if (existingSlug.rows.length > 0) {
      return createErrorResponse(res, { statusCode: 400, message: 'Shop slug is already taken' });
    }

    // Check if owner already has a shop (MVP: 1 shop per owner)
    const existingShop = await db.query('SELECT id FROM shops WHERE owner_id = $1', [req.user.id]);
    if (existingShop.rows.length > 0) {
      return createErrorResponse(res, { statusCode: 400, message: 'You already have a shop' });
    }

    const result = await db.query(
      `INSERT INTO shops (owner_id, name, slug, description, logo_url, banner_url) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [req.user.id, name, slug, description, logo_url, banner_url]
    );

    return createSuccessResponse(res, {
      statusCode: 201,
      message: 'Shop created successfully',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// Get my shop
router.get('/me', requireRole('owner'), async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM shops WHERE owner_id = $1', [req.user.id]);
    
    if (result.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'You do not have a shop yet' });
    }

    return createSuccessResponse(res, { data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// Get shop by id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM shops WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'Shop not found' });
    }

    return createSuccessResponse(res, { data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// Update shop (only the owner)
router.put('/:id', requireRole('owner'), validate(UpdateShopSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      return createSuccessResponse(res, { message: 'No changes provided' });
    }

    // Ownership check
    const shopResult = await db.query('SELECT owner_id FROM shops WHERE id = $1', [id]);
    if (shopResult.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'Shop not found' });
    }

    if (shopResult.rows[0].owner_id !== req.user.id) {
      return createErrorResponse(res, { statusCode: 403, message: 'Forbidden: You do not own this shop' });
    }

    // If slug is being updated, check if it's available
    if (updates.slug) {
      const existingSlug = await db.query('SELECT id FROM shops WHERE slug = $1 AND id != $2', [updates.slug, id]);
      if (existingSlug.rows.length > 0) {
        return createErrorResponse(res, { statusCode: 400, message: 'Shop slug is already taken' });
      }
    }

    const setClauses = [];
    const values = [];
    let queryIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${queryIndex++}`);
      values.push(value);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE shops SET ${setClauses.join(', ')} WHERE id = $${queryIndex} RETURNING *`;
    const result = await db.query(query, values);

    return createSuccessResponse(res, {
      message: 'Shop updated successfully',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
