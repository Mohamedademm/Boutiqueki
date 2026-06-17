const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { createSuccessResponse, createErrorResponse } = require('../../utils');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();

// Local storage (dev-first). Files land in backend/uploads and are served statically.
// On serverless (read-only FS, e.g. Vercel) fall back to the temp dir so import never crashes.
// For persistent prod uploads, swap to Cloudinary/S3 — the API contract stays { url }.
const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, '..', '..', '..', 'uploads');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch { /* read-only FS — ignore */ }

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    // SVG intentionally excluded: it can embed scripts (stored XSS when served from /uploads).
    if (/^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Type de fichier non supporté (images uniquement)'));
  },
});

// POST /api/uploads — single image (field name "file"). Auth required (merchants only).
router.post('/', authMiddleware, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return createErrorResponse(res, { statusCode: 400, message: err.message || 'Upload échoué' });
    }
    if (!req.file) {
      return createErrorResponse(res, { statusCode: 400, message: 'Aucun fichier reçu' });
    }
    // Relative URL — portable across environments (served via the same origin / Vite proxy in dev).
    return createSuccessResponse(res, {
      statusCode: 201,
      data: { url: `/uploads/${req.file.filename}` },
    });
  });
});

module.exports = router;
