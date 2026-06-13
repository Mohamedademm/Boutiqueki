const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/error');

const app = express();

// --- Middlewares Sécurité ---
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests' },
}));

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
app.use('/api/admin',      require('./modules/admin'));       // /api/admin/*
app.use('/api/public',     require('./modules/public'));      // /api/public/* (storefront)

// --- Health Check ---
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// --- 404 Handler ---
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// --- Global Error Handler ---
app.use(errorHandler);

module.exports = app;
