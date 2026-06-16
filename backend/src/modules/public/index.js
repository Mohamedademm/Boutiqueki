const express = require('express');
const { db, createSuccessResponse, createErrorResponse } = require('../../utils');
const { validateCoupon } = require('../coupons/validate');
const { getSettings } = require('../settings/service');

const router = express.Router();

// GET /api/public/settings — branding, content & flags applied across the whole site.
router.get('/settings', async (req, res, next) => {
  try {
    const s = await getSettings();
    return createSuccessResponse(res, {
      data: { branding: s.branding, content: s.content, flags: s.flags, commerce: s.commerce },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/public/coupons/validate { shopId, code, subtotal } — preview a coupon at checkout.
router.post('/coupons/validate', async (req, res, next) => {
  try {
    const { shopId, code, subtotal } = req.body;
    if (!shopId) return createErrorResponse(res, { statusCode: 400, message: 'shopId requis' });
    const result = await validateCoupon(db, shopId, code, Number(subtotal) || 0);
    if (!result.ok) return createErrorResponse(res, { statusCode: 400, message: result.message });
    return createSuccessResponse(res, { data: { discount: result.discount, coupon: result.coupon } });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/shops — browse all active shops (paginated, searchable)
router.get('/shops', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const sort = req.query.sort || 'newest';

    const searchFilter = search ? `AND s.name ILIKE '%' || $1 || '%'` : '';
    const params = search ? [search] : [];

    let orderBy = 's.created_at DESC';
    if (sort === 'name') orderBy = 's.name ASC';
    if (sort === 'products') orderBy = 'product_count DESC';

    const countQ = await db.query(
      `SELECT COUNT(*) FROM shops s WHERE s.status = 'active' ${searchFilter}`,
      params
    );
    const total = parseInt(countQ.rows[0].count);

    const dataQ = await db.query(
      `SELECT s.id, s.name, s.slug, s.description, s.logo_url, s.banner_url, s.theme, s.created_at,
              (SELECT COUNT(*) FROM products WHERE shop_id = s.id AND status = 'active') AS product_count
       FROM shops s
       WHERE s.status = 'active' ${searchFilter}
       ORDER BY ${orderBy}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const shops = dataQ.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      logoUrl: row.logo_url,
      bannerUrl: row.banner_url,
      theme: row.theme || {},
      productCount: parseInt(row.product_count),
      createdAt: row.created_at,
    }));

    return createSuccessResponse(res, {
      data: shops,
      meta: { total, page, limit },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/products — browse all products across all shops (paginated, filterable)
router.get('/products', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const minPrice = parseFloat(req.query.minPrice) || null;
    const maxPrice = parseFloat(req.query.maxPrice) || null;
    const sort = req.query.sort || 'newest';

    const conditions = ["p.status = 'active'", "s.status = 'active'"];
    const params = [];

    if (search) {
      params.push(search);
      conditions.push(`p.name ILIKE '%' || $${params.length} || '%'`);
    }
    if (category) {
      params.push(category);
      conditions.push(`c.name = $${params.length}`);
    }
    if (minPrice !== null) {
      params.push(minPrice);
      conditions.push(`p.price >= $${params.length}`);
    }
    if (maxPrice !== null) {
      params.push(maxPrice);
      conditions.push(`p.price <= $${params.length}`);
    }

    const where = conditions.join(' AND ');

    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'p.price ASC';
    if (sort === 'price_desc') orderBy = 'p.price DESC';
    if (sort === 'name') orderBy = 'p.name ASC';

    const countQ = await db.query(
      `SELECT COUNT(*) FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       JOIN shops s ON s.id = p.shop_id
       WHERE ${where}`,
      params
    );
    const total = parseInt(countQ.rows[0].count);

    const dataQ = await db.query(
      `SELECT p.id, p.name, p.description, p.price, p.compare_price, p.images, p.status,
              c.name AS category,
              s.id AS shop_id, s.name AS shop_name, s.slug AS shop_slug, s.logo_url AS shop_logo
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       JOIN shops s ON s.id = p.shop_id
       WHERE ${where}
       ORDER BY ${orderBy}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const products = dataQ.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price != null ? Number(row.price) : 0,
      comparePrice: row.compare_price != null ? Number(row.compare_price) : 0,
      images: Array.isArray(row.images) ? row.images : [],
      category: row.category || null,
      shopId: row.shop_id,
      shopName: row.shop_name,
      shopSlug: row.shop_slug,
      shopLogo: row.shop_logo,
    }));

    return createSuccessResponse(res, {
      data: products,
      meta: { total, page, limit },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/categories — distinct category names across all active shops
router.get('/categories', async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT DISTINCT c.name
       FROM categories c
       JOIN products p ON p.category_id = c.id AND p.status = 'active'
       JOIN shops s ON s.id = p.shop_id AND s.status = 'active'
       ORDER BY c.name`
    );
    return createSuccessResponse(res, { data: r.rows.map(row => row.name) });
  } catch (err) {
    next(err);
  }
});

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

// GET /api/public/products/:id — public product detail + its shop/theme
router.get('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const r = await db.query(
      `SELECT p.*, c.name AS category,
              (SELECT json_agg(v.*) FROM product_variants v WHERE v.product_id = p.id) AS variants
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1 AND p.status = 'active'`,
      [id]
    );
    if (r.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'Product not found' });
    }
    const row = r.rows[0];

    const shopRes = await db.query(
      `SELECT id, name, slug, description, logo_url, banner_url, theme FROM shops WHERE id = $1 AND status = 'active'`,
      [row.shop_id]
    );
    if (shopRes.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'Shop not found' });
    }
    const shopRow = shopRes.rows[0];

    const variants = (row.variants || []).map(v => ({
      id: v.id,
      name: v.name,
      price: v.price != null ? Number(v.price) : null,
      stock_qty: Number(v.stock_qty) || 0,
    }));
    const stock = variants.reduce((s, v) => s + v.stock_qty, 0);

    const product = {
      id: row.id,
      name: row.name,
      description: row.description,
      price: Number(row.price),
      comparePrice: row.compare_price != null ? Number(row.compare_price) : 0,
      category: row.category || null,
      images: Array.isArray(row.images) ? row.images : [],
      variants,
      stock,
      shopId: row.shop_id,
    };
    const shop = {
      id: shopRow.id,
      name: shopRow.name,
      slug: shopRow.slug,
      theme: { ...DEFAULT_THEME, ...(shopRow.theme || {}) },
    };

    return createSuccessResponse(res, { data: { product, shop } });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/products/:id/reviews
router.get('/products/:id/reviews', async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT id, name, rating, comment, created_at AS "createdAt"
       FROM reviews WHERE product_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    return createSuccessResponse(res, { data: r.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/public/products/:id/reviews
router.post('/products/:id/reviews', async (req, res, next) => {
  try {
    const { name, rating, comment } = req.body;
    const r = Math.round(Number(rating));
    if (!name || !comment || !(r >= 1 && r <= 5)) {
      return createErrorResponse(res, { statusCode: 400, message: 'Avis invalide' });
    }
    // Ensure the product exists & is active
    const prod = await db.query("SELECT id FROM products WHERE id = $1 AND status = 'active'", [req.params.id]);
    if (prod.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'Product not found' });
    }
    const ins = await db.query(
      `INSERT INTO reviews (product_id, name, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, rating, comment, created_at AS "createdAt"`,
      [req.params.id, String(name).slice(0, 255), r, String(comment).slice(0, 2000)]
    );
    return createSuccessResponse(res, { statusCode: 201, data: ins.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
