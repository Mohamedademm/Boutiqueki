const express = require('express');
const bcrypt = require('bcrypt');
const { db, createSuccessResponse, createErrorResponse } = require('../../utils');
const authMiddleware = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { UpdateUserSchema, UpdatePasswordSchema } = require('./schema');

const router = express.Router();

router.use(authMiddleware);

router.get('/me', async (req, res, next) => {
  try {
    const result = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'User not found' });
    }
    return createSuccessResponse(res, { data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/me', validate(UpdateUserSchema), async (req, res, next) => {
  try {
    const { name, email } = req.body;
    
    // Si email change, verifier s'il est pas deja pris
    if (email) {
      const existing = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.user.id]);
      if (existing.rows.length > 0) {
        return createErrorResponse(res, { statusCode: 400, message: 'Email already in use' });
      }
    }

    const updates = [];
    const values = [];
    let queryIndex = 1;

    if (name) {
      updates.push(`name = $${queryIndex++}`);
      values.push(name);
    }
    if (email) {
      updates.push(`email = $${queryIndex++}`);
      values.push(email);
    }

    if (updates.length === 0) {
      return createSuccessResponse(res, { message: 'No changes provided' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.user.id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${queryIndex} RETURNING id, name, email, role`;
    const result = await db.query(query, values);

    return createSuccessResponse(res, { 
      message: 'Profile updated successfully',
      data: result.rows[0] 
    });
  } catch (err) {
    next(err);
  }
});

router.put('/me/password', validate(UpdatePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return createErrorResponse(res, { statusCode: 400, message: 'Incorrect current password' });
    }

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id]);

    return createSuccessResponse(res, { message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
