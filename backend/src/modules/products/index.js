const express = require('express');
const { db, createSuccessResponse, createErrorResponse } = require('../../utils');
const authMiddleware = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { auditLog } = require('../../middleware/audit');
const { ProductSchema } = require('./schema');

const router = express.Router({ mergeParams: true });

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

// GET /api/shops/:shopId/products (Public)
router.get('/:shopId/products', async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const { status, category_id, search, page = 1, limit = 10 } = req.query;
    
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    let baseQuery = `
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.shop_id = $1
    `;
    const values = [shopId];
    let queryIndex = 2;

    if (status) {
      baseQuery += ` AND p.status = $${queryIndex++}`;
      values.push(status);
    }
    if (category_id) {
      baseQuery += ` AND p.category_id = $${queryIndex++}`;
      values.push(category_id);
    }
    if (search) {
      baseQuery += ` AND p.name ILIKE $${queryIndex++}`;
      values.push(`%${search}%`);
    }

    // Get total count
    const countResult = await db.query(`SELECT COUNT(*) as total ${baseQuery}`, values);
    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / limitNum);

    // Get paginated data
    const dataQuery = `
      SELECT p.*, 
             c.name as category_name,
             (SELECT json_agg(v.*) FROM product_variants v WHERE v.product_id = p.id) as variants
      ${baseQuery}
      ORDER BY p.created_at DESC
      LIMIT $${queryIndex++} OFFSET $${queryIndex++}
    `;
    
    values.push(limitNum, offset);
    const result = await db.query(dataQuery, values);

    // Parse JSON arrays correctly if needed
    const products = result.rows.map(p => ({
      ...p,
      variants: p.variants || [],
    }));

    return createSuccessResponse(res, { 
      data: products,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/shops/:shopId/products/:id (Public)
router.get('/:shopId/products/:id', async (req, res, next) => {
  try {
    const { shopId, id } = req.params;

    const result = await db.query(`
      SELECT p.*, 
             (SELECT json_agg(v.*) FROM product_variants v WHERE v.product_id = p.id) as variants
      FROM products p
      WHERE p.id = $1 AND p.shop_id = $2
    `, [id, shopId]);

    if (result.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'Product not found' });
    }

    const product = result.rows[0];
    product.variants = product.variants || [];

    return createSuccessResponse(res, { data: product });
  } catch (err) {
    next(err);
  }
});

router.use('/:shopId/products', authMiddleware);

// POST /api/shops/:shopId/products
router.post('/:shopId/products', requireShopOwner, validate(ProductSchema), auditLog('PRODUCT_CREATE'), async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { shopId } = req.params;
    const { name, description, price, compare_price, sku, status, category_id, images, variants } = req.body;

    const prodResult = await client.query(
      `INSERT INTO products (shop_id, category_id, name, description, price, compare_price, sku, status, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [shopId, category_id || null, name, description, price, compare_price || null, sku, status, JSON.stringify(images)]
    );
    const product = prodResult.rows[0];

    const insertedVariants = [];
    if (variants && variants.length > 0) {
      for (const v of variants) {
        const vResult = await client.query(
          `INSERT INTO product_variants (product_id, name, sku, price, stock_qty, alert_threshold)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [product.id, v.name, v.sku, v.price || null, v.stock_qty, v.alert_threshold]
        );
        insertedVariants.push(vResult.rows[0]);
      }
    }

    await client.query('COMMIT');
    
    product.variants = insertedVariants;
    
    return createSuccessResponse(res, { statusCode: 201, message: 'Product created', data: product });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// PUT /api/shops/:shopId/products/:id
router.put('/:shopId/products/:id', requireShopOwner, validate(ProductSchema), async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { shopId, id } = req.params;
    const { name, description, price, compare_price, sku, status, category_id, images, variants } = req.body;

    const prodCheck = await client.query('SELECT id FROM products WHERE id = $1 AND shop_id = $2', [id, shopId]);
    if (prodCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return createErrorResponse(res, { statusCode: 404, message: 'Product not found' });
    }

    const prodResult = await client.query(
      `UPDATE products 
       SET category_id = $1, name = $2, description = $3, price = $4, compare_price = $5, 
           sku = $6, status = $7, images = $8, updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [category_id || null, name, description, price, compare_price || null, sku, status, JSON.stringify(images), id]
    );
    const product = prodResult.rows[0];

    // Delete variants that are not in the update payload
    const variantIds = variants.filter(v => v.id).map(v => v.id);
    if (variantIds.length > 0) {
      await client.query(`DELETE FROM product_variants WHERE product_id = $1 AND id != ALL($2::uuid[])`, [id, variantIds]);
    } else {
      await client.query(`DELETE FROM product_variants WHERE product_id = $1`, [id]);
    }

    // Upsert variants
    const insertedVariants = [];
    for (const v of variants) {
      if (v.id) {
        const vResult = await client.query(
          `UPDATE product_variants 
           SET name = $1, sku = $2, price = $3, stock_qty = $4, alert_threshold = $5
           WHERE id = $6 RETURNING *`,
          [v.name, v.sku, v.price || null, v.stock_qty, v.alert_threshold, v.id]
        );
        insertedVariants.push(vResult.rows[0]);
      } else {
        const vResult = await client.query(
          `INSERT INTO product_variants (product_id, name, sku, price, stock_qty, alert_threshold)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [id, v.name, v.sku, v.price || null, v.stock_qty, v.alert_threshold]
        );
        insertedVariants.push(vResult.rows[0]);
      }
    }

    await client.query('COMMIT');
    
    product.variants = insertedVariants;

    return createSuccessResponse(res, { message: 'Product updated', data: product });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// DELETE /api/shops/:shopId/products/:id
router.delete('/:shopId/products/:id', requireShopOwner, async (req, res, next) => {
  try {
    const { shopId, id } = req.params;
    
    const result = await db.query(
      "UPDATE products SET status = 'archived', updated_at = NOW() WHERE id = $1 AND shop_id = $2 RETURNING id", 
      [id, shopId]
    );

    if (result.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'Product not found' });
    }

    return createSuccessResponse(res, { message: 'Product archived successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
