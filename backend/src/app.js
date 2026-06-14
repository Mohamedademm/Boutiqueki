const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const errorHandler = require('./middleware/error');

const app = express();

// Behind a hosting proxy (Railway/Render/Vercel) — needed for secure cookies & rate-limit IPs
app.set('trust proxy', 1);

// --- Middlewares Sécurité ---
app.use(helmet());
// Allow the configured client origin(s). CLIENT_URL may be a comma-separated list.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    // allow same-origin / curl (no origin) and any configured origin
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests' },
}));

// --- Stripe webhook (RAW body, must be before express.json) ---
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), require('./modules/payments/webhook'));

// --- Middlewares Parsing ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Routes ---
app.use('/api/auth',       require('./modules/auth'));
app.use('/api/users',      require('./modules/users'));
app.use('/api/shops',      require('./modules/shops'));
app.use('/api/shops',      require('./modules/categories'));  // /api/shops/:shopId/categories
app.use('/api/shops',      require('./modules/products'));    // /api/shops/:shopId/products
app.use('/api/shops',      require('./modules/stock'));       // /api/shops/:shopId/stock
app.use('/api/shops',      require('./modules/orders'));      // /api/shops/:shopId/orders
app.use('/api/shops',      require('./modules/coupons'));     // /api/shops/:shopId/coupons
app.use('/api/admin',      require('./modules/admin'));       // /api/admin/*
app.use('/api/public',     require('./modules/public'));      // /api/public/* (storefront)
app.use('/api/checkout',   require('./modules/checkout'));    // /api/checkout (order creation)
app.use('/api/uploads',    require('./modules/uploads'));     // /api/uploads (image upload)
app.use('/api/payments',   require('./modules/payments'));    // /api/payments (Stripe, config-gated)

// --- Static: user-uploaded images ---
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- Health Check ---
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// --- SEO: sitemap of active shops + products ---
app.get('/sitemap.xml', async (req, res, next) => {
  try {
    const { db } = require('./utils');
    const base = process.env.CLIENT_URL || 'http://localhost:5173';
    const shops = await db.query("SELECT slug FROM shops WHERE status = 'active'");
    const products = await db.query(
      "SELECT p.id, s.slug FROM products p JOIN shops s ON s.id = p.shop_id WHERE p.status = 'active' AND s.status = 'active'"
    );
    const urls = [
      `${base}/`,
      ...shops.rows.map(s => `${base}/s/${s.slug}`),
      ...products.rows.map(p => `${base}/s/${p.slug}/p/${p.id}`),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map(u => `  <url><loc>${u}</loc></url>`)
      .join('\n')}\n</urlset>`;
    res.set('Content-Type', 'application/xml').send(xml);
  } catch (err) {
    next(err);
  }
});

// --- 404 Handler ---
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// --- Global Error Handler ---
app.use(errorHandler);

module.exports = app;
