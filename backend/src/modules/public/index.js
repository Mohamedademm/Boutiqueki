const express = require('express');
const { db, createSuccessResponse, createErrorResponse } = require('../../utils');

const router = express.Router();

// Default theme used when a shop has no theme stored yet.
const DEFAULT_THEME = {
  template: 'Minimal',
  primaryColor: '#1E3A5F',
  secondaryColor: '#2563EB',
  font: 'Inter',
  layout: 'grid-3',
};

// Map a raw product row to the shape the public storefront expects.
// DECIMAL columns come back from pg as strings, so coerce prices to numbers
// (PublicShopPage calls product.price.toFixed()).
const mapProduct = (p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  price: p.price != null ? Number(p.price) : 0,
  comparePrice: p.compare_price != null ? Number(p.compare_price) : 0,
  category: p.category || null,
  images: Array.isArray(p.images) ? p.images : [],
  status: p.status,
});

// GET /api/public/shops/:slug — public storefront payload { shop, products }
router.get('/shops/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const shopResult = await db.query(
      `SELECT id, name, slug, description, logo_url, banner_url, theme, status, created_at
       FROM shops
       WHERE slug = $1 AND status = 'active'`,
      [slug]
    );

    if (shopResult.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'Shop not found' });
    }

    const shopRow = shopResult.rows[0];

    const productsResult = await db.query(
      `SELECT p.id, p.name, p.description, p.price, p.compare_price, p.status, p.images,
              c.name AS category
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.shop_id = $1 AND p.status = 'active'
       ORDER BY p.created_at DESC`,
      [shopRow.id]
    );

    const shop = {
      id: shopRow.id,
      name: shopRow.name,
      slug: shopRow.slug,
      description: shopRow.description,
      logo_url: shopRow.logo_url,
      banner_url: shopRow.banner_url,
      theme: { ...DEFAULT_THEME, ...(shopRow.theme || {}) },
      createdAt: shopRow.created_at,
    };

    return createSuccessResponse(res, {
      data: { shop, products: productsResult.rows.map(mapProduct) },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
