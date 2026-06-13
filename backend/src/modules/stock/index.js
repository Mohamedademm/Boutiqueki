const express = require('express');
const { db, createSuccessResponse, createErrorResponse } = require('../../utils');
const authMiddleware = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { auditLog } = require('../../middleware/audit');
const { StockMovementSchema } = require('./schema');

const router = express.Router({ mergeParams: true });

router.use('/:shopId/stock', authMiddleware);

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

// Obtenir la vue stock complete de la boutique
router.get('/:shopId/stock', requireShopOwner, async (req, res, next) => {
  try {
    const { shopId } = req.params;

    const result = await db.query(`
      SELECT 
        v.id as variant_id,
        v.name as variant_name,
        v.sku as variant_sku,
        v.stock_qty,
        v.alert_threshold,
        p.id as product_id,
        p.name as product_name,
        p.status as product_status
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      WHERE p.shop_id = $1
      ORDER BY p.name ASC, v.name ASC
    `, [shopId]);

    return createSuccessResponse(res, { data: result.rows });
  } catch (err) {
    next(err);
  }
});

// Produits sous le seuil d'alerte
router.get('/:shopId/stock/alerts', requireShopOwner, async (req, res, next) => {
  try {
    const { shopId } = req.params;

    const result = await db.query(`
      SELECT 
        v.id as variant_id,
        v.name as variant_name,
        v.stock_qty,
        v.alert_threshold,
        p.id as product_id,
        p.name as product_name
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      WHERE p.shop_id = $1 AND v.stock_qty <= v.alert_threshold AND p.status = 'active'
      ORDER BY v.stock_qty ASC
    `, [shopId]);

    return createSuccessResponse(res, { data: result.rows });
  } catch (err) {
    next(err);
  }
});

// Exporter le stock en CSV
router.get('/:shopId/stock/export', requireShopOwner, async (req, res, next) => {
  try {
    const { shopId } = req.params;

    const result = await db.query(`
      SELECT 
        p.name as product_name,
        v.name as variant_name,
        v.sku as variant_sku,
        v.stock_qty,
        v.alert_threshold,
        p.status as product_status
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      WHERE p.shop_id = $1
      ORDER BY p.name ASC, v.name ASC
    `, [shopId]);

    // Construct CSV
    const rows = result.rows;
    let csv = 'Produit,Variante,SKU,Stock,Seuil Alerte,Statut\n';
    
    for (const row of rows) {
      const escapeCsv = (str) => '"' + String(str || '').replace(/"/g, '""') + '"';
      csv += [
        escapeCsv(row.product_name),
        escapeCsv(row.variant_name),
        escapeCsv(row.variant_sku),
        row.stock_qty,
        row.alert_threshold,
        escapeCsv(row.product_status)
      ].join(',') + '\n';
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="export_stock.csv"');
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
});

// Mettre à jour le seuil d'alerte d'une variante
router.patch('/:shopId/stock/variants/:variantId/alert', requireShopOwner, async (req, res, next) => {
  try {
    const { shopId, variantId } = req.params;
    const { alert_threshold } = req.body;

    if (alert_threshold === undefined || isNaN(alert_threshold)) {
      return createErrorResponse(res, { statusCode: 400, message: 'Invalid alert_threshold' });
    }

    // Verify ownership
    const variantCheck = await db.query(`
      SELECT v.id FROM product_variants v
      JOIN products p ON v.product_id = p.id
      WHERE v.id = $1 AND p.shop_id = $2
    `, [variantId, shopId]);

    if (variantCheck.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'Variant not found in your shop' });
    }

    const result = await db.query(
      'UPDATE product_variants SET alert_threshold = $1 WHERE id = $2 RETURNING *',
      [parseInt(alert_threshold, 10), variantId]
    );

    return createSuccessResponse(res, { message: 'Alert threshold updated', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// Enregistrer un mouvement de stock
router.post('/:shopId/stock/movement', requireShopOwner, validate(StockMovementSchema), auditLog('STOCK_MOVEMENT'), async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    
    const { shopId } = req.params;
    const { variant_id, type, quantity, reason } = req.body;

    // Verifier que le variant appartient a la boutique
    const variantCheck = await client.query(`
      SELECT v.id, v.product_id, v.stock_qty 
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      WHERE v.id = $1 AND p.shop_id = $2
    `, [variant_id, shopId]);

    if (variantCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return createErrorResponse(res, { statusCode: 404, message: 'Variant not found in your shop' });
    }

    const { product_id, stock_qty: currentStock } = variantCheck.rows[0];

    // Calculer le delta
    let delta = 0;
    if (type === 'in') {
      delta = quantity;
    } else if (type === 'out') {
      delta = -quantity;
    } else if (type === 'adjustment') {
      delta = quantity - currentStock;
    }

    if (delta === 0) {
      await client.query('ROLLBACK');
      return createSuccessResponse(res, { message: 'No stock change needed' });
    }

    // Mettre à jour le stock
    // La contrainte CHECK (stock_qty >= 0) empechera le stock d'etre negatif au niveau BD
    const updateResult = await client.query(
      `UPDATE product_variants SET stock_qty = stock_qty + $1 WHERE id = $2 RETURNING stock_qty`,
      [delta, variant_id]
    );

    // Enregistrer l'historique
    await client.query(
      `INSERT INTO stock_movements (product_id, variant_id, type, quantity, reason, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [product_id, variant_id, type, type === 'adjustment' ? Math.abs(delta) : quantity, reason, req.user.id]
    );

    await client.query('COMMIT');

    return createSuccessResponse(res, { 
      message: 'Stock updated successfully',
      data: { new_stock_qty: updateResult.rows[0].stock_qty } 
    });

  } catch (err) {
    await client.query('ROLLBACK');
    // Code 23514 = Check constraint violation PostgreSQL
    if (err.code === '23514') {
      return next({ statusCode: 400, message: 'Insufficient stock' });
    }
    next(err);
  } finally {
    client.release();
  }
});

// Historique des mouvements par produit
router.get('/:shopId/stock/:productId/history', requireShopOwner, async (req, res, next) => {
  try {
    const { shopId, productId } = req.params;

    // Verifier appartenance
    const prodCheck = await db.query('SELECT id FROM products WHERE id = $1 AND shop_id = $2', [productId, shopId]);
    if (prodCheck.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'Product not found' });
    }

    const result = await db.query(`
      SELECT 
        m.id, m.type, m.quantity, m.reason, m.created_at,
        v.name as variant_name,
        u.name as created_by_name
      FROM stock_movements m
      LEFT JOIN product_variants v ON m.variant_id = v.id
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.product_id = $1
      ORDER BY m.created_at DESC
      LIMIT 100
    `, [productId]);

    return createSuccessResponse(res, { data: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
